# Auto-Pivot — Agile Brain Wedge B

**Status:** Feature spec. The headline capability of Wedge B, not an add-on.
**Last updated:** 2026-05-16

## The thesis

> **Can a solo developer still make money with AI?**

Today, only AI providers profit reliably. The barrier to entry is low, ideas are easily copied, and by the time you launch, your idea has likely already been shipped by someone you never saw coming. Building once and hoping isn't a strategy anymore.

Agile Brain's bet: solo devs can still win, *if* they have a competitive radar that keeps them one pivot ahead before launch. Auto-pivot is that radar. It's the headline capability that makes everything else in Wedge B (jj, flock, checkpoints, PM-in-background) worth the price of admission — because all of it exists to make pivoting *cheap enough* to actually do.

## What auto-pivot does

It continuously monitors the market and steers the solo dev away from commoditized spaces *before* launch and toward profitable opportunities *after* launch. Concretely:

- **Pre-launch (primary mode):** scores the current vision's viability against the competitive landscape. Detects when the space is saturating. Proposes pivots before code becomes sunk cost. **Pushes the launch date back if viability stays low.** Goal: reach a *profitable* launch, even if it ships later than originally planned.
- **Post-launch (secondary mode):** monitors PMF signals and competitive moves; proposes pivots when retention/WAU/churn or competitive position degrade. Goal: stay profitable.

Most of the value is pre-launch. By the time you're post-launch with real metrics, you've already won enough to have options.

## Core rule: viability gates launch, not the calendar

The single most important rule of auto-pivot:

> **The launch date is a target. Viability is a gate. If they conflict, viability wins.**

If the launch date arrives but viability score is below `launch_minimum_viability`, the daemon pushes the launch date out and proposes pivots. The dev's calendar is information; the daemon's default behavior is *extend, don't ship commoditized*. The CEO can override at any time and ship anyway — that's the human's call — but the system never recommends launching a product that has no clear differentiator.

This matches the thesis: "profitable on launch" beats "on-schedule launch."

## Pivot taxonomy (4 magnitudes)

| Magnitude | Name | Example | Code-change cost |
|---|---|---|---|
| **1** | Reposition | Same product, different ICP / messaging / landing page | Low (copy + meta + glossary) |
| **2** | Repackage | Same code, different SKU / pricing / feature bundling | Low–Medium (feature flags + billing config) |
| **3** | Re-feature | Drop capability X, add capability Y inside the same product | Medium (capability swap; see `09-architecture-bets.md` B9) |
| **4** | Re-platform | Different target market entirely (solo→teams, B2C→B2B) | High (substantial restructure; still capability remix, not rewrite) |

Out of scope: **full rebuild** (different problem space). That stays human-only. The whole point of pivot-ready architecture is to never need it.

## Autonomy per magnitude (configurable)

Per the decided design: each magnitude has its own configurable autonomy level. The dev sets these once in `.agile-brain/autopivot.toml` and adjusts as trust is earned.

```toml
# .agile-brain/autopivot.toml
[autonomy]
reposition  = "autonomous"     # daemon executes; reports in digest
repackage   = "autonomous"     # daemon executes; reports in digest
re_feature  = "plan"           # daemon drafts plan; human approves
re_platform = "suggest"        # daemon proposes; human decides

[thresholds]
viability_minimum         = 60   # below this, daemon proposes pivot
launch_minimum_viability  = 75   # below this, launch is auto-pushed
pivot_cooldown_days       = 7    # min days between proposals of same magnitude
north_star_unlock         = false # if true, daemon may propose north-star pivots

[targets]
launch_target_date = "2026-08-15"    # informational, not enforced
launch_extension_max_weeks = 12      # daemon won't extend beyond this without human override
pivot_cost_ceiling = 0.20            # max share of remaining target window a single pivot consumes
```

Levels:
- **`watch`** — monitor, store signals, no proposals
- **`suggest`** — propose in digest with cost estimate and reasoning
- **`plan`** — draft a pivot plan (updated `VISION.md`, regenerated backlog) for human approval
- **`autonomous`** — execute through normal checkpointed workflow; announce in next digest

Default values prioritize speed at the cheap end (Reposition/Repackage) and human review at the expensive end (Re-feature/Re-platform). Customize freely.

## The north-star and the freeze

`VISION.md` has two layers:

```markdown
<!-- north-star: frozen until CEO unfreezes -->
# Mission
We help solo devs ship profitable products in the AI age.

# Hard constraints
- Local-first; no required cloud.
- Solo-dev pricing.

<!-- /north-star -->

# Tactical (mutable by daemon)
## Current ICP
...

## Current product surface
...
```

The daemon parses both layers but **cannot mutate the north-star section** under any autonomy level. If market signals indicate that even the north-star is wrong (your mission is commoditized, your hard constraints are blocking adoption), the daemon does something distinctive: **it freezes development**.

A north-star pivot is the highest-priority signal the daemon can emit. When it fires:

1. All in-flight agent work is checkpointed and paused.
2. The CEO digest is replaced by a single high-priority callout: "North-star pivot recommended. Here's why."
3. The reasoning surfaces the signals (which competitor, which trend, which data) with citations.
4. No new work begins until the human edits the north-star section or explicitly rejects the recommendation.

This preserves identity (the daemon can't rewrite who you are) without making the north-star a trap (the daemon can still tell you when *who you are* is becoming non-viable).

## The viability score (pre-launch)

The daemon computes a 0–100 viability score for the current tactical vision, weighted primarily by **differentiation + competitive velocity** (per the decided design).

```
viability_score = w_diff   × differentiation
                + w_vel    × inverse(competitive_velocity)
                + w_val    × validation
                - w_clone  × clone_risk
```

Components:

- **differentiation (0–100):** how unique is the current vision against products shipping in the last 30 days, scored by an LLM-driven similarity scan over Product Hunt, GitHub trending, App Store, X
- **competitive_velocity (0–100):** rate of new launches in the current category over the last 30 days; higher velocity = lower score contribution
- **validation (0–100):** waitlist size, demo asks, X engagement, GitHub stars on related projects (passive signals; doesn't require active outreach)
- **clone_risk (0–100):** how easily could the current vision be copied in a weekend by another solo dev with AI tools

Default weights: `w_diff=0.4, w_vel=0.3, w_val=0.2, w_clone=0.1`. Tune per project.

Two thresholds matter:

- **`viability_minimum` (default 60):** below this, daemon proposes pivots. Above, it stays out of the way.
- **`launch_minimum_viability` (default 75):** below this, launch is auto-pushed. Higher bar than the pivot-proposal threshold — shipping demands more confidence than continuing to iterate.

## The time-to-launch tracker (not a budget)

The launch date is a *target* the dev sets. The daemon tracks it but does not let it dictate decisions. Behavior:

1. **Approaching the target date with viability ≥ `launch_minimum_viability`:** daemon proposes "ready to launch — here's the launch checklist." Green light.
2. **Approaching the target date with viability < `launch_minimum_viability`:** daemon proposes "viability is still at X; extending target by N weeks while we work on differentiators Y and Z." The CEO can accept the extension, override and ship anyway, or pause to discuss.
3. **Extension cap:** if the daemon would need to extend beyond `launch_extension_max_weeks` from the original target, it escalates to a CEO-level decision (similar to north-star pivot freeze). The dev is told: "we've been at this for a while and viability is still low. Possible options: (a) keep extending — here's why, (b) consider a north-star pivot, (c) ship anyway and bet on post-launch iteration."
4. **Pivot cost ceiling** still applies: an individual proposed pivot shouldn't consume more than `pivot_cost_ceiling` (default 20%) of the remaining time-to-target *unless* viability is critically low. Prevents pivot fatigue and small-stakes thrash.

The daemon reports the running launch date in every digest. The dev sees: "originally targeted Aug 15, now Oct 3 because viability score is 62 (below 75 threshold). Three pivots since original target."

## The auto-pivot loop (8 stages)

```
┌──────────┐   ┌──────┐   ┌─────────┐   ┌──────────┐
│  SENSE    │──►│SCORE │──►│COMPOSE  │──►│SYNTHESIZE│
└──────────┘   └──────┘   └─────────┘   └─────┬────┘
                                                 │
┌──────────┐   ┌──────┐   ┌─────────┐   ┌──────▼────┐
│ MEASURE   │◄──│EXEC  │◄──│  PLAN   │◄──│  PROPOSE  │
└─────┬────┘   └──────┘   └─────────┘   └───────────┘
       │                                    ▲
       └──────────────  feedback ───────────┘
```

1. **SENSE** — collect signals from configured feeds: competitor changelogs (RSS), Product Hunt API, Hacker News API, GitHub trending, X (where legitimate API exists), App Store / Play Store category snapshots, search-trend feeds. Public sources only; no scraping behind logins.
2. **SCORE** — classify each signal by relevance to current vision, urgency, magnitude.
3. **COMPOSE** — aggregate scored signals into a weekly market-context vector for this product.
4. **SYNTHESIZE** — compare context vector + current VISION.md + (post-launch) PMF metrics + viability score. Generate pivot candidates.
5. **PROPOSE** — rank candidates by `expected_uplift / time_cost`. Surface top N in the CEO digest with reasoning, citations, reversibility class, and impact on the running launch date.
6. **DECIDE** — human picks if magnitude is `plan`/`suggest`; daemon proceeds if magnitude is `autonomous`.
7. **PLAN** — mutate `VISION.md` (tactical layer only), regenerate affected backlog items, draft the capability remix. Goes through normal B7 checkpoint gates.
8. **EXECUTE** — agents implement the pivot via standard workflow. Every autonomous pivot is labeled in the jj OP-log with `pivot-id` for clean revert.
9. **MEASURE** —
   - *Post-launch:* track PMF metrics for `N` consecutive checkpoints after the pivot. If degradation crosses threshold, **auto-revert** via `jj op restore <pivot-id>` and surface in the next digest.
   - *Pre-launch:* re-score viability at the next weekly market scan. Did the pivot improve viability? Did the new direction itself attract competitors? If not, propose the next pivot rather than auto-reverting (no metric to revert against, and the original direction was already non-viable).

## Auto-revert semantics

**Post-launch:**

- Triggered when configured PMF metric (default: 7-day rolling retention) drops more than `revert_threshold` (default 15%) for `revert_window` consecutive checkpoints (default 3).
- Executes `jj op restore <pivot-id>` to roll back code changes.
- Restores prior `VISION.md` tactical section.
- Surfaces in next digest with a "what now?" prompt — the daemon proposes the next-best pivot from the original candidate list, or escalates to human.

**Pre-launch:**

- No automatic code revert (no metrics to revert against).
- The daemon flags: "the pivot we made 2 weeks ago is now also saturated — here's why." Proposes the next pivot.
- The OP-log still labels the pivot for manual revert via `agile-brain pivot revert <pivot-id>`.
- The running launch date is updated to reflect the next iteration.

## Anti-patterns the design prevents

| Anti-pattern | How auto-pivot avoids it |
|---|---|
| **Pivot fatigue** | `pivot_cooldown_days` between proposals of the same magnitude; pivot-cost ceiling on individual proposals |
| **Identity loss** | Hard-frozen north-star section; daemon must escalate to CEO for north-star pivots |
| **Cargo-cult copying** | Signals weighted by *success indicators* (revenue mentions, retention proxies), not just novelty/launch count |
| **Treadmill (always reacting)** | "Stay course" is a valid output; viability score above threshold means daemon stays out of the way |
| **Autonomous drift** | Every autonomous pivot is reversible via jj OP-log; surfaced loudly in next digest with revert instructions |
| **Competitive scraping ethics** | Public feeds only (RSS, official APIs, public pages); no scraping behind logins or rate-limit-bypass |
| **Premature scaling masking missing PMF** | Daemon never proposes "scale harder" as a substitute for pivot when post-launch PMF signals are weak |
| **Shipping commoditized to hit a date** | `launch_minimum_viability` gates launch; daemon defaults to extending date, never recommending undifferentiated ship |
| **Endless extension** | `launch_extension_max_weeks` caps how far the daemon will push; beyond that, escalates to CEO-level decision |

## Connection to existing architecture

Auto-pivot is not a standalone subsystem — it composes with the bets in `09-architecture-bets.md`:

| Auto-pivot need | Enabled by |
|---|---|
| Cheap code-side pivots | **B9** Capability-based code (added) — modules group by business capability, not tech layer |
| Identity preservation across pivots | **B10** North-star + tactical layered `VISION.md` (added) |
| Safe autonomous execution | **B11** Reversibility via jj OP-log (added; depends on B1) |
| Free undo of any pivot | **B1** jj operational truth |
| Quality unchanged after pivot | **B7** Mandatory debt-squash gates run after every pivot |
| Continuous mutability of vision | **B8** Vision-driven loop with `VISION.md` as substrate |

The Wedge B architecture was *already* pivot-ready. Auto-pivot is what *uses* that property to deliver competitive edge.

## What auto-pivot is NOT

- Not a replacement for human strategic judgment. The dev picks the original vision and edits the north-star.
- Not a guarantee of success. It's a radar; you still have to ship.
- Not enterprise CI. Crayon/Klue/Contify are dashboards for sales teams. Auto-pivot is prescriptive output for one operator.
- Not a marketing tool. Autonomous Reposition can rewrite copy, but the loop is product-shaped, not campaign-shaped.

## Pricing implication

Auto-pivot is the feature that justifies the cloud-side paywall. Local daemon does PM-in-background for free; auto-pivot's market-scan requires data feeds (Product Hunt API, etc.) and LLM tokens for scoring — that's paid. Suggested tier:

- **Free local:** PM-in-background, checkpoint gates, jj workflow
- **Pro ($25–$40/mo):** + auto-pivot in Watch/Suggest mode + daily competitive scan + viability scoring
- **CEO ($60–$80/mo):** + autonomous execution per configured magnitude + post-launch auto-revert + extended signal sources + extended retention on event log

Paywall lives where the meaningful ROI is. The free tier is genuinely useful so adoption isn't gated.

## Open questions to resolve in build

1. Which signal sources are highest-value for v1? Probably Product Hunt + Hacker News + GitHub trending + competitor RSS. Defer X and App Store to v2.
2. How does the daemon detect "saturation" vs "trending" in a category? Likely an LLM-based clustering pass over recent launches, with the cluster centroid distance to current vision driving the signal.
3. What's the minimum viable validation signal pre-launch? Possibly: daemon-suggested landing page experiments via the autonomous Reposition tier produce passive validation data (visits, sign-ups) without explicit dev effort.
4. How are weights `w_diff / w_vel / w_val / w_clone` initialized? Probably best to ship with sensible defaults and let users tune; track which weight tunings produce successful launches and offer those as presets.
5. How does the daemon distinguish "still iterating productively" from "this product is unshippable"? When extending the launch date repeatedly, what signal forces the north-star-pivot escalation? Likely: same extension reason citing same lack-of-differentiator across N successive extension events.

## Related docs

- `00-wedge-ladder.md` — Wedge B context
- `01-positioning.md` — the thesis ("can a solo dev make money with AI?") drives the headline
- `06-decision-log.md` D013–D015 — formal decisions for the thesis shift, north-star, viability gate
- `09-architecture-bets.md` B9–B11 — capability code, north-star, reversibility
- `08-success-metrics.md` — viability score, pivot acceptance rate, launch-date drift tracking
- `07-risks-and-mitigations.md` R22+ — auto-pivot-specific risks
