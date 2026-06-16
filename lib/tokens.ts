// Shared design tokens + domain constants for the multi-agent labs.

export type NodeKind = "supervisor" | "agent" | "tool" | "merge" | "human" | "system" | "io";

export const KIND_COLOR: Record<NodeKind, string> = {
  supervisor: "#f59e0b", // amber
  agent: "#a855f7",      // purple
  tool: "#3b82f6",       // blue
  merge: "#10b981",      // emerald
  human: "#ec4899",      // pink
  system: "#64748b",     // slate
  io: "#6b7280",         // gray
};

export const KIND_LABEL: Record<NodeKind, string> = {
  supervisor: "supervisor",
  agent: "agent",
  tool: "tool",
  merge: "merge / synthesize",
  human: "human gate",
  system: "system update",
  io: "input / output",
};

// The 7 orchestration patterns (deck slides 18-30)
export const PATTERNS = [
  { id: "single", num: 1, name: "Single Agent + Tools", tagline: "The baseline. One brain decides which tools to use.", accent: "#22d3ee" },
  { id: "supervisor", num: 2, name: "Supervisor / Worker", tagline: "A router delegates to specialist workers.", accent: "#f59e0b" },
  { id: "supervisor-tools", num: 3, name: "Supervisor-as-Tools", tagline: "Specialists exposed as callable tools.", accent: "#3b82f6" },
  { id: "parallel", num: 4, name: "Parallel Specialists", tagline: "Independent experts work at once, then merge.", accent: "#10b981" },
  { id: "hierarchical", num: 5, name: "Hierarchical", tagline: "Supervisors of supervisors. Nested domains.", accent: "#8b5cf6" },
  { id: "consensus", num: 6, name: "Consensus / Debate", tagline: "Propose, critique, synthesize. For costly mistakes.", accent: "#ec4899" },
  { id: "hybrid", num: 7, name: "Custom Hybrid", tagline: "The real production architecture. All of the above.", accent: "#f43f5e" },
] as const;

export type PatternId = (typeof PATTERNS)[number]["id"];
