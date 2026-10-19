---
name: api-contracts-directives
description: >-
  Documenta e audita os contratos de APIs (rotas do Next.js, protocolo CLI-Backend,
  integração com GitLab REST API v4) e as diretivas não-negociáveis do projeto
  (RNF01 a RNF04).
---

# API Contracts & Project Directives Skill

Esta skill define os padrões para documentar e auditar os **Contratos de API (Endpoints, DTOs e Autenticação)** e as **Diretivas Técnicas Obrigatórias** da plataforma **Capacitação inclu**.

---

## 1. Localização dos Documentos de APIs e Diretivas

Toda a documentação reside em:
`docs/api/`

- `docs/api/cli-protocol.md`: Protocolo de comunicação entre o binário `ej-cap` e a API Web.
- `docs/api/web-endpoints.md`: Especificação de todas as rotas REST (`/api/auth`, `/api/admin`, `/api/stages`).
- `docs/api/gitlab-api-integration.md`: Mapeamento das chamadas da API REST v4 do GitLab.com e do Bot.
- `docs/api/mandatory-directives.md`: Diretivas técnicas e restrições não-negociáveis do projeto.

---

## 2. Contratos de API Essenciais

### A. Protocolo CLI $\leftrightarrow$ Backend (`/api/cli/*`)

1. **`POST /api/cli/auth`**
   - **Header:** `Authorization: Bearer <cliToken>`
   - **Resposta de Sucesso (200):**
     ```json
     {
       "valid": true,
       "user": {
         "id": "uuid",
         "name": "João Neto",
         "email": "joao@ej.com",
         "role": "TRAINEE",
         "cohort": "PS 2026.2"
       },
       "currentStage": {
         "slug": "git-1-1",
         "track": "git-local",
         "title": "Identidade no Git"
       }
     }
     ```

2. **`POST /api/cli/submissions`**
   - **Header:** `Authorization: Bearer <cliToken>`
   - **Payload:**
     ```json
     {
       "stageSlug": "git-1-1",
       "passed": true,
       "feedbackMsg": "Identidade Git configurada com sucesso!",
       "rawLogs": "user.name=Joao Neto\nuser.email=joao@ej.com"
     }
     ```
   - **Resposta de Sucesso (200):** Retorna o progresso atualizado e a próxima etapa desbloqueada (se aplicável).

---

### B. Integração com GitLab REST API v4 (Trilha 2)

As chamadas são feitas com o `gitlabToken` do usuário ou `GITLAB_BOT_TOKEN` da EJ:

| Funcionalidade | Método & Endpoint do GitLab | Finalidade |
|---|---|---|
| **Chaves SSH** | `GET /api/v4/users/:id/keys` | Validação da Etapa 2.1 |
| **Commits** | `GET /api/v4/projects/:id/repository/commits` | Validação da Etapa 2.2 |
| **Issues** | `GET /api/v4/projects/:id/issues` | Validação da Etapa 2.3 |
| **Branches** | `GET /api/v4/projects/:id/repository/branches/:branch` | Validação da Etapa 2.4 |
| **Merge Requests**| `GET /api/v4/projects/:id/merge_requests` | Validação da Etapa 2.5 |
| **Comentário do Bot**| `POST /api/v4/projects/:id/merge_requests/:iid/notes`| Revisão da Etapa 2.6 |

---

## 3. Diretivas Técnicas Não-Negociáveis (Project Directives)

Toda implementação deve respeitar rigorosamente as seguintes diretivas:

1. **Diretiva D01 — Custo Zero de CI (RNF01):**
   - *Regra Absoluta:* Nenhuma validação pode utilizar runners ou pipelines do GitLab CI. Todo veredito deve ser derivado via REST API v4 ou CLI local.
2. **Diretiva D02 — Isolamento de Tipos e Contratos (RNF02):**
   - *Regra:* Todas as interfaces e esquemas de dados compartilhados entre Web e CLI devem residir em `packages/shared/`. Nenhuma das partes pode depender de arquivos internos da outra.
3. **Diretiva D03 — Multiplataforma Nativo (RNF03):**
   - *Regra:* Comandos da CLI nunca devem assumir caminhos estáticos Unix (`/bin/sh` ou `rm -rf`). Utilizar utilitários Node.js (`fs-extra`, `path.join`) para funcionar em Windows (WSL2/Git Bash), macOS e Linux.
4. **Diretiva D04 — Desacoplamento Curricular (RNF04):**
   - *Regra:* O conteúdo pedagógico (Markdown) não deve estar embutido no código TypeScript do Next.js ou nas migrações do Prisma. Deve ser sincronizado via script de seed a partir de `packages/content/`.

---

## Procedimento para Documentar uma Nova Rota ou Diretiva

1. Defina o esquema Zod correspondente em `packages/shared/src/schemas/`.
2. Adicione a especificação do endpoint em `docs/api/web-endpoints.md`.
3. Verifique a conformidade com as 4 diretivas obrigatórias antes da aprovação do PR.
