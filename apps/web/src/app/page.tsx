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

  const getTrackIcon = (order: number) => {
    switch (order) {
      case 1:
        return '🌱';
      case 2:
        return '🦊';
      case 3:
        return '🐳';
      default:
        return '⚡';
    }
  };

  const getTrackBadge = (order: number) => {
    switch (order) {
      case 1:
        return { label: 'Local-First', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' };
      case 2:
        return { label: 'Cloud Workflow', color: 'border-orange-500/30 text-orange-400 bg-orange-500/10' };
      case 3:
        return { label: 'Containers', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' };
      default:
        return { label: 'Desafio', color: 'border-slate-500/30 text-slate-400 bg-slate-500/10' };
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1b2234] bg-gradient-to-b from-[#0e1422] via-[#080c14] to-[#080c14] py-16 sm:py-24">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/2 -right-40 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>INSPIRADO NA METODOLOGIA CODECRAFTERS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                Aprenda Git, GitLab e Docker <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  na prática e no seu terminal.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Chega de aulas passivas e correções manuais. Resolva conflitos reais, abra Merge Requests automatizados e orquestre containers Docker com uma CLI local e feedback pedagógico instantâneo.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/learn"
                  className="px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#080c14] font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <span>Iniciar Jornada Prática</span>
                  <span className="text-xs font-mono">→</span>
                </Link>

                <Link
                  href="/admin"
                  className="px-5 py-3 rounded-lg bg-[#111726] hover:bg-[#161f33] text-slate-300 hover:text-white border border-[#212b42] text-sm font-medium transition-colors"
                >
                  Painel de Gestão (Admin)
                </Link>
              </div>

              {/* Quick Terminal Token Pill */}
              <div className="pt-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Comando de autenticação rápida no terminal:
                </p>
                <div className="inline-flex items-center gap-3 bg-[#0c101a] border border-[#1b2234] rounded-lg px-3.5 py-2 text-xs font-mono text-slate-300 max-w-full overflow-x-auto">
                  <span className="text-emerald-400 select-none">$</span>
                  <span className="select-all text-slate-200">npx ej-cap login trainee-cli-token-demo-5678</span>
                  <span className="text-[10px] bg-[#162033] text-slate-400 px-1.5 py-0.5 rounded border border-[#22304d]">
                    Enter
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: CodeCrafters-style Terminal Mockup */}
            <div className="lg:col-span-5">
              <div className="terminal-window shadow-2xl shadow-emerald-950/20">
                <div className="terminal-header flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="terminal-dot bg-rose-500/80" />
                    <span className="terminal-dot bg-amber-500/80" />
                    <span className="terminal-dot bg-emerald-500/80" />
                    <span className="text-[11px] font-mono text-slate-400 ml-2">ej-cap — runner local</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">zsh</span>
                </div>

                <div className="terminal-body space-y-3 font-mono text-xs leading-relaxed">
                  <div>
                    <span className="text-emerald-400">$</span> <span className="text-slate-200">ej-cap setup 1.7</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      [1.7] Clonando repositório com conflito main vs feature/auth...
                    </p>
                    <p className="text-emerald-400/90 text-[11px]">
                      ✔ Cenário preparado em ./workspace-git
                    </p>
                  </div>

                  <div className="pt-1">
                    <span className="text-emerald-400">$</span> <span className="text-slate-200">git merge feature/auth</span>
                    <p className="text-amber-400 text-[11px] mt-0.5">
                      CONFLICT (content): Merge conflict in src/auth.ts
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      (Resolva os marcadores &lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD e faça o commit)
                    </p>
                  </div>

                  <div className="pt-1 border-t border-[#1b2234]">
                    <span className="text-emerald-400">$</span> <span className="text-slate-200">ej-cap verify</span>
                    <div className="mt-1 space-y-0.5 text-[11px]">
                      <p className="text-emerald-400">✔ Repositório Git válido</p>
                      <p className="text-emerald-400">✔ Marcadores de conflito removidos</p>
                      <p className="text-emerald-400">✔ Commit semântico detectado</p>
                      <p className="text-emerald-400 font-bold mt-1.5">
                        🎉 PARÂMETROS APROVADOS! Micro-etapa 1.7 concluída.
                      </p>
                      <p className="text-cyan-400 text-[10px]">
                        → Sincronizado com a plataforma web. Próxima etapa liberada!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tracks Showcase Catalog */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#1b2234] gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
              Catálogo de Desafios
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Trilhas de Aprendizado Prático
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              17 micro-etapas sequenciais desenhadas para construir autonomia técnica real.
            </p>
          </div>
          <Link
            href="/learn"
            className="text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>Ver visão detalhada das 17 etapas</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tracks.map((track) => {
            const badge = getTrackBadge(track.order);
            const icon = getTrackIcon(track.order);

            return (
              <div
                key={track.id}
                className="group relative bg-[#0e1422] border border-[#1b2234] hover:border-[#2a3652] rounded-xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{icon}</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-500 mb-1">
                    TRILHA 0{track.order} • {track.stages.length} ETAPAS
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                    {track.title}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed mb-6">
                    {track.description}
                  </p>
                </div>

                <div>
                  {/* Stage Stepper mini preview */}
                  <div className="border-t border-[#161f32] pt-4 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                      <span>Roteiro de Etapas:</span>
                      <span>1 a {track.stages.length}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {track.stages.map((stage) => (
                        <Link
                          key={stage.id}
                          href={`/tracks/${track.slug}/${stage.slug}`}
                          title={`${track.order}.${stage.stepNumber} - ${stage.title}`}
                          className="w-7 h-7 rounded bg-[#131a29] hover:bg-[#1b263b] hover:border-emerald-500/50 border border-[#202b42] text-[11px] font-mono text-slate-300 flex items-center justify-center transition-all"
                        >
                          {stage.stepNumber}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={`/tracks/${track.slug}/${track.stages[0]?.slug || '1'}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141b2c] hover:bg-emerald-500 hover:text-[#080c14] text-slate-200 text-xs font-mono font-medium rounded-lg transition-all border border-[#24314c] hover:border-emerald-400"
                  >
                    <span>Acessar Trilha</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CodeCrafters Methodology Pillars */}
      <section className="py-16 bg-[#0a0f1a] border-t border-[#1b2234]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              A Metodologia
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Como funciona o ciclo prático?
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Inspirada em plataformas modernas de engenharia, onde o aluno aprende operando ferramentas profissionais reais.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg mb-4">
                💻
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Terminal Real (Local-First)</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Você executa os comandos na sua própria máquina (Linux, WSL2, macOS ou Windows). A ferramenta <code className="text-emerald-400 font-mono">ej-cap</code> inspeciona o ambiente localmente sem emuladores lentos.
              </p>
            </div>

            <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg mb-4">
                🎯
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Dicas Progressivas & Tradução</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Erros obscuros do Git e Docker são traduzidos em explicações didáticas em português, com 3 níveis graduais de pistas para você aprender a resolver sem travar.
              </p>
            </div>

            <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center text-lg mb-4">
                🦊
              </div>
              <h3 className="text-base font-semibold text-white mb-2">GitLab Cloud & Bot Mentor</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Abra Merge Requests e interaja com o <code className="text-orange-400 font-mono">@ej-mentor-bot</code>. Validação em tempo real via API REST v4, com custo rigorosamente zero de minutos de CI/CD runners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Quick Start Footer Section */}
      <section className="py-12 border-t border-[#1b2234]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-lg font-bold text-white mb-2">
            Pronto para testar seu primeiro desafio?
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-lg mx-auto">
            Abra seu terminal agora mesmo e comece a resolver a micro-etapa 1.1 da trilha de Git.
          </p>

          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-4 inline-flex flex-col sm:flex-row items-center gap-3 text-left font-mono text-xs">
            <span className="text-slate-400">1. Setup da Etapa:</span>
            <code className="text-emerald-400 bg-[#080c14] px-2.5 py-1 rounded border border-[#1b2234]">
              npx ej-cap setup 1.1
            </code>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-400">2. Validação:</span>
            <code className="text-cyan-400 bg-[#080c14] px-2.5 py-1 rounded border border-[#1b2234]">
              npx ej-cap verify
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
