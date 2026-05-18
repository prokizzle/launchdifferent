# Wedge Ladder — Agile Brain

**Status:** Anchor doc. Read first.
**Last updated:** 2026-05-16
**Owner:** Nick

## Why this doc exists

`concept.md` pitches a cloud-SaaS team product ("Agentic Agile OS"). The existing design doc (`docs/plans/2026-03-07-agile-brain-design.md`) describes a local-first single-developer daemon. The Phase 0 plan ships an even narrower thing: a Next.js dev-server observer MCP.

Three different products sit under the same name. This doc names them, orders them, and states what must be true to advance.

## The three wedges

### Wedge A — Dev Server Observer / Phase Zero of Bootstrap (now)

**What it is:** A `@launchdifferent/observer` package that captures Next.js errors and logs into SQLite, plus a separate MCP server process that exposes query tools (`get_recent_errors`, `search_logs`, etc.). Two processes, shared via a SQLite file.

**Who it's for:** Initially: Nick himself, on his own projects. The audience is "Nick using Claude Code / Cursor against a Next.js app and wanting agents to see real-time dev-server errors without copy-pasting." External users come after Wedge B starts shipping.

**Role in the bootstrap (per D017 / B12 / `11-bootstrap.md`):** This is **Phase Zero** — the only fully hand-built phase. Every subsequent phase must be built using prior phases (the self-build commitment). Wedge A's job is twofold: (a) ship something real and useful to validate the SQLite + MCP substrate, and (b) be the first capability the next phase uses on its own build.

**Time to value:** Minutes (`npx` install + register MCP).
**Defensibility:** None on its own — Wedge A's role is to be a foundation, not a moat. The defensibility comes from what's built on top of it, and from the self-build provenance that begins with Phase 1.
**Status:** Plan exists at `docs/plans/2026-03-07-phase0-dev-server-observer.md`; issues in Linear are LAUNCH-1 through LAUNCH-5. Build now.

### Wedge B — AI PM for the Company of One (next)

**What it is:** A local daemon that acts as the PM, release manager, and quality-gate enforcer for a solo developer running multiple coding agents. The dev is the CEO and sets vision; the daemon owns the SDLC lifecycle. Architecture (see `09-architecture-bets.md` for the full case):

- **VCS layer:** jj colocated with git. The daemon and the human use jj's power (anonymous change-IDs, first-class conflicts, OP-log undo); agents continue to speak git. No branches, no PRs in the operational workflow.
- **Resource layer:** OS-level `flock`/`fcntl` advisory locks per declared build/process resource (`xcodebuild`, `simulator`, ports). No custom scheduler; a thin shim plus a priority counter.
- **Execution layer:** MCP-registered agent slots. Agents commit straight into the jj DAG via the git surface. Change-IDs are isolated automatically; concurrent edits produce first-class jj conflicts that the next checkpoint resolves.
- **Quality layer:** Periodic agentic checkpoints triggered by multi-signal — change-volume OR test failure OR complexity-delta. At each checkpoint, all agents pause and a debt-squash protocol runs: coverage back to 100%, benchmarks within target, anti-AI antipatterns at zero, complexity under threshold, refactors applied. Then work resumes.
- **Vision layer:** `VISION.md` plus chat ingestion. The daemon decomposes vision into backlog items with acceptance criteria, dispatches to agents, and produces a daily CEO digest: shipped X, blocked on Y, need your call on Z.
- **State layer:** SQLite event log composed with the jj OP-log into one timeline.
- **Cloud:** secondary. There are no build collisions across machines, so cross-device sync is convenience, not a requirement.

**Who it's for:** A solo developer running multiple coding agents (Claude Code, Cursor, Devin, custom) who is also the CEO of a one-person company. The buyer = the operator. Pricing = prosumer / open-core with paid cloud digest.

**Time to value:** A few hours of setup. Worth it because the daemon removes the entire PM overhead from the solo dev's day, while keeping quality bounded.
**Defensibility:** Real. Event log + policy learning + jj OP-log + integration depth = a workflow-data moat that grows with usage. No incumbent owns "AI PM for company of one" positioning in May 2026.
**Status:** Designed and reshaped 2026-05-16. Not built. Bridge from Wedge A is incremental — Phase 0's SQLite + MCP server is the substrate.

### Wedge C — Team Agile Control Plane (later)

**What it is:** The cloud SaaS in `concept.md`. Linear/GitHub/Slack/Notion ingestion, weekly planning briefs, daily reconciliation, blocker detection, approval workflow, audit log, hosted dashboard for the PM-facing view, design partners, billing.

**Who it's for:** AI-native engineering teams of 5–50 people. Buyer = founder/CTO/eng manager. Pricing = per-seat SaaS.

**Time to value:** Pilot is a one-week setup; weekly briefs from day 1.
**Defensibility:** Workflow data + team-specific policy learning + integration depth + outcome history. Strong moat *if* it gets used long enough.
**Status:** Aspirational. Should not be built until Wedge B has proven the coordination model and produced policy-learning data.

## The order is deliberate

```
A (Observer) ──▶ B (Local Daemon) ──▶ C (Team Cloud)
```

Building C first ignores the 2026 reality: Linear AI, Jira AI, GitHub Copilot CLI agent (May 13 2026 release), Devin for Teams, Anthropic Skills, and Zapier Workspace Agents are all targeting that surface. A solo entrant cannot win the team-PM AI category head-on. Building C first also requires team design partners before there's a product worth piloting.

Building B first matches the actually-underserved category: a solo developer running multiple coding agents who has no PM, no team, and is also the CEO. Coding agents are "solved enough" per 2026 reporting; orchestration and cross-domain reasoning are the open frontier. No incumbent is positioned as "AI PM for solo devs / company of one" — that category space is open. Devin for Terminal is closed and Devin-only; Copilot CLI agent is one-agent oriented; orchestration frameworks need glue. The AI-PM-for-company-of-one wedge is the one with the least competitive pressure and the most acute pain.

Building A first proves the technical substrate (SQLite + MCP) and ships *something* that real developers use this month.

## Bridge conditions

**A → B advance when:**
- Phase 0 observer is installed in at least one personal project and produces useful query results from Claude Code
- The SQLite schema generalizes from "errors + requests" to "events" without a rewrite
- You feel acute pain from agents stepping on each other locally (xcodebuild conflicts, port conflicts, branch confusion)

**B → C advance when:**
- The local daemon has run autonomously on your own work for ≥ 4 weeks without breaking the trust loop
- The event log contains enough decisions/approvals/overrides to make policy learning meaningful (likely 500+ decision events)
- At least 3 other developers are using the local daemon and ask "can my whole team use this?"
- The Linear writeback is opt-in and proven safe in your own use

Each bridge condition is concrete and falsifiable. If they don't show up, the next wedge isn't earned yet — refine the current one instead.

## What gets reframed

Going from `concept.md` (Wedge C language) to Wedge B language:

| concept.md primitive | Wedge B reframe |
|---|---|
| Weekly sprint planning brief | Daily CEO digest from VISION.md + agent activity |
| Daily standup summary | Event log + jj OP-log composed view |
| Backlog grooming | Vision decomposed into agent-ready tasks with acceptance criteria |
| Approval workflow | Checkpoint quality gates + autonomy per change-class |
| Design partner pilots | Solo-dev dogfood + small Discord of company-of-one operators |
| Sprint cadence | Checkpoint cadence — event-triggered, not time-based |
| Branches + PRs | jj change-IDs + checkpoint debt-squash gates |
| Resource scheduler with queues/timeouts | `flock`/`fcntl` per declared resource + priority counter |
| YC narrative | Same narrative, told *after* B is real |

`concept.md` is still the fundraising story. It just isn't the build order, and the operational primitives have changed.

## Related docs

- `01-positioning.md` — positioning at each wedge
- `02-icp-and-buyer.md` — who buys at each wedge
- `06-decision-log.md` — record of why this ladder, not the concept.md plan; D017 records the self-build commitment
- `09-architecture-bets.md` — the architecture bets behind the Wedge B architecture (B1–B12; B12 is the self-build practice bet)
- `11-bootstrap.md` — the phase-by-phase self-build sequence. Wedge A is Phase Zero.
