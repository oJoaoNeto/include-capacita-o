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

  const totalStages = tracks.reduce((acc, t) => acc + t.stages.length, 0);
  const totalCompleted = tracks.reduce(
    (acc, t) =>
      acc +
      t.stages.filter((s) => progressMap.get(s.id)?.status === StageStatus.COMPLETED).length,
    0
  );
  const overallPercent = Math.round((totalCompleted / totalStages) * 100);

  const getTrackDetails = (slug: string) => {
    if (slug.includes('git-local')) {
      return {
        icon: '🌱',
        badge: 'Fundamentos',
        accent: 'from-orange-500/20 to-amber-500/5',
        border: 'border-orange-500/30',
        textAccent: 'text-orange-400',
        badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        difficulty: 'Iniciante',
        time: '~40 min',
      };
    }
    if (slug.includes('gitlab')) {
      return {
        icon: '🦊',
        badge: 'Colaboração & Nuvem',
        accent: 'from-purple-500/20 to-indigo-500/5',
        border: 'border-purple-500/30',
        textAccent: 'text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        difficulty: 'Iniciante a Intermediário',
        time: '~35 min',
      };
    }
    return {
      icon: '🐳',
      badge: 'Containers',
      accent: 'from-cyan-500/20 to-blue-500/5',
      border: 'border-cyan-500/30',
      textAccent: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      difficulty: 'Intermediário',
      time: '~30 min',
    };
  };

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-10">
      {/* 1. Header Hero — CodeCrafters Style */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Capacitação Prática Hands-On
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Turma {user?.cohort || 'PS 2026.2'}</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{user?.name || 'Trainee'}</span>!
            </h1>

            <p className="text-xs lg:text-sm text-slate-400 max-w-xl leading-relaxed">
              Complete os desafios práticos executando comandos reais no seu terminal.
              Cada micro-etapa é validada automaticamente sem atrasos.
            </p>
          </div>

          {/* Overall Progress Card */}
          <div className="bg-[#0b0f19] border border-slate-800/90 rounded-xl p-4 min-w-[240px] space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Progresso Geral</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {totalCompleted}/{totalStages} etapas
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700"
                style={{ width: `${overallPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{overallPercent}% concluído</span>
              <span>3 Trilhas</span>
            </div>
          </div>
        </div>

        {/* Persona Simulator Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span>Visualização da Jornada:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${simulatedRole === Role.TRAINEE ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {simulatedRole === Role.TRAINEE ? 'Modo Guiado (Linear)' : 'Modo Livre (Sandbox)'}
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-[#070b12] p-1 rounded-lg border border-slate-800">
            <Link
              href="/learn?as=trainee"
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                simulatedRole === Role.TRAINEE
                  ? 'bg-blue-600 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simular Trainee
            </Link>
            <Link
              href="/learn?as=member"
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                simulatedRole === Role.MEMBER
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simular Membro
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Track List (CodeCrafters Challenges) */}
      <div className="space-y-8">
        {tracks.map((track) => {
          const details = getTrackDetails(track.slug);
          const completedCount = track.stages.filter(
            (s) => progressMap.get(s.id)?.status === StageStatus.COMPLETED
          ).length;
          const trackPercent = Math.round((completedCount / track.stages.length) * 100);

          return (
            <div
              key={track.id}
              className="bg-[#0c121e] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Track Header Card */}
              <div className={`p-6 border-b border-slate-800/80 bg-gradient-to-r ${details.accent}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-[#080c14] border border-slate-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {details.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${details.badgeBg}`}>
                          {details.badge}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {details.difficulty} • {details.time}
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {track.title}
                      </h2>
                    </div>
                  </div>

                  {/* Track Completion Bar */}
                  <div className="sm:text-right space-y-1.5 shrink-0">
                    <div className="flex items-center sm:justify-end space-x-2 text-xs">
                      <span className="text-slate-400 font-medium">Progresso:</span>
                      <span className="font-mono font-bold text-white">
                        {completedCount}/{track.stages.length}
                      </span>
                      <span className={`font-mono font-bold ${details.textAccent}`}>
                        ({trackPercent}%)
                      </span>
                    </div>
                    <div className="w-36 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${trackPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Stage Roadmap */}
              <div className="p-4 sm:p-6 divide-y divide-slate-800/60">
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
                      className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-4 transition-all group ${
                        isLocked
                          ? 'opacity-40 hover:opacity-50'
                          : isCompleted
                          ? 'hover:bg-slate-900/40'
                          : 'bg-emerald-950/10 border border-emerald-800/40 hover:bg-emerald-950/20'
                      }`}
                    >
                      {/* Left: Step number + Title */}
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isInProgress
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-slate-900 text-slate-600 border border-slate-800'
                          }`}
                        >
                          {isCompleted ? '✔' : isLocked ? '🔒' : stage.stepNumber}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                              {stage.title}
                            </span>
                            {isInProgress && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse hidden sm:inline">
                                Etapa Atual
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>validação: {stage.validationType.toLowerCase()}</span>
                            {attempts > 0 && !isCompleted && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400">{attempts} tentativa(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="shrink-0">
                        {isLocked ? (
                          <span className="text-[11px] font-mono text-slate-600 px-3 py-1.5 flex items-center space-x-1">
                            <span>🔒 Bloqueado</span>
                          </span>
                        ) : (
                          <Link
                            href={`/tracks/${track.slug}/${stage.slug}?as=${simulatedRole.toLowerCase()}`}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                              isCompleted
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                            }`}
                          >
                            <span>{isCompleted ? 'Revisar' : 'Iniciar'}</span>
                            <span>→</span>
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
