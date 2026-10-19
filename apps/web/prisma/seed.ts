import { PrismaClient, Role, StageStatus, ValidationType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface TrackMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
}

interface StageMeta {
  slug: string;
  stepNumber: number;
  title: string;
  validationType: ValidationType;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Caminho das tracks em packages/content/tracks
  const contentDir = path.resolve(process.cwd(), 'packages/content/tracks');

  if (!fs.existsSync(contentDir)) {
    throw new Error(`Content directory not found at: ${contentDir}`);
  }

  const trackFolders = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const trackFolder of trackFolders) {
    const trackPath = path.join(contentDir, trackFolder);
    const trackJsonPath = path.join(trackPath, 'track.json');
    if (!fs.existsSync(trackJsonPath)) continue;

    const trackMeta: TrackMeta = JSON.parse(fs.readFileSync(trackJsonPath, 'utf8'));

    const track = await prisma.track.upsert({
      where: { slug: trackMeta.slug },
      update: {
        title: trackMeta.title,
        description: trackMeta.description,
        order: trackMeta.order,
      },
      create: {
        slug: trackMeta.slug,
        title: trackMeta.title,
        description: trackMeta.description,
        order: trackMeta.order,
      },
    });

    console.log(`📌 Upserted Track: ${track.title} (${track.slug})`);

    const stageFolders = fs
      .readdirSync(trackPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    for (const stageFolder of stageFolders) {
      const stagePath = path.join(trackPath, stageFolder);
      const stageJsonPath = path.join(stagePath, 'stage.json');
      const theoryPath = path.join(stagePath, 'theory.md');
      const missionPath = path.join(stagePath, 'mission.md');
      const hintsPath = path.join(stagePath, 'hints.json');

      if (!fs.existsSync(stageJsonPath)) continue;

      const stageMeta: StageMeta = JSON.parse(fs.readFileSync(stageJsonPath, 'utf8'));
      const theoryMd = fs.existsSync(theoryPath) ? fs.readFileSync(theoryPath, 'utf8') : '';
      const missionMd = fs.existsSync(missionPath) ? fs.readFileSync(missionPath, 'utf8') : '';
      const hints: string[] = fs.existsSync(hintsPath) ? JSON.parse(fs.readFileSync(hintsPath, 'utf8')) : [];

      await prisma.stage.upsert({
        where: { slug: stageMeta.slug },
        update: {
          title: stageMeta.title,
          stepNumber: stageMeta.stepNumber,
          theoryMd,
          missionMd,
          hints,
          validationType: stageMeta.validationType,
        },
        create: {
          trackId: track.id,
          slug: stageMeta.slug,
          stepNumber: stageMeta.stepNumber,
          title: stageMeta.title,
          theoryMd,
          missionMd,
          hints,
          validationType: stageMeta.validationType,
        },
      });

      console.log(`   ✨ Stage: [${stageMeta.stepNumber}] ${stageMeta.title} (${stageMeta.slug})`);
    }
  }

  // Criação de usuários de teste e demonstração
  console.log('\n👥 Seeding demo users...');

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ej.com' },
    update: {},
    create: {
      name: 'Diretor de Projetos (Admin)',
      email: 'admin@ej.com',
      role: Role.ADMIN,
      cohort: 'Diretoria 2026',
      cliToken: 'admin-cli-token-demo-1234',
      gitlabUsername: 'ej-admin',
      gitlabUserId: 1001,
    },
  });
  console.log(`👤 Admin created: ${admin.email} (cliToken: ${admin.cliToken})`);

  // 2. Trainee (inicia na 1.1)
  const trainee = await prisma.user.upsert({
    where: { email: 'trainee@ej.com' },
    update: {},
    create: {
      name: 'Trainee Exemplo',
      email: 'trainee@ej.com',
      role: Role.TRAINEE,
      cohort: 'PS 2026.2',
      cliToken: 'trainee-cli-token-demo-5678',
      gitlabUsername: 'trainee-ej',
      gitlabUserId: 1002,
    },
  });
  console.log(`👤 Trainee created: ${trainee.email} (cliToken: ${trainee.cliToken})`);

  // Inicializa o progresso do Trainee: etapa 1.1 como IN_PROGRESS, outras como LOCKED
  const allStages = await prisma.stage.findMany({
    include: { track: true },
    orderBy: [{ track: { order: 'asc' } }, { stepNumber: 'asc' }],
  });

  for (let i = 0; i < allStages.length; i++) {
    const stage = allStages[i];
    const initialStatus = (stage.track.slug === 'git-local' && stage.stepNumber === 1)
      ? StageStatus.IN_PROGRESS
      : StageStatus.LOCKED;

    await prisma.userProgress.upsert({
      where: {
        userId_stageId: {
          userId: trainee.id,
          stageId: stage.id,
        },
      },
      update: {},
      create: {
        userId: trainee.id,
        stageId: stage.id,
        status: initialStatus,
      },
    });
  }

  // 3. Member (Modo livre)
  const member = await prisma.user.upsert({
    where: { email: 'membro@ej.com' },
    update: {},
    create: {
      name: 'Membro Desenvolvedor',
      email: 'membro@ej.com',
      role: Role.MEMBER,
      cohort: 'Membros Efetivos',
      cliToken: 'member-cli-token-demo-9012',
      gitlabUsername: 'membro-ej',
      gitlabUserId: 1003,
    },
  });
  console.log(`👤 Member created: ${member.email} (cliToken: ${member.cliToken})`);

  // Inicializa progresso do Membro: todas as etapas como IN_PROGRESS (modo livre)
  for (const stage of allStages) {
    await prisma.userProgress.upsert({
      where: {
        userId_stageId: {
          userId: member.id,
          stageId: stage.id,
        },
      },
      update: {},
      create: {
        userId: member.id,
        stageId: stage.id,
        status: StageStatus.IN_PROGRESS,
      },
    });
  }

  // 4. Pending (Sala de espera)
  const pending = await prisma.user.upsert({
    where: { email: 'candidato@ej.com' },
    update: {},
    create: {
      name: 'Candidato Pendente',
      email: 'candidato@ej.com',
      role: Role.PENDING,
      cliToken: 'pending-cli-token-demo-3456',
      gitlabUsername: 'candidato-ej',
      gitlabUserId: 1004,
    },
  });
  console.log(`👤 Pending User created: ${pending.email}`);

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
