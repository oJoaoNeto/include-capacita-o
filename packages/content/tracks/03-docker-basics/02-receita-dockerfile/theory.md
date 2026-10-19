# Cápsula Teórica: A Receita do Dockerfile

Uma **Imagem Docker** é o molde congelado de um container. O **Dockerfile** é o arquivo de texto que contém a receita passo a passo para construir essa imagem.

### Instruções Principais do Dockerfile:
- `FROM`: Imagem base da qual você parte (ex: `nginx:alpine`).
- `COPY`: Copia arquivos do seu computador para dentro da imagem.
- `EXPOSE`: Documenta a porta de rede utilizada.