// Runs a scenario through a chosen orchestration pattern.
// Specialist nodes call DeepSeek (real) with a scripted fallback.
// Supervisor=sequential, Parallel=concurrent, Consensus=propose→review→synthesize.

import { NextRequest } from "next/server";
import { makeSSEStream, sseResponse } from "@/lib/sse";
import { getClient, getModel, hasApiKey } from "@/lib/llm";
import { SCENARIOS, type ScenarioId, type RunPattern, type Specialist } from "@/lib/scenarios";

export const runtime = "nodejs";
export const maxDuration = 60;

type Send = (e: object) => void;
type Stats = { llm_calls: number; llm_ms: number; scripted: boolean; parallel: boolean };

export async function POST(req: NextRequest) {
  const { scenario, pattern } = (await req.json()) as { scenario: ScenarioId; pattern: RunPattern };
  const { stream, send, close } = makeSSEStream();

  (async () => {
    const t0 = Date.now();
    const stats: Stats = { llm_calls: 0, llm_ms: 0, scripted: !hasApiKey(), parallel: false };
    try {
      const sc = SCENARIOS[scenario];
      send({ kind: "scenario", scenario: sc.id, label: sc.label, brief: sc.brief });
      if (pattern === "supervisor") await runSupervisor(sc.id, send, stats);
      else if (pattern === "parallel") await runParallel(sc.id, send, stats);
      else await runConsensus(sc.id, send, stats);
    } catch (err) {
      send({ kind: "error", message: err instanceof Error ? err.message : "error" });
    } finally {
      send({
        kind: "receipt",
        total_ms: Date.now() - t0,
        llm_calls: stats.llm_calls, llm_ms: stats.llm_ms,
        parallel: stats.parallel, scripted: stats.scripted,
        provider: process.env.DEEPSEEK_API_KEY ? "deepseek" : "none",
        model: getModel(),
      });
      close();
    }
  })();

  return sseResponse(stream);
}

// ── Supervisor / Worker: sequential delegation ─────────────────────────
async function runSupervisor(scenario: ScenarioId, send: Send, stats: Stats) {
  const sc = SCENARIOS[scenario];
  send({ kind: "edge", from: "in", to: "sup" });
  send({ kind: "node_start", id: "sup", role: "supervisor" });
  await tick(280);
  send({ kind: "node_done", id: "sup" });

  for (const sp of sc.specialists) {
    send({ kind: "edge", from: "sup", to: sp.id });
    send({ kind: "node_start", id: sp.id, role: "agent", name: sp.name, emoji: sp.emoji });
    const finding = await callSpecialist(sc.detail, sp, send, stats);
    send({ kind: "finding", id: sp.id, name: sp.name, emoji: sp.emoji, text: finding });
    send({ kind: "node_done", id: sp.id });
    send({ kind: "edge", from: sp.id, to: "sup", back: true });
    await tick(120);
  }

  send({ kind: "edge", from: "sup", to: "out" });
  send({ kind: "node_start", id: "out", role: "merge" });
  const synth = await synthesize(scenario, send, stats);
  send({ kind: "node_done", id: "out" });
  send({ kind: "complete", summary: synth });
}

// ── Parallel specialists: concurrent ───────────────────────────────────
async function runParallel(scenario: ScenarioId, send: Send, stats: Stats) {
  const sc = SCENARIOS[scenario];
  stats.parallel = true;
  send({ kind: "edge", from: "in", to: "fan" });
  send({ kind: "node_start", id: "fan", role: "supervisor" });
  await tick(220);
  send({ kind: "node_done", id: "fan" });

  sc.specialists.forEach((sp) => send({ kind: "edge", from: "fan", to: sp.id }));
  sc.specialists.forEach((sp) => send({ kind: "node_start", id: sp.id, role: "agent", name: sp.name, emoji: sp.emoji }));

  await Promise.all(sc.specialists.map(async (sp) => {
    const finding = await callSpecialist(sc.detail, sp, send, stats);
    send({ kind: "finding", id: sp.id, name: sp.name, emoji: sp.emoji, text: finding });
    send({ kind: "node_done", id: sp.id });
    send({ kind: "edge", from: sp.id, to: "merge" });
  }));

  send({ kind: "node_start", id: "merge", role: "merge" });
  const synth = await synthesize(scenario, send, stats);
  send({ kind: "node_done", id: "merge" });
  send({ kind: "complete", summary: synth });
}

// ── Consensus / Debate: propose → 2 reviewers → synthesize ─────────────
async function runConsensus(scenario: ScenarioId, send: Send, stats: Stats) {
  const sc = SCENARIOS[scenario];
  const proposer = sc.specialists[0];
  const reviewers = sc.specialists.slice(1, 3);

  send({ kind: "edge", from: "in", to: "prop" });
  send({ kind: "node_start", id: "prop", role: "agent", name: "Proposer", emoji: "💡" });
  const proposal = await callRaw(
    `You are the lead analyst. Given this case, propose a single primary conclusion in 2 sentences.\n\nCASE:\n${sc.detail}`,
    `Primary conclusion: ${proposer.canned}`, send, stats, "proposer");
  send({ kind: "finding", id: "prop", name: "Proposer", emoji: "💡", text: proposal });
  send({ kind: "node_done", id: "prop" });

  send({ kind: "edge", from: "prop", to: "r1" });
  send({ kind: "edge", from: "prop", to: "r2" });
  reviewers.forEach((_, i) => send({ kind: "node_start", id: `r${i + 1}`, role: "agent", name: `Reviewer ${i + 1}`, emoji: "🧐" }));

  const reviews = await Promise.all(reviewers.map(async (rv, i) => {
    const text = await callRaw(
      `You are an independent reviewer with a ${rv.name} lens. Critique this proposal — what's missing or risky? 2 sentences.\n\nPROPOSAL:\n${proposal}\n\nCASE:\n${sc.detail}`,
      `From a ${rv.name} angle: ${rv.canned}`, send, stats, `reviewer_${i + 1}`);
    send({ kind: "finding", id: `r${i + 1}`, name: `Reviewer ${i + 1} · ${rv.name}`, emoji: "🧐", text });
    send({ kind: "node_done", id: `r${i + 1}` });
    send({ kind: "edge", from: `r${i + 1}`, to: "syn" });
    return text;
  }));

  send({ kind: "node_start", id: "syn", role: "merge" });
  const synth = await callRaw(
    `You are the consensus synthesizer. Combine the proposal and reviews into one final, defensible conclusion in 2-3 sentences.\n\nPROPOSAL:\n${proposal}\n\nREVIEWS:\n${reviews.join("\n")}`,
    `Consensus: ${proposer.canned} Reviewers add: ${reviewers.map((r) => r.canned).join(" ")}`, send, stats, "consensus");
  send({ kind: "node_done", id: "syn" });
  send({ kind: "edge", from: "syn", to: "human", dashed: true });
  send({ kind: "node_start", id: "human", role: "human" });
  await tick(900);
  send({ kind: "node_done", id: "human" });
  send({ kind: "complete", summary: synth });
}

// ── helpers ────────────────────────────────────────────────────────────
async function callSpecialist(caseText: string, sp: Specialist, send: Send, stats: Stats): Promise<string> {
  return callRaw(`${sp.lens}\n\nCASE:\n${caseText}`, sp.canned, send, stats, sp.id);
}

async function synthesize(scenario: ScenarioId, send: Send, stats: Stats): Promise<string> {
  const sc = SCENARIOS[scenario];
  const fallback = scenario === "incident"
    ? "Root cause: deploy v2.14.0 cut the gateway timeout + pool size, saturating connections under APAC peak — matching INC-2231. Recommend immediate config rollback."
    : "Top risks: missing idempotency (double-pay), secrets in config + unencrypted PII, aggressive 10-week timeline vs bank-sandbox certification, and unaddressed RBI localization. Not ready — address blockers first.";
  return callRaw(
    `You are the synthesizer. In 2-3 sentences, combine the specialist findings into one clear conclusion for: ${sc.label}.\n\nCASE:\n${sc.detail}`,
    fallback, send, stats, "synthesis");
}

async function callRaw(prompt: string, fallback: string, send: Send, stats: Stats, purpose: string): Promise<string> {
  const client = getClient();
  const model = getModel();
  const t0 = Date.now();
  if (!client) {
    await tick(500 + Math.random() * 400);
    stats.llm_calls += 1; stats.llm_ms += Date.now() - t0;
    send({ kind: "llm_call", purpose, model: "(scripted)", ms: Date.now() - t0, scripted: true });
    return fallback;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resp = await (client.chat.completions.create as any)({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 220,
    });
    const ms = Date.now() - t0;
    const usage = resp.usage || {};
    stats.llm_calls += 1; stats.llm_ms += ms;
    send({ kind: "llm_call", purpose, model, ms, total_tokens: usage.total_tokens, scripted: false });
    return resp.choices[0].message.content?.trim() || fallback;
  } catch {
    const ms = Date.now() - t0;
    stats.llm_calls += 1; stats.llm_ms += ms;
    send({ kind: "llm_call", purpose, model: "(scripted · error)", ms, scripted: true });
    return fallback;
  }
}

function tick(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
