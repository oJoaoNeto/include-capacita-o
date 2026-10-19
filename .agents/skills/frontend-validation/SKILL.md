---
name: frontend-validation
description: >-
  Valida a interface gráfica web da plataforma Capacitação inclu (Next.js,
  Tailwind CSS e Shadcn UI), cobrindo jornadas de Trainee, Membro e Admin,
  acessibilidade, responsividade e estados visuais das micro-etapas.
---

# Frontend Validation Skill

Esta skill guia a verificação e homologação da interface gráfica (UI/UX) da plataforma **Capacitação inclu**, construída em **Next.js (App Router) + Tailwind CSS + Shadcn UI**.

---

## Telas e Jornadas a Validar

### 1. Sala de Espera (`/waiting-room`) — Usuário `PENDING`
- [ ] **Bloqueio total:** O usuário não consegue acessar `/learn`, trilhas ou etapas.
- [ ] **Mensagem clara:** Explicação pedagógica informando que a inscrição aguarda aprovação de um Administrador/Diretoria da EJ.
- [ ] **Identificação:** Exibe nome, e-mail e username do GitLab logado, com opção de logout.

### 2. Dashboard do Aluno e Visualizador de Etapas (`/learn`, `/tracks/[slug]/[step]`)

#### A. Controle de Acesso e Progressão Visual
- [ ] **Perfil `TRAINEE` (Modo Guiado):**
  - Apenas a primeira etapa (`1.1`) ou a próxima etapa não concluída está habilitada.
  - Etapas futuras exibem o ícone de cadeado 🔒 e estado desabilitado.
  - Ao concluir a etapa atual com sucesso, a interface atualiza o estado para a próxima etapa sem recarregamento brusco de página.
- [ ] **Perfil `MEMBER` (Modo Livre):**
  - Todas as 17 etapas de todas as 3 trilhas estão abertas e navegáveis livremente desde o primeiro acesso.
  - O progresso realizado ainda é marcado com check verde ✅.

#### B. Interface "Conceito + Prática" (RF04)
- [ ] **Cápsula Teórica:**
  - Renderiza o Markdown de `theoryMd` com tipografia legível, blocos de código com destaque de sintaxe e tabelas de comandos estilizadas.
- [ ] **Missão Prática:**
  - Exibe instruções claras da entrega esperada.
  - Exibe o comando da CLI sugerido (`npx ej-cap setup <etapa>` ou `npx ej-cap verify`).
- [ ] **Dicas Progressivas Desbloqueáveis (RF07):**
  - Acordeão de dicas oculto por padrão.
  - Após **1 falha** de validação: Dica 1 é desbloqueada automaticamente.
  - Após **2 falhas** de validação: Dica 2 é desbloqueada exibindo a estrutura quase completa do comando esperado.
- [ ] **Botão "Copiar Token da CLI":**
  - Fácil acesso na barra superior ou perfil para copiar o comando de autenticação: `npx ej-cap login <cliToken>`.

#### C. Validador Web em Tempo Real (Trilha 2 - GitLab)
- [ ] Para etapas do GitLab (tipo `GITLAB_API`), exibe botão "Verificar Missão".
- [ ] Exibe spinner/loading claro durante a verificação via API do GitLab.
- [ ] Exibe feedback traduzido em português (RF06) em caso de sucesso ou erro (ex: *"⚠️ Você criou a Issue no GitLab, mas esqueceu de atribuir você mesmo no campo 'Assignee'"*).

### 3. Painel de Gestão da Diretoria (`/admin`)

#### A. Aba de Aprovações Pendentes
- [ ] Lista usuários com role `PENDING`.
- [ ] Permite ao Admin selecionar a Turma (`cohort`) e a Role (`TRAINEE`, `MEMBER`, `ADMIN`) e aprovar em 1 clique.

#### B. Matriz de Acompanhamento de Trainees (RF11)
- [ ] Tabela em grade (Linhas = Trainees da turma; Colunas = 17 Etapas).
- [ ] Filtro rápido por Turma (`cohort`, ex: *"PS 2026.2"*).
- [ ] Badges visuais de status:
  - 🟢 Concluído (com data/hora de conclusão).
  - 🟡 Em andamento.
  - ⚪ Bloqueado / Não iniciado.
- [ ] **Alerta Crítico em Vermelho 🔴:** Usuário que falhou **3 ou mais vezes** na mesma etapa recebe destaque visual imediato (badge vermelha pulsante / ícone de alerta) para intervenção pedagógica rápida.

#### C. Auditoria de Logs (RF12)
- [ ] Ao clicar em qualquer célula da matriz, abre um Drawer/Dialog (`Shadcn Dialog`) exibindo:
  - Lista de todas as tentativas do usuário naquela etapa com timestamps.
  - O feedback exibido ao aluno.
  - O log bruto (`rawLogs`) retornado pelo terminal ou pela API do GitLab para suporte técnico da mentoria.

#### D. Aba de Upskilling de Membros
- [ ] Matriz separada para membros efetivos exibindo o progresso acumulado, sem notificações de atraso ou alertas de cobrança.

---

## Procedimento de Validação Frontend

1. **Validação de Build e Tipos:**
   ```bash
   npm run build --workspace=apps/web
   ```
2. **Checagem de Responsividade e Componentes:**
   - Inspecione a visualização em resoluções Desktop (1920x1080 e 1366x768) e Notebook/Tablet.
   - Verifique o comportamento do layout de duas colunas (Cápsula Teórica à esquerda e Missão à direita).
3. **Teste de Estados (RBAC UI Simulation):**
   - Alterne entre perfis de teste (`pending@ej.com`, `trainee@ej.com`, `member@ej.com`, `admin@ej.com`) para certificar-se de que os componentes respeitam as restrições de cada papel.
