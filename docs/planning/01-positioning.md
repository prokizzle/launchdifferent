# Positioning — Agile Brain (working title: **LaunchDifferent**)

**Status:** Strategic framing. Read after `00-wedge-ladder.md`.
**Last updated:** 2026-05-16

## Working product name

`LaunchDifferent` — a play on Apple's "Think Different" for the AI age where thinking differently is no longer enough. With AI, creative ideas are cheap; the edge moves to *launching* differently — shipping fast, pivoting on signal, and reaching differentiated profit before the clone wave arrives. Internal codename "Agile Brain" stays in repo paths for now; product-facing surfaces use LaunchDifferent.

## The thesis

> **Can a solo developer still make money with AI?**

The honest answer in May 2026 is: not reliably. AI providers profit. Barriers to entry collapsed. Ideas are copied in days. By the time you launch, your idea may already be shipped by someone you never saw coming. Building once and hoping isn't a strategy.

LaunchDifferent's bet: solo devs can still win — *if* they have a competitive radar that keeps them one pivot ahead before launch. Everything in Wedge B exists in service of that radar: jj for cheap rewinds, flock for resource serialization, checkpoints for quality, PM-in-background for vision-to-execution, and auto-pivot as the headline capability that uses all of the above to keep the dev competitive.

The product is not "AI PM tooling." The product is "the difference between launching profitable and launching commoditized."

## Category: Product Differentiator

LaunchDifferent is the first **Product Differentiator** — a new category. Not a project planner. Not an AI PM. Not a coding agent. A Product Differentiator's job is to make sure the product you ship is still *distinctively yours* when it hits the market.

In the AI age, the constraint that used to define an indie product (time-to-build) no longer exists. Anyone can build anything in days. What hasn't been automated yet is *staying competitive* through the build. Product Differentiator products close that gap. They sense the market continuously, adjust the product's positioning and features while it's still being built, and keep the launch viable. PM and planning capabilities are part of how this gets done — not the value proposition itself.

## One-liner at each wedge

| Wedge | Primary positioning |
|---|---|
| **A — Observer** | "The fastest way to give your coding agent real-time dev-server errors." |
| **B — LaunchDifferent** | "The first Product Differentiator. Sense the market continuously, pivot before launch, stay distinctively yours." |
| **C — Team Cloud** | "Product Differentiator for AI-native product teams." |

## Wedge B positioning, in detail

### Headline
**LaunchDifferent — sense the market, stay distinctive, launch profitable.**

### Sub-headline
A Product Differentiator for solo developers building with AI. Continuous competitive radar, automated pivots while you build, and an AI PM running the execution lifecycle in the background — so your product is still uniquely yours on launch day.

### Three-sentence pitch
With AI, anyone can build anything in days, so the moat moved from speed to differentiation — and most solo devs find out their idea was cloned only after they launched. LaunchDifferent is a local daemon that scans the market continuously, scores your vision's viability against what's shipping right now, and proposes (or autonomously executes) pivots before your launch becomes commoditized; in the background it also runs your PM, dispatches your coding agents, and keeps the codebase pivot-ready. You ship a product that's still distinctively yours, or you don't ship — the system pushes your launch date until viability clears the bar.

### What it isn't (anti-positioning)
- Not a Linear/Jira replacement. The daemon can talk to Linear, but doesn't require it; vision lives in `VISION.md` or chat.
- Not a hosted PM SaaS. The daemon is on your machine. Cloud sync is a convenience, not a requirement, because there are no build collisions across machines.
- Not a coding agent. It coordinates agents you're already using.
- Not a CTO. You make the vision and product calls. The daemon handles execution.
- Not an enterprise platform. Single-operator, opt-in checkpoint gates. Teams come later.

## Competitive axis: who else is in the space (May 2026)

| Competitor | What they own | What they don't |
|---|---|---|
| **Linear AI** | Issue triage, summarization, AI roadmap inside Linear | Local agent coordination, cross-tool event log |
| **Jira AI / Atlassian Intelligence** | Same as Linear AI, for Jira | Same gap |
| **GitHub Copilot CLI agent** (May 13 2026) | Single Copilot agent in terminal + JetBrains sessions view + global `.agent.md` | Multi-agent coordination across Claude/Cursor/Devin, project-management ingestion |
| **Devin for Terminal / Devin for Teams** | High-autonomy single-agent + parallel cloud agents | Open ecosystem; you're locked into Cognition's agent |
| **Anthropic Skills / Code Workspaces** | Reusable Claude skills + stable workspace context | Cross-agent (non-Claude) coordination, resource scheduling |
| **Zapier Workspace Agents** | Cross-SaaS orchestration with admin controls | Local-first, dev-machine concerns (builds, simulators, worktrees) |
| **Enterprise orchestration** (MS Foundry, Google Agentspace, AWS Bedrock Agents, Salesforce Agentforce) | Enterprise multi-agent platforms | Solo dev / small-team prosumer |
| **LangGraph / CrewAI / OpenAI Agents SDK** | Frameworks to build orchestrators | The orchestrator itself, with PM integration and dev-machine resources |
| **Intent (spec-driven multi-agent w/ worktrees)** | Per-agent worktree isolation, spec-as-substrate | Linear pull, resource scheduling, MCP-first |

**Closest competitor:** Intent (worktree-based per-agent workspaces). Different axis: Intent is spec-first/workspace-first; Agile Brain is daemon-first/resource-first/Linear-pull-first.
**Adjacent threat:** GitHub Copilot CLI agent if Microsoft adds multi-agent session coordination — watch this surface.

## Architecture shape

LaunchDifferent is a **SaaS product with a local harness** — the same shape as Tailscale, Sentry, Datadog, or Vercel CLI:

- **SaaS (the product):** signal feeds, viability scoring, pivot synthesis, vision intelligence, policy/guardrails control plane, dashboard, billing, audit log. Iterated daily by us, no user updates required. This is where the *intelligence* lives.
- **Local harness (open-source, free):** MCP server installed on the dev's machine. Registers their coding agents. Performs all dev-machine operations — jj, flock, builds, file edits, the local event log. Talks to the SaaS over an API key. Open source for trust and auditability; useless without the SaaS subscription.
- **Guardrails:** layered. The harness enforces what agents can do locally (command, file, and network allowlists, sandboxing). The SaaS enforces policy (per-magnitude autonomy, trust scoring, what gets auto-executed vs proposed).

Agents talk to the harness via MCP. The harness talks to the SaaS over HTTPS. The dev never touches the SaaS-harness boundary directly.

## Differentiated axes

Four axes where LaunchDifferent is differentiated by design, not by feature parity:

1. **Product Differentiator category, not a productivity tool.** The job is to keep your product distinctive enough to launch profitable. PM/planning capabilities exist *in service of* differentiation. No incumbent positions here.
2. **Agent-agnostic via MCP.** Claude Code, Cursor, Devin, Copilot CLI agent, custom — anything that speaks MCP registers with the harness. Competitors lock you to their agent.
3. **Continuous market sensing + cheap pivots.** Signal feeds + viability scoring + capability-based code + jj OP-log reversibility = pivoting is fast enough to actually do, not theoretical. Other tools tell you the market is shifting; this one steers the product.
4. **Viability gates launch, not the calendar.** The system pushes your launch date out when you're under-differentiated, instead of recommending you ship commoditized. Other tools optimize for shipping; this one optimizes for *shipping profitable*.

## Reframes from concept.md

`concept.md` positions this as ceremonies-as-jobs, sprints-as-windows, agents-as-workforce. That language is good for the Wedge C narrative but wrong for Wedge B because (a) AI-native teams in 2026 have moved off fixed sprints to continuous planning, and (b) the solo dev doesn't have ceremonies in the first place — they have a one-person company and no time. The reframe:

- "Ceremonies as background jobs" → "There are no ceremonies. The daemon runs the PM loop in the background; you read the digest."
- "Sprints as execution windows" → "Checkpoints replace sprints. They fire on signal (change-volume, test failure, complexity-delta), not on the clock."
- "Agents as the workforce" → "You're the CEO. Agents are the team. The daemon is the operations manager."
- "Backlog grooming" → "Vision decomposition. You write what you want; the daemon makes it agent-ready."
- "Branches and PRs" → "jj change-IDs and checkpoint gates. There is no PR queue because there is no team to review for."

## What's the *single* sentence to use this week?

For DMs, intros, and demo openings:

> "I'm building the AI PM for solo developers running multiple coding agents — vision in, daily CEO digest out, with checkpoint gates that keep tests at 100% and the codebase orthogonal. So you can stay the CEO and stop being the PM."

If the listener leans in, follow with Wedge C. If they don't, you've still described something useful.

## Related docs

- `00-wedge-ladder.md` — wedge ordering
- `02-icp-and-buyer.md` — who this lands with
- `03-competitive-landscape.md` — full landscape map
