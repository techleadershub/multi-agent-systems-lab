import type { PatternId } from "./tokens";

export type PatternMeta = {
  whenToUse: string;
  tradeoff: string;
  primitive: string;
  langgraph: string;
  useFor: string[];
};

export const PATTERN_META: Record<PatternId, PatternMeta> = {
  single: {
    whenToUse: "The problem is small, tool use is open-ended, and no specialist review is needed.",
    tradeoff: "Simple and cheap — but one brain owns everything. Overloads on complex, multi-dimensional work.",
    primitive: "One agent node (or prebuilt ReAct agent) + a tool loop.",
    langgraph: `agent = create_react_agent(model, tools)
# loops: agent -> tools -> agent -> END`,
    useFor: ["Small tasks", "Open-ended tool use", "Prototypes"],
  },
  supervisor: {
    whenToUse: "Work splits across specialists and a coordinator should decide who runs and when it's done.",
    tradeoff: "Clear delegation — but the supervisor can become a bottleneck and a single point of failure.",
    primitive: "A router node + worker nodes + conditional edges + a synthesis node.",
    langgraph: `g.add_node("supervisor", route)
g.add_conditional_edges("supervisor", pick_worker,
  {"a": "worker_a", "b": "worker_b", "done": "synth"})
g.add_edge("worker_a", "supervisor")  # return`,
    useFor: ["Task routing", "Support escalation", "Review workflows"],
  },
  "supervisor-tools": {
    whenToUse: "One coordinator should stay in control and call specialists like functions, in sequence.",
    tradeoff: "Simple to implement and tool access stays limited — but less transparent than explicit branches unless you log well.",
    primitive: "Each sub-agent wrapped as a tool the supervisor calls.",
    langgraph: `@tool
def logs_investigator(q: str) -> str:
    return logs_subagent.invoke(q)

supervisor = create_react_agent(
  model, tools=[logs_investigator, metrics_investigator])`,
    useFor: ["Supervisor controls sequence", "Narrow specialist jobs", "Limited tool access"],
  },
  parallel: {
    whenToUse: "The same input needs multiple independent expert lenses that can run at the same time.",
    tradeoff: "Big speed-up and broad coverage — but you need a strong merge + conflict-resolution step.",
    primitive: "Fan out from one node into branches; each updates part of state; a merge node combines.",
    langgraph: `g.add_edge("fanout", "security")
g.add_edge("fanout", "performance")
g.add_edge("fanout", "cost")
# all run concurrently, then:
g.add_edge("security", "merge")  # etc.`,
    useFor: ["Architecture review", "Delivery risk review", "Incident investigation"],
  },
  hierarchical: {
    whenToUse: "One supervisor isn't enough — the work has multiple domains, each with its own review group.",
    tradeoff: "Mirrors real enterprise structure — but more hierarchy means more orchestration and more latency.",
    primitive: "Top graph manages domains; each domain is a subgraph with its own sub-supervisor.",
    langgraph: `tech_team = StateGraph(...)   # subgraph
deliv_team = StateGraph(...)  # subgraph
g.add_node("technical", tech_team.compile())
g.add_node("delivery", deliv_team.compile())
g.add_conditional_edges("exec", route_domain, {...})`,
    useFor: ["Enterprise proposal response", "Cloud migration assessment", "Large program review"],
  },
  consensus: {
    whenToUse: "Mistakes are expensive. You want independent critique before committing to an answer.",
    tradeoff: "Higher quality and caught errors — but more tokens, more latency, and risk of endless debate.",
    primitive: "Proposer node → reviewer nodes → consensus/synthesis node → optional human gate.",
    langgraph: `g.add_edge("proposer", "reviewer_1")
g.add_edge("proposer", "reviewer_2")
g.add_edge("reviewer_1", "consensus")
g.add_edge("reviewer_2", "consensus")
g.add_conditional_edges("consensus", needs_human, {...})`,
    useFor: ["Architecture approval", "Compliance response", "RCA conclusion"],
  },
  hybrid: {
    whenToUse: "Real production. Routing + specialists + parallel review + consensus + human gate + system update.",
    tradeoff: "Most capable architecture — and the most moving parts. Earn each piece; don't add for show.",
    primitive: "Supervisor + tools + parallel branches + consensus + human gate + system nodes + checkpointer.",
    langgraph: `# supervisor routes -> specialist tools
# -> parallel review branches -> consensus
# -> human interrupt -> system update
app = g.compile(checkpointer=PostgresSaver(...))`,
    useFor: ["Enterprise delivery governance", "Incident command at scale", "Regulated workflows"],
  },
};
