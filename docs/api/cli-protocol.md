# Protocolo de Comunicação CLI $\leftrightarrow$ Backend

A ferramenta de linha de comando `ej-cap` comunica-se com o backend da plataforma através de requisições HTTP REST autenticadas via Bearer Token.

---

## 1. Fluxo de Autenticação (`ej-cap login <cliToken>`)

O aluno obtém seu `cliToken` no perfil da plataforma web e executa:
```bash
npx ej-cap login <cliToken>
```

### Requisição:
* **Método:** `POST /api/cli/auth`
* **Header:** `Authorization: Bearer <cliToken>`

### Resposta de Sucesso (`200 OK`):
```json
{
  "valid": true,
  "user": {
    "id": "uuid-do-aluno",
    "name": "Nome do Aluno",
    "email": "aluno@ej.com",
    "role": "TRAINEE",
    "cohort": "PS 2026.2",
    "cliToken": "uuid-do-token",
    "trainingRepoId": 101
  },
  "currentStage": {
    "id": "uuid-da-etapa",
    "slug": "git-1-1",
    "stepNumber": 1,
    "title": "Identidade no Git",
    "trackSlug": "git-local",
    "trackTitle": "1. Git Local",
    "validationType": "CLI_LOCAL"
  }
}
```

A CLI salva essas informações em `~/.ej-cap/config.json` com permissão restrita (`0600`).

---

## 2. Fluxo de Verificação (`ej-cap verify`)

Ao rodar `ej-cap verify`, a CLI:
1. Consulta a etapa ativa atual do aluno via `POST /api/cli/auth`.
2. Executa as inspeções locais nos arquivos (`.git`, `git log`, `docker ps`, etc.).
3. Envia o relatório assinado para o backend:

### Requisição:
* **Método:** `POST /api/cli/submissions`
* **Header:** `Authorization: Bearer <cliToken>`
* **Payload:**
```json
{
  "stageSlug": "git-1-1",
  "passed": true,
  "feedbackMsg": "Identidade configurada para Fulano <fulano@ej.com>",
  "rawLogs": "user.name=Fulano\nuser.email=fulano@ej.com"
}
```

### Resposta de Sucesso (`200 OK`):
```json
{
  "success": true,
  "passed": true,
  "attempts": 1,
  "feedbackMsg": "Identidade configurada...",
  "unlockedNextStage": {
    "slug": "git-1-2",
    "stepNumber": 2,
    "title": "Criando a Máquina do Tempo",
    "trackSlug": "git-local",
    "trackTitle": "1. Git Local",
    "validationType": "CLI_LOCAL"
  }
}
```

### Regras de Negócio no Backend:
- Cada submissão cria um registro imutável em `Submission` para fins de auditoria de mentores (RF12).
- Para usuários com papel `TRAINEE`, uma submissão com `passed: true` altera a etapa atual para `COMPLETED` e desbloqueia a etapa $N+1$ mudando seu status para `IN_PROGRESS`.
