# Missão Prática: Passando pelo Code Review

Receba o comentário do Mentor Bot no seu Merge Request e envie a correção solicitada.

### Passos:
1. Clique em **Verificar Missão** para o bot da EJ (`@ej-mentor-bot`) analisar seu MR e postar o comentário de revisão.
2. Acesse seu MR no GitLab e leia o comentário do bot.
3. No seu computador, na branch `feat/adiciona-membro`, faça o ajuste solicitado no arquivo `membros.txt`.
4. Comite e envie o novo commit:
   ```bash
   git add membros.txt
   git commit -m "fix: inclui cargo no arquivo de membros"
   git push origin feat/adiciona-membro
   ```
5. Clique em **Verificar Missão** para concluir a Trilha!

### Critério de Aceite
O MR deve conter um novo commit enviado após a data do comentário do mentor bot.