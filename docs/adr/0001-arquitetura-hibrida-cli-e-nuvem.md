# ADR 0001: Arquitetura Híbrida de Validação (CLI Local e Nuvem GitLab)

* **Status:** Aceita
* **Data:** 2026-10-19
* **Autores:** Tech Lead & Diretoria de Projetos da EJ
* **Requisitos Relacionados:** RF08, RNF01, RNF02, RNF03

## Contexto e Forças Motrizes
A capacitação de novos trainees de Empresas Juniores precisa ensinar fundamentos do Git, fluxo em equipe no GitLab e conceitos básicos de containers Docker.
Executar containers Docker de múltiplos alunos em servidores na nuvem geraria custos recorrentes de infraestrutura, além de riscos de segurança decorrentes de execução de código arbitrário. Por outro lado, validar o GitLab via terminal local do aluno exigiria tokens pessoais com permissões excessivas ou geração de minutos de CI/CD.

## Decisão Tomada
Adotamos uma **Arquitetura Híbrida**:
1. **Trilhas 1 (Git) e 3 (Docker):** Validadas na máquina local do aluno via ferramenta de linha de comando (`npx ej-cap` em TypeScript/Node.js). A CLI inspeciona o repositório local e os containers Docker ativos, comunicando o resultado assinado via `cliToken` ao backend.
2. **Trilha 2 (GitLab Workflow):** Validada diretamente na nuvem pela aplicação web do backend, consultando a API REST v4 do GitLab.com e orquestrando o bot de Code Review (`@ej-mentor-bot`).

## Consequências
### Positivas (+)
- **Custo Zero:** Elimina necessidade de servidores caros para rodar Docker para dezenas de alunos.
- **Ambiente Real:** O trainee aprende no seu próprio terminal, exatamente como trabalhará nos projetos da EJ.
- **Segurança:** O backend não executa comandos arbitrários; apenas recebe os relatórios das inspeções assinadas por tokens de sessão.

### Negativas (-)
- Requer instalação prévia do Node.js e Docker no computador do aluno.
- Suporte a múltiplos sistemas operacionais (Windows/WSL2, macOS, Linux) pela CLI.
