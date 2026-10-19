# Cápsula Teórica: Docker Compose

Projetos reais raramente usam apenas um container: quase sempre temos uma Aplicação Web conectada a um Banco de Dados PostgreSQL.

O **Docker Compose** permite descrever múltiplos containers, redes e volumes em um único arquivo chamado `docker-compose.yml` e subir toda a aplicação com um único comando:

```bash
docker compose up -d
```