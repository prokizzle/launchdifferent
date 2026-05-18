# Data Model — Agile Brain

**Status:** Spec. Source of truth for the canonical schema. Implementation lives in `packages/shared/` (when built).
**Last updated:** 2026-05-16

`concept.md` lists work-item fields informally (lines 94–110); the design doc sketches a `BrainEvent` shape (lines 91–103). This doc formalizes both into a canonical schema that survives across wedges.

The schema is intentionally pessimistic: it includes fields needed at Wedge C even though Wedge B doesn't populate them yet. This avoids a future rewrite when shared-team semantics arrive.

## Core entities

```
┌────────────┐   1   ┌──────────────┐   *   ┌─────────────┐
│   Project   ├──────►│   WorkItem    ├──────►│ AcceptanceCx│
└─────┬──────┘       └──────┬───────┘       └─────────────┘
      │                     │ *
      │                     ▼
      │             ┌───────────────┐
      │             │  Dependency   │
      │             └───────────────┘
      │
      │  *  ┌──────────────┐  *  ┌─────────────┐
      ├────►│   Agent       ├────►│ ResourceLock │
      │     └──────────────┘     └─────────────┘
      │
      │  *  ┌──────────────┐
      └────►│  BrainEvent   │  ◄── append-only log
            └──────────────┘
```

## WorkItem (canonical)

TypeScript shape; the SQLite columns mirror it.

```ts
interface WorkItem {
  // Identity
  id: string;                   // ULID
  source: 'linear' | 'github' | 'manual' | 'agent_generated';
  source_id: string;            // external system ID (e.g., "LINEAR-PLA-123")
  source_url: string | null;

  // Content
  title: string;
  description: string;          // Markdown
  acceptance_criteria: AcceptanceCriterion[];

  // Classification
  product_area: string | null;       // e.g., "auth", "billing"
  goal_alignment: string | null;     // free-form link to a goal/initiative
  labels: string[];

  // Scoring (populated by ceremony jobs)
  priority_score: number | null;     // 0-100, source = scoring job
  effort_estimate: EffortEstimate | null;
  confidence: number | null;         // 0-1, how confident the score is
  risk_score: number | null;         // 0-100
  blocked_score: number | null;      // 0-100, how blocked

  // Relationships
  dependencies: WorkItemRef[];
  blocked_by: WorkItemRef[];
  parent_id: string | null;

  // Linked artifacts
  linked_prs: PullRequestRef[];
  linked_branches: string[];         // worktree-friendly
  linked_commits: string[];
  linked_signals: SignalRef[];       // customer feedback, support ticket, etc.

  // State
  status: WorkItemStatus;
  owner: AgentOrHumanRef | null;     // who is currently on it
  review_state: ReviewState;

  // Audit
  created_at: string;                // ISO 8601 UTC
  updated_at: string;
  source_synced_at: string | null;   // last successful pull from source
  project_id: string;
}

type WorkItemStatus =
  | 'triage'        // ingested, not yet groomed
  | 'groomed'       // has acceptance criteria + estimate
  | 'ready'         // sprint candidate
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

type EffortEstimate =
  | { kind: 'points'; value: 1 | 2 | 3 | 5 | 8 | 13 }
  | { kind: 'hours'; value: number }
  | { kind: 'tshirt'; value: 'XS' | 'S' | 'M' | 'L' | 'XL' };

interface AcceptanceCriterion {
  id: string;
  text: string;
  source: 'human' | 'agent_suggested' | 'agent_confirmed';
  satisfied: boolean | null;
}

type ReviewState =
  | 'none'
  | 'pending_human_approval'
  | 'approved'
  | 'rejected'
  | { reason: 'needs_clarification'; questions: string[] };
```

## Field mapping (source → canonical)

| Canonical field | Linear | GitHub Issues | Notes |
|---|---|---|---|
| `id` | generated ULID | generated ULID | local-only |
| `source` | `'linear'` | `'github'` | |
| `source_id` | `Issue.identifier` | `owner/repo#number` | |
| `title` | `Issue.title` | `Issue.title` | |
| `description` | `Issue.description` (markdown) | `Issue.body` | |
| `product_area` | first matching team or project label | label prefix `area:*` | configurable |
| `priority_score` | derived from `Issue.priority` + scoring job | derived | |
| `effort_estimate` | `Issue.estimate` (points) | parsed from `[N points]` in body | |
| `dependencies` | `Issue.relations` where type=`blocks`/`relates` | `#NNN` references in body or `blocked-by:` label | |
| `linked_prs` | `Issue.attachments` of type PR + Linear-GitHub link | PR `Closes #NNN` body refs | |
| `status` | mapped from workflow state | mapped from state + labels | per-team config |
| `owner` | `Issue.assignee` | `Issue.assignees[0]` | maps to AgentOrHuman |
| `source_synced_at` | timestamp of last successful sync | same | |
| `acceptance_criteria` | parsed from description (`## Acceptance criteria` section) | same | enrichment job fills these |

The mapping is implemented as a thin adapter per source. Adding Jira later means writing one more adapter; the canonical schema does not change.

## BrainEvent (append-only)

```ts
interface BrainEvent {
  id: string;                   // ULID
  timestamp: string;            // ISO 8601 UTC
  type: BrainEventType;
  agent_id: string | null;
  project_id: string | null;
  worktree_path: string | null;
  work_item_id: string | null;
  payload: Record<string, unknown>;
  // Provenance
  schema_version: number;       // bump when payload shape changes per type
  recorded_by: 'daemon' | 'mcp' | 'cli' | 'agent';
}

type BrainEventType =
  // Resource lifecycle
  | 'resource_acquired' | 'resource_released' | 'resource_queued' | 'resource_timed_out'
  // Task lifecycle
  | 'task_claimed' | 'task_started' | 'task_completed' | 'task_failed' | 'task_handed_off'
  // Decision and approval
  | 'decision_made' | 'approval_requested' | 'approval_granted' | 'approval_rejected'
  | 'override_applied'
  // Memory
  | 'memory_written' | 'memory_read'
  // Sync
  | 'source_synced' | 'source_writeback' | 'cloud_synced'
  // Conflict and exception
  | 'conflict_detected' | 'agent_unresponsive' | 'lock_starvation';
```

Every event is small and immutable. Projections (Layer 2 of the design doc) are derived from the event log; they can always be rebuilt.

## Scoping rules

| Scope | Key | Purpose |
|---|---|---|
| **Global** | none | User preferences, cross-project conventions |
| **Project** | `project_id` | Architecture decisions, recent changes, active agents |
| **Worktree** | `project_id` + `worktree_path` | Per-branch state, isolated agent context |
| **Task** | `work_item_id` | Past attempts, files touched, dependencies |
| **Agent** | `agent_id` | Trust score, success history, autonomy level |

Projections are computed at agent-session start by replaying recent events filtered by the relevant scope.

## Storage

Wedge A/B: SQLite (`better-sqlite3`) with WAL. Tables:
- `work_items` — current canonical state (one row per item, updated in place)
- `work_item_history` — append-only changes
- `brain_events` — the event log
- `resource_locks` — current locks + queue
- `agents` — registered agents and their state
- `decisions` — denormalized view of `decision_made` events for fast querying

Wedge C: Neon Postgres. Same schema; rows replicated up from the local daemon via a sync log.

## Versioning

Each schema entity has a `schema_version` integer. Migrations live in `packages/shared/migrations/`. Rules:
1. **Additive only at the canonical layer** — adding a nullable column never bumps `schema_version`.
2. **Bump on payload shape change** — `BrainEvent.payload` shape per `type` is versioned; consumers handle multiple versions.
3. **Adapters absorb source-side changes** — Linear API changes are absorbed in the Linear adapter, not in the canonical schema.

## Validation

- All work items validate against a Zod schema at adapter boundaries.
- All BrainEvents validate against a per-type Zod schema before insert.
- Invalid events are written to a `dead_letter` table for inspection rather than dropped.

## Open schema questions (to resolve in build)

1. Should `effort_estimate` allow mixed kinds within a project, or enforce a project-level choice?
2. Are dependencies allowed across `project_id`? (Cross-team is a Wedge C question; Wedge B can punt.)
3. Should `BrainEvent.payload` be JSON column or column-per-type? (Probably JSON; revisit if query performance suffers.)
4. How to represent "agent says it finished but human hasn't approved yet"? Likely `status: review` + `review_state: pending_human_approval`.

## Related docs

- `00-wedge-ladder.md` — wedge context
- `docs/plans/2026-03-07-agile-brain-design.md` — architectural picture this schema fits into
- `docs/plans/2026-03-07-phase0-dev-server-observer.md` — Phase 0 SQLite is the substrate
