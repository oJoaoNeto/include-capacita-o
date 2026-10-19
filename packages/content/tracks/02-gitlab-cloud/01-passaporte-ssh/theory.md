# Cápsula Teórica: Passaporte SSH

Para interagir com o GitLab de forma segura sem precisar digitar sua senha a cada comando, usamos chaves criptográficas **SSH** (Secure Shell).

Uma chave SSH é formada por um par:
- **Chave Privada (`id_ed25519`):** Fica trancada no seu computador. Nunca compartilhe!
- **Chave Pública (`id_ed25519.pub`):** Você cadastra no seu perfil do GitLab.com.

Assim, seu computador e o GitLab conversam com segurança máxima!