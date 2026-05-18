# Discovery Plan — Agile Brain

**Status:** Operational. Use for the first 10–15 customer-development calls.
**Last updated:** 2026-05-16

`concept.md` (line 192) calls for "interview 10 to 15 AI-native engineering leaders" but does not specify the script, target list, or how to score the interviews. This doc fills that gap and is structured to test the hypotheses from `02-icp-and-buyer.md`.

## Goals of discovery

1. **Validate or falsify** the five hypotheses (H1–H5 in `02-icp-and-buyer.md`).
2. **Find the sharpest pain.** What concrete agent-coordination friction has each interviewee hit in the last 30 days?
3. **Probe willingness to pay.** Get past polite interest to "would you actually install this and pay $20/mo?"
4. **Surface unknown problems.** Half the value is the thing they bring up unprompted.

## Who to interview

Target distribution across 12 interviews:

| Segment | Count | Sourcing |
|---|---|---|
| Indie operator (Persona 1) | 4 | X/Twitter, Indie Hackers, Claude Code Discord |
| Fractional CTO (Persona 2) | 3 | LinkedIn, fractional CTO Slack groups |
| Tooling-heavy solo dev (Persona 3) | 3 | OSS maintainers, MCP authors, Cursor power users |
| Team-lead (Wedge C signal) | 2 | YC Slack, AI-native startup founders |

Disqualify before scheduling:
- Hasn't run ≥ 2 agents in parallel in the last month
- Hasn't used Claude Code, Cursor, Devin, or Copilot CLI agent
- Lives entirely in a hosted IDE without local builds

## The interview (30 min)

### 0. Frame (2 min)
> "I'm researching how developers running multiple coding agents coordinate them. I'm not here to pitch; I'm here to learn. I'll send notes if you want them. Mind if I record?"

### 1. Context (5 min)
- "Walk me through the last time you had multiple agents running. What were they doing? Where were you?"
- "How many agents total in the last week? Which ones?"
- "What's your stack — Linear or Jira? GitHub? macOS or Linux?"

### 2. The friction map (10 min) — *the heart of the interview*
Ask each, then dig:
- "Tell me about the last time two agents tried to do something at the same time. What happened?"
- "How do you keep track of what each agent did yesterday?"
- "When an agent starts a session, how does it know what's been tried before?"
- "Have you ever had to manually intervene because two agents were stepping on each other? Tell me about it."
- "What do you do today to prevent these problems? Is there a workaround you've built?"

**Listen for:** concrete recent incidents, time burned, workarounds. If the answer is "honestly I don't run that many in parallel" → that's a falsification of H1.

### 3. Planning workflow (5 min)
- "Where does work for the agents come from? Linear, you in a doc, the agent inventing tasks?"
- "How do you decide which agent gets which work?"
- "Do you do sprint planning at all? What does it look like now vs. a year ago?"
- "What's the worst part of getting a task ready for an agent?"

**Listen for:** Linear-pull desire (H2), or strong preference for manual hand-off.

### 4. The brittle test (5 min)
- "Imagine a tool that runs as a daemon on your machine, knows which agents are running where, and gives them resource locks plus shared memory plus Linear pull. Walk me through whether you'd install it. What would stop you?"
- "What would have to be true for you to pay $20/month for cloud sync on top?"
- "What would make this a hard no?"

**Listen for:** specific resistance (security, hosted-first preference, "I have my own scripts"). These are H4 / H5 signals.

### 5. Close (3 min)
- "Who else should I talk to?"
- "Want to be a design partner for the local daemon? You'd get a private build and I'd pay close attention to your feedback."

## Scoring rubric

After each interview, fill out:

```yaml
interview:
  who: <name>
  segment: indie | fractional_cto | tooling_heavy | team_lead
  date: 2026-MM-DD
  duration_min: <n>

signals:
  agents_in_parallel_last_week: <n>
  primary_agent: claude_code | cursor | devin | copilot_cli | other
  uses_linear: yes | no
  hit_collision_last_30d: yes | no | unclear
  workaround_built: <description or "none">

hypotheses:
  h1_resource_pain: supports | falsifies | unclear
  h2_linear_pull: supports | falsifies | unclear
  h3_shared_memory: supports | falsifies | unclear
  h4_local_first: supports | falsifies | unclear
  h5_buyer_equals_user_will_pay: supports | falsifies | unclear

quotes:
  - "<exact phrase>"
  - "<exact phrase>"

surprises:
  - <thing they brought up that wasn't in the script>

next_steps:
  design_partner: yes | no | maybe
  intros_offered:
    - <name>
```

## When to stop interviewing

Standard saturation rules:
- **Continue** if interviews 1–6 produce conflicting signals on the same hypothesis.
- **Stop** when interviews 7–8 are mostly confirming what interviews 1–6 already showed.
- **Pivot the script** if you hit two consecutive interviews where the strongest pain isn't in the script (means a hypothesis is missing).

## Synthesis (after interview 8 or 12)

Produce a 1-page synthesis answering:
1. Which hypotheses were supported, falsified, or remain unclear?
2. What was the single sharpest pain reported across all interviews?
3. What surprises showed up more than once?
4. How many interviewees would install the Wedge B daemon today? Pay for it?
5. What changes to the build plan (`docs/plans/`) does this require?

The synthesis goes into `06-decision-log.md` as a discovery decision.

## Anti-patterns to avoid

- **Pitching.** Demoing the concept and watching their face is not discovery.
- **Asking for predictions.** "Would you use this?" is meaningless. Ask about past behavior instead.
- **Talking more than they do.** Aim for 80% them, 20% you.
- **Leading questions.** "Don't you find agent coordination frustrating?" → "Tell me about how you run multiple agents."
- **Selection bias.** Only interviewing your friends. Push for two cold intros per warm one.

## Related docs

- `02-icp-and-buyer.md` — hypotheses being tested
- `06-decision-log.md` — where discovery synthesis lands
