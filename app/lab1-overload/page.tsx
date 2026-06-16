"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Play, RotateCcw, Brain, Wrench, Clock, Layers, HelpCircle } from "lucide-react";
import LabLayout from "@/components/LabLayout";

const ALERT = {
  title: "Payment failures increased by 18%",
  region: "APAC", service: "Checkout API", severity: "High",
};

const QUESTIONS = [
  "Is this a real incident or noise?",
  "Which services are impacted?",
  "What changed recently?",
  "Are logs showing errors?",
  "Are metrics showing saturation?",
  "Has this happened before?",
  "Who owns the service?",
  "What should we communicate?",
];

const TOOLS = [
  "query_logs", "read_metrics", "list_deploys", "search_incidents",
  "get_oncall", "read_dashboards", "post_statuspage", "update_ticket",
  "page_engineer", "diff_config", "trace_requests", "check_slo",
];

// The single agent works serially — one question at a time, re-reading all context.
const STEPS = [
  { q: 0, tool: "query_logs", note: "reads logs… but which service first?" },
  { q: 3, tool: "read_metrics", note: "context now 4k tokens and growing" },
  { q: 1, tool: "trace_requests", note: "still unsure which services impacted" },
  { q: 2, tool: "list_deploys", note: "re-reads everything to stay oriented" },
  { q: 5, tool: "search_incidents", note: "context 9k tokens · slowing down" },
  { q: 6, tool: "get_oncall", note: "forgot to check SLO — backtracks" },
  { q: 4, tool: "check_slo", note: "context 13k tokens · confused" },
  { q: 7, tool: "post_statuspage", note: "drafts comms with half the picture" },
];

export default function Lab1() {
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [ctxTokens, setCtxTokens] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [doneRun, setDoneRun] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }
  useEffect(() => () => clearTimers(), []);

  function run() {
    clearTimers();
    setRunning(true); setDoneRun(false);
    setStepIdx(-1); setAnswered(new Set()); setCtxTokens(0); setSeconds(0); setNote("");
    const acc = new Set<number>();
    STEPS.forEach((s, i) => {
      timers.current.push(setTimeout(() => {
        setStepIdx(i);
        setCtxTokens(2000 + i * 1800 + Math.floor(Math.random() * 600));
        setSeconds(Math.round((i + 1) * 2.4 * 10) / 10);
        setNote(s.note);
        // single agent only "half-answers" — mark answered loosely
        if (i % 2 === 1) { acc.add(STEPS[i - 1].q); setAnswered(new Set(acc)); }
      }, i * 900));
    });
    timers.current.push(setTimeout(() => { setRunning(false); setDoneRun(true); }, STEPS.length * 900 + 300));
  }

  function reset() {
    clearTimers();
    setRunning(false); setDoneRun(false); setStepIdx(-1);
    setAnswered(new Set()); setCtxTokens(0); setSeconds(0); setNote("");
  }

  const overload = Math.min(100, Math.round((ctxTokens / 15000) * 100));
  const openCount = QUESTIONS.length - answered.size;

  return (
    <LabLayout currentLab={1}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 1 · The why</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">The Overload Problem</h1>
          <p className="text-gray-400 max-w-2xl">
            A critical production alert just fired. Watch <span className="text-red-300 font-medium">one agent</span> try to handle the entire
            incident alone — every question, every tool, all by itself.
          </p>
        </div>

        {/* Alert card */}
        <div className="bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/30 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs uppercase tracking-wider font-bold text-red-300">PagerDuty · Sev-High</span>
          </div>
          <div className="text-lg font-bold text-white">{ALERT.title}</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Chip>Region: {ALERT.region}</Chip><Chip>Service: {ALERT.service}</Chip><Chip>Severity: {ALERT.severity}</Chip>
          </div>
        </div>

        {/* Live meters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Meter icon={HelpCircle} label="Open questions" value={`${openCount}/8`} tone={openCount > 4 ? "bad" : openCount > 0 ? "warn" : "good"} />
          <Meter icon={Layers} label="Context size" value={`${(ctxTokens / 1000).toFixed(1)}k`} tone={ctxTokens > 10000 ? "bad" : ctxTokens > 5000 ? "warn" : "good"} />
          <Meter icon={Clock} label="Elapsed" value={`${seconds}s`} tone={seconds > 14 ? "bad" : "warn"} />
          <Meter icon={Wrench} label="Tools on belt" value={`${TOOLS.length}`} tone="warn" />
        </div>

        {/* Overload bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> Cognitive load</span>
            <span className={`text-sm font-bold ${overload > 70 ? "text-red-400" : overload > 40 ? "text-amber-400" : "text-emerald-400"}`}>{overload}%</span>
          </div>
          <div className="h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
            <motion.div
              className={`h-full rounded-full ${overload > 70 ? "bg-red-500" : overload > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
              animate={{ width: `${overload}%` }}
            />
          </div>
          {note && <div className="text-[11px] text-gray-500 italic mt-2">agent: &ldquo;{note}&rdquo;</div>}
        </div>

        {/* Questions + single agent + tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">8 questions, all at once</div>
            <div className="space-y-1.5">
              {QUESTIONS.map((q, i) => {
                const isAnswered = answered.has(i);
                const isCurrent = stepIdx >= 0 && STEPS[stepIdx]?.q === i;
                return (
                  <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-2 py-1.5 border ${
                    isCurrent ? "border-amber-500/50 bg-amber-500/10" : isAnswered ? "border-emerald-500/20 bg-emerald-500/5" : "border-gray-800"
                  }`}>
                    <span className={isAnswered ? "text-emerald-400" : isCurrent ? "text-amber-400" : "text-gray-600"}>{isAnswered ? "◑" : isCurrent ? "●" : "○"}</span>
                    <span className={isAnswered ? "text-gray-400" : "text-gray-300"}>{q}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">One agent · {TOOLS.length} tools</div>
            <div className="flex flex-wrap gap-1.5">
              {TOOLS.map((t) => {
                const isCurrent = stepIdx >= 0 && STEPS[stepIdx]?.tool === t;
                return (
                  <code key={t} className={`text-[10px] px-1.5 py-1 rounded border transition-all ${
                    isCurrent ? "border-amber-500/60 bg-amber-500/15 text-amber-200" : "border-gray-800 bg-gray-950 text-gray-500"
                  }`}>{t}()</code>
                );
              })}
            </div>
            <div className="mt-3 text-[11px] text-gray-500 leading-relaxed">
              Every tool is available to the single agent. It must decide — alone, serially — which to call, in what order, while keeping the whole incident in its head.
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <motion.button onClick={run} disabled={running}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            {running ? "Single agent working…" : <><Play className="w-4 h-4" /> Run the single agent</>}
          </motion.button>
          <button onClick={reset} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-3 rounded-xl"><RotateCcw className="w-4 h-4" /></button>
        </div>

        <AnimatePresence>
          {doneRun && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-4">
              <h3 className="font-semibold text-red-300 text-sm mb-2">What just happened</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The single agent stayed busy but never got on top of it: <strong className="text-white">{openCount} questions still open</strong>,
                context bloated to <strong className="text-white">{(ctxTokens / 1000).toFixed(1)}k tokens</strong>, and it drafted comms with half the picture.
                One brain owning reasoning, every tool, and every question <em>is</em> the bottleneck.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Key Insight</h3>
          <p className="text-gray-400 text-sm">
            A single agent owns reasoning, tool use, review, AND output. When the work has many dimensions, that&apos;s overload. The fix isn&apos;t a bigger model — it&apos;s <strong className="text-violet-300">coordinated specialists</strong>. Lab 2 builds the team.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">{children}</span>;
}

function Meter({ icon: Icon, label, value, tone }: { icon: typeof Brain; label: string; value: string; tone: "good" | "warn" | "bad" }) {
  const c = tone === "bad" ? "text-red-400" : tone === "warn" ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className={`text-2xl font-bold ${c}`}>{value}</div>
    </div>
  );
}
