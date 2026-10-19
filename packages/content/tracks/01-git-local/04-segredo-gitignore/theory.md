# Cápsula Teórica: O Segredo do .gitignore

Em projetos reais da Empresa Júnior, manipulamos senhas de banco de dados, chaves de API secretas e pastas gigantescas como `node_modules/`.

**Esses arquivos nunca devem ir para o Git!**

Para isso, criamos na raiz do repositório um arquivo especial chamado `.gitignore`. Cada linha desse arquivo indica nomes de arquivos ou pastas que o Git deve ignorar solenemente.