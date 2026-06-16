"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, ShieldAlert, Target, Wrench, FileText, Eye } from "lucide-react";
import LabLayout from "@/components/LabLayout";

type Agent = {
  id: string;
  name: string;
  emoji: string;
  role: string;
  responsibility: string;
  tools: string[];
  context: string;
  output: string;
};

const COMMANDER: Agent = {
  id: "cmd", name: "Incident Commander", emoji: "🎖️",
  role: "Coordinator",
  responsibility: "Owns the overall flow. Decides which specialist runs next and when the investigation is done.",
  tools: ["delegate", "read_state", "declare_resolved"],
  context: "The alert + a running summary of each specialist's findings (not their raw data).",
  output: "A clear command decision: who investigates next, or 'we have root cause'.",
};

const AGENTS: Agent[] = [
  { id: "logs", name: "Logs Investigator", emoji: "🔍", role: "Specialist",
    responsibility: "Find error signatures and spikes in the logs for the impacted service.",
    tools: ["query_logs", "trace_requests"],
    context: "Just the service name, time window, and the alert. Nothing else.",
    output: "Top error signatures + first-seen timestamp." },
  { id: "metrics", name: "Metrics Investigator", emoji: "📈", role: "Specialist",
    responsibility: "Check saturation, latency, and SLO burn for the impacted service.",
    tools: ["read_metrics", "check_slo"],
    context: "Service name + time window + relevant dashboards.",
    output: "Saturation verdict + SLO burn rate." },
  { id: "change", name: "Change Analysis", emoji: "🔧", role: "Specialist",
    responsibility: "Correlate the incident start with recent deploys and config changes.",
    tools: ["list_deploys", "diff_config"],
    context: "Time window + service + deploy history.",
    output: "Suspect change(s) ranked by correlation." },
  { id: "past", name: "Past-Incident Search", emoji: "📚", role: "Specialist",
    responsibility: "Find similar historical incidents and their resolutions.",
    tools: ["search_incidents"],
    context: "The alert text + service.",
    output: "Closest prior incidents + how they were fixed." },
  { id: "rca", name: "Root-Cause Summarizer", emoji: "🧩", role: "Synthesizer",
    responsibility: "Combine all specialist findings into one root-cause hypothesis.",
    tools: ["read_state"],
    context: "Every specialist's structured output (not raw data).",
    output: "A single ranked root-cause hypothesis with evidence." },
  { id: "comms", name: "Communication Drafter", emoji: "✍️", role: "Writer",
    responsibility: "Draft the status-page update and war-room note.",
    tools: ["post_statuspage", "update_ticket"],
    context: "The root-cause hypothesis + severity + audience.",
    output: "Customer-safe status update + internal note." },
  { id: "human", name: "Human Commander", emoji: "🧑‍✈️", role: "Human gate",
    responsibility: "Approve risky actions (rollback, customer comms) before they execute.",
    tools: ["approve", "reject"],
    context: "A concise decision brief — what, why, blast radius.",
    output: "Go / no-go." },
];

const ALL_AGENTS = [COMMANDER, ...AGENTS];

export default function Lab2() {
  const [selected, setSelected] = useState<Agent>(COMMANDER);
  const [scoped, setScoped] = useState(true);

  const allTools = Array.from(new Set(ALL_AGENTS.flatMap((a) => a.tools)));

  return (
    <LabLayout currentLab={2}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lab 2 · Vocabulary</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Agent Team Anatomy</h1>
          <p className="text-gray-400 max-w-2xl">
            Same incident, now a <span className="text-purple-300 font-medium">team</span>. Click any agent to see its definition.
            A sub-agent isn&apos;t a smaller model — it&apos;s a <em>narrower responsibility</em>.
          </p>
        </div>

        {/* Team tree */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-4">Incident Command team</div>

          {/* commander */}
          <div className="flex justify-center mb-3">
            <AgentChip agent={COMMANDER} selected={selected.id === COMMANDER.id} onClick={() => setSelected(COMMANDER)} wide />
          </div>
          <div className="flex justify-center mb-3"><div className="w-px h-4 bg-gray-700" /></div>

          {/* specialists row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {AGENTS.slice(0, 4).map((a) => (
              <AgentChip key={a.id} agent={a} selected={selected.id === a.id} onClick={() => setSelected(a)} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {AGENTS.slice(4).map((a) => (
              <AgentChip key={a.id} agent={a} selected={selected.id === a.id} onClick={() => setSelected(a)} />
            ))}
          </div>
        </div>

        {/* Selected agent detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5 mb-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">{selected.emoji}</div>
              <div>
                <div className="text-lg font-bold text-white">{selected.name}</div>
                <div className="text-xs text-purple-300 uppercase tracking-wider font-bold">{selected.role}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field icon={Target} label="Responsibility" value={selected.responsibility} />
              <Field icon={FileText} label="Defined output" value={selected.output} />
              <Field icon={Eye} label="Scoped context" value={selected.context} />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1 mb-1"><Wrench className="w-3 h-3" /> Tools (just what it needs)</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.tools.map((t) => <code key={t} className="text-[10px] px-1.5 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300">{t}()</code>)}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tool-scoping toggle */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-xs uppercase tracking-wider font-bold text-gray-400">Tool access</div>
            <div className="flex gap-1.5">
              <button onClick={() => setScoped(true)} className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${scoped ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-gray-800 text-gray-400"}`}><Shield className="w-3.5 h-3.5" /> Scoped per agent</button>
              <button onClick={() => setScoped(false)} className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${!scoped ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-gray-800 text-gray-400"}`}><ShieldAlert className="w-3.5 h-3.5" /> Everyone gets everything</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ALL_AGENTS.slice(0, 6).map((a) => {
              const tools = scoped ? a.tools : allTools;
              return (
                <div key={a.id} className={`rounded-lg border p-2.5 ${scoped ? "border-gray-800" : "border-red-500/30 bg-red-500/5"}`}>
                  <div className="text-xs font-bold text-white mb-1">{a.emoji} {a.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {tools.slice(0, scoped ? tools.length : 8).map((t) => (
                      <code key={t} className={`text-[9px] px-1 py-0.5 rounded ${scoped ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>{t}</code>
                    ))}
                    {!scoped && allTools.length > 8 && <span className="text-[9px] text-red-400">+{allTools.length - 8} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`mt-3 text-[11px] leading-relaxed ${scoped ? "text-emerald-300/80" : "text-red-300/80"}`}>
            {scoped
              ? "Scoped: each agent only sees the 1–2 tools it needs. Smaller decision space → fewer wrong tool calls, safer blast radius, easier to test."
              : "Unscoped: every agent can call every tool. The logs investigator could post to the status page. Huge decision space, dangerous mistakes, impossible to reason about."}
          </div>
        </div>

        <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-violet-300 text-sm mb-2">Key Insight</h3>
          <p className="text-gray-400 text-sm">
            Five things define a sub-agent: <strong className="text-white">role · responsibility · scoped tools · narrow context · defined output</strong>. The commander coordinates; specialists go deep. Now — how do they coordinate? That&apos;s the pattern gallery in Lab 3.
          </p>
        </div>
      </div>
    </LabLayout>
  );
}

function AgentChip({ agent, selected, onClick, wide }: { agent: Agent; selected: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-xl border p-2.5 transition-all ${wide ? "w-64" : "w-full"} ${
        selected ? "border-purple-500/60 bg-purple-500/10" : "border-gray-800 bg-gray-950 hover:border-gray-700"
      }`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{agent.emoji}</span>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">{agent.name}</div>
          <div className="text-[9px] uppercase tracking-wider text-gray-500">{agent.role}</div>
        </div>
      </div>
    </button>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1 mb-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className="text-sm text-gray-200 leading-relaxed">{value}</div>
    </div>
  );
}
