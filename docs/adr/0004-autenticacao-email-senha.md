# ADR 0004: Autenticação Própria com E-mail e Senha (Remoção do GitLab OAuth)

* **Status:** Proposta
* **Data:** 2026-11-25
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RF01, RF02, RF03, RF05 (altera RF02)

> Esta ADR ocupa o slot "ADR-0004: Autenticação" previsto no catálogo da skill
> `architecture-decisions`, mas **substitui** a decisão ali descrita
> ("GitLab OAuth para Web + cliToken para CLI"). O `cliToken` da CLI é mantido.

## Contexto e Forças Motrizes

Hoje a aplicação web oferece dois provedores no NextAuth (`apps/web/src/lib/auth.ts`):

1. **GitLab OAuth** (`GitLabProvider`, escopos `read_user api`).
2. **"E-mail Institucional"** (`CredentialsProvider` com id `email-credentials`).

Problemas identificados:

- **O provedor de e-mail não tem senha nem verificação.** Qualquer pessoa que digite
  o e-mail de outro usuário entra como ele — inclusive como `ADMIN`.
- **O primeiro e-mail a logar vira `ADMIN`** (`totalUsers === 0 ? Role.ADMIN`), o que
  numa implantação nova é uma corrida aberta.
- **A tela de login tem botões de "login rápido"** (`trainee@ej.com`, `membro@ej.com`,
  `admin@ej.com`) em `apps/web/src/app/login/page.tsx`, que funcionam em produção.
- **O papel (role) é gravado no JWT só no login.** O callback `jwt` só consulta o banco
  quando `user` está presente; se um admin promover ou rebaixar alguém, a sessão antiga
  continua com o papel anterior por até 30 dias (`maxAge`). O middleware confia nesse
  valor.
- **O GitLab OAuth adiciona complexidade operacional** (criar Application no GitLab,
  gerenciar `GITLAB_CLIENT_ID/SECRET`, guardar `gitlabToken` com escopo `api` de cada
  usuário no banco) e acopla o acesso à plataforma a ter conta no GitLab — o que não faz
  sentido para membros que só vão estudar trilhas que não usam GitLab.

A plataforma não atende só trainees: é a ferramenta de capacitação técnica contínua de
todos os membros da EJ. O login precisa ser simples e independente do GitLab.

### Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Manter GitLab OAuth como único login | Obriga todo membro a ter conta GitLab; mantém o token `api` de cada usuário no banco. |
| Magic link / código por e-mail | Exige serviço de envio de e-mail (SMTP/Resend) e configuração extra. Descartado pela diretoria. |
| SSO institucional (Google Workspace etc.) | Depende da EJ ter um provedor de identidade unificado; fora do escopo atual. |
| **E-mail + senha próprios** | **Escolhida.** Simples, sem dependências externas, controlada pela própria plataforma. |

## Decisão Tomada

Optamos por **autenticação própria com e-mail e senha**, removendo totalmente o
GitLab OAuth, porque é a opção mais simples de operar e não depende de serviços externos.
O `cliToken` (UUID revogável) continua sendo a credencial da CLI.

### 1. Modelo de dados (Prisma)

Alterações em `User`:

```prisma
model User {
  // ...
  passwordHash        String?    // null = conta pré-cadastrada que ainda não definiu senha
  mustChangePassword  Boolean    @default(false)
  sessionVersion      Int        @default(0)   // incrementar invalida sessões ativas
  failedLoginCount    Int        @default(0)
  lockedUntil         DateTime?
  lastLoginAt         DateTime?

  // Removidos:
  // gitlabToken      String?    -> não há mais OAuth; token de usuário não é necessário
}
```

`gitlabUsername` e `gitlabUserId` **permanecem** (usados pela Trilha 2, ver seção 6).

### 2. Hash de senha

- Biblioteca: **`bcryptjs`** (JS puro, sem binário nativo — funciona na imagem Docker
  Alpine sem toolchain de compilação). Custo **12**.
- A senha nunca é logada, retornada por API, nem incluída no JWT.
- Política mínima: **8+ caracteres**; recusar senha igual ao e-mail. Sem regras de
  complexidade artificiais.
- Validação de entrada com **Zod** (já é dependência do projeto).

### 3. Fluxos de conta

| Fluxo | Comportamento |
|---|---|
| **Auto-cadastro** (`/register`) | Nome + e-mail + senha. Cria usuário com `role = PENDING` → cai na Sala de Espera até um admin aprovar (mantém o fluxo de aprovação atual). Pode ser desligado por `ALLOW_SELF_REGISTRATION=false`. Opcional: `ALLOWED_EMAIL_DOMAINS` restringe domínios aceitos. |
| **Pré-cadastro pelo admin** (RF01) | Admin informa e-mail, nome, papel e turma. O sistema gera uma **senha temporária** exibida uma única vez ao admin, com `mustChangePassword = true`. |
| **Primeiro login com senha temporária** | Usuário é redirecionado obrigatoriamente para `/change-password` antes de acessar qualquer outra rota. |
| **Troca de senha** (perfil) | Exige senha atual. Incrementa `sessionVersion` (derruba outras sessões). |
| **Esqueci a senha** | Sem serviço de e-mail: o usuário pede a um admin, que usa "Redefinir senha" no painel → nova senha temporária + `mustChangePassword = true` + `sessionVersion++`. |
| **Desativar usuário** | `isActive = false` + `sessionVersion++`. Login e CLI recusados. |

### 4. Primeiro administrador (bootstrap)

Remover a regra "primeiro usuário vira ADMIN". O admin inicial é criado de forma
explícita, por uma destas vias:

- `npm run db:seed` lendo `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` do ambiente
  (com `mustChangePassword = true`), **ou**
- um script `npm run admin:create -- --email ...` que pede a senha no terminal.

### 5. Sessão e autorização

- Manter NextAuth com estratégia **JWT** e apenas o `CredentialsProvider`.
- O JWT guarda `id` e `sessionVersion`. No callback `jwt`, **revalidar no banco**
  (`role`, `isActive`, `sessionVersion`, `mustChangePassword`) — com cache curto
  (ex.: a cada 5 min) para não consultar o banco a cada requisição. Se `sessionVersion`
  divergir ou `isActive = false`, a sessão é invalidada.
- Reduzir `maxAge` da sessão para **7 dias**.
- Criar um helper único de autorização para rotas de API, por exemplo:

  ```ts
  // apps/web/src/lib/authz.ts
  requireSession()           // 401 se não autenticado
  requireRole(Role.ADMIN)    // 403 se papel insuficiente
  ```

  e aplicá-lo **em todas** as rotas, inclusive as que hoje não verificam nada
  (ver `docs/roadmap/plano-de-melhorias.md`, seção 1).

- **Proteção contra força bruta:** após 5 falhas seguidas, `lockedUntil = now + 15 min`;
  zerar `failedLoginCount` no sucesso. Mensagem de erro genérica
  ("e-mail ou senha inválidos") para não revelar quais e-mails existem.
- **Remover os botões de login rápido** da tela de login. Contas de demonstração ficam
  apenas no seed de desenvolvimento, com senha conhecida documentada só para dev.

### 6. Impacto na Trilha 2 (GitLab)

Sem OAuth, a plataforma deixa de receber automaticamente `gitlabUserId`,
`gitlabUsername` e o token do usuário. As validações continuam usando **apenas o token
do bot** (`GITLAB_BOT_TOKEN`), que já é o que `gitlab-client.ts` faz hoje.

| Dado | Antes (OAuth) | Depois |
|---|---|---|
| `gitlabUsername` | Preenchido no login | Informado pelo usuário no Perfil (campo já existe) ou pelo admin no pré-cadastro. Obrigatório para iniciar a Trilha 2. |
| `gitlabUserId` | Preenchido no login | Resolvido pelo backend ao salvar o username: `GET /api/v4/users?username=<username>` com o token do bot. |
| `gitlabToken` | Guardado no banco | **Removido.** Nenhuma validação usa token do usuário. |

**Prova de posse da conta GitLab:** sem OAuth, qualquer um poderia informar o username de
outra pessoa. A etapa **2.1 (Passaporte SSH)** já executa `ssh -T git@gitlab.com` na CLI,
cuja resposta é `Welcome to GitLab, @<username>!`. A CLI passa a comparar esse username
com o cadastrado e só aprova se coincidirem. Isso vincula a conta GitLab ao usuário antes
das etapas 2.2–2.6.

### 7. O que é removido

- `GitLabProvider` e o callback de sincronização OAuth em `apps/web/src/lib/auth.ts`.
- Botão "Entrar com GitLab.com" e botões de login rápido em `apps/web/src/app/login/page.tsx`.
- Variáveis `GITLAB_CLIENT_ID` / `GITLAB_CLIENT_SECRET` em `.env.example`,
  `.env.production.example`, `apps/web/src/lib/env.ts` e `docker-compose.prod.yml`.
- Coluna `gitlabToken` (migration Prisma).
- Seção 3 ("Configuração do GitLab OAuth 2.0") de `docs/deployment/production-guide.md`.

`GITLAB_BOT_TOKEN`, `GITLAB_TRAINING_GROUP_ID` e `ENABLE_GITLAB_MOCK` **permanecem**.

## Consequências

### Positivas (+)
- Fecha a falha crítica de login sem senha e a corrida pelo primeiro admin.
- Acesso à plataforma independente de ter conta no GitLab — adequado para todos os membros.
- Menos configuração de produção (sem OAuth Application) e nenhum token de usuário com
  escopo `api` armazenado.
- Mudança de papel e desativação passam a valer imediatamente.

### Negativas ou Riscos (-)
- A plataforma passa a guardar senhas (hash) e é responsável por protegê-las.
- Sem e-mail, recuperação de senha depende de um admin.
- Usuários existentes que só entravam via GitLab não terão senha.
- A posse do username GitLab só é comprovada na etapa 2.1.

### Estratégias de Mitigação
- bcrypt custo 12, bloqueio por tentativas, mensagens genéricas, HTTPS obrigatório
  (já previsto nos security headers / guia de produção).
- Fluxo de "Redefinir senha" no painel admin, com senha temporária e troca obrigatória.
- **Migração de usuários existentes:** a migration deixa `passwordHash = null`. Usuários
  sem senha não conseguem logar até um admin gerar uma senha temporária (ação em lote
  "Gerar senhas temporárias" no painel, exibindo a lista uma única vez).
- Verificação SSH na etapa 2.1 como prova de posse do GitLab.

## Documentos a atualizar quando implementado
- `PRD_inclu_capacitacao.md` — RF02 e seção 3 (arquitetura) e schema da seção 7.
- `docs/deployment/production-guide.md` — remover seção de OAuth, adicionar bootstrap do admin.
- `.agents/skills/architecture-decisions/SKILL.md` — atualizar o item ADR-0004 do catálogo.
- `docs/api/cli-protocol.md` — documentar a checagem de username na etapa 2.1.
