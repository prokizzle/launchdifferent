# ICP and Buyer — Agile Brain

**Status:** Strategic framing. Read after `00-wedge-ladder.md`.
**Last updated:** 2026-05-16

`concept.md` describes an ICP for the team-SaaS product (Wedge C). This doc layers in the ICP for Wedge B (single-developer daemon), which is the wedge being built first, and disqualifies the wrong-shaped users at each layer.

## ICP at each wedge

### Wedge A — Observer

| Field | Value |
|---|---|
| **Who** | Solo developer building a Next.js app with Claude Code or Cursor in their daily loop |
| **Signal** | Has copy-pasted a dev-server stack trace into the agent at least once this week |
| **Disqualifier** | Not using a coding agent; not building a Next.js app |
| **Buyer = User** | Yes |
| **Pricing motion** | Free / OSS / npm install |

### Wedge B — AI PM for Company of One (primary near-term ICP)

| Field | Value |
|---|---|
| **Who** | Solo developer running a one-person product / company, using multiple coding agents on one machine. The dev *is* the team — eng, PM, release, QA — and wants to stop being three of those. |
| **Profile** | Indie SaaS founder ($5k–$50k MRR is the sweet spot; the apex $1M+ ARR solo founders are the aspirational halo, ~hundreds globally), AI-native solo founder, fractional CTO running 2–5 client codebases, OSS maintainer with agent help, dev-tools tinkerer |
| **Signal** | At least one of: (a) writes a `VISION.md` or `AGENTS.md` and wishes someone would just decompose it; (b) has hit a `xcodebuild` / port / branch collision with two agents in the last 30 days; (c) has lost context between agent sessions and rebuilt it manually; (d) does PM work in their head and can't keep up; (e) already curious about jj |
| **Stack** | macOS or Linux; Claude Code / Cursor / Devin / Copilot CLI — any combination of two or more; willing to adopt jj (colocated with git) as their operational VCS |
| **Tools already in use** | tmux, MCP servers, `.claude/` or `.cursorrules` configs, possibly Linear (but it's optional), `VISION.md` or `AGENTS.md`-style docs at repo root |
| **Disqualifier** | Running only one agent at a time; refuses to try jj (even colocated); lives entirely in a hosted IDE without local builds; requires team / SSO features |
| **Buyer = User** | Yes (prosumer / company-of-one) |
| **Pricing motion** | **SaaS with included open-source harness.** Free tier = harness + constrained-SaaS (basic competitive scan, no auto-pivot autonomy, single project). Pro tier $25–$40/mo = full auto-pivot Suggest mode + multi-project + extended signal feeds. CEO tier $60–$80/mo = autonomous-magnitude execution + extended event log retention + cross-device sync. Aimed at the median $5k–$50k MRR solo founder, not the $1M+ apex. Shape is Tailscale/Sentry/Datadog: cloud control plane + open-source local agent. |

### Wedge C — Team Cloud (long-term ICP, from concept.md)

| Field | Value |
|---|---|
| **Who** | AI-native startup, 5–50 engineers, already using coding agents in production |
| **Profile** | Founder/CTO/eng manager who is the bottleneck for sprint planning, backlog grooming, and agent dispatch |
| **Signal** | Engineers ship faster than planning can keep up; backlog drift; standups are status theatre |
| **Stack** | Linear or Jira; GitHub; Slack; Notion or Google Docs; Cursor or Claude Code as default agent |
| **Disqualifier** | Heavy compliance/procurement; non-technical PM team; team not yet adopting agents; needs full scrum replacement on day one |
| **Buyer** | Founder, CTO, or eng manager |
| **First user** | Tech lead doing manual planning, grooming, status |
| **Pricing motion** | Per-seat SaaS, $30–$80/seat/mo |

## Buyer personas (Wedge B emphasis)

### Persona 1 — "The Indie Operator"
- Builds 2–4 projects in parallel
- Pays for Claude Pro + Cursor + occasional Devin credits
- Uses Linear personally (free tier) for organizing across projects
- Daily friction: agent sessions losing context, builds colliding, can't tell what each agent did yesterday
- **Will pay for:** anything that lets them confidently leave 3 agents running while doing dishes

### Persona 2 — "The Fractional CTO"
- Works across 2–5 client codebases per week
- Each client has different Linear workspace, different stack, different agents
- Daily friction: context-switching cost, no shared memory across clients, repeated explanations to agents
- **Will pay for:** project-scoped memory + automatic Linear context per workspace

### Persona 3 — "The Tooling-Heavy Solo Dev"
- Writes their own MCP servers, hooks, scripts
- Already using git worktrees, tmux panes, `.claude/skills/`
- Daily friction: maintaining their own glue scripts; loses context between worktrees
- **Will pay for:** open-source daemon they can extend, with proper resource semantics

These three personas converge on the same product. The differentiator vs. concept.md is that the buyer = the user = one person.

## Validation hypotheses (to test in discovery)

1. **Hypothesis H1 — PM overhead is the sharpest pain, not resource collisions.** Solo devs spend more time being their own PM than they do firefighting agent collisions. The "AI PM" wedge lands harder than the "resource scheduler" wedge.
   - *Falsified if:* < 30% of interviewees describe PM work as a top-3 daily friction.
2. **Hypothesis H2 — Vision-to-backlog automation is the killer feature.** Devs want to write a `VISION.md` (or paste a paragraph in chat) and get an agent-ready backlog out.
   - *Falsified if:* most interviewees prefer to author tickets themselves and don't trust auto-decomposition.
3. **Hypothesis H3 — Checkpoint quality gates are accepted as a trade for less ceremony.** Devs accept "no PRs, but mandatory checkpoint debt-squash" as a fair trade.
   - *Falsified if:* devs strongly prefer per-change review even at solo scale.
4. **Hypothesis H4 — jj-curiosity is real among the ICP.** A meaningful share of the ICP is already using jj, has tried it, or is willing to try jj-colocated for the workflow upside.
   - *Falsified if:* < 20% of interviewees will adopt jj-colocated; in that case, ship the same architecture on git-only and treat jj as a v2 mode.
5. **Hypothesis H5 — buyer = user; willing to pay $20–$40/mo.** Solo founders in the $5k–$50k MRR band will pay themselves for the cloud digest and cross-device sync.
   - *Falsified if:* the right buyers exist but won't pay anything, or won't pay until they have a team (which means they're no longer the ICP).
6. **Hypothesis H6 — Local-first is a feature, not a bug.** Devs prefer that the operational truth lives on their machine, especially since builds and the jj OP-log are inherently local.
   - *Falsified if:* most interviewees prefer hosted-first because they switch machines.

Discovery plan (see `05-discovery-plan.md`) is designed to test these directly.

## Disqualifier list (Wedge B)

Do not chase these users in 2026:
- Enterprises with procurement and SSO requirements (they want Wedge C with controls, not a daemon)
- Teams that haven't adopted any coding agent yet (no concrete pain)
- Hosted-IDE-only users (Replit, GitHub Codespaces only) without a local dev loop
- Users who already built their own orchestrator and like it
- Non-engineers (PMs, designers) — Wedge B has no UI for them

## Related docs

- `00-wedge-ladder.md` — wedge ladder
- `01-positioning.md` — positioning at each wedge
- `05-discovery-plan.md` — how to test the hypotheses above
