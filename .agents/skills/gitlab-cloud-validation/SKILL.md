---
name: gitlab-cloud-validation
description: >-
  Valida o motor de validação em nuvem da Trilha 2 (GitLab Workflow) e o bot de
  Code Review (@ej-mentor-bot), garantindo custo zero de CI/CD minutes e
  integração correta com a API REST v4 do GitLab.
---

# GitLab Cloud Validation Skill

Esta skill descreve as diretrizes e procedimentos para validar o **Motor de Validação em Nuvem** da Trilha 2 (GitLab), garantindo que todo o processo funcione com **custo zero de minutos de CI/CD** (RNF01) e com feedback humanizado (RF06).

---

## 1. Princípio Fundamental: Custo Zero de CI/CD (RNF01)

- [ ] **Sem Runners:** Em nenhum momento a plataforma deve acionar pipelines do GitLab CI/CD (`.gitlab-ci.yml`, triggers de pipeline ou runners compartilhados).
- [ ] **Apenas Leitura e Interação REST:** As validações devem consultar metadados do repositório através de chamadas `GET` e `POST` leves na API REST v4 (`https://gitlab.com/api/v4`).
- [ ] **Economia de Recursos:** A escala de turmas (10, 50 ou 100 trainees) não deve gerar faturas ou consumo de cota de minutos de CI no GitLab.com.

---

## 2. Validação das Etapas da Trilha 2

### Etapa 2.1 — Passaporte SSH
- **Ação:** Confere se o usuário cadastrou sua chave SSH pública no GitLab.
- **Chamada API:** `GET /users/:id/keys` (usando o token OAuth do usuário).
- **Aceite:** A lista de chaves deve conter ao menos uma chave SSH ativa.

### Etapa 2.2 — Do PC para a Nuvem (`git push`)
- **Ação:** Valida se o aluno enviou os commits do repositório local de treino para o repositório remoto.
- **Chamada API:** `GET /projects/:trainingRepoId/repository/commits?ref_name=main`.
- **Aceite:** Existência de commits com autor correspondente ao aluno e histórico de arquivos esperado.

### Etapa 2.3 — Organizando Tarefas (Issues)
- **Ação:** Valida se o aluno criou uma Issue no repositório de treino com o título solicitado e atribuiu a si próprio.
- **Chamada API:** `GET /projects/:trainingRepoId/issues?state=opened`.
- **Aceite:**
  - Existe ao menos 1 issue aberta.
  - O título da issue corresponde ao solicitado (ex: *"Adicionar novo membro ao projeto"*).
  - O campo `assignees` contém o `gitlabUserId` do aluno.
  - **Tradutor de Erro (RF06):** Se a issue existir mas não tiver `assignee`, retornar: *"⚠️ Você criou a Issue, mas esqueceu de se atribuir no campo 'Assignee'!"*

### Etapa 2.4 — Uma Branch por Tarefa
- **Ação:** Valida se o aluno criou e publicou a branch `feat/adiciona-membro`.
- **Chamada API:** `GET /projects/:trainingRepoId/repository/branches/feat%2Fadiciona-membro`.
- **Aceite:** A branch existe no repositório remoto e possui ao menos 1 commit à frente da `main`.

### Etapa 2.5 — Abrindo um Merge Request
- **Ação:** Valida se o aluno abriu um Merge Request da branch `feat/adiciona-membro` para `main`.
- **Chamada API:** `GET /projects/:trainingRepoId/merge_requests?source_branch=feat/adiciona-membro&target_branch=main&state=opened`.
- **Aceite:**
  - MR ativo e aberto.
  - A descrição ou título referencia o fechamento da issue (ex: `Closes #1` ou `Resolves #1`).

### Etapa 2.6 — Passando pelo Code Review (Bot Automatizado - RF10)
- **Ação:** O backend aciona o bot `@ej-mentor-bot` para postar uma revisão no MR e aguarda a correção do aluno.
- **Fluxo do Bot:**
  1. O backend consulta o MR aberto da etapa 2.5.
  2. Usando o `GITLAB_BOT_TOKEN`, o bot posta uma nota pedagógica no MR:
     `POST /projects/:trainingRepoId/merge_requests/:mr_iid/notes`
     *Exemplo de comentário:* *"👋 Olá! Sou o Mentor Bot da EJ. Notei que você adicionou seu nome no arquivo `membros.txt`, mas faltou incluir o seu cargo ou curso. Faça essa alteração e envie um novo commit nesta mesma branch!"*
  3. Quando o aluno faz o novo commit e clica em "Verificar", o validador consulta os commits da branch do MR (`GET /projects/:id/merge_requests/:mr_iid/commits`).
  4. Se houver um novo commit posterior ao comentário do bot com as alterações feitas, a etapa é aprovada com louvor.

---

## 3. Provisionamento do Repositório de Treino (RF09)

- [ ] Quando o aluno clica em "Iniciar Trilha 2", o backend:
  - Cria um repositório a partir de um template base ou fork (`POST /projects`).
  - Define visibilidade privada ou interna.
  - Salva o `trainingRepoId` no registro do usuário (`User.trainingRepoId`).
  - Exibe a URL de clone (`git@gitlab.com:...`) diretamente no dashboard do aluno.

---

## 4. Estratégia de Mock e Testes Offline

Para permitir desenvolvimento e testes de CI mesmo sem credenciais ativas do GitLab.com:
- [ ] Implementar um adaptador `GitLabClient` com interface:
  ```typescript
  interface IGitLabClient {
    getUserSshKeys(userId: number): Promise<SshKey[]>;
    getCommits(projectId: number, branch: string): Promise<Commit[]>;
    getIssues(projectId: number): Promise<Issue[]>;
    getBranches(projectId: number): Promise<Branch[]>;
    getMergeRequests(projectId: number): Promise<MergeRequest[]>;
    postMrComment(projectId: number, mrIid: number, message: string): Promise<Note>;
  }
  ```
- [ ] Implementar `MockGitLabClient` que simula respostas da API REST v4 com cenários de sucesso e falha parametrizáveis.
- [ ] Testar cenários de tradução pedagógica de erro usando testes unitários com o mock.
