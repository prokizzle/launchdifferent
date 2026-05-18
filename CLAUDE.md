# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is right now

**Planning-only.** No source code yet. The product (working name **LaunchDifferent**, repo path `agile-brain`) is in its pre-code planning phase. The first implementation phase (Wedge A — Dev Server Observer) is fully specified but not started; Linear issues `LAUNCH-1` through `LAUNCH-5` track the build sequence.

Don't expect a `package.json`, build commands, tests, or lint config to exist. If you're being asked to start work, you're likely working on `LAUNCH-1` (monorepo scaffolding), which is the foundation everything else uses.

## The product, one paragraph

LaunchDifferent is positioned as the first **Product Differentiator** — a SaaS that keeps a solo developer's product distinctively positioned through the build, so it can launch profitable rather than commoditized. Architecture is SaaS + open-source local harness (same shape as Tailscale / Sentry / Datadog / Vercel CLI): the SaaS owns the intelligence (market signal feeds, viability scoring, pivot synthesis, vision intelligence, dashboard, policy/guardrails control plane), the harness is an MCP server on the dev's machine that registers their coding agents and performs all dev-machine operations (jj, flock, builds, file edits, event log).

The headline capability is **auto-pivot**: continuous market sensing, viability scoring against competitive landscape, and pivot proposals (or autonomous execution per configurable magnitude). **Launch is gated by viability, not by the calendar** — if the product isn't differentiated enough at the target launch date, the system pushes the date out rather than recommend shipping commoditized.

## Where context lives

| Location | What's there |
|---|---|
| `docs/planning/` | 12-doc strategic corpus. Start with `docs/planning/README.md` for the index. Read `00-wedge-ladder.md` first if you don't know where you are. |
| `docs/plans/` | Dated implementation plans. `2026-03-07-phase0-dev-server-observer.md` is the spec for the current build (LAUNCH-1 through LAUNCH-5). |
| `concept.md` | The original product game plan from May 2026. Mostly the long-term Wedge C narrative; superseded operationally by docs in `docs/planning/`. Keep for the team-SaaS story. |
| `.premium/thinking.db` | SQLite store for the thinking-graph reasoning system. Don't edit by hand; tools (`mcp__plugin_premium-core_thinking-graph__*`) read/write it. |
| Linear team `LAUNCH` (LaunchDifferent) | Active work tracking. Initiative `LaunchDifferent v1`; projects per wedge; issues `LAUNCH-1`+. |

## The decisions you must not violate

These are load-bearing. If you're about to do something that conflicts with one, read the rationale first and ask the user.

- **D008 — VCS is jj colocated with git** from Phase 1 onward. For Wedge A (LAUNCH-1), this means `jj git init --colocate` rather than plain `git init`. Agents continue to speak git through the colocated `.git`.
- **D009 — Resource locks are OS-level `flock`/`fcntl`**. No custom scheduler. A thin shim plus a priority counter — that's the whole resource subsystem.
- **D010 — No branches as a workflow primitive.** jj change-IDs replace them. Trunk is the only named target.
- **D011 — No PRs.** Multi-signal checkpoints replace per-change review. Checkpoint gates enforce coverage 100%, benchmarks within 10%, complexity bounded, antipatterns zero.
- **D013 — Product category is "Product Differentiator"**, not AI PM or planner. PM/planning capabilities exist *in service of* differentiation. Product name: LaunchDifferent.
- **D014 — Viability gates launch, not the calendar.** Don't recommend shipping under-differentiated to hit a date.
- **D015 — North-star section of `VISION.md` is hard-frozen.** The daemon parses it but cannot mutate it. If signals demand a north-star pivot, the daemon freezes development and escalates to the human.
- **D016 — SaaS is the product; local harness is the execution layer.** Not local-first-with-optional-cloud. SaaS owns intelligence; harness is open-source and runs locally; they connect over API key.
- **D017 — LaunchDifferent is its own first customer (self-build).** This is the discipline. See "The bootstrap rule" below.

Full rationale and reversibility for each is in `docs/planning/06-decision-log.md`. The corresponding architecture bets (B1–B12) are in `docs/planning/09-architecture-bets.md` — read them before making architectural moves.

## The bootstrap rule (B12 / D017 — most important practical constraint)

**Each phase of LaunchDifferent must be built using the capabilities of prior phases.** Wedge A is the only fully hand-built phase. Phase 1 (harness foundation) uses the Wedge A observer for debugging. Phase 2 uses the harness. By Phase 5, the launch decision is the system's viability gate firing on its own readiness.

What this means in practice:

- **Resist over-engineering Wedge A.** Ship the minimum useful version. Polishing Wedge A "because everything depends on it" is `R29` (bootstrap-tax inflation, the highest-priority unmitigated risk). Production-perfect is what the *next* phase's checkpoint gates enforce on this one — not what we hand-build up front.
- **The B12 falsifier** is concrete: a phase ships hand-built when prior-phase capabilities existed and could have been used. Two consecutive failures = the bet is dead, the commercial credibility moat collapses.
- **Full doc:** `docs/planning/11-bootstrap.md`.

## What to do when starting work

1. **Find your wedge.** `docs/planning/00-wedge-ladder.md` tells you which phase is active. If unsure, check Linear for the most recent `LAUNCH-N` issue marked `In Progress`.
2. **Read the corresponding implementation plan in `docs/plans/`.** For Wedge A this is the only existing one (`2026-03-07-phase0-dev-server-observer.md`); it's the source of truth for tasks LAUNCH-1 through LAUNCH-5.
3. **Check the load-bearing decisions for your phase.** D008 (jj) and B9 (capability-based code) apply from Wedge A onward; the others kick in at the phases they govern.
4. **For non-trivial decisions, use the thinking-graph reasoning tools.** The repo's `.premium/thinking.db` already has ~80 nodes of context — `recall()` against it before reasoning from scratch.

## Naming conventions

- **Repo path:** `agile-brain` (legacy from the original Wedge C name "Agile Brain"; preserved in paths for now).
- **Product name (user-facing):** LaunchDifferent.
- **Package namespace:** `@launchdifferent/*` (per the Wedge A plan and project descriptions).
- **Linear team key:** `LAUNCH`.

If you're writing new code or new docs, use `LaunchDifferent` / `launchdifferent` rather than `agile-brain` for product-facing surfaces. Internal/repo paths can stay as-is until a deliberate rename.

## What to avoid

- **Don't add CLAUDE.md-style files for sub-areas** until there's enough code to justify them. The planning corpus is the source of strategic truth; this file is the only AI-config we need pre-code.
- **Don't commit to git via `git init`** for LAUNCH-1 — use `jj git init --colocate` per D008. (If LAUNCH-1 has already initialized with plain git, ask the user before reinitializing.)
- **Don't write new planning docs without a clear gap.** The corpus is comprehensive; new docs should fill named gaps. The bootstrap commitment (D017) explicitly identifies "planning becomes substitute for shipping" as the #1 premortem risk.
- **Don't ignore `concept.md`** when thinking about the team-SaaS narrative (Wedge C / fundraising story). But don't use it as a build guide — `docs/planning/` is the operational source of truth.
