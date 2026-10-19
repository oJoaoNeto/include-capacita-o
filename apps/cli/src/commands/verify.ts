import chalk from 'chalk';
import ora from 'ora';
import { getStatus, submitVerification } from '../api';
import { getCliConfig } from '../config';
import { validateGitStage } from '../validators/git';
import { validateGitLabLocalStage } from '../validators/gitlab';
import { validateDockerStage } from '../validators/docker';

export async function runVerify(): Promise<void> {
  const config = getCliConfig();
  if (!config) {
    console.log(chalk.yellow('\n⚠️ Você precisa fazer login antes de validar uma etapa.'));
    console.log(chalk.white('Execute: ') + chalk.bold.green('npx ej-cap login <seu-cliToken>\n'));
    process.exit(1);
  }

  const statusSpinner = ora('Buscando etapa ativa...').start();
  let currentStage;

  try {
    const statusRes = await getStatus();
    currentStage = statusRes.currentStage;
    statusSpinner.stop();
  } catch (err: any) {
    statusSpinner.fail(chalk.red('Falha ao conectar ao servidor para obter a etapa ativa.'));
    console.error(chalk.gray(err.message));
    process.exit(1);
  }

  if (!currentStage) {
    console.log(chalk.green('\n🎉 Nenhuma etapa pendente para validação. Você já completou as etapas liberadas!\n'));
    return;
  }

  console.log(chalk.bold.blue(`\n🔍 Verificando: [${currentStage.stepNumber}] ${currentStage.title} (${currentStage.slug})`));
  console.log(chalk.gray(`Trilha: ${currentStage.trackTitle}`));

  const verifySpinner = ora('Executando inspeções no ambiente local...').start();
  let result;

  try {
    if (currentStage.trackSlug === 'git-local') {
      result = await validateGitStage(currentStage.stepNumber);
    } else if (currentStage.trackSlug === 'gitlab-cloud') {
      if (currentStage.stepNumber === 1) {
        result = await validateGitLabLocalStage(1);
      } else {
        verifySpinner.info(chalk.yellow('Esta etapa da Trilha 2 é validada na nuvem!'));
        console.log(chalk.white('\n👉 Acesse o dashboard na web e clique no botão ') + chalk.bold.cyan('Verificar Missão') + chalk.white('!\n'));
        return;
      }
    } else if (currentStage.trackSlug === 'docker-basics') {
      result = await validateDockerStage(currentStage.stepNumber);
    } else {
      verifySpinner.fail(chalk.red('Trilha desconhecida: ' + currentStage.trackSlug));
      return;
    }
  } catch (err: any) {
    verifySpinner.fail(chalk.red('Erro ao inspecionar o sistema.'));
    console.error(err);
    return;
  }

  if (result.passed) {
    verifySpinner.succeed(chalk.green('Inspeção local aprovada!'));
  } else {
    verifySpinner.fail(chalk.red('Inspeção local não aprovada.'));
  }

  // Notifica o backend com os resultados e logs
  const subSpinner = ora('Enviando relatório para a plataforma inclu...').start();
  try {
    const subRes = await submitVerification({
      stageSlug: currentStage.slug,
      passed: result.passed,
      feedbackMsg: result.feedbackMsg,
      rawLogs: result.rawLogs,
    });

    subSpinner.stop();

    if (result.passed) {
      console.log(chalk.bold.green('\n======================================================'));
      console.log(chalk.bold.green('  ✔ ETAPA CONCLUÍDA COM SUCESSO!                      '));
      console.log(chalk.bold.green('======================================================\n'));
      console.log(chalk.white(result.feedbackMsg));

      if (subRes.unlockedNextStage) {
        console.log(chalk.bold.cyan(`\n🔓 Próxima Etapa Desbloqueada:`));
        console.log(chalk.bold.white(`   [${subRes.unlockedNextStage.stepNumber}] ${subRes.unlockedNextStage.title}`));
        console.log(chalk.gray(`   Abra a plataforma web para ler a Cápsula Teórica!\n`));
      } else {
        console.log(chalk.bold.yellow(`\n🎉 Você completou todas as etapas desta trilha!\n`));
      }
    } else {
      console.log(chalk.bold.yellow('\n======================================================'));
      console.log(chalk.bold.yellow('  ⚠️ AINDA NÃO ESTÁ CORRETO — FEEDBACK DA EJ:         '));
      console.log(chalk.bold.yellow('======================================================\n'));
      console.log(chalk.white(result.feedbackMsg));
      console.log(chalk.gray(`Tentativas registradas: ${subRes.attempts || 1}`));
      console.log(chalk.cyan(`\n💡 Dica: Se precisar de ajuda, consulte as Dicas Progressivas liberadas na interface web!`));
      console.log(chalk.white(`Depois de ajustar, rode novamente: ${chalk.bold.green('ej-cap verify')}\n`));
    }
  } catch (err: any) {
    subSpinner.fail(chalk.red('Falha ao registrar a submissão no servidor.'));
    console.error(chalk.gray(err.message));
  }
}
