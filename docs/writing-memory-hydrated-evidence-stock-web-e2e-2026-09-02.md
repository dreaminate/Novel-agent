# Writing-memory hydrated evidence stock-Web E2E — 2026-09-02

## Scope

This run verifies that accepted authoring-contract evidence is hydrated into
the existing no-`chapterId` writing-memory result. A stock Standard Agent
retrieves historical R1 while the Project head is R2. The R1 style exemplar
and reader-contract evidence must resolve to the accepted manuscript excerpt,
purpose/demonstration, SourceAnchor range and provenance; an R2-only evidence
item must not appear in the R1 result. The existing `conversation.view` panel
renders both evidence items and restores them after a renderer reload.
Retrieval remains read-only.

The implementation is the existing
[`writingMemoryAuthoringEvidence`](../packages/novel-project/src/index.ts)
projection and stock panel renderer in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx);
this increment adds no product code.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-evidence-green2-20260902-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used. The complete native result was 48,277 UTF-8
bytes, below the stock 50,000-byte inline-output cap, so the normal panel JSON
path was exercised without a spill marker.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-evidence-red2-20260902-01a05b3c`

It kept the reader contract but left its `evidence` array empty. The stock
Agent still made the native retrieval call, and the focused runner failed at
`readerContract.evidence.length` (`0 !== 1`, `run-hydrated-smoke.mjs:511`).
RED recorded 15 direct RPC and 23 browser-observed Web API responses; all were
HTTP-successful and console, page and request failures were zero.

The GREEN fixture added one accepted R1 reader-contract evidence item and a
Canon-only R2 contract revision containing a future-only evidence item. The
same runner then passed all retrieval, Remote, panel and reload assertions.

## Observed flow

1. The Web Host created one Workspace and Standard Session. R1 accepted the
   existing manuscript, hierarchy, strict authoring contracts, character arc,
   reader disclosure and Chapter outcome. The style contract carried the
   accepted exemplar `exemplar-snow-courtyard-r1`; the reader contract carried
   `evidence-reader-contract-r1` pointing to `chapter-plan-1` at R1.
2. A Canon-only R2 update added `evidence-reader-contract-r2-future` and
   changed the reader contract to version 2. The subsequent request still
   targeted R1, so that future evidence had to be excluded.
3. The stock Agent emitted exactly one native
   `retrieve_novel_context({ revision: 1, writingMemoryQuery: "旧潮声 灯塔 海门" })`
   call and completed its replayed plan response. No proposal or workflow call
   occurred.
4. The Tool returned `revision: 1`, `headRevision: 2` and
   `freshness: "historical"`. The style exemplar and reader evidence each
   contained the exact accepted manuscript text, their source revision and
   Anchor range, and the accepting Session provenance. The R2 evidence id and
   future demonstration text were absent.
5. The generated Remote returned an equal writing-memory payload. The existing
   panel rendered
   `[data-writing-memory-contract-evidence="approved-style-exemplar:exemplar-snow-courtyard-r1"]`
   and
   `[data-writing-memory-contract-evidence="reader-contract-evidence:evidence-reader-contract-r1"]`;
   both selectors and their source text survived renderer reload.

## Evidence and shutdown

- GREEN Workspace: `60f39fc2-19fd-4d00-88f2-44904df2395c`.
- GREEN Session: `session-e4dd7a89-9c18-4c49-89e7-0ab8dcd49666`.
- The native model/tool call and result counts were each `1`; no proposal or
  workflow events were recorded.
- GREEN recorded 20 direct RPC and 65 browser-observed Web API responses. The
  stock Web root and navigation returned HTTP `200`; console messages, page
  errors and failed requests were all zero.
- The retrieval was historical R1 against head R2. Canon remained at R2 and
  its hash stayed
  `605e83243af4bbdd28a58b62970795496783546305d559fc4ad53f53c595e309` before
  and after retrieval, panel rendering and reload. The sole
  `novel_project.json` storage hash stayed
  `8040a3f72b8b6b9415126f64c13fe688d3d52fd6f89280714191380a6d6778c9`.
- The native result was inline (`nativeResultSpilled: false`) at 48,277 UTF-8
  bytes. No post-seed `novel/` event frame was observed, and the built
  `lib/index.js` SHA-256 remained
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts are `green-summary.json`,
  `hydrated-evidence-trace.zip`,
  `hydrated-evidence-writing-memory-panel-r1.png`,
  `hydrated-evidence-writing-memory-plan-answer-r1.png`,
  `hydrated-evidence-writing-memory-r1-reloaded.png`,
  `prepare-hydrated-fixture.mjs` and `run-hydrated-smoke.mjs` under the GREEN
  root above. The RED root retains `red-summary.json`, the failure screenshot,
  the trace and the same fixture/replay inputs.
- GREEN artifact SHA-256: `green-summary.json` =
  `91DE17A0B4DD24BE8BE45D8BF9CCCFAE71756E835CE5DA287F89EC71C762E314`,
  `hydrated-evidence-trace.zip` =
  `28878552216654A1C944BC323657C6F1E94C1D94F3510C436B57135B57BE843F`,
  panel PNG =
  `D268E7EC2EEA4454DB74102EEB90DE9A53228FC7AE7DBCC9EE9E2AAA68595C05`,
  and reloaded PNG =
  `29D4E41E9C5D58112117FA303EC3BD6CDFE35C3B80DD42C07E19A40A1F26AD39`.
- Host ports `54668` (RED) and `61514` (GREEN) were stopped through their
  PTYs; follow-up probes returned zero listeners.

## Claim boundary

This promotes hydrated style-exemplar and reader-contract evidence on the
fresh stock-Web no-`chapterId` path, including historical revision isolation,
Remote equality, existing-panel rendering and reload for the stated fixture.
The source manuscript and anchors are synthetic smoke inputs, so this does
not claim semantic evidence extraction. It does not promote rolling-roadmap
recall, process/transport recovery, strict `relationship/line-state` or
`knowledge/state`, production installation or user acceptance.
