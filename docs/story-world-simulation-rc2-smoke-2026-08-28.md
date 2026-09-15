# Story-world SimulationRun rc.2 smoke — 2026-08-28

## Scope

This increment adds one model-callable `simulate_novel_story_world` Tool to the
existing `@novel-agent/novel-project` plugin. It runs one role-scoped,
counterfactual inhabitant action against a frozen accepted revision and returns
a proposal-only `StoryWorldSimulationRun`. It does not write Canon.

The implementation reuses the stock DSH `SubagentRuntime` and
`subagent-spawn-in-process` provider. No simulation UI, Pi TUI extension,
Better Sidebar tab, Profile, Bundle, Workflow, Job, store or queue was added.

## Focused domain proof

The focused Remote integration seeded R1 with two accepted facts:

- the explicitly granted `character-state:shen-yan:location = 旧庭`;
- the ungranted `canon:masked-rival:plan = 今晚伏击沈砚`.

The Tool sent only the granted R1 fact to the child, requested one typed action
through `outputSchema`, set `toolFilter: { allow: [] }`, returned a
`sourceRevision: 1` SimulationRun and disposed the child. A normal R2 acceptance
then advanced Canon exactly once; the SimulationRun did not create R3, and R1
and R2 remained independently projectable. The Tool accepts an optional caller
`seed` and returns a stable SHA-256 `replayKey` over the canonical frozen input
and emitted action trace; the key is bookkeeping identity only and does not make
the model call deterministic.

## Real DSH rc.2 proof

A second integration used the published, exact `0.1.1-rc.2` implementations of
DSH Agent Loop, Subagent Runtime, in-process driver and spawn provider. A
scripted adapter was the only model boundary.

Observed behavior:

1. The parent Session first contained `PARENT_ONLY_CONVERSATION_SECRET`.
2. `simulate_novel_story_world` spawned a different child Session whose
   `parentSession` pointed to the parent.
3. The child model request contained the granted R1 location, but neither the
   hidden Canon plan nor the parent conversation.
4. The child's model-visible tool list contained only DSH's scoped
   `structured_output` tool.
5. The returned action was validated against the requested schema, the child
   was absent from the live Agent registry after disposal, and Canon remained
   R1.

The DSH components required only by this proof are exact rc.2 development
dependencies. They are not packaged community plugins or a second runtime.

## Verification

- focused story-world fake-boundary test: passed;
- real rc.2 spawn-provider test: passed in 603 ms;
- package/root suite: 5 files, 100 tests passed;
- typecheck: passed;
- lint: passed;
- build: passed;
- package dry-run: passed and contained only `@novel-agent/novel-project`.

## Claim boundary

This verifies the first story-world slice only: one fresh DSH child, one
explicit role view, one structured counterfactual action and one proposal-only
SimulationRun against a frozen accepted revision, plus stable replay identity
metadata. Reader-response simulation, an independent simulation store or durable
queue, repeated semantic model replay, stock-Agent/Profile UI, production
installation and user acceptance remain unverified.
