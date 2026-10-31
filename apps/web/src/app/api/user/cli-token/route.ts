import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const newCliToken = crypto.randomUUID();

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email.toLowerCase().trim() },
      data: { cliToken: newCliToken },
    });

    return NextResponse.json({
      success: true,
      cliToken: updatedUser.cliToken,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao regenerar token: ' + error.message },
      { status: 500 }
    );
  }
}
