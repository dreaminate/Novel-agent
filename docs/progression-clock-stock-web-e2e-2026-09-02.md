# Strict progression clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `progression` narrative-clock
projection in a fresh stock DSH Web Profile. R1 contains one
`volume-old-court` scope with a main `progression-main-moon-breath` track in
`setup`; R2 keeps the same scope and moves that track to
`apply-consequence`, with delivered payoff readiness and one typed
`missing-cost` drift warning. The track retains accepted advancement and
Promise target ids without copying their facts. One Standard Agent calls the
existing `retrieve_novel_context` Tool with `compareRevision: 1`; the generated
Remote, `projectNarrative` and the existing Narrative clocks area expose the
historical/current values and source metadata. Reload restores R2. No product
code, Tool, store, queue, Workflow or new UI was added.

The exercised implementation is the existing strict progression schema,
resolver and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project`
and temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages
were `0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-progression-clock-stock-web-red-clean-20260902-01a05b3c`

After accepting the valid R1 fixture, it submitted an otherwise valid R2
packet whose only progression delta set the main track to `action: "advance"`
with an empty `advancementIds` array. The HTTP/RPC envelope succeeded with
HTTP `200` and `result.ok: false`; the strict domain refinement rejected it
with:

`progression track 'progression-main-moon-breath' with action 'advance' requires at least one advancementId`

The RED runner asserted the rejection, retained accepted head R1, and verified
byte-identical Canon and storage hashes. It recorded 8 direct RPC and 22
browser-observed Web API responses with zero console, page or request failures.
This is a controlled strict-domain RED, not a host setup or selector failure.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-progression-clock-stock-web-green-clean3-20260902-01a05b3c`

It restored the anchored R1/R2 values and ran the complete native retrieval,
generated Remote, historical/current projection, panel and reload flow.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted a
   `book-main → volume-old-court` hierarchy, character/progression/Promise
   target facts and the strict progression value `v1` (`setup`,
   `setup=in-progress`, `payoff=not-due`). R2 accepted the same scope with
   `v2` (`apply-consequence`, `setup=ready`, `payoff=delivered`) and the
   `progression-warning-cost` `missing-cost` warning.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"narrativeClock":"progression","narrativeUnitId":"volume-old-court"}`

   The turn ended `completed`; no proposal or workflow event occurred.
3. The native result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Its strict clock hit retained the R2 track,
   advancement/Promise ids, readiness, drift warning, source Delta, Anchor
   range and seed provenance. The revision impact contained one changed clock
   entry, with the complete R1 `setup` value and R2 `apply-consequence` value.
4. `projectNarrative` independently returned the R1 `v1` and R2 `v2` buckets;
   the generated Remote returned the same selected narrative-clock hit and
   revision impact as the native Tool. The existing panel rendered
   `[data-narrative-clock="progression"]`,
   `[data-progression-clock-scope="volume-old-court"]`,
   `[data-progression-track="progression-main-moon-breath"]` and
   `[data-progression-drift-warning="progression-warning-cost"]`, including
   source labels and the `missing-cost` description. Reload restored the same
   R2 track and warning.
5. Canon remained at accepted revision R2 throughout retrieval, Remote reads,
   panel rendering and reload. The fixture intentionally leaves
   `endingHypothesisIds` empty after removing an invalid generic ending fact;
   non-empty strict `ending/hypothesis` reference resolution is outside this
   run.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64282`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `0ffc4736-7d13-473d-a1aa-aa4b5606d939`.
- GREEN Session: `session-47844f79-8172-48c1-a3a0-d7864e71947e`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 18 direct RPC and 87 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon `projectCanon` SHA-256 before/after:
  `9BDB73F5947CD976E3701138FB64EA7E0B5C79711D3DA5E28D527195E327E35B`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `F85F0E9F58A5880E59200F4A3A9B03D03F334E6192714981014DAB9C579A0599`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The GREEN Host on port `64282` and RED Host on port `64280` were stopped
  through their PTYs; follow-up listener probes returned zero. An earlier
  discarded host on port `64281` failed before Workspace creation because its
  temporary workspace directory had not been prepared; it is excluded from
  the measured counts.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `965AFDDCC0F59B78DF22C9865EA63C8517E9616BAECC2329F5DEA244E2637F0A` |
| GREEN `progression-clock-stock-trace.zip` | `52EC6960650C1846531E82A48004FDDBFBA8289EFC18A1F26E2FB88F8C72D1A5` |
| GREEN `progression-clock-r2.png` | `A62848C1552AB7043D843B3541D31F4552750AC8975A71EA0486D8E5D5891012` |
| GREEN `progression-clock-r2-reloaded.png` | `DD4CA26C9E3D07554967D0AA17BF40C706671F700ABADB8F4E0C07E86AE56683` |
| GREEN `session.jsonl` | `120B3D74EAD88AD97BB0A53FDBF4ACD788E2E03F7D9EED0D577053195180C37D` |
| GREEN `replay.override.json` | `8F1D01DE54D37A4DFD55CFDDCCEEA95C0BD69797E0E9B8A58DA307133976CD45` |
| RED `red-summary.json` | `36756F9B5FDF89C22A6969F44C205EFE41A89C10EA3E026148F4348F328247D0` |
| RED `progression-clock-red-error.png` | `9AD4FCA3B712A0088B02F5C53EE68CA2250D858D4A071661F27DFD98FD5CEA36` |
| RED `progression-clock-stock-trace.zip` | `5076729C901428FF2F0DB995D9638E922E6A4B36526E1DBFFCCF2D653DF17A5C` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web strict `progression` clock R1/R2
projection, advancement/Promise references, readiness and typed drift warning,
historical/current comparison, generated-Remote agreement, existing Narrative
clocks rendering, renderer reload recovery, strict advancement-free `advance`
rejection and unchanged Canon/storage for this synthetic fixture. It does not
promote non-empty Ending-hypothesis resolution, broader progression semantics,
process/transport crash recovery, production installation or user acceptance.
