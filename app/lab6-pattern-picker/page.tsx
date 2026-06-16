"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import LabLayout from "@/components/LabLayout";
import { QUESTIONS, rank, patternName, patternAccent, patternTradeoff, type Answers } from "@/lib/picker";
import { GRAPHS } from "@/lib/graphs";
import { AgentGraph } from "@/lib/AgentGraph";

export default function Lab6() {
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [revealed, setRevealed] = useState(false);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);
  const ranked = useMemo(() => (allAnswered ? rank(answers as Answers) : []), [answers, allAnswered]);

  function set<K extends keyof Answers>(k: K, v: Answers[K]) { setAnswers((a) => ({ ...a, [k]: v })); setRevealed(false); }
  function reset() { setAnswers({}); setRevealed(false); }

  const top = ranked[0]; const runnerUp = ranked[1]; const avoid = ranked[ranked.length - 1];

  return (
    <LabLayout currentLab={6}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Wand2 className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 6 · Decision tool</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">The Pattern Picker</h1>
          <p className="text-gray-400 max-w-2xl">Answer six questions from the design checklist. Get the right pattern for your situation — plus the runner-up and what to avoid.</p>
        </div>

        {!revealed && (
          <>
            <div className="space-y-3 mb-5">
              {QUESTIONS.map((q, qi) => (
                <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[10px] font-bold w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">{qi + 1}</span>
                    <div>
                      <div className="text-sm text-white font-semibold">{q.label}</div>
                      <div className="text-[11px] text-gray-500 italic">{q.hint}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const sel = (answers as Record<string, string>)[q.id] === opt.value;
                      return (
                        <button key={opt.value}
                          onClick={() => set(q.id, opt.value as never)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${sel ? "border-blue-500/60 bg-blue-500/15 text-blue-200" : "border-gray-800 text-gray-300 hover:border-gray-700"}`}>
                          <span className="mr-1">{opt.emoji}</span>{opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setRevealed(true)} disabled={!allAnswered}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold py-3 rounded-xl text-sm">
              {allAnswered ? "✨ Recommend a pattern" : `Answer all ${QUESTIONS.length} questions`}
            </button>
          </>
        )}

        {revealed && top && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Top pick */}
              <div className="rounded-2xl border-2 p-5" style={{ borderColor: patternAccent(top.id), background: patternAccent(top.id) + "10" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: patternAccent(top.id), color: "#000" }}>Top pick</span>
                  <span className="ml-auto text-[10px] text-gray-500 font-mono">score {top.score}</span>
                </div>
                <div className="text-xl font-bold text-white mb-1">{patternName(top.id)}</div>
                <div className="text-[12px] text-gray-400 italic mb-3">{patternTradeoff(top.id)}</div>
                <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-2 mb-3 overflow-x-auto">
                  <AgentGraph graph={GRAPHS[top.id]} done={new Set(GRAPHS[top.id].nodes.map((n) => n.id))} cellW={130} cellH={74} />
                </div>
                <div className="space-y-1">
                  {top.reasons.slice(0, 4).map((r, i) => <div key={i} className="flex items-start gap-1.5 text-[12px] text-gray-200"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />{r}</div>)}
                </div>
              </div>

              {/* Runner-up + avoid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Runner-up</div>
                  <div className="text-base font-bold text-white" style={{ color: patternAccent(runnerUp.id) }}>{patternName(runnerUp.id)}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{patternTradeoff(runnerUp.id)}</div>
                </div>
                <div className="rounded-xl border border-red-900 bg-red-500/5 p-4">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-red-400 mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Avoid here</div>
                  <div className="text-base font-bold text-white">{patternName(avoid.id)}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{avoid.warnings[0] || "poor fit for these answers"}</div>
                </div>
              </div>

              {/* Full ranking */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">All 7 patterns, ranked for you</div>
                <div className="space-y-1">
                  {ranked.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2 text-[11px]">
                      <span className="w-5 text-gray-600 font-mono text-right">{i + 1}</span>
                      <span className="text-gray-200 flex-1 truncate">{patternName(r.id)}</span>
                      <div className="h-1.5 rounded-full" style={{ width: Math.max(6, Math.min(90, r.score + 40)), background: i === 0 ? patternAccent(r.id) : "#4b5563" }} />
                      <span className="w-8 text-right font-mono text-gray-500">{r.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setRevealed(false)} className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800">← edit answers</button>
                <button onClick={reset} className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-300 hover:bg-gray-800 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> start over</button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5 mt-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Key Insight</h3>
          <p className="text-gray-400 text-sm">The checklist <em>is</em> the design process: trigger, roles, independence, stakes, domains, human gates. Answer honestly and the pattern picks itself. Lab 7 lets you assemble the winner into a real architecture.</p>
        </div>
      </div>
    </LabLayout>
  );
}
