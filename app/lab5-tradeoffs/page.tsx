"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Clock, Coins, Target, Boxes } from "lucide-react";
import LabLayout from "@/components/LabLayout";

type Pat = "single" | "supervisor" | "parallel" | "consensus" | "hybrid";

const PATS: { id: Pat; name: string; accent: string }[] = [
  { id: "single", name: "Single + Tools", accent: "#22d3ee" },
  { id: "supervisor", name: "Supervisor", accent: "#f59e0b" },
  { id: "parallel", name: "Parallel", accent: "#10b981" },
  { id: "consensus", name: "Consensus", accent: "#ec4899" },
  { id: "hybrid", name: "Hybrid", accent: "#f43f5e" },
];

// Returns 0..100 for each meter. Higher latency/cost/complexity = worse; higher quality = better.
function model(p: Pat, c: number) {
  const t = c / 100; // 0..1 complexity
  let latency: number, cost: number, quality: number, complexity: number;
  switch (p) {
    case "single":
      latency = 12 + t * 80;             // serial: explodes with complexity
      cost = 8 + t * t * 88;             // context re-reading balloons
      quality = 92 - t * 70;             // craters as dimensions grow
      complexity = 8;
      break;
    case "supervisor":
      latency = 28 + t * 45;
      cost = 26 + t * 40;
      quality = 60 + t * 22;
      complexity = 42;
      break;
    case "parallel":
      latency = 24 + t * 16;             // concurrency keeps latency flat-ish
      cost = 40 + t * 30;                // N agents = higher base
      quality = 66 + t * 26;
      complexity = 50;
      break;
    case "consensus":
      latency = 46 + t * 30;
      cost = 58 + t * 34;                // reviewers cost the most
      quality = 72 + t * 26;             // best quality, esp. high stakes
      complexity = 64;
      break;
    case "hybrid":
      latency = 50 + t * 30;
      cost = 60 + t * 35;
      quality = 70 + t * 28;
      complexity = 88;
      break;
  }
  const clamp = (n: number) => Math.max(2, Math.min(100, Math.round(n)));
  return { latency: clamp(latency), cost: clamp(cost), quality: clamp(quality), complexity: clamp(complexity) };
}

// "Fit score": quality minus penalties for cost/latency/complexity, weighted by how much complexity justifies overhead.
function fit(p: Pat, c: number) {
  const m = model(p, c);
  const t = c / 100;
  // At low complexity, overhead is heavily penalized; at high complexity, quality dominates.
  const overheadWeight = 1 - t * 0.7;
  const score = m.quality - overheadWeight * (m.cost * 0.35 + m.latency * 0.25 + m.complexity * 0.2);
  return Math.round(score);
}

export default function Lab5() {
  const [complexity, setComplexity] = useState(20);
  const [pat, setPat] = useState<Pat>("single");
  const m = model(pat, complexity);

  const ranked = [...PATS].map((p) => ({ ...p, score: fit(p.id, complexity) })).sort((a, b) => b.score - a.score);
  const best = ranked[0];

  return (
    <LabLayout currentLab={5}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center"><Scale className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 5 · Economics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">The Tradeoff Simulator</h1>
          <p className="text-gray-400 max-w-2xl">More agents add power <em>and</em> cost. Slide the problem complexity and watch where each pattern wins — and where it&apos;s overkill.</p>
        </div>

        {/* Complexity slider */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Problem complexity</span>
            <span className="text-sm font-bold text-white">{complexity < 30 ? "Simple" : complexity < 60 ? "Moderate" : complexity < 85 ? "Complex" : "Enterprise"}</span>
          </div>
          <input type="range" min={0} max={100} value={complexity} onChange={(e) => setComplexity(Number(e.target.value))} className="w-full accent-amber-500" />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>one clear task</span><span>multi-dimensional</span><span>multi-domain enterprise</span></div>
        </div>

        {/* Pattern picker */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
          {PATS.map((p) => (
            <button key={p.id} onClick={() => setPat(p.id)}
              className={`rounded-xl border p-2.5 text-center transition-all ${pat === p.id ? "bg-gray-800 border-gray-600" : "border-gray-800 bg-gray-900 hover:border-gray-700"}`}>
              <div className="text-xs font-bold" style={{ color: p.accent }}>{p.name}</div>
            </button>
          ))}
        </div>

        {/* Meters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MeterBar icon={Clock} label="Latency" value={m.latency} invert />
          <MeterBar icon={Coins} label="Token cost" value={m.cost} invert />
          <MeterBar icon={Target} label="Quality / coverage" value={m.quality} />
          <MeterBar icon={Boxes} label="Orchestration complexity" value={m.complexity} invert />
        </div>

        {/* Leaderboard for current complexity */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Best fit at this complexity</div>
          <div className="space-y-2">
            {ranked.map((p, i) => {
              const width = Math.max(6, Math.min(100, p.score + 40));
              return (
                <div key={p.id} className="flex items-center gap-3 text-xs">
                  <span className="w-5 text-gray-600 font-mono text-right">{i + 1}</span>
                  <span className="w-28 font-bold" style={{ color: p.accent }}>{p.name}</span>
                  <div className="flex-1 h-2.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                    <motion.div className="h-full rounded-full" style={{ background: p.accent }} animate={{ width: `${width}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-gray-500">{p.score}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[11px] text-gray-500">
            At <strong className="text-white">{complexity}%</strong> complexity, best fit is <strong style={{ color: best.accent }}>{best.name}</strong>.
            {complexity < 30 && " For simple tasks, a single agent wins — multi-agent overhead isn't justified."}
            {complexity >= 30 && complexity < 70 && " Coordination starts to pay off as the work splits across concerns."}
            {complexity >= 70 && " At enterprise complexity, specialization + review beats one overloaded brain despite the cost."}
          </div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Key Insight</h3>
          <p className="text-gray-400 text-sm">
            There&apos;s a crossover. Below it, multi-agent is wasted latency and tokens. Above it, a single agent can&apos;t keep up on coverage. <strong className="text-violet-300">Use multi-agent only when the complexity justifies it</strong> — match the architecture to the problem, not to the hype.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}

function MeterBar({ icon: Icon, label, value, invert }: { icon: typeof Clock; label: string; value: number; invert?: boolean }) {
  // invert: high value is bad (red). non-invert: high value is good (green).
  const good = invert ? value < 40 : value > 66;
  const mid = invert ? value < 70 : value > 40;
  const color = good ? "#10b981" : mid ? "#f59e0b" : "#ef4444";
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1 mb-2"><Icon className="w-3 h-3" /> {label}</div>
      <div className="h-2.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800 mb-1">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${value}%` }} />
      </div>
      <div className="text-right text-[11px] font-mono" style={{ color }}>{value}</div>
    </div>
  );
}
