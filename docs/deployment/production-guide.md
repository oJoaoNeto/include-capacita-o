# Guia de Deploy em Produção — Plataforma Capacitação inclu

Este documento orienta o deploy, configuração de segurança, variáveis de ambiente e manutenção da plataforma **Capacitação inclu** em ambiente de produção.

---

## 1. Requisitos de Infraestrutura

* **Servidor (VPS ou Cloud):**
  - Mínimo: 1 vCPU, 2 GB RAM (ex: DigitalOcean Basic Droplet, AWS EC2 t3.small, Hetzner CX22).
  - Recomendado: 2 vCPU, 4 GB RAM.
  - SO: Ubuntu 22.04 LTS / 24.04 LTS ou Debian 12.
* **Ferramentas:**
  - Docker Engine $\ge 24.0$
  - Docker Compose Plugin $\ge 2.20$
* **Domínio e DNS:**
  - Apontamento do tipo `A` (IPv4) do seu domínio (ex: `capacitacao.sua-ej.com.br`) para o IP público do servidor.

---

## 2. Passo a Passo do Deploy via Docker Compose

### Passo 1: Clonar o Repositório no Servidor
```bash
git clone https://gitlab.com/sua-empresa-junior/inclu_capacitacao.git /opt/inclu_capacitacao
cd /opt/inclu_capacitacao
```

### Passo 2: Configurar o Arquivo de Variáveis de Ambiente
Crie o arquivo `.env.production` a partir do modelo disponibilizado:
```bash
cp .env.production.example .env.production
nano .env.production
```

Preencha os valores obrigatórios:
1. **`POSTGRES_PASSWORD`**: Gere uma senha forte (ex: `openssl rand -hex 16`).
2. **`NEXTAUTH_SECRET`**: Gere uma chave segura com:
   ```bash
   openssl rand -base64 32
   ```
3. **`NEXTAUTH_URL`**: Defina a URL pública com HTTPS (ex: `https://capacitacao.sua-ej.com.br`).
4. **`GITLAB_CLIENT_ID` e `GITLAB_CLIENT_SECRET`**: Credenciais da aplicação criada no GitLab (veja Seção 3).
5. **`GITLAB_BOT_TOKEN`**: Personal Access Token da conta `@ej-mentor-bot` da EJ.

### Passo 3: Iniciar os Containers de Produção
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

O container `web` executa automaticamente na inicialização:
1. `npx prisma migrate deploy` (aplica migrações pendentes).
2. Inicia o servidor Next.js standalone otimizado na porta `3000`.

### Passo 4: Verificar a Saúde da Aplicação
Consulte o endpoint de healthcheck:
```bash
curl -s http://localhost:3000/api/health | jq .
```
Resposta esperada (`HTTP 200`):
```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "latencyMs": 2
  }
}
```

---

## 3. Configuração do GitLab OAuth 2.0 (Autenticação)

Para que os trainees e membros façam login utilizando suas contas do GitLab.com:

1. Acesse: [https://gitlab.com/-/profile/applications](https://gitlab.com/-/profile/applications)
2. Preencha os campos:
   * **Name:** `Capacitação inclu`
   * **Redirect URI:** `https://capacitacao.sua-ej.com.br/api/auth/callback/gitlab`
   * **Confidential:** Marcado (Yes)
   * **Scopes:**
     - `read_user` (leitura do perfil, nome e avatar do aluno)
     - `api` (leitura de metadados para validação da Trilha 2)
3. Clique em **Save application**.
4. Copie o **Application ID** para `GITLAB_CLIENT_ID` e o **Secret** para `GITLAB_CLIENT_SECRET`.

---

## 4. Configuração do Bot de Code Review (`@ej-mentor-bot`)

Para a **Etapa 2.6 (Passando pelo Code Review)**:

1. Na conta GitLab do bot da sua EJ (ex: `@ej-mentor-bot`), acesse:
   [https://gitlab.com/-/user_settings/personal_access_tokens](https://gitlab.com/-/user_settings/personal_access_tokens)
2. Crie um token com:
   * **Token name:** `Mentor Bot Capacitação`
   * **Expiration date:** 1 ano (ou sem expiração)
   * **Scopes:** `api`
3. Salve o valor gerado na variável `GITLAB_BOT_TOKEN`.

---

## 5. Configuração de HTTPS Reverso com Caddy ou Nginx

Se você utiliza **Caddy** (recomendado pela simplicidade com SSL automático):

Crie `/etc/caddy/Caddyfile`:
```caddy
capacitacao.sua-ej.com.br {
    reverse_proxy localhost:3000
}
```
Recarregue o Caddy:
```bash
sudo systemctl reload caddy
```

---

## 6. Procedimento de Backup do Banco de Dados

Crie um cronjob diário para backup do PostgreSQL:
```bash
# Backup manual
docker exec -t inclu_capacitacao_db_prod pg_dump -U postgres inclu_capacitacao > /var/backups/inclu_$(date +\%F).sql

# Restauração a partir de um backup
cat backup.sql | docker exec -i inclu_capacitacao_db_prod psql -U postgres -d inclu_capacitacao
```

---

## 7. Instruções para os Alunos (Distribuição da CLI)

Os trainees configuram a CLI apontando para o servidor de produção com apenas 2 comandos:

```bash
# 1. Configurar URL do servidor da EJ:
npx @inclu/cli config set-url https://capacitacao.sua-ej.com.br

# 2. Fazer login com o token obtido no perfil web:
npx @inclu/cli login <seu-cliToken>
```
