"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import type { GraphDef } from "./graphs";
import { KIND_COLOR } from "./tokens";

const NODE_W = 116;
const NODE_H = 44;
const PAD = 28;

type Props = {
  graph: GraphDef;
  /** node ids currently "active" (highlighted) */
  active?: Set<string>;
  /** node ids already "done" */
  done?: Set<string>;
  /** cell sizing */
  cellW?: number;
  cellH?: number;
  onNodeClick?: (id: string) => void;
  selected?: string | null;
};

export function AgentGraph({
  graph, active = new Set(), done = new Set(),
  cellW = 150, cellH = 86, onNodeClick, selected,
}: Props) {
  const width = graph.cols * cellW + PAD * 2;
  const height = graph.rows * cellH + PAD * 2;

  const pos = (col: number, row: number) => ({
    x: PAD + (col - 1) * cellW + cellW / 2,
    y: PAD + row * cellH + cellH / 2 + (cellH - NODE_H) / 2,
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: Math.min(width, 680) }}>
      <defs>
        {/* auto-start-reverse lets one marker serve both ends of a bidir edge */}
        <marker id="ag-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
        </marker>
        <marker id="ag-arr-act" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
        </marker>
      </defs>

      {/* Edges */}
      {graph.edges.map((e, i) => {
        const from = graph.nodes.find((n) => n.id === e.from)!;
        const to = graph.nodes.find((n) => n.id === e.to)!;
        const a = pos(from.col, from.row);
        const b = pos(to.col, to.row);
        const fromTouched = done.has(e.from) || active.has(e.from);
        const toTouched = done.has(e.to) || active.has(e.to);
        const isActive = e.bidir ? (fromTouched && toTouched) : (fromTouched && toTouched && !e.back);

        const sameRow = Math.abs(a.y - b.y) < 2;
        // Connect at node sides; left-to-right by column.
        const leftIsA = from.col <= to.col;
        const ax = a.x + (leftIsA ? NODE_W / 2 : -NODE_W / 2);
        const bx = b.x + (leftIsA ? -NODE_W / 2 : NODE_W / 2);

        let d: string;
        if (e.back) {
          // legacy: bow under
          const dip = 22;
          d = `M ${a.x} ${a.y + NODE_H / 2} C ${a.x} ${a.y + NODE_H / 2 + dip}, ${b.x} ${b.y + NODE_H / 2 + dip}, ${b.x} ${b.y + NODE_H / 2}`;
        } else if (sameRow) {
          d = `M ${ax} ${a.y} L ${bx} ${b.y}`;
        } else {
          const mx = (ax + bx) / 2;
          d = `M ${ax} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${bx} ${b.y}`;
        }

        const stroke = isActive ? "#34d399" : "#3a4150";
        const marker = isActive ? "url(#ag-arr-act)" : "url(#ag-arr)";
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={isActive ? 2 : 1.4}
            strokeDasharray={e.dashed ? "5 4" : undefined}
            markerEnd={marker}
            markerStart={e.bidir ? marker : undefined}
          />
        );
      })}

      {/* Nodes */}
      {graph.nodes.map((n) => {
        const p = pos(n.col, n.row);
        const color = KIND_COLOR[n.kind];
        const isActive = active.has(n.id);
        const isDone = done.has(n.id);
        const isSel = selected === n.id;
        const stroke = isActive ? "#fbbf24" : isDone ? "#34d399" : isSel ? color : color + "99";
        return (
          <g
            key={n.id}
            transform={`translate(${p.x - NODE_W / 2}, ${p.y - NODE_H / 2})`}
            onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
            style={{ cursor: onNodeClick ? "pointer" : "default" }}
          >
            <motion.rect
              width={NODE_W} height={NODE_H} rx={9}
              fill={color + (isSel ? "33" : "14")}
              stroke={stroke}
              strokeWidth={isActive || isSel ? 2.4 : 1.4}
              animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.9, repeat: isActive ? Infinity : 0 }}
              style={{ transformOrigin: `${NODE_W / 2}px ${NODE_H / 2}px` }}
            />
            <text x={NODE_W / 2} y={19} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#fff">
              {n.label}
            </text>
            <text x={NODE_W / 2} y={33} textAnchor="middle" fontSize={8.5} fill={color}>
              {n.kind}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Hook that plays a graph's `play` order, returning active/done sets. */
export function useGraphPlayer(graph: GraphDef, stepMs = 700) {
  const [active, setActive] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clear();
    setActive(new Set());
    setDone(new Set());
    setPlaying(false);
  }, [clear]);

  const play = useCallback(() => {
    clear();
    setActive(new Set());
    setDone(new Set());
    setPlaying(true);
    const doneAcc = new Set<string>();
    graph.play.forEach((step, i) => {
      const ids = Array.isArray(step) ? step : [step];
      timers.current.push(
        setTimeout(() => {
          setActive(new Set(ids));
        }, i * stepMs)
      );
      timers.current.push(
        setTimeout(() => {
          ids.forEach((id) => doneAcc.add(id));
          setDone(new Set(doneAcc));
          setActive(new Set());
          if (i === graph.play.length - 1) setPlaying(false);
        }, i * stepMs + stepMs * 0.7)
      );
    });
  }, [graph, stepMs, clear]);

  useEffect(() => () => clear(), [clear]);

  return { active, done, playing, play, reset };
}
