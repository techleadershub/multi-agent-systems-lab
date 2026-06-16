"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Play, RotateCcw, Lightbulb, AlertTriangle, Code2 } from "lucide-react";
import LabLayout from "@/components/LabLayout";
import { PATTERNS, type PatternId } from "@/lib/tokens";
import { GRAPHS } from "@/lib/graphs";
import { PATTERN_META } from "@/lib/patternMeta";
import { AgentGraph, useGraphPlayer } from "@/lib/AgentGraph";

export default function Lab3() {
  const [active, setActive] = useState<PatternId>("single");
  const pattern = PATTERNS.find((p) => p.id === active)!;
  const graph = GRAPHS[active];
  const meta = PATTERN_META[active];
  const player = useGraphPlayer(graph, 650);

  // auto-play when switching patterns
  useEffect(() => {
    player.reset();
    const t = setTimeout(() => player.play(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <LabLayout currentLab={3}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center"><LayoutGrid className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 3 · ⭐ Core</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">The Pattern Gallery</h1>
          <p className="text-gray-400 max-w-2xl">
            Seven ways to orchestrate agents — each is a <em>graph shape</em>. Pick one and watch a unit of work flow through it.
          </p>
        </div>

        {/* Pattern selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-5">
          {PATTERNS.map((p) => (
            <button key={p.id} onClick={() => setActive(p.id)}
              className={`text-left rounded-xl border p-2.5 transition-all ${active === p.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-700"}`}>
              <div className="text-[10px] font-mono font-bold mb-0.5" style={{ color: p.accent }}>0{p.num}</div>
              <div className="text-[11px] font-bold text-white leading-tight">{p.name}</div>
            </button>
          ))}
        </div>

        {/* Graph stage */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="font-mono" style={{ color: pattern.accent }}>0{pattern.num}</span> {pattern.name}
              </div>
              <div className="text-xs text-gray-500">{pattern.tagline}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={player.play} disabled={player.playing}
                className="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" /> {player.playing ? "Playing…" : "Replay flow"}
              </button>
              <button onClick={player.reset} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><RotateCcw className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 overflow-x-auto">
            <AgentGraph graph={graph} active={player.active} done={player.done} />
          </div>
          {/* legend */}
          <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-3">
            <LegendDot color="#f59e0b" label="supervisor" />
            <LegendDot color="#a855f7" label="agent" />
            <LegendDot color="#3b82f6" label="tool" />
            <LegendDot color="#10b981" label="merge / synthesize" />
            <LegendDot color="#ec4899" label="human gate" />
            <LegendDot color="#64748b" label="system" />
            <span className="flex items-center gap-1"><span className="inline-block w-4 border-t border-dashed border-gray-500" /> conditional edge</span>
          </div>
        </div>

        {/* Meta cards */}
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <MetaCard icon={Lightbulb} color="emerald" title="When to use" body={meta.whenToUse} />
            <MetaCard icon={AlertTriangle} color="amber" title="The tradeoff" body={meta.tradeoff} />
          </motion.div>
        </AnimatePresence>

        {/* LangGraph primitive */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-4 h-4 text-cyan-300" />
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">LangGraph primitive</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">{meta.primitive}</div>
          <pre className="text-[11px] text-gray-200 font-mono bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-auto leading-relaxed whitespace-pre">{meta.langgraph}</pre>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {meta.useFor.map((u) => <span key={u} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">{u}</span>)}
          </div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Key Insight</h3>
          <p className="text-gray-400 text-sm">
            Every pattern is just nodes + edges. Supervisors are routers, specialists are nodes, parallelism is fan-out, review is a loop. LangGraph gives you all of them. Lab 4 runs three of these on a real scenario so you can feel the difference.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: color }} /> {label}</span>;
}

function MetaCard({ icon: Icon, color, title, body }: { icon: typeof Lightbulb; color: string; title: string; body: string }) {
  const cls = color === "emerald" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-amber-500/20 bg-amber-500/5 text-amber-300";
  return (
    <div className={`rounded-2xl border p-4 ${cls.split(" ").slice(0, 2).join(" ")}`}>
      <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold mb-2 ${cls.split(" ")[2]}`}><Icon className="w-3.5 h-3.5" /> {title}</div>
      <div className="text-sm text-gray-300 leading-relaxed">{body}</div>
    </div>
  );
}
