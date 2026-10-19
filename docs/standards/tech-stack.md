# Especificação da Stack Tecnológica Oficial (RNF02)

Este documento padroniza as escolhas de tecnologias, bibliotecas e convenções estruturais adotadas na plataforma **Capacitação inclu**.

---

## 1. Topologia do Monorepo

O projeto é mantido como um monorepo gerenciado via **npm workspaces**:

```
inclu_capacitacao/
├── apps/
│   ├── web/                     # Aplicação Next.js (Frontend, APIs, Prisma)
│   └── cli/                     # CLI de terminal 'ej-cap' (TypeScript/Node)
├── packages/
│   ├── shared/                  # DTOs, Enums e Tipos compartilhados
│   └── content/                 # Conteúdo desacoplado em Markdown (17 etapas)
└── docs/                        # Documentação viva de arquitetura, padrões e APIs
```

---

## 2. Tecnologias Principais

### A. Frontend Web & Backend Central (`apps/web`)
* **Framework:** Next.js 14+ com App Router.
* **Linguagem:** TypeScript 5+ com modo estrito (`strict: true`).
* **Estilização:** Tailwind CSS + Design Tokens inspirados no Shadcn UI (modo dark nativo).
* **ORM:** Prisma ORM com PostgreSQL 16.
* **Markdown Renderer:** `react-markdown` com plugin `remark-gfm` para tabelas e formatação GitHub-flavored.

### B. Ferramenta de Linha de Comando (`apps/cli` — `ej-cap`)
* **Runtime:** Node.js 20+ (executável via `npx ej-cap`).
* **CLI Parser:** `commander` com subcomandos estruturados (`login`, `status`, `setup`, `verify`).
* **Interatividade de Terminal:**
  - `chalk` para colorização pedagógica (verde = sucesso, amarelo = atenção, vermelho = erro, azul = orientativo).
  - `ora` para spinners animados durante verificações de terminal e requisições HTTP.
* **Process Execution:** `execa` para execução segura de comandos de inspeção (`git`, `docker`, `ssh`).

### C. Pacote Compartilhado (`@inclu/shared`)
* Centraliza todos os enums (`Role`, `StageStatus`, `ValidationType`) e DTOs de comunicação, garantindo que qualquer alteração de contrato entre a CLI e a Web seja detectada em tempo de compilação.
