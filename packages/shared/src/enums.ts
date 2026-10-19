export enum Role {
  PENDING = "PENDING",   // Aguardando aprovação/atribuição de role por um Admin
  TRAINEE = "TRAINEE",   // Modo Guiado (etapas sequenciais obrigatórias)
  MEMBER = "MEMBER",     // Modo Livre (qualquer etapa acessível para estudo)
  ADMIN = "ADMIN",       // Gestão de usuários, turmas e acompanhamento
}

export enum ValidationType {
  CLI_LOCAL = "CLI_LOCAL",
  GITLAB_API = "GITLAB_API",
}

export enum StageStatus {
  LOCKED = "LOCKED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
