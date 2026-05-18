# Architecture Bets — Agile Brain Wedge B

**Status:** Names the contentious bets behind the Wedge B architecture, with rationale, falsifiers, and dependencies.
**Last updated:** 2026-05-16

The Wedge B architecture commits to a specific paradigm rather than trying to be agnostic. That's a feature, not a flaw — sharp wedges win — but each commitment is a bet. This doc names the bets so future-Nick can re-evaluate them without re-discovering the reasoning.

Bets are numbered. Each has: claim, why we're taking it, what would falsify it, what it depends on, and what changes if it's wrong.

## B1 — jj is the operational VCS (colocated with git)

**Claim:** Agile Brain uses jj's working copy, OP-log, and change-IDs as the operational source of truth. Coding agents continue to speak git through the colocated `.git` directory; the daemon translates between the two as needed.

**Why we're taking it:**
- jj's anonymous-branch model means every concurrent agent edit is automatically a separate change-ID — no naming, no merge ceremony.
- jj's first-class conflict objects mean two agents touching the same line produce a tracked conflict that gets resolved at the next checkpoint, not a workflow halt.
- The OP-log gives reversible agent actions for free; no custom undo to design.
- jj is late-0.x and considered production-ready for solo daily use in May 2026.

**Falsifier:**
- < 20% of the ICP is willing to install and adopt jj-colocated within their first session, OR jj's pre-1.0 churn breaks the daemon often enough to lose users.

**Depends on:**
- jj continuing its 2–6-month stable release cadence without a paradigm-breaking rewrite.
- The colocation surface staying stable in jj.

**If wrong:** Ship the same architecture on plain git. Lose the conflict-as-first-class property; gain it back partially with worktrees and stricter checkpoint conflict detection. The daemon's PM-in-background, flock locks, checkpoint gates, and vision ingestion all still work on git.

## B2 — Pure jj (no colocation) is the v2+ aspirational mode

**Claim:** v1 ships jj colocated. v2+ supports pure jj (no `.git`) once one of the following happens: (a) major coding agents speak jj natively, OR (b) the daemon's git-shim is reliable enough to make the agents' git assumption invisible.

**Why we're taking it:**
- Research is unambiguous: no AI agent speaks jj in May 2026.
- Pure-jj forces the daemon to be the translator, which is a real engineering surface to maintain.
- The colocated path is the established jj recipe and works today.

**Falsifier:**
- A major agent (Claude Code, Cursor, Devin) ships jj support and the broader ecosystem follows; or the daemon's translation layer turns out to be trivial.

**Depends on:**
- B1.

**If wrong (pure jj earlier than expected):** Ship a `--pure-jj` opt-in mode. Probably a net positive — the user explicitly asked for it.

## B3 — `flock`/`fcntl` for build and process locks; no custom scheduler

**Claim:** Resource locking uses OS-level advisory locks per declared resource. A thin daemon shim adds priority counters; the kernel does the rest.

**Why we're taking it:**
- OS file locks are atomic, well-understood, and kernel-managed.
- Advisory locks die with the owning process — the correct failure mode for dead agents.
- Replaces a substantial subsystem (custom scheduler with queues, timeouts, priority aging) with a wrapper.

**Falsifier:**
- The advisory-lock model can't express a resource the user needs (e.g., a remote simulator on another machine). In that case, the cloud-side scheduler would be needed.

**Depends on:**
- The ICP is single-machine for v1. Cross-machine resource coordination is a Wedge C concern.

**If wrong:** Add a cloud-coordinated lock service for the resources that need it. The flock primitive stays for everything else.

## B4 — No branches as a workflow primitive

**Claim:** The operational workflow has no named branches. jj change-IDs replace them. Trunk is the only named target.

**Why we're taking it:**
- Named branches add coordination overhead a solo dev doesn't need.
- jj's change-IDs already isolate concurrent edits.
- Removing branches removes a whole class of "which branch is this agent on" confusion.

**Falsifier:**
- Discovery shows solo devs strongly prefer branches even at solo scale, OR external tooling (CI, deploy systems) absolutely requires named branches and the daemon can't generate them on demand.

**Depends on:**
- B1, B5.

**If wrong:** Daemon auto-generates branch names from change-IDs for export-only purposes (CI, deploy, GitHub backup). Internal workflow stays branchless.

## B5 — No PRs as a workflow primitive

**Claim:** No pull-request gate. Agents commit straight into the jj DAG. Code review happens at checkpoints (B6/B7), not per-commit.

**Why we're taking it:**
- The dev is solo. There is no second human to review.
- Checkpoint gates catch what per-change PR review would catch.
- Per-change LLM-based review is expensive; batched checkpoint review amortizes the cost.

**Falsifier:**
- Solo devs reject the no-PR workflow on first contact and feel uncomfortable without per-change review.
- Mitigation: opt-in "audit mode" with PR-style approval, off by default.

**Depends on:**
- B6, B7.

**If wrong:** Ship audit mode as the default for new installs. Promote to advanced "no-audit mode" after trust is earned.

## B6 — Multi-signal checkpoint trigger

**Claim:** Checkpoints fire on the *first* of: change-volume threshold reached, test failure, complexity-delta threshold reached, or human-pinged. Not on a fixed time interval.

**Why we're taking it:**
- Fixed time intervals are blind to risk — bad code accumulates within the interval if nothing triggers.
- A broken test should fire a checkpoint *immediately*, not on the next clock tick.
- The user explicitly chose this trigger model.

**Falsifier:**
- Multi-signal trigger fires too often (LLM-budget burn) or too rarely (debt accumulates). Tracked via the checkpoint-pass-rate metric.

**Depends on:**
- The four signal sources being computable cheaply (test results from CI, change count from jj, complexity from a static analyzer).

**If wrong:** Re-tune thresholds first; only fall back to fixed-time if multi-signal can't be made to work.

## B7 — Mandatory debt-squash gates at every checkpoint

**Claim:** At every checkpoint, agents must drive these to passing before forward work resumes:
- **Coverage:** ≥ 100% on changed regions since last checkpoint
- **Benchmarks:** ≤ 10% regression vs last checkpoint (configurable per project)
- **Complexity:** every changed function under the project's cyclomatic-complexity threshold
- **Anti-AI antipatterns:** detector reports zero on changed regions

**Why we're taking it:**
- Solo devs accumulate debt fast when agents ship 80%+ of code; without forcing functions, the codebase decays.
- The four gates are computable today via existing tooling (coverage tools, benchmark frameworks, complexity analyzers, `anti-ai-pattern-detector` skill).
- "Mandatory" is the whole point — soft gates with warnings don't change behavior.

**Falsifier:**
- Gates fail to converge on real codebases (especially around hard-to-test code, generated files, or noisy benchmarks). Tracked via squash-iteration metric.

**Depends on:**
- Per-file gate suppression configuration (`.agile-brain/gates.toml`).
- Stall detection that escalates to human after N non-converging iterations.

**If wrong:** Demote one or more gates to advisory in early projects; promote back as tooling improves.

## B8 — Vision is the input, daily CEO digest is the output

**Claim:** The dev provides high-level vision via `VISION.md` and/or chat. The daemon decomposes vision into agent-ready backlog items with acceptance criteria, dispatches, and surfaces a daily CEO digest. The dev does not write tickets.

**Why we're taking it:**
- Solo devs at meaningful revenue mostly keep backlog in their head; they will not operate a ticket tracker for themselves.
- Vision-to-spec decomposition is the highest-leverage automation per 2026 research (spec quality is the bottleneck, not throughput).
- The "AI PM for solo devs / company-of-one CEO mode" positioning is open in May 2026 — no incumbent owns it.

**Falsifier:**
- Decomposition produces nonsense backlogs on first run and the dev never returns. Tracked via backlog-acceptance metric.
- < 30% of discovery interviewees describe PM-overhead as a top-3 daily friction.

**Depends on:**
- B1–B7 working well enough that the dev trusts the daemon to dispatch unsupervised.

**If wrong:** Pivot to a less ambitious surface — daemon as a "spec helper" the dev uses interactively, instead of running the SDLC autonomously. Loses the headline; product still ships.

---

## B9 — Capability-based code is the default project structure

**Claim:** Code is organized by *business capability* (e.g., `billing`, `auth`, `vision-ingestion`, `recommendation`) rather than by tech layer (`controllers`, `services`, `models`). Each capability is a directory with its own interface, implementation, and tests. Pivots reassemble capabilities; rewrites are rare.

**Why we're taking it:**
- Auto-pivot's value proposition rests on pivots being cheap. Vertical capability boundaries are the established way to keep them cheap (similar in spirit to DDD bounded contexts).
- The B7 antipattern gate gains a new check: "this code couples vertically across capabilities" — preventing the architectural drift that makes pivots expensive.
- AI agents work well against narrow, named capabilities. Agents lose the plot fast inside undifferentiated "services" directories.

**Falsifier:**
- Capability boundaries impose enough overhead on a tiny solo-dev project that the dev abandons them. Tracked via project-structure complaints in discovery.

**Depends on:**
- Project scaffolding shipped with LaunchDifferent's `init` command that creates capability boundaries by default.

**If wrong:** Ship a `--flat` mode for tiny projects; capability mode becomes optional for projects above a size threshold.

## B10 — VISION.md has a frozen north-star and a mutable tactical layer

**Claim:** `VISION.md` has two named sections. The north-star (mission, hard constraints) is parsed but cannot be mutated by the daemon under any autonomy level. The tactical layer below (ICP, positioning, current feature set) is freely mutable per the auto-pivot autonomy config. If signals indicate the north-star itself needs to change, the daemon *freezes development* and surfaces a CEO-level callout.

**Why we're taking it:**
- Prevents identity loss across many pivots.
- Allows the daemon to be genuinely autonomous on tactical layers without risking that the product loses what's distinctive.
- The freeze-and-escalate behavior preserves the value of the north-star without making it a trap when the world genuinely changes.

**Falsifier:**
- Devs find the two-layer split confusing or game it by putting everything in the tactical layer. Tracked via north-star section length distribution across projects.

**Depends on:**
- A parser that reliably distinguishes the two sections via convention (HTML comment markers) and degrades safely when malformed.

**If wrong:** Ship a single-layer mode with prompting-based north-star convention; lose the hard guarantee but keep the spirit.

## B11 — Pivots are reversible by default through the jj OP-log

**Claim:** Every autonomous pivot creates a labeled OP-log entry (`pivot-<id>`). Auto-revert and `agile-brain pivot revert <id>` both use `jj op restore` to roll back code changes atomically. This is what makes autonomous execution safe.

**Why we're taking it:**
- Without free reversibility, autonomous pivots are too dangerous to ship.
- jj's OP-log makes this primitive nearly free — we don't need to build a snapshot system.
- Combined with the time-to-launch tracker pushing dates rather than cutting corners, the system can be genuinely conservative while still acting.

**Falsifier:**
- jj OP-log can't reliably restore through certain operation types relevant to pivots (e.g., commits that interact with external systems). Then we need a higher-level revert primitive.

**Depends on:**
- B1 (jj as operational truth).

**If wrong:** Build a lightweight snapshot-and-restore layer over git. More work; same semantics.

---

## B12 — Each phase is built using prior phases (self-build)

**Claim:** This is a *practice* bet, not a technical one. Beginning from Phase 1 (harness foundation), every new phase of LaunchDifferent is built using the capabilities of the prior phases. Wedge A is hand-built; everything after that uses what came before. Same pattern as self-hosting compilers (Rust, Go) and Git tracking its own source. See `11-bootstrap.md`.

**Why we're taking it:**
- Defuses the four most likely premortem failure modes: planning-as-substitute, category-doesn't-crystallize, audience-unreachable, capability-code-is-theoretical.
- Produces an irreplicable credibility artifact ("we built a Product Differentiator using a Product Differentiator").
- Forces ruthless prioritization: only the next-phase-enabling capabilities ship.
- Every checkpoint, digest, and pivot on the self-build is content.
- The launch decision in Phase 5 *is* the system's viability gate firing on its own readiness — the most defensible launch story imaginable.

**Falsifier:**
- A phase N (where N ≥ 2) ships with code that was hand-built when prior phases existed and were usable for that build. Tracked by the metric in `08-success-metrics.md`: *phases-built-with-prior-phases / phases-shipped should equal 1.0 after Phase 1*.
- Two consecutive phases ship hand-built when self-build was available — the bet is dead, the credibility moat collapses.

**Depends on:**
- B1–B11 working in their respective phases. Self-build is what's *enabled by* the other bets; it's not independent.
- Discipline. The temptation to "just hand-build this one because it's faster" is the failure mode.

**If wrong:** We ship a product that doesn't use itself. That's not catastrophic technically — the product still works for external users — but it kills the strongest commercial story (self-build provenance) and makes the premortem failure modes substantially more likely.

---

## How these bets compose

```
B1 (jj operational) ──┬─► B4 (no branches)
                      ├─► B5 (no PRs) ──┬─► B6 (checkpoint trigger)
                      │                  └─► B7 (debt-squash gates)
                      └─► B11 (pivot reversibility via OP-log)
B3 (flock) ──► resource layer (independent)
B8 (vision → digest) ──► depends on B1–B7 for autonomous execution
B9 (capability code) ──► makes pivots cheap; depends on init scaffolding
B10 (north-star + tactical) ──► protects identity; required for autonomous pivots
B11 (pivot reversibility) ──► safety net for autonomous pivots; depends on B1
B2 (pure jj v2+) ──► aspirational, off the critical path

Auto-pivot (10-auto-pivot.md) ──► requires B8, B9, B10, B11 — and rests on B1, B6, B7
```

The load-bearing bets are **B1** (jj), **B6** (checkpoint trigger), **B7** (mandatory gates), **B8** (vision-to-digest), **B9** (capability code), **B10** (north-star), **B11** (pivot reversibility), and **B12** (self-build practice). Auto-pivot is the feature that composes B1–B11 into the Product Differentiator value proposition; B12 is the discipline that ensures we actually use it on ourselves. If any of B1, B7, B8, B9, B10, B11 is wrong, auto-pivot's value collapses. If B12 is wrong, the commercial credibility moat collapses. B2, B3, B4, B5 are derived.

## Reading order for revisiting these

When you re-evaluate the architecture (quarterly suggested):
1. Read this doc top-to-bottom.
2. Pull the falsifier metric for each load-bearing bet from `08-success-metrics.md`.
3. Mark each bet as **holding**, **wobbling**, or **falsified**.
4. For any **falsified**, log a new decision in `06-decision-log.md` that supersedes the affected D008–D012.

## Related docs

- `00-wedge-ladder.md` — wedge context
- `01-positioning.md` — Wedge B headline derived from B8
- `06-decision-log.md` D008–D012 — formal decisions implementing these bets
- `07-risks-and-mitigations.md` R17–R21 — risks specific to these bets
- `08-success-metrics.md` Quality section — falsifier metrics
