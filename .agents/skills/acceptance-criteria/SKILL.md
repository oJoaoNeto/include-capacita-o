---
name: acceptance-criteria
description: >-
  Documenta, formaliza e audita os Critérios de Aceite (Acceptance Criteria) e a
  Definição de Pronto (Definition of Done - DoD) para as 17 micro-etapas e
  funcionalidades da plataforma Capacitação inclu.
---

# Acceptance Criteria & Definition of Done Skill

Esta skill define o padrão para documentar e auditar os **Critérios de Aceite** e a **Definição de Pronto (DoD)** de cada funcionalidade e micro-etapa curricular da plataforma **Capacitação inclu**.

---

## 1. Localização dos Documentos de Critérios de Aceite

Os critérios formais de aceite residem em:
`docs/acceptance-criteria/`

- `docs/acceptance-criteria/stages/`: Critérios detalhados de cada uma das 17 micro-etapas (1.1 a 3.4).
- `docs/acceptance-criteria/rbac-and-auth.md`: Critérios de autenticação, sala de espera e papéis.
- `docs/acceptance-criteria/admin-matrix.md`: Critérios da matriz de acompanhamento e auditoria.
- `docs/acceptance-criteria/definition-of-done.md`: Checklist geral de Definition of Done (DoD).

---

## 2. Formato Padrão para Critérios de Aceite (Gherkin / Given-When-Then)

Toda especificação de etapa ou funcionalidade deve conter cenários no formato estruturado:

```markdown
# Critérios de Aceite: Etapa [X.Y] - [Título da Etapa]

## Resumo da Regra de Negócio
[Descrição breve do que precisa ser entregue pelo aluno]

## Cenário 1: Submissão Correta (Caminho Feliz)
* **Dado que** o aluno configurou o ambiente conforme a Missão
* **Quando** o validador inspecionar o estado da etapa
* **Então** a resposta deve ser `passed: true`
* **E** o status em `UserProgress` deve ser alterado para `COMPLETED`
* **E** (para Trainees) a etapa subsequente deve ser desbloqueada (`IN_PROGRESS`).

## Cenário 2: Submissão com Falha Comum
* **Dado que** o aluno cometeu um erro típico [especificar o erro]
* **Quando** o validador inspecionar o estado da etapa
* **Então** a resposta deve ser `passed: false`
* **E** o contador `attempts` deve ser incrementado em 1
* **E** a mensagem `feedbackMsg` deve explicar pedagogicamente como corrigir.

## Cenário 3: Liberação de Dicas Progressivas (RF07)
* **Dado que** o aluno falhou pela 1ª vez (`attempts == 1`)
* **Então** a interface deve desbloquear a Dica 1
* **Dado que** o aluno falhou pela 2ª vez (`attempts >= 2`)
* **Então** a interface deve desbloquear a Dica 2.
```

---

## 3. Definição de Pronto (Definition of Done - DoD)

Uma micro-etapa ou funcionalidade só é considerada **Pronta (Done)** se cumprir os seguintes itens:

- [ ] **Implementação Completa:** Código escrito e alinhado aos padrões em `docs/standards/`.
- [ ] **Validador Automatizado:**
  - Para Trilhas 1 e 3: Função de inspeção criada na CLI `ej-cap` com testes unitários.
  - Para Trilha 2: Função de consulta à API do GitLab criada no backend com testes mockados.
- [ ] **Conteúdo Pedagógico (RNF04):** Arquivos `theory.md`, `mission.md` e `hints.json` presentes em `packages/content/`.
- [ ] **Tradução de Erros (RF06):** Todos os possíveis estados de erro possuem mensagem acolhedora em português.
- [ ] **Sem Consumo de CI (RNF01):** Verificado que nenhum runner do GitLab é acionado.
- [ ] **Testes Passando:** `npm test` executado com 100% de sucesso.

---

## Procedimento para Documentar uma Nova Etapa

1. Crie o arquivo correspondente em `docs/acceptance-criteria/stages/<slug>.md`.
2. Documente os cenários de sucesso, cenários de falha e mensagens de erro esperadas.
3. Vincule os testes automatizados da CLI ou do backend aos cenários descritos.
