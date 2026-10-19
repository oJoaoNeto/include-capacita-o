import { prisma } from '@/lib/prisma';
import { Role, StageStatus } from '@prisma/client';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { AdminMatrixResponse, MatrixStageColumn, MatrixUserRow } from '@inclu/shared';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // 1. Carrega todas as turmas
  const cohortResults = await prisma.user.findMany({
    where: { cohort: { not: null } },
    select: { cohort: true },
    distinct: ['cohort'],
  });
  const cohorts = cohortResults.map((c) => c.cohort!).filter(Boolean);

  // 2. Carrega as 17 etapas
  const allStages = await prisma.stage.findMany({
    include: { track: true },
    orderBy: [
      { track: { order: 'asc' } },
      { stepNumber: 'asc' },
    ],
  });

  const stageColumns: MatrixStageColumn[] = allStages.map((s) => ({
    slug: s.slug,
    stepNumber: s.stepNumber,
    title: s.title,
    trackOrder: s.track.order,
  }));

  // 3. Carrega usuários com progresso
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      progress: {
        include: { stage: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formatUserRow = (u: typeof users[0]): MatrixUserRow => {
    const stageMap: Record<string, any> = {};

    for (const s of allStages) {
      const prog = u.progress.find((p) => p.stageId === s.id);
      const attempts = prog?.attempts || 0;
      const status = prog?.status || (u.role === Role.MEMBER ? StageStatus.IN_PROGRESS : StageStatus.LOCKED);
      const isCompleted = status === StageStatus.COMPLETED;

      stageMap[s.slug] = {
        stageSlug: s.slug,
        status: status as any,
        attempts,
        completedAt: prog?.completedAt ? prog.completedAt.toISOString() : null,
        hasCriticalFailures: attempts >= 3 && !isCompleted,
      };
    }

    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      gitlabUsername: u.gitlabUsername,
      avatarUrl: u.avatarUrl,
      role: u.role as any,
      cohort: u.cohort,
      stages: stageMap,
    };
  };

  const trainees = users.filter((u) => u.role === Role.TRAINEE).map(formatUserRow);
  const members = users.filter((u) => u.role === Role.MEMBER).map(formatUserRow);

  const initialMatrixData: AdminMatrixResponse = {
    cohorts,
    currentCohort: cohorts[0] || 'all',
    stages: stageColumns,
    trainees,
    members,
  };

  // 4. Usuários pendentes
  const pendingUsers = await prisma.user.findMany({
    where: { role: Role.PENDING },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cohort: true,
      createdAt: true,
    },
  });

  return (
    <AdminDashboardClient
      initialData={initialMatrixData}
      pendingUsers={pendingUsers.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
