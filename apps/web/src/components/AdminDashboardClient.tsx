'use client';

import { useState, useMemo } from 'react';
import { AdminMatrixResponse, MatrixUserRow } from '@inclu/shared';

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

  // Filtros anti-poluição visual (Requisito 3)
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'bottleneck' | 'in_progress' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Notificações visuais
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado do Modal de Auditoria (RF12)
  const [auditUser, setAuditUser] = useState<MatrixUserRow | null>(null);
  const [auditStageSlug, setAuditStageSlug] = useState<string | null>(null);
  const [auditSubmissions, setAuditSubmissions] = useState<any[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

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
      showToast('Erro ao atualizar matriz da empresa.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Alteração de Papel / Promoção de Trainee a Membro (Requisito 6)
  const handleChangeUserRole = async (userId: string, newRole: 'TRAINEE' | 'MEMBER' | 'ADMIN', userName?: string) => {
    const roleLabel = newRole === 'MEMBER' ? 'Membro Efetivo' : newRole === 'ADMIN' ? 'Admin' : 'Trainee';
    const confirm = window.confirm(
      `Deseja realmente alterar o cargo de ${userName || 'este usuário'} para ${roleLabel}?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        showToast(`🎉 ${userName || 'Usuário'} agora é ${roleLabel}! As permissões foram sincronizadas.`);
        await fetchMatrix(selectedCohort);
        if (auditUser?.userId === userId) {
          setAuditUser((prev) => (prev ? { ...prev, role: newRole as any } : null));
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

  // Colunas de etapas filtradas (reduz drasticamente o overflow horizontal)
  const filteredStageColumns = useMemo(() => {
    if (selectedTrackFilter === 'all') return matrixData.stages;
    return matrixData.stages.filter((s) => s.trackOrder === selectedTrackFilter);
  }, [matrixData.stages, selectedTrackFilter]);

  // Filtra e pagina os Trainees
  const filteredTrainees = useMemo(() => {
    return matrixData.trainees.filter((u) => {
      // 1. Busca por nome, email ou gitlab
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.gitlabUsername?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Filtro de situação
      const stagesList = Object.values(u.stages);
      const completedCount = stagesList.filter((s) => s.status === 'COMPLETED').length;
      const hasBottleneck = stagesList.some((s) => s.hasCriticalFailures);

      if (statusFilter === 'bottleneck') return hasBottleneck;
      if (statusFilter === 'completed') return completedCount === matrixData.stages.length;
      if (statusFilter === 'in_progress') return completedCount < matrixData.stages.length && !hasBottleneck;

      return true;
    });
  }, [matrixData.trainees, matrixData.stages.length, searchQuery, statusFilter]);

  // Filtra e pagina os Membros
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
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
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

      {/* Top Header - Renomeado para Gestão da Empresa (Requisito 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2234] pb-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/40">
            Painel Administrativo da Empresa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Gestão da Empresa</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Acompanhamento de turmas, promoção de trainees a membros e gestão da matriz de competências.
          </p>
        </div>

        {/* Filtro por Turma (Cohort) */}
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

      {/* Conteúdo das Tabs de Trainees e Membros (com Barra de Filtros Anti-Poluição) */}
      {(activeTab === 'trainees' || activeTab === 'members') && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca (Requisito 3) */}
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
                  placeholder="Filtrar por nome, e-mail ou GitLab..."
                  className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>

              {/* Filtro de Trilhas (Reduz as 17 colunas) */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                <span className="text-slate-500 text-[11px] mr-1">Colunas:</span>
                <button
                  onClick={() => setSelectedTrackFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedTrackFilter === 'all'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas (17)
                </button>
                <button
                  onClick={() => setSelectedTrackFilter(1)}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedTrackFilter === 1
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌱 Git (7)
                </button>
                <button
                  onClick={() => setSelectedTrackFilter(2)}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedTrackFilter === 2
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🦊 GitLab (4)
                </button>
                <button
                  onClick={() => setSelectedTrackFilter(3)}
                  className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedTrackFilter === 3
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-[#080c14] border-[#1b2234] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🐳 Docker (6)
                </button>
              </div>

              {/* Alternador de Modo: Compacto vs Matriz Completa */}
              <div className="flex items-center gap-2 self-end md:self-auto text-xs font-mono">
                <button
                  onClick={() => setViewMode(viewMode === 'detailed' ? 'compact' : 'detailed')}
                  className="px-2.5 py-1 bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b42] text-slate-300 rounded text-[11px] transition-colors"
                >
                  {viewMode === 'detailed' ? 'Modo Compacto' : 'Matriz Completa'}
                </button>
              </div>
            </div>

            {/* Sub-barra: Legenda e Filtro de Gargalos */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#162033] gap-2">
              <div className="flex items-center space-x-3 flex-wrap">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Concluído</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Em Andamento</span>
                </span>
                <span className="flex items-center space-x-1.5 text-red-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Gargalo (≥ 3 falhas)</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Exibir:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#080c14] border border-[#1b2234] rounded px-2 py-0.5 text-slate-300 text-[10px]"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={100}>Todos</option>
                </select>
                <span className="text-slate-500">
                  Total: {activeUserList.length}
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Trainees ou Membros */}
          <div className="border border-[#1b2234] rounded-xl overflow-x-auto bg-[#0e1422] shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a0f1a] border-b border-[#1b2234] text-slate-300">
                  <th className="p-3 font-bold sticky left-0 bg-[#0a0f1a] z-10 w-52 shadow-md">
                    {activeTab === 'trainees' ? 'Trainee' : 'Membro'}
                  </th>
                  <th className="p-3 font-semibold text-slate-400 font-mono text-[11px]">Turma</th>
                  <th className="p-3 font-semibold text-slate-400 font-mono text-[11px] min-w-[140px]">
                    Progresso Geral
                  </th>

                  {/* Colunas de Etapas (Apenas no Modo Detalhado) */}
                  {viewMode === 'detailed' &&
                    filteredStageColumns.map((st) => (
                      <th
                        key={st.slug}
                        className="p-2 font-mono text-center border-l border-[#162033] min-w-[44px]"
                        title={st.title}
                      >
                        <span className="block text-[9px] text-slate-500">T{st.trackOrder}</span>
                        <span className="text-[11px] text-slate-300">{st.stepNumber}</span>
                      </th>
                    ))}

                  {/* Coluna de Ações Administrativas (Requisito 6) */}
                  <th className="p-3 font-semibold text-slate-300 font-mono text-right min-w-[160px]">
                    Ações de Cargo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#162033] text-slate-300">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(viewMode === 'detailed' ? filteredStageColumns.length : 0) + 4}
                      className="p-8 text-center text-slate-500 font-mono text-xs"
                    >
                      Nenhum integrante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const stagesList = Object.values(u.stages);
                    const completedCount = stagesList.filter((s) => s.status === 'COMPLETED').length;
                    const percent = Math.round((completedCount / (matrixData.stages.length || 1)) * 100);

                    return (
                      <tr key={u.userId} className="hover:bg-[#121929] transition-colors">
                        <td className="p-3 font-semibold text-white sticky left-0 bg-[#0e1422] z-10 shadow-md">
                          <div className="font-medium truncate max-w-[190px]">{u.name || u.email}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[190px]">
                            {u.email}
                          </div>
                          {u.gitlabUsername && (
                            <div className="text-[10px] text-orange-400/80 font-mono">
                              @{u.gitlabUsername}
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                          {u.cohort || '—'}
                        </td>

                        {/* Coluna Resumo de Progresso */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-400">
                                {completedCount}/{matrixData.stages.length}
                              </span>
                              <span className="text-emerald-400 font-bold">{percent}%</span>
                            </div>
                            <div className="w-full bg-[#162033] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Células de Etapas (Modo Detalhado) */}
                        {viewMode === 'detailed' &&
                          filteredStageColumns.map((st) => {
                            const cell = u.stages[st.slug];
                            const isCompleted = cell?.status === 'COMPLETED';
                            const isInProgress = cell?.status === 'IN_PROGRESS';
                            const hasAlert = cell?.hasCriticalFailures;

                            return (
                              <td
                                key={st.slug}
                                onClick={() => openAuditModal(u, st.slug)}
                                className="p-1.5 text-center border-l border-[#162033] cursor-pointer hover:bg-[#192338] transition-colors"
                              >
                                {hasAlert ? (
                                  <div
                                    className="relative inline-flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-400 border border-red-500 font-bold text-[10px] animate-pulse"
                                    title="Trainee travado: 3+ falhas consecutivas"
                                  >
                                    🔴 {cell.attempts}
                                  </div>
                                ) : isCompleted ? (
                                  <div
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]"
                                    title="Concluído com sucesso"
                                  >
                                    ✔
                                  </div>
                                ) : isInProgress ? (
                                  <div
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]"
                                    title={`Em andamento (${cell?.attempts || 0} tentativas)`}
                                  >
                                    {cell?.attempts || '•'}
                                  </div>
                                ) : (
                                  <div
                                    className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#121929] text-slate-600 text-[10px]"
                                    title="Bloqueado"
                                  >
                                    🔒
                                  </div>
                                )}
                              </td>
                            );
                          })}

                        {/* Ações de Mudança de Papel (Requisito 6) */}
                        <td className="p-3 text-right whitespace-nowrap">
                          {activeTab === 'trainees' ? (
                            <button
                              onClick={() => handleChangeUserRole(u.userId, 'MEMBER', u.name || u.email)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-[#080c14] border border-emerald-500/30 rounded-lg text-xs font-mono font-medium transition-all"
                              title="Promover Trainee para Membro Efetivo da Empresa"
                            >
                              🎓 Promover a Membro
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleChangeUserRole(u.userId, 'TRAINEE', u.name || u.email)}
                                className="px-2.5 py-1 bg-[#141b2c] hover:bg-blue-950/60 text-slate-300 hover:text-blue-300 border border-[#202b42] rounded text-[11px] font-mono transition-colors"
                                title="Reverter para modo Trainee guiado"
                              >
                                Virar Trainee
                              </button>
                              <button
                                onClick={() => handleChangeUserRole(u.userId, 'ADMIN', u.name || u.email)}
                                className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 rounded text-[11px] font-mono transition-colors"
                                title="Tornar Administrador"
                              >
                                + Admin
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
              <span>
                Página {currentPage} de {totalPages}
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
          <p className="text-xs text-slate-400">
            Usuários que realizaram o 1º login e aguardam autorização da empresa para acessar a plataforma.
          </p>

          <div className="border border-[#1b2234] rounded-xl overflow-hidden bg-[#0e1422]">
            <table className="w-full text-left text-xs">
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
                      <td className="p-3 text-slate-300 font-mono">{p.email}</td>
                      <td className="p-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveUser(p.id, 'TRAINEE')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors font-mono"
                        >
                          Aprovar como Trainee
                        </button>
                        <button
                          onClick={() => handleApproveUser(p.id, 'MEMBER')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors font-mono"
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
                placeholder="Nome do Aluno"
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

      {/* Modal de Auditoria de Submissões com Mudança de Cargo (RF12 + Requisito 6) */}
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

            {/* Ação rápida de promoção no próprio Modal de Auditoria */}
            <div className="px-5 py-2.5 bg-[#0a0f1a] border-b border-[#1b2234] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Cargo atual: <strong className="text-white">{auditUser.role}</strong>
              </span>
              {auditUser.role === 'TRAINEE' ? (
                <button
                  onClick={() =>
                    handleChangeUserRole(auditUser.userId, 'MEMBER', auditUser.name || auditUser.email)
                  }
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-[#080c14] border border-emerald-500/30 rounded text-[11px] font-bold transition-all"
                >
                  🎓 Promover agora a Membro
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleChangeUserRole(auditUser.userId, 'TRAINEE', auditUser.name || auditUser.email)
                  }
                  className="px-3 py-1 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 rounded text-[11px] transition-all"
                >
                  Reverter para Trainee
                </button>
              )}
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
