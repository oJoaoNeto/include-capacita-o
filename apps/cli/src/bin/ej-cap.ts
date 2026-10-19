#!/usr/bin/env node

import { Command } from 'commander';
import { runLogin } from '../commands/login';
import { runStatus } from '../commands/status';
import { runSetup } from '../commands/setup';
import { runVerify } from '../commands/verify';

const program = new Command();

program
  .name('ej-cap')
  .description('Plataforma Hands-On de Treinamento e Capacitação da Empresa Júnior')
  .version('1.0.0');

program
  .command('login <token>')
  .description('Autentica o terminal local utilizando seu cliToken da plataforma web')
  .option('-u, --url <url>', 'URL base da API da plataforma (padrão: http://localhost:3001)')
  .action((token, options) => {
    runLogin(token, options);
  });

program
  .command('status')
  .description('Exibe seu progresso atual, turma e etapa em andamento')
  .action(() => {
    runStatus();
  });

program
  .command('setup <stage>')
  .description('Prepara arquivos locais e cenários práticos para a etapa (ex: ej-cap setup 1.7)')
  .action((stage) => {
    runSetup(stage);
  });

program
  .command('verify')
  .description('Executa as inspeções locais de Git ou Docker e notifica o backend em caso de aprovação')
  .action(() => {
    runVerify();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
