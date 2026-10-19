import chalk from 'chalk';
import ora from 'ora';
import { loginWithToken } from '../api';
import { saveCliConfig } from '../config';

export async function runLogin(token: string, options: { url?: string }): Promise<void> {
  const apiUrl = options.url || process.env.CLI_BACKEND_URL || 'http://localhost:3000';
  const spinner = ora('Validando token com a plataforma Capacitação inclu...').start();

  try {
    const res = await loginWithToken(token, apiUrl);

    if (!res.valid || !res.user) {
      spinner.fail(chalk.red('Token inválido ou não autorizado.'));
      console.log(chalk.yellow('💡 Copie seu token correto acessando seu perfil na plataforma web.\n'));
      process.exit(1);
    }

    saveCliConfig({
      cliToken: token,
      apiUrl,
      user: {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
        cohort: res.user.cohort,
      },
    });

    spinner.succeed(chalk.green(`Autenticado com sucesso como ${chalk.bold(res.user.name || res.user.email)}!`));
    console.log(chalk.gray(`Turma: ${res.user.cohort || 'Geral'} | Papel: ${res.user.role}`));

    if (res.currentStage) {
      console.log(chalk.cyan(`\n🎯 Sua etapa atual é: [${res.currentStage.stepNumber}] ${res.currentStage.title}`));
      console.log(chalk.white(`Para verificar seu progresso, rode: ${chalk.bold.green('ej-cap verify')}\n`));
    }
  } catch (err: any) {
    spinner.fail(chalk.red('Não foi possível conectar ao servidor da plataforma.'));
    console.error(chalk.gray(err.message));
    console.log(chalk.yellow(`\n💡 Certifique-se de que a aplicação web está rodando em ${apiUrl}\n`));
    process.exit(1);
  }
}
