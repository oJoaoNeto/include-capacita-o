import { NextRequest, NextResponse } from 'next/server';
import { Role, StageStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MatrixStageColumn, MatrixUserRow, AdminMatrixResponse } from '@inclu/shared';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedCohort = searchParams.get('cohort');

    // 1. Carrega todas as turmas (cohorts) disponíveis
    const cohortResults = await prisma.user.findMany({
      where: { cohort: { not: null } },
      select: { cohort: true },
      distinct: ['cohort'],
    });
    const cohorts = cohortResults.map(c => c.cohort!).filter(Boolean);

    // 2. Carrega todas as 17 etapas ordenadas
    const allStages = await prisma.stage.findMany({
      include: { track: true },
      orderBy: [
        { track: { order: 'asc' } },
        { stepNumber: 'asc' },
      ],
    });

    const stageColumns: MatrixStageColumn[] = allStages.map(s => ({
      slug: s.slug,
      stepNumber: s.stepNumber,
      title: s.title,
      trackOrder: s.track.order,
    }));

    // 3. Monta filtro de usuários
    const userFilter: any = { isActive: true };
    if (selectedCohort && selectedCohort !== 'all') {
      userFilter.cohort = selectedCohort;
    }

    // 4. Carrega Trainees e Membros com seus progressos
    const users = await prisma.user.findMany({
      where: userFilter,
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
        const prog = u.progress.find(p => p.stageId === s.id);
        const attempts = prog?.attempts || 0;
        const status = prog?.status || (u.role === Role.MEMBER ? StageStatus.IN_PROGRESS : StageStatus.LOCKED);
        const isCompleted = status === StageStatus.COMPLETED;

        stageMap[s.slug] = {
          stageSlug: s.slug,
          status,
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

    const trainees = users
      .filter(u => u.role === Role.TRAINEE)
      .map(formatUserRow);

    const members = users
      .filter(u => u.role === Role.MEMBER)
      .map(formatUserRow);

    const response: AdminMatrixResponse = {
      cohorts,
      currentCohort: selectedCohort || cohorts[0] || null,
      stages: stageColumns,
      trainees,
      members,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao carregar matriz de acompanhamento: ' + error.message },
      { status: 500 }
    );
  }
}
