#!/bin/sh
set -e

echo "🚀 Iniciando container de produção da Capacitação inclu..."

# Executa migrações do banco de dados automaticamente se DATABASE_URL estiver configurada
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Aplicando migrações do Prisma (prisma migrate deploy)..."
  npx prisma migrate deploy --schema=./apps/web/prisma/schema.prisma || {
    echo "⚠️ Aviso: Falha ao aplicar migrações automáticas. O banco pode precisar de inicialização."
  }
fi

echo "✨ Iniciando servidor Next.js standalone na porta $PORT..."
exec "$@"
