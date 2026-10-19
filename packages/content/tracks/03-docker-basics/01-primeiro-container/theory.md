# Cápsula Teórica: O que é um Container?

Sabe a famosa frase *"Na minha máquina funciona, mas na sua não"*? O **Docker** foi criado para exterminar esse problema.

Um container é como uma caixinha isolada e autossuficiente que contém todo o software necessário para rodar um serviço (bibliotecas, sistema de arquivos e configurações), independente do sistema operacional do computador hospedeiro.

### Comandos Essenciais
| Ação | Comando |
| :--- | :--- |
| Rodar container em segundo plano | `docker run -d -p 8080:80 --name meu-nginx nginx` |
| Listar containers ativos | `docker ps` |
| Parar um container | `docker stop meu-nginx` |