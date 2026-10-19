# Missão Prática: Orquestrando App + Banco

Suba um ecossistema com dois serviços usando Docker Compose.

### Passos:
1. Execute o comando de setup:
   ```bash
   npx ej-cap setup 3.4
   ```
2. Inicie os serviços configurados:
   ```bash
   docker compose up -d
   ```
3. Valide rodando:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
Os serviços `web` e `db` devem estar ativos com status 'Up' no `docker compose ps`.