import chalk from 'chalk';
import { getCliConfig, saveCliConfig } from '../config';

export function runConfig(action?: string, value?: string): void {
  const current = getCliConfig();

  if (!action || action === 'get') {
    console.log(chalk.bold.blue('\n⚙️  Configurações Atuais da CLI ej-cap:'));
    console.log(chalk.white(`   URL da API:   ${chalk.cyan(current?.apiUrl || 'http://localhost:3000 (padrão)')}`));
    console.log(chalk.white(`   Token Salvo:  ${current?.cliToken ? chalk.green('✔ Configurado (' + current.cliToken.slice(0, 8) + '...)') : chalk.yellow('Nenhum')}`));
    console.log(chalk.white(`   Usuário:      ${current?.user ? `${current.user.name} (${current.user.role})` : chalk.yellow('Não autenticado')}\n`));
    return;
  }

  if (action === 'set-url') {
    if (!value || !value.startsWith('http')) {
      console.log(chalk.red('\n❌ Forneça uma URL válida começando com http:// ou https://'));
      console.log(chalk.gray('Exemplo: ej-cap config set-url https://capacitacao.sua-ej.com.br\n'));
      return;
    }

    saveCliConfig({
      cliToken: current?.cliToken || '',
      apiUrl: value.replace(/\/$/, ''),
      user: current?.user,
    });

    console.log(chalk.green(`\n✔ URL da API atualizada com sucesso para: ${chalk.bold(value)}\n`));
    return;
  }

  console.log(chalk.yellow('\nUso do comando config:'));
  console.log(chalk.white('   ej-cap config               Exibe as configurações atuais'));
  console.log(chalk.white('   ej-cap config set-url <url> Define a URL do servidor de produção\n'));
}
