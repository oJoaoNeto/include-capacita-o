import chalk from 'chalk';
import ora from 'ora';
import { getStatus } from '../api';
import { getCliConfig } from '../config';

export async function runStatus(): Promise<void> {
  const config = getCliConfig();
  if (!config) {
    console.log(chalk.yellow('\n⚠️ Você ainda não está autenticado na CLI.'));
    console.log(chalk.white('Para fazer login, copie seu token na plataforma web e execute:'));
    console.log(chalk.bold.green('  npx ej-cap login <seu-cliToken>\n'));
    process.exit(1);
  }

  const spinner = ora('Buscando status e progresso do aluno...').start();

  try {
    const res = await getStatus();
    spinner.stop();

    console.log(chalk.bold.blue('\n========================================'));
    console.log(chalk.bold.blue('    CAPACITAÇÃO INCLU — STATUS DO ALUNO  '));
    console.log(chalk.bold.blue('========================================\n'));

    console.log(chalk.white(`Aluno(a): ${chalk.bold(res.user?.name || res.user?.email)}`));
    console.log(chalk.white(`E-mail:   ${res.user?.email}`));
    console.log(chalk.white(`Papel:    ${chalk.cyan(res.user?.role)}`));
    console.log(chalk.white(`Turma:    ${res.user?.cohort || 'Sem turma definida'}`));

    if (res.currentStage) {
      console.log(chalk.bold.magenta('\n📍 Etapa em Andamento:'));
      console.log(chalk.white(`   Trilha: ${res.currentStage.trackTitle} (${res.currentStage.trackSlug})`));
      console.log(chalk.white(`   Etapa:  [${res.currentStage.stepNumber}] ${res.currentStage.title}`));
      console.log(chalk.white(`   Código: ${chalk.yellow(res.currentStage.slug)}`));
      console.log(chalk.white(`   Tipo:   ${res.currentStage.validationType}`));
    } else {
      console.log(chalk.bold.green('\n🎉 Parabéns! Você concluiu todas as etapas disponíveis!'));
    }

    console.log(chalk.bold.blue('\n========================================\n'));
  } catch (err: any) {
    spinner.fail(chalk.red('Falha ao comunicar com o servidor.'));
    console.error(chalk.gray(err.message));
    process.exit(1);
  }
}
