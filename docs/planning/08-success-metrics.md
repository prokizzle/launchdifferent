# Success Metrics — Agile Brain

**Status:** Spec for what to instrument. Refresh after every wedge transition.
**Last updated:** 2026-05-16

`concept.md` lines 267–294 list four metric categories (activation, engagement, outcome, learning) without saying *how* to compute them. This doc maps each metric to an event source from `04-data-model.md` and notes whether it's measurable at Wedge A, B, or C.

The principle: every metric must be either (a) a SQL query against `brain_events`, (b) a counter incremented by the daemon, or (c) a derived projection. If a metric can't be defined that way, drop it.

## Wedge A — Observer metrics

Minimal. The goal is to ship something useful, not to optimize.

| Metric | Definition | Source |
|---|---|---|
| **MCP tool calls per week** | Count of MCP requests served by observer | Server log |
| **Distinct projects installed** | Unique project paths in observer SQLite | `errors.project_id` GROUP BY |
| **Errors surfaced** | Count of dev-server errors captured in last 7 days | `errors` table |
| **Active users (weekly)** | Distinct machine fingerprints opening MCP connections | Server log (anonymized) |

## Wedge B — Local Daemon metrics

### Activation

| Metric | Target | Definition / SQL sketch |
|---|---|---|
| **Time to first event** | < 5 min | seconds from `daemon_started` to first non-startup event |
| **Time to first resource lock** | < 30 min | seconds from `daemon_started` to first `resource_acquired` from a non-daemon agent |
| **Time to first Linear pull** | < 1 hour | seconds from `daemon_started` to first `source_synced` for source=`linear` |
| **Agents registered (week 1)** | ≥ 2 | distinct `agent_id` values with at least one event in week 1 |

### Engagement (weekly cohorts)

| Metric | Target | Definition |
|---|---|---|
| **Daily active sessions** | ≥ 1/day | days in a 7-day window with at least one BrainEvent |
| **Multi-agent days** | ≥ 3/week | days in a 7-day window with ≥ 2 distinct `agent_id` having events |
| **Memory reads per session** | ≥ 1 | `memory_read` events per agent session — proxy for "is shared memory actually useful?" |
| **Decisions logged** | ≥ 5/week | count of `decision_made` events — proxy for autonomy use |
| **Approvals processed** | ≥ 80% in < 1 hour | median time from `approval_requested` to `approval_granted`/`approval_rejected` |

### Outcome (what the daemon prevented or enabled)

These are the *ROI* metrics that mitigate R2 in `07-risks-and-mitigations.md`. Each must be visible in the CLI/dashboard.

| Metric | Definition | How to compute |
|---|---|---|
| **Avoided collisions** | Resource acquisitions that would have collided without the daemon | Count of `resource_queued` events that resolved within the timeout (i.e., another agent had the lock) |
| **Build-time saved** | Estimated time avoided by serializing builds | sum of queue wait time where serialization beat a hypothetical concurrent build |
| **Tasks unblocked** | WorkItems that transitioned out of `blocked` after a daemon-detected unblock | `work_item_history` transitions where prior status was `blocked` and trigger event was a `decision_made` |
| **Context restored** | Sessions started with non-empty memory projection | sessions where `memory_read` returned > 0 bytes |
| **Trust score average** | Mean `trust_score` across all agents at end of period | Derived from `decisions` table; success rate weighted by recency |

### Bootstrap / self-build (B12 falsifier indicators)

These metrics measure whether LaunchDifferent is actually building itself per D017 / B12. The B12 falsifier metric must equal 1.0 from Phase 1 onward.

| Metric | Target | Definition |
|---|---|---|
| **Phases-built-with-prior-phases / phases-shipped** | 1.0 from Phase 1 onward | Boolean per phase (was prior-phase capability used for this phase's build?), rolling ratio across shipped phases. Below 1.0 = B12 falsified for the offending phase. |
| **Phase shipping cadence vs budget** | actual ≤ 1.5× budgeted | Per-phase budget set up-front; tracks R29 (bootstrap-tax inflation). Phases that take > 1.5× budgeted weeks are the warning sign. |
| **Self-use lag after phase ship** | ≤ 1 week | Time between a phase shipping and Nick using it on the build of the next phase. Long lag signals the phase isn't actually useful for self-build yet. |
| **Bootstrap success markers hit** | 5 of 5 by Phase 5 | Count of milestones from `11-bootstrap.md` "Bootstrap success markers" that have actually occurred. Two consecutive misses falsifies B12. |
| **External-user notes captured per phase** | ≥ 1 per phase | Count of "what would an external user need that's different?" notes captured during each phase. Zero = R30 over-fitting risk active. |
| **Discovery cadence during build** | ≥ 2 external interviews per phase | External-user interviews completed during each phase (R30 mitigation). |

### Auto-pivot (Product Differentiator effectiveness)

These metrics measure whether the headline capability is actually keeping products differentiated. Added for D013–D015.

| Metric | Target | Definition |
|---|---|---|
| **Viability score (running)** | ≥ 75 at launch | Current project's viability score. Reported in every digest. Below 60: daemon proposes pivots. Below 75: daemon defers launch. |
| **Viability score trend** | trending up | 30-day rolling slope. Negative slope means the market is closing in faster than pivots are responding — escalation signal. |
| **Launch date drift** | tracked, not targeted | Weeks between original target and current projected target. Reported in digest. High drift with viability still low → north-star pivot consideration. |
| **Pivots proposed** | per week, distribution by magnitude | Count of pivot proposals per week by magnitude. Healthy projects have proposals concentrated in Reposition/Repackage; lots of Re-feature/Re-platform proposals signal an unstable product. |
| **Pivot acceptance rate** | per magnitude | Share of proposed pivots the dev accepts. Low acceptance for autonomous tiers means autonomy config should be loosened or proposals are bad; track separately. |
| **Pivot-to-impact lag** | ≤ 1 week | Time from pivot execution to first observable change in viability score (pre-launch) or PMF metric (post-launch). |
| **Reverted pivots** | ≤ 20% of executed | Share of executed pivots that get reverted (auto or manual) within N weeks. High revert rate signals poor synthesis quality. |
| **North-star freeze events** | < 1 per project on average | Count of times the daemon froze development for a north-star callout. Several per project signals a misaligned original north-star. |
| **Signal feed health** | ≥ 90% feeds green | Share of configured signal feeds responding healthily over the last 7 days. R22 mitigation. |

### Quality (checkpoints and debt-squash effectiveness)

These metrics are added for the reshaped architecture (D008–D012). Each is computable from the BrainEvent log plus jj OP-log.

| Metric | Target | Definition |
|---|---|---|
| **Checkpoint pass rate** | ≥ 80% | Share of checkpoints where all four gates (coverage, benchmark, complexity, anti-AI) pass on the first iteration |
| **Median squash iterations** | ≤ 2 | Iterations to reach a passing checkpoint when the first attempt fails |
| **Coverage drift between checkpoints** | ≤ 5 pts | Max drop in coverage from one checkpoint to the next; large drops indicate cadence is too loose |
| **Benchmark regression caught** | 100% of >10% regressions | Count of benchmark regressions detected by the daemon vs. by the user noticing |
| **Antipattern density** | trending down | Number of detected anti-AI antipatterns per 1000 LOC per checkpoint |
| **Time in squash session** | ≤ 15% of total session time | Wall-clock time agents spend in squash mode vs. forward work — too high means cadence is wrong |
| **Vision-to-first-commit lag** | ≤ 30 min | Time from a `VISION.md` change to the first agent commit addressing the new vision |
| **Vision-to-shipped lag** | ≤ 1 day for small items | Time from a vision item being decomposed to the corresponding checkpoint passing |
| **Backlog acceptance rate** | ≥ 70% | Share of daemon-generated backlog items that the dev approves without rewriting |
| **Checkpoint trigger source** | distribution | Count by trigger reason (change-volume / test-failure / complexity-delta / human-pinged). Helps tune cadence |

### Learning (does the system get better over time?)

| Metric | Definition |
|---|---|
| **Human override rate** | Fraction of `decision_made` events followed by `override_applied` within 24 hours |
| **Recommendation acceptance by category** | For each work-item label, share of `approval_granted` vs `approval_rejected` |
| **Repeated policy corrections** | Count of distinct override patterns that recur ≥ 3 times — these are the policy-learning targets |
| **Risk-prediction accuracy** | For WorkItems with `risk_score` set at grooming time, share that actually got `task_failed` vs `task_completed` |
| **Effort-estimate accuracy** | For WorkItems with `effort_estimate`, share where actual elapsed time fell within ± 50% of the estimate |

## Wedge C — Team Cloud metrics

Add on top of Wedge B:

| Metric | Definition |
|---|---|
| **Planning prep time reduction** | Self-reported (pilot survey) "minutes saved per planning session" |
| **Sync standup time reduction** | Self-reported "minutes saved per standup" |
| **Stale ticket rate** | Share of `work_items` where `updated_at` is older than 14 days — Wedge C target: reduce by 30% from baseline |
| **Status updates auto-generated** | Share of `source_writeback` events for `comment` type, vs human-authored Linear comments |
| **Cross-team dependency MTTR** | Median time from `conflict_detected` (cross-project) to resolution event |
| **Pilot retention** | Pilots completing 4 weeks who continue paying |

## Instrumentation rules

1. **Every counter has a SQL definition.** No dashboard tile without a query.
2. **Every metric has an alert.** If "avoided collisions" drops to 0 for a week, something's wrong.
3. **Targets are honest.** Don't pick numbers that look good in a slide deck.
4. **Anonymized aggregates only off-device.** Operator metrics stay local unless they opt in to cloud telemetry.

## The "what Agile Brain did for you" weekly digest

The mitigation for R2 (unclear ROI). A weekly summary, generated locally, that surfaces:
- *X build collisions avoided this week*
- *Y agent sessions started with restored context*
- *Z tasks moved out of blocked because the daemon noticed*
- *Trust score for each agent (delta vs last week)*

If those numbers are flat at zero for two weeks in a row, the user hasn't gotten value, and we know it. That's a clearer signal than NPS.

## Related docs

- `04-data-model.md` — events that feed these metrics
- `07-risks-and-mitigations.md` — R2 (unclear ROI) mitigation depends on this doc
- `concept.md` lines 267–294 — original metric categories
