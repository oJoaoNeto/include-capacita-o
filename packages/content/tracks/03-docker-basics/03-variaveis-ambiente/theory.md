# Cápsula Teórica: Injetando Configurações em Containers

Nunca gravamos dados mutáveis ou senhas dentro da imagem Docker. Ao invés disso, passamos essas configurações no momento de executar o container através de **Variáveis de Ambiente**.

A flag `-e NOME=VALOR` permite injetar qualquer variável dinamicamente no container em execução.