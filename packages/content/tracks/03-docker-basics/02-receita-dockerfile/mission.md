# Missão Prática: Criando seu Próprio Site em Container

Construa uma imagem customizada que sirva um arquivo HTML.

### Passos:
1. Execute o comando de setup:
   ```bash
   npx ej-cap setup 3.2
   ```
2. Crie um arquivo `Dockerfile` com o conteúdo:
   ```dockerfile
   FROM nginx:alpine
   COPY index.html /usr/share/nginx/html/index.html
   EXPOSE 80
   ```
3. Construa a imagem com o comando:
   ```bash
   docker build -t site-ej:v1 .
   ```
4. Valide rodando:
   ```bash
   npx ej-cap verify
   ```

### Critério de Aceite
A imagem `site-ej:v1` deve existir no Docker local construída com sucesso a partir do Dockerfile.