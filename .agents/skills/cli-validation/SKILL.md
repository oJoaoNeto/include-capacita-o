---
name: cli-validation
description: >-
  Valida a ferramenta de linha de comando ej-cap (TypeScript/Node.js), testando
  autenticação local, setup de cenários práticos e motores de verificação das
  Trilhas 1 (Git) e 3 (Docker).
---

# CLI Validation Skill (`ej-cap`)

Esta skill orienta o teste e validação da CLI de treinamento local **`ej-cap`** executada na máquina do aluno via `npx ej-cap`.

---

## Comandos da CLI e Critérios de Aceite

### 1. `ej-cap login <token>`
- [ ] Valida se o token informado tem formato válido de UUID.
- [ ] Comunica-se com `POST /api/cli/auth` para verificar a validade do token.
- [ ] Salva a configuração localmente em `~/.ej-cap/config.json` com permissões restritas (ex: `0600`).
- [ ] Exibe mensagem acolhedora em português com o nome do usuário e sua turma (`cohort`).

### 2. `ej-cap status`
- [ ] Lê o token salvo e consulta o endpoint de status.
- [ ] Exibe: Nome do aluno, Turma, Papel (`TRAINEE` / `MEMBER`), Trilha atual e Etapa em andamento.
- [ ] Se o usuário não estiver logado, exibe instrução pedagógica para rodar `ej-cap login <token>`.

### 3. `ej-cap setup <etapa>` (RF08)
Prepara o diretório de trabalho local conforme a etapa solicitada:
- [ ] **Etapa 1.4 (`.gitignore`):** Gera um arquivo `.env` com conteúdo de exemplo para o aluno testar o bloqueio.
- [ ] **Etapa 1.5 (`branch`):** Assegura que o repositório base exista para criação da branch `feat/treino`.
- [ ] **Etapa 1.7 (`resolvendo conflito`):**
  - Cria um commit inicial com um arquivo `calculadora.js`.
  - Cria e comita alterações na branch `main`.
  - Cria uma branch `feat/conflito` com alterações divergentes nas mesmas linhas.
  - Tenta fazer o merge proposital para gerar o estado de conflito (`CONFLICT (content)`).
  - Garante que os marcadores `<<<<<<<`, `=======`, `>>>>>>>` estejam presentes para o aluno resolver.
- [ ] **Etapa 3.2 / 3.4 (Docker):** Cria templates ou arquivos esqueleto quando aplicável.

---

## 4. `ej-cap verify` — Motores de Validação Local

O comando `ej-cap verify` inspeciona o estado do ambiente e envia o veredito para `POST /api/cli/submissions`.

### Trilha 1: Git Local
| Etapa | Comando / Inspeção Executada pela CLI | Critério de Sucesso | Mensagem Amigável de Falha (RF06) |
|---|---|---|---|
| `1.1` | `git config user.name` e `git config user.email` | Ambos preenchidos e válidos | *"⚠️ Não encontramos seu nome ou e-mail configurados no Git. Use 'git config --global user.name ...'"* |
| `1.2` | `git rev-parse --is-inside-work-tree` | Retorna `true` (diretório `.git` ativo) | *"⚠️ Este diretório ainda não é um repositório Git. Use o comando 'git init'."* |
| `1.3` | `git rev-list --count HEAD` e `git status --porcelain` | $\ge 1$ commit e working tree limpa | *"⚠️ Você precisa fazer o commit do arquivo pedido. Não esqueça de 'git add' e 'git commit'."* |
| `1.4` | `git check-ignore -v .env` | Retorna código `0` (arquivo ignorado pelo `.gitignore`) | *"⚠️ O arquivo .env ainda está visível para o Git! Adicione a linha '.env' no seu arquivo '.gitignore'."* |
| `1.5` | `git branch --show-current` | Nome da branch ativa é exatamente `feat/treino` | *"⚠️ Você não está na branch 'feat/treino'. Use 'git switch -c feat/treino' ou 'git checkout -b feat/treino'."* |
| `1.6` | `git merge-base --is-ancestor <feat-commit> main` | Commit da branch foi integrado na `main` | *"⚠️ O commit da branch 'feat/treino' ainda não foi integrado à 'main'. Faça o checkout na 'main' e use 'git merge'."* |
| `1.7` | `git status` e verificação de texto nos arquivos | Sem arquivos em conflito e ausência de marcadores `<<<<<<<` | *"⚠️ Ainda encontramos marcadores de conflito ('<<<<<<<') nos seus arquivos. Edite o arquivo, remova as marcas e finalize com 'git commit'."* |

### Trilha 2: GitLab (Etapa Local)
| Etapa | Inspeção | Critério de Sucesso | Mensagem Amigável de Falha |
|---|---|---|---|
| `2.1` | Execução de `ssh -T git@gitlab.com` | Handshake reconhece usuário (`Welcome to GitLab, @username!`) | *"⚠️ Não conseguimos autenticar via SSH no GitLab. Verifique se sua chave pública foi adicionada ao seu perfil no GitLab.com."* |

### Trilha 3: Docker Básico
| Etapa | Inspeção | Critério de Sucesso | Mensagem Amigável de Falha |
|---|---|---|---|
| `3.1` | Requisição HTTP em `http://localhost:8080` e inspeção do container | HTTP 200 recebido do servidor Nginx | *"⚠️ Não conseguimos conectar em http://localhost:8080. Verifique se o container nginx está rodando com '-p 8080:80'."* |
| `3.2` | Inspeção da imagem local criada via Dockerfile | Imagem com a tag esperada existe e serve o HTML da EJ | *"⚠️ Não encontramos a imagem gerada pelo seu Dockerfile. Lembre-se de rodar 'docker build -t ... .'"* |
| `3.3` | `docker inspect <container_id> --format '{{json .Config.Env}}'` | Variável `TRAINEE_EJ` presente no ambiente do container | *"⚠️ O container está rodando, mas não encontramos a variável de ambiente TRAINEE_EJ injetada via '-e'."* |
| `3.4` | `docker compose ps --format json` | Serviços de App e Banco ativos com status `running` / `Up` | *"⚠️ Os serviços do docker-compose não estão rodando. Verifique seu arquivo docker-compose.yml e execute 'docker compose up -d'."* |

---

## Procedimento de Teste da CLI

1. **Testes Unitários:**
   ```bash
   npm test --workspace=apps/cli
   ```
2. **Teste em Cenário Real (Mocked Server):**
   - Inicie o servidor web em modo dev (`npm run dev --workspace=apps/web`).
   - Crie um diretório de teste isolado:
     ```bash
     mkdir -p /tmp/teste-cli && cd /tmp/teste-cli
     ```
   - Execute o setup e a verificação das etapas:
     ```bash
     npx --workspace=apps/cli ej-cap setup 1.7
     npx --workspace=apps/cli ej-cap verify
     ```
   - Verifique se a saída no terminal usa spinners (`ora`), cores amigáveis (`chalk`) e se o status no banco foi atualizado.
