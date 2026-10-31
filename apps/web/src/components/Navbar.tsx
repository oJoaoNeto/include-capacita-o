'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showCliModal, setShowCliModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const user = session?.user as any;
  const cliToken = user?.cliToken;
  const role = user?.role;

  const copyCliCommand = () => {
    if (!cliToken) return;
    navigator.clipboard.writeText(`npx ej-cap login ${cliToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand & Main Links */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/10 group-hover:shadow-emerald-500/25 transition-all">
                <span className="text-slate-950 font-black text-sm tracking-tighter">&gt;_</span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">inclu</span>
                <span className="text-slate-600 text-xs font-mono">/</span>
                <span className="text-emerald-400 font-bold text-sm tracking-tight">capacitação</span>
              </div>
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
                  <span>Gestão da Empresa</span>
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

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Somente exibe o botão da CLI quando o usuário estiver autenticado e possuir token real */}
            {status === 'authenticated' && cliToken && (
              <button
                onClick={() => setShowCliModal(true)}
                title="Ver seu token da CLI para autenticação local"
                className="flex items-center space-x-2 bg-[#0d1424] hover:bg-[#121c33] border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 text-xs transition-all cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 font-mono text-[11px]">terminal cli:</span>
                <span className="text-emerald-400 font-mono text-[11px] group-hover:text-emerald-300">
                  conectar
                </span>
              </button>
            )}

            {/* Autenticação & Perfil */}
            {status === 'authenticated' && user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                <Link
                  href="/profile"
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider hover:opacity-80 transition-opacity ${
                    role === 'ADMIN'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : role === 'MEMBER'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : role === 'TRAINEE'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                  title="Acessar Meu Perfil"
                >
                  {role}
                </Link>

                <Link
                  href="/profile"
                  className={`text-xs transition-colors truncate max-w-[120px] ${
                    isNavActive('/profile') ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                  title={user.name || user.email}
                >
                  {user.name?.split(' ')[0] || user.email.split('@')[0]}
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs text-slate-400 hover:text-red-400 p-1 rounded transition-colors text-[11px]"
                  title="Sair da plataforma"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#080c14] font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-950"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Modal Interativo de Conexão CLI */}
      {showCliModal && cliToken && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-[#1b2234] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2234]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">Autenticação Local (CLI ej-cap)</h3>
              </div>
              <button
                onClick={() => setShowCliModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Para validar seus desafios no terminal do seu computador, execute o comando abaixo com seu token individual:
            </p>

            <div className="bg-[#080c14] border border-[#202b42] rounded-lg p-3 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Comando de Login:</span>
                <button
                  onClick={copyCliCommand}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                >
                  {copied ? '✔ Copiado!' : 'Copiar Comando'}
                </button>
              </div>
              <div className="text-slate-200 break-all select-all py-1.5 px-2 bg-[#0c111c] rounded border border-[#162033]">
                npx ej-cap login {cliToken}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>💡 <strong>Como testar depois de logar:</strong></p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-500 font-mono">
                <li><code className="text-slate-300">npx ej-cap setup 1.1</code> (Prepara o exercício)</li>
                <li><code className="text-slate-300">npx ej-cap verify</code> (Valida sua solução)</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#1b2234]">
              <Link
                href="/profile"
                onClick={() => setShowCliModal(false)}
                className="text-xs text-emerald-400 hover:underline"
              >
                Gerenciar token no perfil →
              </Link>
              <button
                onClick={() => setShowCliModal(false)}
                className="px-4 py-1.5 bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b42] text-slate-200 text-xs font-mono rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
