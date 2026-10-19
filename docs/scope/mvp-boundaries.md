# Limites de Escopo do MVP (Scope Boundaries & Non-Goals)

Este documento define com precisão o que faz parte do MVP da plataforma **Capacitação inclu** e o que está expressamente fora de escopo (*Non-Goals*) para evitar atrasos no cronograma.

---

## 1. Escopo Oficial do MVP

1. **3 Trilhas e 17 Micro-Etapas Práticas:**
   - **Trilha 1 (Git Local):** 7 etapas (1.1 a 1.7) cobrindo desde `git config` até resolução de conflito de merge.
   - **Trilha 2 (GitLab Workflow):** 6 etapas (2.1 a 2.6) cobrindo SSH, push remoto, issues com assignees, branches temáticas, Merge Requests e interação com bot de Code Review.
   - **Trilha 3 (Docker Básico):** 4 etapas (3.1 a 3.4) cobrindo Nginx HTTP 200 na porta 8080, Dockerfile customizado, injeção de variáveis de ambiente (`-e`) e Docker Compose multi-serviço (App + Banco).

2. **Controle de Acesso e RBAC:**
   - `PENDING`: Sala de espera bloqueada até que um admin atribua uma role e turma.
   - `TRAINEE`: Modo guiado sequencial (a etapa $N+1$ só desbloqueia após conclusão da $N$).
   - `MEMBER`: Modo livre sandbox (todas as etapas abertas para consulta e prática avulsa).
   - `ADMIN`: Gestão de turmas, pré-cadastro e matriz de acompanhamento.

3. **Validação Híbrida e Custo Zero (RNF01):**
   - Nenhuma linha de código ou trigger consome minutos de computação de CI/CD no GitLab.com.
   - CLI local `ej-cap` para inspeção local das Trilhas 1 e 3.
   - Motor de nuvem consultando a API REST v4 do GitLab para a Trilha 2.

4. **Matriz de Gestão e Intervenção Pedagógica (RF11, RF12):**
   - Matriz visual por turma com indicador vermelho pulsante 🔴 para alunos que falharem 3+ vezes na mesma etapa.
   - Modal com histórico detalhado de submissões e logs brutos para suporte da mentoria.

---

## 2. O que está FORA de Escopo no MVP (*Non-Goals*)

* ❌ **Execução de Containers Arbitrários em Servidores Remotos:** Todo o Docker é executado e inspecionado estritamente no computador do aluno.
* ❌ **Pipelines e Shared Runners no GitLab.com:** Evita cobrança financeira e filas de execução.
* ❌ **Integração com GitHub ou Bitbucket:** O ecossistema exclusivo adotado pela EJ é o GitLab.
* ❌ **Gamificação Financeira ou Ranqueamento Hostil:** O foco é puramente pedagógico e colaborativo para garantir que todos os trainees aprendam.
