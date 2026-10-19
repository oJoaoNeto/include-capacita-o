# Missão Prática: Resolvendo seu 1º Conflito

Resolva com calma o cenário de conflito preparado para você.

### Passos:
1. Execute o comando de setup para gerar o conflito proposital:
   ```bash
   npx ej-cap setup 1.7
   ```
2. Abra o arquivo indicado (`calculadora.js`) no seu editor.
3. Remova todos os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) e escolha a implementação correta.
4. Salve o arquivo e finalize o merge:
   ```bash
   git add calculadora.js
   git commit -m "fix: resolve conflito na calculadora"
   ```
5. Valide rodando:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
O merge deve estar concluído e nenhum arquivo no repositório pode conter marcadores `<<<<<<<`.