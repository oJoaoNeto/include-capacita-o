import execa from 'execa';
import axios from 'axios';
import { ValidationOutput } from './git';

export async function validateDockerStage(stepNumber: number): Promise<ValidationOutput> {
  // Pré-verificação: Docker daemon está rodando?
  try {
    await execa('docker', ['info'], { timeout: 3000 });
  } catch (err: any) {
    return {
      passed: false,
      feedbackMsg: "⚠️ O Docker daemon não parece estar rodando na sua máquina. Inicie o Docker Desktop ou o serviço do Docker antes de verificar.",
      rawLogs: err.message,
    };
  }

  switch (stepNumber) {
    case 1: {
      // 3.1: Seu Primeiro Container (Nginx na porta 8080)
      try {
        const psRes = await execa('docker', ['ps', '--format', '{{.Image}}\t{{.Ports}}\t{{.Names}}']);
        const psOutput = psRes.stdout;

        const hasNginx = psOutput.toLowerCase().includes('nginx');
        const has8080 = psOutput.includes('8080');

        if (!hasNginx || !has8080) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Não encontramos um container Nginx rodando e mapeando a porta 8080. Use: docker run -d -p 8080:80 --name meu-nginx nginx",
            rawLogs: `Active containers:\n${psOutput}`,
          };
        }

        // Testa conexão HTTP
        try {
          const httpRes = await axios.get('http://localhost:8080', { timeout: 3000 });
          if (httpRes.status === 200) {
            return {
              passed: true,
              feedbackMsg: "🎉 Excelente! Container Nginx ativo e respondendo perfeitamente na porta 8080 (HTTP 200).",
              rawLogs: `HTTP ${httpRes.status} OK`,
            };
          }
        } catch (httpErr: any) {
          return {
            passed: false,
            feedbackMsg: "⚠️ O container está listado no Docker, mas não respondeu na porta http://localhost:8080. Verifique se o mapeamento '-p 8080:80' foi configurado.",
            rawLogs: httpErr.message,
          };
        }

        return {
          passed: true,
          feedbackMsg: "🎉 Container Nginx ativo na porta 8080!",
          rawLogs: psOutput,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao inspecionar containers Docker ativos. Verifique se o comando 'docker ps' funciona no seu terminal.",
          rawLogs: err.message,
        };
      }
    }

    case 2: {
      // 3.2: Receita de Bolo (Dockerfile)
      try {
        const imageRes = await execa('docker', ['image', 'inspect', 'site-ej:v1'], { reject: false });
        if (imageRes.exitCode === 0) {
          return {
            passed: true,
            feedbackMsg: "🎉 Parabéns! Sua imagem customizada 'site-ej:v1' foi construída com sucesso a partir do seu Dockerfile!",
            rawLogs: 'Image site-ej:v1 inspected successfully.',
          };
        }

        return {
          passed: false,
          feedbackMsg: "⚠️ Não encontramos a imagem 'site-ej:v1' no seu Docker local. Certifique-se de executar 'docker build -t site-ej:v1 .' dentro da pasta do Dockerfile.",
          rawLogs: imageRes.stderr || imageRes.stdout,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao verificar a imagem Docker.",
          rawLogs: err.message,
        };
      }
    }

    case 3: {
      // 3.3: Variáveis de Ambiente (-e TRAINEE_EJ)
      try {
        const psRes = await execa('docker', ['ps', '-q']);
        const containerIds = psRes.stdout.trim().split(/\s+/).filter(Boolean);

        if (containerIds.length === 0) {
          return {
            passed: false,
            feedbackMsg: "⚠️ Nenhum container Docker está rodando no momento. Inicie seu container com a flag '-e TRAINEE_EJ=true'.",
            rawLogs: 'No running containers found.',
          };
        }

        for (const id of containerIds) {
          const inspectRes = await execa('docker', ['inspect', id, '--format', '{{json .Config.Env}}']);
          if (inspectRes.stdout.includes('TRAINEE_EJ')) {
            return {
              passed: true,
              feedbackMsg: "🎉 Muito bem! Variável de ambiente 'TRAINEE_EJ' detectada dentro do container em execução!",
              rawLogs: `Found in container ${id}: ${inspectRes.stdout}`,
            };
          }
        }

        return {
          passed: false,
          feedbackMsg: "⚠️ Encontramos containers rodando, mas nenhum deles possui a variável 'TRAINEE_EJ' configurada. Execute com: -e TRAINEE_EJ=true",
          rawLogs: `Inspected ${containerIds.length} container(s), no TRAINEE_EJ found.`,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Erro ao inspecionar variáveis de ambiente dos containers.",
          rawLogs: err.message,
        };
      }
    }

    case 4: {
      // 3.4: Orquestrando com Compose
      try {
        const composeRes = await execa('docker', ['compose', 'ps', '--format', 'json'], { reject: false });
        let output = composeRes.stdout;

        if (composeRes.exitCode !== 0) {
          // Tenta docker-compose com hífen como fallback
          const legacyRes = await execa('docker-compose', ['ps'], { reject: false });
          output = legacyRes.stdout;
        }

        const isRunning = output.toLowerCase().includes('running') || output.toLowerCase().includes('up');

        if (isRunning) {
          return {
            passed: true,
            feedbackMsg: "🎉 Excelente! Seus múltiplos serviços orquestrados via Docker Compose estão ativos e saudáveis!",
            rawLogs: output,
          };
        }

        return {
          passed: false,
          feedbackMsg: "⚠️ Os serviços do Docker Compose não estão rodando. Certifique-se de executar 'docker compose up -d' dentro da pasta com o arquivo docker-compose.yml.",
          rawLogs: output,
        };
      } catch (err: any) {
        return {
          passed: false,
          feedbackMsg: "⚠️ Não conseguimos inspecionar o status do Docker Compose.",
          rawLogs: err.message,
        };
      }
    }

    default:
      return {
        passed: false,
        feedbackMsg: `⚠️ Etapa ${stepNumber} da Trilha 3 não possui validador implementado.`,
      };
  }
}
