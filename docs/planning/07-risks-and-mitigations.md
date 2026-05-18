# Risks and Mitigations — Agile Brain

**Status:** Living register. Re-score quarterly.
**Last updated:** 2026-05-16

Risks in this register expand `concept.md` lines 320–330 (commercial risks) with technical risks specific to the local-daemon design. Each is scored on **likelihood** (1–5) and **impact** (1–5), with a clear mitigation owner.

## Risk scoring legend

- **Likelihood:** 1 = will not happen, 5 = almost certain
- **Impact:** 1 = minor inconvenience, 5 = kills the product or burns trust beyond recovery
- **Score:** L × I (max 25). Anything ≥ 12 is a priority risk; ≥ 16 is a blocker until mitigated.

---

## Commercial risks

### R1 — Competitive displacement (incumbent absorbs the wedge)
- **Likelihood:** 4 / **Impact:** 4 / **Score:** 16 (blocker)
- **What:** Linear adds MCP-based task pull + agent dispatch, or GitHub extends Copilot CLI agent with multi-agent session coordination across vendors, removing Wedge B's reason to exist.
- **Mitigation:** (a) Stay agent-agnostic — no incumbent will reliably orchestrate competitor agents. (b) Build the workflow-data moat (event log, policy learning) early so switching cost grows. (c) Watch for Linear/GitHub/Anthropic feature drops weekly; pivot positioning fast.
- **Owner:** Nick.

### R2 — Unclear ROI to buyer
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Operator can't articulate why this is worth $20/mo. "Agents step on each other" is too abstract; needs a measurable win.
- **Mitigation:** Instrument the daemon to count avoided collisions, time saved, tasks unblocked. Surface a weekly "what Agile Brain did for you" digest. See `08-success-metrics.md`.
- **Owner:** Nick.

### R3 — Discovery surfaces a different pain
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** Interviews reveal that resource coordination isn't the sharpest pain; the real pain is something else (e.g., context loss between sessions).
- **Mitigation:** Discovery script (`05-discovery-plan.md`) is open-ended and tracks "surprises". Be willing to re-order Wedge B priorities based on synthesis.
- **Owner:** Nick.

### R4 — Pricing motion doesn't work
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** Open-core + paid cloud sync doesn't convert; users use the free local daemon and never pay.
- **Mitigation:** Make cloud-side features unmistakably high-value (cross-device dashboard, team sharing, longer-retention event log). Track free-to-paid conversion as a metric. Be ready to test a team-license SKU instead.
- **Owner:** Nick.

### R5 — Acquihire-only outcome
- **Likelihood:** 3 / **Impact:** 2 / **Score:** 6
- **What:** Even if the product works, the market is too narrow for a stand-alone company; outcome is acquihire.
- **Mitigation:** Acceptable. Wedge C is the venture-scale story; Wedge B can stand alone as a profitable indie product if Wedge C never opens.
- **Owner:** Nick.

---

## Technical risks

### R6 — Resource lock starvation
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Long-running agent holds a lock; queue grows; other agents starve. Worse: dead agent never releases.
- **Mitigation:** (a) Hard timeouts per resource type (config-driven, default 600s for `xcodebuild`). (b) Heartbeat from agents; auto-release on missed heartbeats. (c) CLI command to force-release a lock with audit trail. (d) Priority-based queue with aging to prevent permanent low-priority starvation.
- **Owner:** Daemon implementation. Lock semantics are testable; write tests for starvation scenarios.

### R7 — SQLite write contention
- **Likelihood:** 2 / **Impact:** 3 / **Score:** 6
- **What:** Multiple agents writing events concurrently exceeds SQLite's single-writer limits. WAL helps; doesn't eliminate.
- **Mitigation:** (a) Daemon serializes writes through a single connection. (b) Batch event inserts when burst-writing. (c) If contention becomes real, swap to LiteFS or per-project DBs. Not a problem at Wedge B scale (< 10 agents/host).
- **Owner:** Daemon implementation.

### R8 — MCP latency / protocol churn
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** MCP version drift across agents (Claude Code vs Cursor vs Copilot CLI agent) breaks integration. New MCP versions deprecate things.
- **Mitigation:** (a) Version-detect at agent registration; degrade gracefully. (b) Pin to MCP SDK versions for releases. (c) Subscribe to MCP working-group updates. (d) Capability negotiation pattern from the start.
- **Owner:** Daemon implementation.

### R9 — Shared memory poisoning (prompt injection via event log)
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Agent A writes a malicious "memory" entry; Agent B reads it as context and is hijacked. This is a real attack surface for shared-memory orchestration.
- **Mitigation:** (a) Sandbox memory writes to scopes the writing agent owns. (b) Strip control characters / suspicious patterns before injection. (c) Log every memory write to the BrainEvent log with the writing agent ID. (d) Don't let agents elevate their own autonomy via memory writes — that's a separate signed operation.
- **Owner:** Daemon implementation + security review.

### R10 — Cloud sync conflicts
- **Likelihood:** 3 / **Impact:** 2 / **Score:** 6
- **What:** Operator's laptop and desktop both run a daemon; event logs diverge; cross-device sync produces conflicts.
- **Mitigation:** (a) Event log is append-only — merging is union, not reconcile. (b) WorkItem state uses last-writer-wins with timestamp + device ID. (c) Surface conflict events in the CLI rather than silently resolving. (d) Defer multi-device to a real feature when one user asks for it; don't pre-build.
- **Owner:** Cloud sync layer (Phase 4).

### R11 — Resource config drift
- **Likelihood:** 3 / **Impact:** 2 / **Score:** 6
- **What:** Operator declares an `xcodebuild` resource but actually has two Xcode installs; lock semantics don't reflect reality.
- **Mitigation:** (a) Resource adapters that introspect (e.g., `xcode-select -p`). (b) CLI command to validate config against the environment. (c) Document resource semantics clearly; encourage minimal config first.
- **Owner:** Daemon implementation.

### R12 — Linear API rate limits / breaking changes
- **Likelihood:** 2 / **Impact:** 3 / **Score:** 6
- **What:** Heavy polling hits Linear rate limits; or Linear changes its GraphQL schema.
- **Mitigation:** (a) Use webhooks where available. (b) Exponential backoff + circuit breaker. (c) Adapter layer absorbs schema changes (`04-data-model.md` D5).
- **Owner:** Linear adapter.

### R13 — Trust loop breaks (agent takes irreversible action)
- **Likelihood:** 2 / **Impact:** 5 / **Score:** 10 (priority)
- **What:** Daemon under "full autonomy" config dispatches an agent that does something irreversible (force-pushes to main, deletes a branch, comments on a customer-facing Linear ticket).
- **Mitigation:** (a) Full autonomy gated to safe-by-default label patterns (`auto-safe`). (b) Reversibility check at dispatch — agent must declare reversibility class. (c) Reversible-only actions allowed unattended in v1. (d) Comprehensive audit log so trust can be re-earned after an incident.
- **Owner:** Daemon + autonomy config schema.

---

## Operational risks

### R14 — Operator-of-one bus factor
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Nick is the only person who knows the system; users adopt and then a long delay or absence leaves them stranded.
- **Mitigation:** (a) Open-core licensing (MIT for daemon, source-available for cloud). (b) Docs-first: every architectural decision in `06-decision-log.md`. (c) Don't take on enterprise commitments at Wedge B that imply uptime SLAs.
- **Owner:** Nick (avoid building on commitments you can't keep).

### R15 — Privacy concerns scare users (revised 2026-05-16 for SaaS shape per D016)
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** Since the SaaS reads vision text, current positioning, competitive context, and aggregated event metadata, devs may worry about (a) code/IP leakage, (b) competitor analytics on their pivoting, (c) lock-in to a cloud provider for what feels like their core strategy.
- **Mitigation:** (a) **Harness is open-source.** Devs can audit exactly what leaves the machine. (b) **Code never leaves the harness.** The SaaS receives vision text, capability metadata, pivot decisions, anonymized event summaries — not source code. (c) **No cross-tenant signal contamination.** Each tenant's vision and pivot history is isolated; signal feeds are tenant-neutral inputs. (d) **Self-host option for high-trust tenants** as a future tier (Wedge C era), priced accordingly. (e) **Audit log surfaced in dashboard:** dev can see every SaaS↔harness call. (f) **Standard SOC 2 / data-residency** as the product matures.
- **Owner:** Nick + SaaS architecture.

### R16 — Phase 0 ships but never finds an audience
- **Likelihood:** 2 / **Impact:** 2 / **Score:** 4
- **What:** Dev-server observer is built, posted, and gets 5 stars. No signal of demand.
- **Mitigation:** That's fine — Phase 0 is a substrate investment, not a product. Move to Wedge B regardless. The risk is over-investing in Phase 0 marketing.
- **Owner:** Nick.

---

---

## Architecture-bet risks (added 2026-05-16)

### R17 — jj adoption barrier
- **Likelihood:** 4 / **Impact:** 4 / **Score:** 16 (blocker)
- **What:** ICP refuses to adopt jj (even colocated). The whole architecture rests on jj's change-ID and conflict model; without it, the daemon is just another scheduler.
- **Mitigation:** (a) jj colocated, not pure — the dev keeps their `.git` and their existing tools. (b) Hypothesis H4 in `02-icp-and-buyer.md` is designed to falsify this fast. (c) Ship a `--git-only` mode as a fallback if discovery shows < 20% jj-curiosity. The git-only mode loses the conflict-as-first-class property but keeps the checkpoint gates and PM-in-background features. (d) Treat jj as a feature differentiator: "the workflow already-jj devs have been waiting for".
- **Owner:** Nick.

### R18 — Checkpoint cadence is wrong; bad code accumulates
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Multi-signal triggers are mis-tuned — checkpoints fire too rarely (debt piles up) or too often (LLM-budget burn, agents thrash).
- **Mitigation:** (a) Conservative defaults: change-volume threshold low, test-failure trigger immediate, complexity-delta sensitive. (b) Per-project tunable thresholds. (c) Track checkpoint-pass-rate as a metric (`08-success-metrics.md`); falling rate signals mis-tuned cadence. (d) Surface a "checkpoint cadence" tile in the CEO digest so the dev can intervene.
- **Owner:** Daemon implementation.

### R19 — Debt-squash gates fail to converge
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** Agents get stuck trying to hit 100% coverage on intentionally-untestable code, or chase benchmark deltas caused by hardware noise.
- **Mitigation:** (a) Per-file gate suppressions via `.agile-brain/gates.toml` (e.g., excluding generated code, ignoring ±5% benchmark noise). (b) Stall detection: if 3 squash iterations don't improve any gate, escalate to human. (c) Treat the antipattern gate as advisory in early projects to avoid spurious failures.
- **Owner:** Daemon implementation.

### R20 — Vision ingestion produces bad backlogs
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** The daemon decomposes `VISION.md` into nonsense tasks, or hallucinates acceptance criteria. Dev loses trust on first run.
- **Mitigation:** (a) Decomposition is a *suggestion* gated by human approval on first pass; trust escalates only after acceptance history. (b) Show reasoning + sources for every backlog item (which line of `VISION.md` it came from). (c) Track recommendation-acceptance metric per category. (d) Let the dev edit `VISION.md` to refine — the daemon re-decomposes and shows the diff.
- **Owner:** Daemon implementation + vision-ingestion subsystem.

### R21 — No-PR workflow is rejected on first contact
- **Likelihood:** 2 / **Impact:** 3 / **Score:** 6
- **What:** Even solo devs have muscle memory for PRs and feel uncomfortable without per-change review.
- **Mitigation:** (a) Surface every checkpoint's diff in the CEO digest with the rationale for what passed/failed. (b) Offer an opt-in "audit mode" that requires human approval on each checkpoint before merging into trunk. (c) Frame the trade-off explicitly in onboarding: "less ceremony, more rigorous gates".
- **Owner:** Nick.

---

---

## Auto-pivot risks (added 2026-05-16)

### R22 — Signal feed dependence; one feed breaks, scoring degrades silently
- **Likelihood:** 4 / **Impact:** 3 / **Score:** 12 (priority)
- **What:** Product Hunt API rate-limits us, HN front page changes structure, X gates legitimate API access, GitHub trending stops being scrapable. The viability score still computes, but on stale or partial inputs — devs make decisions on bad data without knowing.
- **Mitigation:** (a) Per-feed health checks surfaced in the digest. (b) Score includes confidence interval based on feed coverage; below threshold, score is reported as "low confidence" instead of a number. (c) At least three independent feed types per category so any single feed's failure degrades gracefully. (d) Manual signal input as a fallback (dev can paste a launch URL into chat and have it scored).
- **Owner:** Auto-pivot subsystem.

### R23 — Viability scoring is wrong in defensible-but-quiet niches
- **Likelihood:** 4 / **Impact:** 3 / **Score:** 12 (priority)
- **What:** Some valuable niches have low public signal volume — a B2B vertical with 200 buyers, an internal-tools market, a regulated industry. The viability score flags them as low-validation when they're actually defensible because nobody else can enter.
- **Mitigation:** (a) Project-level signal weighting in `autopivot.toml` — devs in quiet niches can deprioritize validation signals. (b) Default weight presets for "noisy-consumer", "B2B-quiet", "regulated-niche". (c) Surface the *components* of the score in the digest, not just the number, so the dev can sanity-check.
- **Owner:** Auto-pivot subsystem.

### R24 — Autonomous Reposition copy hurts more than helps
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** The daemon autonomously rewrites landing-page copy or meta tags; new copy underperforms; dev notices days later via missed sign-ups.
- **Mitigation:** (a) Autonomous Reposition is A/B-tested by default — new copy serves to N% of traffic, old copy continues for the rest, daemon promotes the winner. (b) Every autonomous Reposition is in the next digest with diff and the ability to revert via `agile-brain pivot revert <id>`. (c) Auto-revert on degradation applies to Reposition too (post-launch).
- **Owner:** Auto-pivot Reposition adapter.

### R25 — Launch-date drift becomes infinite
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Dev sets target launch; daemon repeatedly extends because viability never clears threshold; project never ships.
- **Mitigation:** (a) `launch_extension_max_weeks` cap (default 12 weeks beyond original target); at the cap, daemon escalates with three options: keep extending, consider a north-star pivot, ship anyway and bet on post-launch iteration. (b) The same lack-of-differentiator reason citing the same gaps in N successive extension events triggers an automatic north-star-pivot escalation. (c) CEO digest surfaces total weeks elapsed and weeks-since-target on every extension.
- **Owner:** Auto-pivot launch tracker.

### R26 — Competitive scraping ethics / legal exposure
- **Likelihood:** 2 / **Impact:** 4 / **Score:** 8
- **What:** Signal sources include scraping content behind logins, rate-limit bypass, or other practices that could trip detection or legal exposure.
- **Mitigation:** (a) Hard rule in the SENSE adapters: public RSS, official APIs, public pages only. No logins. No CAPTCHA solving. No proxy rotation. (b) Per-source rate limits set conservatively. (c) Cite source URLs in the digest so the dev can see exactly what's being read. (d) Adapter-level audit log of every request made.
- **Owner:** SENSE adapters.

### R27 — Differentiation drift over many pivots (LaunchDifferent itself becomes generic)
- **Likelihood:** 2 / **Impact:** 4 / **Score:** 8
- **What:** Over time, repeated pivots erode whatever made the product distinctive even though each individual pivot looked like an improvement. Identity loss by a thousand cuts.
- **Mitigation:** (a) The north-star section is the primary defense (B10) — its hard-frozen status prevents the slow drift. (b) Diff view in the digest shows cumulative tactical-layer changes since project start, surfacing drift the dev can react to. (c) Periodic "identity check" — daemon highlights when current tactical position is more than N pivots removed from original tactical layer, prompting the dev to confirm or revise the north-star.
- **Owner:** Auto-pivot subsystem + B10 north-star enforcement.

---

## Bootstrap / self-build risks (added 2026-05-16 with D017 / B12)

### R28 — Recursive debugging cognitive load
- **Likelihood:** 3 / **Impact:** 3 / **Score:** 9
- **What:** When the daemon produces a bad output (wrong pivot, malformed backlog item, stuck checkpoint), it's hard to tell whether the bug is in the system's code or in the operator's use of the system (mis-tuned `VISION.md`, wrong autonomy config, signal feed noise). Meta-debugging is genuinely harder than direct debugging — the same person is both the developer and the user.
- **Mitigation:** (a) Audit trails per B11 — every system decision logs the inputs that produced it. (b) Reasoning surfacing in the CEO digest, not just the recommendation. (c) A `--debug` mode that dumps the full reasoning chain for any decision. (d) Explicit role-switching ritual when debugging: write down whether you're investigating *as the operator* (was my input wrong?) or *as the developer* (was the code wrong?) before opening a file.
- **Owner:** Daemon implementation + telemetry surface.

### R29 — Bootstrap-tax inflation (the biggest practical danger)
- **Likelihood:** 4 / **Impact:** 4 / **Score:** 16 (blocker)
- **What:** The bootstrap commitment creates a real temptation to over-engineer each phase "because everything depends on it." Wedge A gets polished beyond what self-build needs. Phase 1 becomes a 6-month project because "the harness has to be perfect before we use it on Phase 2." This is the trap that kills self-hosting projects. Symptom: each phase ships later than planned and is "necessarily" larger than scoped.
- **Mitigation:** (a) **Hard rule:** each phase ships when it's *useful for self-build*, not when it's *production-perfect*. Production-perfect is what the next phase's checkpoint gates enforce on the current phase's code retroactively. (b) Per-phase time budget set up-front; extension requires explicit reason, same machinery as launch-date extension (D014). (c) The "what would an external user need that's different?" note (see R30) captures polish-for-other-users separately from minimum-self-build, so we don't conflate them. (d) Weekly self-check: "Am I building this for self-build use this week, or for hypothetical perfection?"
- **Owner:** Nick. This is a discipline risk, not a code risk.

### R30 — Self-build over-fitting (product fits exactly one user)
- **Likelihood:** 3 / **Impact:** 4 / **Score:** 12 (priority)
- **What:** Building purely for Nick's needs produces a product shaped exactly for one user. Vision shape, signal sources, autonomy preferences, launch psychology, capability boundaries all converge on Nick's idiosyncrasies. External users adopt and bounce because the workflow doesn't fit them.
- **Mitigation:** (a) Run `05-discovery-plan.md` in parallel — keep talking to external solo founders during the build, don't substitute self-dogfood for real user research. (b) **The external-user note exercise:** during each phase, write a short "what would an external user need that's different here?" note. Don't act on it during the phase; capture it for post-launch sequencing. (c) During Phase 5 (pricing & launch prep), explicitly audit the product surface for "Nick-isms" — config defaults, vocabulary, assumed workflows. (d) First five external users get a heavy white-glove onboarding so we learn what's missing fast.
- **Owner:** Nick + discovery cadence.

---

## Priority risks summary (score ≥ 12)

1. **R1** Competitive displacement — *agent-agnostic moat + workflow-data moat + weekly competitor watch*
2. **R2** Unclear ROI — *instrument the daemon for measurable wins*
3. **R6** Resource lock starvation — *timeouts, heartbeats, force-release*
4. **R9** Shared memory poisoning — *scoped writes, sanitization, audit*
5. **R13** Trust loop breaks — *reversibility-gated autonomy*
6. **R14** Operator-of-one bus factor — *open-core + docs-first + no SLAs*
7. **R17** jj adoption barrier — *colocated mode + `--git-only` fallback + discovery validation*
8. **R18** Checkpoint cadence wrong — *conservative defaults + per-project tuning + cadence metric in digest*
9. **R20** Vision ingestion bad backlogs — *human-approval first pass + reasoning surfaced + diff on re-decompose*
10. **R22** Signal-feed dependence — *health checks + confidence intervals + multi-source redundancy*
11. **R23** Viability score wrong in quiet niches — *project-level weight presets + score component transparency*
12. **R25** Launch-date drift infinite — *extension cap + repeated-reason escalation + visibility on weeks elapsed*
13. **R29** Bootstrap-tax inflation — *ship-when-useful rule + per-phase budget + external-user note separates polish from minimum-self-build*
14. **R30** Self-build over-fitting — *parallel discovery + external-user note per phase + white-glove first five external users*

## Related docs

- `00-wedge-ladder.md` — wedge context
- `03-competitive-landscape.md` — competitor watch (R1)
- `08-success-metrics.md` — how R2 mitigation is measured
- `concept.md` lines 320–330 — original commercial risk register
