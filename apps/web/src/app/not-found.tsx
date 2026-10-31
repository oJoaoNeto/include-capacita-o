import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <span className="text-4xl">🔍</span>
        <h1 className="text-2xl font-extrabold text-white">Página Não Encontrada</h1>
        <p className="text-xs text-slate-400">
          A rota ou etapa que você tentou acessar não existe ou foi movida.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
