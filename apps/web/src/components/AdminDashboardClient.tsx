'use client';

import { useState, useMemo } from 'react';
import { AdminMatrixResponse, MatrixUserRow, MatrixStageColumn } from '@inclu/shared';

interface AdminDashboardClientProps {
  initialData: AdminMatrixResponse;
  pendingUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    cohort: string | null;
    createdAt: string;
  }>;
}

export function AdminDashboardClient({ initialData, pendingUsers: initialPending }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'trainees' | 'members' | 'pending' | 'register'>('trainees');
  const [selectedCohort, setSelectedCohort] = useState<string>(initialData.currentCohort || 'all');
  const [matrixData, setMatrixData] = useState<AdminMatrixResponse>(initialData);
  const [pendingList, setPendingList] = useState(initialPending);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'bottleneck' | 'in_progress' | 'completed'>('all');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<'all' | number>('all');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cards expandidos (Accordion vertical)
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());

  // Slide-over Lateral (Drawer Inspector de Integrante)
  const [inspectUser, setInspectUser] = useState<MatrixUserRow | null>(null);

  // Estado do Modal de Auditoria de Submissões (RF12)
  const [auditUser, setAuditUser] = useState<MatrixUserRow | null>(null);
  const [auditStageSlug, setAuditStageSlug] = useState<string | null>(null);
  const [auditSubmissions, setAuditSubmissions] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form de Pré-Cadastro
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'TRAINEE' | 'MEMBER' | 'ADMIN'>('TRAINEE');
  const [newUserCohort, setNewUserCohort] = useState('PS 2026.2');
  const [registerStatus, setRegisterStatus] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMatrix = async (cohort: string) => {
    setIsLoading(true);
    try {
      const url = cohort === 'all' ? '/api/admin/matrix' : `/api/admin/matrix?cohort=${encodeURIComponent(cohort)}`;
      const res = await fetch(url);
      const data = await res.json();
      setMatrixData(data);
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar dados da empresa.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupamento dinâmico de etapas por Trilha
  const trackGroups = useMemo(() => {
    const map = new Map<number, { order: number; title: string; slug: string; stages: MatrixStageColumn[] }>();
    for (const st of matrixData.stages) {
      if (!map.has(st.trackOrder)) {
        let defaultTitle = `Trilha ${st.trackOrder}`;
        let defaultSlug = `track-${st.trackOrder}`;
        if (st.trackOrder === 1) {
          defaultTitle = 'Git Local & Resolução de Conflitos';
          defaultSlug = 'git-local';
        } else if (st.trackOrder === 2) {
          defaultTitle = 'GitLab Workflow & Code Review';
          defaultSlug = 'gitlab-cloud';
        } else if (st.trackOrder === 3) {
          defaultTitle = 'Docker & Ambientes Multi-Serviço';
          defaultSlug = 'docker-basics';
        }

        map.set(st.trackOrder, {
          order: st.trackOrder,
          title: st.trackTitle || defaultTitle,
          slug: st.trackSlug || defaultSlug,
          stages: [],
        });
      }
      map.get(st.trackOrder)!.stages.push(st);
    }
    return Array.from(map.values()).sort((a, b) => a.order - b.order);
  }, [matrixData.stages]);

  // Promoção / Mudança de Cargo
  const handleChangeUserRole = async (userId: string, newRole: 'TRAINEE' | 'MEMBER' | 'ADMIN', userName?: string) => {
    const roleLabel = newRole === 'MEMBER' ? 'Membro Efetivo' : newRole === 'ADMIN' ? 'Admin' : 'Trainee';
    const confirm = window.confirm(
      `Deseja alterar o cargo de ${userName || 'este integrante'} para ${roleLabel}?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        showToast(`🎉 ${userName || 'Usuário'} agora é ${roleLabel}! As etapas foram sincronizadas.`);
        await fetchMatrix(selectedCohort);
        if (inspectUser?.userId === userId) {
          setInspectUser((prev) => (prev ? { ...prev, role: newRole as any } : null));
        }
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Erro ao alterar papel do usuário.', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveUser = async (userId: string, role: 'TRAINEE' | 'MEMBER') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setPendingList((prev) => prev.filter((u) => u.id !== userId));
        showToast(`✔ Usuário aprovado com sucesso como ${role === 'MEMBER' ? 'Membro' : 'Trainee'}!`);
        fetchMatrix(selectedCohort);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterStatus('Cadastrando...');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          cohort: newUserCohort,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterStatus('✔ Usuário pré-cadastrado com sucesso!');
        setNewUserEmail('');
        setNewUserName('');
        fetchMatrix(selectedCohort);
      } else {
        setRegisterStatus(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setRegisterStatus(`❌ ${err.message}`);
    }
  };

  const openAuditModal = async (user: MatrixUserRow, stageSlug: string) => {
    setAuditUser(user);
    setAuditStageSlug(stageSlug);
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/submissions/${user.userId}/${stageSlug}`);
      const data = await res.json();
      setAuditSubmissions(data.submissions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Alternador do Accordion (Expandir / Recolher Card)
  const toggleUserExpanded = (userId: string) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const expandAll = () => {
    const list = activeTab === 'trainees' ? filteredTrainees : filteredMembers;
    setExpandedUserIds(new Set(list.map((u) => u.userId)));
  };

  const collapseAll = () => {
    setExpandedUserIds(new Set());
  };

  // Helper para computar estatísticas de uma trilha específica para um usuário
  const getUserTrackStats = (u: MatrixUserRow, track: { order: number; stages: MatrixStageColumn[] }) => {
    const total = track.stages.length;
    const completed = track.stages.filter((s) => u.stages[s.slug]?.status === 'COMPLETED').length;
    const inProgress = track.stages.filter((s) => u.stages[s.slug]?.status === 'IN_PROGRESS').length;
    const bottlenecks = track.stages.filter((s) => u.stages[s.slug]?.hasCriticalFailures).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, bottlenecks, percent };
  };

  // Helper para ícones de trilha
  const getTrackIcon = (order: number) => {
    if (order === 1) return '🌱';
    if (order === 2) return '🦊';
    if (order === 3) return '🐳';
    return '⚡';
  };

  // Filtra Trainees
  const filteredTrainees = useMemo(() => {
    return matrixData.trainees.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.gitlabUsername?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const stagesList = Object.values(u.stages);
      const completedCount = stagesList.filter((s) => s.status === 'COMPLETED').length;
      const hasBottleneck = stagesList.some((s) => s.hasCriticalFailures);

      if (statusFilter === 'bottleneck') return hasBottleneck;
      if (statusFilter === 'completed') return completedCount === matrixData.stages.length;
      if (statusFilter === 'in_progress') return completedCount < matrixData.stages.length && !hasBottleneck;

      return true;
    });
  }, [matrixData.trainees, matrixData.stages.length, searchQuery, statusFilter]);

  // Filtra Membros
  const filteredMembers = useMemo(() => {
    return matrixData.members.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      return (
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.gitlabUsername?.toLowerCase().includes(query)
      );
    });
  }, [matrixData.members, searchQuery]);

  const activeUserList = activeTab === 'trainees' ? filteredTrainees : filteredMembers;
  const totalPages = Math.ceil(activeUserList.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeUserList.slice(start, start + pageSize);
  }, [activeUserList, currentPage, pageSize]);

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6 overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-mono fixed top-16 right-4 z-50 shadow-2xl animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950 border-red-500/50 text-red-300'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2234] pb-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/40">
            Painel da Empresa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Gestão da Empresa</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Acompanhe o progresso por trilhas, identifique gargalos e promova trainees a membros sem poluição visual.
          </p>
        </div>

        {/* Filtro por Turma */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-mono text-slate-400">Turma:</label>
          <select
            value={selectedCohort}
            onChange={(e) => {
              setSelectedCohort(e.target.value);
              setCurrentPage(1);
              fetchMatrix(e.target.value);
            }}
            className="bg-[#0e1422] border border-[#1b2234] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="all">Todas as Turmas</option>
            {matrixData.cohorts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1b2234] space-x-2 text-xs font-mono font-semibold overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('trainees');
            setCurrentPage(1);
          }}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'trainees'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Matriz de Trainees</span>
          <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {matrixData.trainees.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('members');
            setCurrentPage(1);
          }}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Upskilling de Membros</span>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {matrixData.members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Aprovações Pendentes</span>
          {pendingList.length > 0 && (
            <span className="bg-amber-500 text-[#080c14] font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'register'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Pré-Cadastro</span>
        </button>
      </div>

      {/* Conteúdo das Tabs de Trainees e Membros (Design Responsivo Sem Scroll Lateral) */}
      {(activeTab === 'trainees' || activeTab === 'members') && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca Responsiva */}
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Campo de Busca */}
              <div className="relative flex-1 max-w-sm">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar integrante por nome, email ou gitlab..."
                  className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>

              {/* Filtro por Trilha */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                <span className="text-slate-500 text-[11px] mr-1">Focar Trilha:</span>
                <button
                  onClick={() => setSelectedTrackFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedTrackFilter === 'all'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas ({trackGroups.length})
                </button>
                {trackGroups.map((tg) => (
                  <button
                    key={tg.order}
                    onClick={() => setSelectedTrackFilter(tg.order)}
                    className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                      selectedTrackFilter === tg.order
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {getTrackIcon(tg.order)} T{tg.order}
                  </button>
                ))}
              </div>

              {/* Alternador de Modo: Cards Verticais vs Tabela Sintética */}
              <div className="flex items-center gap-2 self-end md:self-auto text-xs font-mono">
                <button
                  onClick={() => setDisplayMode('cards')}
                  title="Visão em Cards Verticais Expansíveis (Zero Scroll Lateral)"
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    displayMode === 'cards'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⊞ Cards Expansíveis
                </button>
                <button
                  onClick={() => setDisplayMode('table')}
                  title="Visão em Tabela Sintética de Trilhas"
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    displayMode === 'table'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ☰ Tabela Sintética
                </button>
              </div>
            </div>

            {/* Sub-barra: Situação, Ações em Massa e Paginação */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#162033] gap-2">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-slate-500">Situação:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    statusFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('bottleneck')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                    statusFilter === 'bottleneck'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                      : 'text-red-400/80 hover:text-red-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span>Com Gargalos (≥3 falhas)</span>
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  100% Concluídos
                </button>
              </div>

              {displayMode === 'cards' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAll}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 font-mono transition-colors"
                  >
                    [Expandir Todos]
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 font-mono transition-colors"
                  >
                    [Recolher Todos]
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono">Por pág:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#080c14] border border-[#1b2234] rounded px-2 py-0.5 text-slate-300 text-[10px] font-mono"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={100}>Todos</option>
                </select>
                <span className="text-slate-500 font-mono">Total: {activeUserList.length}</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MODO 1: CARDS RESPONSIVOS VERTICAIS (ZERO SCROLL LATERAL) */}
          {/* ======================================================== */}
          {displayMode === 'cards' && (
            <div className="space-y-3">
              {paginatedUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs bg-[#0e1422] border border-[#1b2234] rounded-xl">
                  Nenhum integrante encontrado com os filtros selecionados.
                </div>
              ) : (
                paginatedUsers.map((u) => {
                  const isExpanded = expandedUserIds.has(u.userId);
                  const stagesList = Object.values(u.stages);
                  const totalStages = matrixData.stages.length;
                  const completedTotal = stagesList.filter((s) => s.status === 'COMPLETED').length;
                  const overallPercent = totalStages > 0 ? Math.round((completedTotal / totalStages) * 100) : 0;
                  const totalBottlenecks = stagesList.filter((s) => s.hasCriticalFailures).length;

                  return (
                    <div
                      key={u.userId}
                      className="bg-[#0e1422] border border-[#1b2234] hover:border-[#24314c] rounded-xl overflow-hidden transition-all duration-200 shadow-lg"
                    >
                      {/* Linha Principal do Integrante (Responsiva) */}
                      <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Identidade */}
                        <div className="flex items-center space-x-3 min-w-[240px]">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#162033] to-[#202d47] border border-[#263554] flex items-center justify-center text-sm font-bold text-slate-200 font-mono flex-shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate max-w-[200px]">
                                {u.name || u.email}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded border border-[#202b42] text-slate-400 bg-[#121929] whitespace-nowrap">
                                {u.cohort || 'Sem turma'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">
                              {u.email}
                            </div>
                            {u.gitlabUsername && (
                              <div className="text-[10px] text-orange-400/90 font-mono">
                                @{u.gitlabUsername}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progresso Geral */}
                        <div className="min-w-[180px] space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Progresso Geral:</span>
                            <span className="text-emerald-400 font-bold">
                              {completedTotal}/{totalStages} ({overallPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#162033] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${overallPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Pílulas Resumo das Trilhas (NUNCA dá scroll horizontal) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {trackGroups
                            .filter((tg) => selectedTrackFilter === 'all' || selectedTrackFilter === tg.order)
                            .map((tg) => {
                              const stats = getUserTrackStats(u, tg);
                              const isFinished = stats.completed === stats.total;
                              const hasError = stats.bottlenecks > 0;

                              return (
                                <div
                                  key={tg.order}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${
                                    isFinished
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                      : hasError
                                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                      : 'bg-[#121929] border-[#1e2940] text-slate-300'
                                  }`}
                                  title={`${tg.title}: ${stats.completed}/${stats.total} concluídas`}
                                >
                                  <span>{getTrackIcon(tg.order)}</span>
                                  <span className="font-semibold">{stats.percent}%</span>
                                  <span className="text-slate-500 text-[10px]">
                                    ({stats.completed}/{stats.total})
                                  </span>
                                  {isFinished && <span className="text-emerald-400 text-xs">✔</span>}
                                  {hasError && <span className="text-red-400 text-xs animate-pulse">🔴</span>}
                                </div>
                              );
                            })}

                          {totalBottlenecks > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-400 text-[10px] font-mono font-bold animate-pulse">
                              {totalBottlenecks} {totalBottlenecks === 1 ? 'gargalo' : 'gargalos'}
                            </span>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
                          {activeTab === 'trainees' ? (
                            <button
                              onClick={() => handleChangeUserRole(u.userId, 'MEMBER', u.name || u.email)}
                              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-[#080c14] border border-emerald-500/30 rounded-lg text-xs font-mono font-medium transition-all"
                              title="Promover a Membro Efetivo da Empresa"
                            >
                              🎓 Promover a Membro
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeUserRole(u.userId, 'TRAINEE', u.name || u.email)}
                              className="px-2.5 py-1.5 bg-[#141b2c] hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border border-[#202b42] rounded-lg text-xs font-mono transition-colors"
                              title="Reverter para modo Trainee"
                            >
                              Virar Trainee
                            </button>
                          )}

                          <button
                            onClick={() => setInspectUser(u)}
                            className="px-2.5 py-1.5 bg-[#121929] hover:bg-[#1a253d] border border-[#1e2a42] text-slate-300 rounded-lg text-xs font-mono transition-colors"
                            title="Inspecionar ficha completa deste integrante"
                          >
                            🔍 Inspecionar
                          </button>

                          <button
                            onClick={() => toggleUserExpanded(u.userId)}
                            className="px-2.5 py-1.5 bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b42] text-slate-200 rounded-lg text-xs font-mono transition-colors flex items-center gap-1"
                            title={isExpanded ? 'Recolher detalhes' : 'Ver micro-etapas deste integrante'}
                          >
                            <span>Atividades</span>
                            <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Área Expansível (Vertical & 100% Responsiva) */}
                      {isExpanded && (
                        <div className="bg-[#090d18] border-t border-[#1b2234] p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
                          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-[#162033] pb-2">
                            <span>
                              Grade de Micro-Etapas Práticas • Clique em qualquer etapa para ver submissões e logs:
                            </span>
                            <span className="text-[11px] text-slate-500">
                              (🟢 Concluído | 🔵 Em andamento | 🔴 Gargalo | 🔒 Bloqueado)
                            </span>
                          </div>

                          <div className="space-y-4">
                            {trackGroups
                              .filter((tg) => selectedTrackFilter === 'all' || selectedTrackFilter === tg.order)
                              .map((tg) => {
                                const stats = getUserTrackStats(u, tg);

                                return (
                                  <div
                                    key={tg.order}
                                    className="bg-[#0e1422] border border-[#182236] rounded-xl p-3.5 space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-base">{getTrackIcon(tg.order)}</span>
                                        <h4 className="text-xs font-bold text-white font-mono">
                                          Trilha {tg.order}: {tg.title}
                                        </h4>
                                      </div>
                                      <span className="text-[11px] font-mono text-slate-400">
                                        {stats.completed}/{stats.total} concluídas ({stats.percent}%)
                                      </span>
                                    </div>

                                    {/* Badges de Etapas que quebram de linha naturalmente (flex-wrap) */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {tg.stages.map((st) => {
                                        const cell = u.stages[st.slug];
                                        const isCompleted = cell?.status === 'COMPLETED';
                                        const isInProgress = cell?.status === 'IN_PROGRESS';
                                        const hasAlert = cell?.hasCriticalFailures;

                                        return (
                                          <button
                                            key={st.slug}
                                            onClick={() => openAuditModal(u, st.slug)}
                                            className={`px-2.5 py-1.5 rounded-lg border text-left transition-all text-xs font-mono flex items-center gap-1.5 ${
                                              hasAlert
                                                ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500 text-red-300 animate-pulse'
                                                : isCompleted
                                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                                                : isInProgress
                                                ? 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300'
                                                : 'bg-[#121929] hover:bg-[#162033] border-[#1e2940] text-slate-500'
                                            }`}
                                            title={`${st.stepNumber}. ${st.title} (${cell?.attempts || 0} tentativas)`}
                                          >
                                            <span className="font-bold">
                                              {st.stepNumber}
                                            </span>
                                            <span className="max-w-[130px] truncate hidden sm:inline text-[11px]">
                                              {st.title}
                                            </span>
                                            {isCompleted && <span className="text-emerald-400 text-xs">✔</span>}
                                            {hasAlert && <span className="text-red-400 text-xs font-bold">🔴 {cell.attempts}x</span>}
                                            {!isCompleted && !hasAlert && isInProgress && (
                                              <span className="text-blue-400 text-[10px]">({cell?.attempts || 0}x)</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 2: TABELA SINTÉTICA POR TRILHAS (NUNCA ROLA INFINITO)*/}
          {/* ======================================================== */}
          {displayMode === 'table' && (
            <div className="border border-[#1b2234] rounded-xl overflow-hidden bg-[#0e1422] shadow-xl w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0a0f1a] border-b border-[#1b2234] text-slate-300 font-mono">
                    <th className="p-3 font-bold w-1/4">Integrante</th>
                    <th className="p-3 font-semibold text-slate-400">Turma</th>
                    <th className="p-3 font-semibold text-slate-400">Progresso Global</th>
                    {trackGroups.map((tg) => (
                      <th key={tg.order} className="p-3 font-semibold text-slate-300 text-center">
                        {getTrackIcon(tg.order)} Trilha {tg.order}
                      </th>
                    ))}
                    <th className="p-3 font-semibold text-slate-300 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#162033] text-slate-300">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4 + trackGroups.length} className="p-8 text-center text-slate-500 font-mono text-xs">
                        Nenhum integrante encontrado.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const stagesList = Object.values(u.stages);
                      const totalStages = matrixData.stages.length;
                      const completedTotal = stagesList.filter((s) => s.status === 'COMPLETED').length;
                      const overallPercent = totalStages > 0 ? Math.round((completedTotal / totalStages) * 100) : 0;

                      return (
                        <tr key={u.userId} className="hover:bg-[#121929] transition-colors">
                          <td className="p-3 font-semibold text-white">
                            <div className="font-medium truncate max-w-[190px]">{u.name || u.email}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[190px]">{u.email}</div>
                          </td>

                          <td className="p-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                            {u.cohort || '—'}
                          </td>

                          <td className="p-3">
                            <div className="space-y-1 w-28">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400">{completedTotal}/{totalStages}</span>
                                <span className="text-emerald-400 font-bold">{overallPercent}%</span>
                              </div>
                              <div className="w-full bg-[#162033] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${overallPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {trackGroups.map((tg) => {
                            const stats = getUserTrackStats(u, tg);
                            const isFinished = stats.completed === stats.total;
                            const hasError = stats.bottlenecks > 0;

                            return (
                              <td key={tg.order} className="p-3 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${
                                    isFinished
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                      : hasError
                                      ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                                      : 'bg-[#121929] border-[#1e2940] text-slate-300'
                                  }`}
                                >
                                  {stats.completed}/{stats.total} ({stats.percent}%)
                                </span>
                              </td>
                            );
                          })}

                          <td className="p-3 text-right space-x-2 whitespace-nowrap font-mono">
                            {activeTab === 'trainees' ? (
                              <button
                                onClick={() => handleChangeUserRole(u.userId, 'MEMBER', u.name || u.email)}
                                className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-[#080c14] border border-emerald-500/30 rounded text-xs transition-colors"
                              >
                                🎓 Promover
                              </button>
                            ) : (
                              <button
                                onClick={() => handleChangeUserRole(u.userId, 'TRAINEE', u.name || u.email)}
                                className="px-2.5 py-1 bg-[#141b2c] hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border border-[#202b42] rounded text-xs transition-colors"
                              >
                                Virar Trainee
                              </button>
                            )}

                            <button
                              onClick={() => setInspectUser(u)}
                              className="px-2 py-1 bg-[#121929] hover:bg-[#1a253d] border border-[#1e2a42] text-slate-300 rounded text-xs transition-colors"
                            >
                              🔍 Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
              <span>
                Página {currentPage} de {totalPages} ({activeUserList.length} integrantes)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 bg-[#0e1422] border border-[#1b2234] disabled:opacity-40 rounded text-slate-300 hover:text-white"
                >
                  ← Anterior
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 bg-[#0e1422] border border-[#1b2234] disabled:opacity-40 rounded text-slate-300 hover:text-white"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Tab 3: Aprovações Pendentes */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-mono">
            Usuários que realizaram o 1º login e aguardam autorização da empresa para acessar a plataforma.
          </p>

          <div className="border border-[#1b2234] rounded-xl overflow-hidden bg-[#0e1422]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0a0f1a] text-slate-300 border-b border-[#1b2234]">
                <tr>
                  <th className="p-3 font-semibold">Usuário</th>
                  <th className="p-3 font-semibold">E-mail</th>
                  <th className="p-3 font-semibold">Data de Registro</th>
                  <th className="p-3 font-semibold text-right">Ação de Aprovação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2234]">
                {pendingList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-mono">
                      Nenhuma aprovação pendente no momento.
                    </td>
                  </tr>
                ) : (
                  pendingList.map((p) => (
                    <tr key={p.id} className="hover:bg-[#121929]">
                      <td className="p-3 font-semibold text-white">{p.name || 'Sem nome informado'}</td>
                      <td className="p-3 text-slate-300">{p.email}</td>
                      <td className="p-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveUser(p.id, 'TRAINEE')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors"
                        >
                          Aprovar como Trainee
                        </button>
                        <button
                          onClick={() => handleApproveUser(p.id, 'MEMBER')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors"
                        >
                          Aprovar como Membro
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Tab 4: Pré-Cadastro de Usuários */}
      {activeTab === 'register' && (
        <div className="max-w-xl mx-auto bg-[#0e1422] border border-[#1b2234] rounded-xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white">Pré-Cadastro de Integrantes (RF01)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre previamente um membro ou trainee para que seu papel e turma já estejam configurados no primeiro login.
            </p>
          </div>

          <form onSubmit={handleRegisterUser} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 mb-1">E-mail Institucional ou GitLab:</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="novo.trainee@empresa.com"
                className="w-full bg-[#080c14] border border-[#202b42] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Nome Completo (Opcional):</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome do Integrante"
                className="w-full bg-[#080c14] border border-[#202b42] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Papel Inicial:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-[#080c14] border border-[#202b42] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="TRAINEE">TRAINEE (Modo Guiado)</option>
                  <option value="MEMBER">MEMBER (Modo Livre)</option>
                  <option value="ADMIN">ADMIN (Gestão da Empresa)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Turma (Cohort):</label>
                <input
                  type="text"
                  required
                  value={newUserCohort}
                  onChange={(e) => setNewUserCohort(e.target.value)}
                  placeholder="PS 2026.2"
                  className="w-full bg-[#080c14] border border-[#202b42] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#080c14] font-bold rounded-lg transition-colors shadow-md shadow-emerald-950"
            >
              Concluir Pré-Cadastro
            </button>

            {registerStatus && (
              <p
                className={`text-center font-medium ${
                  registerStatus.startsWith('✔') ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {registerStatus}
              </p>
            )}
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / SLIDE-OVER LATERAL DE INSPEÇÃO DE INTEGRANTE    */}
      {/* ======================================================== */}
      {inspectUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-[#0e1422] border-l border-[#1b2234] max-w-xl w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header do Drawer */}
            <div className="p-5 border-b border-[#1b2234] bg-[#0a0f1a] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-bold text-base">
                  {inspectUser.name ? inspectUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{inspectUser.name || inspectUser.email}</h3>
                  <div className="text-xs text-slate-400 font-mono">{inspectUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-white font-mono p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Controle de Cargo no Drawer */}
            <div className="p-4 bg-[#080c14] border-b border-[#1b2234] flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">
                Cargo Atual: <strong className="text-emerald-400">{inspectUser.role}</strong>
              </span>
              {inspectUser.role === 'TRAINEE' ? (
                <button
                  onClick={() =>
                    handleChangeUserRole(inspectUser.userId, 'MEMBER', inspectUser.name || inspectUser.email)
                  }
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-[#080c14] font-bold rounded text-xs transition-colors"
                >
                  🎓 Promover a Membro
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleChangeUserRole(inspectUser.userId, 'TRAINEE', inspectUser.name || inspectUser.email)
                  }
                  className="px-3 py-1 bg-[#141b2c] hover:bg-blue-950 text-slate-300 rounded text-xs border border-[#202b42] transition-colors"
                >
                  Mudar para Trainee
                </button>
              )}
            </div>

            {/* Conteúdo com scroll vertical interno */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 font-mono text-xs">
              {trackGroups.map((tg) => {
                const stats = getUserTrackStats(inspectUser, tg);

                return (
                  <div key={tg.order} className="bg-[#090d18] border border-[#1b2234] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#162033] pb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getTrackIcon(tg.order)}</span>
                        <h4 className="font-bold text-white">
                          Trilha {tg.order}: {tg.title}
                        </h4>
                      </div>
                      <span className="text-emerald-400 font-bold">{stats.percent}%</span>
                    </div>

                    <div className="space-y-1.5">
                      {tg.stages.map((st) => {
                        const cell = inspectUser.stages[st.slug];
                        const isCompleted = cell?.status === 'COMPLETED';
                        const hasAlert = cell?.hasCriticalFailures;

                        return (
                          <div
                            key={st.slug}
                            onClick={() => openAuditModal(inspectUser, st.slug)}
                            className="p-2 rounded bg-[#0e1422] hover:bg-[#141d30] border border-[#182236] flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="text-slate-300">
                              {st.stepNumber}. {st.title}
                            </span>
                            <span className="flex items-center space-x-1.5">
                              {isCompleted ? (
                                <span className="text-emerald-400">✔ Concluído</span>
                              ) : hasAlert ? (
                                <span className="text-red-400 animate-pulse font-bold">
                                  🔴 {cell.attempts} falhas
                                </span>
                              ) : cell?.attempts ? (
                                <span className="text-blue-400">{cell.attempts}x tentativas</span>
                              ) : (
                                <span className="text-slate-600">Pendente</span>
                              )}
                              <span className="text-slate-500 text-[10px]">→</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer do Drawer */}
            <div className="p-4 border-t border-[#1b2234] bg-[#0a0f1a] text-right font-mono">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b42] text-slate-200 text-xs rounded-lg"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DE AUDITORIA DE SUBMISSÕES & LOGS DO ALUNO (RF12)  */}
      {/* ======================================================== */}
      {auditUser && auditStageSlug && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-[#1b2234] flex items-center justify-between bg-[#080c14]">
              <div>
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                  Auditoria de Submissões & Logs
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {auditUser.name || auditUser.email} — Etapa:{' '}
                  <span className="font-mono text-emerald-400">{auditStageSlug}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setAuditUser(null);
                  setAuditStageSlug(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isLoadingAudit ? (
                <div className="text-center py-12 text-slate-400 font-mono text-xs">
                  Carregando histórico de submissões...
                </div>
              ) : auditSubmissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  Nenhuma submissão registrada ainda para este aluno nesta etapa.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditSubmissions.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-lg border text-xs space-y-2 ${
                        sub.passed
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                          : 'bg-red-950/20 border-red-800/40 text-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center space-x-1.5 font-mono">
                          <span>{sub.passed ? '✔ Aprovado' : '❌ Falhou'}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            (Tentativa #{auditSubmissions.length - idx})
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-300 font-medium font-mono">{sub.feedbackMsg}</p>

                      {sub.rawLogs && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
                            Log Bruto do Terminal / API:
                          </span>
                          <pre className="mt-1 p-2 bg-[#080c14] rounded border border-[#1b2234] text-[11px] text-slate-400 font-mono overflow-x-auto">
                            {sub.rawLogs}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1b2234] bg-[#080c14] text-right">
              <button
                onClick={() => {
                  setAuditUser(null);
                  setAuditStageSlug(null);
                }}
                className="px-4 py-2 bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b42] text-slate-200 text-xs font-mono font-semibold rounded-lg"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
