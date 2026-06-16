// Two anchor scenarios + the specialist agents that act on them.

export type ScenarioId = "incident" | "delivery";
export type RunPattern = "supervisor" | "parallel" | "consensus";

export type Scenario = {
  id: ScenarioId;
  label: string;
  emoji: string;
  brief: string;
  detail: string;
  specialists: Specialist[];
};

export type Specialist = {
  id: string;
  name: string;
  emoji: string;
  // system prompt fragment defining the lens
  lens: string;
  // canned finding when no LLM
  canned: string;
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  incident: {
    id: "incident",
    label: "Production Incident Command",
    emoji: "🚨",
    brief: "Payment failures up 18% · APAC · Checkout API · Sev-High",
    detail: `Production alert: payment failures increased by 18% in the APAC region on the Checkout API. Severity: High. A deploy went out 40 minutes ago. The team needs to understand what's happening fast.`,
    specialists: [
      { id: "logs", name: "Logs Investigator", emoji: "🔍",
        lens: "You investigate logs. Identify the top error signature and when it first appeared. Be concrete, 2 sentences.",
        canned: "Spike in `UpstreamTimeoutError` from the payments-gateway client starting 38 min ago — aligns with the recent deploy. ~3% of checkout calls now time out at 5s." },
      { id: "metrics", name: "Metrics Investigator", emoji: "📈",
        lens: "You investigate metrics: saturation, latency, SLO burn. Be concrete, 2 sentences.",
        canned: "p99 latency on Checkout API jumped from 800ms to 5.2s; gateway connection pool is saturated at 100%. SLO error budget burning at 6x — will exhaust in ~4 hours." },
      { id: "change", name: "Change Analysis", emoji: "🔧",
        lens: "You correlate the incident with recent deploys/config changes. Be concrete, 2 sentences.",
        canned: "Deploy `checkout-api@v2.14.0` shipped 40 min ago changed the gateway HTTP client timeout from 10s to 5s and reduced pool size. Strong correlation with incident start." },
      { id: "past", name: "Past-Incident Search", emoji: "📚",
        lens: "You find similar past incidents and resolutions. Be concrete, 2 sentences.",
        canned: "INC-2231 (March) was nearly identical: a pool-size reduction caused gateway saturation under APAC peak load. Resolved by rolling back the config and restoring pool size." },
    ],
  },
  delivery: {
    id: "delivery",
    label: "Solution Delivery Risk Review",
    emoji: "📋",
    brief: "New payments-platform design submitted for go/no-go review",
    detail: `A project team submitted a delivery plan for a new real-time payments reconciliation platform. Target launch in 10 weeks. Uses a new event-streaming backbone, integrates with 3 external bank APIs, and must meet RBI compliance. Review it for risk.`,
    specialists: [
      { id: "arch", name: "Architecture Risk", emoji: "🏛️",
        lens: "You review architecture soundness and design risk. Be concrete, 2 sentences.",
        canned: "The event-streaming backbone has no defined replay/idempotency strategy — duplicate settlement events could double-pay. Recommend an idempotency key + dedup store before launch." },
      { id: "security", name: "Security Review", emoji: "🔒",
        lens: "You review security exposure and controls. Be concrete, 2 sentences.",
        canned: "Bank API credentials are planned in app config, not a vault. PII reconciliation data lacks field-level encryption. Both are launch-blockers for a payments system." },
      { id: "delivery", name: "Delivery Feasibility", emoji: "📆",
        lens: "You review timeline, dependencies, resourcing feasibility. Be concrete, 2 sentences.",
        canned: "10 weeks is aggressive given 3 external bank integrations, each needing sandbox certification (typically 3-4 weeks each, partly parallelizable). High risk of a 3-4 week slip." },
      { id: "compliance", name: "Compliance Review", emoji: "⚖️",
        lens: "You review policy/regulatory gaps. Be concrete, 2 sentences.",
        canned: "No mention of RBI data-localization for transaction data or an audit-trail retention plan. Compliance sign-off will block launch without both — engage the compliance team now." },
    ],
  },
};
