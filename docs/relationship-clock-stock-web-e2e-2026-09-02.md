# Strict relationship pacing clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `relationship` pacing clock in a
fresh stock DSH Web Profile, separately from the already verified
`relationship/line-state` projection. R1 contains one `volume-old-court` clock
with an `alice<->bob` alliance move. R2 appends a sacrifice move that names the
same stable pair line, the directional `alice->bob` target, a story-event id
and an emotion-episode id. The accepted directional line states remain
independent: R2 advances A→B while B→A remains at R1. The existing
`retrieve_novel_context` Tool, generated Remote, `projectNarrative`, Narrative
clocks area and relationship panel expose the historical/current values,
references, source metadata and reload state. No product code, Tool, store,
queue, Workflow or new UI was added.

The exercised implementation is the existing strict relationship-clock schema,
narrative resolver and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project`
and temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages
were `0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-relationship-clock-stock-web-red-20260902-01a05b3c`

It accepted valid R1/R2 line-state and relationship-clock data, then submitted
an otherwise shape-valid R3 relationship-clock value whose second move reused
the first move's `moveId`. The HTTP/RPC envelope returned HTTP `200` with
`result.ok: false`; strict refinement rejected it with:

`relationship moveId 'relationship-move-alliance' must be unique within one clock value`

The RED runner retained accepted head R2 and verified byte-identical Canon and
storage hashes. It recorded 10 direct RPC and 21 browser-observed Web API
responses with zero console, page or request failures. This is a controlled
strict-domain RED, not a host setup or selector failure.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-relationship-clock-stock-web-green-20260902-01a05b3c`

It restored the anchored R1/R2 values and ran the complete native retrieval,
generated Remote, historical/current relationship projection, Narrative clocks,
relationship panel and reload flow.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted a
   `book-main → volume-old-court` hierarchy, one story event, independent
   A→B/B→A strict `relationship/line-state` facts and a version-1 relationship
   clock with one alliance move. R2 accepted a second story event and emotion
   episode, updated only A→B to line-state v2, retained B→A at v1, and added a
   second relationship-clock move carrying the event and emotion references.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"canonKind":"relationship","canonTargetId":"alice->bob","narrativeClock":"relationship","narrativeUnitId":"volume-old-court"}`

   The turn ended `completed`; no proposal or workflow event occurred.
3. The native result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Its relationship-clock hit retained both moves,
   stable pair/directional/event/emotion references, R2 source Delta, Anchor
   range and seed provenance. The complete revision impact contained one
   changed clock entry (one R1 move versus two R2 moves) and the changed A→B
   line-state; the B→A projection remained sourced from R1.
4. The generated Remote returned the same selected relationship-clock hit and
   revision impact. Independent `projectRelationships` calls returned the
   `alice<->bob` pair with both directions; independent `projectNarrative`
   calls returned relationship clock versions 1 and 2 with source metadata.
5. The existing panel rendered
   `[data-narrative-clock="relationship"]`,
   `[data-relationship-clock-scope="volume-old-court"]`, both
   `[data-relationship-move]` entries and the existing relationship section
   with separate `[data-relationship-line-state="alice->bob"]` and
   `[data-relationship-line-state="bob->alice"]` states. After reload it
   restored the clock, the two moves, A→B v2 and B→A v1.
6. Canon remained at accepted revision R2 throughout retrieval, Remote and
   `projectNarrative` reads, panel rendering and reload.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64287`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `4ce85612-e62b-4ad3-89b7-7faabc61a444`.
- GREEN Session: `session-c2eceb8a-e7ff-4fec-8f14-adce9347799f`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 22 direct RPC and 64 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 23,111 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon `projectCanon` SHA-256 before/after:
  `52949755119DA118EF34D3646EA01BEBE73806E57C47BFCC70D50DB1A940F10D`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `BB455C10DBB298C09C30B0852536FE37A01557090C38F4ADDCB51134DBA20003`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The GREEN Host on port `64287` and RED Host on port `64286` were stopped
  through their PTYs; follow-up listener probes returned zero.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `1243B8DF6A1801C403031262994913EF0F838894A9DF33B3837A5DC5B7BCC8EE` |
| GREEN `relationship-clock-stock-trace.zip` | `1152C84C3990C442F59828CD9D575416B3F0569C1D362A9D9B22DFFD3D54C4CE` |
| GREEN `relationship-clock-r2.png` | `A4EF8FCC2A6F4A8B3A40C4CFA917A708C316D665B2D877FE5D8DF6A83FBE1167` |
| GREEN `relationship-clock-r2-reloaded.png` | `08E8AFFB7CD85021B42742D8BA9EC70243C20ECF730816285B1DA1AD959F5B20` |
| GREEN `session.jsonl` | `2D51FBBC3C2B96C4F676115F649E5E19FFB291B7239DB20A06B6E851B74962FF` |
| GREEN `replay.override.json` | `7596E328C3FA787F1187145321206A0219FDCBF3B48AEA1D0AAF89CABDFD47F9` |
| RED `red-summary.json` | `42D8C0282D8B7E8A28035DD40BC34BFE7AF322452D0C517C2449D5A7BAB4868F` |
| RED `relationship-clock-red-error.png` | `5707A57500E3524525C480447BCB2FE77AC58B69CD7391D1F957F82B8AA531AD` |
| RED `relationship-clock-stock-trace.zip` | `6C3E172BCFEFEA51A70D6CEDC39888E7109338A20A06422DFE8F715DDAB68405` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web strict relationship pacing-clock R1/R2
projection, stable pair/directional/story-event/emotion references, independent
A→B/B→A line-state retention, historical/current comparison,
generated-Remote and `projectNarrative` agreement, existing Narrative clocks and
relationship panel rendering, renderer reload recovery, strict duplicate-
`moveId` rejection and unchanged Canon/storage for this synthetic fixture. It
does not promote the other strict clocks, broader relationship semantics,
process/transport crash recovery, production installation or user acceptance.
