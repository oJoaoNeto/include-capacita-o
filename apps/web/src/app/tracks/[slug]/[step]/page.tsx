import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { StageWorkspaceClient } from '@/components/StageWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function StageDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string; step: string };
  searchParams: { as?: string };
}) {
  const { slug: trackSlug, step: stageSlug } = params;
  const simulatedRole = searchParams.as === 'member' ? Role.MEMBER : Role.TRAINEE;

  const track = await prisma.track.findUnique({
    where: { slug: trackSlug },
    include: {
      stages: {
        orderBy: { stepNumber: 'asc' },
      },
    },
  });

  if (!track) {
    notFound();
  }

  const stage = track.stages.find((s) => s.slug === stageSlug);
  if (!stage) {
    notFound();
  }

  // Busca o usuário ativo com todo o progresso na trilha
  const user = await prisma.user.findFirst({
    where: { role: simulatedRole },
    include: {
      progress: true,
    },
  });

  const progressMap = new Map(user?.progress.map((p) => [p.stageId, p]) || []);
  const userProgress = progressMap.get(stage.id) || null;

  // Lista de todas as etapas da trilha com status para a barra de navegação CodeCrafters
  const trackStages = track.stages.map((s) => {
    const prog = progressMap.get(s.id);
    return {
      slug: s.slug,
      stepNumber: s.stepNumber,
      title: s.title,
      status: prog?.status || (simulatedRole === Role.MEMBER ? 'IN_PROGRESS' : 'LOCKED'),
    };
  });

  // Próxima etapa
  const currentIndex = track.stages.findIndex((s) => s.id === stage.id);
  const nextStage = currentIndex >= 0 && currentIndex + 1 < track.stages.length
    ? track.stages[currentIndex + 1]
    : null;

  const prevStage = currentIndex > 0
    ? track.stages[currentIndex - 1]
    : null;

  return (
    <StageWorkspaceClient
      stage={{
        id: stage.id,
        slug: stage.slug,
        stepNumber: stage.stepNumber,
        title: stage.title,
        theoryMd: stage.theoryMd,
        missionMd: stage.missionMd,
        hints: stage.hints,
        validationType: stage.validationType,
      }}
      track={{
        slug: track.slug,
        title: track.title,
        order: track.order,
      }}
      trackStages={trackStages}
      userProgress={
        userProgress
          ? {
              status: userProgress.status,
              attempts: userProgress.attempts,
              completedAt: userProgress.completedAt ? userProgress.completedAt.toISOString() : null,
            }
          : null
      }
      cliToken={user?.cliToken || 'trainee-cli-token-demo-5678'}
      userRole={user?.role || simulatedRole}
      nextStageSlug={nextStage ? nextStage.slug : null}
      prevStageSlug={prevStage ? prevStage.slug : null}
    />
  );
}
