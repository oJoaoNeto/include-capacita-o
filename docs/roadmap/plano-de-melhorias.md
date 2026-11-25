# Plano de Melhorias da Plataforma

* **Status:** Proposta — documentado, **ainda não implementado**
* **Data:** 2026-11-25
* **Escopo:** apenas a plataforma (código, arquitetura, segurança, experiência).
  **Não inclui criação de conteúdo** (trilhas, etapas, textos didáticos), que continua
  sob responsabilidade da EJ.

---

## Visão

A Capacitação inclu não é só a ferramenta do processo seletivo: é a plataforma de
**capacitação técnica contínua de todos os membros da EJ**. Trainees usam o modo
guiado; membros efetivos estudam e evoluem tecnicamente em modo livre. As 3 trilhas
atuais (Git, GitLab, Docker) são o núcleo de integração de um catálogo que vai crescer.

Hoje o produto e o código ainda são centrados no trainee (o PRD trata membros como
"público secundário"). As melhorias abaixo corrigem a base e preparam a plataforma
para esse papel mais amplo.

Não há prazo de turma associado; as fases podem incluir mudanças estruturais.

---

## Fase 1 — Segurança (prioridade máxima)

### 1.1 Autenticação com e-mail e senha
Detalhada na **[ADR 0004](../adr/0004-autenticacao-email-senha.md)**. Resumo:
- Remover GitLab OAuth e o login por e-mail sem senha.
- E-mail + senha com bcrypt, auto-cadastro como `PENDING`, pré-cadastro com senha temporária.
- Admin inicial definido por seed/variável de ambiente (fim do "primeiro login vira ADMIN").
- Remover botões de login rápido (`trainee@ej.com`, `membro@ej.com`, `admin@ej.com`).
- Revalidar papel/ativo no JWT para que mudanças de papel valham imediatamente.

### 1.2 Rotas de API sem autenticação (crítico)
O middleware (`apps/web/src/middleware.ts`) protege caminhos que começam com `/admin`,
`/learn`, `/tracks`, `/profile` e `/waiting-room`. Rotas em `/api/admin/...` **não**
começam com `/admin`, então passam direto, e os handlers não verificam sessão:

| Rota | Problema atual | Correção |
|---|---|---|
| `GET/POST /api/admin/users` | Qualquer pessoa lista usuários ou cria usuários com qualquer papel, inclusive `ADMIN`. O `GET` retorna o **`cliToken` de todos os usuários**, permitindo submeter etapas pela CLI em nome de qualquer um. | `requireRole(ADMIN)` e remover `cliToken` do `select` |
| `PATCH /api/admin/users/[id]/role` | Qualquer pessoa altera o papel de qualquer usuário (escalada para `ADMIN`). | `requireRole(ADMIN)` |
| `GET /api/admin/matrix` | Expõe progresso e dados de todos os usuários. | `requireRole(ADMIN)` |
| `GET /api/submissions/[userId]/[stageSlug]` | Qualquer pessoa lê submissões e logs brutos de qualquer usuário. | Sessão obrigatória; permitido só ao próprio usuário ou `ADMIN`. |
| `POST /api/cli/submissions` | Aceita qualquer `stageSlug`, inclusive etapas futuras de um `TRAINEE`. A tela da etapa tem botões "Simular Pass/Fail" que usam essa rota com o `cliToken` do usuário, permitindo concluir etapas sem fazê-las. | Bloquear etapas futuras do `TRAINEE` no backend; remover os botões de simulação em produção (ver 3.1.1). |
| `POST /api/stages/validate-gitlab` | Usa `userId` do corpo da requisição; sem ele, usa o primeiro `TRAINEE` do banco. Permite registrar submissões em nome de outros. | Usar **apenas** o usuário da sessão; remover o fallback de "usuário demo". |

Rotas que já verificam sessão: `/api/user/profile`, `/api/user/cli-token`.
Rotas da CLI (`/api/cli/*`) usam `cliToken` via Bearer — manter, mas também recusar
usuários `isActive = false` e `PENDING`.

**Correção estrutural:** criar `apps/web/src/lib/authz.ts` com `requireSession()` e
`requireRole()` e usá-lo em todo handler. Como defesa em profundidade, incluir
`/api/admin` na checagem de papel do middleware. Adicionar teste que percorre todas as
rotas e garante 401/403 sem sessão.

### 1.3 Endurecimento geral
- Validar corpo de todas as rotas com Zod (hoje vários handlers usam `body` sem validação).
- Rate limit nas rotas de login e da CLI.
- Revisar o que é retornado ao cliente: o `cliToken` só deve ser visível ao próprio
  usuário (hoje `GET /api/admin/users` o inclui na listagem).

---

## Fase 2 — Qualidade: testes e CI

Hoje o repositório **não tem testes**.

- **Testes unitários** (Vitest):
  - Lógica de progressão em `apps/web/src/lib/rbac.ts` (desbloqueio sequencial do
    `TRAINEE`, modo livre do `MEMBER`/`ADMIN`, contagem de tentativas).
  - Validadores da CLI (`apps/cli/src/validators/*`) usando repositórios Git temporários.
  - Cliente GitLab em modo mock.
- **Testes de integração** das rotas de API com banco PostgreSQL de teste
  (incluindo o teste de autorização da Fase 1.2).
- **CI leve no GitLab:** lint, typecheck e testes apenas em Merge Requests, para
  respeitar a cota gratuita (ADR 0002 trata de não usar CI nas *validações dos alunos*;
  CI do próprio projeto deve ser enxuto).

---

## Fase 3 — Plataforma para todos os membros

### 3.1 `ej-cap verify <etapa>`
Hoje `verify` não recebe argumento e valida a "etapa atual" calculada pelo servidor.
Para `MEMBER`, isso é a primeira etapa em andamento — e como membros começam com todas
as etapas `IN_PROGRESS`, na prática é sempre a primeira não concluída. Um membro que
queira estudar Docker não consegue validar a etapa 3.2 sem antes concluir as trilhas 1 e 2.

- Aceitar `ej-cap verify [etapa]` (mesmo formato do `setup <stage>`, que já aceita argumento).
- Sem argumento: mantém o comportamento atual.
- O backend continua impondo a regra: `TRAINEE` só pode submeter a etapa liberada;
  `MEMBER`/`ADMIN` podem submeter qualquer uma.
- A tela da etapa mostra o comando exato (`ej-cap verify docker-3-2`).
- Atualizar `docs/api/cli-protocol.md`.

### 3.1.1 Refazer etapas já concluídas

**Problema:** hoje um membro (ou qualquer usuário) não consegue refazer uma etapa que
já concluiu nas trilhas validadas pela CLI (Git e Docker).

**Causa (no código):**
- A tela da etapa sempre mostra `npx ej-cap verify`, sem argumento
  (`StageWorkspaceClient.tsx`, `cliVerifyCommand`).
- O `verify` pergunta ao servidor qual é a "etapa atual" (`getUserCurrentStage` em
  `rbac.ts`), e o servidor sempre devolve uma etapa **não concluída**. Uma etapa
  `COMPLETED` nunca é escolhida, então nunca pode ser validada de novo.
- A Trilha 2 (GitLab) não tem esse bloqueio, porque o botão "Verificar Missão na Nuvem"
  envia o `stageSlug` da tela.

**Problemas relacionados encontrados:**
- **Refazer distorce os números.** `processStageSubmission` soma +1 em `attempts` em
  toda submissão, inclusive depois da conclusão. As tentativas de revisão se misturam com
  as tentativas originais na matriz do admin e na liberação de dicas.
- **O backend não impõe o bloqueio do `TRAINEE`.** `/api/cli/submissions` aceita
  qualquer `stageSlug`; um trainee pode submeter etapas futuras (contraria RF05).
- **Botões "Simular Pass/Fail" em produção.** O rodapé da etapa tem "ferramentas de
  teste" que chamam `/api/cli/submissions` com o `cliToken` do próprio usuário. Qualquer
  pessoa conclui qualquer etapa sem fazê-la.

**Proposta:**

1. **CLI:** `ej-cap verify [etapa]` (item 3.1). Sem argumento, mantém o comportamento
   atual; com argumento, valida a etapa indicada, inclusive se já estiver concluída.
2. **Tela da etapa concluída:** botão **"Refazer etapa"**, que coloca a tela em
   *modo revisão*:
   - mostra os comandos com a etapa explícita: `npx ej-cap setup <etapa>` (quando a etapa
     tem cenário) e `npx ej-cap verify <etapa>`;
   - recomenda rodar o `setup` numa pasta nova, para não misturar com o exercício anterior;
   - todas as dicas ficam disponíveis (a pessoa já concluiu a etapa uma vez);
   - indicador "Concluída em DD/MM · revisando".
3. **Regras no backend** (`processStageSubmission`):
   - Refazer **nunca desfaz a conclusão**: a etapa continua `COMPLETED`, o `completedAt`
     original é mantido e um troféu já conquistado (ADR 0006) não é afetado.
   - Submissões de etapa já concluída são marcadas como revisão: novo campo
     `Submission.isReview Boolean @default(false)`, definido **pelo servidor** (não pelo
     cliente).
   - `attempts` passa a contar só as tentativas **até a primeira conclusão**. As revisões
     ficam em `UserProgress.reviewCount` e `lastReviewedAt`.
   - O alerta 🔴 de 3+ falhas e a liberação de dicas usam só as tentativas originais.
4. **Quem pode refazer:**
   - `MEMBER` e `ADMIN`: qualquer etapa, a qualquer momento.
   - `TRAINEE`: qualquer etapa **já concluída**. Etapas futuras continuam bloqueadas, e
     o backend passa a recusar submissões delas (403 com mensagem em português).
5. **Remover os botões "Simular Pass/Fail"** de produção (ou exibi-los só com
   `NODE_ENV=development`). Entra na Fase 1 (segurança).
6. **Painel admin:** no histórico de submissões (RF12), as revisões aparecem marcadas
   como "revisão". Na matriz, a célula de uma etapa concluída pode mostrar "↻ 2" para
   quem a refez.
7. **Protocolo da CLI:** documentar em `docs/api/cli-protocol.md` o argumento de etapa
   e o campo `isReview` na resposta, para a CLI exibir "✔ Revisão concluída" em vez de
   "Etapa concluída / próxima desbloqueada".

### 3.2 Linguagem e telas para todos os públicos
Cerca de 14 arquivos de interface e API usam "trainee" como sinônimo de usuário
(página inicial, login, navbar, perfil, painel). Revisar textos para falarem com
trainees e membros, e adaptar a home e o catálogo ao contexto de cada papel
(guiado vs. livre).

### 3.3 Vídeos nas etapas
Detalhado na **[ADR 0005](../adr/0005-videos-youtube-incorporados.md)**. Resumo:
- Vídeos hospedados no YouTube como "não listados" num canal institucional da EJ.
- Declarados no `stage.json` (campo opcional `videos`), sem mexer em código.
- Player com carregamento sob demanda (miniatura → iframe ao clicar) via `youtube-nocookie.com`.
- Vídeo complementa a teoria; não é critério de conclusão da etapa.

### 3.4 Conquistas (troféus)
Detalhado na **[ADR 0006](../adr/0006-sistema-de-conquistas.md)**. Resumo:
- Ao concluir todas as etapas de uma trilha, o usuário ganha um troféu permanente.
- Exibido em "Meu perfil" e num perfil interno (`/members/[id]`) visível aos membros
  aprovados, com opção de ocultar.
- Aparência opcional no `track.json` (campo `trophy`); toda trilha tem um troféu padrão.
- Sem pontos e sem ranking. Depende da Fase 1 (segurança) para ser confiável.

### 3.5 Painel de gestão
- Tratar o desenvolvimento dos membros como visão central, não aba secundária.
- Alertas de travamento (3+ falhas) continuam para trainees; para membros, mostrar
  atividade e evolução sem tom de cobrança.
- Ações novas exigidas pela ADR 0004: redefinir senha, desativar/reativar usuário,
  gerar senhas temporárias em lote.

---

## Fase 4 — Estrutura para o catálogo crescer

> Esta fase cria a **estrutura**. As trilhas em si continuam sendo escritas pela EJ.

- **Metadados de trilha:** área (Frontend, Backend, DevOps, Dados, Design...) e nível
  (fundamentos, intermediário, avançado) em `track.json`, refletidos no schema `Track`
  e em filtros no catálogo.
- **Trilhas obrigatórias por grupo:** o admin define quais trilhas são obrigatórias para
  um papel ou turma (ex.: "PS 2026.2" → núcleo Git/GitLab/Docker). O restante fica
  opcional. Hoje a obrigatoriedade é implícita (todas as etapas, em ordem global).
- **Progressão sequencial por trilha:** para trainees, desbloquear em ordem dentro de
  cada trilha obrigatória, em vez de uma única sequência global de 17 etapas.
- **Mapa de competências:** visão por membro (trilhas concluídas por área/nível) e visão
  agregada da EJ (quantas pessoas dominam cada área), útil para montar equipes de projeto.
- **Remover números fixos:** o PRD e o painel assumem "17 etapas"; a matriz deve se
  adaptar ao catálogo carregado.

---

## Pendências técnicas encontradas (para registro)

- **RF09 não implementado:** nada no código preenche `User.trainingRepoId`; a Trilha 2
  só funciona em modo mock (`ENABLE_GITLAB_MOCK=true`).
- **`gitlabUserId`** só é preenchido pelo OAuth; com a ADR 0004, precisa ser resolvido a
  partir do `gitlabUsername` (necessário para validar o assignee na etapa 2.3).
- A skill `architecture-decisions` prevê `docs/adr/README.md` e ADRs 0003/0004; o índice
  foi criado junto com este plano e a ADR 0003 (conteúdo em Markdown) ainda não foi escrita.

---

## Ordem sugerida

| Fase | Tema | Motivo |
|---|---|---|
| 1 | Segurança (ADR 0004 + rotas de API) | Há falhas que permitem virar `ADMIN` sem senha. |
| 2 | Testes e CI | Dá segurança para as mudanças estruturais seguintes. |
| 3 | Experiência do membro | Desbloqueia o uso pelos membros com mudanças pequenas. |
| 4 | Estrutura do catálogo | Mudança maior de modelo; feita com testes já no lugar. |
