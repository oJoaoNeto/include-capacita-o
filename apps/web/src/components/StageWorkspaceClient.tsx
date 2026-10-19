'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface StageWorkspaceClientProps {
  stage: {
    id: string;
    slug: string;
    stepNumber: number;
    title: string;
    theoryMd: string;
    missionMd: string;
    hints: string[];
    validationType: string;
  };
  track: {
    slug: string;
    title: string;
    order: number;
  };
  userProgress: {
    status: string;
    attempts: number;
    completedAt: string | null;
  } | null;
  cliToken: string;
  userRole: string;
  nextStageSlug: string | null;
}

export function StageWorkspaceClient({
  stage,
  track,
  userProgress,
  cliToken,
  userRole,
  nextStageSlug,
}: StageWorkspaceClientProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [attempts, setAttempts] = useState(userProgress?.attempts || 0);
  const [isCompleted, setIsCompleted] = useState(userProgress?.status === 'COMPLETED');
  const [feedback, setFeedback] = useState<{ passed: boolean; message: string; rawLogs?: string } | null>(null);
  const [revealedHints, setRevealedHints] = useState<number[]>(() => {
    const list: number[] = [];
    if ((userProgress?.attempts || 0) >= 1) list.push(0);
    if ((userProgress?.attempts || 0) >= 2) list.push(1);
    return list;
  });

  const handleVerifyGitLab = async () => {
    setIsValidating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/stages/validate-gitlab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageSlug: stage.slug }),
      });

      const data = await res.json();
      setAttempts(data.attempts || attempts + 1);

      if (data.passed) {
        setIsCompleted(true);
        setFeedback({
          passed: true,
          message: data.feedbackMsg || '🎉 Missão cumprida com sucesso!',
          rawLogs: data.rawLogs,
        });
      } else {
        setFeedback({
          passed: false,
          message: data.feedbackMsg || '⚠️ A missão ainda não atendeu aos critérios esperados.',
          rawLogs: data.rawLogs,
        });

        // Desbloqueia dicas automaticamente após erros
        const newAttempts = attempts + 1;
        if (newAttempts >= 1 && !revealedHints.includes(0)) {
          setRevealedHints(prev => [...prev, 0]);
        }
        if (newAttempts >= 2 && !revealedHints.includes(1)) {
          setRevealedHints(prev => [...prev, 1]);
        }
      }
    } catch (err: any) {
      setFeedback({
        passed: false,
        message: 'Falha ao conectar com o validador: ' + err.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulateCliSubmission = async (passed: boolean) => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/cli/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cliToken}`,
        },
        body: JSON.stringify({
          stageSlug: stage.slug,
          passed,
          feedbackMsg: passed
            ? '🎉 Verificação aprovada com louvor!'
            : '⚠️ Houve divergência no estado dos arquivos ou container.',
          rawLogs: passed ? 'Inspection check: OK' : 'Inspection check: FAILED (simulado)',
        }),
      });

      const data = await res.json();
      setAttempts(data.attempts || attempts + 1);

      if (passed) {
        setIsCompleted(true);
        setFeedback({
          passed: true,
          message: '🎉 Simulação de submissão da CLI aprovada!',
        });
      } else {
        setFeedback({
          passed: false,
          message: '⚠️ Simulação de falha registrada.',
        });
        const newAttempts = attempts + 1;
        if (newAttempts >= 1 && !revealedHints.includes(0)) setRevealedHints(prev => [...prev, 0]);
        if (newAttempts >= 2 && !revealedHints.includes(1)) setRevealedHints(prev => [...prev, 1]);
      }
    } catch (err: any) {
      setFeedback({ passed: false, message: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Bar da Etapa */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <Link
            href="/learn"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <span>← Voltar às Trilhas</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-blue-400 font-semibold">{track.title}</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-white font-bold">
            Etapa {stage.stepNumber}: {stage.title}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {isCompleted ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <span>✔ Etapa Concluída</span>
            </span>
          ) : (
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-semibold">
              Tentativas: {attempts}
            </span>
          )}

          {nextStageSlug && (
            <Link
              href={`/tracks/${track.slug}/${nextStageSlug}`}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Próxima Etapa →
            </Link>
          )}
        </div>
      </div>

      {/* Split Pane: Conceito (Esquerda) + Prática (Direita) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
        {/* Painel Esquerdo: Cápsula Teórica */}
        <div className="overflow-y-auto p-8 space-y-6 bg-slate-950/60">
          <div className="border-b border-slate-800/80 pb-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Cápsula Teórica
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1">{stage.title}</h1>
          </div>

          <article className="prose prose-invert prose-blue max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {stage.theoryMd}
            </ReactMarkdown>
          </article>
        </div>

        {/* Painel Direito: Missão Prática, Dicas e Validação */}
        <div className="overflow-y-auto p-8 space-y-6 bg-slate-900/30 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Missão Prática
              </span>
              <h2 className="text-xl font-bold text-white mt-1">O que você precisa entregar</h2>
            </div>

            <article className="prose prose-invert prose-emerald max-w-none text-slate-300 text-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {stage.missionMd}
              </ReactMarkdown>
            </article>

            {/* Dicas Progressivas (RF07) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>💡 Dicas Progressivas</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Desbloqueadas conforme suas tentativas ({attempts} falhas)
                </span>
              </div>

              {stage.hints.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhuma dica necessária para esta etapa.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {stage.hints.map((hint, idx) => {
                    const isUnlocked = revealedHints.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isUnlocked
                            ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[11px]">
                            Dica {idx + 1} {idx === 0 ? '(Conceitual)' : '(Sintaxe do Comando)'}
                          </span>
                          {!isUnlocked && (
                            <button
                              onClick={() => setRevealedHints(prev => [...prev, idx])}
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                            >
                              Revelar agora
                            </button>
                          )}
                        </div>

                        {isUnlocked ? (
                          <p className="leading-relaxed">{hint}</p>
                        ) : (
                          <p className="italic text-[11px]">
                            🔒 Bloqueada (desbloqueia após {idx + 1} tentativa{idx > 0 ? 's' : ''} com erro)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Console de Validação e Feedback */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Console de Validação da Missão
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Motor: {stage.validationType}
              </span>
            </div>

            {/* Feedback Message */}
            {feedback && (
              <div
                className={`p-4 rounded-lg border text-xs space-y-2 animate-in fade-in ${
                  feedback.passed
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-800 text-amber-200'
                }`}
              >
                <p className="font-semibold text-sm">{feedback.message}</p>
                {feedback.rawLogs && (
                  <pre className="text-[11px] p-2 bg-slate-950/80 rounded border border-slate-800 overflow-x-auto text-slate-400 font-mono">
                    {feedback.rawLogs}
                  </pre>
                )}
              </div>
            )}

            {/* Botões de Ação por Tipo de Validador */}
            {stage.validationType === 'GITLAB_API' ? (
              <div className="space-y-3">
                <button
                  onClick={handleVerifyGitLab}
                  disabled={isValidating}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2"
                >
                  {isValidating ? (
                    <span>Consultando API do GitLab...</span>
                  ) : (
                    <span>Verificar Missão na Nuvem</span>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Validação direta via API REST v4 • Custo zero de CI/CD minutes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                  <p className="text-slate-400 font-medium">Comando para rodar no seu terminal:</p>
                  <code className="block bg-slate-950 p-2 rounded text-emerald-400 font-mono select-all">
                    npx ej-cap verify
                  </code>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-500">Simulador de submissão rápida:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSimulateCliSubmission(true)}
                      disabled={isValidating}
                      className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded text-[11px] font-semibold transition-colors"
                    >
                      Aprovar (Pass)
                    </button>
                    <button
                      onClick={() => handleSimulateCliSubmission(false)}
                      disabled={isValidating}
                      className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800/60 rounded text-[11px] font-semibold transition-colors"
                    >
                      Falhar (Fail)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
