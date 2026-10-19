# Definição de Pronto (Definition of Done - DoD)

Uma funcionalidade, micro-etapa ou alteração de código na plataforma **Capacitação inclu** só é considerada concluída e pronta para produção se satisfizer todos os critérios listados abaixo.

---

## Checklist da Definição de Pronto

### 1. Código e Tipagem
- [ ] Implementação completa em TypeScript com tipagem estrita (`noImplicitAny`, sem `any` desnecessário).
- [ ] Interfaces compartilhadas e DTOs centralizados em `packages/shared`.
- [ ] Separação clara entre componentes de servidor (Server Components) e de cliente (`'use client'`).

### 2. Validação e Feedback Pedagógico (RF06)
- [ ] A etapa possui critério objetivo de aprovação verificado automaticamente (CLI ou API do GitLab).
- [ ] Mensagens de falha seguem o padrão pedagógico em português, explicando o erro e fornecendo a ação corretiva recomendada.
- [ ] Dicas progressivas (`hints.json`) configuradas: Dica 1 conceitual (após 1 erro) e Dica 2 com a sintaxe do comando esperado (após 2 erros).

### 3. Diretiva de Custo Zero (RNF01)
- [ ] A funcionalidade **não** consome minutos de computação de CI/CD nem aciona pipelines no GitLab.com.
- [ ] Validações em nuvem utilizam estritamente leitura de metadados na REST API v4.

### 4. Conteúdo Desacoplado (RNF04)
- [ ] Textos de teoria (`theory.md`) e missão (`mission.md`) residem em `packages/content/tracks/` em arquivos Markdown independentes.
- [ ] O script de seed (`npm run db:seed`) sincroniza o conteúdo sem corromper o progresso histórico dos usuários.

### 5. Controle de Acesso e Matriz de Gestão (RBAC, RF11, RF12)
- [ ] Acesso respeita o perfil do usuário (`PENDING`, `TRAINEE`, `MEMBER`, `ADMIN`).
- [ ] Usuários com $\ge 3$ falhas consecutivas são sinalizados em vermelho na Matriz do Admin.
- [ ] Submissões registram histórico com data, veredito e log bruto para auditoria.

### 6. Testes e Compilação
- [ ] `npm run build` executa sem erros em todos os workspaces (`@inclu/shared`, `@inclu/content`, `@inclu/cli`, `@inclu/web`).
