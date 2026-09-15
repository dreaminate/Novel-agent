# Architecture baseline

**Status:** Accepted plugin-only baseline.

**Date:** 2026-08-27

**Host evidence:** community DSH Desktop GitHub Release `v2.0.2`, tag commit
`9d18856ddea4f20eb3ef8c88b0436921c6b19606`; DSH `0.1.1-rc.2`.

**Superseded in part — 2026-09-15.** This is the dated 2026-08-27 **single-plugin**
baseline. Read it as the pre-migration record it is; the items below are no longer
current and must not be used as rules:

- **DSH version.** `0.1.1-rc.2` is superseded. The adopted baseline is
  `0.1.2-rc.1` plus the repository's local `dsh-session` recovery patch; see
  [`AGENTS.md`](../AGENTS.md)「DSH 唯一内核」and the
  [adoption record](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md).
- **Plugin count.** "Decision 3" and "Decision 4" below describe **one** package with
  four capability areas. The shipped composition is **five** domain plugins
  (`novel-project` plus planning / writing / memory / review); the split is governed
  by [`tasks/plan-final.md`](../tasks/plan-final.md) and
  [`docs/plugin-design-v3.md`](plugin-design-v3.md).
- **Desktop host.** `v2.0.2` is the last verified combination; the current target is
  `v2.0.5` and has not been installed or accepted.

Current boundary and status live in `README.md`, `tasks/plan-final.md`,
`tasks/history-migration-todo.md` and `docs/claude-desktop-parity-matrix.md`.
The rest of this record — the ownership table, the retired-implementation list and
the dated evidence below — is retained as the baseline it documents.

Historical smoke proves only the implementation that was present during that run;
it does not keep a removed plugin or wrapper in the architecture.

The root-level 2026-08-22 foundation reports are retained research snapshots,
not the current implementation plan. Their former in-tree TUI/Web/Electron
recommendations are superseded by this record.

## Context

DSH, the community Desktop and community plugins already provide the normal
Agent client, Desktop shell, Workbench, TUI, terminal, file tree, editor, Diff,
Git, browser, search and upload surfaces. Rebuilding or aggregating them inside
novel-agent spends product effort on generic infrastructure and creates a second
upgrade boundary.

The user-directed decision is therefore stricter than merely reusing the
community Desktop: novel-agent ships one novel-domain plugin with its necessary
stock-DSH conversation view. A user chooses and installs the community plugins that
provide each generic surface.

## Decision 1 — DSH is the only kernel

All DSH packages parsed on the novel-agent product path are exact
`0.1.1-rc.2`. DSH owns Agent, Session, Workspace, events, approval, persistence,
settings, credentials, Profile and plugin lifecycle. Novel-agent does not fork
the Agent Loop or define a parallel Session, approval, settings, credential,
plugin, Profile, transport or gateway system.

Novel facts that need model visibility, audit, replay or restart recovery live
in the existing DSH/Novel Project seam. UI selection, hover, pane size and
temporary input remain transient client state.

## Decision 2 — hosts and generic surfaces are external plugins

```text
Community DSH Desktop v2.0.2 or DSH CLI
  dsh-base + dsh-web-app + user-selected Profile
                         │
                         ├─ community plugins selected by the user
                         │   ├─ dsh-better-sidebar
                         │   ├─ dsh-browser / web-search-pro / file-upload
                         │   ├─ dsh-pi-tui
                         │   └─ optional dsh-git-worktree
                         │
                         └─ novel-agent domain plugin
                             └─ novel-project
```

The community Desktop owns Electron bootstrap, windows, tray, Profile selection,
native operator terminal, diagnostics, notifications, updates and market. Its
normal carrier is loopback HTTP/WebSocket on `127.0.0.1` with an ephemeral port.
Novel-agent does not replace or patch that carrier.

`dsh-better-sidebar@0.16.1` owns the Web file tree, editor/preview, terminal,
Git, Diff, Jobs/Subagents and pane/window layout. Its terminal stays enabled;
novel-agent does not close it and insert another xterm/Remote pair.

`@xmoon76/dsh-pi-tui@0.3.4` owns the complete TUI. Novel-agent does not package
another TUI runtime, Profile or status-only extension.

Browser, Search Pro, File Upload and optional Worktree remain separately
installed community plugins. Their state is not Novel Project Canon.

## Decision 3 — the novel plugin installs only itself

There is no `desktop-profile`, aggregate Bundle wrapper or novel-agent plugin
installer. The retained package declares one small `dsh.bundle.patch` and mounts
only its own Cordis entry:

| Package | Owns | Requires from another plugin |
| --- | --- | --- |
| `@novel-agent/novel-project` | Canon aggregate, Result Packet, acceptance, rollback, generated Remote and its essential project UI | DSH Workspace/storage/client seams |

The package patch does not list or mount community dependencies. Installation
uses the ordinary `dsh plugin --profile <name> add <package>` command; the user
chooses the Profile and the plugin combination. Exact development commands are
in the repository README.

The necessary Result Packet, decision, revision, rollback and Canon UI remains
inside `novel-project` through DSH's stock `conversation.view` Slot. The removed
Better Sidebar summary tab duplicated that panel, and the removed Pi TUI footer
added status text rather than a necessary authoring interaction.

Result Packet impact preview is a read-only branch of the same transaction. The
Host binds proposal provenance to the calling Agent, applies the author's
complete decisions to an in-memory next-revision candidate, and reuses Apply's
revision, Canon-lock, narrative-projection and identity checks. It then compares
the current and candidate projections and returns the complete domain impact.
Only Apply adds author authorization and persists the candidate; Preview writes
no revision, Session event or derived index. The existing Result Packet article
owns the single preview control and invalidates stale asynchronous results.

## Decision 4 — four domain capability areas remain one deep plugin

Product work is grouped into writing, writing management, setting and writing
memory. These are capability areas inside `@novel-agent/novel-project`, not four
packages, Profiles or stores. Writing memory is the current implementation
priority: it derives revision-bound, source-bearing recall from the same accepted
Canon, narrative and manuscript projections, then lets the existing writing and
review paths consume it. Query-independent next-Chapter recall includes accepted
character carry-forward and the complete strict character-arc hypothesis at the
requested revision; both remain Canon projections, disappear from the top level
when an existing Chapter control pack already owns and displays the same context,
and never become a second fact authority.

## State ownership

| Fact or behavior | Authoritative owner | novel-agent behavior |
| --- | --- | --- |
| Prompt, assistant/tool output, approval decision | DSH SessionEventMap and persistence | consume/project only |
| Workspace/Session identity and execution | DSH Workspace and Session services | use published APIs |
| Manuscript, accepted deltas, anchors, issues, provenance, hierarchy, Chapter contracts, post-Chapter checks, character arc hypotheses, creative style profiles, narrative clocks, ending hypotheses and relationship projection | `@novel-agent/novel-project` through DSH storage | one accepted-revision authority with atomic rollback; strict creative style profiles remain versioned author Canon, while bidirectional relationship lines are derived from independent directional Canon state; import SourceAnchors may retain upstream encoding, BOM, byte length and exact source bytes for accepted-revision publication |
| Generic Web files/editor/terminal/Git/Diff/layout | `dsh-better-sidebar` | use unchanged; no local adapter |
| Full terminal interface | Better Sidebar on Web; Pi TUI in terminal mode; community Desktop for operator terminal | do not provide another terminal implementation |
| Complete TUI lifecycle and commands | `@xmoon76/dsh-pi-tui` | use unchanged; no local TUI package |
| Browser/search/upload/worktree | selected community plugins | invoke any required novel-domain transaction from the existing `novel-project` through published DSH seams; no wrapper package |
| Authoring stage vocabulary | `@novel-agent/novel-project` through the DSH System Prompt seam | define Ask/Plan/Write/Review/Accept/Publish semantics only; DSH keeps the Agent Loop, stock workflow tool, durable workflow records, approval and UI |
| Novel role Skills and Agent composition | `@novel-agent/novel-project` owns runtime role Skills through the DSH `0.1.1-rc.2` `SkillRegistry`; external DSH-native `agent.cordis.yml` roots own Agent persona and composition | register each proposal-only role through optional `ctx.inject(['skills'], ...)` with model/user invocation; read accepted Project state through existing Tools, map output to legal Canon/narrative Result Packet fields, and do not create a plugin-owned Preset directory, Profile, Bundle, standing expert team or second Agent Loop |
| Bounded author automation run | `@novel-agent/novel-project` over stock DSH Tool approval, Session events, `tokenUsage` and native retry events | keep one approved Write-only revision and ordered `unitIds` scope with a positive `maxResultPackets` limit; each scoped unit may emit at most one Result Packet proposal in the same DSH Session/turn. Persist active/stopped `novel/automation-policy` snapshots with replayable `completedUnitIds`, and call native `concludeTurn()` when the scope or packet limit completes. Retain author-specified total-run and per-unit Token, wall-time and DSH retry budgets; use the first same-run policy event for cumulative time/retry totals, the latest active event timestamp for per-unit wall time and active snapshot values for per-unit Token/retry deltas. Reuse the existing Result Packet proposal and author Apply path, and never create a tokenizer, counter, timer service, retry engine, automation engine, queue, UI, Canon table or implicit Accept/Publish grant |
| Permanent author Canon locks | `@novel-agent/novel-project` record over stock DSH Tool approval | persist the exact currently accepted fact value, reject conflicting Result Packet Apply and rollback in their existing atomic transactions, and require a separately approved unlock; add no lock UI, adapter or parallel fact store |
| Proposal-only story-world SimulationRun | `@novel-agent/novel-project` over the stock DSH Tool and `spawn` Subagent seams | read an explicit role view from one frozen accepted revision, derive typed resource/fact state paths, enforce exact action preconditions, deterministically replay an author-bounded ordered `set`/`remove` trace into before/after/final counterfactual projections, emit that structured trace, a sequential multi-seed aggregate with stable twelve-action occurrence ratios, an ordered explicit-branch comparison, a branch-major / seed-minor variance matrix whose children share one frozen role state and whose per-branch action ratios and final-state cells remain explicit, or an ordered isolated-role comparison whose children receive only their own actor inputs; leave Canon unchanged. The existing `conversation.view` renders the latest single run with its replay identity, actor, hypothesis, trace, before/after/final state, limitations and provenance; no TUI adapter, Workflow, Job, store or queue is added |
| Proposal-only reader-response SimulationRun | `@novel-agent/novel-project` over a separate stock DSH Tool and `spawn` child | present one accepted manuscript unit or explicit unaccepted candidates, configured audience Personas and explicit reading history only; identify each exact presented text, return one typed synthetic run, a sequential multi-seed aggregate, a candidate-major comparison, a Persona-major comparison, a direct accepted/candidate variant comparison, a candidate-major / Persona-major experiment matrix, or a post-run calibration projection against separate provenance-bearing real feedback. Calibration maps only explicit quantitative comprehension/expectation/emotion observations to the corresponding fixed synthetic dimensions and keeps qualitative or unrelated categories insufficient/unmapped; real feedback never enters child prompts. Mark every result non-representative and leave Canon unchanged. The existing `conversation.view` renders the latest single run with its Persona, reading history, presented-text source/hash, reactions/evidence, non-market label, limitations and provenance; no TUI adapter, Workflow, Job, store or queue is added |
| Simulation replay identity and story-state replay | `@novel-agent/novel-project` pure Host helpers plus the two existing SimulationRun Tools | accept an optional caller seed and derive a stable SHA-256 `replayKey` from canonical sandbox/input/trace data while preserving the real DSH child `runId`; for story-world traces, replay typed preconditions and effects against the frozen role state and return the deterministic projection. Neither behavior claims deterministic model generation or adds a replay store/queue |

Derived retrieval indexes, graphs and memories are rebuildable providers. They
cannot write Canon directly. Community plugins cannot create parallel stores for
volume, chapter, scene, character, relationship, clue, clock or ending state.

The first writing-memory slices combine complementary projections. Every Chapter
control pack carries the latest explicit post-Chapter state for each character
from before the bounded nine-Chapter window. When `chapterId` is omitted for a
not-yet-accepted next Chapter, the same writing-memory result reuses that resolver
across every Chapter at the requested accepted revision and returns the latest
explicit state for every character independently of query ranking. A newer empty
`carries` value clears older state; historical revisions exclude future state.
When a control pack is present, this top-level field is empty to avoid duplicating
the control pack. The same no-`chapterId` path reuses
`buildRelationshipProjection()` to carry every complete accepted A↔B line with
both directional field maps and their independent revision, Delta, Anchor and
provenance sources. Historical recall excludes future directional rewrites; a
control-pack request leaves this top-level relationship list empty because its
reference resolution already owns selected lines. The same no-`chapterId` path enumerates
every accepted `knowledge` subject at the requested revision and directly reuses
`buildNovelKnowledgeBoundary()` to return each character/reader ledger with all known-fact
fields, source ranges, provenance and current/historical freshness. Historical recall
excludes future subjects and field rewrites; a control-pack request leaves this top-level
list empty. Optional `writingMemoryQuery` on the
existing `retrieve_novel_context` path ranks up to three accepted manuscript
excerpts, setting facts, continuity facts or narrative-clock entries, and
narrative debts per bucket. It also ranks up to three accepted rolling roadmaps
by their horizon, milestones, Chapter ranges, dependencies, scoped debts and
change rationale, then reuses the existing revision-bound roadmap resolver to
return every ordered unit and resolved, missing or ambiguous reference. When no
accepted `chapterId` is supplied and no control pack exists, it also ranks up to
three accepted narrative units using
their hierarchy, objective, entry/exit state, status and Chapter contract. With
a control pack that bucket is empty rather than duplicating the same structure.
Every ranked bucket hydrates only the requested revision and retains score,
matched terms, source revision, Anchor ranges and provenance. Narrative clock
rationale and reader-knowledge ambiguity policy are searchable content.
The same result always carries the requested revision's strict accepted
`creative-profile/style-profile`, `creative-profile/serialization-profile` and
`reader-contract/contract-profile` values in `authoringContracts`, independent
of query terms. Those mandatory contracts retain source revision, Anchor ranges
and provenance without pretending to have a search score or matched terms.
Style `approvedExemplars` and reader-contract delivery evidence are hydrated from
their explicitly declared accepted revision, manuscript unit and Anchors into
actual excerpts with purpose/demonstration and source provenance. This is a
read-only join over existing accepted revisions, not a second evidence store;
other fields from those Canon kinds remain outside this contract list.
After the stock Agent calls that same Tool, the existing `conversation.view`
selects the latest successful Session result that actually contains writing
memory and renders the mandatory contracts, query-independent character,
latest accepted post-Chapter reader-disclosure and Chapter-outcome carry-forward,
relationship carry-forward,
query-independent character/reader knowledge boundaries,
and the six source-bearing ranked buckets. A later ordinary
retrieval result does not hide it. This adds no query
form, Tool, store, page or client package.

The current graph provider is deliberately small and on demand: the existing
`retrieve_novel_context` Tool can project accepted narrative hierarchy, Canon
facts, explicit `A->B` relationship endpoints, and clock/debt links. Each
derived node and edge carries its source revision, delta, anchors, ranges and
provenance, with a stable content hash. Accepted `story-event.causes` facts add
typed causal edges. An optional `impactEventId` on the same retrieval path runs
a stable breadth-first traversal over those edges and returns each downstream
event's shortest source-bearing path without exposing the full graph unless
`graph: true` was also requested. First-class `knowledge` facts use explicit `subject->fact`
targets and add typed knowledge edges while remaining directly retrievable as
structured Canon facts. Vector retrieval remains a future domain slice; no
graph UI or generic graph package is part of the product boundary.

An accepted Chapter `NarrativeUnit` may optionally carry one strict
`chapterContract`. The same accepted unit owns viewpoint, story time, scene
functions, active plot and relationship lines, promises touched, reader and
character information policy, progression setups and payoffs, emotional
movement, ending pull, prohibited contradictions, style constraints, a positive
minimum/maximum length range, and acceptance gates. The schema rejects the
contract on a non-Chapter unit and rejects `max < min`; units that omit it retain
the original contract-free path. The existing `chapterId` control-pack
Tool/generated Remote returns that source-bearing Chapter, and the existing
`conversation.view` panel renders the contract. There is no second control-card
store, Tool, page or package.

Writing-memory UI uses a successful `retrieve_novel_context` call's original
revision-bound arguments to reconstruct the result through the existing Remote.
DSH's model-facing text can be spilled or truncated and is not parsed as the
complete UI payload. The panel preserves the selected revision and cancels its
local update when the Session or Workspace changes; it adds no store or Remote.
The real-model first-Chapter run and the reproduced/fixed Slot crash are recorded
in [the 2026-09-05 evidence](external-model-chapter-repair-2026-09-05.md).

Accepted post-Chapter accounting remains in the same Canon authority as strict
`chapter-state/post-check` set/remove values. A set records the referenced
contract revision and Delta, `met|changed|missed` outcome and deviations,
manuscript source revision, actual changes and costs, newly possible/impossible
state, reader knowledge/suspicion, per-character carry-forward and debt
transitions with their clocks and source Deltas; remove requires `null`. The
existing accepted-revision projector preserves the R1 Chapter contract, R2
manuscript and actual Canon/clock/debt Deltas, and R3 post-check as a source-bearing
chain. The same `chapterId` control pack resolves the exact named contract,
manuscript and debt sources at the requested effective accepted lineage, classifies
debt references as resolved, missing or ambiguous, and preserves order, duplicates,
ranges and provenance. Rollback copies and abandoned future revisions are not new
sources. A later Chapter control pack also carries the existing post-check resolutions
for up to nine recent preceding Chapters in hierarchy order. The structured Canon
query/generated Remote returns the same facts, and the existing `conversation.view`
renders both the completed-Chapter ledger and its carry-forward. The ledger is explicit
accepted accounting, not a generated hypothesis, inference or automatic Chapter
rejection, and it adds no Tool, store or fact authority.

Anchored Review reuses the same revision-bound Chapter control pack. For an accepted
Chapter manuscript, the existing reviewer prompt includes its contract, acceptance
gates, ten clock/debt buckets, resolved references and available post-check sources;
non-Chapter manuscripts retain the original review payload. The existing spawn,
structured Diff/Issue Result Packet and author decision surface remain authoritative,
and Review does not advance Canon or the project head.

The control pack also resolves the Chapter contract's explicit active references
at the requested accepted revision. Plot ids match strict Plot Clock line ids on
the Chapter ancestry, choosing the most specific scope and retaining the full
source-bearing clock entry. Relationship ids match the exact normalized
bidirectional line. Promise touches match the current strict `promise/state` and
retain their intended movement and source fact. Each family preserves declaration
order and returns separate resolved and missing results. Missing references are
read-only information, never an Accept validator, and no approximate matching,
new query, Tool, store or UI surface is introduced.

Each resolved active Relationship line also resolves the emotion episode ids named
by matching Relationship-clock moves inside the already scoped ancestry plus
Scene/Beat plan. Resolution preserves clock-entry, move and declaration order and
duplicates. A move must match both the active line id and one of that line's exact
directional pair targets; the target is never used to infer a different line. Exact
strict emotion episodes retain trigger, mixed emotions, residue, ranges and
provenance, while absent or non-strict ids remain explicit missing references. The
existing Tool, Remote, reviewer and relationship reference view consume this data.

The Chapter control pack also projects every accepted Scene and Beat descendant
of the target Chapter at the requested revision. It preserves the narrative
projection's deterministic depth-first hierarchy order, returns the complete
source-bearing `NovelNarrativeUnit`, and does not reinterpret free-form status.
Scoped Canon facts and all ten clock buckets use the union of the root-to-Chapter
ancestry and those Scene/Beat ids. Sibling Chapters, future revisions and branches
abandoned by rollback are excluded by the same accepted-revision projection. The
existing Tool, generated Remote, reviewer payload and `conversation.view` consume
that one field; no Scene editor, generator, query, store or UI package is added.

Current project Canon locks are projected into the same Chapter control pack in
stable lock order. A lock resolves only when the requested accepted revision has
a Canon fact with the exact kind, target, field and structurally equal value; the
resolved entry retains that full source-bearing fact. A missing or historically
different fact is reported as unavailable at that revision instead of borrowing a
current source. Tool, generated Remote, anchored Review and the existing panel share
this projection, and retrieval changes neither locks, Canon nor the project head.

The same retrieval service can assemble a closure ledger for one accepted Book
or Series subtree. It preserves hierarchy order, selects the existing ending
clock entries, flattens every debt still present in that revision in fixed clock
and unit order, and carries an author-supplied remaining Chapter budget. It does
not interpret debt status, rank work or create a second ending store. Debt values
may explicitly name prerequisite `{clock,id}` references; the ledger performs a
stable topological order over the in-scope accepted debts without inferring any
missing dependency. Accepted Canon additionally owns strict `ending.hypothesis`
set/remove values for Book/Series scopes. A hypothesis records its scope,
positive version, target, decisive conflict, protagonist choice, thematic
return, desired emotional afterimage, fixed resolution mode, typed final states,
aftermath, deliberately unresolved debt references and nullable epilogue
purpose. The ledger returns the matching value with revision, Delta, Anchor,
source-range and provenance metadata, or `null` when no accepted hypothesis
exists for that scope. Current/historical Tool and generated-Remote reads leave
Canon unchanged, and the existing ending-closure area in `conversation.view`
renders the value without inferring it from prose or other Canon facts.

An optional accepted-revision comparison reuses the same deterministic Canon,
narrative and manuscript projectors for both endpoints. It emits stable
added/removed/changed sets for manuscripts, Canon facts, narrative units, clock
entries and debts. Equality ignores source-only rewrites but every real change
retains complete before/after evidence, so non-adjacent and rollback comparisons
describe net domain state instead of replaying transaction logs. The comparison
also rebuilds both typed causal projections and reports, per explicit source
event, downstream events that were added, removed or reached through a different
shortest path. Path equality uses only the accepted edge endpoints, while each
reported before/after path retains its full revision, Delta, Anchor, range and
provenance evidence; the internal graphs are not added to the result.

Only `creative-profile/style-profile` is reserved as a strict versioned author
voice contract; other Creative Profile fields remain generic Canon values. The
profile records its name, voice principles, viewpoint person/distance/rules,
sentence-rhythm principles and forbidden patterns, dialogue principles and
character differentiation, sensory priorities, subtext/exposition rules,
forbidden habits, author-approved source-bearing exemplars and adaptation
boundaries whose invariants must survive allowed variation. Existing structured
Canon retrieval returns historical R1 and current R2 values with source ranges
and provenance while leaving Canon unchanged, and the existing Canon area in
`conversation.view` renders the profile, evidence and rationale directly. It
does not imitate an external author, infer a profile from prose, score style or
add a Tool, store, page, package or alternate UI.

Only `reader-contract/contract-profile` is reserved as a strict versioned reader
promise contract; other Reader Contract fields remain generic Canon values. It
owns a premise with distinctive situation, central dramatic question, reader
fantasy, constraints and tonal range, plus the core experience, named promises,
exclusions, target audience expectations, source-bearing delivery evidence and
revision rationale. Existing structured retrieval returns historical R1 and
current R2 with source ranges and provenance without changing Canon. Delivery
evidence retains its source unit, source revision, Anchor ids and a required
`demonstrates` explanation; omitting that explanation rejects the whole R3
transaction and leaves the head at R2. The existing Canon area in
`conversation.view` renders the premise, promises, exclusions, audience,
evidence and rationale directly. It adds no form, Tool, store, page, package or
alternate UI.

The `world` Canon family accepts `field: "rule"` only as a typed versioned value
containing scope, statement, exceptions, public belief, hidden truth and observed
consequences. Normal Result Packet acceptance advances a rule from R1/v1 to
R2/v2. The existing retrieval Tool and generated Remote then combine
`canonKind: "world"`, the target filter and revision comparison to return the
current source-bearing hit plus complete before/after Canon impact without
changing Canon. The generic Canon and revision UI already presents those facts;
there is no world-rule-specific selector, UI, Tool, store or Profile.

The `roadmap` Canon family similarly accepts `field: "plan"` only as a strict
typed value with `version`, `detailedThroughUnitId`, `horizonSummary` and ordered
units. Each unit carries an explicit target Chapter range, milestone, status,
unit dependencies, scoped debt ids and `changeRationale`. Normal Result Packet
acceptance advances R1/v1 to R2/v2; the existing Tool/generated Remote combines
`canonKind: "roadmap"`, target filtering and revision comparison to return the
current source-bearing hit plus complete before/after impact without changing
Canon. Generic Canon/revision UI presents the accepted plan. This is not an
automatic replanner and adds no query, UI, Tool, store or Profile.

The same retrieval path exposes ten read-only fiction ledgers without adding a
store. `timelineParticipantId` selects only typed accepted story events that
explicitly list that participant and orders them by story time, manuscript order
and event id. `characterTrajectoryId` rebuilds one character's accepted
`character-state` at every revision and diffs consecutive aggregate projections,
so normal sets/removes, same-value evidence changes and rollback restoration use
the same Canon semantics. Each trajectory entry retains packet/provenance,
current fields, before/after facts and explicit accepted-Delta source ranges.
`recentDecision` and `emotionalResidue` are ordinary accepted CharacterState
fields; the projector does not infer a relationship from free-form
`emotion-state` target ids. Only `character-state/arc-hypothesis` is reserved as
a strict typed value; all other CharacterState fields remain generic. The value
records a positive version, scope, hypothesis, starting belief, target
transformation, fixed transformation dimensions, pressures, an accepted costly
decision chain, current stage, unresolved question and nullable rationale. Each
decision retains its story event, pressure, choice, rejected alternatives, cost,
persistent consequence and transformation evidence. The existing trajectory
projector returns historical R2 and current R3 before/after facts with source
ranges and provenance; `conversation.view` gives the arc value and decisions a
dedicated display. Retrieval leaves Canon unchanged and adds no family, Tool,
store or package. `clueLifecycleId` applies the same consecutive
accepted-revision projection to one Clue/Foreshadow target, retaining explicit
sets, removes, source-only evidence changes and rollback-restored fact sources.
Only `clue/state` is reserved as a strict versioned Clue value; every other Clue
field remains generic. It distinguishes clue, foreshadowing and red-herring
roles and retains the statement, linked mysteries, lifecycle status, reader
visibility, intended function, expected payoff window, typed payoff with
aftermath, abandonment reason and revision rationale. The real R1 planted to R2
paid-off path retains historical/current state, before/after, accepted Delta
ranges, packet and provenance; a payoff missing aftermath rejects R3 and leaves
the head at R2. Canon and lifecycle reuse one source-labelled state view without
adding a Tool, store, page or package.
Only `knowledge/state` is reserved as a strict versioned Knowledge value; every
other Knowledge field remains generic. It separates reader and character
subjects, known/suspected/misread belief, retained/recalled/forgotten memory,
belief text and truth alignment. Its access record names the observed, told,
inferred, remembered or misreported acquisition mode, source unit, optional
viewpoint and direct/limited/reported/unreliable viewpoint access. The real
R1→R2 path preserves character and reader updates, historical/current source
evidence, the existing typed knowledge edge and generic confidence fields while
leaving Canon unchanged. Missing `access.unitId` and non-null removes reject R3
with the head at R2. Canon and Knowledge boundary reuse one state presentation;
no Tool, query, store, page or package is added.
`mysteryLifecycleId` projects one strict typed `mystery.state` target whose value
contains a positive version, question, an explicit author-unknown/author-known
truth union, hypotheses, knowers, reader visibility, concealment rule, reveal
conditions, earliest fair resolution, desired reveal window, actual reveal,
aftermath and rationale. Its R1 author-unknown to R2 author-known/revealed
history retains current/historical freshness, before/after values, accepted
Delta ranges, packet and provenance while excluding other mysteries and leaving
Canon unchanged. Each lifecycle entry derives every strict `clue/state` whose
`linkedMysteryIds` match at that accepted revision, preserving clue Delta,
Anchors and provenance. Evidence-only clue changes create an entry with no
duplicated Mystery state and no second clue authority.
Only `promise/state` is reserved as a strict versioned Promise value; every
other Promise field remains on the generic Canon path. The state retains its
version, promise, open `type`, `minor|supporting|major|core` weight and explicit
opened/payoff-start/payoff-end horizon. Setup, reminders and complications are
source-bearing beats with ids, units, positive source revisions, non-empty
SourceAnchor ids and descriptions. Resolution is a discriminated
`open|partially-paid|paid|retired` value: open carries no payoff; partial and
paid resolutions carry one fixed payoff type and beat and require non-empty
aftermath; retired carries a beat and non-empty retirement rationale instead.
`promiseLifecycleId` projects the same state across accepted revisions. The
real R1 open to R2 partially-paid path retains historical/current freshness,
before/after state, revision, accepted Delta ranges, packet, source ranges and
provenance; a paid R3 without aftermath is rejected with the head still at R2.
The existing Canon and Promise lifecycle areas reuse one state presentation.
No Tool, store, page or package is added.
`progressionCharacterId` selects only typed accepted `progression.advancement`
values for one explicit character, orders them by story order, event id and
opaque advancement id, and retains prior limitation, setup, evidence, enabling
action, resource or sacrifice, new capability, remaining limit, counter, social
interpretation, downstream consequence and complete source evidence. Other
characters and legacy free-form rank facts are not inferred into this ledger.
The fresh stock-Web R1→R2 `progressionCharacterId` path is verified by
[`progression-ledger-stock-web-e2e-2026-09-02.md`](progression-ledger-stock-web-e2e-2026-09-02.md):
historical/current retrieval, generated Remote, `projectNarrative`, the
existing selector/Canon ledger and reload agree, while a missing typed value is
rejected atomically. GREEN records 19 RPC and 81 Web API responses with zero
browser failures and a zero-listener shutdown on port `64362`; broader growth
semantics and rollback/process/production/user acceptance remain unverified.
`factionId` selects only explicit typed `faction-state.continuity` values for one
faction and exposes them as `factionContinuity`, ordered by story order, event id
and opaque entry id. Each entry retains goal, resources, constraints, current
action, membership or alliance change, off-screen consequence and complete
source evidence. Current and historical retrieval exclude other factions and
legacy text while leaving Canon unchanged. The fresh stock-Web R1→R2
`factionId` path is verified by
[`faction-state-stock-web-e2e-2026-09-02.md`](faction-state-stock-web-e2e-2026-09-02.md):
the typed record boundary rejects a missing `offscreenConsequence`, while
legacy primitive values remain generic; historical/current retrieval, generated
Remote, `projectNarrative`, the existing selector/ledger and reload agree.
GREEN records 20 RPC and 89 Web API responses with zero browser failures and a
zero-listener shutdown on port `64531`; broader faction semantics and
rollback/process/production/user acceptance remain unverified.
`locationId` selects only explicit typed `location-state.continuity` values for
one location and exposes them as `locationContinuity`, ordered by story order,
event id and opaque entry id. Entries retain their parent location, scale, access
conditions, governing factions, active rules, resource flows, current change,
consequence and typed travel links with destination, travel time, access
conditions and status. Current/historical retrieval retains complete source
evidence, excludes other locations and legacy text, and leaves Canon unchanged.
The fresh stock-Web R1→R2 `locationId` path is verified by
[`location-state-stock-web-e2e-2026-09-02.md`](location-state-stock-web-e2e-2026-09-02.md):
the typed record boundary rejects a missing `consequence`, while legacy
primitive values remain generic; historical/current retrieval, generated
Remote, `projectNarrative`, the existing selector/ledger and reload agree.
GREEN records 20 RPC and 88 Web API responses with zero browser failures and a
zero-listener shutdown on port `64541`; broader location/travel semantics and
rollback/process/production/user acceptance remain unverified.
`objectId` selects only explicit typed `object-state.continuity` values for one
object and exposes them as `objectContinuity`, ordered by story order, event id
and opaque entry id. Entries retain holder, location, quantity, condition,
status, current change, consequence and complete source evidence. Current and
historical retrieval exclude other objects and legacy text and leave Canon
unchanged; this projection does not synchronize inventory, deduplicate objects
or enforce conservation. The fresh stock-Web R1→R2 `objectId` path is verified
by [`object-state-stock-web-e2e-2026-09-03.md`](object-state-stock-web-e2e-2026-09-03.md):
the typed record boundary rejects a missing `consequence`; historical/current
retrieval, generated Remote, `projectNarrative`, the selector/ledger and reload
agree. GREEN records 20 RPC and 90 Web API responses with zero browser failures
and a zero-listener shutdown on port `64373`; broader inventory semantics and
rollback/process/production/user acceptance remain unverified.
`emotionCharacterId` selects only explicit typed `emotion-state.episode` values
whose payload names that character, orders them by story order, event id and
opaque episode id, and retains mixed-emotion intensity, appraisal, expression,
suppression, coping, residue, reactivation, downstream choices and source
evidence. Free-form emotion fields are not parsed and CharacterState residue is
not derived or rewritten. The fresh stock-Web R1→R2 `emotionCharacterId` path is
verified by [`emotion-state-stock-web-e2e-2026-09-03.md`](emotion-state-stock-web-e2e-2026-09-03.md):
the typed record boundary rejects a missing `downstreamChoices`; character/
legacy filtering, historical/current retrieval, generated Remote,
`projectNarrative`, the selector/ledger and reload agree. GREEN records 21 RPC
and 89 Web API responses with zero browser failures and a zero-listener shutdown
on port `64613`; broader psychological semantics and rollback/process/
production/user acceptance remain unverified. All ten ledgers render inside the existing Canon area of
`conversation.view`, not in a new package, tab, adapter or history authority.

The same domain service exposes `projectRelationships` through the generated
Typert Remote. It groups accepted `relationship` facts by explicit `from->to`
keys, aggregates their fields, and retains per-field source metadata while
rebuilding against the requested accepted revision. Opposite directions then
share one lexicographically keyed `A<->B` RelationshipLine without merging or
assuming symmetry between their fields or provenance. Only
`relationship/line-state` is reserved as a strict versioned directional value;
each side independently owns its premise, form, stage, goal, trust, conflict,
commitment, boundaries, shared history, obstacles, unresolved debts, main-plot
consequences, agency evidence, target ending and rationale. Earned turns retain
their event, action, other-side response, cost, persistent consequence and next
stage. The existing `conversation.view` Novel Project panel consumes that Remote
and renders both strict directional states, turns, debts, main-plot consequences
and source labels under the line. Historical R1/current R2 projection and strict
rejection of a consequence-free turn are locally covered; this remains a
read-only derived view over the single Canon record. It does not add a
relationship store, Sidebar/TUI surface or generic adapter.

All ten narrative-clock buckets are reserved as strict versioned contracts.
The generic clock value, schema and delta branches have no remaining consumer
and are removed. The plot contract
scopes one accepted narrative unit and retains at least one line with goal,
stakes, status and ordered obstacle/choice/consequence/reversal turns. Every
turn names its story event, description, cost and resulting state. Historical
R1 and current R2 may keep movement/state/storyTime unchanged while only adding
consequence/reversal turns; revision impact compares the complete accepted
clock value and therefore returns full before/after without treating
provenance-only rewrites as story changes. Existing retrieval returns plot
state, plot debt, Delta, Anchor ranges and provenance, and the Narrative clocks
area renders the same scope, lines, turns, rationale and source. Empty lines,
scope target/level mismatch, missing source anchors and incomplete turns reject
the transaction without advancing the head. No Tool, store, page or package is
added.

The reader-knowledge clock records only manuscript disclosure mechanics and
does not duplicate the accepted `knowledge/state` belief/memory/truth/access
authority. Its scene/chapter/arc/volume scope contains disclosure, hint,
reminder, misdirection or recontextualization events that reference an existing
Knowledge target and retain intended know/suspect/misread/remember effect, unit,
viewpoint/access, description and source Anchors. A preserve/narrow/resolve
ambiguity policy and revision rationale complete the accepted value. Empty
events represent a deliberate hold. Historical/current retrieval and full-value
revision comparison retain nested events, Delta, Anchor ranges and provenance;
scope/version/Anchor violations reject atomically. The existing Narrative
clocks area renders the same events and policy. No Tool, query, store, page or
package is added.

The mystery clock records only per-unit progression and disclosure actions. A
scene/chapter/arc/volume scope contains at least one uniquely identified
open-question, advance, complicate, misdirect, partial-reveal, reveal,
recontextualize or explicit hold move. Each move references Mystery, Clue and
Knowledge target ids and states only its contribution; truth, hypotheses, clue
content and belief/access remain in their existing Canon families. Historical/
current retrieval and full-value revision comparison retain nested refs, Delta,
Anchor ranges and provenance. Empty moves, duplicate ids, scope/level mismatch,
missing Anchors and empty required fields reject atomically. The existing
Narrative clocks area renders the same moves and rationale. No Tool, query,
store, page or package is added.

The progression clock records main/supporting growth tracks, typed pacing
actions, advancement/Promise/Ending target references, setup/payoff readiness,
typed drift warnings and contribution. It does not duplicate the referenced
advancement, Promise or ending facts. The Promise clock records only actual
open/remind/complicate/partial-payoff/payoff/retire/hold moves and Promise/debt
ids; its normal R2 updates the authoritative `promise/state` lifecycle in the
same accepted Packet. The character clock records pressure/decision/
consequence/commitment/transformation/hold against character and story-event
ids without copying arc/trajectory facts. The relationship clock records a
stable pair line, one directional relationship target and story-event/emotion
episode ids. Its R2 can advance A-to-B while the B-to-A state and source remain
at R1. All four retain strict scope/version/rationale, complete revision
comparison, Delta/Anchors/provenance and existing conversation-view rendering;
none adds another Tool, query, store, page or package.

The ending clock stores only closure pacing: a scope and closureScopeId plus
converge/resolve/transform/aftermath/hold moves that reference existing
narrative debts. Ending target, decisive conflict, protagonist choice, thematic
return, final states, aftermath and authoritative debt status remain in the
strict ending hypothesis and closure ledger. The real R1/R2 path updates the
hypothesis, relevant debt and clock in one accepted Packet; existing Tool/
generated Remote comparison and both the Narrative clocks and closure-ledger
locations reuse the same Ending view.

The world clock is reference-only. Each move points to one or more existing
world-rule targets, faction-continuity entries, location-continuity entries or
object-continuity entries and owns only its pacing contribution. Rule content,
continuity content and their sources remain in the existing Canon families and
ledgers. R1/R2 fixtures accept real referenced facts in the same revisions and
the existing combined retrieval path reconstructs all four authorities. Strict
shape/scope/Anchor violations reject atomically; no cross-Canon validator,
world aggregate store, query or page is added.

The tension/payoff scope names one `unitId`
at `scene|chapter|arc|volume` level and contains multiple overlapping waves. A
wave owns its source, qualitative opening/peak/closing intensity, start and
nullable end units, nullable release and recovery records, and typed scene
functions. Release distinguishes planned/occurred and partial/full/reversal,
and retains description, cost and aftermath; recovery retains its marker,
planned/occurred status, description and resulting state. The real R1 fixture
contains an active relationship-aftershock wave beside a pursuit wave with a
costly partial release and planned recovery. R2 advances the pursuit to peak,
full release and occurred recovery. The existing retrieval Tool/generated
Remote returns historical R1, current R2 and their revision comparison with
SourceAnchor ranges, source revision, Delta and provenance while leaving Canon
unchanged. A release without `aftermath` is rejected atomically. The existing
Narrative clocks area renders scope, overlapping waves, intensity, duration,
release, recovery and scene functions; there is no new Tool, store, page or
package.

The style-profile and reader-contract strict extensions are verified for the
fresh stock-Web synthetic Canon-only project-brief R1→R2 path described below;
their local package, Remote and Client gates remain green. The strict
tension-payoff extension is verified for the
fresh stock-Web R1/R2 overlapping-wave projection, rejection and reload path.
The strict relationship line-state extension is
verified for the fresh R1/R2 stock-Web projection, rejection and reload path
described in the evidence section below.

The strict Promise state and pacing-clock extension is verified for the fresh
stock-Web R1/R2 lifecycle/clock update, retrieval, rendering, strict rejection
and reload path described below; its local package, Remote and Client gates
remain green.

The strict Clue state extension is now `verified` for the fresh stock-Web
synthetic R1→R2 lifecycle in
[`clue-state-stock-web-e2e-2026-09-02.md`](clue-state-stock-web-e2e-2026-09-02.md).
The current/historical `clueLifecycleId` projection, generated Remote, existing
clue panel/reload and missing-payoff-aftermath RED all passed; GREEN recorded
22 RPC and 67 Web API responses with zero browser failures and unchanged
Canon/storage on port `64321`. Broader mystery/foreshadowing semantics,
process/transport recovery, production installation and user acceptance remain
unverified.

The strict `mystery/state` lifecycle is now `verified` for the fresh stock-Web
synthetic R1→R2 path in
[`mystery-state-stock-web-e2e-2026-09-02.md`](mystery-state-stock-web-e2e-2026-09-02.md).
R1 author-unknown and R2 author-known truth, linked clue evidence,
historical/current `mysteryLifecycleId` retrieval, generated Remote,
`projectNarrative`, the existing Mystery/Clue panel and reload agree; the RED
rejects an author-unknown truth with a non-null answer while leaving R2 and
Canon/storage unchanged. GREEN records 22 RPC and 60 Web API responses with
zero browser failures and a zero-listener shutdown on port `64463`. Broader
mystery/reveal semantics, rollback-specific restoration, process/transport
recovery, production installation and user acceptance remain unverified.

The strict Plot progression extension is verified for the fresh stock-Web
R1/R2 retrieval, generated Remote, Narrative clocks rendering, strict rejection
and reload path described below. Its local package/Narrative/Remote/Client gates
remain green.

The strict Reader Knowledge clock extension is verified for the fresh stock-Web
R1/R2 nested-event retrieval, generated Remote, Narrative clocks rendering,
strict rejection and reload path described below; its local package, Narrative,
Remote and Client gates remain green.

The strict Mystery clock extension is verified for the fresh stock-Web R1/R2
retrieval, generated Remote, Narrative clocks rendering, strict rejection and
reload path described below; its local package, Narrative, Remote and Client
gates remain green.

The strict Progression, Character and Promise pacing-clock extensions are
verified for their fresh stock-Web R1/R2 projection, rejection and reload paths
described below. The broader Mystery author-truth/fair-reveal semantics remain
locally `implemented-unverified`; the strict synthetic `mystery/state` lifecycle
has a separate fresh stock-Web verification below. Current package `205/205`,
Narrative `28/28`, focused Remote `106/106` and focused Client `34/34` pass. The strict Relationship
pacing-clock extension is also verified for the fresh stock-Web synthetic R1/R2
projection, generated Remote, Narrative clocks, relationship panel,
duplicate-`moveId` rejection and reload path described below; broader
relationship semantics, process/transport recovery, production and user
acceptance remain unverified.

The strict Ending and World clock extensions complete the ten fixed contracts.
Both strict clocks are verified for their fresh stock-Web R1/R2 projection,
rejection and reload paths described below. The 2026-09-02 milestone recorded package `239/239`, Narrative
`30/30`, focused Remote `131/131` and focused Client `41/41` gates remain green;
the separate Clue/Knowledge state and Mystery author-truth lifecycle extensions
retain their narrower statuses elsewhere in this record.

The strict Knowledge state extension is now `verified` for the fresh stock-Web
synthetic R1→R2 path in
[`knowledge-state-stock-web-e2e-2026-09-02.md`](knowledge-state-stock-web-e2e-2026-09-02.md).
The run covers character/reader subject separation, current/historical
`knowledgeSubjectId` retrieval, generated Remote, the existing boundary panel
and reload, plus an atomic missing-`access.unitId` RED; GREEN records 17 RPC
and 67 Web API responses with zero browser failures and unchanged Canon/storage
on port `64341`. Semantic truth inference, graph comparison, process/transport
recovery, production installation and user acceptance remain unverified.

## Retired implementations

The following are not product paths and must not regain active tests or current
documentation:

- local Electron/Forge app, custom `novel-agent://`, preload/IPC carrier and
  second transport;
- `desktop-profile` aggregate/install wrapper;
- `terminal-remote` and `client-ui-terminal`;
- redundant Better Sidebar Canon summary tab and Pi TUI Canon footer packages;
- private Workbench, layout engine, browser, uploader or complete TUI;
- settings that disable a community feature solely so novel-agent can replace it.

The old terminal packages once passed a visible isolated smoke. That remains a
historical observation of removed code, not evidence for the current Better
Sidebar terminal path. Current parity must be earned through the installed
community plugin combination.

## Function-first execution

Before implementing a non-domain feature, inspect DSH and the community plugin
catalog. The order is:

1. install and use a compatible community DSH plugin unchanged;
2. implement only the necessary novel-domain transaction inside the existing
   `novel-project`; if UI is required, contribute it only to stock DSH
   `conversation.view`;
3. if no compatible plugin supplies a generic surface, record the required
   download gap instead of creating a wrapper, adapter package or generic
   subsystem. Changing that product boundary requires a new user decision.

Security work is limited to real trust boundaries exercised by the current
slice. Old carrier hardening and additional generic infrastructure cannot block
novel-domain functionality.

## Alternatives

| Alternative | Decision |
| --- | --- |
| Keep a novel-agent aggregate Profile to install everything | Reject. The user installs the community plugins they need; `novel-project` mounts only itself. |
| Keep a separate in-session terminal because it already passed smoke | Reject. Better Sidebar and Pi TUI provide maintained terminals; the local implementation was duplicate code. |
| Merge community source into novel-agent for convenience | Reject. It creates a fork and a second upgrade boundary. |
| Keep separate Web and TUI adapters for duplicate Canon status | Reject. The necessary panel already exists in `novel-project`; generic hosts remain external downloads. |
| Extend `novel-project` for hierarchy, clocks, review, retrieval and workflow facts | Adopt. These are novel-domain capabilities not supplied by generic plugins. |

## Evidence limits

Source, version and license evidence is recorded in
[the upstream ledger](upstream-sources.md) and
[open-source evaluations](open-source-evaluations/). The self-mounting
`novel-project` has now resolved and started in fresh isolated Web and Pi TUI
Profiles without a local wrapper. Web returned HTTP `200` for the root page and
both client artifacts; Pi TUI displayed its input-ready main shell. This is
composition/startup evidence, not complete Better Sidebar UI or novel-specific
TUI interaction evidence. A separate fresh stock-Web Profile exercised the
necessary domain view end to end: R0→R1 review, one Book hierarchy row, plot
movement, promise debt, all ten clock buckets, source/provenance labels and
reload recovery. Its 10 initial and 4 post-build Novel Project RPCs were HTTP
`200`, with no console, page or failed-request errors; the final hierarchy is an
ordinary accessible list, not a claimed interactive Tree. Browser/Search have
separate fresh rc.2 install, Host/client load and stock settings-UI evidence;
live outbound navigation/search execution remains unverified. File Upload's real
TXT path is separately evidenced, while its unchanged dock error, production
installation and user acceptance remain open.

The fresh stock-Web Canon-only project-brief and strict authoring-contract
evidence verifies the existing setup path: R1 accepts `creative-profile/style-profile`
and `reader-contract/contract-profile` without a manuscript, R2 adds the
`chapter-brief` manuscript and source-bearing style exemplar/reader-delivery
evidence, and a stock Agent retrieves the requested writing memory with
`writingMemoryQuery` while historical R1 excludes R2 evidence. The existing
Canon area renders the current contracts and evidence after reload. The run
recorded 17 RPC and 59 Web API responses with zero browser failures, unchanged
Canon/storage and a zero-listener shutdown on port `64304`; the controlled RED
at `64303` rejected missing exemplar `purpose` and reader evidence
`demonstrates`, keeping head R2. This promotes only the synthetic Canon-only
brief and strict style/reader contract path; external-model quality,
multi-chapter authoring, production installation and user acceptance remain
unverified. See
[`project-brief-style-reader-stock-web-e2e-2026-09-02.md`](project-brief-style-reader-stock-web-e2e-2026-09-02.md).

A separate fresh stock-Web writing-memory run used one isolated rc.2 Profile
across two real Host processes. The accepting Session stored R1 with all three
strict authoring contracts, a character arc, reader disclosure
and Chapter outcome. After Host shutdown, a different Agent Session performed
its own native no-`chapterId` retrieval, retained the accepting Session's
revision/Anchor/provenance, restored all six target sections after renderer
reload and left Canon at R1. The seed/restart phases passed 15/63 and 14/61
direct RPC/Web API responses with zero browser console/page/request failures;
evidence and the narrower claim boundary are in
[`authoring-memory-restart-stock-web-e2e-2026-09-01.md`](authoring-memory-restart-stock-web-e2e-2026-09-01.md).
The restart run itself does not cover the query-independent character
carry-forward or the accepted-`chapterId` branch; production installation and
user acceptance also remain outside that run. Character carry-forward and
relationship/knowledge variants are covered by their later dated evidence
below.

The accepted-`chapterId` branch is now separately verified in a fresh stock-Web
run. One native retrieval returned the complete R1 Book→Chapter control pack
and its 2900–3100 Chapter contract; after reload the existing panel Build
button rendered the same pack while the top-level narrative-unit bucket stayed
empty. The run and its claim boundary are recorded in
[`chapter-control-pack-stock-web-e2e-2026-09-01.md`](chapter-control-pack-stock-web-e2e-2026-09-01.md).
The strict contract's R1→R2 update and `max < min` rejection are additionally
verified by the fresh
[`chapter-contract-stock-web-e2e-2026-09-02.md`](chapter-contract-stock-web-e2e-2026-09-02.md)
smoke: 18 RPC and 67 Web API responses, zero browser failures, unchanged
Canon/storage and a zero-listener shutdown on port `64331`. The strict
`chapter-state/post-check` source join is covered by the separate fresh
stock-Web evidence below; Scene/Beat plan, lock/reference resolution,
process/transport recovery, production installation and user acceptance remain
open.

The strict `chapter-state/post-check` source-join path is separately verified
by [`chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md`](chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md).
The current R3 `chapterId` control pack resolves the R1 Chapter contract, R2
manuscript and R2 Promise debt transition, while retaining the R3 post-check's
changes, costs, reader/character state and source chain. Historical R2 omits
the post-check resolution; generated Remote, `projectNarrative`, the existing
panel and reload agree. GREEN records 23 RPC and 63 Web API responses, zero
browser failures, unchanged Canon/storage and a zero-listener shutdown on port
`64416`; the controlled RED at `64410` omits the debt Delta and fails `0 !== 1`
without changing the accepted head. This promotes only the synthetic source
join; Scene/Beat, lock/reference, rollback-specific source restoration,
process/transport recovery, production installation and user acceptance remain
unverified.

The no-`chapterId` relationship and knowledge branches are now separately
verified in a fresh stock-Web run. At historical R1 against an R2 head, one
native retrieval returned the complete bidirectional `alice<->bob` line and
the `alice`/`reader-main` knowledge ledgers with R1 source ranges and
provenance; the existing panel rendered both families and restored them after
reload. The run recorded 16 direct RPC and 65 Web API responses, zero browser
failures, unchanged Canon/storage, no post-seed `novel/` frames and a
zero-listener shutdown on port `64212`. The controlled RED omitted those R1
facts and failed at `relationshipCarryForward.length`. Exact artifacts and
claim limits are in
[`writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md`](writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md).
This promotion does not cover reader disclosure/Chapter outcome outside the
restart slice, process or transport recovery, production installation or user
acceptance; character carry-forward is covered by its separate evidence below.

The no-`chapterId` hydrated-evidence branch is separately verified in a fresh
stock-Web run. Historical R1 style-exemplar and reader-contract evidence were
hydrated to accepted manuscript excerpts with purpose/demonstrates, source
ranges and provenance while an R2-only evidence item stayed out of the R1
result; the existing panel rendered both items after reload. The run recorded
20 direct RPC and 65 Web API responses, zero browser failures, unchanged
Canon/storage, no post-seed `novel/` frames and a zero-listener shutdown on
port `61514`. The controlled RED failed at an empty reader evidence list.
Exact artifacts and claim limits are in
[`writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md`](writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md).
This does not establish semantic evidence extraction, strict relationship or
knowledge state, process/transport recovery, production installation or user
acceptance.

The no-`chapterId` rolling-roadmap branch is separately verified in a fresh
stock-Web run. Historical R1 returned one versioned roadmap with two ordered
Chapter units, a resolved dependency and an open resolved debt while the R2
future route stayed out of the result; the existing roadmap row rendered it
after reload. The run recorded 19 direct RPC and 66 Web API responses, zero
browser failures, unchanged Canon/storage, no post-seed `novel/` frames and a
zero-listener shutdown on port `64228`. The controlled RED omitted the R1
roadmap and failed at `writingMemory.roadmaps.length`. Exact artifacts and
claim limits are in
[`writing-memory-roadmap-stock-web-e2e-2026-09-02.md`](writing-memory-roadmap-stock-web-e2e-2026-09-02.md).
This is synthetic fixture/projection evidence; broader roadmap semantics,
process/transport recovery, production installation and user acceptance remain
outside the claim.

The no-`chapterId` query-independent character-arc writing-memory path is now
also verified in a fresh stock-Web run. An unrelated writing-memory query still
returned the complete R2 `characterArcHypotheses`; historical R1 returned only
the v1 hypothesis with an empty decision chain, a second unrelated query was
equal, and the existing writing-memory/trajectory panel restored the same
decision after reload. The run recorded 21 RPC and 67 Web API responses with
zero browser failures, unchanged Canon/storage and a zero-listener shutdown on
port `64324`; the controlled RED omitted `persistentConsequence` and kept R2.
Exact artifacts and limits are in
[`writing-memory-character-arc-stock-web-e2e-2026-09-02.md`](writing-memory-character-arc-stock-web-e2e-2026-09-02.md).
This promotes only the synthetic arc-memory projection; reader disclosure/
Chapter outcome outside the restart slice, rollback-specific restoration,
process/transport recovery, production installation and user acceptance remain
unverified. Character carry-forward is covered by the separate no-`chapterId`
evidence below.

The no-`chapterId` query-independent character carry-forward path is separately
verified by the fresh stock-Web run in
[`writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md`](writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md).
At current R2, an unrelated writing-memory query still returned `shen-yan`'s
accepted R1 Chapter post-check carry values with the complete Chapter,
revision, Delta, Anchor range and provenance. Historical R1 excluded the
unrelated R2 event; a second unrelated query and generated Remote agreed, and
the existing writing-memory/trajectory panel restored the item after reload.
The GREEN recorded 20 direct RPC and 68 Web API responses, zero browser
failures, unchanged Canon/storage and a zero-listener shutdown on port `64343`;
the focused RED at `64344` failed on an empty carry-forward while retaining R2.
This promotes only the synthetic carry-forward projection; semantic inference,
rollback-specific restoration, process/transport recovery, production
installation and user acceptance remain unverified.

The fresh stock-Web story-world SimulationRun evidence separately verifies the
existing single-run Results surface in `conversation.view`: one native Tool
call against accepted R1 produced a typed `observe` trace and deterministic
before/after/final projection, the panel restored the run and replay key after
reload, and Canon/storage stayed byte-for-byte unchanged. The isolated run
recorded 18 RPC and 63 Web API responses with zero browser failures and a
zero-listener shutdown on port `64248`; the controlled RED exercised an unmet
typed precondition. This is visible action/UI plumbing evidence only; it does
not promote child isolation, process recovery, comparison experiments,
reader-response comparison UI, production or user acceptance. See
[`story-world-simulation-stock-web-e2e-2026-09-02.md`](story-world-simulation-stock-web-e2e-2026-09-02.md).

The matching fresh stock-Web reader-response evidence verifies the existing
single accepted-text Results surface: one native Tool call at R1 produced a
typed synthetic reaction with exact presented-text identity, Persona, reading
history and provenance; the panel restored the run and replay key after reload,
and Canon/storage stayed unchanged. It recorded 18 RPC and 63 Web API
responses with zero browser failures and a zero-listener shutdown on port
`64252`; the controlled RED supplied an evidence span absent from the presented
text. This is visible reader-response plumbing only and does not promote child
isolation, comparison experiments, process recovery, production or user
acceptance. See
[`reader-response-simulation-stock-web-e2e-2026-09-02.md`](reader-response-simulation-stock-web-e2e-2026-09-02.md).

The strict relationship line-state evidence verifies the existing bidirectional
projection in a fresh stock-Web Profile: independent R1 `alice->bob` and
`bob->alice` states remain separate, R2 updates only the forward direction,
historical/current retrieval and generated Remote agree, and the existing
relationship plus relationship-clock views restore both directions after reload.
The run recorded 21 RPC and 64 Web API responses with zero browser failures,
unchanged Canon/storage and a zero-listener shutdown on port `64267`; a clean
RED rejected an R3 turn missing `persistentConsequence`. This promotes only the
strict line-state R1/R2 projection and read-only panel path for the synthetic
fixture; broader relationship semantics, process/transport recovery, production
and user acceptance remain unverified. See
[`relationship-line-state-stock-web-e2e-2026-09-02.md`](relationship-line-state-stock-web-e2e-2026-09-02.md).

The strict Relationship pacing-clock evidence verifies the companion clock in a
fresh stock-Web Profile: R1 contains one `volume-old-court` alliance move, R2
adds a sacrifice move naming the stable pair, directional target, story event
and emotion episode, and the existing retrieval Tool, generated Remote,
`projectNarrative`, Narrative clocks and relationship panel agree on the
historical/current values and source metadata. Reload restores both moves and
the independent A→B v2/B→A v1 line states. The run recorded 22 RPC and 64 Web
API responses with zero browser failures, unchanged Canon/storage, no post-seed
`novel/` frames and a zero-listener shutdown on port `64287`; the controlled RED
at port `64286` rejected a duplicate `moveId` with R2 unchanged. This promotes
only the strict pacing-clock projection and existing panel path for the
synthetic fixture; broader relationship semantics, process/transport recovery,
production and user acceptance remain unverified.
See [`relationship-clock-stock-web-e2e-2026-09-02.md`](relationship-clock-stock-web-e2e-2026-09-02.md).

The strict Ending closure-clock evidence verifies the existing Book-scoped
closure path in a fresh stock-Web Profile: R1 contains an ending hypothesis,
two acyclic debts and `converge → hold`, while R2 updates the hypothesis and
one debt and advances the clock to `resolve → aftermath → hold`. The native
retrieval, generated Remote, closure query, `projectNarrative`, Ending/Narrative
clocks and closure ledger agree on historical/current values and source
metadata; the panel restores the three moves, hypothesis and dependency rows
after reload. The run recorded 20 RPC and 89 Web API responses with zero browser
failures, unchanged Canon/storage and a zero-listener shutdown on port `64293`;
the controlled RED at `64292` rejected a duplicate `moveId` with head R2
unchanged. This promotes only the strict Ending clock and Book closure path for
the synthetic fixture; broader ending semantics, process/transport recovery,
production and user acceptance remain unverified. See
[`ending-clock-stock-web-e2e-2026-09-02.md`](ending-clock-stock-web-e2e-2026-09-02.md).

The strict World reference-clock evidence verifies the companion reference path
in a fresh stock-Web Profile: R1 contains a Book→Volume→Arc→Chapter hierarchy,
typed world rule, faction/location/object continuity facts and three
reference-bearing moves; R2 updates all four fact families and adds a fourth
move. Native retrieval, generated Remote, `projectNarrative`, typed continuity
ledgers, Narrative clocks and the existing panel agree on historical/current
values and source metadata, and reload restores the clock and references. The
run recorded 20 RPC and 86 Web API responses with zero browser failures,
unchanged Canon/storage and a zero-listener shutdown on port `64297`; the
controlled RED at `64294` rejected a duplicate `moveId` with head R2 unchanged.
This promotes only the strict World reference-clock projection and existing
ledger/panel path for the synthetic fixture; cross-Canon existence validation,
broader world simulation semantics, process/transport recovery, production and
user acceptance remain unverified. See
[`world-clock-stock-web-e2e-2026-09-02.md`](world-clock-stock-web-e2e-2026-09-02.md).

The strict Plot clock evidence verifies the existing revision-aware path in a
fresh stock-Web Profile: R1 retains an obstacle→choice line and open debt, R2
adds consequence→reversal at the same scope, and one native retrieval with
`compareRevision: 1` agrees with the generated Remote and historical/current
`projectNarrative` projections. The existing Narrative clocks area renders the
four turns, source metadata and debt and restores R2 after reload. The run
recorded 18 RPC and 65 Web API responses with zero browser failures, unchanged
Canon/storage and a zero-listener shutdown on port `64264`; the clean RED
rejected a strict plot value with no source anchor. Broader plot semantics,
process/transport recovery, production and user acceptance remain unverified. See
[`plot-clock-stock-web-e2e-2026-09-02.md`](plot-clock-stock-web-e2e-2026-09-02.md).

The strict reader-knowledge clock evidence verifies the corresponding nested
disclosure path in a fresh stock-Web Profile: R1 and R2 retain five event kinds
at one Chapter scope, change the ambiguity policy and an event, and return a
complete historical/current comparison through the native Tool, generated
Remote and `projectNarrative`. The existing Narrative clocks area renders all
five events and restores them after reload. The run recorded 19 RPC and 64 Web
API responses with zero browser failures, unchanged Canon/storage and a
zero-listener shutdown on port `64273`; the clean RED rejected an empty nested
Anchor list. Broader reader-knowledge semantics, process/transport recovery,
production and user acceptance remain unverified. See
[`reader-knowledge-clock-stock-web-e2e-2026-09-02.md`](reader-knowledge-clock-stock-web-e2e-2026-09-02.md).

The strict Mystery clock evidence verifies the existing progression path in a
fresh stock-Web Profile: R1 retains four ordered moves and R2 adds
partial-reveal, reveal and recontextualize moves at the same scope. One native
retrieval with `compareRevision: 1` agrees with the selected generated-Remote
hits/impact and historical/current `projectNarrative`; the existing Narrative
clocks area renders all seven referenced moves, contributions and debt and
restores R2 after reload. The run recorded 18 RPC and 87 Web API responses with
zero browser failures, unchanged Canon/storage and a zero-listener shutdown on
port `64272`; the clean RED rejected a duplicate `moveId`. Broader mystery
progression semantics, process/transport recovery, production and user acceptance
remain unverified. See
[`mystery-clock-stock-web-e2e-2026-09-02.md`](mystery-clock-stock-web-e2e-2026-09-02.md).

The strict tension-payoff evidence verifies the existing overlapping-wave path
in a fresh stock-Web Profile: R1 retains a costly partial pursuit release with
planned recovery beside an ongoing relationship aftershock, while R2 advances
only the pursuit to peak/full release and occurred recovery. One native
retrieval with `compareRevision: 1` agrees with the selected generated-Remote
hit/impact and historical/current `projectNarrative`; the Narrative clocks area
renders intensity, duration, release, recovery and scene functions and restores
both waves after reload. The run recorded 18 RPC and 87 Web API responses with
zero browser failures, unchanged Canon/storage and a zero-listener shutdown on
port `64276`. The RED intentionally omitted `release.aftermath` and was rejected
at the generic Typert command boundary. Broader tension/payoff semantics,
process/transport recovery, production and user acceptance remain unverified. See
[`tension-payoff-clock-stock-web-e2e-2026-09-02.md`](tension-payoff-clock-stock-web-e2e-2026-09-02.md).

The strict Progression clock evidence verifies the existing growth-pacing path
in a fresh stock-Web Profile: R1 keeps a main setup/hold track with accepted
advancement and Promise references, while R2 moves it to apply-consequence with
delivered readiness and a typed missing-cost drift warning. One native retrieval
with `compareRevision: 1` agrees with the generated Remote and historical/current
`projectNarrative`; the Narrative clocks area renders the track, warning and
source metadata and restores R2 after reload. The run recorded 18 RPC and 87
Web API responses with zero browser failures, unchanged Canon/storage and a
zero-listener shutdown on port `64282`; the clean RED rejected an advance with
no advancement id. Broader progression semantics, process/transport recovery,
production and user acceptance remain unverified. See
[`progression-clock-stock-web-e2e-2026-09-02.md`](progression-clock-stock-web-e2e-2026-09-02.md).

The strict Promise clock/lifecycle evidence verifies the existing atomic
Promise path in a fresh stock-Web Profile: R1 accepts an open Promise, debt and
open→remind→hold pacing, while one R2 Result Packet retires the Promise/debt and
adds partial-payoff→payoff→retire. A native retrieval, lifecycle Remote,
`projectNarrative`, Promise/Narrative clocks UI and reload agree on the source
metadata and state change. The run recorded 20 RPC and 88 Web API responses
with zero browser failures, unchanged Canon/storage and a zero-listener
shutdown on port `64285`; the clean RED rejected a duplicate `moveId`. Broader
Promise semantics, process/transport recovery, production and user acceptance
remain unverified. See
[`promise-clock-stock-web-e2e-2026-09-02.md`](promise-clock-stock-web-e2e-2026-09-02.md).

The strict Character pacing-clock evidence verifies the existing pressure-to-
transformation path in a fresh stock-Web Profile: R1 retains pressure/hold,
while R2 adds decision, consequence, commitment, transformation and hold moves
against real character and story-event ids. One native retrieval with
`compareRevision: 1` agrees with the generated Remote and historical/current
`projectNarrative`; the Narrative clocks area renders all seven moves and source
metadata and restores them after reload. The run recorded 19 RPC and 57 Web API
responses with zero browser failures, unchanged Canon/storage and a zero-listener
shutdown on port `64284`; the clean RED rejected a duplicate `moveId`. See
[`character-clock-stock-web-e2e-2026-09-02.md`](character-clock-stock-web-e2e-2026-09-02.md).

The separate strict `character-state/arc-hypothesis` trajectory is now also
verified for its fresh stock-Web R1→R2 path. R1 stores a v1 hypothesis with no
decisions; R2 stores v2 with one complete costly decision. The native
`characterTrajectoryId` retrieval, generated Remote, historical/current
projection, existing trajectory panel and renderer reload agree on the two
entries and their SourceAnchor/Delta/provenance evidence. A controlled R3
packet missing `persistentConsequence` is rejected atomically with the head and
Canon/storage hashes unchanged. The run recorded 20 RPC and 68 Web API
responses with zero browser failures and a zero-listener shutdown on port
`64308`; exact artifacts and limits are in
[`character-arc-trajectory-stock-web-e2e-2026-09-02.md`](character-arc-trajectory-stock-web-e2e-2026-09-02.md).
Rollback-specific arc restoration, broader trajectory fields,
process/transport recovery, production and user acceptance remain unverified.

A separate fresh stock-Web replay now verifies one depth-two role composition
using only the native DSH Subagent and Skill seams. A Standard parent starts an
outer `novel-architect` one-shot child; that child reads accepted R1 and starts
an inner `novel-prose-writer` one-shot child with the explicit
`ARCHITECT_PLAN_R1` handoff. `session.list` and `session.export` retain the
parent/origin links and delegation depths 0/1/2, while R1 Canon and storage stay
unchanged. The exact run, controlled RED and limits are recorded in
[`role-to-role-depth-two-stock-web-e2e-2026-09-01.md`](role-to-role-depth-two-stock-web-e2e-2026-09-01.md).
This does not establish other role pairings, parallel/fault recovery,
cross-Host continuation for these roles, autonomous model selection,
production installation or user acceptance.

A separate fresh stock-Web replay verifies the parallel sibling failure path at
the native Tool seam. One Standard parent emits two foreground `subagent` calls
in a single step; the `novel-architect` child completes its R1 retrieval while
the sibling's unknown Skill returns `isError`, and both children settle without
the successful result being lost. R1 Canon and storage remain unchanged. The
run and its narrower claim boundary are recorded in
[`parallel-fault-recovery-stock-web-e2e-2026-09-01.md`](parallel-fault-recovery-stock-web-e2e-2026-09-01.md).
This is not process/transport crash recovery or retry/cancel semantics, and it
does not promote continuable parallel work or the remaining role pairings.

The same stock-Web composition also verified the bounded automation Token gate
without a new UI or meter. The approval card displayed `maxTokens=20`; the
active Session snapshot recorded DSH's provider-reported 28-Token baseline, the
next 28 Tokens stopped the proposal as `budget-exhausted`, no Result Packet was
created and Canon stayed R1. Its 13 direct RPC and 36 Web API responses all
succeeded with zero console, page or failed-request errors. Exact evidence and
the provider-reporting claim boundary are in
[`token-budget-stock-agent-e2e-2026-08-28.md`](token-budget-stock-agent-e2e-2026-08-28.md).

The focused rc.2 integration also covers the multi-unit Write extension. An
authorization names the ordered `unitIds` (with the single-unit `unitId`
shorthand) and a positive `maxResultPackets`; `chapter-a` and `chapter-b` each
emit one proposal under an R2 policy. Both proposals remain in the same DSH
Session/turn. The active and stopped `novel/automation-policy` snapshots replay
`completedUnitIds`, and the second proposal reaches `scope-complete` before the
native `concludeTurn()` completes that turn. The accepted Canon head remains R2;
author Apply and Publish are still separate decisions. A fresh stock-Web visible
multi-unit approval/completed-turn smoke has not run, so this extension is
`implemented-unverified`.

The same policy now carries positive `maxTokensPerUnit` alongside the total-run
`maxTokens`. Each successful unit snapshot records cumulative run Tokens, so the
next unit's use is the current DSH provider-reported total minus that snapshot.
Focused rc.2 integration allows two consecutive 18-Token units under a 20-Token
per-unit limit, then stops a 21-Token third unit before proposal while retaining
the first two completed ids and leaving Canon unchanged. This adds no counter,
service, event type, queue, UI or store; fresh stock-Web approval remains open.

Wall-time budgeting uses the same replayable policy event and no new runtime
service. The focused real rc.2 Session/Tool integration authorizes
`maxWallTimeMs=100`, preserves the policy event timestamp through seed/replay,
then rejects the existing proposal at `elapsedMs=101` with
`budget-exhausted`, zero consumed Result Packets and Canon still at R1. This is
implementation evidence only; a fresh stock-Web visible approval has not yet
promoted the wall-time slice to `verified`.

For ordered multi-unit Write, positive `maxWallTimeMsPerUnit` uses the latest
active policy event's `time` as the current-unit baseline while the same run's
first policy event remains the total-run baseline. Focused rc.2 integration lets
50ms and 55ms units propose independently, rejects a third at 61ms against a
60ms unit limit, and records the full 166ms run total plus only the first two
completed ids. A second regression serializes `elapsedMs=50` before appending the
active event at 60ms, then correctly treats a proposal at 120ms as exactly 60ms.
The accepted Canon head remains unchanged.

Retry budgeting also reuses the native DSH retry event stream. The author supplies
non-negative `maxRetries`; the pre-proposal gate counts only `llm/retry-started`
events whose sequence follows the authorization policy event, so a queued
`llm/retry` event that never starts is not consumed. Focused real rc.2
Session seed/replay integration covers both two-starts-with-budget-one rejection
and the exact one-start boundary. Fresh stock-Web retry interaction remains
`implemented-unverified`; no retry engine, listener, queue or UI was added.

For the same multi-unit scope, non-negative `maxRetriesPerUnit` subtracts the
latest active snapshot's cumulative `usedRetries` from the first-event-based run
total. Focused rc.2 integration lets the first unit propose after one started
retry, then rejects the second unit after two started retries against a per-unit
limit of one. The stopped snapshot retains three cumulative retries and only the
first completed id; Canon remains unchanged.

Permanent author Canon locks reuse the same stock Tool approval and the sole
Novel Project storage record. The focused real rc.2 Tool/Remote/storage test
locks one accepted R2 fact, rejects a conflicting ordinary Apply and rollback,
reloads the plugin from JSON storage and still rejects the conflict, then uses a
second approved Tool call to unlock and accepts the same proposal as R3. This is
`implemented-unverified` until a fresh stock-Web visible lock/unlock approval
run passes. It adds no conversation control, Pi TUI extension, Better Sidebar
tab, adapter, Profile or Bundle.

Import source data follows the same immutable SourceAnchor path. The normalized
TXT or Markdown import Tool can carry an upstream-reported encoding label, BOM
flag, original byte length and a Workspace `sourcePath`. The Host reads that
path through DSH fs and carries the resolved path plus exact bytes through the
authorization-free Result Packet, author Apply, Typert Remote and storage
reload; callers do not transmit Base64. For one manuscript unit, the existing Publish Tool's `source` format
resolves the projected manuscript's accepted source revision and writes those
exact bytes after stock approval. This preserves BOM and every original line
ending without changing normalized Canon text or adding another Tool or store.

DOCX templates remain ordinary Workspace files rather than a new settings or
template store. After stock Publish approval, the same Tool reads an optional
`templatePath` through DSH fs and uses the adopted `docx` patch API to replace
the fixed `{{title}}` and `{{content}}` placeholders with accepted-revision
material. The resulting binary keeps other template content and still cannot
advance Canon.
