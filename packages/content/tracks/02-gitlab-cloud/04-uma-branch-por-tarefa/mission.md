# Missão Prática: Uma Branch por Tarefa

Crie uma nova branch localmente, adicione seu nome ao arquivo de membros e publique no GitLab.

### Passos:
1. No seu terminal, crie a branch:
   ```bash
   git switch -c feat/adiciona-membro
   ```
2. Crie ou edite o arquivo `membros.txt` e adicione seu nome.
3. Faça o commit e envie a nova branch para o GitLab:
   ```bash
   git add membros.txt
   git commit -m "feat: adiciona membro ao projeto"
   git push -u origin feat/adiciona-membro
   ```
4. Clique em **Verificar Missão**.

### Critério de Aceite
A branch remota `feat/adiciona-membro` deve estar publicada no GitLab com seu commit.