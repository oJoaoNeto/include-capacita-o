# Cápsula Teórica: O Temido Conflito de Merge

Um conflito acontece quando dois desenvolvedores alteram **a mesma linha do mesmo arquivo** de formas diferentes.

O Git é inteligente, mas não tem como adivinhar qual das duas versões está certa. Por isso, ele pausa o merge e insere marcadores visuais no arquivo:

```text
<<<<<<< HEAD
Versão que estava na sua branch atual
=======
Versão que veio da outra branch
>>>>>>> feat/outra-versao
```

**Como resolver:** Você abre o arquivo, apaga os marcadores `<<<<<<<`, `=======` e `>>>>>>>`, decide qual código deve ficar, salva o arquivo e cria o commit de finalização!