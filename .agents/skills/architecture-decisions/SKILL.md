---
name: architecture-decisions
description: >-
  Documenta e gerencia Registros de Decisão de Arquitetura (ADRs - Architecture
  Decision Records), topologia do sistema, modelo híbrido de validação e trade-offs
  arquiteturais da plataforma Capacitação inclu.
---

# Architecture Decisions & ADR Skill

Esta skill padroniza o registro e a governança das **Decisões de Arquitetura de Software (ADRs)** e da topologia técnica da plataforma **Capacitação inclu**.

---

## 1. Localização e Nomenclatura dos Documentos

Todas as decisões arquiteturais devem ser registradas em:
`docs/adr/`

Convenção de nomenclatura:
`docs/adr/NNNN-<nome-da-decisao-em-kebab-case>.md`
(Ex: `docs/adr/0001-arquitetura-hibrida-cli-e-nuvem.md`)

---

## 2. Template Padrão de ADR (Formato Michael Nygard)

Ao registrar uma nova decisão de arquitetura, utilize a seguinte estrutura:

```markdown
# ADR [NNNN]: [Título Curto e Imperativo]

* **Status:** [ Proposta | Aceita | Substituída por ADR-XXXX | Depreciada ]
* **Data:** [ AAAA-MM-DD ]
* **Autores:** [ Nomes ou Papéis ]
* **Requisitos Relacionados:** [ Ex: RF08, RNF01 ]

## Contexto e Forças Motrizes
Descreva o cenário técnico ou pedagógico que exigiu uma tomada de decisão.
- Quais restrições existem (ex: custo zero de CI/CD, alunos com Windows/macOS/Linux)?
- Quais eram as alternativas consideradas?

## Decisão Tomada
Declare claramente a decisão adotada e o racional técnico:
"Optamos por [escolha tecnológica / padrão arquitetural], porque [motivação principal]."

## Consequências
### Positivas (+)
- Benefícios técnicos, facilidade de manutenção ou eliminação de custos.

### Negativas ou Riscos (-)
- Débitos técnicos aceitos, complexidade adicional ou limitações conhecidas.

### Estratégias de Mitigação
- Como o time contornará os pontos negativos identificados.
```

---

## 3. Catálogo Inicial de Decisões Essenciais do Projeto

A skill deve registrar e manter as seguintes decisões fundamentais já consolidadas no PRD:

1. **ADR-0001: Validação Híbrida (CLI Local para Git/Docker e Nuvem para GitLab)**
   - *Racional:* Permite inspecionar o sistema operacional do aluno sem custos de infraestrutura e sem necessidade de rodar Docker em servidores remotos caros.
2. **ADR-0002: Custo Zero de Minutos de CI/CD no GitLab.com (RNF01)**
   - *Racional:* Inspeção de metadados via API REST v4 (`GET /projects`, `/issues`, `/merge_requests`) ao invés de acionar pipelines e runners compartilhados.
3. **ADR-0003: Conteúdo Pedagógico Desacoplado em Markdown (RNF04)**
   - *Racional:* Membros e instrutores podem editar cápsulas teóricas e enunciados sem alterar schemas de banco de dados ou código da aplicação.
4. **ADR-0004: Autenticação Dupla (GitLab OAuth para Web + cliToken UUID para CLI)**
   - *Racional:* Trainees não precisam gerar ou colar tokens pessoais do GitLab no terminal local; o `cliToken` é gerado pela aplicação web e revogável.

---

## Procedimento para Documentar uma Decisão

1. Crie o arquivo numerado sequencialmente em `docs/adr/`.
2. Preencha o template detalhando o contexto, alternativas descartadas e consequências.
3. Atualize o índice em `docs/adr/README.md`.
