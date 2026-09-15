# Writing-memory relationship and knowledge stock-Web E2E — 2026-09-02

## Scope

This run verifies the remaining no-`chapterId` writing-memory projections for
bidirectional relationship carry-forward and character/reader knowledge
boundaries. A stock Standard Agent retrieves accepted R1 while the Project head
is R2. The result must retain both R1 relationship directions and every R1
knowledge boundary, while excluding the R2 one-way rewrites and future-only
subject. The existing `conversation.view` panel then renders the same result
and restores it after a renderer reload. Retrieval is read-only.

The implementation is the existing
[`retrieve_novel_context` projection](../packages/novel-project/src/index.ts)
and its stock `conversation.view` renderers in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx);
this increment adds no product code.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-rel-knowledge-green4-20260902-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used. The compact fixture keeps the complete native
retrieval result below DSH's stock 50 KB inline-output limit (27,621 UTF-8
bytes), so the panel's normal JSON result path is exercised without an
upstream spill marker.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-rel-knowledge-red3-20260902-01a05b3c`

It omitted only the R1 relationship and knowledge deltas while keeping the
same expected assertions. The real stock Agent still made the native retrieval
call, but the focused runner failed at
`relationshipCarryForward.length` (`0 !== 1`, `run-minimal.mjs:367`). RED
completed with 14 direct RPC and 21 browser-observed Web API responses and
zero console, page or failed-request errors.

The GREEN fixture restored the R1 relationship and knowledge facts and passed
the same runner. The runner also checks the replayed final assistant text,
generated Remote equality, the R2 future values, the persisted panel and the
reload path.

## Observed flow

1. The Web Host created one Workspace and Standard Session. The runner
   accepted a minimal original manuscript and Book → Volume → Arc → Chapter
   hierarchy as R1, including:
   - `alice → bob`: `secret` and `trust`;
   - `bob → alice`: `trust`;
   - Alice's `clue-moon-key` knowledge plus its accepted Clue field;
   - the `reader-main` `event-north-bell` knowledge plus its accepted
     Story-event field.
2. A second accepted revision R2 changed only Alice's relationship trust and
   knowledge belief and added a future-only knowledge subject. These values
   are present in the head but must not leak into an R1 request.
3. The stock Agent emitted exactly one native
   `retrieve_novel_context({ revision: 1, writingMemoryQuery: "回忆关系边界" })`
   call and completed with the replayed final text. No proposal or workflow
   call occurred.
4. The Tool returned `revision: 1`, `headRevision: 2` and
   `freshness: "historical"`. `relationshipCarryForward` contained one
   `alice<->bob` line with both directions, field-level source Delta and
   provenance, and no `future-broken`. `knowledgeBoundaries` contained exactly
   `alice` and `reader-main`, each with its R1 knowledge field, accepted fact
   field, source range and historical freshness; `future-seal-the-gate` and
   `future-witness` were absent.
5. The generated Remote returned an equal writing-memory payload. The
   existing panel rendered `[data-novel-relationship="alice<->bob"]`,
   `[data-writing-memory-knowledge-boundary="alice"]` and
   `[data-writing-memory-knowledge-boundary="reader-main"]`; the same three
   views were visible after renderer reload.

## Evidence and shutdown

- GREEN Workspace: `9f181a9a-7e52-47b8-bf7c-9240b62c4adc`.
- GREEN Session: `session-a0748b7c-42d7-4ea3-9d3f-fd6d7a31dbfa`.
- The native call and native result counts were both `1`; the exact native
  arguments were `{"revision":1,"writingMemoryQuery":"回忆关系边界"}`.
- The run recorded 16 direct RPC responses and 65 browser-observed Web API
  responses. Every response was successful; console messages, page errors and
  failed requests were all zero. The stock Web root and captured navigation
  both returned HTTP `200`.
- Canon remained at accepted revision R2. The revision-2 Canon hash stayed
  `28d8b3a90c41301ca636568cfd33cc2553f38918e23a24bcf3545b0994c43dea` before
  and after retrieval, panel rendering and reload. The sole
  `novel_project.json` storage hash stayed
  `6ce4fa8c0598e8b280e24738a5d9ff7037341fad82eb18ad4edae5cb37db68a5`.
- No `tool-workflow/*` event or post-seed `novel/` event frame was observed.
  The built `lib/index.js` SHA-256 remained
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The retained artifacts are `green-summary.json`,
  `rel-knowledge-panel-r1.png`, `rel-knowledge-reloaded-r1.png`,
  `rel-knowledge-trace.zip`, `prepare-minimal.mjs` and `run-minimal.mjs` under
  the GREEN root above. The RED root retains `red-summary.json`, the failure
  screenshot, the trace and the same fixture/replay inputs.
- GREEN artifact SHA-256: `green-summary.json` =
  `9B389621FC90DB6B552C1CB44C24F4106C50C02EEE515A8338762B0F400119E6`,
  `rel-knowledge-trace.zip` =
  `1CBFCD50516DB6B5F7539C718B2CD4222B18E9ACC7A13FFDCA2EDE847FBC81EE`, and
  both PNG captures =
  `05A04315FA64655EBFEDA2D03CF3B8ADA685E631785284462207996A5CDE533C`.
- Host port `64212` was stopped through the PTY and a follow-up listener probe
  returned zero listeners. Ports `64210` and `64211` from the earlier failed
  attempts were also confirmed listener-free.

## Claim boundary

This promotes the fresh stock-Web no-`chapterId` relationship carry-forward
and character/reader knowledge-boundary retrieval, existing panel rendering,
generated-Remote equality and renderer reload for the stated R1/R2 fixture.
The source text and anchors are synthetic smoke inputs, so this is evidence for
revision/projection and visible plumbing rather than semantic fact extraction.
It does not promote strict `relationship/line-state` or `knowledge/state`,
rolling-roadmap recall, hydrated evidence, the
accepted-`chapterId` branch beyond its separate evidence record, process or
transport crash recovery, production installation or user acceptance.
