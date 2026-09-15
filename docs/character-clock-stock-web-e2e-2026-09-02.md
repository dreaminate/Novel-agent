# Strict character pacing clock stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `character` narrative-clock projection
in a fresh stock DSH Web Profile. The value is scoped to the accepted Volume
`volume-old-court` and identifies the character `shen-yan` only through each
move's stable `characterId`. R1 contains a pressure move linked to the accepted
story event `event-moon-gate-deadline` and a deliberate `hold`. R2 retains those
moves and adds `decision`, `consequence`, `commitment`, `transformation` and a
second `hold`, linked to accepted story events. The clock carries contribution
text and source metadata but does not copy an arc-hypothesis or decision-chain
fact. The existing `retrieve_novel_context` Tool, generated Remote and
`projectNarrative` projections expose historical/current R1/R2 values; the
stock Novel Project Narrative clocks area renders the seven R2 moves and
restores them after renderer reload. Retrieval is read-only and this increment
adds no product code.

The exercised implementation is the existing strict schema and narrative
projection in [`src/index.ts`](../packages/novel-project/src/index.ts),
[`types.ts`](../packages/novel-project/src/types.ts) and
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
with the existing `conversation.view` renderer in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency under:

`C:\Users\33166\AppData\Local\Temp\novel-character-clock-stock-web-green4-20260902-01a05b3c`

The isolated Profile mounted `dsh-base`, `dsh-web-app` and the linked novel
plugin only (plus the replay provider); the user-global `.dsh` was not used.
The complete native retrieval result was 28,403 UTF-8 bytes and stayed inline
under the stock output cap.

## RED → GREEN

The valid controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-character-clock-stock-web-red3-20260902-01a05b3c`

It accepted the complete R1 hierarchy, character-state name fact and first
story event, then submitted an otherwise shape-valid R2 packet with a duplicate
`moveId` inside the strict character clock. The RPC envelope returned HTTP
`200` with `result.ok: false`; the returned strict error preserved the exact
path `packet.deltas[0].value.moves[2].moveId` and the message
`character moveId 'character-move-moon-gate-pressure' must be unique within one
clock value`. The accepted head remained R1 and Canon/storage hashes were
unchanged. RED recorded 8 direct RPC and 22 browser-observed Web API responses,
with zero console, page or failed-request errors. This is a strict contract
wire-boundary rejection after valid Host setup, not a setup or selector failure.

The GREEN restored the anchored R1/R2 values and ran the complete native
retrieval, generated Remote, historical/current narrative projection, panel and
reload checks. R1 had two moves; R2 had seven ordered moves:
`pressure`, `hold`, `decision`, `consequence`, `commitment`,
`transformation`, `hold`. The shared character target remained `shen-yan`, and
the move objects contained no copied `hypothesis` or `decisionChain` fields.

## Observed flow

1. The fresh Web Host created one Workspace and Standard Session. R1 accepted a
   Book → Volume hierarchy, a `character-state` name fact for `shen-yan`, the
   `event-moon-gate-deadline` story event and a version-1 `character` clock at
   Volume scope. The pressure move referenced that event; the hold move had an
   explicit empty event list.
2. R2 accepted a second manuscript, two additional story events
   (`event-share-moon-gate-map` and `event-commit-rescue`) and a version-2 clock.
   The new decision/consequence pair references the first event, while
   commitment/transformation reference the second; the final hold preserves a
   possible relapse without asserting an arc fact.
3. The Standard Agent emitted exactly one native call:

   `retrieve_novel_context({"revision":2,"compareRevision":1,"narrativeClock":"character","narrativeUnitId":"volume-old-court"})`

   It produced exactly one successful native result. No
   `propose_novel_result_packet` call and no `tool-workflow/*` event occurred.
4. Current retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The strict clock hit retained all seven move ids,
   kinds, `shen-yan` target, linked story-event ids and contributions, together
   with source revision 2, Delta `character-clock-volume-old-court-r2`, Anchor
   `anchor-character-clock-r2` and seed provenance. The accepted character and
   story-event facts were also present as Canon hits.
5. The R1→R2 revision impact contained one changed character-clock entry. The
   before value was version 1 with pressure/hold; the after value was version 2
   with all seven moves and source revisions/Anchors 1→2. A historical Remote
   request returned R1 with `freshness: "historical"`; the current Remote
   returned the selected character-clock hit and the same revision impact as the
   native Tool. Historical `projectNarrative` exposed version 1 and current
   `projectNarrative` exposed version 2 with Delta, Anchor and provenance.
6. The existing panel rendered `[data-narrative-clock="character"]`,
   `[data-character-clock-scope="volume-old-court"]` and one
   `[data-character-move="..."]` selector for each of the seven moves. It
   displayed the character id, `Story events` (including `none` for hold), all
   contributions, revision rationale and R2 source label. After `page.reload()`
   the same scope, seven moves and event references remained visible.
7. `novelProject/current` stayed at accepted revision R2. Retrieval, Remote
   reads, panel rendering and reload did not change Canon or storage.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64284`; root and navigation HTTP status `200`.
- GREEN Workspace: `94b61912-aa5f-4833-9da0-51cd5a4e01b1`.
- GREEN Session: `session-7d9680c5-ccfd-4406-9753-03da90538ec3`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 19 direct RPC and 57 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 28,403
  UTF-8 bytes. Post-seed mux frames: `63`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `d54dfb2782ae848527160845ea064a743f758c17fdaba48bace657cc71b194ed`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `3cdab2f8f894ff1f34e6a8c419c8ff12ac251179aec43e8ee4d0450778af7c98`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the GREEN root are `green-summary.json`,
  `character-clock-stock-trace.zip`, `character-clock-r2.png`,
  `character-clock-r2-reloaded.png`, `session.jsonl`, `replay.override.json`,
  `prepare-character-fixture.mjs` and `run-character-smoke.mjs`. The RED root
  retains `red-summary.json`, `character-clock-red-error.png`, the trace,
  replay inputs and the same fixture/runner.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `ECF1776C96F2E0985BD46609F7C29238C77674545B001C7ED4C613F68ED60183` |
| GREEN `character-clock-stock-trace.zip` | `5CDBFD80BB30F45A2F71ABB10F58920CB6C838AE634D16BE2DB4C12FDF9C22AA` |
| GREEN `character-clock-r2.png` | `E2C089CE32DC06130391FEC657795B0A7BC1B0F9EBF6D678E33D97EC1B028F6A` |
| GREEN `character-clock-r2-reloaded.png` | `C0C8596DEB2F0E567116B96C086A36718CE0BECE4FD1DFD76E8F3B6C696C4253` |
| RED `red-summary.json` | `9BA9E3A3C707713445AC05F83FF00CCF67F2E712551AD4E04622EF1753FE270D` |
| RED `character-clock-red-error.png` | `CBF8FBFFB37CBEA26E82255B7FCF6DC497150EA87AFE8E2E7BFC00E4C2C1164B` |
| RED `character-clock-stock-trace.zip` | `317111C7F51D4A046B9D7483C5A36FF9AF1CBD0F2A45258916055A5C32A3B9FB` |

The GREEN Host on port `64284` and RED Host on port `64281` were stopped
through their PTYs; follow-up listener probes returned zero. Earlier discarded
attempts on ports `64277`, `64279` and `64282` were also stopped after their
exact DSH command lines were verified; none is part of the measured final
GREEN/RED counts.

## Claim boundary

This promotes only the strict `character` R1/R2 pacing-clock projection with
pressure/hold/decision/consequence/commitment/transformation moves, real
character and story-event references, source/provenance metadata,
historical/current comparison, generated-Remote selected-hit/impact agreement,
existing Narrative clocks rendering, renderer reload recovery, strict duplicate
`moveId` rejection and unchanged Canon/storage for this synthetic fixture. The
RED gateway may expose either the detailed parser path or its generic command
boundary depending on the Host response; no broader parser-error transport
claim is made. The manuscript, character and event ids are smoke inputs, so this
is schema/projection and visible plumbing evidence rather than semantic
character-arc quality evidence. It does not promote the separate
`character-state/arc-hypothesis` lifecycle, other strict clocks, process or
transport crash recovery, production installation or user acceptance.
