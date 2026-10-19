import { NextRequest, NextResponse } from 'next/server';
import { getUserByCliToken, getUserCurrentStage } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'Token de autorização não fornecido no header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const user = await getUserByCliToken(token);

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido ou usuário não encontrado' },
        { status: 401 }
      );
    }

    const currentStage = await getUserCurrentStage(user.id);

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        cohort: user.cohort,
        cliToken: user.cliToken,
        trainingRepoId: user.trainingRepoId,
      },
      currentStage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
