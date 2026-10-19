# Missão Prática: Seu Primeiro Container

Inicie um servidor web Nginx em um container Docker expondo a porta 8080.

### Passos:
1. Execute no seu terminal:
   ```bash
   docker run -d -p 8080:80 --name meu-nginx nginx
   ```
2. Abra seu navegador em `http://localhost:8080` e veja a página padrão do Nginx.
3. Valide sua entrega:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
Um container Nginx ativo respondendo requisições HTTP 200 na porta 8080 da máquina local.