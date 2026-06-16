// Graph definitions for each orchestration pattern.
// Coordinates are on a simple col/row grid; the renderer maps them to pixels.

import type { NodeKind, PatternId } from "./tokens";

export type GNode = {
  id: string;
  label: string;
  kind: NodeKind;
  col: number;
  row: number;
};

export type GEdge = {
  from: string;
  to: string;
  dashed?: boolean;   // conditional edge
  back?: boolean;     // return edge (worker → supervisor)
};

export type GraphDef = {
  cols: number;
  rows: number;
  nodes: GNode[];
  edges: GEdge[];
  // A linear "play order" of node ids — how a unit of work flows through.
  // Groups (arrays) animate simultaneously (parallel).
  play: (string | string[])[];
};

export const GRAPHS: Record<PatternId, GraphDef> = {
  // 1 — Single agent + tools (agent ⇄ tools loop)
  single: {
    cols: 4, rows: 1,
    nodes: [
      { id: "in", label: "Event", kind: "io", col: 1, row: 0 },
      { id: "agent", label: "Agent", kind: "agent", col: 2, row: 0 },
      { id: "tools", label: "Tools", kind: "tool", col: 3, row: 0 },
      { id: "out", label: "Answer", kind: "io", col: 4, row: 0 },
    ],
    edges: [
      { from: "in", to: "agent" },
      { from: "agent", to: "tools", dashed: true },
      { from: "tools", to: "agent", back: true },
      { from: "agent", to: "out", dashed: true },
    ],
    play: ["in", "agent", "tools", "agent", "out"],
  },

  // 2 — Supervisor / Worker (router fans to workers, returns, synthesizes)
  supervisor: {
    cols: 4, rows: 3,
    nodes: [
      { id: "in", label: "Event", kind: "io", col: 1, row: 1 },
      { id: "sup", label: "Supervisor", kind: "supervisor", col: 2, row: 1 },
      { id: "w1", label: "Worker A", kind: "agent", col: 3, row: 0 },
      { id: "w2", label: "Worker B", kind: "agent", col: 3, row: 1 },
      { id: "w3", label: "Worker C", kind: "agent", col: 3, row: 2 },
      { id: "out", label: "Synthesis", kind: "merge", col: 4, row: 1 },
    ],
    edges: [
      { from: "in", to: "sup" },
      { from: "sup", to: "w1", dashed: true },
      { from: "sup", to: "w2", dashed: true },
      { from: "sup", to: "w3", dashed: true },
      { from: "w1", to: "sup", back: true },
      { from: "w2", to: "sup", back: true },
      { from: "w3", to: "sup", back: true },
      { from: "sup", to: "out" },
    ],
    play: ["in", "sup", "w1", "sup", "w2", "sup", "w3", "sup", "out"],
  },

  // 3 — Supervisor-as-tools (specialists called like functions)
  "supervisor-tools": {
    cols: 3, rows: 3,
    nodes: [
      { id: "in", label: "Event", kind: "io", col: 1, row: 1 },
      { id: "sup", label: "Supervisor", kind: "supervisor", col: 2, row: 1 },
      { id: "t1", label: "logs_tool()", kind: "tool", col: 3, row: 0 },
      { id: "t2", label: "metrics_tool()", kind: "tool", col: 3, row: 1 },
      { id: "t3", label: "compliance_tool()", kind: "tool", col: 3, row: 2 },
    ],
    edges: [
      { from: "in", to: "sup" },
      { from: "sup", to: "t1", dashed: true },
      { from: "t1", to: "sup", back: true },
      { from: "sup", to: "t2", dashed: true },
      { from: "t2", to: "sup", back: true },
      { from: "sup", to: "t3", dashed: true },
      { from: "t3", to: "sup", back: true },
    ],
    play: ["in", "sup", "t1", "sup", "t2", "sup", "t3", "sup"],
  },

  // 4 — Parallel specialists (fan-out → merge)
  parallel: {
    cols: 4, rows: 5,
    nodes: [
      { id: "in", label: "Input", kind: "io", col: 1, row: 2 },
      { id: "fan", label: "Fan-out", kind: "supervisor", col: 2, row: 2 },
      { id: "a1", label: "Security", kind: "agent", col: 3, row: 0 },
      { id: "a2", label: "Performance", kind: "agent", col: 3, row: 1 },
      { id: "a3", label: "Cost", kind: "agent", col: 3, row: 2 },
      { id: "a4", label: "Compliance", kind: "agent", col: 3, row: 3 },
      { id: "a5", label: "Delivery Risk", kind: "agent", col: 3, row: 4 },
      { id: "merge", label: "Merge", kind: "merge", col: 4, row: 2 },
    ],
    edges: [
      { from: "in", to: "fan" },
      { from: "fan", to: "a1" },
      { from: "fan", to: "a2" },
      { from: "fan", to: "a3" },
      { from: "fan", to: "a4" },
      { from: "fan", to: "a5" },
      { from: "a1", to: "merge" },
      { from: "a2", to: "merge" },
      { from: "a3", to: "merge" },
      { from: "a4", to: "merge" },
      { from: "a5", to: "merge" },
    ],
    play: ["in", "fan", ["a1", "a2", "a3", "a4", "a5"], "merge"],
  },

  // 5 — Hierarchical (supervisor of supervisors, nested)
  hierarchical: {
    cols: 4, rows: 4,
    nodes: [
      { id: "exec", label: "Executive Sup.", kind: "supervisor", col: 1, row: 1.5 },
      { id: "tech", label: "Technical Sup.", kind: "supervisor", col: 2, row: 0.5 },
      { id: "deliv", label: "Delivery Sup.", kind: "supervisor", col: 2, row: 2.5 },
      { id: "sec", label: "Security", kind: "agent", col: 3, row: 0 },
      { id: "arch", label: "Architecture", kind: "agent", col: 3, row: 1 },
      { id: "risk", label: "Risk", kind: "agent", col: 3, row: 2 },
      { id: "dep", label: "Dependency", kind: "agent", col: 3, row: 3 },
      { id: "out", label: "Top Synthesis", kind: "merge", col: 4, row: 1.5 },
    ],
    edges: [
      { from: "exec", to: "tech", dashed: true },
      { from: "exec", to: "deliv", dashed: true },
      { from: "tech", to: "sec" },
      { from: "tech", to: "arch" },
      { from: "deliv", to: "risk" },
      { from: "deliv", to: "dep" },
      { from: "sec", to: "tech", back: true },
      { from: "arch", to: "tech", back: true },
      { from: "risk", to: "deliv", back: true },
      { from: "dep", to: "deliv", back: true },
      { from: "tech", to: "exec", back: true },
      { from: "deliv", to: "exec", back: true },
      { from: "exec", to: "out" },
    ],
    play: ["exec", "tech", ["sec", "arch"], "tech", "exec", "deliv", ["risk", "dep"], "deliv", "exec", "out"],
  },

  // 6 — Consensus / Debate
  consensus: {
    cols: 5, rows: 3,
    nodes: [
      { id: "in", label: "Question", kind: "io", col: 1, row: 1 },
      { id: "prop", label: "Proposer", kind: "agent", col: 2, row: 1 },
      { id: "r1", label: "Reviewer 1", kind: "agent", col: 3, row: 0 },
      { id: "r2", label: "Reviewer 2", kind: "agent", col: 3, row: 2 },
      { id: "syn", label: "Consensus", kind: "merge", col: 4, row: 1 },
      { id: "human", label: "Human", kind: "human", col: 5, row: 1 },
    ],
    edges: [
      { from: "in", to: "prop" },
      { from: "prop", to: "r1" },
      { from: "prop", to: "r2" },
      { from: "r1", to: "syn" },
      { from: "r2", to: "syn" },
      { from: "syn", to: "human", dashed: true },
    ],
    play: ["in", "prop", ["r1", "r2"], "syn", "human"],
  },

  // 7 — Custom hybrid (everything stacked)
  hybrid: {
    cols: 6, rows: 3,
    nodes: [
      { id: "sup", label: "Supervisor", kind: "supervisor", col: 1, row: 1 },
      { id: "spec", label: "Specialist tools", kind: "tool", col: 2, row: 1 },
      { id: "p1", label: "Review A", kind: "agent", col: 3, row: 0 },
      { id: "p2", label: "Review B", kind: "agent", col: 3, row: 2 },
      { id: "cons", label: "Consensus", kind: "merge", col: 4, row: 1 },
      { id: "human", label: "Human gate", kind: "human", col: 5, row: 1 },
      { id: "sys", label: "System update", kind: "system", col: 6, row: 1 },
    ],
    edges: [
      { from: "sup", to: "spec", dashed: true },
      { from: "spec", to: "sup", back: true },
      { from: "sup", to: "p1" },
      { from: "sup", to: "p2" },
      { from: "p1", to: "cons" },
      { from: "p2", to: "cons" },
      { from: "cons", to: "human", dashed: true },
      { from: "human", to: "sys" },
    ],
    play: ["sup", "spec", "sup", ["p1", "p2"], "cons", "human", "sys"],
  },
};
