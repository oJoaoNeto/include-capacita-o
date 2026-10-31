import { prisma } from '@/lib/prisma';
import { Role, StageStatus } from '@prisma/client';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { AdminMatrixResponse, MatrixStageColumn, MatrixUserRow } from '@inclu/shared';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Executa todas as consultas de forma estritamente paralela no PostgreSQL com projeção seletiva
  const [cohortResults, allStages, users, pendingUsers] = await Promise.all([
    // 1. Turmas distintas
    prisma.user.findMany({
      where: { cohort: { not: null } },
      select: { cohort: true },
      distinct: ['cohort'],
    }),

    // 2. Etapas (apenas metadados, sem carregar markdown pesado de theoryMd e missionMd)
    prisma.stage.findMany({
      select: {
        id: true,
        slug: true,
        stepNumber: true,
        title: true,
        track: {
          select: {
            order: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { track: { order: 'asc' } },
        { stepNumber: 'asc' },
      ],
    }),

    // 3. Usuários ativos (apenas campos necessários do progresso, sem carregar a entidade stage inteira)
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        gitlabUsername: true,
        avatarUrl: true,
        role: true,
        cohort: true,
        progress: {
          select: {
            stageId: true,
            status: true,
            attempts: true,
            completedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),

    // 4. Usuários pendentes
    prisma.user.findMany({
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
    }),
  ]);

  const cohorts = cohortResults.map((c) => c.cohort!).filter(Boolean);

  const stageColumns: MatrixStageColumn[] = allStages.map((s) => ({
    slug: s.slug,
    stepNumber: s.stepNumber,
    title: s.title,
    trackOrder: s.track.order,
    trackTitle: s.track.title,
    trackSlug: s.track.slug,
  }));

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
