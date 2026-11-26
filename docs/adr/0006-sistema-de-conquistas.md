# ADR 0006: Sistema de Conquistas (Troféus por Capacitação Concluída)

* **Status:** Proposta
* **Data:** 2026-11-25
* **Autores:** Tech Lead & Diretoria da EJ
* **Requisitos Relacionados:** RF04, RF05, RF11, RNF04

## Contexto e Forças Motrizes

A plataforma registra o progresso etapa a etapa (`UserProgress`), mas não reconhece de
forma visível quando alguém **conclui uma capacitação inteira** (uma trilha). Para uma
plataforma de desenvolvimento técnico contínuo de todos os membros, esse reconhecimento:

- motiva trainees e membros a terminarem as trilhas que começam;
- torna visível o que cada pessoa já domina (base para o futuro mapa de competências);
- ajuda a diretoria e colegas a saber a quem recorrer sobre um tema.

Estado atual relevante:
- A conclusão de etapa é processada em `processStageSubmission`
  (`apps/web/src/lib/rbac.ts`), chamada pela CLI (`/api/cli/submissions`) e pela
  validação do GitLab (`/api/stages/validate-gitlab`).
- O perfil (`/profile`) só é visível pelo próprio usuário; não existe perfil público.
- O escopo do projeto (`docs/scope/mvp-boundaries.md`) exclui **"gamificação financeira
  ou ranqueamento hostil"**. Troféus de conclusão são compatíveis com isso desde que não
  virem ranking.

### Alternativas consideradas

| Alternativa | Motivo do descarte |
|---|---|
| Pontos/XP e ranking geral | Contraria o non-goal de "ranqueamento hostil"; incentiva competição em vez de aprendizado. |
| Troféu calculado na hora (sem tabela) a partir do `UserProgress` | Simples, mas o troféu sumiria se a trilha ganhasse uma etapa nova depois, e não há data de conquista estável. |
| Certificado em PDF | Útil, mas é um passo além; pode ser construído depois sobre os troféus. |
| **Troféu persistido ao concluir a trilha** | **Escolhida.** Registro permanente, com data, independente de mudanças futuras no catálogo. |

## Decisão Tomada

Optamos por **conceder um troféu persistido quando o usuário conclui todas as etapas de
uma trilha**, exibido no perfil dele e num perfil interno visível aos demais membros,
**sem pontos e sem ranking**.

### 1. Regra de concessão

- Um troféu por trilha (`Track`) por usuário.
- Concedido quando **todas as etapas da trilha** estão `COMPLETED` para o usuário.
- Vale para todos os papéis: `TRAINEE` (modo guiado), `MEMBER` e `ADMIN` (modo livre).
  Para membros, a ordem em que as etapas foram feitas não importa.
- **O troféu é permanente:** se a trilha ganhar etapas novas depois, quem já tem o troféu
  o mantém. O registro guarda quantas etapas a trilha tinha na conquista
  (`stagesAtAward`), e o perfil pode indicar "trilha atualizada desde a conquista".
- Só um admin pode revogar um troféu (ex.: concessão indevida), com motivo registrado.

### 2. Modelo de dados (Prisma)

```prisma
model Achievement {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  trackId       String
  track         Track     @relation(fields: [trackId], references: [id], onDelete: Cascade)
  awardedAt     DateTime  @default(now())
  stagesAtAward Int
  revokedAt     DateTime?
  revokedReason String?

  @@unique([userId, trackId])
}
```

E em `User`: `achievements Achievement[]` e `showAchievements Boolean @default(true)`
(o usuário pode ocultar seus troféus do perfil interno). Em `Track`:
`achievements Achievement[]`.

O modelo é intencionalmente restrito a "trilha concluída". Se no futuro houver outros
tipos (ex.: "concluiu todas as trilhas obrigatórias da turma"), adiciona-se um campo
`kind` e torna-se `trackId` opcional, sem quebrar os registros existentes.

### 3. Aparência do troféu (declarada no conteúdo)

Campo opcional `trophy` em `track.json`, seguindo o padrão de conteúdo em arquivos (RNF04):

```json
{
  "slug": "git-local",
  "title": "1. Git Local",
  "order": 1,
  "trophy": {
    "name": "Guardião do Versionamento",
    "description": "Concluiu todas as etapas da trilha Git Local.",
    "icon": "git-branch",
    "color": "#f97316"
  }
}
```

| Campo | Obrigatório | Padrão se ausente |
|---|---|---|
| `name` | Não | `"<título da trilha> — Concluída"` |
| `description` | Não | `"Concluiu todas as etapas da trilha <título>."` |
| `icon` | Não | `"trophy"` (ícones do `lucide-react`, já usado no projeto) |
| `color` | Não | Cor de destaque padrão da interface |

Assim toda trilha tem troféu automaticamente, e a EJ personaliza quando quiser, sem
mexer em código. O campo é lido por `packages/content`, validado com Zod e gravado no
`Track` pelo seed (coluna `trophy Json?`).

### 4. Onde a concessão acontece

Em `processStageSubmission` (`apps/web/src/lib/rbac.ts`), após marcar a etapa como
`COMPLETED`:

1. Contar as etapas da trilha e as concluídas pelo usuário nessa trilha.
2. Se forem iguais e não houver `Achievement` para `(userId, trackId)`, criá-lo.
3. Retornar `awardedAchievement` (nome, ícone, trilha) na resposta, ao lado de
   `unlockedNextStage`.

Tudo dentro de uma **transação** (`prisma.$transaction`), e a restrição
`@@unique([userId, trackId])` impede troféu duplicado se duas submissões chegarem ao
mesmo tempo (tratar o erro de unicidade como "já concedido").

Como a CLI e a validação do GitLab já passam por essa função, os dois caminhos concedem
troféus sem código duplicado.

**Concessão retroativa:** um script `npm run achievements:backfill` percorre usuários
que já concluíram trilhas antes da funcionalidade existir e cria os troféus com
`awardedAt` igual à data da última etapa concluída da trilha. Idempotente.

### 5. Onde o troféu aparece

| Lugar | O que mostra |
|---|---|
| **Momento da conquista (web)** | Ao validar a última etapa na tela da etapa, um destaque/modal "🏆 Você conquistou: Guardião do Versionamento". |
| **Momento da conquista (CLI)** | `ej-cap verify` exibe um bloco "🏆 TROFÉU CONQUISTADO" com o nome do troféu, usando o `awardedAchievement` da resposta. Atualizar `docs/api/cli-protocol.md`. |
| **Meu perfil (`/profile`)** | Nova seção "Conquistas": troféus obtidos (ícone, nome, data) e trilhas ainda não concluídas como troféus "bloqueados" com a porcentagem de progresso. Interruptor "Mostrar minhas conquistas para outros membros". |
| **Perfil interno (`/members/[id]`, novo)** | Nome, avatar, papel e troféus conquistados (se `showAchievements = true`). Visível apenas para usuários autenticados e aprovados (não `PENDING`). Sem e-mail, sem `cliToken`, sem histórico de falhas. |
| **Painel admin** | Coluna/contagem de troféus por usuário e filtro "concluiu a trilha X". Ação de revogar troféu. |

O perfil interno é acessível a partir do nome do usuário no painel admin e, no futuro,
de qualquer lugar que liste membros. **Não haverá página de ranking** nem ordenação de
pessoas por quantidade de troféus.

### 6. API

| Rota | Acesso | Função |
|---|---|---|
| `GET /api/user/achievements` | Próprio usuário | Troféus do usuário + progresso das trilhas não concluídas. |
| `PATCH /api/user/profile` | Próprio usuário | Passa a aceitar `showAchievements`. |
| `GET /api/members/[id]` | Autenticado e não `PENDING` | Dados públicos internos do perfil + troféus (respeitando `showAchievements`). |
| `DELETE /api/admin/achievements/[id]` | `ADMIN` | Revoga (marca `revokedAt`/`revokedReason`; não apaga). |

Todas usando o helper `requireSession()`/`requireRole()` previsto no plano de segurança.

## Consequências

### Positivas (+)
- Reconhecimento visível da conclusão, para trainees e membros.
- Base de dados pronta para o mapa de competências e para certificados futuros.
- Aparência do troféu configurável pelo conteúdo, sem código.
- Um único ponto de concessão para web e CLI.

### Negativas ou Riscos (-)
- Risco de virar competição ou pressão social, contrariando o espírito do projeto.
- O troféu reflete a validação automática, que pode ser contornada (ex.: hoje as rotas
  sem autenticação permitem submeter etapas em nome de outros).
- Troféus de trilhas que mudaram muito podem não refletir o conteúdo atual.

### Estratégias de Mitigação
- Sem pontos, sem ranking, opção de ocultar os troféus, linguagem de reconhecimento e não
  de comparação.
- **Implementar só depois da Fase 1 (segurança)** do plano de melhorias, para que os
  troféus sejam confiáveis.
- Guardar `stagesAtAward` e sinalizar "trilha atualizada desde a conquista"; revogação
  pelo admin para casos indevidos.

## Documentos a atualizar quando implementado
- `PRD_inclu_capacitacao.md` — novo requisito funcional de conquistas e schema da seção 7.
- `docs/scope/mvp-boundaries.md` — deixar explícito que troféus de conclusão são
  permitidos e ranking continua fora do escopo.
- `docs/api/cli-protocol.md` — campo `awardedAchievement` na resposta de submissão.
- `.agents/skills/curriculum-content-validation/SKILL.md` — campo opcional `trophy` no `track.json`.
