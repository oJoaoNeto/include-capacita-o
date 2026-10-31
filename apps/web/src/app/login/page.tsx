'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [demoEmail, setDemoEmail] = useState('trainee@ej.com');

  const handleGitLabLogin = () => {
    setIsLoading(true);
    signIn('gitlab', { callbackUrl: '/learn' });
  };

  const handleDemoLogin = (email: string) => {
    setIsLoading(true);
    signIn('demo-credentials', { email, callbackUrl: email === 'admin@ej.com' ? '/admin' : '/learn' });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 font-bold text-2xl tracking-tight">
            <span className="text-blue-500 font-extrabold">inclu</span>
            <span className="text-slate-400">/</span>
            <span className="text-white">capacitação</span>
          </div>
          <p className="text-xs text-slate-400">
            Acesse com sua conta do GitLab.com para sincronizar suas micro-etapas
          </p>
        </div>

        {/* Botão Oficial: GitLab OAuth */}
        <button
          onClick={handleGitLabLogin}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center space-x-3"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="m23.6 9.6-1.5-4.7c-.2-.6-.7-1-1.3-1s-1.1.4-1.3 1L18 9.6H6L4.5 4.9c-.2-.6-.7-1-1.3-1s-1.1.4-1.3 1L.4 9.6c-.3.8-.1 1.7.6 2.2l11 8.3 11-8.3c.7-.5.9-1.4.6-2.2z" />
          </svg>
          <span>{isLoading ? 'Redirecionando...' : 'Entrar com GitLab'}</span>
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Modo de Demonstração / Testes
          </span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Atalhos Rápidos para Demonstração de Perfis */}
        <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <p className="text-[11px] text-slate-400 font-medium">Acesso rápido por perfil:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('trainee@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-blue-950/60 hover:bg-blue-900 border border-blue-800/60 rounded-lg text-xs font-semibold text-blue-300 transition-colors"
            >
              Trainee
            </button>
            <button
              onClick={() => handleDemoLogin('membro@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg text-xs font-semibold text-emerald-300 transition-colors"
            >
              Membro
            </button>
            <button
              onClick={() => handleDemoLogin('admin@ej.com')}
              disabled={isLoading}
              className="py-1.5 px-2 bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 rounded-lg text-xs font-semibold text-purple-300 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
