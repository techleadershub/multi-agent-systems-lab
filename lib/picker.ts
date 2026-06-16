import { PATTERNS, type PatternId } from "./tokens";
import { PATTERN_META } from "./patternMeta";

export type Answers = {
  expertise: "one" | "few" | "many";       // distinct expertise needed
  independence: "sequential" | "independent";
  stakes: "low" | "high";
  domains: "one" | "several";
  human: "no" | "yes";
  control: "open" | "tight";               // should one coordinator control sequence?
};

export const QUESTIONS = [
  { id: "expertise" as const, label: "How many distinct kinds of expertise does the work need?", hint: "Different lenses = specialists.",
    options: [
      { value: "one", label: "Basically one", emoji: "1️⃣" },
      { value: "few", label: "A few specialists", emoji: "👥" },
      { value: "many", label: "Many, across domains", emoji: "🏢" },
    ] },
  { id: "independence" as const, label: "Can the sub-tasks run independently?", hint: "Independent work can be parallelized.",
    options: [
      { value: "sequential", label: "No — each needs the previous", emoji: "➡️" },
      { value: "independent", label: "Yes — they don't depend on each other", emoji: "⚡" },
    ] },
  { id: "stakes" as const, label: "How expensive is a wrong answer?", hint: "High stakes justify review/debate.",
    options: [
      { value: "low", label: "Low — easy to recover", emoji: "🪶" },
      { value: "high", label: "High — costly or irreversible", emoji: "🔥" },
    ] },
  { id: "domains" as const, label: "How many review groups / domains?", hint: "Multiple domains suggest hierarchy.",
    options: [
      { value: "one", label: "One group handles it", emoji: "🟢" },
      { value: "several", label: "Several distinct groups", emoji: "🗂️" },
    ] },
  { id: "control" as const, label: "Should one coordinator control the sequence?", hint: "Tight control favors a supervisor.",
    options: [
      { value: "open", label: "Open-ended is fine", emoji: "🌀" },
      { value: "tight", label: "Yes — controlled sequence", emoji: "🎛️" },
    ] },
  { id: "human" as const, label: "Is human approval required before acting?", hint: "Risky actions need a human gate.",
    options: [
      { value: "no", label: "No", emoji: "🤖" },
      { value: "yes", label: "Yes — sign-off needed", emoji: "🧑‍⚖️" },
    ] },
];

export type Reco = { id: PatternId; score: number; reasons: string[]; warnings: string[] };

export function rank(a: Answers): Reco[] {
  const recos: Reco[] = PATTERNS.map((p) => ({ id: p.id, score: 0, reasons: [], warnings: [] }));
  const get = (id: PatternId) => recos.find((r) => r.id === id)!;

  // Single: only wins when expertise is one and stakes low
  if (a.expertise === "one") { get("single").score += 24; get("single").reasons.push("only one kind of expertise needed"); }
  else { get("single").score -= 20; get("single").warnings.push("multiple specialists needed — one agent will overload"); }
  if (a.stakes === "low") get("single").score += 8;
  if (a.stakes === "high") { get("single").score -= 10; get("single").warnings.push("no review step for a high-stakes answer"); }

  // Supervisor: few specialists + tight control
  if (a.expertise === "few") { get("supervisor").score += 16; get("supervisor").reasons.push("a few specialists to coordinate"); }
  if (a.control === "tight") { get("supervisor").score += 14; get("supervisor").reasons.push("one coordinator controls the sequence"); get("supervisor-tools").score += 12; get("supervisor-tools").reasons.push("coordinator stays in control"); }
  if (a.independence === "sequential") { get("supervisor").score += 8; }

  // Supervisor-as-tools: tight control + narrow specialists + open-ended-ish
  if (a.expertise === "few") get("supervisor-tools").score += 10;
  if (a.control === "tight" && a.stakes === "low") { get("supervisor-tools").score += 8; get("supervisor-tools").reasons.push("simple to implement, limited tool access"); }

  // Parallel: independent + few/many specialists
  if (a.independence === "independent") { get("parallel").score += 24; get("parallel").reasons.push("sub-tasks are independent — run them at once"); }
  else { get("parallel").score -= 12; get("parallel").warnings.push("tasks are sequential — parallelism won't help"); }
  if (a.expertise !== "one") get("parallel").score += 10;
  if (a.expertise === "many") get("parallel").score += 4;

  // Hierarchical: many domains / several groups
  if (a.domains === "several") { get("hierarchical").score += 24; get("hierarchical").reasons.push("several distinct review groups → nested supervisors"); }
  else { get("hierarchical").score -= 14; get("hierarchical").warnings.push("only one group — hierarchy is overkill"); }
  if (a.expertise === "many") { get("hierarchical").score += 12; get("hierarchical").reasons.push("expertise spans domains"); }

  // Consensus: high stakes
  if (a.stakes === "high") { get("consensus").score += 24; get("consensus").reasons.push("high stakes — independent critique catches errors"); }
  else { get("consensus").score -= 14; get("consensus").warnings.push("low stakes — debate adds cost without much benefit"); }
  if (a.expertise !== "one") get("consensus").score += 6;

  // Hybrid: many + high + several + human
  let hybridSignals = 0;
  if (a.expertise === "many") hybridSignals++;
  if (a.stakes === "high") hybridSignals++;
  if (a.domains === "several") hybridSignals++;
  if (a.human === "yes") hybridSignals++;
  if (a.independence === "independent") hybridSignals++;
  get("hybrid").score += hybridSignals * 9;
  if (hybridSignals >= 4) get("hybrid").reasons.push("many signals (scale, stakes, domains, human gate) — a production hybrid fits");
  if (hybridSignals <= 1) { get("hybrid").score -= 16; get("hybrid").warnings.push("too simple to justify a hybrid's moving parts"); }

  // Human gate: nudges consensus & hybrid up, single down
  if (a.human === "yes") {
    get("consensus").score += 8; get("consensus").reasons.push("has a built-in human gate");
    get("hybrid").score += 6;
    get("single").score -= 6; get("single").warnings.push("no natural place for a human gate");
  }

  return recos.sort((x, y) => y.score - x.score);
}

export function patternName(id: PatternId) { return PATTERNS.find((p) => p.id === id)!.name; }
export function patternAccent(id: PatternId) { return PATTERNS.find((p) => p.id === id)!.accent; }
export function patternTradeoff(id: PatternId) { return PATTERN_META[id].tradeoff; }
