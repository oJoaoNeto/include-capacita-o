# Missão Prática: Unindo Linhas (merge)

Faça um commit na sua branch `feat/treino` e depois faça o merge dela na branch `main`.

### Passos:
1. Na branch `feat/treino`, crie um arquivo `treino.txt` e faça um commit:
   ```bash
   git add treino.txt
   git commit -m "feat: adiciona treino"
   ```
2. Volte para a branch `main`:
   ```bash
   git switch main
   ```
3. Execute o merge:
   ```bash
   git merge feat/treino
   ```
4. Valide executando:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
O histórico da branch `main` deve conter as alterações commitadas na branch `feat/treino`.