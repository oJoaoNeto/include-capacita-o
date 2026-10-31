'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/learn';

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGitLabLogin = () => {
    setIsLoading(true);
    setErrorMessage(null);
    signIn('gitlab', { callbackUrl });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await signIn('email-credentials', {
      email,
      name: name || email.split('@')[0],
      callbackUrl,
      redirect: true,
    });

    if (result?.error) {
      setErrorMessage('Não foi possível realizar o login. Verifique seu e-mail.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    signIn('email-credentials', {
      email: quickEmail,
      name: quickEmail.split('@')[0],
      callbackUrl: quickEmail.includes('admin') ? '/admin' : callbackUrl,
      redirect: true,
    });
  };

  return (
    <div className="max-w-md w-full bg-[#0e1422] border border-[#1b2234] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <span className="text-slate-950 font-black text-sm tracking-tighter">&gt;_</span>
          </div>
          <div className="flex items-baseline space-x-1.5 font-bold text-xl tracking-tight">
            <span className="text-white">inclu</span>
            <span className="text-slate-600 text-sm font-mono">/</span>
            <span className="text-emerald-400 text-base">capacitação</span>
          </div>
        </Link>
        <p className="text-xs text-slate-400">
          Acesse seu workspace prático e sincronize seus desafios locais
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Opção 1: GitLab OAuth */}
      <div className="space-y-3">
        <button
          onClick={handleGitLabLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-[#e24329] hover:bg-[#d13a22] disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-all shadow-lg shadow-orange-950/30 flex items-center justify-center space-x-2.5 border border-orange-400/20"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="m23.6 9.6-1.5-4.7c-.2-.6-.7-1-1.3-1s-1.1.4-1.3 1L18 9.6H6L4.5 4.9c-.2-.6-.7-1-1.3-1s-1.1.4-1.3 1L.4 9.6c-.3.8-.1 1.7.6 2.2l11 8.3 11-8.3c.7-.5.9-1.4.6-2.2z" />
          </svg>
          <span>{isLoading ? 'Redirecionando...' : 'Entrar com GitLab.com'}</span>
        </button>
        <p className="text-[10px] text-slate-500 text-center font-mono">
          Recomendado para integração com Merge Requests e Trilha 2
        </p>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-[#1b2234]"></div>
        <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
          OU COM SEU E-MAIL
        </span>
        <div className="flex-grow border-t border-[#1b2234]"></div>
      </div>

      {/* Opção 2: Login com E-mail */}
      <form onSubmit={handleEmailLogin} className="space-y-3">
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            E-mail institucional ou cadastrado:
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ex: seu.nome@empresa.com"
            className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Nome (apenas se for 1º acesso):
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu Nome Completo"
            className="w-full bg-[#080c14] border border-[#202b42] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#080c14] font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-950 flex items-center justify-center space-x-2"
        >
          <span>{isLoading ? 'Autenticando...' : 'Acessar com E-mail'}</span>
          <span className="font-mono text-xs">→</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          Se for seu primeiro login, sua conta será criada automaticamente.
        </p>
      </form>

      {/* Opção 3: Atalhos Rápidos para Teste Local */}
      <div className="pt-2 border-t border-[#1b2234]">
        <div className="bg-[#090d18] p-3 rounded-lg border border-[#1b2234] space-y-2">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Acesso Rápido de Homologação:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('trainee@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/40 rounded text-[11px] font-mono text-blue-300 transition-colors"
            >
              Trainee
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('membro@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 rounded text-[11px] font-mono text-emerald-300 transition-colors"
            >
              Membro
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 rounded text-[11px] font-mono text-purple-300 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-1">
        <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center justify-center gap-1">
          <span>←</span>
          <span>Voltar para a página inicial</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[#080c14]">
      {/* Glow Effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-[300px] h-[300px] bg-cyan-500/5 blur-[90px] rounded-full" />

      <Suspense
        fallback={
          <div className="max-w-md w-full bg-[#0e1422] border border-[#1b2234] rounded-2xl p-8 text-center text-xs font-mono text-slate-400">
            Carregando autenticação...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
