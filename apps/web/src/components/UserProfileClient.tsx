'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UserProfileClientProps {
  initialUser: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    gitlabUsername: string | null;
    cliToken: string;
    role: string;
    cohort: string | null;
    createdAt: string;
  };
  stats: {
    completedStages: number;
    inProgressStages: number;
    totalStages: number;
  };
}

export function UserProfileClient({ initialUser, stats }: UserProfileClientProps) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [gitlabUsername, setGitlabUsername] = useState(user.gitlabUsername || '');

  const [cliToken, setCliToken] = useState(user.cliToken);
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl, gitlabUsername }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser((prev) => ({ ...prev, ...data.user }));
        setStatusMessage({ type: 'success', text: '✔ Informações do perfil atualizadas com sucesso!' });
      } else {
        setStatusMessage({ type: 'error', text: `❌ ${data.error || 'Erro ao salvar perfil.'}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCliCommand = () => {
    navigator.clipboard.writeText(`npx ej-cap login ${cliToken}`);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleRegenerateToken = async () => {
    const confirm = window.confirm(
      'Tem certeza de que deseja regenerar seu Token CLI? Seus terminais conectados precisarão fazer login novamente.'
    );
    if (!confirm) return;

    setIsRegenerating(true);
    try {
      const res = await fetch('/api/user/cli-token', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.cliToken) {
        setCliToken(data.cliToken);
        setStatusMessage({ type: 'success', text: '✔ Novo Token CLI gerado com sucesso! Atualize seu terminal.' });
      } else {
        setStatusMessage({ type: 'error', text: `❌ ${data.error || 'Erro ao regenerar token.'}` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `❌ ${err.message}` });
    } finally {
      setIsRegenerating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Gestão da Empresa (Admin)', color: 'border-purple-500/30 text-purple-400 bg-purple-500/10' };
      case 'MEMBER':
        return { label: 'Membro Efetivo (Modo Livre)', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' };
      case 'TRAINEE':
        return { label: 'Trainee (Modo Guiado)', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' };
      default:
        return { label: 'Pendente de Aprovação', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-[#1b2234] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
            Configurações da Conta
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Meu Perfil</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie suas informações pessoais, identidade GitLab e credenciais da CLI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/learn"
            className="px-4 py-2 bg-[#141b2c] hover:bg-[#1a233a] border border-[#22304d] text-slate-200 text-xs font-mono rounded-lg transition-colors"
          >
            ← Voltar para Trilhas
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-mono ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Profile Form (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>👤</span>
              <span>Informações Pessoais</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome Completo"
                  className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-2.5 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">E-mail Principal:</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-[#080c14]/50 border border-[#1b2234] rounded-lg p-2.5 text-slate-400 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  O e-mail é a chave de login e auditoria na plataforma.
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">URL do Avatar / Foto:</label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                    className="flex-1 bg-[#080c14] border border-[#202b42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg p-2.5 text-white placeholder-slate-600"
                  />
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-9 h-9 rounded-lg border border-[#202b42] object-cover bg-slate-900"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Nome de Usuário no GitLab (sem o @):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono">@</span>
                  <input
                    type="text"
                    value={gitlabUsername}
                    onChange={(e) => setGitlabUsername(e.target.value)}
                    placeholder="ex: joaoneto"
                    className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg pl-7 pr-3 py-2.5 text-white placeholder-slate-600 font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Necessário para a Trilha 2 (GitLab Workflow) para que o bot @ej-mentor-bot reconheça seus Merge Requests.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#080c14] font-bold rounded-lg transition-colors shadow-md shadow-emerald-950 flex items-center gap-2"
                >
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Academic & Role Card */}
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>🏢</span>
              <span>Vínculo com a Empresa</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#080c14] border border-[#1b2234] p-3 rounded-lg">
                <span className="text-slate-500 font-mono block text-[10px] uppercase">Cargo / Papel:</span>
                <span className={`inline-block mt-1 font-mono text-xs px-2 py-0.5 rounded border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>

              <div className="bg-[#080c14] border border-[#1b2234] p-3 rounded-lg">
                <span className="text-slate-500 font-mono block text-[10px] uppercase">Turma (Cohort):</span>
                <span className="text-slate-200 font-semibold block mt-1">
                  {user.cohort || 'Não alocado em turma'}
                </span>
              </div>
            </div>

            <div className="bg-[#080c14] border border-[#1b2234] p-4 rounded-lg">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-mono">Progresso nas Micro-Etapas:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {stats.completedStages} / {stats.totalStages} ({Math.round((stats.completedStages / (stats.totalStages || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-[#162033] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((stats.completedStages / (stats.totalStages || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: CLI Authentication Token (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔑</span>
                <span>Token de Acesso CLI</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ej-cap
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Use este token pessoal para autenticar o utilitário de linha de comando no seu terminal e validar seus exercícios práticos locais.
            </p>

            <div className="bg-[#080c14] border border-[#1b2234] rounded-lg p-3 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Seu Token Pessoal:</span>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {showToken ? 'Ocultar' : 'Revelar'}
                </button>
              </div>

              <div className="text-slate-200 break-all select-all py-1 px-2 bg-[#0c111c] rounded border border-[#162033]">
                {showToken ? cliToken : `${cliToken.slice(0, 8)}••••••••••••••••••••••••`}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block">
                Comando pronto para executar no seu terminal:
              </span>
              <div className="bg-[#080c14] border border-[#202b42] rounded-lg p-3 font-mono text-xs flex items-center justify-between gap-2">
                <span className="text-emerald-400 truncate">
                  npx ej-cap login {cliToken.slice(0, 8)}...
                </span>
                <button
                  onClick={handleCopyCliCommand}
                  className="px-2.5 py-1 bg-[#162033] hover:bg-[#202d47] text-slate-200 text-[11px] rounded transition-colors whitespace-nowrap flex items-center gap-1"
                >
                  <span>{copiedToken ? '✔ Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#161f32]">
              <button
                type="button"
                onClick={handleRegenerateToken}
                disabled={isRegenerating}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 hover:border-red-800 rounded-lg text-xs font-mono transition-colors"
              >
                {isRegenerating ? 'Regenerando...' : 'Regenerar Token CLI'}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                Se você regenerar o token, precisará rodar <code className="text-slate-400 font-mono">ej-cap login</code> novamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
