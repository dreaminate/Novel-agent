# Writing-memory rolling-roadmap stock-Web E2E — 2026-09-02

## Scope

This run verifies the no-`chapterId` writing-memory rolling-roadmap branch in
the single `@novel-agent/novel-project` plugin. A stock Standard Agent requests
historical R1 while the Project head is R2. The result must retain the R1
roadmap horizon, ordered Chapter units, dependency and narrative-debt
resolution with source metadata, while excluding the R2 future route. The
existing `conversation.view` roadmap row renders the same projection and
restores it after renderer reload. Retrieval is read-only.

The implementation is the existing revision-bound roadmap resolver and
`writingMemory.roadmaps` projection in
[`src/index.ts`](../packages/novel-project/src/index.ts), rendered by the
stock panel in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx);
this increment adds no product code.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-roadmap-green6-20260902-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used. The complete native result was 30,759 UTF-8
bytes, below the stock 50,000-byte inline-output cap.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-roadmap-red4-20260902-01a05b3c`

It omitted the R1 roadmap and debt deltas while keeping the same expected
assertions. The focused runner failed at the roadmap count (`0 !== 1`,
`run-roadmap-smoke.mjs:385`), after 14 direct RPC and 23 browser-observed Web
API responses; console, page and request failures were zero.

The GREEN fixture restored one compact R1 roadmap with two ordered units and
one open debt, then accepted an R2 future roadmap/debt update. The same runner
passed the historical retrieval, native Tool, Remote, panel and reload checks.

## Observed flow

1. R1 accepted a minimal original manuscript and Book → Volume → Arc → Chapter
   hierarchy, a version-1 `roadmap-main` through `roadmap-unit-gate`, and the
   open `debt-lighthouse` narrative debt.
2. R2 added only `roadmap-unit-future` and `debt-future`, giving the historical
   query a concrete future-revision isolation check.
3. The stock Agent emitted exactly one native
   `retrieve_novel_context({ revision: 1, writingMemoryQuery: "灯塔 海门 月门" })`
   call and completed a roadmap-specific plan response. No proposal or
   workflow call occurred.
4. The Tool returned `revision: 1`, `headRevision: 2` and
   `freshness: "historical"`. `roadmaps` contained one R1 plan with its
   horizon, two ordered Chapter units, a resolved unit dependency, a resolved
   `debt-lighthouse` reference and complete R1 Delta/Anchor/range/provenance;
   R2 future route/debt values were absent. The separate ranked debt bucket
   retained the same R1 source.
5. The generated Remote returned an equal writing-memory payload. The existing
   panel rendered `[data-writing-memory-roadmap="roadmap-main"]`, including
   both milestones and resolved references, and restored the same R1 row after
   reload.

## Evidence and shutdown

- GREEN Workspace: `f0260f6b-440d-45c0-b58e-88682bc66933`.
- GREEN Session: `session-57459921-c3f6-4d3d-9b66-bc36843cf956`.
- The native model/tool call and result counts were each `1`; no proposal or
  workflow events were recorded.
- GREEN recorded 19 direct RPC and 66 browser-observed Web API responses. The
  stock Web root and navigation returned HTTP `200`; console messages, page
  errors and failed requests were all zero.
- Canon remained at accepted revision R2 and its hash stayed
  `2375a5428f618e9793828c0caab8e0a274ba820990183971cfa077d60d09be84` before
  and after retrieval, panel rendering and reload. The sole
  `novel_project.json` storage hash stayed
  `3916bb6fc226e93201c2a942fe292358d01efaf05c52e82f5eefe92689659459`.
- The native result was inline (`nativeResultSpilled: false`) at 30,759 UTF-8
  bytes. No post-seed `novel/` event frame was observed; the built
  `lib/index.js` SHA-256 remained
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts are `green-summary.json`, `roadmap-writing-memory-trace.zip`,
  `writing-memory-panel-r1.png`, `writing-memory-plan-answer-r1.png`,
  `writing-memory-r1-reloaded.png`, `prepare-roadmap-fixture.mjs` and
  `run-roadmap-smoke.mjs` under the GREEN root above. The RED root retains
  `red-summary.json`, the failure screenshot, the trace and the same
  fixture/replay inputs.
- GREEN artifact SHA-256: `green-summary.json` =
  `02B0BDB8B2BE0C5536E668F51ADD21016B9AD9190183FB576F7C7E258AE8EE2C`,
  `roadmap-writing-memory-trace.zip` =
  `FDE40D85B7731BCE7D6920CF8EDB5510A8DB7656973F73161979C1687AC30213`,
  panel PNG =
  `4579E15BD56F117F570296E5308E1F651FDD000626876BAE306F49CE5E66D7B8`,
  plan-answer PNG =
  `7BBA9A68E99118D118AA043316839E064E76601C530024CD04DE984DAD681BAB`,
  and reloaded PNG =
  `4579E15BD56F117F570296E5308E1F651FDD000626876BAE306F49CE5E66D7B8`.
- Host port `64228` was stopped through its PTY; a follow-up listener probe
  returned zero listeners. Earlier failed-attempt ports `64220`–`64227` were
  also confirmed listener-free.

## Claim boundary

This promotes the compact fresh stock-Web no-`chapterId` rolling-roadmap and
debt recall, historical R1 isolation, generated-Remote equality, existing-panel
rendering and reload for the stated fixture. The source text and anchors are
synthetic smoke inputs, so this is projection/plumbing evidence rather than
semantic planning quality. It does not promote the remaining character
carry-forward/arc, process or transport recovery, strict clock variants,
production installation or user acceptance.
