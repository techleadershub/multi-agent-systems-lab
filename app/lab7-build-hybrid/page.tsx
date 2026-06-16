"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, Play, RotateCcw, CheckCircle2, AlertTriangle, Network, ArrowRight } from "lucide-react";
import LabLayout from "@/components/LabLayout";
import { AgentGraph, useGraphPlayer } from "@/lib/AgentGraph";
import type { GraphDef, GNode, GEdge } from "@/lib/graphs";

type BlockId = "supervisor" | "specialists" | "parallel" | "consensus" | "human" | "system";

const BLOCKS: { id: BlockId; name: string; desc: string; accent: string }[] = [
  { id: "supervisor", name: "Supervisor", desc: "Routes work, owns the flow", accent: "#f59e0b" },
  { id: "specialists", name: "Specialist tools", desc: "Narrow agents called as tools", accent: "#3b82f6" },
  { id: "parallel", name: "Parallel review", desc: "Independent expert lenses at once", accent: "#a855f7" },
  { id: "consensus", name: "Consensus check", desc: "Critique before committing", accent: "#10b981" },
  { id: "human", name: "Human gate", desc: "Sign-off on risky actions", accent: "#ec4899" },
  { id: "system", name: "System update", desc: "Write back to real systems", accent: "#64748b" },
];

function compose(on: Set<BlockId>): GraphDef {
  const nodes: GNode[] = [{ id: "in", label: "Trigger", kind: "io", col: 1, row: 1.5 }];
  const edges: GEdge[] = [];
  let col = 2;
  let last = "in";
  const rows = 3;

  if (on.has("supervisor")) {
    nodes.push({ id: "sup", label: "Supervisor", kind: "supervisor", col, row: 1.5 });
    edges.push({ from: last, to: "sup" }); last = "sup"; col++;
  }
  if (on.has("specialists")) {
    nodes.push({ id: "spec", label: "Specialist tools", kind: "tool", col, row: 1.5 });
    edges.push({ from: last, to: "spec", dashed: true });
    edges.push({ from: "spec", to: last, back: true });
    last = "spec"; col++;
  }
  if (on.has("parallel")) {
    nodes.push({ id: "p1", label: "Review A", kind: "agent", col, row: 0.5 });
    nodes.push({ id: "p2", label: "Review B", kind: "agent", col, row: 2.5 });
    edges.push({ from: last, to: "p1" }); edges.push({ from: last, to: "p2" });
    col++;
    // merge point
    const mergeId = on.has("consensus") ? "cons" : "merge";
    if (!on.has("consensus")) {
      nodes.push({ id: "merge", label: "Merge", kind: "merge", col, row: 1.5 });
      edges.push({ from: "p1", to: "merge" }); edges.push({ from: "p2", to: "merge" });
      last = "merge"; col++;
    } else {
      // consensus block will be added next and serve as merge
      edges.push({ from: "p1", to: mergeId }); edges.push({ from: "p2", to: mergeId });
    }
  }
  if (on.has("consensus")) {
    nodes.push({ id: "cons", label: "Consensus", kind: "merge", col, row: 1.5 });
    if (!on.has("parallel")) edges.push({ from: last, to: "cons" });
    last = "cons"; col++;
  }
  if (on.has("human")) {
    nodes.push({ id: "human", label: "Human gate", kind: "human", col, row: 1.5 });
    edges.push({ from: last, to: "human", dashed: true }); last = "human"; col++;
  }
  if (on.has("system")) {
    nodes.push({ id: "sys", label: "System update", kind: "system", col, row: 1.5 });
    edges.push({ from: last, to: "sys" }); last = "sys"; col++;
  }
  nodes.push({ id: "end", label: "END", kind: "io", col, row: 1.5 });
  edges.push({ from: last, to: "end" });

  // build play order left-to-right by column
  const order = [...nodes].sort((a, b) => a.col - b.col);
  const play: (string | string[])[] = [];
  const byCol = new Map<number, string[]>();
  order.forEach((n) => { const arr = byCol.get(n.col) || []; arr.push(n.id); byCol.set(n.col, arr); });
  [...byCol.keys()].sort((a, b) => a - b).forEach((c) => { const ids = byCol.get(c)!; play.push(ids.length === 1 ? ids[0] : ids); });

  return { cols: col, rows, nodes, edges, play };
}

function critique(on: Set<BlockId>): { ok: string[]; warn: string[] } {
  const ok: string[] = []; const warn: string[] = [];
  if (on.has("supervisor")) ok.push("Has a coordinator that owns the flow."); else warn.push("No supervisor — who decides what runs next and when it's done?");
  if (on.has("consensus") || on.has("supervisor")) ok.push("There is a final decision owner."); else warn.push("No final decision owner — outputs may conflict with nobody to resolve them.");
  if (on.has("parallel")) ok.push("Parallel review gives broad coverage fast.");
  if (on.has("human")) ok.push("Human gate protects risky actions."); else if (on.has("system")) warn.push("System update with no human gate — risky writes run unattended.");
  if (on.has("specialists")) ok.push("Scoped specialist tools keep blast radius small.");
  if (on.size <= 1) warn.push("Too few blocks — this is barely more than a single agent.");
  if (on.has("consensus") && !on.has("parallel")) warn.push("Consensus with no parallel reviewers — limited independent critique.");
  return { ok, warn };
}

export default function Lab7() {
  const [on, setOn] = useState<Set<BlockId>>(new Set(["supervisor", "specialists"]));
  const graph = useMemo(() => compose(on), [on]);
  const player = useGraphPlayer(graph, 600);
  const review = useMemo(() => critique(on), [on]);

  function toggle(id: BlockId) {
    setOn((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    player.reset();
  }

  return (
    <LabLayout currentLab={7}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center"><Boxes className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 7 · Capstone</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Build the Hybrid</h1>
          <p className="text-gray-400 max-w-2xl">Real production architectures combine patterns. Toggle building blocks, watch the graph assemble, then run it. The completeness check flags what&apos;s missing.</p>
        </div>

        {/* Block toggles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
          {BLOCKS.map((b) => {
            const active = on.has(b.id);
            return (
              <button key={b.id} onClick={() => toggle(b.id)}
                className={`text-left rounded-xl border p-3 transition-all ${active ? "bg-gray-800" : "border-gray-800 bg-gray-900 hover:border-gray-700"}`}
                style={active ? { borderColor: b.accent } : {}}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[9px] ${active ? "text-black" : "text-transparent border border-gray-600"}`} style={active ? { background: b.accent } : {}}>✓</div>
                  <div className="text-sm font-bold" style={{ color: active ? b.accent : "#fff" }}>{b.name}</div>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 ml-6">{b.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Assembled graph */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Your architecture</span>
            <div className="flex gap-2">
              <button onClick={player.play} disabled={player.playing} className="text-xs px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {player.playing ? "Running…" : "Run it"}</button>
              <button onClick={player.reset} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 overflow-x-auto">
            <AgentGraph graph={graph} active={player.active} done={player.done} />
          </div>
        </div>

        {/* Completeness check */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Completeness check</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {review.ok.map((r, i) => <div key={`o${i}`} className="flex items-start gap-2 text-[12px] text-emerald-200 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />{r}</div>)}
            {review.warn.map((r, i) => <div key={`w${i}`} className="flex items-start gap-2 text-[12px] text-amber-200 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />{r}</div>)}
          </div>
        </div>

        {/* A2A footnote */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2"><Network className="w-4 h-4 text-violet-300" /><span className="text-xs uppercase tracking-wider font-bold text-gray-400">What&apos;s next: A2A</span></div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300">
            <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700">LangGraph multi-agent</span>
            <span className="text-gray-600">= orchestration inside one app/runtime</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-300 mt-1.5">
            <span className="px-2 py-1 rounded bg-violet-500/10 border border-violet-500/30 text-violet-300">A2A</span>
            <span className="text-gray-600">= communication between independent agents across apps, teams, vendors</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">First learn orchestration <ArrowRight className="w-3 h-3" /> then interoperability.</div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Final Takeaway</h3>
          <p className="text-gray-400 text-sm">
            Multi-agent systems aren&apos;t about adding more agents — they&apos;re about <strong className="text-violet-300">coordinated responsibility</strong>. Specialization gives depth, parallelism gives speed, review gives quality, state gives continuity, human gates give safety — and LangGraph gives orchestration.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}
