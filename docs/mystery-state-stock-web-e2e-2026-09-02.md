# Strict mystery/state lifecycle stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `mystery/state` lifecycle projection in
a fresh stock DSH Web Profile. R1 accepts an author-unknown mystery with two
hypotheses and a linked red herring. R2 updates the same mystery to an
author-known truth with an actual partial reveal and aftermath, and links a
foreshadowing clue that is now paid off. The existing
`mysteryLifecycleId` retrieval Tool/generated Remote, `projectNarrative`,
Mystery/Clue panel and renderer reload are used. No second mystery store, Tool,
page or package is introduced.

The Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used. The new Temp root reused an existing read-only dependency tree via
the runner's junction for package resolution; Workspace, Profile state,
Canon, storage and all evidence artifacts remained in the fresh roots.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-mystery-state-stock-web-red-20260902-01a05b3c-v3`

It accepted the complete R1 and R2 packets, then submitted an R3
`mystery/state` value with `truth.status: "unknown-to-author"` and a non-null
answer. The strict schema rejected `packet.deltas[0].value.truth.answer` with
`expected null, received string`. The accepted head remained R2 and Canon and
storage were byte-identical before and after the rejected packet:

- Canon:
  `2ae64e14f3778840580286e96949b88433c51ee67bd0ee85292c75014cc5c7d4`;
- storage:
  `0469a7e0885a81dc1026ff38b63dd5741505668b120b16dfd74f535a9dfd3d40`.

The RED Host was `http://127.0.0.1:64460`; it recorded 14 direct RPC and 21
browser-observed Web API responses with zero console, page or request failures.
The Host was stopped and a follow-up probe returned zero listeners.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-mystery-state-stock-web-green-20260902-01a05b3c-v3`

The stock Agent emitted exactly one native retrieval call:

`{"revision":2,"compareRevision":1,"mysteryLifecycleId":"mystery-moon-record"}`

The current lifecycle returned the complete known-to-author R2 state and the
historical R1 lifecycle returned the unknown-to-author state without the R2
answer or clue update. The generated Remote matched the native result.

## Observed flow

1. A fresh Workspace and Standard Session accepted a Book → Volume → Arc →
   Chapter hierarchy, the R1 mystery state and a linked planted red-herring
   clue. R2 accepted the known truth, actual reveal and aftermath plus a
   paid-off foreshadowing clue; an unrelated mystery remained outside the
   selected lifecycle.
2. The current Tool result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The R1 entry retained `truth: unknown-to-author`
   with `answer: null`, hypotheses, knowers, reader visibility, concealment
   rule, reveal conditions, fair-resolution unit and source evidence. The R2
   entry retained `truth: known-to-author`, the answer, actual reveal,
   aftermath, rationale and its accepted Delta/Anchor/provenance.
3. Each lifecycle entry derived the matching linked Clue evidence with its own
   source Delta, Anchor ranges and provenance. R1 showed the planted red
   herring; R2 showed the paid-off foreshadowing and retained the red herring.
   The unrelated mystery was excluded. Current/historical `projectNarrative`
   and Remote reads kept their requested revisions.
4. The existing Canon/Mystery lifecycle area rendered the complete author
   truth, reveal, aftermath and linked clue evidence without `[object Object]`.
   After renderer reload, the same mystery selector, lifecycle and source
   labels were restored. Retrieval and panel reads created no proposal,
   workflow event or `novel/` Canon frame.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64463`; root/navigation HTTP status `200`.
- GREEN Workspace: `3090c4da-583b-4cbe-bacf-d57290d34a36`.
- GREEN Session: `session-26afd41f-f53c-46ae-92ed-3276a7bd78b5`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 22 direct RPC and 60 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 39,749 UTF-8
  bytes. Post-seed mux frames: `63`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `04c35d5ac03469462aeafe515ed7d8935f1c18a8cdcee2f677deb93c26de8a4d`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `0a3b5074f21783bc019a24212caaa3d47587149c30998fc64f8cef1fafdcb3fc`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`,
  `mystery-lifecycle-extract.json`, `mystery-lifecycle-historical-extract.json`,
  `mystery-revision-impact-extract.json`, `mystery-state-r2.png`,
  `mystery-state-r2-reloaded.png`, `mystery-state-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains its summary, focused error screenshot, trace and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `9505BCC685C68AEDB650A93BEB5EF3C1CD9396E1BCEC3D077AD0DAC2094C856` |
| GREEN `mystery-lifecycle-extract.json` | `B746F48A1E0E530ED2D22195B3D614C4063CDF4D8E6A78A8047C3E203AE1EDE3` |
| GREEN `mystery-lifecycle-historical-extract.json` | `0029785317F535150C592DE377F3A3B18DE3BA2D6D95046719A2327B9126E2A3` |
| GREEN `mystery-revision-impact-extract.json` | `B6A9F26191A56D4DD1A937B334C6B15F377F79441E1EB31ECDCFF89E8AD9577A` |
| GREEN `mystery-state-r2.png` | `810A8BF3E8B10C37151FC1D87880EF97E13D11C958627DF81F56A58E9419A082` |
| GREEN `mystery-state-r2-reloaded.png` | `810A8BF3E8B10C37151FC1D87880EF97E13D11C958627DF81F56A58E9419A082` |
| GREEN `mystery-state-stock-web-trace.zip` | `5767DEB664B5D311015921CBCB34FBAE1876F881D05C2ED25CEAE5F841E70A4A` |
| GREEN `session.jsonl` | `D8E79630FD44E27BDACE270BFF87EB18C3E300E680BF367F6C2B54292788B5EA` |
| GREEN `replay.override.json` | `EFA6A747ACB7BB6C68209F69770FFBF8809B03090381AD902EC19549F313272A` |
| RED `red-summary.json` | `7D8CAAD60D6339843E63368AF9E147B8C03609814AF00A08E934D925711F4C9E` |
| RED `mystery-state-red-error.png` | `199C0A420943228E56912788CB750603D52C9C8FE761499CA3ACF1D53AC08E87` |
| RED `mystery-state-stock-web-trace.zip` | `0DB70BFE55DA5DFDF41B26A5959D69174251514AC2664038473B8BE2F4042194` |

The GREEN Host was stopped and port `64463` had no listener; the RED Host was
stopped and port `64460` had no listener.

## Claim boundary

This promotes only the synthetic strict `mystery/state` R1→R2 lifecycle:
author-unknown/author-known truth validation, historical/current
`mysteryLifecycleId` retrieval, linked clue evidence, generated Remote and
`projectNarrative` agreement, source/Delta/Anchor/provenance retention, the
existing Mystery/Clue panel and reload, strict invalid-truth rejection and
unchanged Canon/storage. It does not promote semantic mystery inference,
broader reveal quality, rollback-specific lifecycle restoration,
process/transport recovery, production installation or user acceptance.
