'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface StageMeta {
  slug: string;
  stepNumber: number;
  title: string;
  status: string;
}

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
  trackStages: StageMeta[];
  userProgress: {
    status: string;
    attempts: number;
    completedAt: string | null;
  } | null;
  cliToken: string;
  userRole: string;
  nextStageSlug: string | null;
  prevStageSlug: string | null;
}

export function StageWorkspaceClient({
  stage,
  track,
  trackStages,
  userProgress,
  cliToken,
  userRole,
  nextStageSlug,
  prevStageSlug,
}: StageWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<'mission' | 'terminal' | 'hints'>('mission');
  const [isValidating, setIsValidating] = useState(false);
  const [attempts, setAttempts] = useState(userProgress?.attempts || 0);
  const [isCompleted, setIsCompleted] = useState(userProgress?.status === 'COMPLETED');
  const [feedback, setFeedback] = useState<{ passed: boolean; message: string; rawLogs?: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);

  const [revealedHints, setRevealedHints] = useState<number[]>(() => {
    const list: number[] = [];
    if ((userProgress?.attempts || 0) >= 1) list.push(0);
    if ((userProgress?.attempts || 0) >= 2) list.push(1);
    return list;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleVerifyGitLab = async () => {
    setIsValidating(true);
    setFeedback(null);
    setActiveTab('terminal');

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

        const newAttempts = attempts + 1;
        if (newAttempts >= 1 && !revealedHints.includes(0)) setRevealedHints(prev => [...prev, 0]);
        if (newAttempts >= 2 && !revealedHints.includes(1)) setRevealedHints(prev => [...prev, 1]);
      }
    } catch (err: any) {
      setFeedback({
        passed: false,
        message: 'Falha na conexão com o validador: ' + err.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulateCliSubmission = async (passed: boolean) => {
    setIsValidating(true);
    setActiveTab('terminal');

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
          rawLogs: passed ? 'Inspection check: OK\nWorking tree clean.' : 'Inspection check: FAILED\nExpected changes not found.',
        }),
      });

      const data = await res.json();
      setAttempts(data.attempts || attempts + 1);

      if (passed) {
        setIsCompleted(true);
        setFeedback({
          passed: true,
          message: '🎉 Simulação de submissão da CLI aprovada!',
          rawLogs: 'Exit code: 0\nAll assertions passed.',
        });
      } else {
        setFeedback({
          passed: false,
          message: '⚠️ Simulação de falha registrada.',
          rawLogs: 'Exit code: 1\nAssertion failed.',
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

  const getTrackIcon = () => {
    if (track.slug.includes('git-local')) return '🌱';
    if (track.slug.includes('gitlab')) return '🦊';
    return '🐳';
  };

  const cliVerifyCommand = `npx ej-cap verify`;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#080c14]">
      {/* 1. CodeCrafters Top Stage Bar */}
      <div className="border-b border-slate-800/80 bg-[#0c121e] px-4 py-2.5 flex items-center justify-between shrink-0 gap-4">
        {/* Track Title & Breadcrumb */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/learn"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-slate-800/60 font-medium"
          >
            <span>← Trilhas</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getTrackIcon()}</span>
            <span className="text-xs font-semibold text-slate-300 hidden sm:inline">{track.title}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
              Stage {stage.stepNumber}/{trackStages.length}
            </span>
          </div>
        </div>

        {/* CodeCrafters Horizontal Stepper Navigator */}
        <div className="hidden md:flex items-center space-x-1.5 overflow-x-auto py-1 px-2 bg-[#080c14] rounded-lg border border-slate-800/80">
          {trackStages.map((st) => {
            const isCurrent = st.slug === stage.slug;
            const isDone = st.status === 'COMPLETED';
            const isLocked = st.status === 'LOCKED';

            return (
              <Link
                key={st.slug}
                href={isLocked ? '#' : `/tracks/${track.slug}/${st.slug}`}
                title={`Etapa ${st.stepNumber}: ${st.title} (${st.status})`}
                className={`relative flex items-center justify-center text-xs font-mono font-bold rounded-md transition-all ${
                  isCurrent
                    ? 'w-7 h-7 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105 z-10'
                    : isDone
                    ? 'w-6 h-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                    : isLocked
                    ? 'w-6 h-6 bg-slate-900/40 text-slate-600 cursor-not-allowed border border-slate-800/30'
                    : 'w-6 h-6 bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                }`}
                onClick={(e) => {
                  if (isLocked) e.preventDefault();
                }}
              >
                {isDone && !isCurrent ? '✔' : isLocked ? '🔒' : st.stepNumber}
              </Link>
            );
          })}
        </div>

        {/* Status Pill & Navigation Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {isCompleted ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Concluído</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>{attempts} tentativa{attempts !== 1 ? 's' : ''}</span>
            </span>
          )}

          {prevStageSlug && (
            <Link
              href={`/tracks/${track.slug}/${prevStageSlug}`}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700/60"
              title="Etapa anterior"
            >
              ←
            </Link>
          )}

          {nextStageSlug && (
            <Link
              href={`/tracks/${track.slug}/${nextStageSlug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              <span>Próxima</span>
              <span>→</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Main Workbench (Split Screen Pane) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-hidden">
        {/* Left Pane (7 cols): Cápsula Teórica & Explicação */}
        <div className="lg:col-span-7 overflow-y-auto p-6 lg:p-8 space-y-6 bg-[#080c14]">
          <div className="space-y-2 border-b border-slate-800/80 pb-5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Cápsula Teórica
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Iniciante • ~5 min de leitura</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {stage.title}
            </h1>
          </div>

          <article className="prose-codecrafters">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {stage.theoryMd}
            </ReactMarkdown>
          </article>
        </div>

        {/* Right Pane (5 cols): CodeCrafters Interactive Workbench */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#0c121e] border-l border-slate-800/80 overflow-hidden">
          {/* Workbench Tabs */}
          <div className="flex border-b border-slate-800 bg-[#080c14] px-3 shrink-0">
            <button
              onClick={() => setActiveTab('mission')}
              className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'mission'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎯 Missão Prática</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'terminal'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💻 Terminal & Logs</span>
              {feedback && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    feedback.passed ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'
                  }`}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('hints')}
              className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'hints'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💡 Dicas</span>
              {stage.hints.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300">
                  {revealedHints.length}/{stage.hints.length}
                </span>
              )}
            </button>
          </div>

          {/* Workbench Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: MISSÃO */}
            {activeTab === 'mission' && (
              <div className="space-y-5 animate-in fade-in">
                {/* Enunciado da Missão */}
                <div className="bg-[#101726] border border-slate-800/90 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <span>Critério de Aceite</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Motor: {stage.validationType}
                    </span>
                  </div>

                  <div className="prose-codecrafters text-xs leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {stage.missionMd}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* CLI Command Box — CodeCrafters signature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Comando de Verificação:</span>
                    <span className="text-[11px] text-slate-500">Execute no seu terminal local</span>
                  </div>

                  <div className="relative group bg-[#090d16] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between font-mono text-xs transition-colors">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 select-none">$</span>
                      <span className="text-slate-200 select-all font-bold">{cliVerifyCommand}</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(cliVerifyCommand, 'verify')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded font-sans transition-colors cursor-pointer"
                    >
                      {copiedCmd === 'verify' ? '✔ Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Validação em Nuvem (Trilha 2 - GitLab) */}
                {stage.validationType === 'GITLAB_API' && (
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleVerifyGitLab}
                      disabled={isValidating}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isValidating ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Consultando API do GitLab...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Verificar Missão na Nuvem</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Inspeção direta via API REST v4 do GitLab.com • Custo zero de CI/CD minutes
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TERMINAL & INSPECTION LOGS */}
            {activeTab === 'terminal' && (
              <div className="space-y-4 animate-in fade-in">
                {/* Simulated macOS / Unix Terminal Window */}
                <div className="rounded-xl border border-slate-800 overflow-hidden shadow-2xl bg-[#070b12]">
                  {/* Terminal Header */}
                  <div className="bg-[#0f172a] px-3.5 py-2 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ej-cap verify — {stage.slug}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">bash</span>
                  </div>

                  {/* Terminal Content */}
                  <div className="p-4 font-mono text-xs space-y-3 min-h-[220px]">
                    <div className="text-slate-500 flex items-center space-x-2">
                      <span>$</span>
                      <span className="text-slate-300">ej-cap verify</span>
                    </div>

                    {isValidating ? (
                      <div className="text-blue-400 flex items-center space-x-2 animate-pulse pt-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span>[executando verificações no ambiente...]</span>
                      </div>
                    ) : feedback ? (
                      <div className="space-y-3 pt-1">
                        <div
                          className={`p-3 rounded-lg border text-xs leading-relaxed ${
                            feedback.passed
                              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                              : 'bg-red-950/30 border-red-800/60 text-red-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2 font-bold mb-1">
                            <span>{feedback.passed ? '✔ APROVADO' : '❌ NÃO APROVADO'}</span>
                          </div>
                          <p>{feedback.message}</p>
                        </div>

                        {feedback.rawLogs && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              Output Bruto / Diagnostics:
                            </span>
                            <pre className="text-[11px] bg-[#03060a] p-3 rounded-lg border border-slate-900 text-slate-400 whitespace-pre-wrap font-mono">
                              {feedback.rawLogs}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-600 italic pt-6 text-center space-y-1">
                        <p>Aguardando submissão...</p>
                        <p className="text-[11px] text-slate-700">
                          Rode <code className="text-slate-500">ej-cap verify</code> no terminal para inspecionar.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DICAS PROGRESSIVAS */}
            {activeTab === 'hints' && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                  <span className="font-semibold text-slate-300">Dicas Progressivas (RF07)</span>
                  <span className="text-[11px] text-slate-500">
                    {attempts} falha{attempts !== 1 ? 's' : ''} registrada{attempts !== 1 ? 's' : ''}
                  </span>
                </div>

                {stage.hints.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 text-center">
                    Nenhuma dica necessária para esta etapa.
                  </p>
                ) : (
                  stage.hints.map((hint, idx) => {
                    const isUnlocked = revealedHints.includes(idx);
                    const unlockAttemptNeeded = idx + 1;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-4 text-xs transition-all ${
                          isUnlocked
                            ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                            : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold flex items-center space-x-1.5 text-xs text-amber-300">
                            <span>💡 Dica {idx + 1}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {idx === 0 ? '• Conceitual' : '• Sintaxe do Comando'}
                            </span>
                          </span>

                          {!isUnlocked && (
                            <button
                              onClick={() => setRevealedHints(prev => [...prev, idx])}
                              className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium"
                            >
                              Revelar agora
                            </button>
                          )}
                        </div>

                        {isUnlocked ? (
                          <p className="leading-relaxed text-amber-100/90">{hint}</p>
                        ) : (
                          <div className="flex items-center space-x-2 text-slate-500 text-[11px] italic">
                            <span>🔒 Bloqueada (desbloqueia após {unlockAttemptNeeded} tentativa{unlockAttemptNeeded > 1 ? 's' : ''} incorreta{unlockAttemptNeeded > 1 ? 's' : ''})</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Workbench Footer: Status + Simulator Drawer */}
          <div className="border-t border-slate-800/80 bg-[#080c14] px-4 py-2.5 flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[11px] text-slate-400 font-mono">
                {isCompleted ? 'Etapa Concluída' : 'Aguardando Verificação'}
              </span>
            </div>

            {/* Test Simulation Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSimModal(!showSimModal)}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
              >
                {showSimModal ? 'ocultar testes rápidos' : 'ferramentas de teste'}
              </button>

              {showSimModal && (
                <div className="flex items-center space-x-1.5 animate-in fade-in">
                  <button
                    onClick={() => handleSimulateCliSubmission(true)}
                    disabled={isValidating}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition-colors"
                  >
                    Simular Pass
                  </button>
                  <button
                    onClick={() => handleSimulateCliSubmission(false)}
                    disabled={isValidating}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 transition-colors"
                  >
                    Simular Fail
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
