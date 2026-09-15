# Agent Note: Seven-reference foundation for a novel-authoring agent

Status: proposed

English | [中文](2026-08-22-novel-authoring-agent-foundation.zh.md)

## Problem

DeepSeek Harness is intended to become the runtime foundation for a Chinese web-novel authoring agent with a first-class terminal UI and a desktop application comparable in interaction quality to Codex Desktop and Claude Code's desktop-connected experience. The design must account for six local projects—DeepSeek Harness, Claude Code, Pi, OpenFic, OpenNovel, and MiroFish—and Tencent WorkBuddy as an official-documentation product reference.

The references overlap, but they do not provide seven interchangeable implementations. DeepSeek Harness has the strongest composable runtime and policy model but ships no in-tree TUI or native desktop shell. Pi has a mature terminal renderer and coding-agent interaction model but lacks the Harness permission and multi-agent control planes. OpenFic is the most complete fiction-writing product and desktop reference but brings a separate Python, LangGraph, React, and Electron runtime. OpenNovel has the strongest structured narrative concepts but is an Alpha CLI with material implementation defects. MiroFish is a social-simulation and report pipeline rather than an authoring Agent. The local Claude Code repository exposes product behavior, plugin protocols, and examples rather than the product core, and its code is not open-source licensed. WorkBuddy contributes a task-first desktop product model, but no local source snapshot or implementation reuse basis was available.

A useful design therefore needs one runtime owner, one authoritative novel state, one shared client protocol, two isolated non-canonical simulation sandboxes, and explicit reuse boundaries. Combining every available Agent loop, Session format, provider registry, graph, and store would produce duplicated authority rather than a stronger product. The separate [long-form creation characteristics benchmark](2026-08-22-long-form-web-novel-creation-characteristics.md) defines the narrative obligations used here; this note evaluates systems and architecture, not a particular novel premise.

## Audit scope and evidence boundary

This note describes the six local snapshots available on 2026-08-22 and official WorkBuddy product documentation retrieved on the same date. It combines entry documentation, manifests, focused implementation reads, relationship-oriented code graphs, tests where they clarify maturity, and cross-checks between claims and call sites. The generated graphs were code-only indexes stored outside every repository, so documentation-only claims were checked separately. No audited product source was changed.

| Project | Audited snapshot | Provenance and license | Evidence boundary |
|---|---|---|---|
| DeepSeek Harness | `xiaoshuo@528c682e0616`, package `0.1.1-rc.1` | Git checkout, MIT | Current source, architecture, package documentation, and shipped profiles |
| Claude Code | `main@8a8e81d098cb`, changelog `2.1.238` | Git checkout, Anthropic copyright and Commercial Terms | Public distribution repository, changelog, plugin examples, settings, and gateway samples; no core TUI, loop, session, or Desktop source |
| Pi | `main@5cd93f688aaa`, monorepo package `0.0.3` | Git checkout, MIT | Mature coding-agent path plus the separate unfinished AgentHarness v2 path |
| OpenFic | local package `0.10.1` | No local Git metadata, Apache-2.0 | Backend, frontend, Electron shell, prompts, storage, retrieval, and tests in an unpacked source snapshot |
| OpenNovel | local package `2.0.0`, classified Alpha | No local Git metadata, MIT | Python package, CLI, MCP server, schemas, storage, workflows, tests, and design documents in an unpacked source snapshot |
| MiroFish | `local/graphiti-memory@117ed37758cdc96f73b7d5e0d22713c50439695f`, dirty worktree | Git checkout, AGPL-3.0 | Current social-simulation pipeline, Web workflow, tests, and an uncommitted local Graphiti-memory experiment; no authoring transaction, TUI, or permissively reusable runtime |
| Tencent WorkBuddy | Official product documentation retrieved 2026-08-22 | No local source snapshot; implementation and reuse license not established | Product behavior, task UX, permissions, automation, collaboration, memory, model, and extension documentation only |

Capability labels in this note are deliberate: **shipped** means a user-reachable implementation exists in an audited snapshot; **experimental** means code exists without a stable or complete product path; **behavior reference** means public material documents product behavior but does not expose the implementation; **planned** means documentation describes a future surface; and **defective** means a concrete source path contradicts or breaks the advertised behavior.

Capability ledgers use compact evidence labels—`[S]` shipped, `[X]` experimental, `[B]` behavior reference, `[P]` planned, `[D]` defective, and `[—]` absent—separately from target actions: **Adopt** reuses a maintained implementation, **Adapt** reimplements a proven concept on Harness, **Integrate** invokes an optional external product through a bounded provider, **Reject** excludes the path, and **Build** implements a missing target capability. Qualifiers such as "public assets," "prompt methodology," "prototype schema," "coarse schema," "carefully," or "through clean-room reimplementation" describe the evidence or action without creating another label. Evidence maturity and novel usefulness are never collapsed into one score.

## Executive conclusion

The recommended product is not a fork of any one fiction application. It is a DeepSeek Harness profile and plugin family with a canonical Novel Project service, a Pi-based TUI client, an extended Harness Web client, a later Electron carrier, and an optional Simulation Lab. OpenFic and OpenNovel supply fiction-product, craft-method, schema, and negative transaction requirements. Claude Code and Pi supply interaction patterns. WorkBuddy supplies task-first desktop organization, progressive autonomy, deliverable-oriented Results, and collaboration references. MiroFish supplies simulation lifecycle and synthetic-reader concepts only. DeepSeek Harness remains the only owner of model execution, Session history, tools, permissions, approvals, subagents, workflows, credentials, and client transport.

The core invariant is: **conversation history is not novel canon**. Harness Session records the model-visible inputs, tool proposals, user decisions, and execution results. A separate Novel Project service owns accepted manuscript revisions, structured facts, story time, and bidirectional relationship/emotion state. Summaries, graph views, search indexes, embeddings, context packs, simulated events, and synthetic-reader reactions are rebuildable or counterfactual artifacts. No compaction summary, vector match, graph extraction, or simulation outcome may silently become authoritative story state.

Author-led co-creation is the default: the author can steer, branch, lock facts, select alternatives, reject typed changes, accept a revision, and roll back without reconstructing decisions from the transcript. Optional full automation is a pre-authorized subset of the same Harness workflow with fixed scope, budgets, stop rules, review gates, and acceptance policy; it is not a second loop and never implies publication. The product exposes the same domain commands, Results, and runtime events to both clients. The TUI and desktop application may render them differently, but neither client implements a second workflow engine or novel store.

## DeepSeek Harness capability summary

### Capability verdict

DeepSeek Harness is the target's execution and governance spine, not a fiction application. Its strongest asset is the [plugin-composed runtime](../deepseek-harness/docs/architecture.md): one owner for model requests, tools, durable interaction history, permissions, approvals, subagents, workflows, jobs, credentials, settings, and client transport. Its decisive absence is equally clear: it has no accepted novel-state model, chapter transaction, long-story retrieval policy, in-tree TUI, or native desktop shell.

### Capability tree

```text
DeepSeek Harness
|- Runtime: Agent Loop + LLM + Prompt + Tools
|- Record: Session Event Log + Persistence + Projections
|- Control: Permissions + Approvals + Questions + Credentials
|- Orchestration: Subagents + Workflows + Jobs + Schedules
|- Composition: Cordis Plugins + Profiles + Effects
`- Clients: Host/API + Web/PWA + SDKs
```

The tree represents shipped capability families, except that [Agent Teams is explicitly experimental](../deepseek-harness/docs/subsystems/agent-team.md). Subagents and workflows are shipped capabilities in the audited release family; a future novel product must not depend on private experimental team internals merely because team-shaped UX is desirable.

### Actual control and data flow

```text
TUI/Web input
  -> Agent inbox
  -> prompt sections + tool schemas
  -> Session-derived model history
  -> LLM stream
  -> tool call
  -> pre-execute policy
  -> provider execute
  -> post-execute
  -> Session events + projections
  -> TUI/Web render
```

The [architecture contract](../deepseek-harness/docs/architecture.md) requires every model-visible input to be reconstructable from Session events. The checkpoint policy persists buffered request events before model derivation and persists a top-level tool call before entering its body, so crash recovery can distinguish an unknown tool outcome from an action that never dispatched. Client presentation stays derived: the [Web client rules](../deepseek-harness/packages/client/AGENTS.md) keep render-only data out of the log while requiring new model-visible input to become an event. This is a strong audit trail for which control pack, user decision, and tool proposal influenced a draft; it is not proof that any extracted story fact is true.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Cordis plugins, profiles, and reversible effects | `[S]` architecture and shipped bundles | Mount novel storage, retrieval, review, import/export, TUI, and client presentation without specializing the core loop | **Adopt** |
| Agent loop, prompt sections, typed tools, and lifecycle events | `[S]` core runtime | Run Ask, Plan, Write, review, and commit Consumers through one auditable execution path | **Adopt** |
| Session log, JSONL/SQLite persistence, projections, query, and compaction | `[S]` durable interaction record | Reconstruct model-visible context, decisions, tool activity, and collaboration branches; never substitute it for canon | **Adopt** |
| Interaction, permission, approval, question, credential, and settings capabilities | `[S]` [interaction family](../deepseek-harness/packages/interaction/README.md) and providers | Enforce author-led approval, task scope, provider disclosure, and separate canon/publish authority | **Adopt** |
| Subagent providers, continuable children, workflows, background jobs, and schedules | `[S]`; Agent Teams `[X]`; worker threads are not a security boundary | Coordinate bounded research, planner, critic, continuity, and export jobs while retaining one parent policy plane | **Adopt** shipped seams; **Reject** dependency on experimental team internals |
| LLM, filesystem, shell, subprocess, Web, skill, attachment, workspace, hooks, and SDK capability families | `[S]` independently swappable providers and Consumers | Choose models, access project-local evidence, expose skills, and connect TUI/Desktop without a second generic runtime | **Adopt** selectively |
| Host plus React/Vite/PWA client and plugin slots | `[S]` Web/headless product path | Provide the shared desktop-facing protocol, task views, tool activity, subagents, approvals, settings, and domain UI slots | **Adopt** and extend |
| Novel hierarchy, ten clocks, typed character/relationship state, story time, promises, canon transaction, long-story retrieval, TUI, Electron | `[—]`; TUI is out-of-tree and Electron `[P]` | These are the domain and primary-client requirements defined by the creation benchmark | **Build** as complete novel capability seams and client bundles |

### Long-web-novel mapping

Harness directly helps the benchmark's author-authority, bounded-automation, provenance, multi-role coordination, and shared-client requirements. Permissions and approvals can distinguish Ask, Plan, Write, Accept, and Publish. Sessions and checkpoints can prove what the model saw and whether an execution outcome is known. Subagents and workflows can host an outline planner, relationship reviewer, continuity manager, or story-world simulation run under explicit budgets and parent authority. The Host, SDKs, and Web client provide one protocol for deliverable artifacts rather than forcing the TUI and desktop renderer to invent separate workflows.

Harness does not solve the benchmark's semantic clocks. A Session message mentioning grief does not create emotional residue; a plan item mentioning a reunion does not create a bidirectional relationship transition; a generic job does not isolate character knowledge; full-text Session search does not enforce story time or revision freshness. Books, volumes, arcs, chapters, scenes, progression evidence, promises, reader knowledge, mysteries, relationship debt, and ending convergence need a separate typed Novel Project service. Story-world and reader-reaction simulations require two domain-specific sandboxes even if Harness supplies their execution and permissions.

The shipped clients also stop short of the requested experience. The current profiles are Web and headless. The documented TUI example installs an out-of-tree bundle, and the GUI layering decision describes Electron as a later carrier rather than current code. Therefore Harness proves a reusable control and presentation protocol, not a mature CJK novel TUI or Codex/Claude-like desktop product.

### Reuse boundary and target responsibility

DeepSeek Harness is MIT-licensed local source and is the only reference adopted as the full runtime foundation. Reuse its public capability seams and preserve the rule that new behavior arrives through plugins. Do not put novel semantics into `agent-loop`, let Session or automatic memory become canon, treat workflow workers as a sandbox, depend on experimental Agent Teams, or count planned clients as shipped.

**Target responsibility:** DeepSeek Harness exclusively owns execution, policy, audit, provider routing, orchestration, transport, and extension composition; the Novel Project service exclusively owns accepted manuscript and canon.

## Claude Code capability summary

### Capability verdict

Claude Code is the strongest terminal interaction and staged-agent-workflow benchmark in this review, but its core is opaque. The local checkout contains 229 tracked files and exposes distribution material, a changelog, plugin examples, settings/MDM examples, and cloud-gateway samples; it contains no normal `src/`, application package, build manifest, or test suite for the TUI, loop, Session engine, Desktop bridge, or Remote Control. Product behavior and public plugin assets must therefore remain separate evidence classes.

### Observable capability tree

```text
Claude Code (opaque core)
|- Terminal UX: input + stream + diff + status
|- Session UX: resume + fork + rewind + compact
|- Orchestration: agents + teams + tasks + worktrees
|- Extension Plane: commands + agents + skills + hooks + MCP
|- Control: permissions + managed settings + Bash sandbox
`- Reach: terminal + IDE + Desktop + remote clients
```

The changelog is credible behavior evidence for full-screen and traditional rendering, multiline input, images, Markdown, syntax highlighting, diffs, context and task status, background-agent views, attach/detach, fork, resume, rewind, partial compaction, goals, cross-session messages, CJK/RTL/wide-character handling, accessibility, narrow terminals, mouse input, Windows, and PowerShell. It is not implementation evidence. Repeated changelog fixes for long resumes, fork chains, Unicode, background recovery, worktrees, Remote Control, and Windows show both the product's breadth and the engineering risk of using those behaviors as acceptance criteria.

### Public extension control flow

```text
startup
  -> scan plugin manifest
  -> register commands / agents / skills / hooks / MCP

task
  -> command or agent
  -> tool proposal
  -> PreToolUse hook
  -> opaque execution
  -> PostToolUse hook
  -> Stop hook / result
```

This is the deepest implementation flow the checkout can support. `plugins/plugin-dev/.../component-patterns.md` documents startup discovery and activation of commands, agents, skills, hooks, and MCP. `plugins/feature-dev/commands/feature-dev.md` implements a visible staged method—discovery, parallel exploration, clarification, alternative architecture, explicit approval, implementation, independent review, and summary. `plugins/code-review/commands/code-review.md` adds independent findings followed by separate validation. `ralph-wiggum` demonstrates a Stop-hook iteration guard, and `hookify` demonstrates editable event policies. The box labelled “opaque execution” cannot be expanded from this repository without inventing facts.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Terminal interaction, streaming, diff, status, CJK, Windows, accessibility | `[B]` product changelog; core source absent | Benchmark command entry, long-running progress, manuscript diff, approval, narrow/wide layouts, and Chinese input | **Adapt** behavior and acceptance tests; do not copy implementation |
| Resume, fork, rewind, branch, recap, partial compaction | `[B]` product behavior | Model alternate scene/outline trials and resumable collaboration; never equate transcript rewind with manuscript/canon rollback | **Adapt** UX concepts |
| Foreground/background agents, teams, tasks, dependencies, goals, worktrees | `[B]` product behavior | Benchmark editorial role status, bounded parallel review, dependencies, steering, and visible needs-input states | **Adapt** through Harness subagents/workflows; do not import code-centric worktree semantics unchanged |
| Remote Control across terminal-hosted sessions and web/mobile/Desktop/IDE | `[B]` behavior; implementation unavailable and gateway-constrained | Benchmark remote task inspection, pause, steering, and bounded approval | **Adapt** protocol goals; **Reject** as the DeepSeek bridge |
| Plugin manifest plus commands, agents, skills, hooks, MCP, and scripts | `[S]` readable public assets, not the private core | Organize bounded novel Skills, editorial Experts, policies, connectors, and progressive instructions | **Adapt** the organization; perform separate license review before copying any asset |
| Discovery → alternatives → approval → implementation → independent review | `[S]` executable public Markdown workflow | Map to premise/control-pack discovery, canon retrieval, alternatives, author approval, draft, continuity and relationship review | **Adapt** on Harness workflows |
| Permission rules, managed settings, Pre/Post/Stop hooks, Bash sandbox | `[B]` behavior plus public examples; sandbox is not universal isolation | Benchmark canon locks, write prompts, post-write extraction, stop gates, and enterprise configuration | **Adapt** policy behavior; keep Harness as authority |
| Novel hierarchy, ten clocks, typed emotion/relationship state, story time, canon transaction, long-story retrieval | `[—]` no fiction domain | None of the coding-agent features establishes story truth or emotional continuity | **Build** in Novel Project service |

### Long-web-novel mapping

Claude Code's best contribution to author-led co-creation is interaction grammar. A user can see what is running, what needs input, what changed, which branch they are in, and which agent is responsible. A novel product should offer the same legibility for a Director, Planner, Writer, continuity reviewer, relationship editor, promise/foreshadowing reviewer, and final critic. Code diffs become manuscript diffs; task goals become chapter acceptance criteria; a conversation fork becomes a draft alternative; hook decisions become canon locks and separate Accept/Publish gates.

The staged `feature-dev` method maps cleanly to evidence-first novel work: understand current canon, clarify the author's intent, compare outline or scene approaches, select one, draft only after approval, and run independent anchored reviews. The validated-review pattern is important because a critic model can invent contradictions. A Ralph-style loop is safe only for configured, mechanically observable conditions such as missing fields, broken references, explicit rule conflicts, repeated phrases, export validity, or bounded length. It must not optimize “emotion,” “romance,” or “quality” indefinitely and self-approve the result.

Nothing in this reference supplies the benchmark's long hierarchy, ten narrative clocks, bidirectional relationship ledger, emotional residue, reader/character knowledge split, story-time projection, simulation isolation, or atomic manuscript-plus-canon commit. Fork, rewind, compact, and worktree are interaction metaphors, not domain transactions. A relationship-editor agent described by a prompt remains L1 assistance until its proposals enter typed, durable, source-anchored state.

### Reuse boundary and target responsibility

`LICENSE.md` contains an Anthropic copyright notice and points to Commercial Terms; it is not an open-source license. No private core code exists locally to reuse, and the public examples do not grant a general right to copy the product. Model names, prompt caching, thinking controls, sandbox details, gateways, and Remote Control are Claude-specific; the changelog states that Remote Control is disabled for non-Anthropic base URLs, so it cannot become a ready DeepSeek desktop transport.

Use Claude Code as a behavior, workflow, extension-organization, reliability, and quality benchmark. Optionally **Integrate** the official product as a bounded external Harness subagent for author-authorized tasks. **Reject** any architecture that depends on its opaque runtime, copies proprietary core behavior from reverse inference, or treats Claude transcript state as novel canon.

**Target responsibility:** Claude Code defines a quality bar for interaction and staged work, while Harness and Novel Project own every implemented control, state, and commit in the target.

## Tencent WorkBuddy capability summary

### Capability verdict

WorkBuddy is the best task-first desktop product reference in the set, particularly for progressive autonomy, independent task workspaces, deliverable-oriented results, Expert taxonomy, permission UX, and scheduled work. Every conclusion in this section is `[B]` behavior documented by Tencent: no local source snapshot, internal architecture, reusable core API, SDK, or source license was available for verification.

### Documented capability tree

```text
WorkBuddy (documented product surface)
|- Task Envelope: mode + workspace + model + extensions
|- Autonomy: Ask + Plan + Craft
|- Roles: Expert + Expert Team
|- Access: Skills + MCP + Connectors + permissions
|- Results: files + browser + changes + artifacts
|- Continuity: concurrent tasks + memory + automation
`- Reach: desktop + mobile/IM companion
```

The official [task-bar documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Task-Bar) says Ask only answers and inspects, Plan first prepares an execution plan for confirmation, and Craft executes and may modify files. Each conversation is an independent task with an independent workspace and context, multiple tasks may run concurrently, and the user selects model, skills, connectors, and permission mode. This is a product contract, not evidence about how isolation or scheduling is implemented.

### Observable task flow

```text
user + task configuration
  -> task envelope
  -> [opaque WorkBuddy executor]
  -> Expert / Expert Team
  -> authorized Skill / MCP / Connector
  -> workspace or external service
  -> conversation + changes + artifacts
  -> optional cloud/mobile share
```

The [Expert Center](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Expert-Center) defines a Skill as an ability, an Expert as role plus methodology plus tools, and an Expert Team as multiple Experts plus a leader-led collaboration process. The leader decomposes, delegates in parallel, and integrates the deliverable. Experts do not acquire system access by role alone; Skill or MCP access remains under the user's authority. The bracketed executor remains opaque because the official pages describe results and controls, not call graphs or transaction boundaries.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Ask, Plan, and Craft | `[B]` official task documentation | Map to read-only consultation, review-before-write planning, and revision-scoped Write while keeping Accept and Publish separate | **Adapt** through Harness policies |
| Independent task context, workspace, model, extensions, permission, and concurrency | `[B]` official task documentation | Give each research, chapter, revision, audit, or simulation run an isolated envelope and scratch area | **Adapt**; scratch state never becomes canon |
| Right-hand Results with workspace files, browser, Changes, and Artifacts | `[B]` [results documentation](https://www.workbuddy.cn/docs/workbuddy/Results) | Make Draft, Diff, Canon Delta, Issues, Sources, Simulations, and Exports first-class deliverables rather than transcript fragments | **Adapt** in Web/Desktop and TUI protocol |
| Skill, Expert, and Expert Team taxonomy | `[B]` official Expert documentation | Separate bounded operation, configured editorial role, and multi-role Harness workflow; a relationship editor is an Expert, not a relationship database | **Adapt** product vocabulary |
| Default/full-access modes, workspace protection, high-risk confirmation, sandbox, backup/recycle behavior | `[B]` [permission documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Permission-Modes) | Keep authors productive while prompting on protected paths, deletion, scripts, network, external share, canon acceptance, and publication | **Adapt** UX; rely on Harness enforcement |
| User-visible, editable, deletable, disableable conversation memory | `[B]` [memory documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory); summaries may be biased or stale | Preserve collaboration preferences and habits, never characters, events, relationships, or world truth | **Adapt** carefully outside canon |
| Scheduled automation, history, workspace, identity, duration/frequency/concurrency limits | `[B]` [automation documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Automation-Guide) | Run backup, index rebuild, continuity audit, research digest, feedback import, and export preview | **Adapt** with explicit budgets and no default canon/publish right |
| TUI, novel hierarchy, ten clocks, typed relationship/emotion state, story-time projection, atomic chapter commit | `[—]` no documented fiction/runtime surface | These remain target-specific requirements | **Build** in Harness clients and Novel Project |

### Long-web-novel mapping

WorkBuddy contributes the clearest product expression of author-led collaboration. A novel task should visibly bind project, source revision, mode, workspace, permissions, models, Skills, Experts, budget, status, and result artifacts. Ask maps to canon consultation and analysis. Plan may prepare a rolling roadmap, chapter control card, relationship turn, simulation run, and Diff but cannot write. Craft maps to a Write stage constrained to an authorized draft revision. Canon acceptance, destructive overwrite, external sharing, and publication remain separate actions in every mode.

Its Results separation is more important than visual imitation. The conversation explains and accepts steering; the result area exposes the chapter, manuscript Diff, candidate canon changes, continuity and relationship issues, sources, simulation assumptions, and exports. Completion means a reviewable deliverable exists. This prevents authors from reconstructing the actual result by searching a long transcript and gives TUI and Desktop one artifact vocabulary.

The taxonomy also sharpens novel roles: a continuity query is a Skill; a relationship editor combines instructions, methods, model policy, and allowed Skills; an editorial team is a Harness workflow with a Director that delegates and integrates. Naming an Expert “relationship editor” does not satisfy the benchmark's bidirectional relationship ledger, two independent character arcs, boundaries, emotional debt, or source-anchored transitions. WorkBuddy documents no fiction schema that would make those states durable.

Automation is appropriate for recoverable support work and optionally for a predeclared bounded drafting run. It needs source revision, chapter limit, cost/time/retry ceilings, history, stop conditions, and a separate commit decision. In the target design, mobile or IM companions may inspect progress, preview artifacts, steer, pause, and approve bounded proposals; this is a target requirement, not a claim about WorkBuddy internals. They should not silently accept canon or publish. Cloud upload, shared libraries, connectors, MCP, OAuth services, and mobile delivery are explicit manuscript data destinations, not default conveniences.

### Reuse boundary and target responsibility

The [memory documentation](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Memory) explicitly warns that model-extracted memories may have summarization bias or freshness problems. That supports a visible preference memory but rules it out as story truth. The automation documentation also says unattended runs use the current login identity and may share data when invoking external models, MCP, connectors, OAuth services, or notification channels. Unpublished manuscripts therefore require destination disclosure and least authority.

No official page inspected for this report establishes an embeddable WorkBuddy core, a supported integration SDK for this architecture, a source-reuse license, a TUI, or an atomic manuscript-and-canon transaction. **Adapt** its task, result, Expert, permission, automation, and companion patterns. **Reject** adding an opaque second runtime or inferring internal guarantees from UI documentation.

**Target responsibility:** WorkBuddy defines the task-first desktop product grammar; Harness enforces it and Novel Project supplies all fiction semantics and authoritative commits.

## Pi capability summary

### Capability verdict

Pi contains the only mature, open-source, directly reusable TUI implementation among the audited local projects. Its current coding-agent path also provides valuable event, session-tree, extension, SDK, and JSONL RPC references. It must be split sharply from Pi's newer durable-session `AgentHarness` v2 scaffold, whose repository and protocol pieces exist but whose core Agent operations still reject as not implemented.

### Capability tree

```text
Pi mature path
|- pi-tui
|- pi-coding-agent
|  |- AgentSession
|  |- JSONL SessionManager
|  |- Extensions
|  `- SDK / JSONL RPC
|- pi-agent-core
`- pi-ai providers

Pi v2 [experimental]
`- durable Session repositories + AgentHarness scaffold
```

The mature path comprises Pi's `pi-coding-agent`, `pi-agent-core`, `pi-ai`, and `pi-tui` workspaces. The separate v2 path has lane and operation records, memory/JSONL/SQLite repositories, materialized views, writer leases, optional FTS, a CBOR protocol, and client/server packages, but `AgentHarness.create()` rejects restoration and `prompt`, skill, compact, tree navigation, resume, abort, queues, usage, idle, drive, watch, and lane operations all return `HarnessNotImplemented`. Storage sophistication does not make that scaffold a usable Agent runtime.

### Actual mature event flow

```text
Editor submit
  -> InteractiveMode
  -> AgentSession.prompt
  -> Agent.prompt / agentLoop
  -> pi-ai stream
  -> message + tool events
  -> tool execute + result message
  -> AgentSession persistence / extension events
  -> InteractiveMode subscription
  -> pi-tui differential render
```

`InteractiveMode` explicitly delegates business logic to `AgentSession`, subscribes to its events, and renders the resulting messages and tool activity through `pi-tui`. The low-level Agent handles context transformation, streaming lifecycle events, serial or concurrent tool calls, pre/post hooks, progress, error results, steering, follow-up queues, abort, idle waiting, and graceful turn stops. This is useful reference flow, but the target replaces the middle Agent and persistence owners with Harness; only the presentation adapter remains Pi-owned.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Main-screen scrollback and alternate-screen viewport, differential rendering, synchronized output, responsive stacks, nested scrolling, search, overlays, mouse, Markdown, images | `[S]` `pi-tui` source and README | Build wide/narrow project, transcript, diff, canon, issue, approval, and progress views without terminal flicker | **Adopt** `pi-tui` behind a Harness client adapter |
| Editor, bracketed paste, completion, multiline input, external-editor handoff, hardware cursor and CJK IME behavior | `[S]` TUI and coding-agent path | Support Chinese commands, anchored rewrites, large pasted notes, and handoff to a real long-form editor | **Adopt** and add novel-specific fixtures |
| AgentSession event subscription, streaming tool views, queued steer/follow-up, interrupt and status conventions | `[S]` mature coding agent | Benchmark responsive drafting, mid-run author steering, needs-input state, and non-blocking background presentation | **Adapt** events to Harness; do not reuse the loop |
| Parent-linked JSONL tree, in-file branches, fork, clone, labels, resume, export, compaction and branch summaries | `[S]` mature SessionManager | Reference alternative-draft navigation and resumable collaboration; generic branches and summaries are not manuscript revisions or canon | **Adapt** UX, **Reject** as domain authority |
| Extension tools, commands, keys, hooks, navigation, persistent entries, renderers, widgets, footer, prompts, themes, and skills | `[S]` public extension API | Add chapter navigation, manuscript Diff, canon proposal, relationship issue, simulation, and approval renderers | **Adapt** renderer and extension patterns |
| Same-process SDK and line-delimited JSON RPC | `[S]` programmatic modes | Reference an in-process TUI bundle or a strict process bridge while retaining one shared domain protocol | **Adapt** only where Harness transport needs it |
| Agent loop and broad `pi-ai` model/provider/credential registry | `[S]` mature but duplicates Harness ownership | Useful implementation reference, but running it would split model, tool, Session, approval, and credential authority | **Reject** the duplicate runtime |
| Permissions, sandbox, built-in subagents, plan mode, fiction schema, native desktop; v2 AgentHarness | `[—]` for current product controls/domain/Desktop; v2 `[X]` incomplete | Cannot enforce author policy, model ten clocks, or supply the Desktop product | **Build** in Harness/Novel Project; **Reject** v2 now |

### Long-web-novel mapping

Pi is strongest at the benchmark's TUI and author-steering layer. A wide terminal can combine project tree, transcript or manuscript Diff, and a contextual panel for agents, canon changes, relationship issues, promises, and approvals. A narrow terminal can collapse those panels into overlays. Search, application-owned scrolling, semantic prompt navigation, queued messages, custom tool renderers, and external-editor handoff directly support long sessions and focused rewrites. The main-screen renderer preserves normal terminal scrollback; the alternate-screen renderer can provide the Codex/Claude-style managed viewport and print a final document when it exits.

The terminal editor should not be forced into becoming a full rich-text novel workspace. Use it for commands, steering, small edits, review decisions, and anchored patches; open the author's editor for sustained prose. `pi-tui` renders ANSI lines, so it cannot be reused as a React or Electron component. Desktop consumes the same Harness and Novel Project events through a different renderer.

Pi's Session tree demonstrates discoverable branches and recovery, but it does not satisfy the benchmark's atomic chapter revision, story-time projection, or stale-index invalidation. Its compaction is intentionally lossy and cannot own character facts, emotional residue, male/female lead relationship transitions, promises, mysteries, or ending debt. Pi has no fiction schemas, semantic story retrieval, story-world/reader sandbox separation, publication pipeline, or cross-store commit.

The coding agent also deliberately omits built-in permissions, sandbox, subagents, plan mode, and MCP. Project trust controls resource loading, not execution confinement, and extensions/tools run with host authority. These omissions are acceptable in Pi's minimal philosophy but disqualify it from becoming the target runtime owner.

### Reuse boundary and target responsibility

Pi is MIT licensed, so selective code reuse is possible with the copyright and license notice retained. Pin a reviewed public `pi-tui` surface or vendor it through an explicit update process; avoid private internals. Reuse TUI components, interaction conventions, custom renderer ideas, and possibly SDK/RPC bridge patterns. Do not start `pi-coding-agent`, import the duplicate `pi-ai` registry, or adopt the unfinished v2 AgentHarness beside Harness.

**Target responsibility:** Pi owns terminal rendering components only; a Harness `novel-tui` bundle translates shared runtime and novel-domain events into those components, while Harness remains the sole loop and policy owner.

## OpenFic capability summary

### Capability verdict

OpenFic is the strongest directly inspectable fiction-product reference in the set. It already combines a React/TipTap writing workspace, an Electron carrier, persistent specialist agents, approval interrupts, revision-linked diffs, layered chapter context, hybrid retrieval, and unusually detailed Chinese fiction Skills. Its decisive limitation is not a lack of fiction knowledge but a lack of typed authority: outline, relationship, emotion, promise, foreshadowing, reader knowledge, and story-time rules remain Notes, free text, or prompt-produced worksheets rather than deterministically projected Novel Project state.

### Capability tree

```text
OpenFic
|- Clients: React/TipTap Web + Electron
|- API/Transport: FastAPI + WebSocket
|- Agent Runtime: Orchestrator + ReAct agents + checkpoints
|- Control: tool hooks + approvals + persistent threads
|- Project Store: project/volume/chapter/character/world/note
|- Revision Store: snapshots + rollback + diffs
|- Long Memory: layered summaries + hybrid retrieval
`- Fiction Skills: emotion + relationship + reader contract + state
```

The project entities, Agent configuration, revisions, and index records are shipped SQLModel-backed data. Composer, Writer, Reviewer, Auditor, Plan, Explore, Build, and Actor are configurable Agent roles with prompts, tool categories, Skills, allowed subagents, threads, checkpoints, queues, pause, and resume. The last tree branch has a different evidence type: the Skills are shipped and loadable, but their narrative structures are instructions to a model, not database schemas or enforced transitions.

### Actual writing and retrieval flows

```text
Assistant Sidebar
  -> WebSocket SessionRunner
  -> begin user revision
  -> LangGraph agent
  -> write_chapter proposal
  -> auth hook / approval interrupt
  -> chapter transaction + revision diff
  -> index stale/enqueue
  -> persisted events + UI diff
```

`SessionRunner` begins a user revision before the graph run and finalizes its status across completion, interruption, cancellation, persistence failure, and runtime failure. `auth_hook` allows, denies, or interrupts per tool; read-only tools default to allow and write tools default to ask. `write_chapter` is a write-level tool with an interrupt preview, requires the active revision, serializes changes under a volume lock, records before/after chapter diffs and Agent activity, refreshes counts, enqueues index work, and commits. This is a credible author-review and recovery path. It is not an atomic manuscript-plus-canon transaction because OpenFic has no separate authoritative canon delta, and several tool calls inside one revision may commit separately.

```text
chapter content
  -> SHA/freshness
  -> chunks
  -> vector search + FTS/BM25
  -> RRF
  -> optional rerank
  -> bounded chapter context
```

The chapter control pack is deliberately bounded: current chapter, nine preceding full chapters, summaries for the preceding middle window, older range summaries, and a recent title directory. Retrieval can run vector, FTS/BM25, or hybrid queries, fuse rankings with RRF, optionally rerank, and track source hashes and index freshness. This solves token allocation and stale-derived-data problems better than transcript-only memory, but it primarily indexes chapter prose and does not project the benchmark's ten clocks at the requested story time.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Responsive project tree, multi-tab TipTap editor, Agent sidebar, task/reasoning/subagent/approval views | `[S]` React client | Closest reference for the author workbench and for keeping manuscript, conversation, activity, and decisions visible together | **Adapt** as Harness Web/Desktop domain slots |
| Electron local/remote instance manager, portable Python lifecycle, version checks, backup, migration, restore, deletion, TXT import/export | `[S]` desktop and exchange paths | Benchmark local-first packaging, project portability, recovery, encoding detection, scoped export jobs, and cancellation | **Adapt** product behavior; do not retain the Python runtime |
| Project, Volume, Chapter, Character, WorldBook entry, Note, summary, Skill, rule, preference, thread, task, and index records | `[S]` persistent product model | Supplies a practical minimum editor/project inventory and chapter organization | **Adapt** useful fields; replace free-text narrative authority with Novel Project schemas |
| Configurable specialist Agents, child Agents, persistent threads, checkpoints, queues, pause/resume, and compaction | `[S]` LangGraph runtime | Demonstrates durable editorial roles and visible delegation for planning, drafting, reviewing, acting, and research | **Adapt** role UX on Harness; **Reject** the duplicate loop |
| Per-tool allow/ask/deny, interrupt previews, revision-linked snapshots/diffs/activity, and non-destructive rollback | `[S]` implemented control and revision paths | Strong reference for author-led proposals, anchored manuscript review, known failure states, and recoverable edits | **Adapt**; extend to one manuscript-plus-canon commit |
| Near full text, middle chapter summaries, far range summaries, title directory, and persisted conversation tail/summary | `[S]` context builders and compaction | Gives a concrete long-context budget instead of sending the entire book or trusting chat memory | **Adapt** as one input to a typed control pack |
| Vector, FTS/BM25, hybrid RRF, optional reranking, hashes, freshness, stale detection, and index jobs | `[S]` retrieval implementation | Finds distant prose evidence and makes derived-index freshness visible | **Adapt** behind Harness retrieval; add entity, fact, time, source, and revision filters |
| Emotional arc, character relationship, reader contract, story state, deconstruction, dialogue, opening, reversal, and prose Skills | `[S]` loadable prompt methodologies in YAML | Rich heuristics for emotional causality, relationship pacing, expectation debt, state selection, reader effect, and anchored review | **Adapt** selected methods into profiles, typed schemas, evaluators, and fixtures; do not treat prompt output as truth |
| TUI, typed outline/scene/beat, temporal canon, causal graph, bidirectional relationship entity, knowledge matrix, promise lifecycle, atomic cross-store commit | `[—]` absent as enforced domain capability | Required by the benchmark and not established by notes, prompts, retrieval, or revisions | **Build** in Novel Project and the Pi-based TUI |

### Long-web-novel mapping

OpenFic's fiction methods deserve more credit than a generic “prompt library.” `emotional-arc.yaml` separates the character's experienced emotion, the emotion conveyed by the text, and the reader's actual response; it also models trigger, buildup, release, aftertaste, stakes, and long-term investment. `character-relationship.yaml` distinguishes surface social relationship from private affect, expects deliberately asymmetric progress and information gaps, checks stage compatibility, gives both important characters independent change paths, and rejects a character whose life contains nothing beyond romance. `reader-contract.yaml` models expectation ownership, payoff, delayed-debt interest, benefit exchange, protagonist agency, and the debt created by new maps or mysteries. `story-state-tracking.yaml` selects only decision-relevant state, separates text fact, character knowledge, and analysis, prohibits future information from flowing backward, records source conflicts for adjudication, and tracks relationships, promises, injuries, resources, emotional position, and foreshadowing. These methods map directly to the benchmark's emotion, relationship-second-line, promise/payoff, information-fairness, and continuity checks.

They still stop at L1–L2 assistance. The output is generated text placed in a prompt, response, Note, or manuscript; there is no typed `RelationshipState(pair_id, A_to_B, B_to_A, social_stage, private_affect, trust, intimacy, commitment, boundaries, promises, debt, knowledge, evidence, valid_transition)`. No validator can prove that an attraction change was earned by a source scene, that both leads retained agency, that emotional residue survived ten chapters, or that a broken promise altered the ending plan. OpenFic revisions recover stored objects, but they do not calculate a canonical relationship or story-time projection from accepted events.

The Skills also mix transferable method with opinionated genre advice. Rules about who should pursue, “purity,” ideal partner status, chapter length, paragraph form, or a mandatory emotional rhythm are profile choices and sometimes harmful stereotypes, not platform invariants. The target should retain the useful dual-axis, asymmetry, agency, trigger/evidence, expectation-debt, and failure-check structures; it should make romance profile, tone, audience, boundaries, and excluded tropes author-configurable and test prompts for objectification or one-sided agency.

OpenFic therefore helps author authority, long-context allocation, chapter review, recoverability, relationship/emotion methodology, reader-contract inspection, and Desktop workflow. It does not solve the full hierarchy, all ten clocks, causal/spatial simulation, reader-evidence provenance, ending convergence, or the story-world versus reader-reaction sandbox split. Its rich editor can display those artifacts once Novel Project owns them; its existing free-text state cannot become their authority.

### Reuse boundary and target responsibility

The local snapshot reports version `0.10.1` and Apache-2.0 but contains no Git metadata, so its upstream commit and local modifications cannot be established. Revalidate provenance before copying code and preserve notices for any approved reuse. The Python/LangChain/LangGraph/LanceDB/FastEmbed runtime would duplicate Harness model, tool, Session, permission, credential, and orchestration ownership. Public FastAPI/Docker deployment also needs a new authentication, origin, secret, and exposure design; loopback Desktop defaults do not establish Internet safety.

Selectively **Adopt** only reviewed, well-bounded client or exchange code when that deletes more target code than it imports. **Adapt** the three-column workbench, approval cards, revision UX, layered context, retrieval freshness, backup/migration, specialist-role presentation, and selected fiction methodologies. **Reject** embedding OpenFic as a second runtime or promoting any Skill output, conversation summary, Note, or vector hit directly into canon.

**Target responsibility:** OpenFic defines the main fiction-product, editor, memory, revision, and methodology reference; Harness reimplements its control behaviors, and Novel Project turns selected methods into typed, source-anchored, author-approved state.

## OpenNovel capability summary

### Capability verdict

OpenNovel is the strongest narrative-schema and quality-pipeline prototype in the set, not a safe runtime or finished authoring product. Its valuable ideas are canonical IDs, structured character state, chapter/scene outlines, a story-time event ledger, causal and related-event links, foreshadowing state, authority-ranked context, anchored criticism, and human-reviewed state extraction. The same source also proves why those concepts must be reimplemented: its automatic path mutates authoritative state before recoverable manuscript persistence, several advertised paths are disabled or broken, and its relationship and emotion models are far too coarse for the benchmark's complete second story line.

### Capability tree

```text
OpenNovel
|- Interfaces: Typer/Rich CLI + MCP
|- Pipeline: Writer -> Critic -> Manager -> Director
|- Human Layer: Markdown manuscripts/settings
|- State Layer: frontmatter + SQLite events + snapshots
|- Semantic Layer: canon/subconscious vectors
|- Domain Models: characters + outlines + events + causal links
`- Global Control: foreshadowing + timeline + metrics
```

The package is version `2.0.0`, MIT-licensed, and classified Alpha. Character frontmatter uses canonical IDs, aliases, location, injuries, buffs, debuffs, five bounded emotion dimensions plus extras, inventory, and knowledge. A `ChapterOutline` contains typed scene IDs, descriptions, participating character IDs, emotional tone, word estimates, character arcs, plot points, rhythm, and target length. Events carry chapter, story-time text, one character ID, an event type, natural-language description, causal pressure, one causal parent, and non-causal related IDs. Foreshadowing distinguishes plot, character, theme, and world items with buried, in-progress, and closed states. These are real schemas, but schema presence alone does not establish correct extraction, projection, transactions, or author UX.

### Safe interactive path versus unsafe automatic path

```text
Interactive commit
chapter -> pre-snapshot -> Auditor -> diff
        -> per-event approval
        -> state/events
        -> summary/timeline

AutoRunner [unsafe]
outline -> Writer -> Critic <-> revise
        -> Manager mutates state/events
        -> snapshot
        -> chapter write
           ^ authoritative mutation already happened
```

The interactive `commit` command is OpenNovel's best author-led pattern. It snapshots affected frontmatter and the event rollback set, extracts candidate events, displays a state Diff, asks about every event, then applies only accepted events and updates summary and timeline. The chapter was already present and the snapshot never stores Markdown bodies, so this is a guarded state-extraction transaction, not atomic acceptance of new prose plus canon.

`AutoRunner` reverses the safety order. Its normal branch calls `Manager.update()`, which directly edits character frontmatter and appends events, before creating the nominal pre-write snapshot and writing the chapter. High-scoring chapters may defer Manager updates until a later batch with no matching snapshot. The snapshot records only `fm_before`, `fm_after`, and event IDs; it cannot restore rewritten prose. This flow can therefore leave state ahead of the manuscript, lose the chapter body on rollback, or retain partially applied updates after failure.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| Markdown human layer, frontmatter state layer, SQLite event ledger, snapshots, semantic canon/subconscious layer | `[S]` implemented prototype stores with dual-write risk | Establishes useful separation among author prose, current state, causal history, and low-authority inspiration | **Adapt** into one authoritative event/record service with rebuildable projections |
| Canonical character/location/item conventions, `CharacterFrontmatter`, `ChapterOutline`, and `SceneBreakdown` | `[S]` validated prototype Pydantic schemas | Seeds character state, chapter control cards, scenes, participants, tone, target length, arcs, and plot points | **Adapt** and expand for the full hierarchy, progression, goals, voice, emotion evidence, and story time |
| Typed event kind, chapter/story-time fields, causal pressure, one causal parent, related events, queries, projection, timeline, optional graph analysis | `[S]` useful event-store implementation; several payloads remain natural language | Supports continuity evidence, causal traversal, high-impact-event review, and historical state projection | **Adapt** after redesign with typed payloads, multi-entity participation, source spans, validity intervals, branches, and deterministic projectors |
| Plot/character/theme/world foreshadow types and buried/in-progress/closed lifecycle | `[S]` coarse schema and store; MCP surface `[D]` | Provides a starting vocabulary for open promises and delayed reveal | **Adapt** with truth, clue, reader/character knowledge, reveal prerequisites, payoff evidence, expiry, and ending debt |
| CANON, STATE_MEMORY, SUBCONSCIOUS authority classes and frugal/standard/panoramic context packs | `[S]` context assembly; advertised retrieval stack only partial | Correctly prevents inspiration fragments from outranking canon and makes context budget a task choice | **Adapt** authority and budget concepts; replace retrieval and require revision/time filters |
| Writer planning, alternative outlines, Critic scoring, anchored issues, local hot fix before whole rewrite, Manager extraction, Director pacing/tension guidance, metrics/traces | `[S]` fixed prototype four-role pipeline | Strong source for chapter control, evidence-anchored review, bounded repair, candidate comparison, and role separation | **Adapt** the responsibilities as Harness Skills/Experts/workflows; **Reject** the fixed runtime |
| Snapshot → Auditor → Diff → per-event approval → state/summary/timeline | `[S]` interactive CLI path, limited to state extraction | Best reference for author veto and granular canon proposals | **Adapt** into typed Canon Delta and one manuscript-plus-canon acceptance transaction |
| AutoRunner state order, deferred Manager, frontmatter-only rollback, empty chapter IDs, automatic Director scheduling, MCP auto-commit and broken foreshadow API | `[D]` concrete implementation defects | Demonstrates failure modes that can corrupt long-running story state or bypass the author | **Reject** every affected path; write transaction and automation semantics from first principles |
| Full-screen TUI, Web/Desktop editor, durable conversation/subagent control, general approval protocol, publication workflow, isolated simulations | `[—]`; GUI is `[P]` documentation | Cannot deliver the requested collaborative product or simulation laboratory | **Build** through Harness, Pi TUI, Novel Project, and later Electron |

### Confirmed implementation defects and claim gaps

- `Manager._apply_updates()` emits `EventCreate(chapter_id="")` with a comment claiming StateManager will fill it, but `StateManager.apply_event()` forwards the object unchanged. Chapter queries, timelines, and projections therefore lose their source anchor.
- `Writer` defaults to `AutonomousConfig(enabled=False)`, and `AutoRunner` does not pass another autonomy configuration. Even when AutoRunner chooses `write_with_autonomy()`, the autonomy runner returns the single model call instead of executing a mid-write tool loop.
- The generic SafetyFence budget/depth/timeout check is invoked before selected Writer hot fixes and Director analysis. The separate `check_canon_integrity()` method is not called from the production package, so the existence and tests of a canon checker do not protect generated chapters.
- Director `SKIP` and `INSERT` scheduling proposals mutate the remaining outline immediately; no approval is requested. `MERGE` only writes a not-implemented log entry.
- MCP `commit` snapshots and extracts, then calls `apply_confirmed_events(result.events, ...)` for the entire result without the CLI's per-event review. The same operation name therefore has different author-authority semantics across interfaces.
- CLI `write` concatenates model output in memory and prints it but never persists the new text. MCP foreshadow uses removed `id`, `target_chapter`, `ACTIVE`, and `RESOLVED` members instead of the current `foreshadow_id`, `expected_close_chapter`, `BURIED`/`IN_PROGRESS`/`CLOSED` schema.
- README claims for FTS5, reranking, and reindexing are not supported by the inspected package; the hybrid retriever appends SQL and vector results rather than implementing the advertised fusion stack. CI still checks the obsolete `loom/` path instead of `opennovel/`, so its configured lint, type, and coverage jobs do not validate this package.
- Frontmatter and EventStore both carry current state, while several projectors infer updates from natural-language descriptions. This creates an authority and dual-write problem even after the explicit ordering bugs are fixed.

### Long-web-novel mapping

OpenNovel covers more of the benchmark's vocabulary than any generic coding agent. Scene-aware outlines help the long hierarchy and chapter loop. Story-time events, causal links, character knowledge, timeline export, and source chapter fields point toward continuity and information fairness. Foreshadow state points toward promises and ending convergence. Authority-ranked context correctly separates canon, current memory, and speculative inspiration. Critic anchors and local repair support the requirement that review cite the exact prose it wants to change. Metrics and traces can expose cost and quality-loop behavior without pretending that a score proves literary quality.

It still represents only fragments of the ten clocks. `timestamp` is an unvalidated string rather than a calendar/interval and travel model; an event has one `character_id` rather than explicit participants and typed effects; causal pressure is a score, not proof of causality; a foreshadow record does not separate objective truth, clues, each character's knowledge, reader knowledge, misleading hypotheses, or reveal evidence. Progression tiers, resources and costs, map rules, reader-contract debt, chapter payoff, voice, publication state, and ending dependencies need new schemas.

The relationship gap is structural. `RELATIONSHIP_CHANGE` is only an event enum whose payload has one character ID and a natural-language description. There is no pair identity, both parties' independent goals, A-to-B versus B-to-A state, public/social versus private/emotional axes, stage, trust, intimacy, respect, commitment, conflict, consent/boundary state, promises, emotional debt, shared memories, asymmetric knowledge, source evidence, or allowed transition graph. `EmotionVector` is a five-number snapshot plus extras; it cannot express trigger, object, appraisal, suppression, performed versus felt emotion, bodily evidence, misreading, accumulation, decay, residue, or the decision caused by the emotion. OpenFic's prompt methods are richer here even though OpenNovel's storage is more typed.

The target needs a redesigned `RelationshipState` keyed by pair and story-time validity, with directional states, both character goals and boundaries, public/private stages, trust/intimacy/respect/commitment/conflict, promises and debt, asymmetric knowledge, event/source evidence, permitted transitions, and main-line consequences. Emotion needs an event-derived state with trigger, target, appraisal, expression, concealment, intensity, residue, evidence, and downstream choice. Neither state may be inferred once and silently overwritten; accepted events update it through deterministic projectors, and the author reviews the relationship/emotion Delta beside the manuscript Diff.

For author-led work, the interactive commit sequence should become the default but move before all authoritative changes and include the manuscript. For optional full automation, a workflow may draft, critique, repair, extract, and simulate on a private branch under chapter/cost/time/retry limits. It may auto-accept only under an explicit project policy; it must still produce the same Diff, Canon Delta, relationship/emotion Delta, evidence, and recoverable transaction. The current AutoRunner cannot be wrapped to obtain those guarantees.

### Reuse boundary and target responsibility

OpenNovel is MIT-licensed but the local unpacked directory has no Git metadata, so provenance and local modifications must be pinned before any copying. **Adapt** its domain vocabulary, small schema ideas, authority ranking, critic anchors, local-repair policy, event-query concepts, and granular interactive review. **Reject** AutoRunner, StateManager, current snapshots/projectors, MCP mutation handlers, retrieval claims, fixed four-Agent execution, and any assumption that the Alpha label or tests establish end-to-end safety.

Do not embed OpenNovel beside Harness or let its frontmatter/EventStore become a second canon. Reimplement the selected concepts as complete Harness capability seams and a single Novel Project transaction model, with unit, lifecycle, recovery, assembled snapshot, and client-protocol coverage.

**Target responsibility:** OpenNovel supplies the primary domain vocabulary and negative transaction lessons; Novel Project owns their redesigned schemas and projections, while Harness owns every Agent, policy, approval, and automatic run.

## MiroFish capability summary

### Capability verdict

MiroFish is a specialized social-simulation and report pipeline, not a Codex/Claude-style authoring Agent and not a reusable novel runtime. Its actual path is seed material → speaking-subject ontology → temporal graph → social personas and environment → OASIS Twitter/Reddit simulation → action ingestion → graph-assisted report and interviews. Its highest target value is the Simulation Lab: temporal episodes, append-only action timelines, post-run memory-drain completion, graph-reader lifecycle, role interviews, and synthetic-reader cohort ideas. Reader-reaction simulation is closer to what it already implements; a story-world sandbox requires a new ontology, state model, action engine, and deterministic branch protocol.

### Capability tree

```text
MiroFish
|- [S] Seed Intake: PDF/Markdown/TXT + prediction requirement
|- [S] Social Ontology: speaking subjects + typed relations
|- [S] Temporal Graph: episodes + historical relationships
|- [S] Personas/Config: profiles + activity + stance + influence
|- [S] Simulation: OASIS Twitter || Reddit environments
|- [S] Memory: actions -> episodes -> pending-drain barrier
|- [S] Analysis: Quick/Panorama/Insight/Interview -> report
|- [S] Client: five-stage Web progress + action timeline
|- [X] Local Memory: Graphiti + Neo4j + SQLite + Ollama
`- [—] Authoring: manuscript/canon/diff/approval/TUI
```

The shipped ontology is intentionally for social-media opinion simulation. Its prompt requires exactly ten entity types, reserves `Person` and `Organization` fallbacks, requests six to ten relationships, excludes abstract concepts, and expects every entity to be a subject capable of speaking as an account. That is defensible for social agents but is not a story-world ontology: locations, objects, techniques, injuries, secrets, rules, travel, combat, and resources need to exist without pretending to be social accounts.

### Actual current data flow

```text
PDF/Markdown/TXT + prediction requirement
  -> extract / chunk / sample source text
  -> LLM social ontology
  -> temporal subject graph
  -> LLM personas + activity/environment config
  -> OASIS subprocess
       |- Twitter environment
       `- Reddit environment
  -> per-platform actions.jsonl
  -> action-to-episode graph updater
  -> flush queue + wait for pending episodes
  -> Quick / Panorama / Insight / Interview tools
  -> ReportAgent outline + section ReAct
  -> report + logs + interactive interviews
```

The two OASIS environments run concurrently through `asyncio.gather`, but they are independent social platforms rather than one shared physical and causal world. Each round randomly selects active Agents and gives each an `LLMAction`; Twitter supports post/like/repost/follow/quote-style actions and Reddit supports post/comment/vote/search/trend-style actions. Interview is a manual action sent to the still-running environment and answered by its LLM Agent. The source's “real answer, not LLM simulation” wording is therefore inaccurate: the answer is live within the synthetic environment, but it remains model-generated.

At upstream HEAD, graph operations use Zep Cloud. The audited dirty branch adds an uncommitted loopback Graph Memory client and FastAPI sidecar backed by Graphiti, Neo4j, SQLite task/batch metadata, and local Ollama embeddings; graph extraction and simulation/report reasoning still use remote LLM configuration. This local path is `[X]`, not a released upstream capability. It also illustrates the correct authority direction only partially: graph memory is a derived simulation store, but MiroFish does not have an accepted manuscript/canon source above it.

### Capability ledger

| Capability | Evidence and maturity | Long-web-novel value | Target action |
|---|---|---|---|
| PDF/Markdown/TXT intake, full-text persistence, chunking, representative sampling, and natural-language simulation requirement | `[S]` API and file-processing path | Import a frozen manuscript or outline and define a bounded experiment without placing the whole book in one prompt | **Adapt** through Novel Project import and SimulationRun inputs |
| LLM-generated social ontology, Pydantic entity/relation models, graph creation, batch ingestion, status polling, caller-generated graph/operation IDs, and lost-response reconciliation | `[S]` graph construction path | Provides strong lifecycle ideas for derived temporal graphs and idempotent long-running ingestion | **Adapt** operation and provenance discipline; **Reject** the speaking-subject ontology for story truth |
| Persona generation with identity, biography, demographics, interests, social statistics, stance, sentiment, activity, response delay, and influence | `[S]` OASIS preparation path; failures can silently fall back to templates | Useful seed for diverse synthetic-reader cohorts and visible simulation assumptions | **Adapt** reader-cohort configuration; redesign story characters around goals, knowledge, resources, values, relationships, and source time |
| Parallel Twitter and Reddit OASIS environments with platform actions, per-round active-Agent selection, logs, start/stop, and live interview IPC | `[S]` simulation subprocess | Demonstrates multi-agent reaction traces, propagation, social discussion, and post-run interrogation | **Adapt** for synthetic-reader experiments; **Reject** as proof of a causal story-world engine |
| Append-only `actions.jsonl`, action-to-timestamped-episode conversion, queue/batch/flush, pending-ingestion wait, and final completion only after a successful drain | `[S]` memory-updater and runner lifecycle | Excellent model for simulation event provenance and for preventing “complete” before derived memory catches up | **Adapt** the action ledger and drain barrier; persist retry state and keep it non-canonical |
| QuickSearch, Panorama, InsightForge subquestions, graph history, Agent selection, interviews, outline planning, section ReAct, reports, progress, and full logs | `[S]` report path; quality/factuality not validated | Supports continuity/simulation review, role hot-seats, competing hypotheses, and inspectable evidence-gathering traces | **Adapt** bounded tools and citation requirements; label every interview/report as synthetic |
| Five-stage Vue flow for intake, graph visualization, persona/environment preparation, action timeline, report generation, Agent chat, single-role interview, and group survey | `[S]` Web client | Good reference for a Simulation Lab progress view, event timeline, logs, assumptions, and interactive result exploration | **Adapt** as a domain panel inside the shared Desktop client; it is not the author workbench or TUI |
| Loopback Graphiti/Neo4j/SQLite/Ollama graph-memory service | `[X]` uncommitted local dirty-worktree experiment | Demonstrates a possible local derived-graph provider and loopback/token/proxy hygiene | **Reject** as evidence of released capability; evaluate a clean Harness provider independently |
| Manuscript tree/editor, chapter control pack, Diff/Canon Delta, typed story state, author approvals, branch/replay, deterministic simulation, TUI/Desktop task control | `[—]` absent | These are prerequisites for using simulation safely during novel creation | **Build** before integration; MiroFish never owns accepted story state |

### Story-world and reader-reaction mapping

```text
                         accepted revision R
                                  |
                    frozen read-only simulation input
                    +-------------+-------------+
                    |                           |
          STORY-WORLD SANDBOX          READER-REACTION SANDBOX
          characters + factions        reader cohorts
          goals + resources            presented text only
          role-scoped knowledge        reading history
          causal actions               social reactions
                    |                           |
          counterfactual events         hypotheses + variance
                    +-------------+-------------+
                                  |
                         SimulationRun artifact
                                  |
                       author/policy review only
                                  X
                         no direct canon write
```

The target builds the story-world sandbox first, as requested, but it cannot obtain that capability by relabeling MiroFish accounts. World agents must act as inhabitants at a chosen story time and read only their own beliefs, goals, resources, location, capabilities, relationships, and perceived evidence. The engine needs typed actions such as move, observe, conceal, reveal, bargain, train, fight, refuse, sacrifice, promise, betray, and repair; explicit preconditions and effects; a shared counterfactual world state; a fork point; run identity or seed; bounded time; and comparable branches. Objective events, each character's beliefs, and reader-visible information must remain separate. MiroFish contributes temporal episodes, graph querying, subprocess lifecycle and fault separation, action logs, interviews, and drain discipline—not these missing semantics.

The later reader-reaction sandbox is a closer adaptation. Cohorts can represent progression/payoff readers, worldbuilding analysts, pace-sensitive readers, relationship-line readers, male- or female-lead fans, ensemble fans, logic/fairness reviewers, established followers, and new readers. They receive only the text and reading history visible at that point, never hidden canon or future outlines. Their posts, comments, confusion, anticipation, trust, boredom, emotional response, CP discussion, dropout reasons, and disagreement can produce hypotheses about hooks, payoff, information load, character agency, relationship chemistry, foreshadow visibility, and serialization fatigue. Multiple runs must expose variance and later be calibrated against provenance-bearing real feedback. Synthetic response is neither market demand nor a substitute for readers.

MiroFish's current persona text, `sentiment_bias`, `stance`, and generic graph edges cannot model the male/female lead relationship. A story-world run needs the Novel Project's bidirectional, time-scoped `RelationshipState`: each lead's goal, belief, attraction, trust, respect, intimacy, commitment, hurt, resentment, boundary, promise, debt, known secrets, perceived intent, and source-event evidence. A reader run separately evaluates whether the text made those transitions legible and earned. Neither simulation may turn “predicted chemistry” or a synthetic preference into a relationship fact.

Every run consumes a frozen accepted revision and produces a `SimulationRun` artifact with sandbox type, source revision, assumptions, ontology/persona/model versions, role knowledge policy, run identity or seed, budgets, action/reaction trace, failures, variance, and limitations. Stores, queues, tools, and result types remain separate between the two sandboxes. A simulation may propose a future scene, missing reaction, consequence, or revision; only the normal Write → review → Accept transaction can change manuscript or canon.

### Evidence limits, maturity, and risks

An external Graphify index of the current `backend/app` working tree supports the reported static centers around `SimulationRunner`, `SimulationManager`, `ZepToolsService`, `OasisProfileGenerator`, and `ReportManager`. The graph is `directed:false`; its cross-module links include `INFERRED` edges, and it excludes the frontend, OASIS launch script, and local Graphiti sidecar. It cannot prove runtime call order, concurrency correctness, privacy, capacity, simulation fidelity, or the README's “thousands of Agents” claim.

The implementation has no random-seed protocol, deterministic replay, simulation branch/fork comparison, manuscript Diff, canon transaction, tool permission plane, or author acceptance gate. Task tables and important lifecycle locks are process-local, project/simulation/report state is often overwritten as JSON without cross-process transactions, and failed graph-memory batches remain in memory. Panorama materializes the full graph. There are mocked/unit tests around parsing, paging, retry, lifecycle, drain, and preparation, but no frontend tests, real OASIS end-to-end gate, factual-report evaluation, authorization/path-security suite, load benchmark, or deterministic replay suite.

The main Flask application has no application authentication and configures permissive CORS; upstream deployment defaults and Docker exposure can make that dangerous, while the dirty local branch changes the main bind to loopback and the sidecar adds loopback, bearer-token, constant-time comparison, and disabled environment proxies. A default secret, detailed error traces, extensive prompt/tool/report logs, externally supplied IDs used in filesystem paths, and temporary report files also require redesign before manuscript use. “Local” must be a verified deployment property, not an assumption inherited from Desktop-like UX.

MiroFish is AGPL-3.0. Copying, modifying, or tightly integrating its code or prompts may create source-availability obligations, including for modified network use. Whether a separate service is mere aggregation cannot be guaranteed by this technical note and needs legal review. If the target does not adopt AGPL, use clean-room concept reimplementation through Harness capability seams; separately review OASIS, Camel, Graphiti, Neo4j, and other dependency licenses.

### Reuse boundary and target responsibility

**Adapt** through clean-room reimplementation the temporal episode/provenance ideas, client-generated operation IDs and reconciliation, append-only simulation actions, completion-after-drain rule, process-local graph-reader lease, role interview, search-tool separation, staged progress, action timeline, and synthetic-reader cohort methodology. **Reject** MiroFish as an Agent runtime, authoring client, canon store, relationship model, story-world engine, security baseline, or proof that social simulation predicts readers or plots. **Integrate** no code-level component without provenance, license, security, and dependency review.

**Target responsibility:** MiroFish defines Simulation Lab concepts only; Harness owns execution and isolation, Novel Project supplies frozen typed inputs, each sandbox owns counterfactual state, and its results can reach Results/Review but never Canon or Publish directly.

## Comparative decision matrix

| Reference | Best evidenced asset | Evidence class | Long-web-novel contribution | Decisive limit | Target action |
|---|---|---|---|---|---|
| DeepSeek Harness | Plugin-composed runtime, durable Session record, permissions, approvals, subagents, workflows, providers, and shared client transport | `[S]` local source; Agent Teams `[X]`; native TUI `[—]`; Electron `[P]` | Sole execution, governance, audit, orchestration, and transport spine for author-led and bounded automatic work | No accepted novel model, chapter transaction, relationship state, long-story retrieval policy, in-tree TUI, or native desktop shell | **Adopt** as the only runtime authority; **Build** novel capability seams and clients on it |
| Claude Code | Legible terminal interaction and staged Agent work: stream, Diff, status, resume, fork, rewind, approval, independent review, and remote steering | `[B]` product behavior plus `[S]` public assets; core implementation is opaque and proprietary | Acceptance behavior for visible progress, alternatives, manuscript Diffs, role status, staged approval, and bounded remote steering | Public repository cannot prove the private loop, TUI, Session engine, Desktop bridge, or fiction semantics | **Adapt** behavior/workflow grammar; optionally **Integrate** the official product through a bounded provider; never copy or infer the core |
| Tencent WorkBuddy | Task envelope, Ask/Plan/Craft, Results/Artifacts, Experts/Teams, permissions, memory, automation, and desktop/mobile continuity | `[B]` official product documentation only | Task-first Desktop model, artifact-first completion, progressive autonomy, configured editorial roles, and scheduled maintenance patterns | No reusable implementation, TUI, novel schema, canon transaction, or evidenced internal isolation model | **Adapt** documented UX concepts on Harness-owned interfaces; memory remains non-canonical |
| Pi | Mature `pi-tui`, CJK-capable editor/renderer, differential updates, external-editor handoff, and proven interactive event path | `[S]` mature path; AgentHarness v2 `[X]` and incomplete | First-class terminal mechanics for Chinese input, streaming prose, Diffs, approvals, branches, and interruption recovery | No built-in permissions, sandbox, Plan, subagents, workflows, or novel semantics; its loop/providers duplicate Harness | **Adopt** maintained `pi-tui`; **Adapt** renderer patterns; **Reject** duplicate runtime/providers and v2 as foundation |
| OpenFic | TipTap editor, Electron, persistent specialist Agents, approvals, revisions, rollback, layered chapter context, hybrid retrieval, and fiction Skills | `[S]` unpacked product snapshot; emotion/relationship methods are `[S]` prompt methodologies | Principal editor/Desktop reference, chapter revision UX, retrieval freshness, and rich emotion, relationship, reader-contract, and state methods | No TUI; duplicate Python/LangGraph runtime; no typed story time, causality, or relationship authority; unknown Git provenance; opinionated prompts | **Adapt** product behavior/methods; selective Apache reuse only after provenance review; **Reject** its runtime as a second authority |
| OpenNovel | Typed character, outline, event, causal-link, foreshadowing, authority-context, critic, and interactive per-event review concepts | `[S]` prototype schemas plus multiple `[D]` production paths | Strongest vocabulary for story time, causal events, anchored review, state proposals, and local repair | Unsafe transactions; defective AutoRunner/MCP/autonomy/retrieval/CI paths; relationship event is not a bidirectional entity | **Adapt** redesigned schemas/review; **Reject** AutoRunner, StateManager, snapshots, MCP writes, and current pipeline |
| MiroFish | Temporal episodes, social simulation, action timelines, memory-drain barrier, role interviews, graph-assisted reports, and staged simulation UI | `[S]` social-simulation source; local Graphiti path `[X]` in a dirty worktree | Simulation Lab concepts, especially action provenance, synthetic-reader cohorts, interviews, temporal projections, and drain discipline | Not an authoring Agent; Twitter/Reddit are not a causal story world; no manuscript/Canon transaction, deterministic replay, TUI, or approval plane; AGPL | **Adapt** concepts through clean-room Harness plugins; **Reject** runtime/canon reuse; require legal review before code integration |

No reference provides the complete target. The design adopts one runtime, one story authority, one shared presentation protocol, and two non-canonical simulation sandboxes; every other contribution is a bounded implementation, behavior, craft-method, or domain reference.

## Target capability model

### Authority and system boundaries

The target has four distinct authorities: the author owns creative intent; a task policy grants bounded operational authority; Harness owns execution and audit; Novel Project owns accepted story truth. Full automation does not transfer creative authority to a model. It executes only the arrows, narrative units, tools, budgets, checks, retries, and acceptance decisions named by a saved author policy.

```text
                         AUTHOR = creative authority
                  steer / branch / approve / roll back
                                     |
      Pi TUI ------ same typed Novel Protocol ------ Web / Electron
                                     |
                           Task authority policy
 Ask | Plan | Write | Accept | Publish | scope | budgets | stop rules
                                     |
+------------------------ DeepSeek Harness --------------------------+
| model execution | Session audit | tools | permissions | approvals |
| subagents | workflows | providers | credentials | client transport |
+------------------------------------+-------------------------------+
                                     |
                         Novel workflow Consumers
 Director | Planner | Researcher | Writer | Continuity | Critic
                                     |
                  proposal + diff + anchored typed delta
                                     |
+----------------------- AUTHORITATIVE BOUNDARY ---------------------+
| Novel Project service = sole story authority                       |
| manuscript revisions + canon events + story time + relationship    |
| state + provenance + atomic acceptance + auditable rollback        |
+-------------------------+----------------------+-------------------+
                          |                      |
                rebuildable projections      frozen revision R
                          |                      |
       summaries / FTS / vectors / graph    Simulation Lab
       / context packs / dashboards          |- Story-world sandbox
                                             `- Reader sandbox
                                                  |
                                            proposals only
                                                  X direct canon/publish
```

| Concern | Sole target owner | Reference influence | Invariant |
|---|---|---|---|
| Creative direction, locked decisions, profile, and acceptance policy | Author | Creation benchmark | Models may propose alternatives but cannot silently redefine intent or grant themselves authority |
| Model execution, tools, permissions, approvals, Session audit, subagents, workflows, credentials, and transport | DeepSeek Harness | DeepSeek Harness | No other reference runtime mirrors or owns these responsibilities |
| Task mode and bounded automation policy | Novel task-policy capability on Harness Interaction | Harness, WorkBuddy, Claude Code | Automation uses only pre-authorized arrows and cannot widen scope or imply publication |
| Accepted manuscript, canon, story time, revisions, and approval provenance | Novel Project service | OpenNovel schemas and OpenFic revisions | This is the only story authority; chat, memory, graph, summary, and `SimulationRun` artifacts are never canon |
| Character, emotion, and bidirectional relationship state | Novel Project character/relationship capability | Creation benchmark and OpenFic methods; gaps exposed by OpenNovel and MiroFish | Every accepted change is time-scoped, passage-anchored, and committed with the manuscript revision |
| Structured, exact-text, semantic, graph, and summary retrieval | Rebuildable Novel Retrieval providers | OpenFic, OpenNovel, MiroFish | Every result carries source revision and freshness; retrieval never writes canon |
| Editorial roles and multi-Agent coordination | Harness workflows, presets, and subagents | WorkBuddy Experts, Claude staged work, OpenFic roles, OpenNovel vocabulary | Roles produce proposals and issues; only Accept changes project truth |
| Terminal and Desktop clients | Novel TUI plus Harness Web/Electron presentation | Pi, OpenFic, Claude Code, WorkBuddy | Clients render one protocol and own neither loop, credentials, tool execution, nor story state |
| Story-world and synthetic-reader experiments | Isolated Simulation Lab providers | MiroFish concepts | Both read frozen revisions, enforce separate knowledge scopes, and return counterfactual artifacts only |
| Export, external share, remote access, and publication | Destination-specific output capabilities | WorkBuddy and Claude remote behavior | Write or Accept permission never implies Publish permission |

### Task envelope and autonomy modes

The product exposes five permissioned stages. **Ask** is read-only and may inspect, retrieve, compare, and explain. **Plan** may create control packs, outlines, alternatives, simulation requests, typed proposals, and Diffs but cannot modify a draft. **Write** may create or edit only a draft inside the authorized project, source revision, and narrative-unit scope. **Accept** performs the expected-revision transaction that changes accepted prose and canon. **Publish** previews and sends an accepted artifact to one named destination. Destructive overwrite, deletion, external sharing, and publication remain separate permissions in every configuration.

```text
ASK ------> evidence + explanation
PLAN -----> alternatives + control pack + simulations + diffs
WRITE ----> draft revision + anchored issues + typed proposals
ACCEPT ---> expected-revision check + atomic manuscript/canon commit
PUBLISH --> destination preview + separate authorization

author-led = explicit steering and approval at configured gates
full-auto = pre-authorized subset + fixed scope + budgets + stop rules
full-auto != self-expansion, self-approval, silent canon mutation, or publish
```

Every task has a stable task ID, Harness Session, selected project and source revision, scratch workspace, authorized stages and narrative units, permission profile, models, Skills, Experts, connectors, cost/token/wall-time budgets, retry and rewrite ceilings, stop conditions, status, and typed result artifacts. Tasks may run concurrently, but Accept uses expected revision identity and serializes conflicts. Scratch files, browser state, retrieved context, conversation memory, and simulation state are disposable task inputs; none is accepted story state.

Author-led mode is the default. The author can change the control pack, lock a fact, choose an alternative, steer or pause a run, reject any typed Delta, Accept a revision, branch, and roll back without transcript archaeology. Task completion means a reviewable Result Packet exists, not merely that an Assistant emitted a final message. The packet links analysis or Draft, manuscript Diff, Canon Delta, Relationship/Emotion Delta, promise/clue/timeline changes, anchored Issues, Sources, SimulationRuns, Exports, and the approval or commit outcome.

Bounded full automation selects a subset of the same stages under a saved policy. The policy fixes source revision, authorized volumes/chapters/scenes, models and tool permissions, chapter or scene count, budgets, retries, rewrite ceilings, deterministic gates, reviewer escalation, natural closure, and whether Accept is allowed. If Accept is not explicit, the run stops with proposals. If it is explicit, acceptance still uses the same transaction and cannot rely solely on a model scoring its own output. Publish is never implied. The run stops on ambiguous canon, a locked-fact conflict, stale source state, repeated validation failure, budget exhaustion, scope expansion, an author-owned relationship/ending choice, or completion of the authorized unit.

### Authoritative project data

The Novel Project service owns accepted content and facts. Its minimum model is:

- project identity, audience, theme or dramatic proposition, author locks, and explicit creative profile, including progression/adventure, single-pair relationship-second-line, multi-lead, ensemble, or no-romance choices;
- series, book, volume, arc, plot unit, chapter, scene, beat, prose range, rolling roadmap, dependency, status, and per-chapter control pack;
- progression tiers, abilities, evidence, limits, counters, resources, costs, rewards, reputation, and the changes each advancement causes;
- world rules, nested locations, travel time, factions, organizations, culture, economy, terminology, items, secrets, and immutable Canon locks;
- characters with canonical IDs, aliases, goals, beliefs, values, secrets, voice evidence, location, injury, inventory, knowledge, emotional events/residue, arc stage, and time-scoped changes;
- pair-keyed relationship lines with both parties' goals and directional state, public/private stages, boundaries, promises, debt, shared memories, knowledge asymmetry, source evidence, and main-line effects;
- typed story events, story-time instants/intervals, explicit participants and effects, causal/associative links, objective truth, each character's beliefs, reader knowledge, hypotheses, clues, and reveals;
- plotlines, promises, reader-contract obligations, mysteries, foreshadowing, payoff windows, tension/release, and ending dependencies with open, due, overdue, resolved, abandoned, or deliberately unresolved state;
- manuscript revisions, alternative branches, provenance, approval or automatic-policy decision, publication state, rollback, and audit records;
- style/voice guide, forbidden patterns, title and paragraph constraints, platform profile, quality thresholds, reader-feedback evidence, and simulation artifacts.

Deterministic projectors produce character, emotion, relationship, progression, world, knowledge, timeline, promise, mystery, plot, ending, and publication views at a requested accepted revision and story time. The Session log records the exact context slice given to the model, proposal outputs, tool calls, approvals, and commit result, but it never replaces the Novel Project service. Frontmatter mirrors, summaries, FTS, vectors, graphs, dashboards, conversation compaction, and simulation memory carry source revision and freshness and remain rebuildable.

### Relationship line as first-class project state

The default creative profile treats the male/female lead relationship as a complete second story line rather than a reward, character trait, or scalar affection score. Alternative multi-lead, ensemble, non-romantic, or no-relationship profiles remain explicit configuration choices and cannot emerge through silent prompt drift.

```text
RelationshipLine(pair, storyTime)
|- independent objective and agency for each lead
|- public / social relationship state
|- private / emotional relationship state
|- A -> B: perception, desire, trust, boundary, debt, knowledge
|- B -> A: perception, desire, trust, boundary, debt, knowledge
|- attraction, intimacy, respect, commitment, conflict, hurt, resentment
|- promises, breaches, sacrifices, repairs, and unresolved obligations
|- asymmetric knowledge, misreading, concealment, and reveal evidence
|- source scenes, uncertainty, and allowed transitions
|- consequences for decisions on the external main line
`- ending state, aftermath, and deliberately unresolved debt
```

A relationship transition is accepted only when a source event changes what at least one lead knows, wants, risks, permits, promises, or does, and the proposal records the other lead's state rather than assuming symmetry. Emotional residue persists into later attention, speech, action, and decisions until another anchored event transforms it. Rupture and repair require cause, cost, accountability, altered conduct, and consequences; proximity, rescue, confession, jealousy, sexual tension, or a numeric increase alone does not prove a durable transition. The relationship has volume and ending milestones, receives its own closure review, and must produce consequences on the external main line without erasing either lead's independent arc.

`EmotionState` is not emotional prose. Drafting and review separately track the character's felt state, the textual evidence displayed or concealed on the page, and the intended or observed reader effect. Reviewers report mismatches among those three layers, but a reader-response hypothesis cannot become Canon or authorize an automatic rewrite.

OpenFic supplies useful methods for dual progress, asymmetric investment, emotional triggers, buildup, release, reader response, and avoiding a romance-only tool character, but those remain prompts. OpenNovel's `RELATIONSHIP_CHANGE` and emotion snapshot are structurally insufficient, and MiroFish's persona, sentiment, stance, and graph edges do not supply relationship causality. This capability must be built and reviewed beside prose rather than inherited from any reference.

### Atomic manuscript and canon acceptance

No Writer, Manager, Critic, extractor, retrieval provider, or simulation tool writes accepted story state directly. Each produces a reviewable Result Packet against one expected source revision.

```text
accepted revision R
  -> chapter control pack @R
  -> draft D
  -> anchored review
  -> CanonDelta C
  -> RelationshipDelta L
  -> promise / clue / timeline deltas
  -> reviewable Result Packet
  -> Accept gate
  -> compare expected revision == R
  -> ONE TRANSACTION
       manuscript revision R+1
       + typed canon and story events
       + character / emotion / relationship changes
       + approval or automatic-policy decision
       + source anchors and provenance
  -> commit
  -> invalidate derived projections
  -> asynchronous summary / FTS / vector / graph rebuild

transaction failure -> neither manuscript nor canon changes
rollback -> a new accepted revision restoring both, never erased history
```

The authoritative transaction contains only authoritative prose, typed events and Deltas, provenance, and authorization; derived data is excluded. Summaries and indexes rebuild asynchronously with recovery markers and explicit stale state. Accept rejects a stale expected revision instead of merging silently. Rollback creates a new accepted revision that restores both prose and structured state; it never deletes the history that explains what happened.

### Retrieval and chapter control

Before drafting, the workflow builds a bounded chapter control pack at accepted revision R and the requested story time. It contains the chapter contract, scene beats, relevant plot/promise/progression/world/character/relationship/mystery/reader-knowledge/tension/ending-clock state, both leads' current directional relationship and emotional residue, injuries and resources, location/travel/world rules, due payoffs and clues, recent prose, distant evidence and summaries, voice/style constraints, locked facts, and unresolved conflicts. Every included item identifies why it is relevant and where it came from.

Structured queries answer exact entities, facts, state at time, and dependencies. Full-text search answers exact phrases, names, titles, and voice evidence. Vector retrieval proposes thematic or semantic parallels. Graph traversal proposes causal, relationship, and knowledge paths. Summaries allocate context across distance. Each result carries project, accepted revision, source range, retrieval method, confidence where inferred, content hash, and freshness; graph, vector, and summary results are rejected or marked when stale and never outrank direct accepted evidence.

After drafting, independent extractors and reviewers generate candidate events and Deltas, validate every claim against source passages and current revision, and present anchored Issues and the manuscript Diff without mutating accepted state. A long-running mode may reduce interruptions under explicit policy, but it still builds a control pack for every unit, enforces continuity and quality gates, limits rewrite escalation, records every Result Packet and acceptance, and stops at natural closure or configured safety conditions.

### Isolated Simulation Lab

Simulation is optional analysis, not a mandatory chapter-generation stage. Both sandboxes read one frozen accepted revision and write only a `SimulationRun` artifact containing source revision, sandbox type, assumptions, full configuration and ontology/persona/model/dependency versions, knowledge policy, run identity, seed where supported, budgets, action or reaction trace, failures, variance, limitations, and derived report.

```text
                         accepted revision R
                                  |
                   frozen, read-only simulation input
                    +-------------+-------------+
                    |                           |
          STORY-WORLD SANDBOX          READER-REACTION SANDBOX
          typed world and events       presented manuscript only
          role-scoped knowledge        cohort + reading history
          goals and resources          no hidden author truth
          causal counterfactuals       response hypotheses
                    |                           |
          candidate consequences       confusion / anticipation /
          missing reactions            trust / boredom / fairness
                    +-------------+-------------+
                                  |
                      SimulationRun artifacts
                                  |
                    author or policy review
                                  |
                 optional future draft proposal
                                  |
                       X no direct canon write
                       X no direct publication
```

Story-world Agents reason as inhabitants and may access only facts, beliefs, resources, locations, capabilities, and relationships available to that role at the simulated story time. Actions have typed preconditions/effects and change only a forked counterfactual state. Reader Agents receive only the manuscript presented by that point and their configured reading history; they never receive hidden canon, future outline, author intent, or story-world private state. The sandboxes use separate stores, queues, tool namespaces, identity types, and outputs so character knowledge cannot leak from omniscient truth and synthetic preferences cannot become story facts.

The implementation sequence is story-world first and reader reaction later. The first forces Canon, story time, character knowledge, goals, resources, relationship state, actions, branching, and replay to become precise; the second becomes meaningful only after presented-text revisions and real-reader feedback have provenance. MiroFish informs temporal action ledgers, interviews, graph-reader leases, progress UI, and completion-after-memory-drain, but its social environments do not supply story-world causality. Story-world runs record typed action traces and deterministically replay state transitions even when action generation varies. Reader experiments rerun the same experiment definition and report distributions and variance; neither sandbox claims token-deterministic LLM generation. Both return proposals only and never represent real market demand.

### Workflow roles

WorkBuddy's distinction between capability, role, and team should remain explicit: a Skill provides one bounded operation, an Expert combines instructions, methods, model policy, and allowed Skills, and an Expert Team is a Harness workflow that decomposes and integrates work. The initial Expert set should be implemented as Harness presets, subagents, and workflows rather than hardcoded loop branches:

1. **Director** establishes the current creative objective, constraints, pacing, and approval policy.
2. **Planner/Composer** produces typed volume, chapter, scene, and beat proposals.
3. **Researcher** retrieves only relevant canon, manuscript passages, and optional external sources.
4. **Writer** creates a draft or localized rewrite without directly changing canon.
5. **Continuity Manager** extracts typed event and state proposals with source anchors.
6. **Character/Relationship Editor** checks both leads' agency, directional state, emotional residue, earned transitions, boundaries, promises, rupture/repair, voice, and main-line consequences.
7. **Promise/Mystery/Ending Editor** audits reader-contract debt, payoff windows, clues, knowledge fairness, foreshadowing, and convergence toward volume and book closure.
8. **Critic/Reviewer** reports passage-anchored issues across character, causal logic, theme, originality, prose, style, title, paragraphing, and platform constraints.
9. **Simulation Analyst** configures an isolated sandbox, states assumptions and knowledge policy, compares repeat runs, and converts counterfactual traces into limited hypotheses.
10. **Editor-in-chief** resolves competing proposals and requests author input when policy requires it.
11. **Committer** performs the atomic accepted revision and invalidates derived indexes; it never drafts or self-approves.

Fast models may classify, retrieve, summarize, and extract. Strong writing models may plan and draft. A separate model may review. Model assignment is configuration, not a domain invariant.

Scheduled automation may back up projects, rebuild indexes, run continuity audits, prepare research digests, and generate export previews. Each job needs an identity, workspace, permission profile, duration and cost budgets, concurrency policy, stop conditions, and an audit trail. It must not accept a canonical chapter or publish externally by default.

### Shared presentation protocol

Both primary clients consume the same typed states and actions: task and Agent started, needs-input, paused, failed, or finished; reasoning summary; tool proposed or running; subagent activity; control pack and alternatives; manuscript Diff; anchored Issue; Canon, Character, Emotion, Relationship, Promise, Clue, Timeline, and Ending Deltas; conflict; approval; revision commit or rollback; compaction; index stale or rebuilt; SimulationRun; artifact; and background-job progress.

The Desktop layout separates collaboration from deliverables. A persistent Results area exposes Draft, Diff, Canon/Relationship/Emotion Deltas, Issues, Sources, Simulations, Exports, and the acceptance decision, while conversation explains decisions and accepts steering. Users inspect every artifact, source anchor, freshness marker, and policy without searching the transcript.

The TUI should be a first-class `dsh --profile novel-tui` bundle using `pi-tui`. Wide terminals may show a project tree, central transcript or manuscript Diff, and a switchable control/Agent/Canon/relationship/approval/simulation panel. Narrow terminals collapse side panels into searchable overlays. Required interactions include CJK IME, wide-character correctness, mouse and keyboard navigation, long-line wrapping, scrollback-safe output, chapter and branch search, external-editor handoff, queued steering, approval dialogs, visible source revision, and accessible status text.

The Desktop product should extend the existing Harness Web client through client plugins and slots, then reuse that client in an Electron carrier. Its main workspace should follow OpenFic's proven three-column pattern while adding the WorkBuddy-inspired Results area, ten-clock dashboard, typed timeline, directional relationship line, emotion residue, plot/promise/foreshadow/ending views, revision history, task/subagent views, two separately labelled simulation panels, Diff acceptance, project backup, migration, and local-runtime diagnostics. Electron owns process lifecycle, IPC transport, filesystem dialogs, backup, and update concerns; the renderer holds neither credentials nor tool or commit authority.

An optional mobile or IM companion may show task status and artifacts, approve or reject bounded proposals, send steering, and pause work. Remote access, cloud storage, notifications, and manuscript synchronization are opt-in capabilities with visible destinations; the mobile surface is not the primary long-form editor.

## Proposal

Create a novel capability family, two primary client profiles, and optional Simulation Lab providers without modifying the core Agent Loop.

The capability family should contain complete Service Definition, Provider, and Consumer roles for project storage, story time and typed canon events, character/emotion/relationship state, promises and knowledge, deterministic projections, revision transactions, context assembly and retrieval, quality checks, workflow composition, simulation, reader feedback, import/export, and shared presentation data. Deployment-varying profiles, thresholds, context budgets, models, review depth, genre and relationship rules, approval/acceptance policy, simulation parameters, and automatic-run limits are validated configuration fields rather than hardcoded constants.

The recommended implementation order is:

1. Define project/task/Result Packet, hierarchy, control-pack, manuscript revision, story-time event, character/emotion/relationship, progression/world, promise/clue/knowledge/ending, source-anchor, and proposal schemas.
2. Implement one authoritative local store, expected-revision atomic acceptance, deterministic time-scoped projections, provenance, branch, rollback, recovery, and derived-data invalidation.
3. Add Ask, Plan, Write, Accept, and Publish policies, task-scoped workspaces, permission escalation, author locks, bounded-automation policy, and artifact presentation.
4. Deliver one chapter loop: reconstruct control pack, compare alternatives, draft, run anchored continuity/relationship/promise/prose review, produce typed Deltas, approve, atomically Accept, replay, and recover from injected failure.
5. Add layered summaries, structured/full-text/vector/graph retrieval, source and content hashes, revision/time/freshness checks, recoverable jobs, and bounded scheduled maintenance.
6. Compose Skills, specialist Experts, Expert Team workflows, bounded subagents, multi-model routing, progressive automation, visible budgets, escalation, and natural-closure safeguards.
7. Ship the Pi-based TUI profile, extend the Web client, and then add the Electron carrier; cover CJK, wide characters, Diffs/Deltas/Results, approvals, resume, branch, resize, loopback isolation, backup, migration, and recovery.
8. Add TXT and Markdown exchange first, followed by EPUB and DOCX, with round-trip, encoding, accepted-revision, provenance, and external-destination approval tests.
9. Build the story-world sandbox on frozen typed state with role-scoped knowledge, action preconditions/effects, fork/run identity, full configuration and version provenance, typed traces, deterministic state-transition replay, generation variance, budgets, and proposal-only results.
10. Add the reader-reaction sandbox only after presented-text revisions and real-feedback provenance exist; isolate cohorts from hidden canon, compare repeat runs, calibrate cautiously, and never auto-optimize the manuscript from synthetic preferences.

The first vertical slice should not attempt a complete autonomous novel or simulation. It should open one project, create or import typed canon and one pair-keyed relationship state, plan one chapter, draft it, identify anchored continuity/prose/relationship issues, show the manuscript Diff and Canon/Relationship/Emotion Deltas in TUI and Web, accept or reject them, commit one revision atomically, recover and roll back through auditable revisions, resume the Session, and reconstruct the next chapter control pack from accepted state.

## Alternatives considered

### Fork OpenFic as the product base

OpenFic already has the strongest editor and desktop product, but this choice would make Python, LangGraph, its model registry, session system, permissions, and storage the runtime authority. DeepSeek Harness would become a secondary integration, and fiction state would remain under-typed. Porting selected behaviors into Harness preserves one control plane.

### Use Pi as the complete base

Pi provides the best reusable TUI, mature sessions, and a capable generic agent, but it deliberately omits permissions, sandboxing, subagents, and plan/workflow policy. Its new durable harness is incomplete. Replacing Harness with Pi would discard the capabilities that the chosen foundation already supplies.

### Use OpenNovel as the domain runtime

OpenNovel's schemas and workflow vocabulary are valuable, but the snapshot, event, approval, autonomy, MCP, retrieval, and CI defects prevent adoption as a production authority. Reimplementing its strongest concepts with typed Harness services is safer than wrapping AutoRunner.

### Treat Claude Code as an implementation dependency

The local repository has no core implementation and no open-source license. Its documented UX and plugin conventions remain useful, and the Harness provider can invoke the official product as an optional subagent, but it cannot supply the target's TUI or Desktop code.

### Treat WorkBuddy as an implementation dependency

Current evidence establishes WorkBuddy product behavior, not a reusable core, source license, embedding API, or supported integration SDK for this architecture. Depending on its private desktop runtime would also divide task state, permissions, credentials, and unpublished manuscript custody. Its patterns should be reimplemented on Harness-owned interfaces.

### Adopt MiroFish as the simulation runtime

MiroFish already ingests long material, runs multiple social Agents, updates temporal graph memory, and generates reports, but its ontology and actions model social accounts rather than a causal story world. It lacks frozen Canon input, deterministic branches, knowledge isolation, manuscript review, and author acceptance, and direct reuse introduces AGPL, security, and duplicate-runtime concerns. Clean-room reimplementation of bounded lifecycle concepts preserves one authority and lets both target sandboxes use Novel Project's typed state.

### Run every reference system behind adapters

Adapters would preserve multiple agent loops, model registries, credentials, session histories, approval semantics, and novel stores. Failures would leave no single answer for what ran, what the model saw, or which story fact is current. The target instead assigns every concern one owner and ports only bounded components or concepts.

## Acceptance criteria

- The repository documents which audited capabilities are shipped, experimental, behavior-only, planned, or defective, without presenting roadmap text as current functionality.
- Ask is read-only, Plan cannot write, Write touches drafts only in authorized scope, Accept requires expected revision and policy, and Publish names a destination and separate authorization. Destructive actions, deletion, external sharing, and publication never inherit Write or Accept permission.
- Each concurrent task has an isolated scratch workspace, stable identity, source revision, narrative-unit scope, budgets, stop rules, status, provenance, and typed Results. The UI shows Draft, Diff, Canon/Relationship/Emotion Deltas, Issues, Sources, Simulations, Exports, and acceptance outcome independently of the transcript.
- A novel profile runs through the existing Harness Agent Loop, Session, permission, approval, provider, subagent, workflow, and credential capabilities; no second generic runtime, Session authority, provider registry, or approval plane is required.
- Novel Project is the only authority for accepted manuscript, Canon, story time, relationship/emotion state, and approval provenance. Conversation summaries, frontmatter, graphs, indexes, model extractions, feedback, and simulations remain derived evidence or counterfactual artifacts.
- The hierarchy and ten clocks—plot, promise, progression, world, character, relationship, mystery, reader knowledge, tension/payoff, and ending—can be projected at an accepted revision and story time with source evidence and open debt.
- A chapter Result Packet carries source anchors, expected revision, manuscript Diff, typed Canon/Character/Emotion/Relationship/Promise/Clue/Timeline Deltas, anchored Issues, policy decision, and approval state. Accept commits them atomically; rejection or transaction failure changes none.
- The default male/female lead profile stores a pair-keyed, bidirectional, time-scoped relationship line with both leads' goals, agency, public/private stages, boundaries, trust, intimacy, commitment, conflict, promises/debt, asymmetric knowledge, source events, valid transitions, main-line consequences, and ending state. Other relationship profiles are explicit.
- Emotional state is event-derived and source-anchored, preserving trigger, object, appraisal, expression/concealment, intensity, residue, and downstream choice; a scalar or trait summary cannot silently replace it.
- Rollback restores both prose and structured state through a new auditable revision and leaves the prior history recoverable.
- The next chapter's context can be reconstructed from accepted project state and logged retrieval provenance after process restart, Session compaction, or client replacement.
- The in-tree, installable `pi-tui` profile handles CJK IME and wide characters and exposes project navigation, source revision, progress, Diffs/Deltas, approvals, subagents, branches, external editing, resume, simulation artifacts, and interruption recovery without owning business state.
- The Web client exposes the same protocol and Results. A later Electron shell reuses it without moving credentials, tool execution, commit authority, or project truth into the renderer; a mobile companion remains subject to explicit remote policy.
- Bounded automation fixes source revision, stages, narrative units, models/tools, budgets, retry/rewrite ceilings, deterministic gates, reviewer escalation, stop conditions, and whether Accept is allowed. It cannot expand scope, self-authorize, or Publish.
- Retrieval distinguishes structured, exact-text, semantic, graph, and summary sources; every result carries source range, revision/time identity, method, hash, and freshness, and stale derived indexes cannot be silently used.
- The story-world sandbox runs first from frozen typed state with role-scoped knowledge, action preconditions/effects, fork/run identity, repeatability, visible variance, and proposal-only output. The later reader sandbox sees presented text only. Their stores, identities, tools, queues, and outputs are isolated, and neither writes Canon or Publish.
- Real reader feedback and synthetic-reader reactions have different provenance and confidence. Synthetic results never claim market representativeness, and no engagement metric or simulation objective can automatically rewrite the main line.
- Tests cover schemas, valid/invalid relationship and emotion transitions, deterministic time projections, invalid proposals, transaction failure, crash recovery, rollback, stale retrieval, permission denial, automation stops, sandbox knowledge leakage, repeat runs, workflow lifecycle, TUI rendering, Web presentation, both SDK projections, and one keyless end-to-end project replay.
- Novel Project storage remains local by default; every network model, remote-access path, and manuscript data destination is explicit and disclosed before use. Telemetry is off unless the user opts in, Electron and Web development defaults bind only to loopback, and cloud libraries, mobile sync, connectors, third-party Skills, and MCP destinations require separate authorization.
- Reused Pi or OpenFic code retains its license notices; Claude Code and WorkBuddy implementations are not copied; MiroFish concepts are clean-room reimplemented unless an explicit AGPL and legal decision authorizes otherwise.

## Risks

- The OpenFic and OpenNovel directories lack Git metadata, so their exact upstream commits and local modifications are unknown. Revalidate against pinned upstream commits before copying code or depending on behavior.
- WorkBuddy was evaluated from official product documentation rather than source. Its implementation, isolation guarantees, extension boundaries, reuse rights, and future behavior remain unverified and may change independently of this design.
- The audited MiroFish checkout is a dirty `local/graphiti-memory` branch whose local graph-memory path is uncommitted experimental work. Pin and audit a clean upstream revision separately before treating any such behavior as released capability.
- MiroFish is AGPL-3.0, and its transitive simulation, graph, and database dependencies carry their own licenses. Clean-room concept adaptation is the default; any code reuse, modified network service, or tight integration requires a recorded product and legal decision.
- Automatic conversational memory, cloud libraries, mobile synchronization, and third-party extensions can leak unpublished text or turn stale summaries into misleading context. Keep them opt-in, permission-scoped, inspectable, and outside canonical novel state.
- Pi and DeepSeek Harness both evolve quickly. An adapter to private or experimental Pi internals would create avoidable churn; depend only on a pinned public TUI surface or vendor it through an explicit procedure.
- A manuscript revision plus domain-event transaction can span large content and derived jobs. The design must separate the small authoritative commit from asynchronous summary and index rebuilds while preserving recovery markers.
- Model extraction can invent facts or miss implicit changes. Typed schemas, source anchors, deterministic validation, and approval reduce the risk but do not eliminate editorial judgment.
- A rich relationship schema can turn intimacy into mechanical scorekeeping or encode genre stereotypes. Its dimensions remain evidence-backed editorial state, profiles are configurable, and author judgment controls whether any proposed transition is narratively true.
- Multi-model and multi-agent workflows increase cost, latency, and context growth. Budgets and staged escalation must be observable and configurable.
- Full automation can amplify a mistaken premise, repeatedly rewrite approved material, or let one model approve its own work. Fixed scope, immutable source revision, independent gates, retry ceilings, and a non-automatable Publish boundary are required.
- Story-world simulation can leak omniscient knowledge into characters, while synthetic-reader simulation can produce persuasive but unstable consensus. Isolated inputs, multiple seeds, visible variance, adversarial leakage tests, and proposal-only outputs reduce but do not eliminate false confidence.
- Synthetic reactions can be mistaken for real reader evidence or optimized into formulaic engagement. Preserve separate provenance, calibrate only against consented real feedback, and never let a proxy metric authorize manuscript changes.
- Terminal rich-text editing has practical limits. The TUI must integrate an external editor and should not imitate every desktop editing feature.
- Electron expands the update, IPC, filesystem, and renderer attack surface. Process roles, loopback binding, content security policy, navigation restrictions, and credential isolation need dedicated security review.
- Chinese IME, full-width punctuation, Unicode width, very long paragraphs, large chapter trees, and Windows process recovery are high-risk client paths and require fixtures and real-platform testing.
- Genre-specific prompts can flatten author voice. Creative profiles, canon locks, explicit style rules, and anchored local repair must take precedence over generic “AI cleanup.”
- Large-scale graph and vector retrieval can make plausible but non-authoritative connections. Every displayed inference must remain distinguishable from accepted canon.

## Compressed continuation context

- **Objective:** build a Chinese web-novel authoring agent with first-class TUI and desktop clients on DeepSeek Harness.
- **Product posture:** author-led co-creation is the default; bounded full automation is optional and never broadens its own authority.
- **Author authority:** the author owns intent, style, Canon acceptance, relationship truth, automation policy, and publication. Agents produce evidence, alternatives, proposals, checks, and reviewable artifacts.
- **Fixed runtime owner:** DeepSeek Harness exclusively owns the loop, Session, tools, permissions, approvals, providers, subagents, workflows, credentials, policy enforcement, audit, and client transport.
- **Project truth:** a separate Novel Project service exclusively owns accepted manuscript revisions, typed Canon events, story time, ten-clock projections, character knowledge, relationship/emotion state, promises, clues, and approval provenance; summaries, graphs, indexes, feedback, and simulations are rebuildable or non-canonical artifacts.
- **Seven reference roles:** DeepSeek Harness is the runtime and governance base; Claude Code is an opaque behavior and workflow benchmark; WorkBuddy supplies documented task-first desktop and Results patterns; Pi supplies `pi-tui` and event-driven UX, not a second loop; OpenFic supplies fiction editor, approval, revision, retrieval, and prompt-level craft methods; OpenNovel supplies domain vocabulary and quality concepts, not its defective runtime; MiroFish supplies clean-room temporal-graph, action-ledger, interview, reader-cohort, and simulation-lifecycle concepts only.
- **Client facts:** DSH currently ships Web and headless but no in-tree TUI or Electron; Pi ships a TUI but no desktop; OpenFic ships Web and Electron but no TUI; OpenNovel ships Rich CLI/MCP rather than an author workbench; the local Claude repository lacks core and Desktop source; WorkBuddy documents desktop and remote companions but no reusable core or TUI; MiroFish ships a staged Web simulation UI, not a TUI or manuscript-authoring client.
- **Task model:** Ask is read-only, Plan proposes, Write changes scratch drafts, Accept is the sole accepted-prose/Canon mutation boundary, and Publish is a separate explicit authority; every task exposes source revision, scope, policy, progress, Draft, Diff, typed Deltas, Issues, Sources, simulation artifacts, and approval state.
- **Atomicity boundary:** Accept commits manuscript, Canon/Character/Emotion/Relationship/Promise/Clue/Timeline events, provenance, and authorization in one expected-revision transaction; rejection or failure changes none, while derived index work runs afterward with recovery markers.
- **Relationship and emotion boundary:** the default male/female lead relationship is a complete, bidirectional, time-scoped, source-anchored second line with both leads' agency and main-line consequences. Emotion is event-derived with trigger, appraisal, expression or concealment, residue, and choice; neither collapses to an ungrounded score.
- **Simulation boundary:** story-world and reader-reaction sandboxes consume frozen accepted revisions, use separate identities, knowledge, stores, tools, queues, and result types, and can emit only counterfactual proposals or synthetic hypotheses. Build story-world simulation first and reader simulation later; neither writes Canon or publishes, and synthetic readers never stand in for real readers.
- **MVP flow:** accepted control pack -> draft proposal -> anchored critic -> typed state proposal -> Diff/Delta review -> atomic Accept -> projection and index invalidation -> reproducible next-chapter context.
- **MVP clients:** an in-tree profile built on `pi-tui` and the existing Harness Web client consume the same typed protocol and Results; a hardened Electron shell follows the Web vertical slice without owning execution or project state.
- **Automation boundary:** a bounded run fixes revision, scope, stages, narrative units, models/tools, budgets, retry and rewrite ceilings, reviewers, stop conditions, and whether Accept is permitted; it cannot self-authorize, expand scope, or Publish.
- **Non-negotiables:** model-visible context is logged; only Novel Project owns truth; rollback covers prose and structured state; stale retrieval and inference are visible; relationship and emotion changes carry evidence; sandbox knowledge cannot leak; CJK and Windows are first-class; Novel Project storage is local by default; every network model, remote path, and manuscript destination is explicit and authorized; telemetry is opt-in.
- **Known traps:** do not run multiple loops, use Session or automatic-memory summaries as Canon, copy opaque Claude/WorkBuddy implementations, adopt Pi AgentHarness v2, embed OpenFic's Python runtime, wrap OpenNovel AutoRunner, equate MiroFish's social environments with a causal story world, or let graph/model/simulation output silently become truth.
- **Next design task:** specify the Novel Project event and revision model and the single-chapter transactional acceptance protocol before implementing TUI or Electron code.
