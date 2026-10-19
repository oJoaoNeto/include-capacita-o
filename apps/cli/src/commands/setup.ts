import fs from 'fs';
import path from 'path';
import execa from 'execa';
import chalk from 'chalk';
import ora from 'ora';

export async function runSetup(stageArg: string): Promise<void> {
  const cwd = process.cwd();
  const normalized = stageArg.trim().replace(/^git-/, '').replace(/^docker-/, '');

  console.log(chalk.bold.blue(`\n🚀 Preparando o cenário para a etapa: ${chalk.yellow(stageArg)}`));

  if (normalized === '1.4' || normalized === '1-4') {
    // 1.4: O Segredo do .gitignore
    const envFile = path.join(cwd, '.env');
    fs.writeFileSync(
      envFile,
      '# Variáveis sensíveis e segredos da Empresa Júnior\nDATABASE_URL="postgres://admin:super_secret_password_123@localhost:5432/ej_db"\nAPI_SECRET_KEY="ej_jwt_secret_token_nao_suba_no_git"\n'
    );
    console.log(chalk.green('✔ Arquivo .env criado com senhas simuladas!'));
    console.log(chalk.gray(`Local: ${envFile}`));
    console.log(chalk.cyan("\n👉 Agora crie ou edite seu '.gitignore', adicione a linha '.env' e rode 'ej-cap verify'!\n"));
    return;
  }

  if (normalized === '1.7' || normalized === '1-7') {
    // 1.7: Resolvendo seu 1º Conflito
    const spinner = ora('Configurando repositório e gerando conflito proposital...').start();
    try {
      // 1. Inicia repo se não tiver
      if (!fs.existsSync(path.join(cwd, '.git'))) {
        await execa('git', ['init', '-b', 'main'], { cwd });
      }

      // 2. Commit base na main
      const calcFile = path.join(cwd, 'calculadora.js');
      fs.writeFileSync(
        calcFile,
        '// Calculadora da Empresa Júnior\nfunction somar(a, b) {\n  return a + b;\n}\n\nmodule.exports = { somar };\n'
      );
      await execa('git', ['add', 'calculadora.js'], { cwd });
      await execa('git', ['commit', '-m', 'chore: commit base da calculadora'], { cwd, reject: false });

      // 3. Cria branch de conflito com alteração
      await execa('git', ['switch', '-c', 'feat/conflito'], { cwd });
      fs.writeFileSync(
        calcFile,
        '// Calculadora da Empresa Júnior (Modo Avançado)\nfunction somar(a, b) {\n  // Implementação da branch feat/conflito com validação de números\n  if (typeof a !== "number" || typeof b !== "number") throw new Error("Apenas numeros!");\n  return a + b;\n}\n\nmodule.exports = { somar };\n'
      );
      await execa('git', ['add', 'calculadora.js'], { cwd });
      await execa('git', ['commit', '-m', 'feat: adiciona validacao de tipos na calculadora'], { cwd });

      // 4. Volta para main e faz alteração conflitante nas mesmas linhas
      await execa('git', ['switch', 'main'], { cwd });
      fs.writeFileSync(
        calcFile,
        '// Calculadora da Empresa Júnior (Modo Logging)\nfunction somar(a, b) {\n  // Implementação da branch main com logging no console\n  console.log("Calculando soma de:", a, "+", b);\n  return a + b;\n}\n\nmodule.exports = { somar };\n'
      );
      await execa('git', ['add', 'calculadora.js'], { cwd });
      await execa('git', ['commit', '-m', 'feat: adiciona logs na calculadora'], { cwd });

      // 5. Tenta mergear para provocar o conflito proposital
      await execa('git', ['merge', 'feat/conflito'], { cwd, reject: false });

      spinner.succeed(chalk.green('Cenário de conflito real gerado com sucesso!'));
      console.log(chalk.yellow('\n⚔️  CONFLITO ATIVO em calculadora.js!'));
      console.log(chalk.white('1. Abra o arquivo ') + chalk.bold.cyan('calculadora.js') + chalk.white(' no seu editor.'));
      console.log(chalk.white('2. Remova os marcadores ') + chalk.bold.red('<<<<<<<, =======, >>>>>>>') + chalk.white(' e decida a versão final.'));
      console.log(chalk.white('3. Salve, adicione com ') + chalk.bold.cyan('git add calculadora.js') + chalk.white(' e faça o ') + chalk.bold.cyan('git commit') + chalk.white('.'));
      console.log(chalk.white('4. Execute ') + chalk.bold.green('ej-cap verify') + chalk.white(' para comemorar!\n'));
      return;
    } catch (err: any) {
      spinner.fail(chalk.red('Falha ao gerar cenário de conflito.'));
      console.error(err);
      return;
    }
  }

  if (normalized === '3.2' || normalized === '3-2') {
    // 3.2: Receita de Bolo (Dockerfile)
    const htmlFile = path.join(cwd, 'index.html');
    fs.writeFileSync(
      htmlFile,
      '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>Capacitação EJ</title>\n  <style>body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }</style>\n</head>\n<body>\n  <h1>🚀 Bem-vindo à Plataforma de Capacitação da Empresa Júnior!</h1>\n</body>\n</html>\n'
    );
    console.log(chalk.green('✔ Arquivo index.html gerado na pasta!'));
    console.log(chalk.cyan("\n👉 Agora crie o arquivo 'Dockerfile', construa com 'docker build -t site-ej:v1 .' e rode 'ej-cap verify'!\n"));
    return;
  }

  if (normalized === '3.4' || normalized === '3-4') {
    // 3.4: Orquestrando com Compose
    const composeFile = path.join(cwd, 'docker-compose.yml');
    fs.writeFileSync(
      composeFile,
      'version: "3.8"\n\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "8081:80"\n    restart: always\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: usuario_ej\n      POSTGRES_PASSWORD: senha_secreta_ej\n      POSTGRES_DB: banco_treino\n    ports:\n      - "5439:5432"\n'
    );
    console.log(chalk.green('✔ Arquivo docker-compose.yml de treino criado!'));
    console.log(chalk.cyan("\n👉 Suba os serviços com 'docker compose up -d' e rode 'ej-cap verify'!\n"));
    return;
  }

  console.log(chalk.yellow(`ℹ️ A etapa '${stageArg}' não requer arquivos de setup prévios. Siga as instruções da Missão Prática e execute 'ej-cap verify'.\n`));
}
