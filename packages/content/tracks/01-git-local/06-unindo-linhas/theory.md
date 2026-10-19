# Cápsula Teórica: Unindo Linhas (merge)

Depois que você testou sua alteração na sua branch paralela, chega a hora de trazer as novidades de volta para a linha principal (`main`). Essa operação se chama **merge** (*mesclagem*).

### Regra de Ouro do Merge:
Você sempre viaja até o destino (a branch que vai **receber** o código) e de lá chama o comando de merge apontando para a branch com as novidades:

```bash
git switch main
git merge feat/treino
```