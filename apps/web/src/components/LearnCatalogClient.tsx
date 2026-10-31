'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface StageSummary {
  id: string;
  slug: string;
  stepNumber: number;
  title: string;
  status: 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';
}

interface TrackItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  stages: StageSummary[];
  completedCount: number;
  progressPercent: number;
  icon: string;
  badge: string;
  category: 'git' | 'gitlab' | 'docker' | 'other';
  difficulty: string;
  estimatedTime: string;
}

interface LearnCatalogClientProps {
  tracks: TrackItem[];
  userRole: string;
  overallStats: {
    totalStages: number;
    totalCompleted: number;
    overallPercent: number;
  };
}

export function LearnCatalogClient({
  tracks,
  userRole,
  overallStats,
}: LearnCatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'order' | 'progress' | 'title'>('order');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtra e ordena as trilhas em tempo real
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((t) => {
        // Filtro por texto
        const query = searchTerm.toLowerCase().trim();
        const matchesQuery =
          !query ||
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.stages.some((s) => s.title.toLowerCase().includes(query));

        if (!matchesQuery) return false;

        // Filtro por categoria
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'in_progress') return t.progressPercent > 0 && t.progressPercent < 100;
        if (selectedCategory === 'completed') return t.progressPercent === 100;
        if (selectedCategory === 'git') return t.category === 'git';
        if (selectedCategory === 'gitlab') return t.category === 'gitlab';
        if (selectedCategory === 'docker') return t.category === 'docker';

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return b.progressPercent - a.progressPercent;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return a.order - b.order;
      });
  }, [tracks, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      {/* Overview Hero Bar */}
      <div className="bg-[#0e1422] border border-[#1b2234] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-xs font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CATÁLOGO MODULAR DE DESAFIOS</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Trilhas de Aprendizado Prático
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Desenvolva autonomia em Git, GitLab e Docker através de micro-etapas práticas executadas diretamente no seu terminal local.
            </p>
          </div>

          {/* Overall Progress Widget */}
          <div className="bg-[#080c14]/80 border border-[#1b2234] rounded-xl p-4 min-w-[260px] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Progresso Geral:</span>
              <span className="text-emerald-400 font-bold">{overallStats.overallPercent}%</span>
            </div>
            <div className="w-full bg-[#162033] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overallStats.overallPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{overallStats.totalCompleted} de {overallStats.totalStages} micro-etapas</span>
              <span className="capitalize">{userRole.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Pills, Sort & View Mode (Solves infinite list) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar trilha ou tecnologia (ex: git, docker, conflito)..."
              className="w-full bg-[#0e1422] border border-[#1b2234] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0e1422] border border-[#1b2234] rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="order">Ordem da Trilha (Padrão)</option>
              <option value="progress">Mais Avançadas</option>
              <option value="title">Nome (A-Z)</option>
            </select>

            <div className="flex items-center bg-[#0e1422] border border-[#1b2234] rounded-xl p-1 gap-1">
              <button
                onClick={() => setViewMode('grid')}
                title="Visualização em Grade"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Visualização em Lista Compacta"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({tracks.length})
          </button>
          <button
            onClick={() => setSelectedCategory('git')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'git'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            🌱 Git Local
          </button>
          <button
            onClick={() => setSelectedCategory('gitlab')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'gitlab'
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            🦊 GitLab CI/Cloud
          </button>
          <button
            onClick={() => setSelectedCategory('docker')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'docker'
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            🐳 Docker & Containers
          </button>
          <button
            onClick={() => setSelectedCategory('in_progress')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'in_progress'
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            ⏳ Em Andamento
          </button>
          <button
            onClick={() => setSelectedCategory('completed')}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedCategory === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-[#0e1422] border-[#1b2234] text-slate-400 hover:text-slate-200'
            }`}
          >
            ✔ Concluídas
          </button>
        </div>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-[#1b2234] pb-2">
        <span>Exibindo {filteredTracks.length} de {tracks.length} trilhas</span>
        {(searchTerm || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="text-emerald-400 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredTracks.length === 0 && (
        <div className="bg-[#0e1422] border border-[#1b2234] rounded-2xl p-12 text-center space-y-4">
          <div className="text-3xl">🔍</div>
          <h3 className="text-base font-bold text-white">Nenhuma trilha encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Não encontramos nenhuma trilha correspondente aos filtros selecionados. Tente buscar por outros termos.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#080c14] font-bold text-xs rounded-lg transition-colors font-mono"
          >
            Redefinir Filtros
          </button>
        </div>
      )}

      {/* Grid Mode */}
      {viewMode === 'grid' && filteredTracks.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="group bg-[#0e1422] border border-[#1b2234] hover:border-[#2a3652] rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 shadow-xl shadow-black/40"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{track.icon}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      TRILHA 0{track.order}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#202b42] text-slate-300 bg-[#121929]">
                    {track.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                  {track.title}
                </h2>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6">
                  {track.description}
                </p>
              </div>

              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-400">
                      {track.completedCount} de {track.stages.length} etapas
                    </span>
                    <span className="text-emerald-400 font-bold">{track.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#162033] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${track.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stage Roadmap Pills */}
                <div className="pt-2 border-t border-[#161f32]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {track.stages.map((st) => {
                      const isCompleted = st.status === 'COMPLETED';
                      const isInProgress = st.status === 'IN_PROGRESS';

                      return (
                        <Link
                          key={st.id}
                          href={`/tracks/${track.slug}/${st.slug}`}
                          title={`${st.stepNumber}. ${st.title} (${st.status})`}
                          className={`w-7 h-7 rounded text-[11px] font-mono flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                              : isInProgress
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-[#121929] text-slate-500 border border-[#1e283d] hover:border-slate-600'
                          }`}
                        >
                          {isCompleted ? '✓' : st.stepNumber}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/tracks/${track.slug}/${track.stages[0]?.slug || '1'}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141b2c] hover:bg-emerald-500 hover:text-[#080c14] text-slate-200 text-xs font-mono font-medium rounded-lg transition-all border border-[#24314c] hover:border-emerald-400"
                >
                  <span>{track.progressPercent === 100 ? 'Revisar Trilha' : 'Acessar Trilha'}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Mode (Clean and Compact for 10+ tracks) */}
      {viewMode === 'list' && filteredTracks.length > 0 && (
        <div className="space-y-3">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className="bg-[#0e1422] border border-[#1b2234] hover:border-[#2a3652] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <span className="text-3xl sm:text-2xl">{track.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">
                      TRILHA 0{track.order}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded border border-[#202b42] text-slate-400 bg-[#121929]">
                      {track.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-xl">
                    {track.description}
                  </p>
                </div>
              </div>

              {/* Progress & Quick Stepper */}
              <div className="flex items-center gap-6 justify-between sm:justify-end">
                <div className="w-32 hidden md:block">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-400">{track.completedCount}/{track.stages.length}</span>
                    <span className="text-emerald-400 font-bold">{track.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#162033] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${track.progressPercent}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/tracks/${track.slug}/${track.stages[0]?.slug || '1'}`}
                  className="px-4 py-2 bg-[#141b2c] hover:bg-emerald-500 hover:text-[#080c14] text-slate-200 text-xs font-mono rounded-lg transition-all border border-[#24314c] hover:border-emerald-400 whitespace-nowrap"
                >
                  Abrir →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
