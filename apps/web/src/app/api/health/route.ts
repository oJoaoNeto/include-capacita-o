import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Executa verificação real de conectividade com o PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      version: '1.0.0',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Falha na conexão com o banco de dados PostgreSQL: ' + error.message,
      },
      { status: 503 }
    );
  }
}
