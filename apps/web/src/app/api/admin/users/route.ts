import { NextRequest, NextResponse } from 'next/server';
import { Role, StageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');

    const where: any = {};
    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cohort: true,
        cliToken: true,
        gitlabUsername: true,
        createdAt: true,
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao listar usuários: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role, cohort, gitlabUsername } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'E-mail válido é obrigatório para pré-cadastro' },
        { status: 400 }
      );
    }

    const targetRole = (role && Object.values(Role).includes(role)) ? (role as Role) : Role.TRAINEE;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um usuário cadastrado com este e-mail' },
        { status: 409 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: targetRole,
        cohort: cohort || 'PS 2026.2',
        gitlabUsername: gitlabUsername || null,
      },
    });

    // Inicializa progresso conforme a role
    const allStages = await prisma.stage.findMany({
      include: { track: true },
      orderBy: [
        { track: { order: 'asc' } },
        { stepNumber: 'asc' },
      ],
    });

    for (let i = 0; i < allStages.length; i++) {
      const stage = allStages[i];
      let initialStatus: StageStatus = StageStatus.LOCKED;

      if (targetRole === Role.MEMBER || targetRole === Role.ADMIN) {
        initialStatus = StageStatus.IN_PROGRESS;
      } else if (targetRole === Role.TRAINEE && i === 0) {
        initialStatus = StageStatus.IN_PROGRESS;
      }

      await prisma.userProgress.create({
        data: {
          userId: newUser.id,
          stageId: stage.id,
          status: initialStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao pré-cadastrar usuário: ' + error.message },
      { status: 500 }
    );
  }
}
