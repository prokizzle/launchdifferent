# docs/planning — Strategic planning docs

These are the *strategic* docs — what we're building, for whom, why, against what, and how we'll know it's working.

For *implementation* plans (dated, task-by-task), see `docs/plans/`.
For the original product game-plan that seeded all this, see `concept.md` at the repo root.

## Read order

1. [`00-wedge-ladder.md`](00-wedge-ladder.md) — Anchor. Three wedges (Observer → Local Daemon → Team Cloud); current focus; bridge conditions.
2. [`01-positioning.md`](01-positioning.md) — Positioning at each wedge; competitive axis; anti-positioning.
3. [`02-icp-and-buyer.md`](02-icp-and-buyer.md) — ICP per wedge; 3 buyer personas at Wedge B; 5 validation hypotheses.
4. [`03-competitive-landscape.md`](03-competitive-landscape.md) — May 2026 competitive map across 5 categories; where Agile Brain sits; threat analysis.
5. [`04-data-model.md`](04-data-model.md) — Canonical `WorkItem` and `BrainEvent` schemas; source mapping; storage; versioning.
6. [`05-discovery-plan.md`](05-discovery-plan.md) — 30-min interview script; target list; scoring rubric; saturation rules.
7. [`06-decision-log.md`](06-decision-log.md) — D001–D007 strategic decisions with rationale and reversibility; template for future entries.
8. [`07-risks-and-mitigations.md`](07-risks-and-mitigations.md) — 16 risks scored L × I; priority risks ≥ 12; owners.
9. [`08-success-metrics.md`](08-success-metrics.md) — Metrics per wedge; SQL-backed definitions; the weekly ROI digest; checkpoint/debt-squash/vision metrics.
10. [`09-architecture-bets.md`](09-architecture-bets.md) — Eleven architecture bets (B1–B11) behind Wedge B with falsifiers and dependencies. Load-bearing: B1 jj, B6 checkpoint trigger, B7 mandatory gates, B8 vision-to-digest, B9 capability code, B10 north-star, B11 pivot reversibility.
11. [`10-auto-pivot.md`](10-auto-pivot.md) — Headline feature of Wedge B. Product Differentiator category. Viability gates launch, not the calendar. Per-magnitude autonomy. North-star freeze. Working product name: **LaunchDifferent**.
12. [`11-bootstrap.md`](11-bootstrap.md) — **The defining build commitment.** LaunchDifferent builds itself. Wedge A is Phase Zero (hand-built); every subsequent phase uses prior phases. By Phase 5, the launch decision is the system's viability gate firing on its own readiness. B12, D017, R28–R30.

## What these docs are not

- **Not implementation plans.** Those live in `docs/plans/` and have dates in their filenames.
- **Not commitments.** Wedge B is the active focus per `06-decision-log.md` D001; Wedge C and Wedge A spec are stated for shape, not promised.
- **Not a fundraising deck.** `concept.md` is closer to that purpose; these docs are the working strategy underneath it.

## Maintenance

| Doc | Refresh cadence |
|---|---|
| `00`, `01`, `02`, `04`, `06`, `08` | When a wedge transition or strategic decision happens |
| `03` (competitive landscape) | Quarterly, or when a major competitor ships something relevant |
| `05` (discovery plan) | After interview synthesis |
| `07` (risks) | Quarterly re-scoring |

Bumping the `**Last updated:**` line in a doc is enough; don't force a global refresh.
