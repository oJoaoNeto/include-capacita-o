import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

  // 1. Exige autenticação estrita para acessar micro-etapas
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/tracks/${trackSlug}/${stageSlug}`)}`);
  }

  // 2. Busca o usuário real autenticado
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    include: {
      progress: true,
    },
  });

  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/tracks/${trackSlug}/${stageSlug}`)}`);
  }

  if (user.role === Role.PENDING) {
    redirect('/waiting-room');
  }

  // Se o usuário for ADMIN, permite simular visões pelo parâmetro ?as=
  const effectiveRole =
    user.role === Role.ADMIN && searchParams.as
      ? searchParams.as === 'member'
        ? Role.MEMBER
        : Role.TRAINEE
      : user.role;

  // 3. Busca a trilha e valida existência
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

  const progressMap = new Map(user.progress.map((p) => [p.stageId, p]));
  const userProgress = progressMap.get(stage.id) || null;

  // 4. Lista todas as etapas da trilha com status real para o Stepper CodeCrafters
  const trackStages = track.stages.map((s) => {
    const prog = progressMap.get(s.id);
    return {
      slug: s.slug,
      stepNumber: s.stepNumber,
      title: s.title,
      status: prog?.status || (effectiveRole === Role.MEMBER || effectiveRole === Role.ADMIN ? 'IN_PROGRESS' : 'LOCKED'),
    };
  });

  // Próxima e anterior
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
      cliToken={user.cliToken}
      userRole={effectiveRole}
      nextStageSlug={nextStage ? nextStage.slug : null}
      prevStageSlug={prevStage ? prevStage.slug : null}
    />
  );
}
