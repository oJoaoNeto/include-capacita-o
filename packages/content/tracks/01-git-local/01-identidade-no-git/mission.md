# Missão Prática: Identidade no Git

Sua missão nesta etapa é configurar seu nome e e-mail no Git local da sua máquina.

### Passos:
1. Abra seu terminal.
2. Configure seu nome com: `git config --global user.name "Seu Nome"`
3. Configure seu e-mail com: `git config --global user.email "seu.email@exemplo.com"`
4. Em seguida, valide sua entrega rodando no terminal:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
A CLI deve constatar que `git config user.name` e `git config user.email` retornam valores preenchidos e válidos.