"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, Play, RotateCcw, Cpu, Receipt, Zap, CheckCircle2 } from "lucide-react";
import LabLayout from "@/components/LabLayout";
import { AgentGraph } from "@/lib/AgentGraph";
import type { GraphDef } from "@/lib/graphs";
import { SCENARIOS, type ScenarioId, type RunPattern } from "@/lib/scenarios";

type Evt = Record<string, unknown> & { kind: string };

// Run-specific graphs (4 specialist slots). Specialist node ids get remapped to a1..a4.
const RUN_GRAPHS: Record<RunPattern, GraphDef> = {
  supervisor: {
    cols: 4, rows: 4,
    nodes: [
      { id: "in", label: "Case", kind: "io", col: 1, row: 1.5 },
      { id: "sup", label: "Supervisor", kind: "supervisor", col: 2, row: 1.5 },
      { id: "a1", label: "Specialist", kind: "agent", col: 3, row: 0 },
      { id: "a2", label: "Specialist", kind: "agent", col: 3, row: 1 },
      { id: "a3", label: "Specialist", kind: "agent", col: 3, row: 2 },
      { id: "a4", label: "Specialist", kind: "agent", col: 3, row: 3 },
      { id: "out", label: "Synthesis", kind: "merge", col: 4, row: 1.5 },
    ],
    edges: [
      { from: "in", to: "sup" },
      { from: "sup", to: "a1", dashed: true }, { from: "sup", to: "a2", dashed: true },
      { from: "sup", to: "a3", dashed: true }, { from: "sup", to: "a4", dashed: true },
      { from: "a1", to: "sup", back: true }, { from: "a2", to: "sup", back: true },
      { from: "a3", to: "sup", back: true }, { from: "a4", to: "sup", back: true },
      { from: "sup", to: "out" },
    ],
    play: [],
  },
  parallel: {
    cols: 4, rows: 4,
    nodes: [
      { id: "in", label: "Case", kind: "io", col: 1, row: 1.5 },
      { id: "fan", label: "Fan-out", kind: "supervisor", col: 2, row: 1.5 },
      { id: "a1", label: "Specialist", kind: "agent", col: 3, row: 0 },
      { id: "a2", label: "Specialist", kind: "agent", col: 3, row: 1 },
      { id: "a3", label: "Specialist", kind: "agent", col: 3, row: 2 },
      { id: "a4", label: "Specialist", kind: "agent", col: 3, row: 3 },
      { id: "merge", label: "Merge", kind: "merge", col: 4, row: 1.5 },
    ],
    edges: [
      { from: "in", to: "fan" },
      { from: "fan", to: "a1" }, { from: "fan", to: "a2" }, { from: "fan", to: "a3" }, { from: "fan", to: "a4" },
      { from: "a1", to: "merge" }, { from: "a2", to: "merge" }, { from: "a3", to: "merge" }, { from: "a4", to: "merge" },
    ],
    play: [],
  },
  consensus: {
    cols: 5, rows: 3,
    nodes: [
      { id: "in", label: "Case", kind: "io", col: 1, row: 1 },
      { id: "prop", label: "Proposer", kind: "agent", col: 2, row: 1 },
      { id: "r1", label: "Reviewer 1", kind: "agent", col: 3, row: 0 },
      { id: "r2", label: "Reviewer 2", kind: "agent", col: 3, row: 2 },
      { id: "syn", label: "Consensus", kind: "merge", col: 4, row: 1 },
      { id: "human", label: "Human", kind: "human", col: 5, row: 1 },
    ],
    edges: [
      { from: "in", to: "prop" },
      { from: "prop", to: "r1" }, { from: "prop", to: "r2" },
      { from: "r1", to: "syn" }, { from: "r2", to: "syn" },
      { from: "syn", to: "human", dashed: true },
    ],
    play: [],
  },
};

const PATTERN_LABEL: Record<RunPattern, string> = {
  supervisor: "Supervisor / Worker (sequential)",
  parallel: "Parallel Specialists (concurrent)",
  consensus: "Consensus / Debate",
};

export default function Lab4() {
  const [scenario, setScenario] = useState<ScenarioId>("incident");
  const [pattern, setPattern] = useState<RunPattern>("supervisor");
  const [events, setEvents] = useState<Evt[]>([]);
  const [running, setRunning] = useState(false);
  const [provider, setProvider] = useState<"deepseek" | "none" | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { fetch("/api/status").then((r) => r.json()).then((d) => setProvider(d.provider)).catch(() => setProvider("none")); }, []);

  // Map scenario specialist ids → a1..a4 slots (for supervisor/parallel graphs)
  const slotMap = useMemo(() => {
    const m: Record<string, string> = {};
    SCENARIOS[scenario].specialists.forEach((sp, i) => { m[sp.id] = `a${i + 1}`; });
    return m;
  }, [scenario]);

  const graph = RUN_GRAPHS[pattern];

  // Build active/done from events, translating ids to slots
  const { active, done } = useMemo(() => {
    const a = new Set<string>(); const d = new Set<string>();
    const tr = (id: string) => slotMap[id] || id;
    a.add("in"); d.add("in"); // case always present once running
    for (const e of events) {
      if (e.kind === "node_start") a.add(tr(e.id as string));
      if (e.kind === "node_done") { d.add(tr(e.id as string)); a.delete(tr(e.id as string)); }
    }
    return { active: a, done: d };
  }, [events, slotMap]);

  const findings = events.filter((e) => e.kind === "finding") as unknown as Array<{ name: string; emoji: string; text: string }>;
  const complete = events.find((e) => e.kind === "complete") as unknown as { summary: string } | undefined;
  const receipt = events.find((e) => e.kind === "receipt") as unknown as
    | { total_ms: number; llm_calls: number; llm_ms: number; parallel: boolean; scripted: boolean; provider: string; model: string } | undefined;
  const llmCalls = events.filter((e) => e.kind === "llm_call") as unknown as Array<{ purpose: string; model: string; ms: number; total_tokens?: number; scripted: boolean }>;

  async function run() {
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setEvents([]); setRunning(true);
    try {
      const res = await fetch("/api/run/orchestrate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, pattern }), signal: ctrl.signal,
      });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { done: dn, value } = await reader.read(); if (dn) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { setEvents((cur) => [...cur, JSON.parse(line.slice(6))]); } catch { /* skip */ }
        }
      }
    } catch (err) { if ((err as Error).name !== "AbortError") setEvents((c) => [...c, { kind: "error", message: (err as Error).message }]); }
    finally { setRunning(false); }
  }

  function reset() { abortRef.current?.abort(); setEvents([]); setRunning(false); }

  return (
    <LabLayout currentLab={4}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center"><PlayCircle className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 4 · Live</span>
            <span className="ml-auto text-[10px] text-gray-600">{provider === "deepseek" ? "● live · DeepSeek" : provider === "none" ? "○ scripted" : ""}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Watch Them Run</h1>
          <p className="text-gray-400 max-w-2xl">
            One scenario, three patterns. Same input — radically different execution. Watch the graph light up and the specialists report back.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">Scenario</div>
              <div className="flex gap-2">
                {(["incident", "delivery"] as ScenarioId[]).map((s) => (
                  <button key={s} onClick={() => { setScenario(s); reset(); }} disabled={running}
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border disabled:opacity-50 ${scenario === s ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-gray-800 text-gray-400 hover:border-gray-700"}`}>
                    {SCENARIOS[s].emoji} {SCENARIOS[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">Orchestration pattern</div>
              <div className="flex gap-2">
                {(["supervisor", "parallel", "consensus"] as RunPattern[]).map((p) => (
                  <button key={p} onClick={() => { setPattern(p); reset(); }} disabled={running}
                    className={`flex-1 text-[11px] px-2 py-2 rounded-lg border disabled:opacity-50 capitalize ${pattern === p ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-gray-800 text-gray-400 hover:border-gray-700"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 italic mt-3">{SCENARIOS[scenario].brief} · running as <span className="text-gray-300">{PATTERN_LABEL[pattern]}</span></div>
          <div className="flex gap-2 mt-3">
            <motion.button onClick={run} disabled={running} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              {running ? "Running…" : <><Play className="w-4 h-4" /> Run the workflow</>}
            </motion.button>
            <button onClick={reset} disabled={running} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2.5 rounded-xl disabled:opacity-50"><RotateCcw className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Live graph */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Live execution</div>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 overflow-x-auto">
            <AgentGraph graph={withScenarioLabels(graph, scenario, pattern)} active={active} done={done} />
          </div>
        </div>

        {/* Findings */}
        {(findings.length > 0 || running) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Specialist findings {running && "· streaming…"}</div>
            <div className="space-y-2">
              <AnimatePresence>
                {findings.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                    <div className="text-xs font-bold text-white mb-0.5">{f.emoji} {f.name}</div>
                    <div className="text-[13px] text-gray-300 leading-relaxed">{f.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {complete && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div><div className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 mb-0.5">Final synthesis</div><div className="text-sm text-emerald-100 leading-relaxed">{complete.summary}</div></div>
              </motion.div>
            )}
          </div>
        )}

        {/* Receipt */}
        {receipt && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-emerald-300" />
              <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Run receipt</span>
              <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${receipt.scripted ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>{receipt.scripted ? "scripted" : `live · ${receipt.provider}`}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Metric label="LLM calls" value={String(receipt.llm_calls)} hint={receipt.model} />
              <Metric label="LLM time" value={`${(receipt.llm_ms / 1000).toFixed(2)}s`} hint="thinking" />
              <Metric label="Wall-clock" value={`${(receipt.total_ms / 1000).toFixed(2)}s`} hint="end-to-end" />
              <Metric label="Execution" value={receipt.parallel ? "parallel" : "sequential"} hint={receipt.parallel ? "concurrent" : "one at a time"} />
            </div>
            <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] text-gray-500 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              {receipt.parallel
                ? "Parallel: specialists ran concurrently — wall-clock ≈ the slowest one, not the sum."
                : "Sequential: wall-clock ≈ the sum of every specialist. Compare with the parallel pattern."}
            </div>
            {llmCalls.length > 0 && (
              <div className="mt-3 space-y-1 max-h-40 overflow-auto">
                {llmCalls.map((c, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[11px] border rounded-lg px-2 py-1 ${c.scripted ? "border-amber-500/30 bg-amber-500/5" : "border-pink-500/30 bg-pink-500/5"}`}>
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="font-bold text-white w-28 truncate">{c.purpose}</span>
                    <span className={c.scripted ? "text-amber-300" : "text-pink-300"}>{c.model}</span>
                    <span className="ml-auto text-gray-400 font-mono">{c.ms}ms</span>
                    {c.total_tokens && <span className="text-gray-500 font-mono">{c.total_tokens}t</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Try this</h3>
          <p className="text-gray-400 text-sm">
            Run the <strong className="text-white">same scenario</strong> as supervisor, then parallel, then consensus. Watch the receipt: parallel collapses wall-clock; consensus adds reviewers and a human gate for quality. Same agents — the <em>orchestration</em> changes the behavior.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}

function withScenarioLabels(graph: GraphDef, scenario: ScenarioId, pattern: RunPattern): GraphDef {
  if (pattern === "consensus") return graph;
  const specs = SCENARIOS[scenario].specialists;
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      const m = n.id.match(/^a(\d)$/);
      if (m) { const sp = specs[Number(m[1]) - 1]; return sp ? { ...n, label: sp.name.replace(" Investigator", "").replace(" Review", "").replace(" Risk", "").replace(" Analysis", "").replace(" Feasibility", "") } : n; }
      return n;
    }),
  };
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5">
      <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{label}</div>
      <div className="text-sm text-white font-mono font-bold">{value}</div>
      {hint && <div className="text-[9px] text-gray-600 truncate">{hint}</div>}
    </div>
  );
}
