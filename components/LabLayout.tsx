"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle, Users, LayoutGrid, PlayCircle, Scale,
  Wand2, Boxes, ChevronRight, Home, Network,
} from "lucide-react";

export const labs = [
  { id: 1, path: "/lab1-overload", title: "The Overload Problem", icon: AlertTriangle, color: "text-red-400" },
  { id: 2, path: "/lab2-team-anatomy", title: "Agent Team Anatomy", icon: Users, color: "text-purple-400" },
  { id: 3, path: "/lab3-pattern-gallery", title: "The Pattern Gallery", icon: LayoutGrid, color: "text-cyan-400" },
  { id: 4, path: "/lab4-watch-run", title: "Watch Them Run", icon: PlayCircle, color: "text-emerald-400" },
  { id: 5, path: "/lab5-tradeoffs", title: "The Tradeoff Simulator", icon: Scale, color: "text-amber-400" },
  { id: 6, path: "/lab6-pattern-picker", title: "The Pattern Picker", icon: Wand2, color: "text-blue-400" },
  { id: 7, path: "/lab7-build-hybrid", title: "Build the Hybrid", icon: Boxes, color: "text-pink-400" },
];

export default function LabLayout({ children, currentLab }: { children: React.ReactNode; currentLab: number }) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Multi-Agent Systems</div>
              <div className="text-xs text-gray-500">Class 18 · LangGraph</div>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <Link href="/" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}>
            <Home className="w-4 h-4" />
            <span>Overview</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs text-gray-600 uppercase tracking-wider px-3 py-2 font-semibold">Labs</div>
          {labs.map((lab) => {
            const Icon = lab.icon;
            const isActive = pathname === lab.path;
            const isCompleted = lab.id < currentLab;
            return (
              <Link key={lab.id} href={lab.path}>
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive ? "bg-gray-800 border border-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex-shrink-0 ${isActive ? lab.color : isCompleted ? "text-green-500" : "text-gray-600"}`}>
                    {isCompleted ? (
                      <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600">Lab {lab.id}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-gray-500" />}
                    </div>
                    <div className={`text-xs font-medium truncate ${isActive ? "text-white" : ""}`}>{lab.title}</div>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 text-center">Tech Leaders Hub — Class 18</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
