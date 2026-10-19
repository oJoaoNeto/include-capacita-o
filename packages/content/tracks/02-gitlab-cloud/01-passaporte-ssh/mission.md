# Missão Prática: Passaporte SSH

Gere um par de chaves SSH e cadastre a chave pública na sua conta do GitLab.com.

### Passos:
1. Gere sua chave no terminal:
   ```bash
   ssh-keygen -t ed25519 -C "seu.email@exemplo.com"
   ```
2. Copie o conteúdo da chave pública (`cat ~/.ssh/id_ed25519.pub`).
3. No GitLab.com, vá em **Edit Profile > SSH Keys** e adicione a chave.
4. Valide sua conexão com:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
O comando `ssh -T git@gitlab.com` deve responder com a mensagem de boas-vindas do GitLab.