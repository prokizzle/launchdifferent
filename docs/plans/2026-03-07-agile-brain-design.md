# Agile Brain — Design Document

## Product Overview

Agile Brain is a local-first orchestration daemon that coordinates AI agents working across projects on a single machine. It replaces human agile ceremonies with autonomous planning, resource scheduling, and shared intelligence — while giving humans a PM-focused dashboard for oversight.

**Core thesis:** Agile is great for humans, slow for AIs. Agents need a different coordination model — one built around resource locks, shared memory, machine-speed planning, and configurable autonomy.

**Primary user:** Individual developers running multiple agent sessions. Designed to scale to teams later.

**Architecture principle:** Local daemon is the authority. Cloud provides persistence, cross-device sync, and the dashboard. Works offline.

## Architecture

```
┌─────────────────────────────────────┐
│         Hosted Dashboard (UI)        │  PM view, decision log, metrics
├─────────────────────────────────────┤
│         Cloud Sync Layer             │  Persistence, cross-device, future teams
├─────────────────────────────────────┤
│         Knowledge Base (RAG)         │  Python, semantic search over event log
├─────────────────────────────────────┤
│      Local Daemon ("The Brain")      │  TypeScript/Bun, always running
│  ┌───────────┬──────────┬─────────┐ │
│  │ Resource   │ Shared   │ Task    │ │
│  │ Scheduler  │ Memory   │ Planner │ │
│  └───────────┴──────────┴─────────┘ │
├─────────────────────────────────────┤
│      Integration Surface             │
│  MCP Server · CLI · Claude Skills    │
├─────────────────────────────────────┤
│      External Integrations           │
│  Linear · Git/Worktrees · Builds     │
└─────────────────────────────────────┘
```

## Resource Scheduler

Manages system resources — CPU-heavy builds, test runners, simulators, device connections. Not file locks (worktrees handle file isolation).

### Resource types (user-defined):

```yaml
# ~/.agile-brain/resources.yaml
resources:
  xcodebuild:
    type: exclusive
    max_concurrent: 1
    queue_strategy: priority

  simulator:
    type: pooled
    instances:
      - "iPhone 16 Pro"
      - "iPad Air"
    max_concurrent: 2

  e2e_runner:
    type: exclusive
    max_concurrent: 1
    timeout: 600s

  system_cpu:
    type: throttled
    max_concurrent: 3
```

### Agent interaction:

```
agent → brain: acquire_resource("xcodebuild", task_id, priority)
brain → agent: { status: "queued", position: 2, estimated_wait: "45s" }
brain → agent: { status: "granted", lock_id: "abc123", expires: "600s" }
agent → brain: release_resource("abc123")
```

Key behaviors:
- Agents request resources before expensive operations
- Brain queues by priority (from Linear or manual)
- Timeouts prevent dead agents from holding locks
- Brain tracks which worktree/project each agent is in

## Shared Memory & Event Log

Three layers, each serving a different need.

### Layer 1 — Event Log (source of truth)

Append-only log of everything meaningful:

```typescript
interface BrainEvent {
  id: string
  timestamp: Date
  type: 'task_started' | 'task_completed' | 'task_failed'
      | 'resource_acquired' | 'resource_released' | 'resource_queued'
      | 'decision_made' | 'conflict_detected' | 'memory_written'
  agent_id: string
  project?: string
  worktree?: string
  payload: Record<string, any>
}
```

Powers the dashboard decision timeline. Raw material for projections and knowledge base.

### Layer 2 — Scoped Projections (agent context)

When an agent starts work, the brain injects relevant context:

- **Global:** cross-project conventions, user preferences, recurring lessons
- **Project:** architecture decisions, recent changes, active agents, what's been tried
- **Task:** related past attempts, relevant file context, dependencies

Summaries projected from the event log, sized for agent context windows. Maintained incrementally.

### Layer 3 — Knowledge Base (RAG for discovery)

Event log and agent outputs indexed for semantic search. Agents or humans can ask "what do we know about the auth system?" and get synthesized answers across all projects and history.

Starts simple (SQLite + keyword search), scales to vector DB later.

## Task Planner & Linear Integration

The brain consumes Linear as work intake and reports back. It does not replace Linear.

### Autonomous loop:

```
Linear issue assigned/labeled → Brain picks it up
  → Decomposes into agent tasks (via LLM)
  → Checks resource availability & dependencies
  → Assigns tasks to available agent slots
  → Agents execute in worktrees
  → Updates Linear (comments, status, PR links)
```

### Configurable autonomy:

```yaml
# ~/.agile-brain/autonomy.yaml
rules:
  - match: { label: "auto-safe" }
    autonomy: full

  - match: { priority: "urgent" }
    autonomy: plan_then_approve

  - match: { label: "experimental" }
    autonomy: supervised

  - default:
    autonomy: plan_then_approve
```

### Trust scoring:

Brain tracks success rate per project and task type. Surfaces recommendations:

> "Completed 12/14 bug fixes autonomously on project X with no reverts. Recommend upgrading `bug` label to full autonomy."

Humans accept or dismiss. Trust is earned, not assumed.

### What brain writes back to Linear:
- Decomposition plan as a comment before execution
- Progress updates as sub-issue status changes
- PR links on completion
- Failure summaries with what was tried

## Integration Surface

### MCP Server (primary agent interface):

```
brain.register_agent       — announce yourself, worktree, project
brain.acquire_resource     — request a system resource
brain.release_resource     — give it back
brain.claim_task           — pull next available task
brain.complete_task        — report completion with summary
brain.fail_task            — report failure with context
brain.write_memory         — contribute to shared memory
brain.read_memory          — get scoped context
brain.query_knowledge      — RAG search across history
brain.get_queue_status     — check resource queues
```

### CLI:

```bash
agile-brain status                    # what's happening now
agile-brain queue                     # resource queues
agile-brain locks                     # who holds what
agile-brain memory query "auth flow"  # search knowledge base
agile-brain trust                     # autonomy scores
agile-brain pause                     # pause autonomous work
agile-brain resume                    # resume
```

### Claude Code Skills/Hooks:

- Session-start skill: register with brain, pull task context
- Pre-command hooks: auto-acquire resources before builds/tests
- Post-command hooks: report results back
- `/brain` slash command for human interaction

## Hosted Dashboard

### Views:

**Home (PM view — default):**
- Active projects with progress toward goals
- Issues in flight with agent assignments
- Completed today/this week with PR links
- Blocked items and why
- Autonomy recommendations

**Live Activity (drill-down):**
- Active agents and current work
- Resource queue visualization
- Worktree map
- Real-time event stream

**Decision Log (drill-down):**
- Timeline of brain decisions with reasoning
- Filterable by project, time, decision type

**Intelligence (drill-down):**
- Knowledge base browser
- Memory timeline
- Cross-project patterns

## Tech Stack

| Layer | Tech | Rationale |
|-------|------|-----------|
| Local daemon | Bun + TypeScript | Fast, native TS, good DX |
| Local storage | SQLite (Drizzle) | Event log, resource state, memory |
| MCP server | MCP SDK (TS) | Standard agent protocol |
| CLI | Commander or custom | Lightweight |
| Knowledge base | Python sidecar | Embeddings, vector search |
| Cloud DB | Neon Postgres | Event sync, dashboard backend |
| Dashboard | Next.js on Vercel | PM-facing web app |
| Auth | Clerk | Future team layer |

### Project structure:

```
agile-brain/
├── packages/
│   ├── daemon/          # Bun, local brain process
│   ├── mcp-server/      # MCP tool definitions
│   ├── cli/             # CLI commands
│   ├── skills/          # Claude Code skills
│   ├── knowledge/       # Python RAG sidecar
│   ├── shared/          # Shared types, event schemas
│   └── dashboard/       # Next.js app
├── docs/
│   └── plans/
└── package.json         # Monorepo root (Bun workspaces)
```

## Build Phases

### Phase 0 — Dev Server Observer (immediate)
Next.js instrumentation hook + SQLite + MCP server. Gives agents real-time access to dev server errors and logs. Standalone useful, becomes the brain's application awareness layer later.

1. Next.js instrumentation hook capturing errors, request logs, console output
2. SQLite store for structured, queryable logs
3. MCP server: `get_recent_errors`, `search_logs`, `get_error_detail`, `get_request_log`

### Phase 1 — Resource Scheduler
Local daemon with resource locking and queuing.

1. Daemon process (Bun, runs in background)
2. Resource config (YAML)
3. MCP server: `register_agent`, `acquire_resource`, `release_resource`, `get_queue_status`
4. CLI: `status`, `queue`, `locks`
5. Claude Code hooks for auto-acquiring build resources

### Phase 2 — Shared Memory
Event log and scoped context injection.

6. Event log in local SQLite
7. MCP tools: `write_memory`, `read_memory`
8. Scoped projections (project-level context injection)
9. CLI: `memory query` with keyword search

### Phase 3 — Linear Integration
Autonomous task planning with configurable oversight.

10. Linear API connection, watch for assigned issues
11. Task decomposition via LLM
12. Autonomy config and gates
13. Status reporting back to Linear
14. Trust scoring system

### Phase 4 — Dashboard & Cloud
PM observation deck.

15. Neon Postgres for event sync
16. Next.js dashboard with PM home view
17. Live activity and decision log views
18. Knowledge base with RAG
