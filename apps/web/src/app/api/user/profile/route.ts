import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: {
        progress: {
          include: { stage: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const completedStages = user.progress.filter((p) => p.status === 'COMPLETED').length;
    const inProgressStages = user.progress.filter((p) => p.status === 'IN_PROGRESS').length;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        gitlabUsername: user.gitlabUsername,
        cliToken: user.cliToken,
        role: user.role,
        cohort: user.cohort,
        createdAt: user.createdAt,
      },
      stats: {
        completedStages,
        inProgressStages,
        totalProgressRecords: user.progress.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao carregar perfil: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatarUrl, gitlabUsername } = body;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email.toLowerCase().trim() },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: String(avatarUrl).trim() } : {}),
        ...(gitlabUsername !== undefined
          ? {
              gitlabUsername: gitlabUsername
                ? String(gitlabUsername).trim().replace(/^@/, '')
                : null,
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        gitlabUsername: updatedUser.gitlabUsername,
        cliToken: updatedUser.cliToken,
        role: updatedUser.role,
        cohort: updatedUser.cohort,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil: ' + error.message },
      { status: 500 }
    );
  }
}
