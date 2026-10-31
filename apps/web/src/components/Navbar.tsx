'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
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

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand & Main Links */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:shadow-emerald-500/25 transition-all">
              <span className="text-slate-950 font-black text-sm tracking-tighter">&gt;_</span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">inclu</span>
              <span className="text-slate-600 text-xs font-mono">/</span>
              <span className="text-emerald-400 font-bold text-sm tracking-tight">capacitação</span>
            </div>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1 text-xs font-medium">
            <Link
              href="/learn"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isNavActive('/learn') || isNavActive('/tracks')
                  ? 'bg-slate-800/90 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              Trilhas & Desafios
            </Link>

            {(role === 'ADMIN' || !session) && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  isNavActive('/admin')
                    ? 'bg-purple-950/40 text-purple-300 font-semibold border border-purple-800/40'
                    : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
                }`}
              >
                <span>Gestão da Diretoria</span>
                <span className="bg-purple-500/20 text-purple-300 text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                  ADMIN
                </span>
              </Link>
            )}

            <Link
              href="/waiting-room"
              className={`px-3 py-1.5 rounded-lg transition-all text-slate-500 hover:text-slate-300 ${
                isNavActive('/waiting-room') ? 'text-slate-200' : ''
              }`}
            >
              Sala de Espera
            </Link>
          </nav>
        </div>

        {/* Right Actions: CLI pill + User Status */}
        <div className="flex items-center space-x-3">
          {/* CLI quick copy button (CodeCrafters terminal style) */}
          <button
            onClick={copyCliCommand}
            title="Copiar comando de login para seu terminal"
            className="flex items-center space-x-2 bg-[#0d1424] hover:bg-[#121c33] border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-mono text-[11px]">cli:</span>
            <span className="text-emerald-400 font-mono text-[11px] group-hover:text-emerald-300">
              {copied ? '✔ copiado!' : `${cliToken.slice(0, 8)}...`}
            </span>
            <span className="text-[10px] text-slate-500 font-sans hidden sm:inline">copiar</span>
          </button>

          {/* Autenticação & Perfil */}
          {status === 'authenticated' && user ? (
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
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

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-xs text-slate-400 hover:text-red-400 p-1 rounded transition-colors text-[11px]"
                title="Sair"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
