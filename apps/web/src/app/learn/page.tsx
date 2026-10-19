import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Role, StageStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function LearnDashboardPage({
  searchParams,
}: {
  searchParams: { as?: string };
}) {
  const simulatedRole = searchParams.as === 'member' ? Role.MEMBER : Role.TRAINEE;

  // Busca o usuário correspondente ao papel selecionado
  const user = await prisma.user.findFirst({
    where: { role: simulatedRole },
    include: {
      progress: {
        include: { stage: true },
      },
    },
  });

  const tracks = await prisma.track.findMany({
    include: {
      stages: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  const progressMap = new Map(user?.progress.map((p) => [p.stageId, p]) || []);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
      {/* Top Banner de Aluno & Persona Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold text-white">
              Painel de Aprendizado: {user?.name || 'Aluno'}
            </h1>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                simulatedRole === Role.TRAINEE
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {simulatedRole === Role.TRAINEE ? 'Modo Guiado (Trainee)' : 'Modo Livre (Membro)'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Turma: <strong className="text-slate-300">{user?.cohort || 'PS 2026.2'}</strong> | E-mail: {user?.email}
          </p>
        </div>

        {/* Simulação de Perfis para Teste */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 px-2">Visualizar como:</span>
          <Link
            href="/learn?as=trainee"
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              simulatedRole === Role.TRAINEE
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trainee (Linear)
          </Link>
          <Link
            href="/learn?as=member"
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              simulatedRole === Role.MEMBER
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Membro (Livre)
          </Link>
        </div>
      </div>

      {/* Relação das 3 Trilhas */}
      <div className="space-y-10">
        {tracks.map((track) => {
          const completedCount = track.stages.filter(
            (s) => progressMap.get(s.id)?.status === StageStatus.COMPLETED
          ).length;
          const percent = Math.round((completedCount / track.stages.length) * 100);

          return (
            <div key={track.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2 mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Trilha {track.order}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      {completedCount} de {track.stages.length} concluídas
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">{track.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{track.description}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">{percent}%</span>
                </div>
              </div>

              {/* Lista de Micro-Etapas */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {track.stages.map((stage) => {
                  const prog = progressMap.get(stage.id);
                  const isMember = simulatedRole === Role.MEMBER;
                  const isCompleted = prog?.status === StageStatus.COMPLETED;
                  const isInProgress = prog?.status === StageStatus.IN_PROGRESS;
                  const isLocked = !isMember && prog?.status === StageStatus.LOCKED;
                  const attempts = prog?.attempts || 0;

                  return (
                    <div
                      key={stage.id}
                      className={`relative rounded-xl border p-4 flex flex-col justify-between transition-all ${
                        isLocked
                          ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                          : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60'
                          : 'bg-slate-900 border-blue-500/30 hover:border-blue-500/60 shadow-lg shadow-blue-500/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            Etapa {stage.stepNumber}
                          </span>

                          {isCompleted ? (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                              <span>✔ Concluído</span>
                            </span>
                          ) : isInProgress ? (
                            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-semibold animate-pulse">
                              Em Andamento
                            </span>
                          ) : (
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-semibold flex items-center space-x-1">
                              <span>🔒 Bloqueado</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white line-clamp-1">{stage.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Validação: <span className="font-mono text-slate-300">{stage.validationType}</span>
                        </p>
                        {attempts > 0 && !isCompleted && (
                          <p className="text-[11px] text-amber-400 mt-1">
                            {attempts} tentativa{attempts > 1 ? 's' : ''} realizada{attempts > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/60">
                        {isLocked ? (
                          <span className="text-xs text-slate-500 italic block text-center py-1">
                            Conclua a etapa anterior para desbloquear
                          </span>
                        ) : (
                          <Link
                            href={`/tracks/${track.slug}/${stage.slug}?as=${simulatedRole.toLowerCase()}`}
                            className={`w-full inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isCompleted
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isCompleted ? 'Revisar Conteúdo' : 'Entrar na Missão →'}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
