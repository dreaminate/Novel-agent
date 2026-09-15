# Strict character-state arc-hypothesis trajectory stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `character-state/arc-hypothesis`
trajectory projection in a fresh stock DSH Web Profile. The fixture uses one
original character (`shen-yan`) and a Book → Volume hierarchy. R1 accepts a
version-1 hypothesis with no decisions. R2 updates the same hypothesis to
version 2 and adds one complete costly decision, including its story event,
pressure, choice, rejected alternatives, cost, persistent consequence and
transformation evidence. The existing `characterTrajectoryId` retrieval path
rebuilds the accepted character state at each aggregate revision and keeps the
fact, accepted Delta, SourceAnchor ranges, packet and provenance. No new fact
family, Tool, store, page or package is introduced.

The exercised implementation is the existing strict schema and trajectory
projector in [`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and the existing
`conversation.view` renderer in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build, and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-character-arc-trajectory-red2-20260902-arcsmoke-01a05b3c`

It first accepted the complete R1 and R2 packets, then submitted an R3
`arc-hypothesis` whose only decision omitted `persistentConsequence`. The
stock RPC envelope was HTTP `200` with `result.ok: false`; the strict error
named `packet.deltas[0].value.decisionChain[0].persistentConsequence`.
The accepted head remained R2. Canon and the sole novel-project JSON storage
record were byte-identical before and after the rejected packet. RED recorded
14 direct RPC and 21 browser-observed Web API responses, with zero console,
page or request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-character-arc-trajectory-green5-20260902-arcsmoke-01a05b3c`

The stock Agent replay emitted one native
`retrieve_novel_context` call with the exact request
`{"revision":2,"compareRevision":1,"characterTrajectoryId":"shen-yan"}`.
The call returned the current R2 trajectory with two entries: R1/v1 with an
empty decision chain and R2/v2 with the complete decision. A generated
`novelProject/retrieve` Remote request for historical R1 returned one
historical trajectory entry and excluded the R2 decision; the current Remote
matched the native trajectory and revision impact. The runner also queried
the historical and current `projectNarrative` projections and confirmed their
requested revisions.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   Book/Volume hierarchy, one story event and the strict v1 arc hypothesis;
   `projectManuscripts(revision: 1)` returned one accepted manuscript.
2. R2 accepted a second manuscript, an updated story event and the strict v2
   arc hypothesis. The decision retained all required fields and named the
   stable `event-share-lantern` id.
3. Native retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The R1 and R2 trajectory fields retained their
   respective `anchor-character-arc-r1` / `anchor-character-arc-r2` ranges and
   accepted Delta ids. The revision impact contained the arc change and the
   companion story-event update; the assertion isolates the requested
   `character-state`/`arc-hypothesis` change.
4. The existing panel exposed the accepted `shen-yan` selector and the
   `Build character trajectory` action. It rendered both trajectory entries,
   the v1 empty decision chain, the v2 decision and its persistent consequence,
   source ranges, packet ids and producer labels. The panel did not render
   `[object Object]` for the nested value.
5. After renderer reload, selecting the same character and rebuilding the
   trajectory restored the R2 entry and its decision. Retrieval and panel
   reads did not create a Result Packet, workflow event or Canon mutation.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64308`; root/navigation HTTP status `200`.
- GREEN Workspace: `0ebabace-340c-47e0-b7fb-b79ad94eda75`.
- GREEN Session: `session-bb231006-1827-47e6-a434-74d49841fc7f`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 20 direct RPC and 68 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 30,241
  UTF-8 bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `4C45B52C0E5984F5B1B34F983B5A26E7C2109E0DB998F5EA5E0A6575CA7A65C5`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `6BA8E7EFFB068480EBAFED4DEDF0B0857FA3AC31EC069360770A40AB63CD85CA`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the GREEN root include `green-summary.json`,
  `character-arc-trajectory-stock-trace.zip`, `character-arc-r2.png`,
  `character-arc-r2-reloaded.png`, `session.jsonl`,
  `replay.override.json`, the fixture and the runner. RED retains the
  corresponding error screenshot, trace, summary and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `3CBCE765DC673DEA4B15684CDE81EA72C4FB9A54675B487B27F830674214F8E4` |
| GREEN `character-arc-trajectory-stock-trace.zip` | `E14824AFBBE089BB9B1F3FE6F6E4A907A7DD956E51052BE09E55F6C7008833D6` |
| GREEN `character-arc-r2.png` | `9521233E3C6568CD69E1B23F4776E05C6C840884D7128790DA669B06F001F464` |
| GREEN `character-arc-r2-reloaded.png` | `9521233E3C6568CD69E1B23F4776E05C6C840884D7128790DA669B06F001F464` |
| GREEN `session.jsonl` | `C40C31BD060643CE887DFE468D48D59811662F03C15A4EFC324C6A0D23D11B39` |
| GREEN `replay.override.json` | `AFE54526818A0EA9740F82280FEC162751F0857F634FC2AA015911D5F1B3BF41` |
| RED `red-summary.json` | `D42493F8B41661A4D176C224BA20419AEDCDB6C089F0ED3590541B2009D6D80F` |
| RED `character-arc-red-error.png` | `5FAAF20CD95F8B025B34D7ACD604BFB6EC4C175C4CABBF8186C33053C9731343` |
| RED `character-arc-trajectory-stock-trace.zip` | `A68232058CB6215A9038F690D4E1EE27CACDDF8293D21ABF929A05EBEEC9367B` |

The final GREEN and RED Hosts were stopped through their PTYs; follow-up
listener probes returned zero for ports `64308` and `64307`. Earlier failed
runner attempts are retained only as diagnostics and are not part of the
measured evidence above.

## Claim boundary

This promotes only the strict synthetic `character-state/arc-hypothesis`
R1→R2 trajectory path: complete typed hypothesis and decision validation,
historical/current `characterTrajectoryId` retrieval, generated Remote
agreement, accepted Delta/Anchor/provenance visibility, existing panel
rendering, renderer reload recovery, strict missing-field rejection and
unchanged Canon/storage. The fixture's manuscripts and arc prose are synthetic
inputs; this is schema/projection and visible plumbing evidence, not a claim
about external-model character quality. It does not promote rollback-specific
arc restoration, cross-Session or process/transport crash recovery, the wider
writing-memory carry-forward path, production installation or user acceptance.
