import { NextRequest, NextResponse } from 'next/server';
import { Role, StageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await req.json();
    const { role } = body;

    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'Role inválida fornecida' },
        { status: 400 }
      );
    }

    const targetRole = role as Role;

    // Atualiza o papel do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
    });

    // Se promovido para MEMBER ou ADMIN, desbloqueia todas as etapas que estavam LOCKED
    if (targetRole === Role.MEMBER || targetRole === Role.ADMIN) {
      await prisma.userProgress.updateMany({
        where: {
          userId,
          status: StageStatus.LOCKED,
        },
        data: {
          status: StageStatus.IN_PROGRESS,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao alterar papel do usuário: ' + error.message },
      { status: 500 }
    );
  }
}
