import execa from 'execa';
import { ValidationOutput } from './git';

export async function validateGitLabLocalStage(stepNumber: number): Promise<ValidationOutput> {
  if (stepNumber === 1) {
    // 2.1: Passaporte SSH (ssh -T git@gitlab.com)
    try {
      // O comando ssh -T retorna exit code 1 no GitLab mesmo quando o handshake é bem-sucedido
      const res = await execa('ssh', ['-T', '-o', 'StrictHostKeyChecking=accept-new', 'git@gitlab.com'], {
        reject: false,
      });

      const output = `${res.stdout} ${res.stderr}`;

      if (output.includes('Welcome to GitLab') || output.includes('authenticated')) {
        return {
          passed: true,
          feedbackMsg: "🎉 Conexão SSH estabelecida com o GitLab.com com sucesso! Seu passaporte para a nuvem está carimbado.",
          rawLogs: output,
        };
      }

      if (output.includes('Permission denied (publickey)')) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Permissão negada pelo GitLab (Permission denied). Certifique-se de ter cadastrado sua chave pública (~/.ssh/id_ed25519.pub) no seu perfil do GitLab.com.",
          rawLogs: output,
        };
      }

      return {
        passed: false,
        feedbackMsg: "⚠️ Não conseguimos confirmar a autenticação SSH com o GitLab. Verifique se sua chave SSH foi gerada e adicionada.",
        rawLogs: output,
      };
    } catch (err: any) {
      return {
        passed: false,
        feedbackMsg: "⚠️ Erro ao executar teste de SSH. Verifique sua conexão com a internet.",
        rawLogs: err.message,
      };
    }
  }

  return {
    passed: false,
    feedbackMsg: "⚠️ As etapas subsequentes da Trilha 2 são validadas diretamente pela nuvem na interface web da plataforma.",
  };
}
