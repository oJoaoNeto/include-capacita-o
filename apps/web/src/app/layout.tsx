import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Capacitação inclu — Aprendizado Hands-on Modular',
  description: 'Plataforma interativa inspirada no CodeCrafters para capacitação prática de Empresas Juniores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        {/* Header Superior */}
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
                <Link
                  href="/admin"
                  className="text-slate-300 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <span>Painel da Diretoria</span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                    ADMIN
                  </span>
                </Link>
                <Link
                  href="/waiting-room"
                  className="text-slate-400 hover:text-slate-300 transition-colors text-xs"
                >
                  Sala de Espera
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">Terminal:</span>
                <code className="text-emerald-400 font-mono select-all">
                  npx ej-cap login trainee-cli-token-demo-5678
                </code>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Modo Local Ativo
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Rodapé */}
        <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
          <p>
            Plataforma <strong>Capacitação inclu</strong> — Desenvolvida para a jornada de Trainees e Membros da EJ.
          </p>
          <p className="mt-1 text-slate-600">
            Validação Híbrida (CLI Local + Nuvem GitLab) • Custo Zero de CI/CD Minutes.
          </p>
        </footer>
      </body>
    </html>
  );
}
