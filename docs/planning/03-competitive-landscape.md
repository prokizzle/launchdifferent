# Competitive Landscape — Agile Brain

**Status:** Reference. Refresh quarterly.
**Last updated:** 2026-05-16
**Snapshot date:** May 2026

## Map

The competitive surface splits into five categories. Agile Brain sits between (3) and (4) — closer to (4) at Wedge B, drifting toward (1) at Wedge C.

```
┌──────────────────────────────────────────────────────────────┐
│  (1) PM tools with AI                                         │
│      Linear AI · Jira AI · Asana AI · ClickUp Brain ·         │
│      Notion AI · Height · Motion                              │
├──────────────────────────────────────────────────────────────┤
│  (2) Enterprise agent platforms                               │
│      MS Foundry Agent Service · Google Agentspace ·           │
│      AWS Bedrock Agents · Salesforce Agentforce · Glean       │
├──────────────────────────────────────────────────────────────┤
│  (3) Coding agents                                            │
│      Claude Code · Cursor · Devin · Copilot CLI agent ·       │
│      Codex/Assistants · GitHub Copilot Workspace              │
├──────────────────────────────────────────────────────────────┤
│  (4) Agent orchestration frameworks / dev infra               │
│      LangGraph · CrewAI · OpenAI Agents SDK ·                 │
│      Intent (workspace-per-agent) · Zapier Workspace Agents   │
├──────────────────────────────────────────────────────────────┤
│  (5) Agent observability                                       │
│      Braintrust · LangSmith · Arize Phoenix · Helicone ·      │
│      Galileo · Maxim · Datadog LLM Observability              │
└──────────────────────────────────────────────────────────────┘
```

## Where Agile Brain sits

**Wedge B (local daemon):** category (4), but distinct from existing entrants because:
- Local-first authority (frameworks are runtime-only)
- Resource scheduling for dev-machine concerns (builds, simulators, ports)
- Linear pull for work intake
- MCP-native, agent-agnostic registration

**Wedge C (team cloud):** category (1) augmented with category (4) underneath. Differentiates from (1) by owning the full execution loop, not just the planning surface.

## Threat analysis per category

### (1) PM tools with AI

**Threat level: high (Wedge C), low (Wedge B).**

Linear AI and Jira AI are bundled into seat pricing and own the planning surface for their customers. Their AI roadmap features (issue triage, summarization, priority suggestions) target the same brief that `concept.md`'s "weekly planning brief" describes.

**Implication:** Wedge C cannot win on feature parity for AI inside the PM tool. Differentiation must be the *coordination loop outside* the PM tool — the agent execution layer that Linear AI doesn't reach.

### (2) Enterprise agent platforms

**Threat level: low for both wedges (different ICP).**

Foundry, Agentspace, Bedrock Agents, Agentforce, ServiceNow Agents — all target enterprise. Procurement-heavy, SSO-required, multi-cloud governance. Wedge B's prosumer single-developer pricing motion does not compete here.

**Implication:** Don't market to enterprise. Don't build governance features for enterprise as a Wedge B priority.

### (3) Coding agents

**Threat level: medium — these are *peers*, not competitors, but they are absorbing adjacent surface.**

- **Claude Code** and **Cursor** are the substrate. They run inside Agile Brain.
- **Devin for Terminal** (announced 2025–2026) is closest to "agent fleet on one machine" but is closed (locked to Devin), expensive, and cloud-hand-off-first.
- **GitHub Copilot CLI agent** (May 13, 2026 release) added a unified sessions view in JetBrains, global `.agent.md`, and an ask-question tool. This is the closest *adjacent* threat: if Microsoft adds multi-agent coordination across the sessions view, it eats Wedge B's surface for Copilot users.
- **Copilot Workspace** is more of a multi-file refactor surface than an orchestration daemon.

**Implication:** Stay agent-agnostic. Integrate with all of these. The bet is that no single coding-agent vendor will reliably orchestrate *other* vendors' agents.

### (4) Agent orchestration frameworks

**Threat level: medium.**

- **LangGraph / CrewAI / OpenAI Agents SDK** are toolkits for *building* orchestrators. They are not the orchestrator itself. Builders use them; users use what gets built on top.
- **Zapier Workspace Agents** is cross-SaaS orchestration with admin controls. Different shape (no-code, hosted, cross-app). Not focused on dev-machine resources.
- **Intent** is the most direct parallel: per-agent workspaces backed by git worktrees. Different axis — spec-first / workspace-first vs Agile Brain's daemon-first / resource-first / Linear-pull-first.

**Implication:** Use frameworks (LangGraph or OpenAI Agents SDK) inside Agile Brain where useful, but the *product* is the daemon. Closest competitor to watch: Intent.

### (5) Agent observability

**Threat level: low — complementary.**

LangSmith, Braintrust, Arize, Datadog LLM Observability log agent traces. They are downstream of the orchestration layer. Agile Brain can emit traces to them; they cannot emit task plans back.

**Implication:** Integration target, not competitor. Phase 2+ should produce OTLP-compatible spans.

## The "is this a feature?" trap

Several incumbents could in theory absorb Wedge B:

| Could absorb if… | Mitigation |
|---|---|
| Linear added "MCP server with task pull" | Build the daemon first. Linear's surface is still inside Linear; Agile Brain's surface is the dev machine. |
| GitHub added multi-agent CLI session coordination on top of Copilot CLI agent | Agent-agnostic moat. They will optimize for Copilot. |
| Devin opened a public local-orchestration API | Cognition's incentive is to push you to Devin-only. Agile Brain runs *every* agent. |
| Anthropic shipped a "Code Workspaces orchestrator" tied to Skills | Possible. Mitigation: be the cross-vendor router. |

The shared mitigation is **agent-agnosticism + local-first + workflow-data moat**. None of the incumbents will be agent-agnostic — they all have a horse in the race.

## What to monitor (alerts)

Set up a weekly digest watching for:
- `site:linear.app/changelog` — Linear AI feature drops
- `site:cognition.ai/blog` — Devin for Terminal / Devin for Teams updates
- `site:github.blog/changelog` — Copilot CLI agent + Workspace evolution
- `site:anthropic.com/news` — Code Workspaces / Skills changes
- "Manus" "Pinpoint" "Height AI" — new entrants
- "agent orchestrator" on Hacker News and r/LocalLLaMA

## Related docs

- `01-positioning.md` — how Agile Brain positions against this map
- `07-risks-and-mitigations.md` — competitive-displacement risk
