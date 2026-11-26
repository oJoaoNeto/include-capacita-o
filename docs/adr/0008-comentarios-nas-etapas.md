# ADR 0008: Comentários nas Etapas com Proteção Contra Respostas Prontas

* **Status:** Proposta
* **Data:** 2026-11-25
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RF04, RF07, RF12

## Contexto e Forças Motrizes

Os usuários querem conversar sobre os desafios: tirar dúvidas, dar dicas uns aos outros,
comentar dificuldades. Hoje não existe nenhum espaço para isso dentro da plataforma.

O risco principal é alguém **postar a resposta pronta** (o comando exato, o Dockerfile
completo), o que tira o aprendizado de quem ainda não fez a etapa — especialmente
trainees no processo seletivo.

Não existe papel de mentor (decisão atual); a moderação fica com os **admins**.

### Chat em tempo real ou comentários?

| Opção | Avaliação |
|---|---|
| Chat em tempo real (estilo Discord) | Exige WebSocket/infra de tempo real, mensagens se perdem no fluxo, difícil de moderar e de achar depois. |
| **Comentários por etapa (estilo fórum, com respostas)** | **Escolhida.** Ficam salvos e organizados por etapa, viram base de conhecimento, não exigem infraestrutura nova e são fáceis de moderar. |

### É possível detectar se alguém está dando a resposta?

**Parcialmente.** Nenhuma detecção automática é 100% confiável: falar de `git config`
numa etapa sobre `git config` é legítimo, e uma resposta pode ser escrita de formas
diferentes. Por isso a decisão combina três camadas, em vez de confiar só na detecção:

1. **Estrutura** que reduz o dano mesmo que a resposta seja postada.
2. **Detecção automática** que sinaliza comentários suspeitos.
3. **Moderação** pelos admins e denúncias dos usuários.

## Decisão Tomada

Optamos por **comentários assíncronos por etapa, com respostas em thread**, protegidos
por spoilers, detecção automática de respostas e moderação pelos admins.

### 1. Estrutura (camada 1)

- Cada etapa tem uma aba **"Discussão"**.
- Ao comentar, o autor escolhe o tipo: **💬 Dúvida**, **💡 Dica** ou **✅ Solução**.
- **Soluções só aparecem para quem já concluiu a etapa.** Para os demais, aparece
  "1 solução disponível após concluir a etapa". A regra é aplicada no servidor.
- **Spoiler:** qualquer trecho pode ser marcado como spoiler (`||texto||`) e fica
  borrado até a pessoa clicar em "mostrar". Revelar um spoiler numa etapa não concluída
  é registrado como **dica antecipada** (mesma regra do item 3.1.2 do plano), para o
  admin ver.
- Comentários de quem **já concluiu** a etapa ganham o selo "concluiu esta etapa" — quem
  está travado sabe que a dica vem de alguém que passou por ela.

### 2. Detecção automática (camada 2)

Ao enviar um comentário (exceto do tipo "Solução"), o servidor calcula se ele parece
conter a resposta, usando sinais que **não exigem criar conteúdo novo**:

| Sinal | Como funciona |
|---|---|
| **Semelhança com a última dica** | A última dica do `hints.json` costuma trazer o comando quase completo. Comentário muito parecido com ela é suspeito. |
| **Semelhança com soluções aprovadas** | Compara blocos de código do comentário com os snapshots aprovados da etapa (ADR 0007). Se o trecho coincidir em grande parte com uma solução real, é suspeito. |
| **Padrões configuráveis** | Campo opcional `spoilerPatterns` no `stage.json` (ex.: `"git config --global user\\.email .+@"`), preenchido pela EJ quando quiser reforçar uma etapa. |
| **Blocos de código grandes** | Comentários com bloco de código longo em etapa de Git/Docker recebem peso maior. |

A semelhança usa normalização simples (remover espaços, aspas, nomes/e-mails) e
comparação por trechos (ex.: n-gramas/Jaccard). Tudo roda no servidor, sem custo externo.

**O que acontece com um comentário suspeito:**
- **Não é apagado nem bloqueado** (evita punir falsos positivos).
- É publicado **automaticamente como spoiler** e marcado como "possível resposta".
- O autor vê o aviso: *"Parece que seu comentário tem a resposta. Ele foi ocultado como
  spoiler. Que tal transformar em uma dica que ajude a pensar, sem dar o comando pronto?"*
  com a opção de editar ou reclassificar como "Solução" (que fica visível só a quem concluiu).
- Entra na fila de moderação do admin.

**Opção futura (não incluída):** classificar comentários com um modelo de IA (ex.: API
do Claude) aumentaria a precisão, mas tem custo por uso e envia o texto a um serviço
externo, o que contraria a diretriz de custo zero. Pode ser reavaliado depois.

### 3. Moderação (camada 3)

- Botão **"Denunciar"** em cada comentário (motivos: dá a resposta, ofensivo, outro).
  Com 2 denúncias, o comentário é ocultado como spoiler até o admin revisar.
- **Fila de moderação** no painel admin: comentários sinalizados pela detecção e
  denunciados, com ações *manter*, *manter como spoiler*, *mover para Solução* e
  *remover* (com motivo, registrado).
- O autor é avisado quando um comentário seu é removido ou movido.
- Admin pode **fixar** um comentário útil no topo da etapa.

### 4. Funcionalidades do comentário

- Texto em Markdown com blocos de código (mesmo renderizador das etapas).
- Respostas em thread (um nível de profundidade).
- Editar e apagar o próprio comentário (apagar mantém "comentário removido" se houver respostas).
- Marcar como **"útil"** (contagem visível no comentário; **sem ranking de pessoas**).
- Notificação dentro da plataforma quando alguém responde.
- Limite de frequência (ex.: 10 comentários por hora por usuário) contra spam.
- Usuários `PENDING` não leem nem comentam.

### 5. Modelo de dados

```prisma
enum CommentKind { QUESTION HINT SOLUTION }
enum CommentStatus { VISIBLE SPOILER REMOVED }

model Comment {
  id            String        @id @default(uuid())
  stageId       String
  stage         Stage         @relation(fields: [stageId], references: [id], onDelete: Cascade)
  authorId      String
  author        User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parentId      String?
  parent        Comment?      @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies       Comment[]     @relation("Replies")
  kind          CommentKind
  body          String        @db.Text
  status        CommentStatus @default(VISIBLE)
  flaggedScore  Float?        // resultado da detecção automática
  pinned        Boolean       @default(false)
  removedReason String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  reports       CommentReport[]
  upvotes       CommentUpvote[]
}

model CommentReport {
  id         String   @id @default(uuid())
  commentId  String
  comment    Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  reporterId String
  reason     String
  createdAt  DateTime @default(now())
  @@unique([commentId, reporterId])
}

model CommentUpvote {
  commentId String
  comment   Comment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId    String
  @@id([commentId, userId])
}
```

### 6. API

| Rota | Acesso |
|---|---|
| `GET /api/stages/[slug]/comments` | Usuário aprovado. Filtra soluções e conteúdo de spoiler conforme o usuário ter concluído a etapa. |
| `POST /api/stages/[slug]/comments` | Usuário aprovado. Roda a detecção antes de salvar. |
| `PATCH/DELETE /api/comments/[id]` | Autor (editar/apagar) ou `ADMIN` (moderar). |
| `POST /api/comments/[id]/report` · `/upvote` | Usuário aprovado. |
| `GET /api/admin/moderation` | `ADMIN`. |

Todas com o helper de autorização da Fase 1.

## Consequências

### Positivas (+)
- Espaço de ajuda entre colegas dentro da própria etapa, que vira base de conhecimento.
- Soluções e spoilers ficam disponíveis sem estragar o desafio de quem não terminou.
- Detecção sem custo externo, reaproveitando dicas e snapshots aprovados.

### Negativas ou Riscos (-)
- A detecção tem falsos positivos e falsos negativos; respostas reescritas podem passar.
- Admins passam a ter trabalho de moderação.
- Respostas podem circular fora da plataforma (WhatsApp, Discord) — isso nenhum sistema impede.

### Estratégias de Mitigação
- Comentário suspeito vira spoiler em vez de ser apagado; admin decide.
- Denúncias da comunidade complementam a detecção.
- A validação continua sendo o que importa: mesmo com a resposta, o usuário precisa
  executar no próprio ambiente, e os snapshots (ADR 0007) mostram o que ele fez.
- Fila de moderação simples e enxuta no painel.

## Documentos a atualizar quando implementado
- `PRD_inclu_capacitacao.md` — novo requisito funcional de discussão por etapa.
- `.agents/skills/curriculum-content-validation/SKILL.md` — campo opcional `spoilerPatterns`.
