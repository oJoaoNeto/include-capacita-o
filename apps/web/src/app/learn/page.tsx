import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, StageStatus } from '@prisma/client';
import { LearnCatalogClient } from '@/components/LearnCatalogClient';

export const dynamic = 'force-dynamic';

export default async function LearnDashboardPage({
  searchParams,
}: {
  searchParams: { as?: string };
}) {
  // 1. Exige autenticação estrita
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/learn');
  }

  // 2. Busca o usuário autenticado e as trilhas em paralelo (sem carregar theoryMd/missionMd pesado)
  const [user, tracks] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: {
        id: true,
        role: true,
        progress: {
          select: {
            stageId: true,
            status: true,
            attempts: true,
            completedAt: true,
          },
        },
      },
    }),
    prisma.track.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        order: true,
        stages: {
          select: {
            id: true,
            slug: true,
            stepNumber: true,
            title: true,
          },
          orderBy: { stepNumber: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    }),
  ]);

  if (!user) {
    redirect('/login?callbackUrl=/learn');
  }

  if (user.role === Role.PENDING) {
    redirect('/waiting-room');
  }

  // Se o usuário for ADMIN, permite simular persona
  const effectiveRole =
    user.role === Role.ADMIN && searchParams.as
      ? searchParams.as === 'member'
        ? Role.MEMBER
        : Role.TRAINEE
      : user.role;

  const progressMap = new Map(user.progress.map((p) => [p.stageId, p]));

  const totalStages = tracks.reduce((acc, t) => acc + t.stages.length, 0);
  const totalCompleted = tracks.reduce(
    (acc, t) =>
      acc +
      t.stages.filter((s) => progressMap.get(s.id)?.status === StageStatus.COMPLETED).length,
    0
  );
  const overallPercent = totalStages > 0 ? Math.round((totalCompleted / totalStages) * 100) : 0;

  const getTrackMetadata = (slug: string, order: number) => {
    if (slug.includes('git-local') || order === 1) {
      return {
        icon: '🌱',
        badge: 'Local-First',
        category: 'git' as const,
        difficulty: 'Iniciante',
        estimatedTime: '~45 min',
      };
    }
    if (slug.includes('gitlab') || order === 2) {
      return {
        icon: '🦊',
        badge: 'Cloud Workflow',
        category: 'gitlab' as const,
        difficulty: 'Intermediário',
        estimatedTime: '~35 min',
      };
    }
    if (slug.includes('docker') || order === 3) {
      return {
        icon: '🐳',
        badge: 'Containers',
        category: 'docker' as const,
        difficulty: 'Intermediário',
        estimatedTime: '~50 min',
      };
    }
    return {
      icon: '⚡',
      badge: 'Desafio',
      category: 'other' as const,
      difficulty: 'Geral',
      estimatedTime: '~30 min',
    };
  };

  const formattedTracks = tracks.map((t) => {
    const meta = getTrackMetadata(t.slug, t.order);
    const completedCount = t.stages.filter(
      (s) => progressMap.get(s.id)?.status === StageStatus.COMPLETED
    ).length;
    const progressPercent =
      t.stages.length > 0 ? Math.round((completedCount / t.stages.length) * 100) : 0;

    const stages = t.stages.map((s) => {
      const prog = progressMap.get(s.id);
      const status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED' =
        (prog?.status as any) ||
        (effectiveRole === Role.MEMBER || effectiveRole === Role.ADMIN ? 'IN_PROGRESS' : 'LOCKED');

      return {
        id: s.id,
        slug: s.slug,
        stepNumber: s.stepNumber,
        title: s.title,
        status,
      };
    });

    return {
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      order: t.order,
      stages,
      completedCount,
      progressPercent,
      icon: meta.icon,
      badge: meta.badge,
      category: meta.category,
      difficulty: meta.difficulty,
      estimatedTime: meta.estimatedTime,
    };
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <LearnCatalogClient
        tracks={formattedTracks}
        userRole={effectiveRole}
        overallStats={{
          totalStages,
          totalCompleted,
          overallPercent,
        }}
      />
    </div>
  );
}
