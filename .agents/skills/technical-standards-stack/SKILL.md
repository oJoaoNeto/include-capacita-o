---
name: technical-standards-stack
description: >-
  Documenta e padroniza a stack tecnológica oficial da EJ, convenções de código,
  estrutura de pastas do monorepo, regras de tipagem TypeScript e diretrizes de
  tradução pedagógica de erros.
---

# Technical Standards & Tech Stack Skill

Esta skill estabelece a documentação dos padrões técnicos, convenções de codificação e detalhamento da stack oficial da plataforma **Capacitação inclu**.

---

## 1. Localização da Documentação Técnica

Os documentos de padrões residem em:
`docs/standards/`

- `docs/standards/tech-stack.md`: Especificação detalhada da stack e versões mínimas.
- `docs/standards/coding-guidelines.md`: Convenções de nomenclatura, exports e componentes.
- `docs/standards/error-translation-guide.md`: Dicionário e diretrizes para mensagens amigáveis em português (RF06).
- `docs/standards/git-workflow.md`: Padrão de commits convencionais e branching do time.

---

## 2. Stack Tecnológica Oficial (RNF02)

| Camada | Tecnologia | Justificativa / Padrão da EJ |
|---|---|---|
| **Frontend Web** | Next.js (App Router) + React 18/19 | Server Components para performance e SEO interno; App Router moderno. |
| **Estilização & UI** | Tailwind CSS + Shadcn UI | Design System acessível, headless (Radix UI) e totalmente customizável. |
| **Backend & APIs** | Next.js Route Handlers | APIs tipadas no mesmo ecossistema, simplificando deploy e manutenção. |
| **ORM & Banco** | Prisma ORM + PostgreSQL | Schema declarativo com tipagem automática e facilidade de migrações. |
| **Autenticação** | Auth.js / NextAuth (GitLab Provider) | Suporte nativo a OAuth 2.0 do GitLab.com com escopos seguros. |
| **CLI Local** | Node.js + TypeScript (Commander, Execa) | Execução via `npx ej-cap` sem necessidade de compilação na máquina do aluno. |
| **Monorepo** | npm workspaces | Gerenciamento simples e nativo de pacotes sem complexidade desnecessária. |

---

## 3. Padrões de Código e Estrutura

### A. Nomenclatura de Arquivos
- **Componentes React:** `PascalCase.tsx` (ex: `MatrixGrid.tsx`, `StageView.tsx`)
- **Rotas e Páginas Next.js:** minúsculo conforme padrão App Router (`page.tsx`, `layout.tsx`, `route.ts`)
- **Utilitários e Serviços:** `kebab-case.ts` (ex: `gitlab-api.ts`, `auth-utils.ts`)
- **Pacotes do Monorepo:** `@inclu/web`, `@inclu/cli`, `@inclu/shared`, `@inclu/content`

### B. Diretrizes para Server vs Client Components (Next.js)
- Mantenha componentes como **Server Components** por padrão para leitura de dados direto via Prisma.
- Adicione `'use client'` estritamente em componentes que utilizam hooks (`useState`, `useEffect`) ou interação do usuário (ex: botões interativos, dialogs do Shadcn).

### C. Tradução Pedagógica de Erros (RF06)
Toda mensagem de erro exibida ao aluno (na CLI ou na Web) deve seguir o padrão:
1. **Ícone ou Indicador Amigável:** `⚠️`, `💡`, `❌`
2. **Explicação do Problema:** Linguagem direta sem culpar o usuário.
3. **Ação Corretiva Sugerida:** Qual comando ou ação deve ser feita.

*Exemplo:*
```typescript
// ❌ Ruim (técnico demais):
throw new Error("GitLab API returned 404 for branch 'feat/adiciona-membro'");

// ✅ Bom (pedagógico e orientativo):
return {
  passed: false,
  feedbackMsg: "⚠️ Não encontramos a branch 'feat/adiciona-membro' no seu repositório do GitLab! Lembre-se de rodar 'git push -u origin feat/adiciona-membro' após criá-la localmente."
};
```

---

## Procedimento para Atualizar Padrões

1. Documente novas bibliotecas aprovadas em `docs/standards/tech-stack.md` com a justificativa de inclusão.
2. Atualize o guia de tradução de erros em `docs/standards/error-translation-guide.md` sempre que adicionar um novo caso de validação.
