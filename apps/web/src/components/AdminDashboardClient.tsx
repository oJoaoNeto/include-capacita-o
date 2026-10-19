'use client';

import { useState, useEffect } from 'react';
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

  const fetchMatrix = async (cohort: string) => {
    setIsLoading(true);
    try {
      const url = cohort === 'all' ? '/api/admin/matrix' : `/api/admin/matrix?cohort=${encodeURIComponent(cohort)}`;
      const res = await fetch(url);
      const data = await res.json();
      setMatrixData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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
        setPendingList(prev => prev.filter(u => u.id !== userId));
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

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider bg-purple-950/60 px-2.5 py-1 rounded border border-purple-800/40">
            Painel da Diretoria & Avaliadores
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Gestão de Capacitação</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitoramento em tempo real de turmas, aprovação de membros e intervenção em travamentos.
          </p>
        </div>

        {/* Filtro por Turma (Cohort) */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-400">Turma:</label>
          <select
            value={selectedCohort}
            onChange={(e) => {
              setSelectedCohort(e.target.value);
              fetchMatrix(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todas as Turmas</option>
            {matrixData.cohorts.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('trainees')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'trainees'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Matriz de Trainees</span>
          <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono">
            {matrixData.trainees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'members'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Upskilling de Membros</span>
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
            {matrixData.members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Aprovações Pendentes</span>
          {pendingList.length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full font-mono">
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'register'
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Pré-Cadastro</span>
        </button>
      </div>

      {/* Conteúdo da Tab 1: Matriz de Trainees */}
      {activeTab === 'trainees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Concluído</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Em Andamento</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span>Bloqueado</span>
              </span>
              <span className="flex items-center space-x-1.5 text-red-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Travado (≥ 3 erros consecutivos)</span>
              </span>
            </div>
            <span>Clique em qualquer célula para ver os logs de auditoria</span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                  <th className="p-3 font-bold sticky left-0 bg-slate-900 z-10 w-48 shadow-md">Trainee</th>
                  <th className="p-3 font-semibold text-slate-400">Turma</th>
                  {matrixData.stages.map((st) => (
                    <th key={st.slug} className="p-2 font-mono text-center border-l border-slate-800/60 min-w-[50px]" title={st.title}>
                      <span className="block text-[10px] text-slate-500">T{st.trackOrder}</span>
                      <span>{st.stepNumber}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matrixData.trainees.length === 0 ? (
                  <tr>
                    <td colSpan={matrixData.stages.length + 2} className="p-8 text-center text-slate-500">
                      Nenhum trainee encontrado nesta turma.
                    </td>
                  </tr>
                ) : (
                  matrixData.trainees.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white sticky left-0 bg-slate-900 z-10 shadow-md">
                        <div className="font-medium truncate max-w-[180px]">{u.name || u.email}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{u.email}</div>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{u.cohort || '—'}</td>

                      {matrixData.stages.map((st) => {
                        const cell = u.stages[st.slug];
                        const isCompleted = cell?.status === 'COMPLETED';
                        const isInProgress = cell?.status === 'IN_PROGRESS';
                        const isLocked = cell?.status === 'LOCKED';
                        const hasAlert = cell?.hasCriticalFailures;

                        return (
                          <td
                            key={st.slug}
                            onClick={() => openAuditModal(u, st.slug)}
                            className="p-1.5 text-center border-l border-slate-800/60 cursor-pointer hover:bg-slate-700/40 transition-colors"
                          >
                            {hasAlert ? (
                              <div className="relative inline-flex items-center justify-center w-7 h-7 rounded bg-red-500/20 text-red-400 border border-red-500 font-bold text-[11px] animate-pulse" title="Trainee travado: 3+ falhas">
                                🔴 {cell.attempts}
                              </div>
                            ) : isCompleted ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]" title="Concluído">
                                ✔
                              </div>
                            ) : isInProgress ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]" title={`Em andamento (${cell?.attempts || 0} tentativas)`}>
                                {cell?.attempts || '•'}
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800/40 text-slate-600 text-[10px]" title="Bloqueado">
                                🔒
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Tab 2: Upskilling de Membros */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Visualização de membros efetivos praticando em modo livre (sandbox). Sem alertas de atraso ou cobrança.
          </p>

          <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                  <th className="p-3 font-bold sticky left-0 bg-slate-900 z-10 w-48 shadow-md">Membro</th>
                  <th className="p-3 font-semibold text-slate-400">Turma</th>
                  {matrixData.stages.map((st) => (
                    <th key={st.slug} className="p-2 font-mono text-center border-l border-slate-800/60 min-w-[50px]">
                      <span className="block text-[10px] text-slate-500">T{st.trackOrder}</span>
                      <span>{st.stepNumber}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matrixData.members.length === 0 ? (
                  <tr>
                    <td colSpan={matrixData.stages.length + 2} className="p-8 text-center text-slate-500">
                      Nenhum membro registrado.
                    </td>
                  </tr>
                ) : (
                  matrixData.members.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white sticky left-0 bg-slate-900 z-10 shadow-md">
                        <div className="font-medium truncate max-w-[180px]">{u.name || u.email}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{u.email}</div>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{u.cohort || 'Membros'}</td>

                      {matrixData.stages.map((st) => {
                        const cell = u.stages[st.slug];
                        const isCompleted = cell?.status === 'COMPLETED';

                        return (
                          <td
                            key={st.slug}
                            onClick={() => openAuditModal(u, st.slug)}
                            className="p-1.5 text-center border-l border-slate-800/60 cursor-pointer hover:bg-slate-700/40"
                          >
                            {isCompleted ? (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                ✔
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-7 h-7 rounded bg-slate-800/20 text-slate-500 font-mono text-[10px]">
                                {cell?.attempts ? `${cell.attempts}x` : '—'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Tab 3: Aprovações Pendentes */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Usuários que realizaram o 1º login e aguardam autorização da diretoria para acessar a plataforma.
          </p>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Usuário</th>
                  <th className="p-3 font-semibold">E-mail</th>
                  <th className="p-3 font-semibold">Data de Registro</th>
                  <th className="p-3 font-semibold text-right">Ação de Aprovação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pendingList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Nenhuma aprovação pendente no momento.
                    </td>
                  </tr>
                ) : (
                  pendingList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/20">
                      <td className="p-3 font-semibold text-white">{p.name || 'Sem nome informado'}</td>
                      <td className="p-3 text-slate-300 font-mono">{p.email}</td>
                      <td className="p-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveUser(p.id, 'TRAINEE')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors"
                        >
                          Aprovar como Trainee
                        </button>
                        <button
                          onClick={() => handleApproveUser(p.id, 'MEMBER')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors"
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
        <div className="max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Pré-Cadastro de Membro ou Trainee (RF01)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre previamente o usuário para que seu papel e turma já estejam prontos no primeiro login.
            </p>
          </div>

          <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">E-mail do GitLab / Institucional:</label>
              <input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="novo.trainee@empresa.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Nome Completo (Opcional):</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome do Aluno"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Papel (Role):</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="TRAINEE">TRAINEE (Modo Guiado)</option>
                  <option value="MEMBER">MEMBER (Modo Livre)</option>
                  <option value="ADMIN">ADMIN (Diretoria)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Turma (Cohort):</label>
                <input
                  type="text"
                  required
                  value={newUserCohort}
                  onChange={(e) => setNewUserCohort(e.target.value)}
                  placeholder="PS 2026.2"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Concluir Pré-Cadastro
            </button>

            {registerStatus && (
              <p className={`text-center font-medium ${registerStatus.startsWith('✔') ? 'text-emerald-400' : 'text-amber-400'}`}>
                {registerStatus}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Modal de Auditoria de Submissões (RF12) */}
      {auditUser && auditStageSlug && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  Auditoria de Submissões & Logs
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {auditUser.name || auditUser.email} — Etapa: <span className="font-mono text-blue-400">{auditStageSlug}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setAuditUser(null);
                  setAuditStageSlug(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isLoadingAudit ? (
                <div className="text-center py-12 text-slate-400">Carregando histórico...</div>
              ) : auditSubmissions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
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
                        <span className="font-bold flex items-center space-x-1.5">
                          <span>{sub.passed ? '✔ Aprovado' : '❌ Falhou'}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            (Tentativa #{auditSubmissions.length - idx})
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(sub.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-slate-300 font-medium">{sub.feedbackMsg}</p>

                      {sub.rawLogs && (
                        <div className="mt-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            Log Bruto do Terminal / API:
                          </span>
                          <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-400 font-mono overflow-x-auto">
                            {sub.rawLogs}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
              <button
                onClick={() => {
                  setAuditUser(null);
                  setAuditStageSlug(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
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
