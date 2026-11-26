# ADR 0005: Vídeos das Capacitações Hospedados no YouTube e Incorporados nas Etapas

* **Status:** Proposta
* **Data:** 2026-11-25
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RF04, RNF01, RNF04

## Contexto e Forças Motrizes

Cada etapa hoje apresenta apenas texto: a Cápsula Teórica (`theory.md`) e a Missão
Prática (`mission.md`), renderizadas com `react-markdown` em
`apps/web/src/components/StageWorkspaceClient.tsx`. A plataforma não tem player de
vídeo nem armazenamento de arquivos.

A EJ quer que as capacitações possam ter vídeos (explicações, demonstrações de
terminal, gravações de aulas), servindo tanto trainees quanto membros.

Restrições:
- **Custo zero** de infraestrutura é diretriz do projeto (ADR 0002 / RNF01).
- **Conteúdo desacoplado em arquivos** (RNF04): editar conteúdo não deve exigir mexer no
  banco nem no código.
- A EJ **ainda não usa** YouTube; será preciso criar o canal.

### Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Upload na própria plataforma (disco do servidor ou S3/R2) | Custo de armazenamento e banda, transcodificação, streaming adaptativo e mais código para manter. |
| Google Drive | Player limitado, limite de reprodução em arquivos muito acessados, permissões confusas. |
| Vimeo | Bom player, mas o plano gratuito tem limites de upload e privacidade restrita. |
| **YouTube (vídeos não listados)** | **Escolhida.** Gratuito, sem limite prático de armazenamento/banda, streaming adaptativo, legendas automáticas em português, funciona em qualquer dispositivo. |

## Decisão Tomada

Optamos por **hospedar os vídeos no YouTube, como "não listados" num canal da EJ, e
incorporá-los nas etapas** por referência, porque elimina custo e complexidade de
armazenamento e streaming, mantendo o conteúdo declarado em arquivos.

### 1. Declaração do vídeo no conteúdo

Campo opcional `videos` no `stage.json` de cada etapa (e, opcionalmente, um vídeo de
apresentação em `track.json`):

```json
{
  "slug": "git-1-1",
  "stepNumber": 1,
  "title": "Identidade no Git",
  "validationType": "CLI_LOCAL",
  "videos": [
    {
      "youtubeId": "dQw4w9WgXcQ",
      "title": "Configurando nome e e-mail no Git",
      "placement": "theory",
      "durationSec": 245
    }
  ]
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `youtubeId` | Sim | ID de 11 caracteres. Aceitar também URL completa (`youtube.com/watch?v=`, `youtu.be/`) e normalizar para o ID no carregamento. |
| `title` | Sim | Usado como título acessível do player e na lista de vídeos. |
| `placement` | Não | `"theory"` (padrão, no topo da Cápsula Teórica) ou `"mission"` (junto à Missão Prática). |
| `durationSec` | Não | Exibido como "4 min" no card do vídeo. |

Etapas sem `videos` continuam funcionando exatamente como hoje.

### 2. Carregamento e banco

- `packages/content/src/index.ts`: ler `videos` de `stage.json`/`track.json`, validar
  com Zod (ID com regex `^[A-Za-z0-9_-]{11}$`) e **falhar o seed** com mensagem clara
  se um ID for inválido.
- `schema.prisma`: adicionar `videos Json @default("[]")` em `Stage` (e `introVideo Json?`
  em `Track`). Uma coluna JSON basta, pois os vídeos vêm dos arquivos e não são editados
  pelo banco.
- `prisma/seed.ts`: gravar o campo junto com teoria, missão e dicas.

### 3. Player

Novo componente `apps/web/src/components/VideoEmbed.tsx`:

- **Carregamento sob demanda (facade):** mostrar inicialmente só a miniatura
  (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`) com botão de play; o `<iframe>` é criado
  apenas ao clicar. Evita carregar ~1 MB de scripts do YouTube em toda etapa e só
  contata o YouTube quando o usuário decide assistir.
- **Domínio de privacidade aprimorada:** `https://www.youtube-nocookie.com/embed/<id>`
  com `rel=0` (sugestões apenas do próprio canal) e `modestbranding=1`.
- Atributos do iframe: `title` (acessibilidade), `allow="accelerometer; autoplay;
  encrypted-media; gyroscope; picture-in-picture; fullscreen"`, `loading="lazy"`,
  `referrerPolicy="strict-origin-when-cross-origin"`.
- Proporção 16:9 responsiva, no tema escuro atual da interface.
- Vários vídeos na mesma etapa aparecem como lista (título + duração), com um player.
- Se o vídeo estiver indisponível (removido/privado), o próprio player do YouTube
  informa; a etapa continua utilizável.

### 4. Cabeçalhos de segurança

Hoje `next.config.js` não define Content-Security-Policy, então o embed funciona sem
mudanças (`X-Frame-Options: DENY` só impede que **nossas** páginas sejam incorporadas
por terceiros, não afeta incorporarmos o YouTube).

Quando uma CSP for adicionada (recomendado no plano de segurança), ela deve incluir:

```
frame-src https://www.youtube-nocookie.com;
img-src 'self' https://i.ytimg.com data:;
```

### 5. O que fica fora desta decisão

- **Vídeo não é critério de conclusão.** A aprovação continua sendo pela validação via
  CLI ou API do GitLab. Registrar "assistido" exigiria a IFrame Player API do YouTube;
  pode ser avaliado depois como métrica de engajamento, não como bloqueio.
- **Interface de admin para cadastrar vídeos.** Vídeos são adicionados editando o
  `stage.json` via Merge Request, como o resto do conteúdo (RNF04).
- **Produção dos vídeos.** É responsabilidade da EJ; esta ADR trata só da plataforma.

## Consequências

### Positivas (+)
- Custo zero de armazenamento, banda e transcodificação.
- Streaming adaptativo, velocidade de reprodução, legendas e tela cheia sem código próprio.
- Adicionar um vídeo é uma linha no `stage.json` — sem mexer em código.
- Facade + `youtube-nocookie` mantêm a etapa leve e reduzem rastreamento.

### Negativas ou Riscos (-)
- **"Não listado" não é privado:** qualquer pessoa com o link assiste. Não serve para
  material confidencial da EJ ou de clientes.
- Dependência de serviço externo: o YouTube pode exibir anúncios em alguns casos,
  mudar políticas ou ficar indisponível.
- A EJ precisa criar e manter um canal (acesso compartilhado pela diretoria).
- Sem garantia de que o aluno assistiu ao vídeo.

### Estratégias de Mitigação
- Regra de conteúdo: só publicar no YouTube material que possa ser público; material
  sensível fica fora da plataforma até existir uma solução privada.
- Criar o canal numa conta Google institucional da EJ (não pessoal), com mais de um
  administrador, para não perder acesso na troca de gestão.
- Recomendar que a Cápsula Teórica continue autossuficiente em texto; o vídeo
  complementa, não substitui (também ajuda acessibilidade e quem tem internet limitada).
- O validador de conteúdo (Fase 2 do plano de melhorias) pode checar periodicamente se
  os IDs ainda respondem em `https://www.youtube.com/oembed?url=...`.

## Documentos a atualizar quando implementado
- `PRD_inclu_capacitacao.md` — RF04 (etapa pode conter vídeos) e schema da seção 7.
- `.agents/skills/curriculum-content-validation/SKILL.md` — novo campo `videos` no `stage.json`.
- Guia de autoria de conteúdo — como subir no canal e referenciar o vídeo.
