'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na renderização da aplicação:', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
        <span className="text-4xl">⚠️</span>
        <h1 className="text-2xl font-extrabold text-white">Ops! Algo deu errado</h1>
        <p className="text-xs text-slate-400">
          Ocorreu uma falha inesperada ao processar sua solicitação. O erro foi registrado.
        </p>

        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
          >
            Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
