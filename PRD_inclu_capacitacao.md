# PRD — Product Requirements Document: Plataforma "Capacitação inclu"

## 1. Visão Geral do Produto

* **Nome do Produto:** Plataforma de Capacitação Modular (*Capacitação Pro Max*)
* **Objetivo:** Substituir a capacitação tradicional (aulas passivas e correções manuais demoradas) por uma jornada interativa inspirada no *CodeCrafters*, onde o aprendizado ocorre em micro-etapas validadas automaticamente.
* **Público-Alvo Principal:** Novos **Trainees** da Empresa Júnior (iniciantes absolutos que precisam aprender desde a diferença entre Git e GitLab até o uso básico de containers).
* **Público-Alvo Secundário:** **Membros Efetivos** da EJ que desejam revisar conceitos ou estudar trilhas específicas sob demanda, sem precisar seguir a ordem obrigatória do processo seletivo.
* **Escopo do MVP:** 3 Trilhas Fundamentais (**1. Git Local**, **2. GitLab Workflow na Nuvem** e **3. Docker Básico**), operando 100% sem custo de minutos de CI/CD no GitLab.com.

---

## 2. Perfis de Usuário e Controle de Acesso (RBAC)

O acesso ao sistema não é aberto ao público geral do GitLab.com. O fluxo exige que um administrador pré-cadastre o usuário ou aprove sua entrada definindo sua *Role*:

| Role (Papel) | Regra de Progressão nas Trilhas | Visibilidade na Gestão | Permissões no Sistema |
| --- | --- | --- | --- |
| **`PENDING`** | **Bloqueado:** Tela de "Sala de Espera" até que um Admin defina sua role. | Aba de "Aprovações Pendentes". | Nenhuma. |
| **`TRAINEE`** | **Modo Guiado (Linear):** Inicia apenas com a Etapa `1.1` liberada. A etapa $N+1$ só desbloqueia após a aprovação na etapa $N$. | **Matriz Obrigatória de Trainees** (monitoramento de prazos e travamentos). | Realizar etapas via Web e CLI. |
| **`MEMBER`** | **Modo Livre (Sandbox):** Todas as trilhas e etapas vêm desbloqueadas desde o início para estudo avulso. O progresso concluído ainda é contabilizado. | Aba separada de **Upskilling de Membros** (sem alertas de atraso). | Realizar qualquer etapa em qualquer ordem. |
| **`ADMIN`** | **Modo Livre + Bypass:** Acesso irrestrito a todas as etapas e testes. | Visão completa de todas as matrizes e logs. | Cadastrar usuários, atribuir/alterar *Roles*, gerenciar turmas (*cohorts*) e auditar submissões. |

---

## 3. Arquitetura do Sistema (Resumo Técnico)

O sistema opera em uma arquitetura híbrida que divide a validação em dois motores gratuitos:

1. **Aplicação Web & Backend Central (Next.js + Tailwind + Shadcn UI + PostgreSQL):**
* Hospeda a interface de ensino (Cápsula Teórica + Missão Prática), gerencia a autenticação via **GitLab OAuth** e controla o painel de gestão de membros.
* Atua como **Motor de Validação em Nuvem** para a Trilha 2 (GitLab), consultando diretamente a **API REST v4 do GitLab.com** (`GET`/`POST`) e controlando um **Bot de Code Review** (`@ej-mentor-bot`).


2. **CLI de Treinamento Local (`npx ej-cap` em Node.js/TypeScript):**
* Executada no terminal da máquina do aluno para as Trilhas 1 (Git) e 3 (Docker).
* Possui os comandos `login` (autentica via token), `setup <etapa>` (prepara arquivos locais ou gera cenários de conflito no Git) e `verify` (inspeciona `.git` ou containers Docker, exibe feedback amigável em português e notifica o Backend em caso de sucesso).



---

## 4. Requisitos Funcionais (RF)

### 4.1. Módulo de Gestão de Usuários e Autenticação

* **RF01 - Pré-Cadastro e Atribuição de Role:** Administradores podem pré-cadastrar novos membros/trainees informando o e-mail ou `@username` do GitLab, a Turma (`cohort`, ex: *"PS 2026.2"*) e a *Role* (`TRAINEE`, `MEMBER` ou `ADMIN`).
* **RF02 - Autenticação via GitLab OAuth:** O login é feito exclusivamente via conta do GitLab.com. No primeiro login, o sistema vincula os dados do GitLab ao pré-cadastro (ou aloca o usuário como `PENDING` caso não tenha sido pré-cadastrado).
* **RF03 - Promoção e Alteração de Papel:** O `ADMIN` pode alterar a *Role* de qualquer usuário a qualquer momento (ex: mudar um `TRAINEE` efetivado para `MEMBER` com 1 clique, mantendo todo o histórico de progresso dele intacto e liberando o Modo Livre).

### 4.2. Experiência de Aprendizado (Trainees e Membros)

* **RF04 - Interface "Conceito + Prática":** Cada micro-etapa apresenta duas seções:
1. **Cápsula Teórica:** Explicação curta em Markdown focada em iniciantes, com analogias visuais e tabela de comandos da etapa.
2. **Missão Prática:** Instruções diretas do que deve ser entregue e console de status da validação.


* **RF05 - Máquina de Estados Condicional por Role:** O backend deve bloquear o acesso e a submissão de etapas futuras para usuários `TRAINEE`, mas permitir leitura e validação em qualquer ordem para usuários `MEMBER` e `ADMIN`.
* **RF06 - Tradutor Pedagógico de Erros:** Tanto a CLI quanto as validações via API do GitLab devem interceptar erros técnicos e retornar mensagens instrutivas em português (ex: *"⚠️ Você criou a Issue no GitLab, mas esqueceu de atribuir você mesmo no campo 'Assignee'"*).
* **RF07 - Dicas Progressivas Desbloqueáveis:** Cada etapa conta com dicas ocultas. Após a 1ª falha na validação, a Dica 1 é liberada; após a 2ª falha, a Dica 2 exibe a estrutura quase completa do comando esperado.

### 4.3. Motores de Validação e Automação

* **RF08 - Gerador e Validador Local via CLI:** A CLI deve preparar cenários na máquina do usuário (`ej-cap setup`) e validar o estado local do Git e do Docker (`ej-cap verify`), enviando o resultado autenticado via `cliToken` para a API da plataforma.
* **RF09 - Provisionamento Automático de Repositório de Treino:** Quando o usuário inicia a Trilha 2 (GitLab), o Backend cria ou faz *fork* automático de um repositório de treino no GitLab.com via API e exibe a URL na tela.
* **RF10 - Bot Automatizado de Code Review:** Na etapa de Merge Request (2.6), o Backend utiliza o token de uma conta Bot da EJ no GitLab para postar um comentário de revisão no MR do usuário e validar se ele enviou um novo commit de correção.

### 4.4. Painel da Diretoria / Avaliadores

* **RF11 - Matriz de Acompanhamento Segmentada:** Painel com visualização em matriz (Usuários $\times$ 17 Etapas) com filtro por Turma (`cohort`) e separação entre **Avaliação de Trainees** (com destaque em vermelho 🔴 para quem falhou 3+ vezes na mesma etapa) e **Progresso de Membros**.
* **RF12 - Auditoria de Logs:** Ao clicar na tentativa de um usuário no painel, o avaliador visualiza o histórico de submissões e o log exato do erro retornado pelo terminal/API para prestar suporte direcionado.

---

## 5. Matriz Curricular do MVP (17 Micro-Etapas)

| Trilha | Etapa | Título | Motor de Validação | Regra de Aprovação (Critério de Aceite) |
| --- | --- | --- | --- | --- |
| **1. Git Local** | `1.1` | Identidade no Git | CLI (`verify`) | `git config user.name` e `user.email` configurados localmente. |
| **1. Git Local** | `1.2` | Criando a Máquina do Tempo | CLI (`verify`) | Pasta oculta `.git` inicializada no diretório do exercício. |
| **1. Git Local** | `1.3` | Primeiro Ponto de Salvamento | CLI (`verify`) | 1 commit registrado no `git log` contendo o arquivo pedido e *working tree* limpa. |
| **1. Git Local** | `1.4` | O Segredo do `.gitignore` | CLI (`verify`) | Arquivo `.env` criado pelo `setup` é ignorado (`git check-ignore`). |
| **1. Git Local** | `1.5` | Universos Paralelos (`branch`) | CLI (`verify`) | Branch `feat/treino` criada e ativa no `HEAD`. |
| **1. Git Local** | `1.6` | Unindo Linhas (`merge`) | CLI (`verify`) | Commit da `feat/treino` integrado ao histórico da branch `main`. |
| **1. Git Local** | `1.7` | Resolvendo seu 1º Conflito | CLI (`verify`) | Conflito gerado pelo `setup` resolvido sem marcadores `<<<<<<<` e com merge finalizado. |
| **2. GitLab** | `2.1` | Passaporte SSH | CLI + API GitLab | Chave SSH cadastrada na conta do GitLab e conexão `ssh -T git@gitlab.com` validada. |
| **2. GitLab** | `2.2` | Do PC para a Nuvem (`push`) | Web (API GitLab) | Repositório remoto de treino no GitLab contém os commits enviados via `git push`. |
| **2. GitLab** | `2.3` | Organizando Tarefas (Issues) | Web (API GitLab) | Issue aberta no repositório de treino com título correto e `assignee` = próprio usuário. |
| **2. GitLab** | `2.4` | Uma Branch por Tarefa | Web (API GitLab) | Branch `feat/adiciona-membro` publicada no GitLab com a alteração solicitada. |
| **2. GitLab** | `2.5` | Abrindo um Merge Request | Web (API GitLab) | MR aberto da branch `feat/adiciona-membro` para `main` referenciando `Closes #1`. |
| **2. GitLab** | `2.6` | Passando pelo Code Review | Web (API GitLab) | Novo commit enviado à branch do MR após o comentário automático do Bot da EJ. |
| **3. Docker** | `3.1` | Seu Primeiro Container | CLI (`verify`) | Container `nginx` ativo na porta `8080` respondendo `HTTP 200`. |
| **3. Docker** | `3.2` | Receita de Bolo (`Dockerfile`) | CLI (`verify`) | Imagem construída a partir do `Dockerfile` do aluno servindo o HTML estático da EJ. |
| **3. Docker** | `3.3` | Variáveis de Ambiente (`-e`) | CLI (`verify`) | `docker inspect` confirma a variável `TRAINEE_EJ` injetada no container em execução. |
| **3. Docker** | `3.4` | Orquestrando com Compose | CLI (`verify`) | Serviços de App + Banco definidos no `docker-compose.yml` rodando com status `Up`. |

---

## 6. Requisitos Não-Funcionais (RNF)

* **RNF01 - Custo Zero de CI/CD Minutes:** Nenhuma validação do MVP deve disparar pipelines nos *Shared Runners* do GitLab.com, garantindo escalabilidade gratuita para qualquer tamanho de turma.
* **RNF02 - Stack Padronizada da EJ:** Frontend em **Next.js (App Router) + Tailwind CSS + Shadcn UI**; Backend em **API Routes do Next.js (ou NestJS) + Prisma ORM + PostgreSQL**; CLI em **TypeScript/Node.js**.
* **RNF03 - Compatibilidade Multiplataforma:** A CLI deve operar sem diferenças em Linux, macOS e Windows (via WSL2 ou Git Bash).
* **RNF04 - Conteúdo Desacoplado em Markdown:** Textos teóricos, enunciados e dicas devem ser carregados a partir de arquivos Markdown estruturados no repositório, facilitando a edição por membros sem mexer no banco de dados.

---

## 7. Modelagem do Banco de Dados (Schema Prisma Definitivo)

```prisma
enum Role {
  PENDING   // Aguardando aprovação/atribuição de role por um Admin
  TRAINEE   // Modo Guiado (etapas sequenciais obrigatórias)
  MEMBER    // Modo Livre (qualquer etapa acessível para estudo)
  ADMIN     // Gestão de usuários, turmas e acompanhamento
}

enum ValidationType {
  CLI_LOCAL
  GITLAB_API
}

enum StageStatus {
  LOCKED
  IN_PROGRESS
  COMPLETED
}

model User {
  id              String         @id @default(uuid())
  name            String?
  email           String         @unique // Usado para pré-cadastro pelo Admin
  avatarUrl       String?
  
  // Preenchidos automaticamente no 1º login via GitLab OAuth
  gitlabUserId    Int?           @unique
  gitlabUsername  String?        @unique
  gitlabToken     String?
  
  cliToken        String         @unique @default(uuid())
  trainingRepoId  Int?           // ID do repositório de treino no GitLab (Trilha 2)
  
  role            Role           @default(PENDING)
  cohort          String?        // Ex: "PS 2026.2", "Membros Efetivos"
  isActive        Boolean        @default(true)
  
  progress        UserProgress[]
  submissions     Submission[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model Track {
  id          String   @id @default(uuid())
  slug        String   @unique // "git-local", "gitlab-cloud", "docker-basics"
  title       String
  description String
  order       Int      @unique
  stages      Stage[]
}

model Stage {
  id             String         @id @default(uuid())
  trackId        String
  track          Track          @relation(fields: [trackId], references: [id])
  slug           String         @unique // "git-1-1", "gitlab-2-3", etc.
  stepNumber     Int
  title          String
  theoryMd       String         @db.Text
  missionMd      String         @db.Text
  hints          String[]
  validationType ValidationType
  progress       UserProgress[]
  submissions    Submission[]

  @@unique([trackId, stepNumber])
}

model UserProgress {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  stageId     String
  stage       Stage       @relation(fields: [stageId], references: [id])
  status      StageStatus @default(LOCKED)
  attempts    Int         @default(0)
  completedAt DateTime?

  @@unique([userId, stageId])
}

model Submission {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  stageId      String
  stage        Stage    @relation(fields: [stageId], references: [id])
  passed       Boolean
  feedbackMsg  String   @db.Text
  rawLogs      String?  @db.Text
  createdAt    DateTime @default(now())
}

```
