import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Capacitação inclu — Aprendizado Hands-on Modular',
  description: 'Plataforma interativa inspirada no CodeCrafters para capacitação prática de Empresas Juniores.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
        <Providers session={session}>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            <p>
              Plataforma <strong>Capacitação inclu</strong> — Desenvolvida para a jornada de Trainees e Membros da EJ.
            </p>
            <p className="mt-1 text-slate-600">
              Validação Híbrida (CLI Local + Nuvem GitLab) • Custo Zero de CI/CD Minutes.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
