'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [copied, setCopied] = useState(false);

  const user = session?.user as any;
  const cliToken = user?.cliToken || 'trainee-cli-token-demo-5678';
  const role = user?.role || 'TRAINEE';

  const copyCliCommand = () => {
    navigator.clipboard.writeText(`npx ej-cap login ${cliToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
            <span className="text-blue-500 font-extrabold">inclu</span>
            <span className="text-slate-400">/</span>
            <span className="text-white">capacitação</span>
            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-medium">
              PRO MAX
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-4 text-sm font-medium">
            <Link
              href="/learn"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Trilhas & Etapas
            </Link>

            {(role === 'ADMIN' || !session) && (
              <Link
                href="/admin"
                className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>Painel da Diretoria</span>
                <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  ADMIN
                </span>
              </Link>
            )}

            <Link
              href="/waiting-room"
              className="text-slate-400 hover:text-slate-300 transition-colors text-xs"
            >
              Sala de Espera
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botão de Copiar Comando da CLI */}
          <button
            onClick={copyCliCommand}
            title="Clique para copiar comando de login da CLI"
            className="hidden sm:flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <span className="text-slate-400">CLI:</span>
            <code className="text-emerald-400 font-mono">
              {copied ? '✔ Copiado!' : `npx ej-cap login ${cliToken.slice(0, 8)}...`}
            </code>
          </button>

          {/* Autenticação & Perfil */}
          {status === 'authenticated' && user ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    role === 'ADMIN'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : role === 'MEMBER'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : role === 'TRAINEE'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {role}
                </span>
                <span className="text-xs text-slate-300 hidden lg:inline max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded transition-colors"
                title="Sair da conta"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
