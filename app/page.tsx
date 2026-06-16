"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle, Users, LayoutGrid, PlayCircle, Scale, Wand2, Boxes,
  Network, ArrowRight,
} from "lucide-react";

const labs = [
  { id: 1, path: "/lab1-overload", title: "The Overload Problem", desc: "One agent tries to run a production incident alone. Watch it drown — too many tools, too many questions, serial work.", icon: AlertTriangle, color: "from-red-600 to-rose-600", badge: "The why" },
  { id: 2, path: "/lab2-team-anatomy", title: "Agent Team Anatomy", desc: "What a sub-agent actually is: role · responsibility · scoped tools · narrow context · defined output.", icon: Users, color: "from-purple-600 to-violet-600", badge: "Vocabulary" },
  { id: 3, path: "/lab3-pattern-gallery", title: "The Pattern Gallery", desc: "All 7 orchestration patterns as animated graphs. Play each one, watch how work flows.", icon: LayoutGrid, color: "from-cyan-600 to-sky-600", badge: "⭐ Core" },
  { id: 4, path: "/lab4-watch-run", title: "Watch Them Run", desc: "One real scenario, three patterns. See the same input produce completely different execution traces.", icon: PlayCircle, color: "from-emerald-600 to-teal-600", badge: "Live" },
  { id: 5, path: "/lab5-tradeoffs", title: "The Tradeoff Simulator", desc: "Power vs cost. Slide complexity up and down, watch latency, tokens, quality, and coverage move.", icon: Scale, color: "from-amber-500 to-orange-600", badge: "Economics" },
  { id: 6, path: "/lab6-pattern-picker", title: "The Pattern Picker", desc: "Answer 6 questions about your workflow. Get the right pattern, the runner-up, and what to avoid.", icon: Wand2, color: "from-blue-600 to-indigo-600", badge: "Decision tool" },
  { id: 7, path: "/lab7-build-hybrid", title: "Build the Hybrid", desc: "Compose your own enterprise architecture from building blocks, then run it end to end.", icon: Boxes, color: "from-pink-600 to-fuchsia-600", badge: "Capstone" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Multi-Agent Systems Lab</div>
              <div className="text-xs text-gray-500">Tech Leaders Hub · Class 18</div>
            </div>
          </div>
          <Link href="/lab1-overload">
            <motion.button
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              Start Labs <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-300 font-medium mb-6">
            Class 18 · Multi-Agent Orchestration with LangGraph
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            The key word isn&apos;t{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-600 line-through">multiple</span>
            <br />
            it&apos;s{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">coordination</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Designing AI agent teams for enterprise workflows. Seven labs that make the orchestration patterns
            visual — from a single overloaded agent to a full production hybrid.
          </p>
        </motion.div>

        {/* Concept strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {[
            ["Specialization", "gives depth"],
            ["Parallelism", "gives speed"],
            ["Review", "gives quality"],
            ["State", "gives continuity"],
            ["Human gates", "give safety"],
            ["LangGraph", "gives orchestration"],
          ].map(([a, b]) => (
            <div key={a} className="border border-gray-800 bg-gray-900/40 rounded-xl p-3 text-center">
              <div className="text-sm font-bold text-violet-300">{a}</div>
              <div className="text-[11px] text-gray-500">{b}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labs.map((lab, i) => {
            const Icon = lab.icon;
            return (
              <motion.div key={lab.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={lab.path}>
                  <div className="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-5 cursor-pointer transition-all hover:bg-gray-800/60 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${lab.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full">{lab.badge}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">Lab {lab.id}</div>
                    <h3 className="font-bold text-white text-sm mb-2 group-hover:text-violet-300 transition-colors">{lab.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed flex-1">{lab.desc}</p>
                    <div className="flex items-center gap-1 mt-4 text-xs text-gray-600 group-hover:text-violet-400 transition-colors">
                      Open lab <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-600 text-sm">Two anchor scenarios throughout: Production Incident Command · Solution Delivery Risk Review</p>
        </div>
      </div>
    </div>
  );
}
