import execa from 'execa';
import fs from 'fs';
import path from 'path';

export interface ValidationOutput {
  passed: boolean;
  feedbackMsg: string;
  rawLogs?: string;
}

export async function validateGitStage(stepNumber: number): Promise<ValidationOutput> {
  const cwd = process.cwd();

  switch (stepNumber) {
    case 1: {
      // 1.1: Identidade no Git
      try {
        const nameRes = await execa('git', ['config', 'user.name']);
        const emailRes = await execa('git', ['config', 'user.email']);

        const name = nameRes.stdout.trim();
        const email = emailRes.stdout.trim();

        if (!name || name.length < 2) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Seu nome no Git parece incompleto ou vazio. Use: git config --global user.name 'Seu Nome Completo'",
            rawLogs: `user.name="${name}"`,
          };
        }

        if (!email || !email.includes('@')) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Seu e-mail no Git parece inválido ou vazio. Use: git config --global user.email 'seu@email.com'",
            rawLogs: `user.email="${email}"`,
          };
        }

        return {
          passed: true,
          feedbackMsg: `🎉 Perfeito! Identidade Git configurada para ${name} <${email}>.`,
          rawLogs: `user.name=${name}\nuser.email=${email}`,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Não encontramos seu nome ou e-mail configurados no Git. Execute os comandos sugeridos na Cápsula Teórica.",
          rawLogs: err.message,
        };
      }
    }

    case 2: {
      // 1.2: Criando a Máquina do Tempo
      try {
        const gitDir = path.join(cwd, '.git');
        if (!fs.existsSync(gitDir)) {
          return {
            passed: false,
            feedbackMsg: "⚠️ A pasta oculta '.git' não foi encontrada. Você executou o comando 'git init' nesta pasta?",
            rawLogs: 'Missing .git directory in ' + cwd,
          };
        }

        const res = await execa('git', ['rev-parse', '--is-inside-work-tree']);
        if (res.stdout.trim() === 'true') {
          return {
            passed: true,
            feedbackMsg: "🎉 Excelente! Máquina do tempo criada: este diretório é agora um repositório Git ativo.",
            rawLogs: res.stdout,
          };
        }

        return {
          passed: false,
          feedbackMsg: "⚠️ Este diretório não é reconhecido como um repositório de trabalho válido pelo Git.",
          rawLogs: res.stdout,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Não encontramos um repositório Git inicializado aqui. Execute 'git init'.",
          rawLogs: err.message,
        };
      }
    }

    case 3: {
      // 1.3: Primeiro Ponto de Salvamento
      try {
        const countRes = await execa('git', ['rev-list', '--count', 'HEAD']);
        const count = parseInt(countRes.stdout.trim(), 10);

        if (isNaN(count) || count < 1) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Nenhum commit foi encontrado no histórico do Git. Lembre-se de preparar os arquivos com 'git add' e gravar com 'git commit'.",
            rawLogs: `rev-list count: ${countRes.stdout}`,
          };
        }

        const statusRes = await execa('git', ['status', '--porcelain']);
        if (statusRes.stdout.trim().length > 0) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Você possui arquivos modificados ainda não salvos no commit! Use 'git add' e finalize com 'git commit'.",
            rawLogs: `git status uncommitted changes:\n${statusRes.stdout}`,
          };
        }

        const logRes = await execa('git', ['log', '-1', '--oneline']);
        return {
          passed: true,
          feedbackMsg: `🎉 Ponto de salvamento confirmado com sucesso! Commit: "${logRes.stdout.trim()}".`,
          rawLogs: logRes.stdout,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Não encontramos commits no repositório. Crie seu arquivo e use 'git add' seguido de 'git commit'.",
          rawLogs: err.message,
        };
      }
    }

    case 4: {
      // 1.4: O Segredo do .gitignore
      try {
        const gitignorePath = path.join(cwd, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
          return {
            passed: false,
            feedbackMsg: "⚠️ O arquivo '.gitignore' não foi encontrado na raiz do projeto.",
            rawLogs: 'Missing .gitignore',
          };
        }

        // Simula ou testa se .env é ignorado
        const ignoreRes = await execa('git', ['check-ignore', '-v', '.env']);
        if (ignoreRes.stdout.includes('.env')) {
          return {
            passed: true,
            feedbackMsg: "🎉 Perfeito! O arquivo .env está devidamente protegido e ignorado pelo Git.",
            rawLogs: ignoreRes.stdout,
          };
        }

        return {
          passed: false,
          feedbackMsg: "⚠️ O arquivo '.env' ainda não está sendo ignorado. Verifique se escreveu '.env' dentro do seu '.gitignore'.",
          rawLogs: ignoreRes.stdout,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ O arquivo '.env' não é ignorado pelo Git. Certifique-se de adicionar a linha '.env' dentro de '.gitignore'.",
          rawLogs: err.message,
        };
      }
    }

    case 5: {
      // 1.5: Universos Paralelos (branch feat/treino)
      try {
        const branchRes = await execa('git', ['branch', '--show-current']);
        const currentBranch = branchRes.stdout.trim();

        if (currentBranch === 'feat/treino') {
          return {
            passed: true,
            feedbackMsg: "🎉 Excelente! Você está na branch paralela 'feat/treino'.",
            rawLogs: `Current branch: ${currentBranch}`,
          };
        }

        return {
          passed: false,
          feedbackMsg: `⚠️ Você está na branch '${currentBranch}', mas a missão pede para criar e entrar na branch 'feat/treino'. Use: git switch -c feat/treino`,
          rawLogs: `Current branch: ${currentBranch}`,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao verificar a branch ativa. Certifique-se de estar dentro do repositório Git.",
          rawLogs: err.message,
        };
      }
    }

    case 6: {
      // 1.6: Unindo Linhas (merge na main)
      try {
        const branchRes = await execa('git', ['branch', '--show-current']);
        const currentBranch = branchRes.stdout.trim();

        if (currentBranch !== 'main' && currentBranch !== 'master') {
          return {
            passed: false,
            feedbackMsg: `⚠️ Para fazer o merge, você precisa estar na branch de destino ('main'). Atualmente você está em '${currentBranch}'. Use: git switch main`,
            rawLogs: `Current branch: ${currentBranch}`,
          };
        }

        // Verifica se o commit da branch feat/treino é ancestral da main
        try {
          await execa('git', ['merge-base', '--is-ancestor', 'feat/treino', currentBranch]);
          return {
            passed: true,
            feedbackMsg: "🎉 Parabéns! As linhas do tempo foram unidas: as alterações da 'feat/treino' agora fazem parte da 'main'!",
            rawLogs: 'feat/treino is ancestor of ' + currentBranch,
          };
        } catch {
          return {
            passed: false,
            feedbackMsg: "⚠️ O histórico da branch 'feat/treino' ainda não foi integrado à branch 'main'. Execute: git merge feat/treino",
            rawLogs: 'feat/treino is NOT ancestor of ' + currentBranch,
          };
        }
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao verificar o merge das branches. Confira se criou a branch 'feat/treino' e fez o merge na 'main'.",
          rawLogs: err.message,
        };
      }
    }

    case 7: {
      // 1.7: Resolvendo seu 1º Conflito
      try {
        const statusRes = await execa('git', ['status', '--porcelain']);
        const statusOutput = statusRes.stdout;

        // Verifica se há arquivos em conflito não resolvidos (ex: marcados com UU)
        if (statusOutput.includes('UU') || statusOutput.includes('AA') || statusOutput.includes('UD')) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Ainda há arquivos marcados em conflito no Git. Finalize a resolução e adicione os arquivos com 'git add'.",
            rawLogs: statusOutput,
          };
        }

        // Busca marcadores de conflito em arquivos rastreados
        try {
          const grepRes = await execa('git', ['grep', '-n', '<<<<<<<']);
          if (grepRes.stdout.trim().length > 0) {
            return {
              passed: false,
              feedbackMsg: "⚠️ Encontramos marcadores '<<<<<<<' ainda presentes no seu código! Apague todos os delimitadores de conflito antes de comitar.",
              rawLogs: grepRes.stdout,
            };
          }
        } catch {
          // grep retornar erro significa que não encontrou marcadores, o que é o desejado!
        }

        // Verifica se o working tree está limpo e o merge foi gravado
        if (statusOutput.trim().length > 0) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Você resolveu o conflito mas ainda não finalizou o commit de merge. Use: git commit -m 'fix: resolve conflito'",
            rawLogs: statusOutput,
          };
        }

        const logRes = await execa('git', ['log', '-1', '--oneline']);
        return {
          passed: true,
          feedbackMsg: `🎉 Sensacional! Você superou o temido conflito de merge como um desenvolvedor profissional! Commit: "${logRes.stdout.trim()}".`,
          rawLogs: logRes.stdout,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao verificar a resolução do conflito. Certifique-se de estar na pasta do exercício.",
          rawLogs: err.message,
        };
      }
    }

    default:
      return {
        passed: false,
        feedbackMsg: `⚠️ Etapa ${stepNumber} da Trilha 1 não possui validador implementado.`,
      };
  }
}
