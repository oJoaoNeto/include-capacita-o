import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const tracks = await prisma.track.findMany({
    include: {
      stages: {
        orderBy: { stepNumber: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-12 flex flex-col justify-center">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
          <span>Inspirado na Metodologia CodeCrafters</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Aprenda Git, GitLab e Docker <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            na prática e no terminal
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          Chega de aulas passivas e correções manuais demoradas. Na plataforma <strong>Capacitação inclu</strong>,
          você escreve código, resolve conflitos reais e sobe containers com feedback pedagógico instantâneo.
        </p>

        {/* Persona Selectors */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/learn"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            Começar Jornada de Trainee (Modo Guiado)
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all text-sm"
          >
            Painel de Gestão (Diretoria)
          </Link>
        </div>
      </div>

      {/* Grid das 3 Trilhas */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-950/60 px-2.5 py-1 rounded border border-blue-800/40">
                  Trilha {track.order}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {track.stages.length} Micro-Etapas
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{track.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {track.description}
              </p>
            </div>

            <div>
              <div className="border-t border-slate-800/80 pt-4 mb-4">
                <p className="text-xs font-semibold text-slate-400 mb-2">Primeiras Etapas:</p>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {track.stages.slice(0, 3).map((stage) => (
                    <li key={stage.id} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{stage.stepNumber}. {stage.title}</span>
                    </li>
                  ))}
                  {track.stages.length > 3 && (
                    <li className="text-slate-400 text-[11px] italic">
                      + mais {track.stages.length - 3} etapas práticas
                    </li>
                  )}
                </ul>
              </div>

              <Link
                href={`/tracks/${track.slug}/${track.stages[0]?.slug || '1'}`}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700/60"
              >
                Acessar Trilha →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Widget da CLI Local */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/80 border border-slate-800 rounded-xl p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/40 mb-2">
              <span>CLI de Validação Local: ej-cap</span>
            </div>
            <h3 className="text-xl font-bold text-white">Como funciona na máquina do aluno?</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              A CLI inspeciona seus comandos Git locais e seus containers Docker sem enviar nada para servidores externos.
              Você recebe correções pedagógicas em português diretamente no terminal.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2 w-full md:w-auto">
            <p className="text-slate-500"># 1. Autentique seu terminal</p>
            <p className="text-blue-400">npx ej-cap login trainee-cli-token-demo-5678</p>
            <p className="text-slate-500 pt-1"># 2. Prepare cenários práticos (ex: conflito)</p>
            <p className="text-amber-400">npx ej-cap setup 1.7</p>
            <p className="text-slate-500 pt-1"># 3. Valide o exercício e receba feedback</p>
            <p className="text-emerald-400">npx ej-cap verify</p>
          </div>
        </div>
      </div>
    </div>
  );
}
