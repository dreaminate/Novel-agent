# Query-independent character-arc writing memory stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing no-`chapterId` writing-memory path for a
strict, query-independent character arc hypothesis in a fresh stock DSH Web
Profile. The accepted Project head is R2. The retrieval request includes an
intentionally unrelated `writingMemoryQuery`, so the arc must be returned by
its authoring-memory contract rather than by matching search terms. R1 stores
version 1 of `shen-yan`'s arc with no decisions; R2 stores version 2 with one
complete costly decision. The result also includes the same
`characterTrajectoryId` projection, allowing the memory and trajectory views
to be compared without creating another store or fact family.

The run uses the existing `retrieve_novel_context` Tool/generated Remote and
the existing `conversation.view` writing-memory/trajectory areas. No product
source was changed for this increment. The isolated Profile used DSH
`0.1.1-rc.2`, the current local `@novel-agent/novel-project` build and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global
`.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-arc-stock-web-red-ff31a69fbb37435ba27fa5c0e17ee2c1`

It accepted the complete R1 and R2 arc packets, then submitted an R3 strict
arc value whose decision omitted `persistentConsequence`. The RPC envelope
returned HTTP `200` with `result.ok: false`; the error path was
`packet.deltas[0].value.decisionChain[0].persistentConsequence`. The accepted
head stayed R2 and Canon/storage hashes were unchanged. RED recorded 14 direct
RPC and 21 browser-observed Web API responses, with zero console, page or
request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-arc-stock-web-green3-fce0f099b1e24376818e73b2aa042b11`

The stock Agent emitted exactly one native retrieval call with:

`{"revision":2,"compareRevision":1,"characterTrajectoryId":"shen-yan","writingMemoryQuery":"完全无关检索词"}`

The returned `writingMemory.characterArcHypotheses` contained one R2 arc even
though the query terms were unrelated. A second Remote request with a
different unrelated query returned the same arc list. Historical R1 Remote
retrieval returned the v1 hypothesis with an empty decision chain and no R2
decision, proving revision isolation.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   Book/Volume hierarchy and the v1 `character-state/arc-hypothesis`; R2
   accepted the updated story event and v2 hypothesis.
2. The native Tool returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The memory item retained `sourceRevision: 2`,
   Delta `character-arc-hypothesis-r2`, Anchor
   `anchor-character-arc-r2`, source range and producer provenance. Its
   decision retained event, pressure, choice, rejected alternatives, cost,
   persistent consequence and transformation evidence.
3. Historical Remote retrieval at R1 returned the v1 value and
   `anchor-character-arc-r1`; the serialized result contained no
   `decision-share-lantern`. Current Remote output matched the native
   trajectory, revision impact and writing-memory payload. A second current
   query using another unrelated phrase produced an equal
   `characterArcHypotheses` list.
4. The existing panel rendered `Writing memory · R2 · current`, the unrelated
   writing intent, a dedicated `shen-yan` arc-memory item with the v2 decision
   and persistent consequence, and its source evidence. It also rendered the
   existing Character trajectory builder with R1 and R2 entries. Nested values
   were readable and did not appear as `[object Object]`.
5. After renderer reload, the trajectory entry and decision were restored from
   the same accepted revision. Retrieval and panel reads created no Result
   Packet, proposal, workflow event or `novel/` Canon event.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64324`; root/navigation HTTP status `200`.
- GREEN Workspace: `b133771e-01ea-45bb-99fc-329c66806011`.
- GREEN Session: `session-a4b7bc98-9290-4d80-b5ab-9b7d44c60b26`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 21 direct RPC and 67 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 33,233
  UTF-8 bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `2C6B977AD28773C3C762E2FCFE709B70BCEB81414863D81629250915A25954BF`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `9B0040111C6FE31D8521DD44F5C4373B8FB0C908A3755A37ED316D67735B4EBE`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `memory-arc-r2.png`,
  `memory-arc-r2-reloaded.png`, `memory-arc-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains the matching error screenshot, trace, summary and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `5843B9C05215462F98DF0F8B03C59D0CC4E0EFD5395148A65DBE8CEDC6382625` |
| GREEN `memory-arc-r2.png` | `B040809B275687FC4AB8F987B5D28E2DC1798C463927D1F4B93BFC42331F66BC` |
| GREEN `memory-arc-r2-reloaded.png` | `E1F1F1B7838053E929CAD1F6EBC7D848E19359B5BDD4334139DE74E0C48E03D3` |
| GREEN `memory-arc-stock-web-trace.zip` | `10CDAEF863D81A7FD848FBF98110A88F2D39A31E6E59E9794FA450BA1135736D` |
| GREEN `session.jsonl` | `2B86039430F391D51F4103039521BC99259586476077C02D8516B331AF117700` |
| GREEN `replay.override.json` | `154B3D4803CD3280904D564D54D38FC85EC9695E17B5BEBD131975DD5710D671` |
| RED `red-summary.json` | `756906FB40052EDCA60D28EB7DBCE698C6514C4668830D862DE0B6696359518E` |
| RED `character-arc-red-error.png` | `B6EC3E22FC75B13227E89A35176E67B0C3F04ADC17632BD053D127F8FB969E9D` |
| RED `character-arc-trajectory-stock-trace.zip` | `42FCF9224AF8E9B5BF3F388A4F9F90B95928CF8430B65525D33BE1AEED978F8D` |

The RED Host on port `64320` and GREEN Host on port `64324` were stopped;
follow-up listener probes returned zero. Earlier failed attempts are retained
only as diagnostics and are not part of the measured evidence above.

## Claim boundary

This promotes only the synthetic no-`chapterId` query-independent
`writingMemory.characterArcHypotheses` path: strict R1/R2 arc values,
unrelated-query independence, historical revision isolation, generated Remote
agreement, source/Delta/Anchor/provenance retention, existing writing-memory
and trajectory panel rendering, reload recovery, strict missing-field RED
atomicity and unchanged Canon/storage. It does not promote the full
cross-chapter writing-memory contract, post-check/relationship/knowledge
carry-forward, rollback-specific arc restoration, process/transport crash
recovery, external-model writing quality, production installation or user
acceptance.
