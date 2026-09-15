# Reader-response SimulationRun rc.2 smoke — 2026-08-28

## Scope

This increment adds one model-callable `simulate_novel_reader_response` Tool to
the existing `@novel-agent/novel-project` plugin. It presents one accepted
manuscript unit plus an explicit reading history to one configured audience
persona and returns proposal-only synthetic reaction hypotheses. It never
writes Canon or rewrites the manuscript.

The implementation reuses the same stock DSH `SubagentRuntime` and
`subagent-spawn-in-process` seam as story-world simulation while using a
separate input, output schema, child identity and Tool. No reader UI, Pi TUI
extension, Better Sidebar tab, Profile, Bundle, Workflow, Job, store or queue
was added.

## TDD and focused domain proof

The first focused run failed because `simulate_novel_reader_response` was not
registered. GREEN added the reader-domain types and Tool inside the single
`novel-project` module.

The focused integration accepted two revisions before running against R1:

- R1 presented `沈砚听见墙外脚步，却没有看见来人。` and stored the hidden
  Canon identity `来人其实是顾临川`;
- R2 changed the presented manuscript to `沈砚认出了墙外的顾临川。`.

The child input contained only the requested R1 text, the configured persona
and the explicit reading history. It contained neither hidden Canon nor R2
text. The structured result carried confusion and expectation hypotheses,
exact text evidence, `marketRepresentative: false`, limitations and synthetic
provenance. The child was disposed and the accepted head remained R2. An
optional caller `seed` is carried in the frozen input, and the returned run
includes a stable SHA-256 `replayKey` derived from canonical input plus
reactions; this is a data identity rather than a claim of deterministic model
semantics.

## Real DSH rc.2 proof

A second integration used the published, exact `0.1.1-rc.2` DSH Agent Loop,
Subagent Runtime, in-process driver and spawn provider. A scripted adapter was
the only model boundary.

The first real run exposed that DSH's structured-output JSON Schema subset does
not support `minItems`. The schema keyword was removed; the returned reaction
array remains non-empty through the plugin's Zod domain validation. No DSH or
community-plugin patch was introduced.

Observed behavior after that change:

1. The parent Session first contained `PARENT_ONLY_READER_CONVERSATION_SECRET`.
2. `simulate_novel_reader_response` spawned a different child Session whose
   `parentSession` pointed to the parent.
3. The child model request contained the R1 presented text and reading history,
   but neither hidden Canon nor the parent conversation.
4. The child's model-visible tool list contained only DSH's scoped
   `structured_output` tool.
5. The returned hypotheses passed the typed schema, the child was absent from
   the live Agent registry after disposal, and Canon remained R1.

## Verification

- focused missing-Tool RED: failed for the expected missing registration;
- focused fake-boundary reader-response test: passed;
- real rc.2 spawn-provider reader-response test: passed;
- package suite: 5 files, 100 tests passed;
- root suite: 5 files, 100 tests passed;
- typecheck: passed;
- lint: passed;
- build: passed;
- package dry-run: passed and contained only `@novel-agent/novel-project`.

## Claim boundary

This verifies the first reader-response slice: one configured persona, one
accepted presented-text unit, explicit reading history, one fresh DSH child and
typed proposal-only reactions. Repeated-run variance, alternative unaccepted
text experiments, an independent simulation store or durable queue,
deterministic semantic replay, confidence calibration against provenance-bearing
real-reader feedback, stock-Agent/Profile UI, production installation and user
acceptance remain unverified.
