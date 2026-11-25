# ADR 0007: Snapshots de Código (Diffs) em Todas as Submissões

* **Status:** Proposta
* **Data:** 2026-11-25
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RF06, RF08, RF11, RF12

## Contexto e Forças Motrizes

Hoje cada submissão guarda só o resultado (`passed`), a mensagem (`feedbackMsg`) e um
log textual curto (`rawLogs`) gerado pelos validadores. Mentores não conseguem ver
**o que o usuário realmente escreveu**: o `Dockerfile`, a resolução do conflito, os
commits feitos. O próprio usuário também não consegue rever o que mudou entre uma
tentativa e outra.

Objetivo: **ver o diff do código do usuário em toda submissão, tenha ele acertado ou
errado**, para:
- mentoria direcionada (ver o erro real, não só a mensagem do validador);
- o usuário acompanhar a própria evolução entre tentativas;
- colegas aprenderem com soluções aprovadas de outros (após concluírem a etapa);
- auditoria: hoje o `passed` é informado pelo cliente, e o snapshot ajuda a perceber
  submissões aprovadas sem trabalho real.

Restrições:
- **Custo zero** (ADR 0002): nada de executar código no servidor nem pipelines.
- **Privacidade:** a CLI roda na máquina do usuário; não pode enviar arquivos fora do
  exercício nem segredos. A etapa 1.4 cria justamente um `.env` que deve ser ignorado.
- Funciona nas três trilhas: Git e Docker (CLI local) e GitLab (validação na nuvem).

### Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Enviar só quando o usuário falha | O pedido é ver sempre; a solução aprovada é a mais útil para colegas e auditoria. |
| Enviar a pasta inteira (zip) | Risco alto de vazar segredos e arquivos pessoais; tamanho imprevisível. |
| Exigir que o usuário faça push de tudo para o GitLab | Trilhas 1 e 3 são locais por design (ADR 0001); adicionaria passos que não fazem parte do exercício. |
| **CLI coleta um snapshot restrito e filtrado a cada `verify`** | **Escolhida.** Transparente, limitado à pasta do exercício, com filtros de segredos e tamanho. |

## Decisão Tomada

Optamos por **a CLI anexar um snapshot de código a cada `ej-cap verify`** (e o backend
gerar o equivalente nas etapas do GitLab), guardado junto da submissão e exibido num
visualizador de diffs. Visível para **admins/mentores**, para **o próprio usuário** e,
**apenas a solução aprovada**, para **colegas que já concluíram a mesma etapa**.

### 1. O que é capturado em cada trilha

| Trilha | Conteúdo do snapshot |
|---|---|
| **1. Git Local** | Diff do estado atual em relação à **base do exercício**, histórico (`git log --oneline --graph --all`, limitado), branch atual e `git status`. Na etapa 1.7, inclui o arquivo com a resolução do conflito. |
| **2. GitLab** | Gerado **pelo backend** com o token do bot: diff da branch/MR do repositório de treino (`GET /projects/:id/repository/compare` ou `GET /projects/:id/merge_requests/:iid/changes`). Nada é coletado na máquina do usuário. Na etapa 2.1 (SSH), não há código: só o log. |
| **3. Docker** | Conteúdo dos arquivos do exercício (`Dockerfile`, `docker-compose.yml`, `index.html` etc.) e o diff em relação à base, além do resumo de `docker ps`/`inspect` que os validadores já geram. |

**Base do exercício:**
- Quando a etapa tem `ej-cap setup`, o setup grava a referência da base em
  `.ej-cap/stage.json` dentro da pasta do exercício (commit inicial para Git; hash dos
  arquivos criados para Docker).
- Sem setup (ex.: 1.2, 1.3), a base é "vazia": todo o conteúdo aparece como adicionado.
- O snapshot também guarda o **conteúdo final** dos arquivos alterados, o que permite
  comparar **duas tentativas entre si** no visualizador, sem reprocessar nada.

### 2. Regras de coleta (CLI)

Abordagem de **lista restrita**, nunca "a pasta toda":

- Só arquivos **dentro da pasta onde o `verify` roda** (nunca acima dela, nunca a home).
- Em repositórios Git: só arquivos rastreados e não rastreados **não ignorados**
  (respeita o `.gitignore`).
- **Sempre excluídos**, mesmo que rastreados: `.env*`, `*.pem`, `*.key`, `id_rsa*`,
  `id_ed25519*`, `.npmrc`, `.git/`, `node_modules/`, `.ej-cap/`, binários e imagens.
- **Remoção de segredos** no texto: padrões como `glpat-...`, `ghp_...`, `AKIA...`,
  blocos `-----BEGIN ... PRIVATE KEY-----` e valores de variáveis com nomes como
  `PASSWORD`, `SECRET`, `TOKEN` são substituídos por `«removido»`.
- **Limites:** 100 KB por arquivo, 256 KB por snapshot, 200 arquivos. Acima disso, o
  snapshot é truncado e marcado `truncated: true`.
- **Transparência:** a cada `verify`, a CLI imprime a lista de arquivos enviados
  (`📎 Snapshot: Dockerfile, index.html (2 arquivos, 3 KB)`). No primeiro uso, mostra um
  aviso explicando o que é enviado e quem vê.
- `ej-cap verify --no-snapshot` envia a submissão sem código; o histórico mostra
  "snapshot não enviado". Sugestão: permitido para todos, mas visível ao mentor.

### 3. Modelo de dados

```prisma
model SubmissionSnapshot {
  id           String     @id @default(uuid())
  submissionId String     @unique
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  source       String     // "cli" | "gitlab"
  baseRef      String?    // commit/hash da base do exercício
  diff         String     @db.Text   // diff unificado em relação à base
  files        Json       // [{ path, status: added|modified|deleted, additions, deletions, content? }]
  meta         Json?      // branch, log resumido, status, saída do docker ps etc.
  sizeBytes    Int
  truncated    Boolean    @default(false)
  createdAt    DateTime   @default(now())
}
```

Em `Submission`: `snapshot SubmissionSnapshot?`. Em `User`:
`shareSolutions Boolean @default(true)` (opção de não compartilhar soluções com colegas).

O PostgreSQL já comprime textos grandes automaticamente (TOAST); com o limite de
256 KB, 30 usuários × 17 etapas × algumas tentativas ficam na casa de dezenas de MB.

### 4. Protocolo CLI ↔ Backend

`POST /api/cli/submissions` ganha o campo opcional `snapshot`:

```json
{
  "stageSlug": "docker-3-2",
  "passed": false,
  "feedbackMsg": "...",
  "rawLogs": "...",
  "snapshot": {
    "baseRef": "a1b2c3d",
    "diff": "diff --git a/Dockerfile b/Dockerfile\n...",
    "files": [{ "path": "Dockerfile", "status": "added", "additions": 4, "deletions": 0, "content": "FROM nginx:alpine\n..." }],
    "meta": { "branch": "main" },
    "truncated": false
  }
}
```

O backend **revalida** limites e exclusões (não confia na CLI): recusa arquivos
proibidos, reaplica a remoção de segredos e corta acima do limite. Para a Trilha 2, o
snapshot é montado em `gitlab-client.ts` na mesma chamada de validação.

### 5. Quem vê o quê

| Quem | O que pode ver |
|---|---|
| **Admin/mentor** | Snapshot de **todas** as tentativas (certas e erradas) de qualquer usuário, no histórico de submissões do painel (RF12), ao lado do log de erro. |
| **O próprio usuário** | Snapshot de **todas as suas** tentativas, na aba de histórico da etapa, com opção "comparar com a tentativa anterior". |
| **Colegas** | Só a **solução aprovada** (a primeira submissão `passed` da etapa) de outros usuários, e **só depois de concluírem a mesma etapa**. Nunca tentativas erradas, nunca `rawLogs`. Usuários com `shareSolutions = false` não aparecem. `PENDING` não vê nada. |

Rotas (todas com o helper de autorização previsto na Fase 1):

| Rota | Acesso |
|---|---|
| `GET /api/submissions/[id]/snapshot` | Dono da submissão ou `ADMIN`. |
| `GET /api/stages/[slug]/solutions` | Usuário que já concluiu a etapa; retorna as soluções aprovadas compartilháveis dos colegas. |

A regra "só depois de concluir" é aplicada **no servidor**: um trainee não consegue ver
a solução de uma etapa que ainda não fez.

### 6. Visualizador

- Componente de diff com destaque de sintaxe, modos **unificado** e **lado a lado**, e
  lista de arquivos com contagem `+/-`. Biblioteca sugerida: `diff2html` (MIT) para
  renderizar o diff unificado; `diff` (jsdiff) para comparar duas tentativas a partir do
  `content` salvo.
- Seção "meta" (branch, histórico de commits, saída do Docker) abaixo do diff.
- Na tela da etapa: nova aba **"Histórico"** (tentativas do usuário) e, após concluir,
  **"Soluções da comunidade"**.
- No painel admin: o modal de histórico de submissões (RF12) ganha o diff de cada
  tentativa.

## Consequências

### Positivas (+)
- Mentoria baseada no código real, não só na mensagem do validador.
- Usuário vê a própria evolução entre tentativas.
- Aprendizado entre colegas com soluções aprovadas, sem permitir cola.
- Mais transparência sobre aprovações (útil enquanto o `passed` vem do cliente).
- Nenhum custo de infraestrutura adicional relevante.

### Negativas ou Riscos (-)
- **Privacidade:** a plataforma passa a receber arquivos da máquina do usuário.
- Filtros de segredos nunca são perfeitos; algo sensível pode escapar.
- O snapshot é gerado pelo cliente e pode ser forjado (mesma limitação do `passed`).
- Mais dados no banco e mais uma superfície a proteger com autorização correta.
- Ver soluções de colegas pode reduzir o esforço de quem refaz etapas.

### Estratégias de Mitigação
- Coleta restrita à pasta do exercício, exclusões fixas, remoção de segredos na CLI
  **e** no servidor, limites de tamanho, lista impressa a cada `verify`, aviso no primeiro uso.
- Exercícios da plataforma não envolvem dados reais; orientar na teoria a nunca colocar
  credenciais reais nos exercícios.
- **Depende da Fase 1 (segurança):** as rotas de submissão hoje não têm autorização
  (qualquer um lê submissões de qualquer usuário). Snapshots só devem ir para produção
  depois dessa correção.
- Soluções de colegas só após concluir a etapa e só a versão aprovada; opção
  `shareSolutions` para quem não quiser compartilhar.
- Política de retenção opcional (ex.: remover snapshots de tentativas de revisão após
  12 meses), configurável por variável de ambiente.

## Documentos a atualizar quando implementado
- `PRD_inclu_capacitacao.md` — RF12 (auditoria com diffs) e novo requisito de soluções
  da comunidade; schema da seção 7.
- `docs/api/cli-protocol.md` — campo `snapshot` e flag `--no-snapshot`.
- `.agents/skills/cli-validation/SKILL.md` — regras de coleta e exclusão.
- Cápsulas teóricas / guia do aluno — aviso sobre o que a CLI envia.
