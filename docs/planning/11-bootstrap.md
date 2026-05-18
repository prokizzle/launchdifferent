# Bootstrap — LaunchDifferent builds itself

**Status:** The defining build commitment. LaunchDifferent is its own first customer.
**Last updated:** 2026-05-16

## The commitment

LaunchDifferent must be capable of building the next version of itself. Each capability ships when it can be used to build the next capability. This is not aspirational; it's the discipline. If a phase ships hand-built when prior phases existed and were usable, the bet (B12) is falsified — and we have a serious credibility problem.

Same pattern as a self-hosting compiler (Rust, Go) or self-tracking VCS (Git). Once you can compile your compiler with itself, every subsequent version is provenance for the next.

## Why this works

The premortem named six likely failure modes. Self-build neutralizes four:

| Premortem risk | How self-build defuses it |
|---|---|
| Planning becomes substitute for shipping | Execution *is* the dogfood. There's no "more planning" phase — the next planning artifact is whatever the system produces from VISION.md. |
| Category never crystallizes | "We built a Product Differentiator using a Product Differentiator" is a category-creation story competitors can't fake. |
| Audience unreachable | Every checkpoint, digest, and pivot on yourself is content. Daily build-in-public content emerges from doing the work, not from carving out marketing time. |
| Capability-based code is theoretical | Capability boundaries are tested with every new feature you add, because the next feature *is* the next capability. |

It doesn't fix every risk (see "What this doesn't fix" below).

## The phase-by-phase bootstrap

| Phase | What it ships | What it's built with | First moment of self-use |
|---|---|---|---|
| **0 — Wedge A** | Dev Server Observer + MCP server | Hand + Claude Code + git | None. Pre-self-build phase. |
| **1 — Harness foundation** | jj operations, flock locks, MCP agent registration, event log, secure SaaS connection | Hand + Claude Code + Wedge A observer | Observer feeds dev-server errors to the agents building the harness. |
| **2 — Vision + checkpoints** | VISION.md ingestion (north-star + tactical), backlog generation, checkpoint gates, debt-squash protocol | Harness + observer | Backlog for Phase 3 generated from LaunchDifferent's own VISION.md. Checkpoint gates enforce 100% coverage on Phase 3 code. |
| **3 — SaaS brain MVP** | Signal feeds (Product Hunt, HN, GitHub trending, competitor RSS), viability scoring, daily CEO digest, dashboard skeleton | Harness + vision + checkpoints | Viability scoring on LaunchDifferent itself runs daily. Daemon's daily digest reports on LaunchDifferent's own development progress. |
| **4 — Auto-pivot loop** | Sense → Score → Compose → Synthesize → Propose → Decide → Plan → Execute → Measure | All of phases 0–3 active | Auto-pivot proposes pivots on LaunchDifferent's own roadmap. First real pivot on self happens here. |
| **5 — Pricing & launch** | Tiering (Free / Pro / CEO), billing, marketing landing, design-partner cohort | All of phases 0–4 active | Launch decision *is* viability score crossing `launch_minimum_viability` for LaunchDifferent itself. The most recursive moment — the product signs off on its own readiness to ship. |

## What "built with" means concretely

By Phase 3, building a new feature looks like:

1. Edit `VISION.md` tactical layer to describe the next capability ("ship competitor-RSS signal feed").
2. Daemon decomposes into backlog items with acceptance criteria and dispatches to agent slots.
3. Agents commit through MCP into the jj DAG. Concurrent edits resolved via jj's first-class conflicts.
4. Multi-signal checkpoint fires when change-volume / test-failure / complexity-delta thresholds hit.
5. At each checkpoint, agents pause; debt-squash runs (coverage 100%, benchmarks within 10%, complexity bounded, antipatterns zero).
6. Daily CEO digest reports: shipped X, blocked on Y, viability score Z.
7. By Phase 4, auto-pivot watches the market while this is happening and may propose pivots mid-build.

The hand-built phases (0 and 1) are the bootstrap tax. Everything after Phase 2 is meaningful self-use; everything after Phase 4 is full self-use.

## Bootstrap tax — the real cost

Phases 0 and 1 are nearly all-manual. Phase 2 is partially manual (the daemon doesn't yet decompose vision, so Phase 2's own backlog is hand-written). The tax decreases monotonically, but the early cost is real.

**Mitigation rule**: each phase ships when it's useful *for self-build*, not when it's production-perfect. "Production-perfect" is what the *next* phase's checkpoint gates enforce on it. Resist the temptation to over-engineer Wedge A "because everything depends on it" — that path leads to the planning-as-substitute failure mode the bootstrap commitment was meant to prevent.

**Anti-pattern to avoid**: "We need to build a better X before we can use it to build Y." That's bootstrap-tax inflation — the trap that kills self-hosting projects. Ship the *minimum viable X* that can build *some kind of Y*, then improve X by using Y.

## What this doesn't fix

Honest gaps:

1. **Selection bias.** The product fits Nick because Nick built it for himself. External users may have different vision shapes, signal sources, launch psychology. Self-build evidence is not user-fit evidence. Run `05-discovery-plan.md` in parallel; don't substitute self-dogfood for real user testing.
2. **Recursive debugging.** When the product proposes a bad pivot, is it a bug in the synthesizer or a problem in VISION.md? Meta-debugging is harder than direct debugging. The mitigation is good audit trails (B11) and explicit reasoning surfacing — but cognitive load is real.
3. **Self-cannibalization.** Auto-pivot may propose pivoting LaunchDifferent away from being LaunchDifferent. The thesis (`success > original idea`) explicitly permits this — but Nick's proximity to the daemon's reasoning makes over-trust more likely than for an external user. North-star (B10) and the pivot-cost ceiling are the brakes.
4. **Phase 4 paralysis.** Once auto-pivot runs on itself, every commit can trigger a pivot proposal. The clarity tool risks becoming a clarity tax. Mitigation: `pivot_cooldown_days` per magnitude class, plus an explicit "ignore for this phase" flag the dev can set.
5. **External-user-fit blindness.** Building purely for Nick's needs produces a product shaped exactly for one user. Parallel exercise: during each phase, write a short "what would an external user need that's different here?" note. Don't act on it yet; capture it for post-launch.

## Bootstrap success markers

You'll know self-build is working when:

- **Post Phase 1:** Nick describes a recent debugging session with "I just asked the MCP for the recent errors and saw it." (not "I tailed the log file.")
- **Post Phase 2:** Phase 3's first commit is from an agent dispatched by the daemon, not from Nick's editor directly.
- **Post Phase 3:** Nick reads the daily CEO digest before opening the codebase. The digest is the surface.
- **Post Phase 4:** The first auto-pivot fires on LaunchDifferent itself. Nick accepts or rejects with reasoning. The decision is logged for content.
- **Post Phase 5:** The launch happens on a date the system, not Nick, recommended.

If any of these doesn't happen on schedule, B12 is wobbling. If two in a row don't happen, B12 is falsified — we're shipping a Product Differentiator without using it to build itself, and the credibility moat collapses.

## Content artifact

Every phase produces material. The most valuable artifact will be the moments where:
- The system proposes something Nick disagrees with — and Nick is right.
- The system proposes something Nick disagrees with — and the system is right.
- A pivot proposal lands and Nick accepts. Including the regret.
- A pivot proposal lands and Nick rejects, then six weeks later wishes he had accepted.

Each of these is a story that no competitor can replicate without doing their own self-build for months. Capture them.

## Related docs

- `00-wedge-ladder.md` — Wedge A reframed as Phase Zero of bootstrap (the first manual phase before self-build begins)
- `06-decision-log.md` D017 — formal commitment to self-build
- `09-architecture-bets.md` B12 — the practice bet with falsifier
- `07-risks-and-mitigations.md` R28–R30 — recursive debugging, bootstrap-tax inflation, self-build overfitting
- `08-success-metrics.md` — phases-built-with-prior-phases metric (B12 falsifier indicator)
- `10-auto-pivot.md` — auto-pivot will run on LaunchDifferent itself from Phase 4 onward
