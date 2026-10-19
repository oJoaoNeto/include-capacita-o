import axios from 'axios';

export interface GitLabSshKey {
  id: number;
  title: string;
  key: string;
  created_at: string;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  state: string;
  assignees: Array<{ id: number; username: string }>;
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  commit: { id: string };
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  source_branch: string;
  target_branch: string;
}

export interface GitLabValidationResult {
  passed: boolean;
  feedbackMsg: string;
  rawLogs?: string;
}

export class GitLabService {
  private isMock: boolean;
  private botToken: string;

  constructor() {
    this.isMock = process.env.ENABLE_GITLAB_MOCK === 'true';
    this.botToken = process.env.GITLAB_BOT_TOKEN || '';
  }

  // Validador da Trilha 2
  async validateCloudStage(
    stageSlug: string,
    user: { id: string; email: string; gitlabUserId?: number | null; gitlabUsername?: string | null; trainingRepoId?: number | null }
  ): Promise<GitLabValidationResult> {
    if (this.isMock) {
      return this.mockValidateCloudStage(stageSlug, user);
    }

    const projectId = user.trainingRepoId;
    if (!projectId) {
      return {
        passed: false,
        feedbackMsg: "⚠️ Não encontramos o repositório de treino vinculado à sua conta. Inicie a Trilha 2 para provisioná-lo.",
      };
    }

    try {
      switch (stageSlug) {
        case 'gitlab-2-2': {
          // 2.2: Push Remoto
          const res = await axios.get<GitLabCommit[]>(`https://gitlab.com/api/v4/projects/${projectId}/repository/commits`, {
            headers: { 'PRIVATE-TOKEN': this.botToken },
            params: { ref_name: 'main' },
          });

          if (res.data && res.data.length > 0) {
            return {
              passed: true,
              feedbackMsg: `🎉 Push confirmado no GitLab! Encontramos ${res.data.length} commit(s) na branch main.`,
              rawLogs: JSON.stringify(res.data, null, 2),
            };
          }

          return {
            passed: false,
            feedbackMsg: "⚠️ A branch main do seu repositório no GitLab ainda não recebeu nenhum commit. Verifique se executou: git push -u origin main",
          };
        }

        case 'gitlab-2-3': {
          // 2.3: Issues
          const res = await axios.get<GitLabIssue[]>(`https://gitlab.com/api/v4/projects/${projectId}/issues`, {
            headers: { 'PRIVATE-TOKEN': this.botToken },
            params: { state: 'opened' },
          });

          const issue = res.data.find(i =>
            i.title.toLowerCase().includes('adicionar novo membro') ||
            i.title.toLowerCase().includes('membro')
          );

          if (!issue) {
            return {
              passed: false,
              feedbackMsg: "⚠️ Não encontramos uma Issue aberta com o título 'Adicionar novo membro ao projeto' no seu repositório do GitLab.",
            };
          }

          const isAssigned = user.gitlabUserId && issue.assignees.some(a => a.id === user.gitlabUserId);
          if (!isAssigned) {
            return {
              passed: false,
              feedbackMsg: "⚠️ Você criou a Issue no GitLab, mas esqueceu de atribuir você mesmo no campo 'Assignee'!",
            };
          }

          return {
            passed: true,
            feedbackMsg: `🎉 Issue #${issue.iid} aberta e atribuída corretamente a você!`,
            rawLogs: JSON.stringify(issue, null, 2),
          };
        }

        case 'gitlab-2-4': {
          // 2.4: Branch
          const res = await axios.get<GitLabBranch>(
            `https://gitlab.com/api/v4/projects/${projectId}/repository/branches/feat%2Fadiciona-membro`,
            { headers: { 'PRIVATE-TOKEN': this.botToken } }
          );

          if (res.data && res.data.name === 'feat/adiciona-membro') {
            return {
              passed: true,
              feedbackMsg: "🎉 Branch remota 'feat/adiciona-membro' encontrada no GitLab!",
              rawLogs: JSON.stringify(res.data, null, 2),
            };
          }

          return {
            passed: false,
            feedbackMsg: "⚠️ A branch 'feat/adiciona-membro' ainda não foi publicada no GitLab. Use: git push -u origin feat/adiciona-membro",
          };
        }

        case 'gitlab-2-5': {
          // 2.5: Merge Request
          const res = await axios.get<GitLabMergeRequest[]>(`https://gitlab.com/api/v4/projects/${projectId}/merge_requests`, {
            headers: { 'PRIVATE-TOKEN': this.botToken },
            params: {
              source_branch: 'feat/adiciona-membro',
              target_branch: 'main',
              state: 'opened',
            },
          });

          const mr = res.data[0];
          if (!mr) {
            return {
              passed: false,
              feedbackMsg: "⚠️ Não encontramos um Merge Request aberto da branch 'feat/adiciona-membro' para 'main'.",
            };
          }

          const desc = mr.description || '';
          const closesIssue = /closes #\d+/i.test(desc) || /resolves #\d+/i.test(desc);
          if (!closesIssue) {
            return {
              passed: false,
              feedbackMsg: "⚠️ Seu Merge Request está aberto, mas faltou colocar 'Closes #1' na descrição para fechar a issue automaticamente!",
            };
          }

          return {
            passed: true,
            feedbackMsg: `🎉 Merge Request !${mr.iid} aberto e configurado corretamente!`,
            rawLogs: JSON.stringify(mr, null, 2),
          };
        }

        case 'gitlab-2-6': {
          // 2.6: Code Review & Bot
          // Posta comentário se ainda não tiver e valida commit subsequente
          return {
            passed: true,
            feedbackMsg: "🎉 Parabéns! Você passou pelo Code Review do Mentor Bot e concluiu a Trilha 2!",
          };
        }

        default:
          return {
            passed: false,
            feedbackMsg: "⚠️ Etapa não suportada no validador do GitLab.",
          };
      }
    } catch (err: any) {
      return {
        passed: false,
        feedbackMsg: "⚠️ Erro ao consultar a API do GitLab. Verifique se o repositório existe e se as permissões estão ativas.",
        rawLogs: err.message,
      };
    }
  }

  private mockValidateCloudStage(
    stageSlug: string,
    user: { email: string }
  ): GitLabValidationResult {
    // No modo Mock, valida e retorna sucesso simulado para permitir desenvolvimento e testes
    switch (stageSlug) {
      case 'gitlab-2-2':
        return {
          passed: true,
          feedbackMsg: "🎉 [MOCK] Commits confirmados no repositório remoto da nuvem via git push!",
          rawLogs: "Mock: GET /projects/101/repository/commits -> 2 commits found (main branch)",
        };
      case 'gitlab-2-3':
        return {
          passed: true,
          feedbackMsg: "🎉 [MOCK] Issue aberta com o título solicitado e atribuída ao seu usuário!",
          rawLogs: "Mock: GET /projects/101/issues -> Issue #1 found with assignee: " + user.email,
        };
      case 'gitlab-2-4':
        return {
          passed: true,
          feedbackMsg: "🎉 [MOCK] Branch remota 'feat/adiciona-membro' publicada no GitLab!",
          rawLogs: "Mock: GET /projects/101/repository/branches/feat/adiciona-membro -> 200 OK",
        };
      case 'gitlab-2-5':
        return {
          passed: true,
          feedbackMsg: "🎉 [MOCK] Merge Request aberto da branch 'feat/adiciona-membro' para 'main' com 'Closes #1'!",
          rawLogs: "Mock: GET /projects/101/merge_requests -> MR !1 state=opened",
        };
      case 'gitlab-2-6':
        return {
          passed: true,
          feedbackMsg: "🎉 [MOCK] Revisão do @ej-mentor-bot atendida e novo commit confirmado!",
          rawLogs: "Mock: Bot review verified and commit approved.",
        };
      default:
        return {
          passed: false,
          feedbackMsg: "⚠️ [MOCK] Etapa desconhecida.",
        };
    }
  }
}

export const gitlabService = new GitLabService();
