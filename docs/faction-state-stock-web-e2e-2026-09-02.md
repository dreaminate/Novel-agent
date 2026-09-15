# Strict faction-state continuity stock-Web E2E — 2026-09-02

## Scope

This run verifies the typed `faction-state/continuity` Result Packet boundary
and the existing `factionId` / `factionContinuity` retrieval projection in a
fresh stock DSH Web Profile. R1 accepts one agenda entry for `moon-council`; R2
accepts a second entry. The ledger must retain goal, resources, constraints,
current action, membership/alliance change, off-screen consequence and source
metadata, while excluding another faction and a legacy free-text value. The
existing native Tool, generated Remote, `projectNarrative`, Canon selector and
reload path are used. No new Tool, store, page or package is introduced.

The code increment adds a strict schema branch for record-shaped
`faction-state/continuity` values in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts)
and a focused regression in
[`novel-project-result-packet-remote.integration.spec.ts`](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts).
Primitive/array legacy values remain generic Canon facts; typed records must
contain the complete continuity contract.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-faction-state-stock-web-red-20260902-final-01a05b3c`

It seeded valid R1/R2 data, then submitted an R3 typed continuity record with
`offscreenConsequence` omitted. The real `novelProject/review` boundary rejected
`packet.deltas[0].value.offscreenConsequence` (`expected string, received
undefined`) before advancing the head. The accepted head remained R2; Canon
and storage were byte-identical before and after:

- Canon:
  `644a9f573f6e60e4c98c3c13f6ae1761d18946e355a9b3330871018fcea2fa9`;
- storage:
  `e825f8b286230854cffd2f26080ee57d72a8edd5a3ee0bd17c532333c471f95f`.

The RED Host was `http://127.0.0.1:64530`; it recorded 12 direct RPC and 22
browser-observed Web API responses with zero console, page or request failures.
Listener PID `6380` was stopped and the follow-up probe returned zero listeners.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-faction-state-stock-web-green-20260902-final-01a05b3c`

The stock Agent emitted exactly one native retrieval call:

`{"revision":2,"compareRevision":1,"factionId":"moon-council"}`

The current ledger returned both valid typed entries; historical R1 returned only
the R1 entry. The generated Remote and native result agreed, and the existing
selector/ledger panel restored the same values after renderer reload.

## Observed flow

1. A fresh Workspace and Standard Session accepted a Book → Volume → Arc →
   Chapter hierarchy and the R1 `moon-council` continuity entry. R2 added a
   second `moon-council` entry, one `river-wardens` entry and a legacy string;
   only the requested faction's typed records belong in the ledger.
2. The current Tool result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Both entries retained all required typed fields,
   story-order/event/id ordering, source Delta/Anchor ranges and producer
   provenance. Historical R1 was `historical` and excluded the R2 entry,
   another faction and legacy text.
3. Generated Remote retrieval, `projectNarrative` R1/R2 hierarchy reads and the
   native Tool agreed on the requested revisions. Retrieval and panel reads
   created no proposal, workflow event or `novel/` Canon frame.
4. The existing Canon faction selector and continuity ledger rendered the two
   entries without `[object Object]`; renderer reload restored the same ledger
   and source labels.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64531`; root/navigation HTTP status `200`.
- GREEN Workspace: `171ee1bb-ad4d-4685-a0e8-468eb1dec556`.
- GREEN Session: `session-0d43f473-4205-49a8-9d19-5f6e9f36b995`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 20 direct RPC and 89 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 18,209 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `2706fc347d7b42510e4b5d38ef95766b8a65b058cb2c0f01020724549db8289f`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `0e10d4066d0b8339378769a57208d941bc8f83c73d41070fe54e138e20fefc59`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `host-runtime.json`,
  `faction-state-r2.png`, `faction-state-r2-reloaded.png`,
  `faction-state-stock-web-trace.zip`, `session.jsonl`,
  `replay.override.json`, the fixture and the runner. RED retains its summary,
  focused error screenshot, trace, host runtime and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `2B5F1DE19BEFF6A14CEC5AB523853BE7BD6667AD05E27E1DD514A5E3C0B4D41E` |
| GREEN `host-runtime.json` | `6EEA22615771ED4158EA253A9336E733897D770865085BEF0F99A46471F3F5F8` |
| GREEN `faction-state-r2.png` | `52F4A65D14774F38C73A071BFD6CE00AE23BFE3A6291A5ADF4974ED4E8FA571B` |
| GREEN `faction-state-r2-reloaded.png` | `52F4A65D14774F38C73A071BFD6CE00AE23BFE3A6291A5ADF4974ED4E8FA571B` |
| GREEN `faction-state-stock-web-trace.zip` | `3B12A54D556DC26688A9705741E63C9EBD3F258102EA89763C278DE277149ADD` |
| GREEN `replay.override.json` | `AE4997727748222158360741513DB91CEB82B1146BB39FCE09F2841C95F126D6` |
| GREEN `session.jsonl` | `D7A07F05F50AEEA2C96258A38F5C2CDC6DE9865F1E8C23EFD66D4C6D6DEF5937` |
| RED `red-summary.json` | `C7E3BCD5C22DA7D06D5046B3A3DA5DA0A7A74C2ADA46EC66741606C717A6A8E7` |
| RED `faction-state-red-error.png` | `22FC553480AEB5471D5618059204F0D834DACD588EE5D258DA7D3B2093498A98` |
| RED `faction-state-stock-web-trace.zip` | `9CED698DAC252EA2193EA1FA398AF288E529630A58D719F94AFA4893B317C811` |
| RED `host-runtime.json` | `C614C108C9D8351694F2CB186B3078EE0140B5D359FD9265727B3EE11D3677EA` |

The GREEN Host listener PID was `24008`; it was stopped with
`zeroListeners: true` and `loopbackAfterStop: "refused"`. Both ports `64531`
and `64530` were listener-free after shutdown.

## Claim boundary

This promotes only the synthetic typed `faction-state/continuity` path:
strict missing-field rejection at the Result Packet boundary, current/historical
`factionId` retrieval, source/Delta/Anchor/provenance retention, generated
Remote and `projectNarrative` agreement, existing selector/ledger rendering,
reload recovery and unchanged Canon/storage. It does not promote semantic
faction inference, rollback-specific restoration, process/transport recovery,
production installation or user acceptance.
