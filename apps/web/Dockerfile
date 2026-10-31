# ==============================================================================
# Dockerfile Multi-Stage de Produção — Plataforma Capacitação inclu (apps/web)
# ==============================================================================

# 1. Base Image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencies
FROM base AS deps
WORKDIR /app

# Copia manifestos de pacotes do monorepo
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/cli/package.json ./apps/cli/
COPY packages/shared/package.json ./packages/shared/
COPY packages/content/package.json ./packages/content/

# Instala todas as dependências com lockfile garantido
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/content/node_modules ./packages/content/node_modules

COPY package.json ./
COPY packages/shared ./packages/shared
COPY packages/content ./packages/content
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compila pacotes compartilhados e gera cliente Prisma
RUN npm run build --workspace=@inclu/shared
RUN npm run build --workspace=@inclu/content
RUN npx prisma generate --schema=apps/web/prisma/schema.prisma

# Compila a aplicação Web em modo Standalone
RUN npm run build --workspace=@inclu/web

# 4. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos e saída standalone
COPY --from=builder /app/apps/web/public ./public 2>/dev/null || true
COPY --from=builder /app/apps/web/.next/static ./.next/static

# Copia o servidor standalone gerado pelo Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copia Prisma e migrações para execução do entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/content ./packages/content
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Script de entrada para migrações e seed
COPY apps/web/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
