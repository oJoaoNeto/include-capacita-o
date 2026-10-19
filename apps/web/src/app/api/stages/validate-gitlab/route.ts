import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gitlabService } from '@/lib/gitlab-client';
import { processStageSubmission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stageSlug, userId } = body;

    if (!stageSlug) {
      return NextResponse.json(
        { passed: false, feedbackMsg: 'Identificador da etapa (stageSlug) ausente.' },
        { status: 400 }
      );
    }

    // Identifica o usuário: pelo userId do body ou pelo usuário demo padrão (Trainee)
    const targetUserId = userId || (await prisma.user.findFirst({ where: { role: 'TRAINEE' } }))?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { passed: false, feedbackMsg: 'Nenhum usuário ativo identificado para validação.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json(
        { passed: false, feedbackMsg: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    // 1. Executa a validação em nuvem
    const validationResult = await gitlabService.validateCloudStage(stageSlug, user);

    // 2. Persiste o resultado e atualiza progresso
    const submissionResult = await processStageSubmission(
      user.id,
      stageSlug,
      validationResult.passed,
      validationResult.feedbackMsg,
      validationResult.rawLogs
    );

    return NextResponse.json({
      passed: validationResult.passed,
      feedbackMsg: validationResult.feedbackMsg,
      rawLogs: validationResult.rawLogs,
      attempts: submissionResult.attempts,
      unlockedNextStage: submissionResult.unlockedNextStage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { passed: false, feedbackMsg: 'Erro ao validar com a nuvem do GitLab: ' + error.message },
      { status: 500 }
    );
  }
}
