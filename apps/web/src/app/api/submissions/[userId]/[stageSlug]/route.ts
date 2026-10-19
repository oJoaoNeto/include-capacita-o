import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string; stageSlug: string } }
) {
  try {
    const { userId, stageSlug } = params;

    const stage = await prisma.stage.findUnique({
      where: { slug: stageSlug },
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        stageId: stage.id,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        passed: true,
        feedbackMsg: true,
        rawLogs: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stage: {
        slug: stage.slug,
        title: stage.title,
      },
      submissions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de submissões: ' + error.message },
      { status: 500 }
    );
  }
}
