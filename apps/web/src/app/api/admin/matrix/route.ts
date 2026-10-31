import { NextRequest, NextResponse } from 'next/server';
import { Role, StageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MatrixStageColumn, MatrixUserRow, AdminMatrixResponse } from '@inclu/shared';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedCohort = searchParams.get('cohort');

    const userFilter: any = { isActive: true };
    if (selectedCohort && selectedCohort !== 'all') {
      userFilter.cohort = selectedCohort;
    }

    // Executa em paralelo no banco
    const [cohortResults, allStages, users] = await Promise.all([
      prisma.user.findMany({
        where: { cohort: { not: null } },
        select: { cohort: true },
        distinct: ['cohort'],
      }),

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

      prisma.user.findMany({
        where: userFilter,
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

    const matrixResponse: AdminMatrixResponse = {
      cohorts,
      currentCohort: selectedCohort || 'all',
      stages: stageColumns,
      trainees,
      members,
    };

    return NextResponse.json(matrixResponse);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao carregar matriz de acompanhamento: ' + error.message },
      { status: 500 }
    );
  }
}
