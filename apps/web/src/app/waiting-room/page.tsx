import Link from 'next/link';

export default function WaitingRoomPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          ⏳
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Sala de Espera</h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Sua conta foi criada no sistema, mas ainda aguarda a aprovação e atribuição de papel por um Diretor ou Administrador da Empresa Júnior.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-left mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Status da Conta:</span>
            <span className="text-amber-400 font-semibold uppercase">PENDENTE (PENDING)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Acesso às Trilhas:</span>
            <span className="text-slate-400">Bloqueado temporariamente</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Próximo Passo:</span>
            <span className="text-slate-300">Aguardar definição de Turma</span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Acessar como Admin para Aprovar esta Conta
          </Link>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
