---
name: code-review
description: >-
  Executa revisão de código (code review), auditoria de arquitetura, qualidade de
  tipagem TypeScript, integridade do schema Prisma e conformidade com as regras
  do PRD da plataforma Capacitação inclu.
---

# Code Review & Architecture Validation Skill

Esta skill estabelece o roteiro de auditoria de código e arquitetura para a plataforma **Capacitação inclu**, assegurando que os padrões de engenharia de software da Empresa Júnior sejam rigorosamente cumpridos.

## Objetivos da Revisão
1. Garantir adesão aos Requisitos Funcionais (RF01 a RF12) e Não-Funcionais (RNF01 a RNF04) do PRD.
2. Assegurar tipagem estrita no TypeScript e reaproveitamento no monorepo (`packages/shared`).
3. Verificar a segurança do RBAC (`PENDING`, `TRAINEE`, `MEMBER`, `ADMIN`) e proteção de endpoints.
4. Confirmar que nenhuma operação consome minutos de CI/CD do GitLab (RNF01).

---

## Checklist de Revisão

### 1. Arquitetura e Monorepo
- [ ] O código está devidamente isolado nos workspaces corretos:
  - `apps/web`: Next.js App Router, rotas de API, Prisma e interface web.
  - `apps/cli`: Binário executável `ej-cap` em Node.js/TypeScript.
  - `packages/shared`: Tipos TypeScript e DTOs compartilhados.
  - `packages/content`: Arquivos Markdown de teoria, missão e dicas.
- [ ] Não há importações relativas cruzadas ilegais entre `apps/web` e `apps/cli`. Toda comunicação de tipos passa por `@inclu/shared`.
- [ ] Scripts no `package.json` raiz (`build`, `lint`, `test`, `dev`) executam adequadamente em todos os workspaces.

### 2. Qualidade TypeScript e Boas Práticas
- [ ] `strict: true` ativado no `tsconfig.json`.
- [ ] Ausência de tipos `any` injustificados; uso de `unknown` ou generics quando apropriado.
- [ ] Zod ou validador equivalente utilizado para validar payloads recebidos nas rotas de API da web e da CLI.
- [ ] Tratamento defensivo de erros assíncronos (`try/catch` com tipagem de erro tratada).

### 3. Segurança e Controle de Acesso (RBAC)
- [ ] **Middleware / Guards de Autenticação:** Rotas de API e páginas sensíveis verificam a Role da sessão do usuário:
  - Rotas `/api/admin/*` e `/admin/*` exigem papel `ADMIN`.
  - Rotas de aprendizado bloqueiam usuários com status `PENDING` (redirecionam para `/waiting-room`).
  - Máquina de estados: Usuários `TRAINEE` são impedidos no backend de submeter etapas futuras antes de completar a etapa atual.
  - Usuários `MEMBER` têm acesso livre a qualquer etapa.
- [ ] **Autenticação da CLI:** Endpoints `/api/cli/*` autenticam o usuário exclusivamente via `cliToken` transmitido via header `Authorization: Bearer <cliToken>`.
- [ ] **Segredos e Credenciais:**
  - Nenhuma chave de API, segredo de OAuth (`GITLAB_CLIENT_SECRET`) ou token de bot (`GITLAB_BOT_TOKEN`) está hardcoded.
  - Variáveis de ambiente estão documentadas em `.env.example`.

### 4. Banco de Dados e Prisma ORM
- [ ] O schema em `prisma/schema.prisma` reflete rigorosamente a Seção 7 do PRD.
- [ ] Relações e integridade referencial consistentes (`User`, `Track`, `Stage`, `UserProgress`, `Submission`).
- [ ] Índices aplicados em campos de alta frequência de busca (`userId`, `stageId`, `cohort`, `cliToken`).
- [ ] Transações utilizadas em operações atômicas (ex: ao aprovar uma etapa e desbloquear a próxima para um `TRAINEE`).
- [ ] Ausência de queries N+1 no carregamento da matriz de acompanhamento (`findMany` com `include` ou aggregations adequadas).

### 5. Custo Zero de CI/CD (RNF01)
- [ ] Nenhuma rota de validação ou script dispara `POST /projects/:id/pipeline` ou depende de runners do GitLab.
- [ ] Todas as verificações da Trilha 2 utilizam estritamente leitura de metadados (`GET /projects`, `GET /issues`, `GET /merge_requests`, etc.) ou criação de notas/comentários.

---

## Procedimento de Execução do Review

1. Execute a verificação estática de tipos e linter:
   ```bash
   npm run lint
   npm run typecheck
   ```
2. Verifique se o schema do Prisma está sincronizado:
   ```bash
   npx prisma validate --schema=apps/web/prisma/schema.prisma
   ```
3. Audite as rotas de API para conferir a verificação de RBAC:
   - Inspecione `apps/web/src/app/api/` e `apps/web/src/middleware.ts`.
4. Emita o relatório de review apontando:
   - 🔴 **Bloqueadores:** Falhas de segurança, violação de RBAC ou violação de RNF01.
   - 🟡 **Melhorias:** Simplificação de tipos, otimização de consultas e mensagens de erro.
   - 🟢 **Aprovado:** Código pronto para merge.
