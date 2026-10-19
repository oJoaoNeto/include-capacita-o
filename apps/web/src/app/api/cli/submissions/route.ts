import { NextRequest, NextResponse } from 'next/server';
import { getUserByCliToken, processStageSubmission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token de autorização ausente' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const user = await getUserByCliToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { stageSlug, passed, feedbackMsg, rawLogs } = body;

    if (!stageSlug || typeof passed !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Payload incompleto. Requer stageSlug e passed.' },
        { status: 400 }
      );
    }

    const result = await processStageSubmission(
      user.id,
      stageSlug,
      passed,
      feedbackMsg || (passed ? 'Aprovado' : 'Não aprovado'),
      rawLogs
    );

    return NextResponse.json({
      success: true,
      passed: result.passed,
      attempts: result.attempts,
      feedbackMsg,
      unlockedNextStage: result.unlockedNextStage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar submissão' },
      { status: 500 }
    );
  }
}
