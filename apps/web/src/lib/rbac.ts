import { Role, StageStatus } from '@prisma/client';
import { prisma } from './prisma';

export async function getUserByCliToken(cliToken: string) {
  if (!cliToken) return null;
  return prisma.user.findUnique({
    where: { cliToken },
  });
}

export async function getUserCurrentStage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      progress: {
        include: {
          stage: {
            include: { track: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  // Busca todas as etapas ordenadas por Trilha e StepNumber
  const allStages = await prisma.stage.findMany({
    include: { track: true },
    orderBy: [
      { track: { order: 'asc' } },
      { stepNumber: 'asc' },
    ],
  });

  // Mapa de progresso do usuário
  const progressMap = new Map(user.progress.map(p => [p.stageId, p]));

  // Para TRAINEE: Encontra a primeira etapa não concluída
  if (user.role === Role.TRAINEE) {
    for (const stage of allStages) {
      const prog = progressMap.get(stage.id);
      if (!prog || prog.status !== StageStatus.COMPLETED) {
        return {
          id: stage.id,
          slug: stage.slug,
          stepNumber: stage.stepNumber,
          title: stage.title,
          trackSlug: stage.track.slug,
          trackTitle: stage.track.title,
          validationType: stage.validationType,
        };
      }
    }
    return null; // Concluiu todas!
  }

  // Para MEMBER ou ADMIN: Retorna a primeira etapa IN_PROGRESS ou a primeira da lista
  for (const stage of allStages) {
    const prog = progressMap.get(stage.id);
    if (prog && prog.status === StageStatus.IN_PROGRESS) {
      return {
        id: stage.id,
        slug: stage.slug,
        stepNumber: stage.stepNumber,
        title: stage.title,
        trackSlug: stage.track.slug,
        trackTitle: stage.track.title,
        validationType: stage.validationType,
      };
    }
  }

  const firstStage = allStages[0];
  return firstStage ? {
    id: firstStage.id,
    slug: firstStage.slug,
    stepNumber: firstStage.stepNumber,
    title: firstStage.title,
    trackSlug: firstStage.track.slug,
    trackTitle: firstStage.track.title,
    validationType: firstStage.validationType,
  } : null;
}

export async function processStageSubmission(
  userId: string,
  stageSlug: string,
  passed: boolean,
  feedbackMsg: string,
  rawLogs?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const stage = await prisma.stage.findUnique({
    where: { slug: stageSlug },
    include: { track: true },
  });

  if (!stage) {
    throw new Error(`Etapa '${stageSlug}' não encontrada`);
  }

  // 1. Registra a submissão
  await prisma.submission.create({
    data: {
      userId,
      stageId: stage.id,
      passed,
      feedbackMsg,
      rawLogs,
    },
  });

  // 2. Atualiza ou cria UserProgress
  const existingProg = await prisma.userProgress.findUnique({
    where: {
      userId_stageId: {
        userId,
        stageId: stage.id,
      },
    },
  });

  const attempts = (existingProg?.attempts || 0) + 1;
  const isAlreadyCompleted = existingProg?.status === StageStatus.COMPLETED;

  const updatedStatus = passed
    ? StageStatus.COMPLETED
    : (existingProg?.status || StageStatus.IN_PROGRESS);

  await prisma.userProgress.upsert({
    where: {
      userId_stageId: {
        userId,
        stageId: stage.id,
      },
    },
    update: {
      attempts,
      status: updatedStatus,
      completedAt: passed && !isAlreadyCompleted ? new Date() : existingProg?.completedAt,
    },
    create: {
      userId,
      stageId: stage.id,
      attempts,
      status: updatedStatus,
      completedAt: passed ? new Date() : null,
    },
  });

  let unlockedNextStage = null;

  // 3. Se aprovado e for TRAINEE, desbloqueia a próxima etapa sequencial
  if (passed && user.role === Role.TRAINEE) {
    const allStages = await prisma.stage.findMany({
      include: { track: true },
      orderBy: [
        { track: { order: 'asc' } },
        { stepNumber: 'asc' },
      ],
    });

    const currentIndex = allStages.findIndex(s => s.id === stage.id);
    if (currentIndex >= 0 && currentIndex + 1 < allStages.length) {
      const nextStage = allStages[currentIndex + 1];

      await prisma.userProgress.upsert({
        where: {
          userId_stageId: {
            userId,
            stageId: nextStage.id,
          },
        },
        update: {
          status: StageStatus.IN_PROGRESS,
        },
        create: {
          userId,
          stageId: nextStage.id,
          status: StageStatus.IN_PROGRESS,
        },
      });

      unlockedNextStage = {
        id: nextStage.id,
        slug: nextStage.slug,
        stepNumber: nextStage.stepNumber,
        title: nextStage.title,
        trackSlug: nextStage.track.slug,
        trackTitle: nextStage.track.title,
        validationType: nextStage.validationType,
      };
    }
  }

  return {
    passed,
    attempts,
    unlockedNextStage,
  };
}
