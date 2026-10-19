# Missão Prática: O Segredo do .gitignore

Prepare o cenário e instrua o Git a ignorar arquivos de variáveis sensíveis.

### Passos:
1. Execute o comando de setup:
   ```bash
   npx ej-cap setup 1.4
   ```
   *(Isso criará um arquivo simulado chamado `.env` com senhas fictícias).*
2. Crie ou edite o arquivo `.gitignore` e adicione nele a linha:
   ```
   .env
   ```
3. Verifique com:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
O arquivo `.env` não pode constar como arquivo rastreável nem não rastreado no `git status`.