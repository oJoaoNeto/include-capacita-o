import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória para conectar ao PostgreSQL'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL deve ser uma URL válida (ex: https://capacitacao.sua-ej.com.br)'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET deve ter ao menos 16 caracteres para segurança em prod'),
  
  // GitLab OAuth
  GITLAB_CLIENT_ID: z.string().default('mock-gitlab-client-id'),
  GITLAB_CLIENT_SECRET: z.string().default('mock-gitlab-client-secret'),
  GITLAB_BOT_TOKEN: z.string().default('mock-gitlab-bot-token'),
  GITLAB_TRAINING_GROUP_ID: z.string().optional().default(''),

  // Flags de Ambiente
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ENABLE_GITLAB_MOCK: z.enum(['true', 'false']).default('false'),
  ENABLE_DEMO_AUTH: z.enum(['true', 'false']).default('false'),
  CLI_BACKEND_URL: z.string().url().optional(),
});

function getValidatedEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Erro de validação das variáveis de ambiente:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    
    // Se estiver em produção estrita, lance erro fatal
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      throw new Error('Configuração de ambiente inválida para Produção.');
    }
  }

  return parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = getValidatedEnv();
