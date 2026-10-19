---
name: project-scope
description: >-
  Documenta e gerencia o escopo do projeto, personas, limites do MVP, matriz de
  rastreabilidade de requisitos funcionais e controle de mudanças de escopo.
---

# Project Scope & Requirements Skill

Esta skill define o processo para documentar, acompanhar e proteger os limites de escopo da plataforma **Capacitação inclu**, evitando *scope creep* e garantindo entrega pontual do MVP.

---

## 1. Localização da Documentação de Escopo

Toda a documentação relacionada ao escopo do projeto reside em:
`docs/scope/`

Estrutura recomendada:
- `docs/scope/mvp-boundaries.md`: Limites do MVP e Não-Objetivos (*Non-Goals*).
- `docs/scope/user-personas.md`: Detalhamento das 4 personas (`PENDING`, `TRAINEE`, `MEMBER`, `ADMIN`).
- `docs/scope/requirements-traceability.md`: Matriz de rastreabilidade (RF01 a RF12 e RNF01 a RNF04).
- `docs/scope/roadmap.md`: Funcionalidades futuras pós-MVP.

---

## 2. Matriz de Escopo do MVP

### O que está DENTRO do Escopo (In-Scope):
1. **3 Trilhas e 17 Micro-Etapas:**
   - Trilha 1: Git Local (7 etapas)
   - Trilha 2: GitLab Workflow na Nuvem (6 etapas)
   - Trilha 3: Docker Básico (4 etapas)
2. **Controle de Acesso RBAC:**
   - Sala de espera para `PENDING`.
   - Progressão sequencial obrigatória para `TRAINEE`.
   - Modo livre para `MEMBER`.
   - Painel de administração e auditoria para `ADMIN`.
3. **Motores de Validação:**
   - CLI local `ej-cap` (Git e Docker).
   - Motor em nuvem via API REST v4 do GitLab.
   - Bot simulador de code review (`@ej-mentor-bot`).
4. **Matriz de Gestão:**
   - Visualização por turma com alerta vermelho 🔴 para $\ge 3$ falhas em trainees e modal de logs brutos.

### O que está FORA do Escopo (Non-Goals / Out-of-Scope do MVP):
- ❌ Execução de código arbitrário do aluno em sandbox/containers na nuvem (todo Docker é validado na máquina local do aluno).
- ❌ Pipelines de CI/CD automatizadas no GitLab.com (evita custo de minutos de runners).
- ❌ Integração com outras plataformas de Git (GitHub, Bitbucket) — foco exclusivo no ecossistema GitLab da EJ.
- ❌ Gamificação complexa com ranking competitivo ou pontuação financeira (o foco pedagógico é a matriz de aprovação e auxílio a travamentos).

---

## 3. Template para Documentar Mudanças de Escopo (RFC de Escopo)

Quando houver proposta de adicionar ou remover funcionalidades, registre em `docs/scope/rfc/`:

```markdown
# Proposta de Ajuste de Escopo: [Nome da Proposta]

* **Autor:** [Nome]
* **Impacto no MVP:** [ Alto | Médio | Baixo ]
* **Requisitos Afetados:** [ RFxx / RNFxx ]

## 1. Motivação
Por que essa alteração é necessária para o sucesso da capacitação?

## 2. Análise de Viabilidade
- Como isso afeta o prazo de entrega?
- Afeta a restrição de custo zero de CI/CD (RNF01)?
- Afeta a compatibilidade multiplataforma da CLI (RNF03)?

## 3. Veredito da Diretoria/Tech Lead
- [ ] Aprovado para o MVP
- [ ] Postergado para a Fase 2 (Pós-MVP)
- [ ] Rejeitado
```

---

## Procedimento para Atualizar o Escopo

1. Ao criar uma nova funcionalidade, verifique se ela está mapeada nos RFs do PRD.
2. Atualize o arquivo `docs/scope/requirements-traceability.md` marcando a implementação do requisito com link para os arquivos de código correspondentes.
