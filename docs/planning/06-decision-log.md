# Decision Log — Agile Brain

**Status:** Living record of strategic decisions and their rationale.
**Last updated:** 2026-05-16
**Format:** Each decision has an ID, date, type, decision, rationale, alternatives considered, reversibility, status.

Decisions in this log are the *strategic* ones. Architectural/implementation decisions belong in code comments or `docs/plans/*` implementation plans.

---

## D001 — Lead with Wedge B (local daemon), not Wedge C (team SaaS)

- **Date:** 2026-03-07 (original design doc) — formalized 2026-05-16
- **Type:** Wedge / build order
- **Status:** Active

**Decision:** Build the local-first single-developer daemon (`docs/plans/2026-03-07-agile-brain-design.md`) before the cloud-SaaS team product described in `concept.md`. Pre-stage with the dev-server observer (`docs/plans/2026-03-07-phase0-dev-server-observer.md`).

**Rationale:**
1. **Competitive density at Wedge C.** Linear AI, Jira AI, Devin for Teams, GitHub Copilot CLI agent (May 13 2026 release), Anthropic Skills, and Zapier Workspace Agents already target the team-SaaS planning surface. A solo entrant cannot win on feature parity inside Linear or Jira.
2. **Underserved pain at Wedge B.** Single-developer multi-agent coordination on one machine is the actually-underserved category. Devin for Terminal exists but is closed; Copilot CLI agent is single-agent oriented; orchestration frameworks need glue. No commercial competitor owns this surface.
3. **Buyer = user at Wedge B.** No design-partner gating, no enterprise procurement, no team agreement. The operator can install and pay alone.
4. **Wedge B is the substrate for Wedge C.** Local event log + policy learning → workflow data moat that Wedge C eventually monetizes.
5. **2026 AI-native teams are abandoning fixed sprints.** Pathmode, Monte Carlo, YC AI-Native Playbook all describe continuous planning against a living spec. The Wedge C "weekly sprint planning brief" primitive is dated; Wedge B's event-stream primitive is current.

**Alternatives considered:**
- *Build Wedge C first with a design-partner cohort.* Rejected — requires team sales, longer feedback loop, head-on competition with Linear AI / Jira AI.
- *Skip A and go straight to B.* Rejected — A is the smallest useful thing that proves the SQLite + MCP substrate and ships this month.
- *Build a coding agent of our own.* Rejected — Claude Code / Cursor / Devin are not the bottleneck; coordination is.

**Reversibility:** Mostly reversible. The data model (`04-data-model.md`) is the same across wedges. Pivoting to Wedge C from Wedge B is incremental, not a rewrite.

**Bridge conditions to advance:** See `00-wedge-ladder.md`.

---

## D002 — Local-first authority, cloud optional

- **Date:** 2026-03-07
- **Type:** Architecture
- **Status:** **Superseded by D016 (2026-05-16)** — see below.

**Decision:** The local daemon is the source of truth. Cloud (Neon Postgres + Next.js dashboard) is *additive* — for cross-device sync, dashboards, and future team semantics — never required.

**Rationale:**
1. Resource scheduling (xcodebuild, simulators, ports) is fundamentally local. Cloud round-trips would break the abstraction.
2. Operators want to keep code and event logs on their machine for privacy and offline support.
3. Differentiates against cloud-first competitors (Linear, Jira, Devin) on an axis they cannot easily copy.
4. SQLite + WAL is plenty performant for single-operator workloads. No premature distributed-systems complexity.

**Alternatives considered:**
- *Cloud-first with optional local cache.* Rejected — inverts the dependency the wrong way.
- *Pure local with no cloud option ever.* Rejected — cuts off the Wedge C path and the cross-device use case for fractional CTOs.

**Reversibility:** Low. The whole architecture assumes local authority. A pivot would be a rewrite.

---

## D003 — MCP-first agent interface

- **Date:** 2026-03-07
- **Type:** Architecture / integration
- **Status:** Active

**Decision:** Agents register with and call the daemon via the Model Context Protocol. CLI and skills are secondary surfaces.

**Rationale:**
1. MCP is the emerging interop standard (`research:MCP and A2A are the emerging interop standards`).
2. Agent-agnostic by construction — anything that speaks MCP works.
3. Claude Code, Cursor, and Copilot CLI agent all support MCP.
4. A2A (Agent-to-Agent, Google Cloud) is the future expansion path beyond a single host; MCP-first does not preclude A2A later.

**Alternatives considered:**
- *Custom REST/gRPC protocol.* Rejected — lock-in, lower adoption.
- *Slack-bot-style integration.* Rejected — wrong surface for the operator persona.

**Reversibility:** High. Internally, MCP is a thin shell over the daemon's API surface. Adding A2A or REST later is straightforward.

---

## D004 — Bun + TypeScript for the daemon

- **Date:** 2026-03-07
- **Type:** Stack
- **Status:** Active

**Decision:** Bun + TypeScript for the daemon. Python sidecar for the knowledge-base (RAG) work.

**Rationale:**
1. Bun's startup time and TS-native DX are well-suited to a long-running local process.
2. The MCP SDK has a strong TypeScript surface.
3. Python is the right tool for embeddings / vector search later (knowledge layer).
4. Splitting languages along boundaries (operations vs. ML) avoids a monolith and matches the design doc's architecture.

**Alternatives considered:**
- *Rust for performance.* Rejected — overkill for the workload; slower iteration.
- *Go.* Rejected — weaker MCP ecosystem; less integrated with the JS-heavy MCP/Next.js sphere.

**Reversibility:** Medium. The TS daemon is plenty fast; rewriting only makes sense if a specific performance bottleneck emerges.

---

## D005 — Linear before Jira

- **Date:** 2026-03-07 (implied) — formalized 2026-05-16
- **Type:** Integration order
- **Status:** Active

**Decision:** Linear is the first ticket-system integration; Jira comes in Wedge C P2 (per `concept.md` line 79).

**Rationale:**
1. Wedge B ICP heavily skews to Linear users (AI-native startups, indie operators).
2. Linear's GraphQL API is cleaner than Jira's REST for backlog ingestion.
3. Postponing Jira reduces scope and integration-test surface for the MVP.

**Alternatives considered:**
- *Jira-first.* Rejected — Wedge C ICP fit, but ICP delta vs Wedge B is too large.
- *GitHub Issues only.* Rejected — most Wedge B users have Linear plus GitHub.

**Reversibility:** High. The canonical schema in `04-data-model.md` is source-agnostic; adding a Jira adapter is additive.

---

## D006 — Read-only at Wedge B; opt-in writeback at Wedge C

- **Date:** 2026-05-16
- **Type:** Integration safety
- **Status:** Active

**Decision:** The daemon reads from Linear/GitHub; it does not write back without explicit per-action approval. Linear writeback (comments, labels, status updates) ships as opt-in flags, never default-on.

**Rationale:**
1. Trust is earned, not assumed. Writing to a customer's ticket system before they've seen it operate is the fastest way to lose trust.
2. concept.md's risk register (line 326) recommends "advisory first" — this formalizes it.
3. Read-only is also easier to install: lower OAuth scope, fewer governance objections.

**Alternatives considered:**
- *Writeback-by-default for trusted task types.* Deferred to post-pilot — only after trust scoring proves out.
- *No writeback ever.* Rejected — eventually the daemon needs to update ticket status; the question is just when.

**Reversibility:** High. Add a config flag, toggle behavior.

---

## D007 — Worktrees are opt-in, not required

- **Date:** 2026-05-16
- **Type:** Architecture
- **Status:** Active (provisional, validate in discovery)

**Decision:** The daemon supports git worktrees as a first-class agent scope but does not require them. Branch-per-agent is the default for non-worktree users.

**Rationale:**
1. Research (`research:Multi-agent on same repo is unsolved coordination pain`) shows branch-per-agent is more common in practice than worktrees.
2. Worktrees solve real problems (file-level isolation) but add friction for non-tooling-heavy users.
3. Persona 3 (tooling-heavy solo dev) gets first-class worktree support. Personas 1 and 2 can use branches.

**Alternatives considered:**
- *Worktree-required.* Rejected — narrows the user base unnecessarily.
- *No worktree-awareness at all.* Rejected — leaves Persona 3 with the same problem they have today.

**Reversibility:** High. Worktree-awareness is a flag at the scoping layer.

**Validation:** Discovery interviews should ask explicitly about worktree usage. If < 30% of interviewees use worktrees, prioritize branch-per-agent UX.

---

---

## D008 — Adopt jj (Jujutsu) as the operational VCS, colocated with git

- **Date:** 2026-05-16
- **Type:** Architecture / VCS
- **Status:** Active

**Decision:** Agile Brain uses jj as the operational VCS, colocated with git. The daemon and the human use jj's anonymous change-IDs, OP-log, and first-class conflict handling. Coding agents continue to speak git through the colocated `.git` surface. Pure jj (no colocation) is the v2+ aspirational mode.

**Rationale:**
1. jj's anonymous-branch model solves what worktrees only partially solved — every concurrent agent edit is a separate change-ID by default, with first-class conflict tracking.
2. The OP-log gives reversible agent actions for free; no custom undo to build.
3. Research confirms no AI agent speaks jj natively in May 2026 (Claude Code, Cursor, Devin all assume `.git`). Colocated mode lets us adopt jj's power while keeping agent ecosystem compatibility.
4. jj is late-0.x but considered production-ready for solo daily use.

**Alternatives considered:**
- *Pure jj, no colocation, v1.* Rejected as too aggressive. Narrows the ICP to jj-only devs and forces the daemon to translate jj ↔ git-mental-model for every agent. Becomes the v2 aspirational mode after the ecosystem matures or the daemon's translation surface is proven.
- *Git only.* Rejected. Loses the conflict-as-first-class-citizen property that makes multi-agent on one workspace tractable.

**Reversibility:** High. Colocated jj can be reduced back to git-only by removing the daemon's jj surface — the `.git` directory remains canonical.

---

## D009 — `flock`/`fcntl` for build and process locks; no custom resource scheduler

- **Date:** 2026-05-16
- **Type:** Architecture / Resource management
- **Status:** Active
- **Supersedes:** the "resource scheduler with queues, timeouts, priority" subsystem described in the original design doc

**Decision:** Resource locking uses OS-level advisory locks (`flock` on Linux, `fcntl` on macOS/BSD) per declared resource. A thin daemon shim adds priority-aware queue counters; no custom lock service.

**Rationale:**
1. OS file locks are atomic, kernel-managed, well-understood, and zero new infrastructure.
2. Advisory locks die with their owning process — which is the *right* failure mode for dead agents.
3. Replaces "build a scheduler" with "wrap `flock`" — orders of magnitude less code.
4. Cloud-side locking is unnecessary because builds are inherently local.

**Alternatives considered:**
- *Custom in-daemon lock service.* Rejected — over-engineered, adds an SQLite write path on every acquire, has to reimplement what the kernel already does.
- *Cloud-coordinated locks.* Rejected — adds latency, breaks offline, no upside since there are no cross-machine build collisions.

**Reversibility:** Medium. The interface `acquire_resource(name, priority)` is the same regardless of backend. Swappable.

---

## D010 — No branches, no PRs as a workflow primitive

- **Date:** 2026-05-16
- **Type:** Workflow
- **Status:** Active

**Decision:** The operational workflow has no named branches and no pull-request gate. Agents commit straight into the jj DAG. Trunk is the only named target. Code review happens at checkpoints (D011), not per-commit.

**Rationale:**
1. There is no team to review for — the dev is solo. The PR primitive is overhead.
2. jj change-IDs already isolate concurrent edits; branches add no value.
3. Checkpoint gates (coverage, benchmarks, anti-AI antipatterns, complexity) catch what PR review would catch, and apply uniformly.
4. Solo-dev workflows that ship 80%+ AI-generated code already work this way (per 2026 reporting); the bottleneck is spec quality, not per-change review.

**Alternatives considered:**
- *Keep PRs as an optional flag.* Deferred — could be added later as "audit mode" without changing the default.
- *Per-change gates instead of batched checkpoint gates.* Rejected — burns LLM budget on small changes; batched gates amortize cost.

**Reversibility:** High. Adding PR-style review is additive; removing the checkpoint protocol is the harder direction.

---

## D011 — Multi-signal checkpoint trigger; debt-squash gates are mandatory

- **Date:** 2026-05-16
- **Type:** Workflow / Quality
- **Status:** Active

**Decision:** Checkpoints fire on multi-signal: change-volume threshold OR test failure OR complexity-delta threshold OR human-pinged. At each checkpoint, all agents pause and the daemon runs a debt-squash protocol with mandatory gates: (a) test coverage ≥ 100% on changed regions since last checkpoint, (b) benchmark regression ≤ 10% vs last checkpoint, (c) cyclomatic complexity per function under project threshold, (d) anti-AI antipatterns detected = 0. If any gate fails, the squash session continues; if convergence stalls, escalate to human.

**Rationale:**
1. Multi-signal trigger keeps feedback fast — a broken test fires the checkpoint immediately, not on the next time-based tick.
2. Mandatory gates prevent silent debt accumulation that batched review enables.
3. The four gates are computable today via existing tooling (coverage tools, benchmark frameworks, complexity analyzers, anti-ai-pattern-detector).
4. Stall-escalation prevents infinite squash loops on intractable refactors.

**Alternatives considered:**
- *Fixed-time checkpoints (e.g., every 2 hours).* Rejected — blind to risk signals; bad code accumulates within the interval.
- *Human-triggered only.* Rejected — defeats the "PM in the background" promise.
- *Soft gates with warnings.* Rejected — gates only work if they actually block.

**Reversibility:** High. Gate thresholds are configurable per project.

---

## D012 — Vision is the input; daily CEO digest is the output

- **Date:** 2026-05-16
- **Type:** Product / UX
- **Status:** Active

**Decision:** The dev provides high-level vision via `VISION.md` at repo root and/or chat with the daemon. The daemon decomposes vision into backlog items with acceptance criteria, dispatches to agents, and produces a daily CEO digest: shipped X, blocked on Y, need your call on Z. Linear is optional, not required. The dev does not write tickets.

**Rationale:**
1. Solo devs at meaningful revenue mostly maintain backlogs in their head or in markdown — they do not want to operate a ticket tracker for themselves.
2. The 2026 research showed spec quality is the bottleneck; the daemon turning vision into spec is the highest-leverage automation.
3. Daily digest beats real-time dashboards for the "I want to read it with coffee" CEO mode.
4. Optional Linear writeback exists for users who already use it, but it's not in the critical path.

**Alternatives considered:**
- *Linear-required.* Rejected — narrows ICP, treats ticket-tracker as the source of truth when it should be vision.
- *Real-time dashboard instead of digest.* Deferred — useful as a drill-down, not the primary UX.
- *Chat-only, no `VISION.md`.* Rejected — the markdown anchor gives the daemon a stable substrate to decompose against.

**Reversibility:** Medium. Vision ingestion is the product's distinguishing surface; pivoting away from it means rebuilding the value prop.

---

---

## D013 — Product category is "Product Differentiator", not AI PM or project planner. Working name "LaunchDifferent"

- **Date:** 2026-05-16
- **Type:** Positioning / Category
- **Status:** Active
- **Supersedes positioning aspects of:** D001 (wedge framing) — the *wedge ladder* stands; the *category label* of Wedge B shifts.

**Decision:** The product category is **Product Differentiator** — a new category whose job is to keep a solo dev's product distinctively positioned through the build, so it can launch profitable rather than commoditized. PM-in-background, jj workflow, checkpoint gates, and auto-pivot are mechanisms, not the value proposition. Working product name: **LaunchDifferent** (play on Apple's "Think Different" for the AI age, where thinking differently is no longer enough).

**Rationale:**
1. The deeper question the product answers is "can a solo dev still make money with AI?" — that's a competitive/differentiation question, not a productivity question.
2. AI providers profit reliably in May 2026; solo devs do not. The constraint that determines whether a solo dev profits is whether they ship something *distinctive enough to defend*. "Productivity tool" framing addresses time-to-build, but time-to-build is no longer the binding constraint.
3. The auto-pivot capability is what delivers the differentiator promise; PM/planning capabilities exist to *enable* fast pivots, not as standalone product value.
4. "Product Differentiator" is an empty category in May 2026 — no incumbent owns the label, the discipline is fragmented across CI tools, lean-startup methodology, and competitive intelligence dashboards.

**Alternatives considered:**
- *Stay with "AI PM for solo dev" framing.* Rejected — addresses the symptom (PM overhead), not the cause (commoditization). Less defensible commercial story.
- *"Competitive intelligence for solo founders."* Rejected — implies dashboards, not action. Existing CI products own that frame at enterprise scale.
- *Don't pick a name yet.* Rejected — having a working name forces clarity on what the product is. "LaunchDifferent" can be revised without rewriting the category.

**Reversibility:** Medium. Category framing is a marketing/positioning decision; pivoting to a different category is a re-launch. The product name itself is easily changed.

---

## D014 — Auto-pivot: launch is gated by viability, not by the calendar

- **Date:** 2026-05-16
- **Type:** Product behavior / Auto-pivot core rule
- **Status:** Active

**Decision:** The dev sets a launch target date. The daemon tracks it but treats it as informational. If viability score is below `launch_minimum_viability` (default 75) when the date approaches, the daemon pushes the date out and proposes pivots. The CEO can override and ship anyway — that's a human call — but the default is *extend, don't ship commoditized*. An extension cap (`launch_extension_max_weeks`, default 12) escalates to a CEO-level decision when reached.

**Rationale:**
1. The product's thesis is "profitable on launch." A launch into a saturated space is not a profitable launch, so the system should never default to shipping under-differentiated to hit a date.
2. The dev's calendar is information about *desire*; the viability score is information about *reality*. The reality wins by default.
3. This is what distinguishes LaunchDifferent from a project-planner product. A planner ships on schedule. A Product Differentiator ships when the product is actually different.
4. The extension cap prevents endless drift — if extension keeps recurring, the daemon escalates to "consider a north-star pivot" rather than letting the project run indefinitely.

**Alternatives considered:**
- *Calendar as hard deadline; daemon recommends shipping at the target regardless of viability.* Rejected — contradicts the thesis. Worst-of-both-worlds.
- *Viability as advisory; calendar wins.* Rejected — same problem, slightly softer.
- *No tracking of launch dates at all.* Rejected — devs need a sense of trajectory; the calendar is a useful reporting surface.

**Reversibility:** High. The rule is enforced in one piece of daemon logic and one config field.

---

## D015 — Auto-pivot autonomy is configured per magnitude class; north-star is hard-frozen with escalation

- **Date:** 2026-05-16
- **Type:** Product behavior / Auto-pivot autonomy + safety
- **Status:** Active

**Decision:** Each pivot magnitude (Reposition, Repackage, Re-feature, Re-platform) has its own configurable autonomy level: `watch`, `suggest`, `plan`, or `autonomous`. Defaults are autonomous for the two cheapest tiers and `plan`/`suggest` for the two most expensive. The north-star section of `VISION.md` is hard-frozen — the daemon parses it but cannot mutate it under any autonomy level. If market signals indicate the north-star itself needs to change, the daemon freezes all development and surfaces a CEO-level callout demanding human decision before work resumes.

**Rationale:**
1. Per-magnitude autonomy lets the dev grant autonomy where reversibility is high (Reposition, Repackage) while keeping a human in the loop where it isn't (Re-feature, Re-platform). One-size autonomy is wrong because the magnitudes have wildly different reversibility profiles.
2. Hard-frozen north-star prevents identity drift across many pivots — the daemon can be aggressive without losing what makes the product itself.
3. The freeze-and-escalate behavior for north-star pivots converts a worst-case (autonomous identity rewrite) into a best-case (high-priority callout that focuses the human's attention exactly when needed).
4. Combined with B11 (jj OP-log reversibility), autonomous pivots are bounded both by what they can do (no north-star mutation) and by what they can't break (everything else is reversible).

**Alternatives considered:**
- *One autonomy level for all pivots.* Rejected — different magnitudes have different reversibility; treating them uniformly under-protects or over-restricts.
- *No hard freeze on north-star; advisory only.* Rejected — the value of a north-star is that it's actually protected. A convention-only marker would degrade over many pivots.
- *Daemon never proposes north-star pivots.* Rejected — sometimes the world really does require a north-star pivot; not surfacing that is its own failure mode.

**Reversibility:** High. Autonomy levels are config; north-star freeze is one parser rule.

---

## D016 — SaaS is the product; local harness is the execution layer

- **Date:** 2026-05-16
- **Type:** Architecture / Commercial model
- **Status:** Active
- **Supersedes:** D002 (local-first authority, cloud optional)

**Decision:** LaunchDifferent is a **SaaS product**. The dev pays a subscription. The **local harness** (open-source, free) is an MCP server that runs on the dev's machine, registers their coding agents, performs all dev-machine operations (jj, flock, builds, file edits), and connects to the SaaS over an API key. The SaaS owns the intelligence (signal feeds, viability scoring, pivot synthesis, vision intelligence, policy/guardrails control plane, dashboard, audit log). The harness is useless on its own and is open-sourced for trust and auditability, not as a standalone tool. **Guardrails** are layered: harness enforces local execution rules (command/file/network allowlists, sandboxing); SaaS enforces policy (per-magnitude autonomy, trust scoring, autonomy gates).

**Rationale:**
1. The headline capability (auto-pivot) practically requires cloud — signal feeds, expensive LLM scoring, cross-user signal pooling, central policy control. Calling it "cloud optional" undersells what the product actually does.
2. Nick can iterate the SaaS intelligence (prompts, scoring weights, signal sources) daily without users updating a local binary.
3. SaaS is what solo devs actually pay for in 2026 — recurring revenue, dashboards, churn metrics. Open-core with optional cloud is harder to monetize and harder to support reliably.
4. The MCP protocol is designed for exactly this shape: local server exposes tools to agents, talks to a remote service for intelligence.
5. This matches proven shapes (Tailscale, Sentry, Datadog, Vercel CLI, 1Password, Doppler): local agent/CLI + cloud control plane. Lower commercial risk than inventing a new commercial model.
6. The local harness being open-source preserves auditability for privacy-conscious devs without forcing a fully local product on everyone.

**Alternatives considered:**
- *Keep D002 local-first; cloud truly optional.* Rejected — defensive choice that doesn't match what the ICP buys. Limits commercial story, requires building two product modes, and makes auto-pivot's headline capability second-class.
- *Pure cloud, no local component.* Rejected — agents and builds are inherently local; remote-only requires complex remote-execution infrastructure that adds latency and breaks the dev's loop. The harness is needed regardless.
- *Closed-source harness, fully proprietary stack.* Rejected — losing the open-source harness costs trust with the dev-tools-tinkerer persona for no gain.

**Reversibility:** Medium. The SaaS interfaces (API keys, signal feeds, viability scoring) can be re-implemented locally if the strategy changes, but that's a substantial product rewrite.

**Implications for other docs:**
- `01-positioning.md`: the "local-first authority" differentiation axis is replaced by "SaaS brain + local harness." The harness is *not* the product; it's the connector.
- `02-icp-and-buyer.md`: pricing motion is **SaaS-with-included-harness**, not open-core. Free tier is constrained-SaaS (limited signal feeds, no auto-pivot autonomy) rather than fully-local.
- `10-auto-pivot.md`: signal feeds, viability scoring, pivot synthesis are clearly cloud-resident; harness only executes pivots locally.
- `07-risks-and-mitigations.md`: privacy risk (R15) needs revisiting — the harness being open-source helps, but the SaaS reading vision/positioning/competitive context is now an explicit privacy surface to address.

---

## D017 — LaunchDifferent is its own first customer (self-build commitment)

- **Date:** 2026-05-16
- **Type:** Build discipline / Product strategy
- **Status:** Active

**Decision:** From Phase 1 onward, each capability of LaunchDifferent is built using the prior capabilities. Wedge A is the only fully hand-built phase. Phase 1 onward uses the prior phase's capabilities. By Phase 5, the launch decision itself is gated by LaunchDifferent's viability score on LaunchDifferent. Full doc: `11-bootstrap.md`.

**Rationale:**
1. **Discipline mechanism.** The bootstrap commitment is the most reliable way to prevent the premortem's #1 failure mode (planning becomes a substitute for shipping). If self-build is the rule, the product must exist to keep building it.
2. **Category creation.** "We built a Product Differentiator using a Product Differentiator" is a story competitors can't fake. The build itself becomes the case study.
3. **Capability boundary stress test.** B9 (capability-based code) is theoretical without exercise. Self-build exercises it every phase.
4. **Content engine.** Every checkpoint, digest, and pivot on the self-build is content the audience can't get from anywhere else.
5. **Recursive proof.** The launch decision being gated by the system's own viability score on itself is the strongest possible proof point.

**Alternatives considered:**
- *Build conventionally; dogfood lightly after launch.* Rejected — loses the credibility moat and most of the discipline benefit. This is how most products fail to live up to their own pitch.
- *Full self-build from day 1.* Impossible — the product doesn't exist yet. Wedge A must be hand-built.
- *Self-build only after launch.* Rejected — wastes the pre-launch period (which is when auto-pivot's value is highest, per D014).

**Reversibility:** Medium. We can always start hand-building if self-build stalls, but doing so falsifies B12 and damages the commercial story. Not reversible without a credibility cost.

**Bootstrap order**: Wedge A (hand-built) → Phase 1 harness (Wedge A + hand) → Phase 2 vision (harness + hand) → Phase 3 SaaS brain (vision + checkpoints + hand) → Phase 4 auto-pivot (everything) → Phase 5 launch (everything; system signs off on its own readiness).

**Related risk:** R28 (recursive debugging cognitive load), R29 (bootstrap-tax inflation — the biggest practical danger), R30 (self-build over-fitting to Nick's case). See `07-risks-and-mitigations.md`.

---

## Decision template (use for future entries)

```markdown
## D### — <short, opinionated title>

- **Date:** YYYY-MM-DD
- **Type:** Wedge | Architecture | Stack | Integration | Pricing | GTM
- **Status:** Active | Superseded by D### | Reversed

**Decision:** <one-paragraph statement>

**Rationale:**
1. <reason>
2. <reason>

**Alternatives considered:**
- *<option>:* <why rejected>

**Reversibility:** High | Medium | Low — <one-sentence explanation>
```

## Related docs

- `00-wedge-ladder.md` — wedge ladder (D001 lives here)
- `02-icp-and-buyer.md` — ICP-level decisions (D006, D007 inform this)
- `04-data-model.md` — schema decisions
