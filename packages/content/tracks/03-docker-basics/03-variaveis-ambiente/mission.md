# Missão Prática: Injetando Variáveis de Ambiente

Inicie um container passando a variável de ambiente solicitada.

### Passos:
1. Execute um container com a variável de ambiente `TRAINEE_EJ=true`:
   ```bash
   docker run -d --name container-trainee -e TRAINEE_EJ=true alpine sleep 3600
   ```
2. Valide executando:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
O container ativo deve conter a variável de ambiente `TRAINEE_EJ=true` confirmada via `docker inspect`.