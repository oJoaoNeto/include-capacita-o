import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserProfileClient } from '@/components/UserProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
    include: {
      progress: true,
    },
  });

  if (!user) {
    redirect('/login?callbackUrl=/profile');
  }

  const totalStages = await prisma.stage.count();
  const completedStages = user.progress.filter((p) => p.status === 'COMPLETED').length;
  const inProgressStages = user.progress.filter((p) => p.status === 'IN_PROGRESS').length;

  return (
    <UserProfileClient
      initialUser={{
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        gitlabUsername: user.gitlabUsername,
        cliToken: user.cliToken,
        role: user.role,
        cohort: user.cohort,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={{
        completedStages,
        inProgressStages,
        totalStages,
      }}
    />
  );
}
