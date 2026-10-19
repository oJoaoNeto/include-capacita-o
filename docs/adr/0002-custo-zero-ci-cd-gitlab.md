# ADR 0002: Custo Zero de Minutos de CI/CD no GitLab.com

* **Status:** Aceita
* **Data:** 2026-10-19
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RNF01, RF09, RF10

## Contexto e Forças Motrizes
No plano gratuito do GitLab.com para contas de estudantes ou Empresas Juniores, há um limite estrito de minutos mensais de computação nos *Shared Runners* para pipelines de CI/CD.
Se cada submissão de exercício ou verificação de branch acionasse um pipeline com Docker-in-Docker ou runners, uma turma com 30 trainees esgotaria a cota gratuita em poucos dias, gerando faturas financeiras imprevistas ou travamento da capacitação.

## Decisão Tomada
Declaramos como diretriz não-negociável (RNF01) que **nenhuma etapa do MVP acionará pipelines de CI/CD no GitLab.com**.
Todas as verificações da Trilha 2 são executadas através de chamadas leves de leitura à API REST v4 do GitLab:
- `GET /projects/:id/repository/commits` para validar push remoto.
- `GET /projects/:id/issues` para validar tarefas e assignees.
- `GET /projects/:id/repository/branches/:branch` para validar branches de tarefas.
- `GET /projects/:id/merge_requests` para validar abertura de MR.
- `POST /projects/:id/merge_requests/:iid/notes` para postar a nota de revisão pedagógica do `@ej-mentor-bot`.

## Consequências
### Positivas (+)
- Custo financeiro rigorosamente zero para turmas de qualquer tamanho.
- Validação quase instantânea (sub-segundo) ao invés de esperar filas de runners.

### Negativas (-)
- Não testa pipelines complexas no MVP (reservado para capacitações avançadas de DevOps pós-MVP).
