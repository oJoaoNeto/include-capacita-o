---
name: curriculum-content-validation
description: >-
  Valida o conteúdo pedagógico e curricular das 17 micro-etapas do projeto
  (Markdown, Teoria, Missão, Dicas e Scripts de Setup), assegurando conformidade
  com a Matriz Curricular do PRD e o RNF04.
---

# Curriculum & Content Validation Skill

Esta skill guia a verificação da qualidade pedagógica, estruturação de arquivos Markdown desacoplados (RNF04) e consistência das 17 micro-etapas da plataforma **Capacitação inclu**.

---

## 1. Diretrizes Pedagógicas (Metodologia CodeCrafters)

- [ ] **Foco no Iniciante:** O conteúdo foi desenhado para trainees que estão tendo seu primeiro contato com versionamento e containers. Evitar jargões sem explicação prévia.
- [ ] **Cápsula Teórica Curta:** Não criar textos longos ou maçantes. Usar analogias práticas do cotidiano e tabelas de consulta rápida com a sintaxe do comando.
- [ ] **Missão com Critério Objetivo:** A missão deve deixar claro:
  1. Qual é o objetivo do exercício.
  2. Qual comando executar para iniciar (`setup`) ou verificar (`verify`).
  3. O que define a aprovação.
- [ ] **Mecânica de Dicas Progressivas (RF07):**
  - **Dica 1 (Desbloqueada após 1 falha):** Orientação conceitual / onde focar a atenção (ex: *"Lembre-se que o Git precisa saber quem você é antes de gravar seus commits. O comando começa com 'git config...'"*).
  - **Dica 2 (Desbloqueada após 2 falhas):** Sintaxe quase pronta do comando esperado (ex: *"Execute no seu terminal: git config --global user.name 'Seu Nome' e git config --global user.email 'seu@email.com'"*).

---

## 2. Matriz Curricular: Conferência das 17 Etapas

Verificar se todas as 17 etapas da Seção 5 do PRD estão implementadas e mapeadas:

### Trilha 1: Git Local (`git-local`)
- [ ] `1.1` — **Identidade no Git**: `git config user.name` e `user.email`.
- [ ] `1.2` — **Criando a Máquina do Tempo**: Inicialização com `git init` (`.git`).
- [ ] `1.3` — **Primeiro Ponto de Salvamento**: `git add` + `git commit` com working tree limpa.
- [ ] `1.4` — **O Segredo do `.gitignore`**: Bloqueio de arquivos sensíveis (`.env`).
- [ ] `1.5` — **Universos Paralelos (`branch`)**: Criação da branch `feat/treino`.
- [ ] `1.6` — **Unindo Linhas (`merge`)**: Integração da branch na `main`.
- [ ] `1.7` — **Resolvendo seu 1º Conflito**: Resolução de conflito gerado pelo setup sem marcadores `<<<<<<<`.

### Trilha 2: GitLab Workflow (`gitlab-cloud`)
- [ ] `2.1` — **Passaporte SSH**: Cadastro de chave SSH e conexão `ssh -T git@gitlab.com`.
- [ ] `2.2` — **Do PC para a Nuvem (`push`)**: Envio do repositório local para o remoto via `git push`.
- [ ] `2.3` — **Organizando Tarefas (Issues)**: Criação de issue com título correto e `assignee` próprio.
- [ ] `2.4` — **Uma Branch por Tarefa**: Criação e publicação da branch `feat/adiciona-membro`.
- [ ] `2.5` — **Abrindo um Merge Request**: Abertura de MR referenciando `Closes #1`.
- [ ] `2.6` — **Passando pelo Code Review**: Interação com bot `@ej-mentor-bot` e envio de novo commit.

### Trilha 3: Docker Básico (`docker-basics`)
- [ ] `3.1` — **Seu Primeiro Container**: Execução de container Nginx na porta 8080 com HTTP 200.
- [ ] `3.2` — **Receita de Bolo (`Dockerfile`)**: Build de imagem customizada servindo HTML estático.
- [ ] `3.3` — **Variáveis de Ambiente (`-e`)**: Container com variável `TRAINEE_EJ` injetada.
- [ ] `3.4` — **Orquestrando com Compose**: `docker-compose.yml` com App + Banco com status `Up`.

---

## 3. Validação do Desacoplamento e Seed (RNF04)

- [ ] Os arquivos de conteúdo residem em `packages/content/tracks/<track>/<stage>/`.
- [ ] Cada pasta contém:
  - `theory.md`: Conteúdo teórico formatado em Markdown.
  - `mission.md`: Enunciado prático da missão.
  - `hints.json`: Array ordenado de strings contendo as dicas progressivas.
  - `setup.js` ou `setup.sh`: Script opcional para preparar o cenário do exercício.
- [ ] O script de seed (`apps/web/prisma/seed.ts`) lê esses arquivos do disco e insere ou atualiza os registros de `Track` e `Stage` via `upsert` com base nos slugs únicos.
- [ ] A execução de `npx prisma db seed` não apaga nem corrompe o progresso dos usuários (`UserProgress` e `Submission`).

---

## Procedimento de Teste

1. **Validação Estrutural dos Arquivos de Conteúdo:**
   ```bash
   node -e "
     const fs = require('fs');
     const path = './packages/content/tracks';
     // Verifica se todas as 17 pastas contêm theory.md, mission.md e hints.json
   "
   ```
2. **Execução do Seed de Banco de Dados:**
   ```bash
   npx prisma db seed --schema=apps/web/prisma/schema.prisma
   ```
3. **Inspeção Visual do Markdown:**
   - Conferir se os blocos de código têm delimitadores com linguagem especificada (ex: ```bash, ```yaml, ```dockerfile).
   - Garantir links funcionais e ausência de imagens quebradas.
