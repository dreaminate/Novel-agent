# Strict location-state continuity stock-Web E2E — 2026-09-02

## Scope

This run verifies the typed `location-state/continuity` Result Packet boundary
and the existing `locationId` / `locationContinuity` retrieval projection in a
fresh stock DSH Web Profile. R1 accepts a nested lighthouse location; R2 adds a
storm/travel-access entry. The ledger retains nesting, scale, access
conditions, governing factions, active rules, resource flows, travel links,
current change, consequence and source metadata, while excluding another
location and a legacy value. The existing Tool, generated Remote,
`projectNarrative`, Canon selector and reload path are reused.

This code increment adds the strict record-shaped location schema branch to
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts)
and a focused boundary regression in
[`novel-project-result-packet-remote.integration.spec.ts`](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts).
Primitive/array legacy values remain generic Canon facts; typed records must
contain the complete contract, including `consequence` and strict nested
`travelLinks`.

## RED → GREEN

The final controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-location-state-stock-web-red3-20260902-01a05b3c`

It accepted valid R1/R2 data, then submitted an R3 typed location record with
`consequence` omitted. The real `novelProject/review` boundary returned
`result.ok: false` at `packet.deltas[0].value.consequence` (`expected string,
received undefined`); the accepted head remained R2 and Canon/storage hashes
were byte-identical before and after:

- Canon:
  `b1ffbf97c9c4c3ba4249d1fc2df07cdce44b0c1e4c06a8bfd746d1d67ba81702`;
- storage:
  `b751efe827ed8ef40f42656817d1b11a7cb1ed9b527e8b71927e8601f212470f`.

The RED Host was `http://127.0.0.1:64538`; it recorded 12 direct RPC and 22
browser-observed Web API responses with zero console, page or request failures.
Listener PID `29196` was stopped and a follow-up probe returned zero listeners.
An earlier pre-fix exploratory RED is retained in Temp only as the diagnosis
that the generic boundary accepted and persisted the malformed record; it is
not completion evidence.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-location-state-stock-web-green4-20260902-01a05b3c`

The stock Agent emitted one native retrieval with:

`{"revision":2,"compareRevision":1,"locationId":"lighthouse"}`

The current ledger returned the valid R1/R2 entries; historical R1 excluded the
R2 entry, another location and legacy text. Generated Remote and the native
projection agreed, and the existing selector/ledger panel restored the values
after renderer reload.

## Observed flow

1. A fresh Workspace and Standard Session accepted a Book → Volume → Arc →
   Chapter hierarchy and the R1 lighthouse continuity record. R2 added a storm
   record with a typed travel link and an unrelated location/legacy value for
   filtering checks.
2. The current Tool result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Each entry retained parent location, scale, access,
   governing factions, active rules, resource flows, travel links, current
   change, consequence, story order/event/id, source ranges, Delta and
   provenance.
3. Historical R1 retrieval was `historical` and contained only the accepted R1
   lighthouse entry. Current/historical generated Remote and `projectNarrative`
   reads retained their requested revisions. Retrieval and panel reads created
   no proposal, workflow event or `novel/` Canon frame.
4. The existing Canon location selector and continuity ledger rendered the
   nested values without `[object Object]`; renderer reload restored the same
   ledger and source labels.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64541`; root/navigation HTTP status `200`.
- GREEN Workspace: `ba26ee58-5170-4b47-b565-75f443d80bfe`.
- GREEN Session: `session-40ae081f-dbbd-4018-aab5-4962801609af`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 20 direct RPC and 88 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 21,356 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `522af4112bbb7c8f69ebd5d655d382e7002fc3a37e29078e618ba1f26c67e24c`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `c0d0b6915b1dd23202e0b457ab1c0f10046734156f797d6fdd98b0a760713ddd`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `location-state-r2.png`,
  `location-state-r2-reloaded.png`, `location-state-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains its summary, focused error screenshot, trace, host runtime and replay
  inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `48671E7221033DE47B6F87412867753CD033F799681D01C768EB5D467396E294` |
| GREEN `location-state-r2.png` | `EAB8D34D79985D88156B14D00AF2BE195FB886B21E6F684CC682D3C91AF23AED` |
| GREEN `location-state-r2-reloaded.png` | `EAB8D34D79985D88156B14D00AF2BE195FB886B21E6F684CC682D3C91AF23AED` |
| GREEN `location-state-stock-web-trace.zip` | `01F1FE54F8EF6956E941F5BA8E01D5583380D51A440939E8758D811385B7A818` |
| GREEN `host-runtime.json` | `C179982F28BC5DF854B41DEE8038886F087123A4C383F222505494849DCB4663` |
| GREEN `session.jsonl` | `1C667A97505D0E25E573D16CF39650E24256EB308B2D3264A8C9656E0E305D63` |
| GREEN `replay.override.json` | `7F4D5616F86BCC877C90FE568556B02A546EA357BAE47C83417FCFEA530495A5` |
| RED `red-summary.json` | `DFEE428C07F5BA6D238B2B06EF5B6B41D702A9B48479148AB65A467999B189F0` |
| RED `location-state-red-error.png` | `6EB1B2C44A8AFEF7BDA77733EFFEE4398EFEE2137FC85989429C3AC581C3A875` |
| RED `location-state-stock-web-trace.zip` | `E487811CA405D12FA742A100030FBBA5E0EBCC0FBA835CEEE76B65B7A7A0AC68` |
| RED `host-runtime.json` | `A48896F652EA166FFED7D10F46AF12FF622BED7FCBFE03B69BAD980053E0B29E` |

The GREEN Host listener PID was `6824`; it was stopped with zero listeners and
`loopbackAfterStop: "refused"`. Both ports `64541` and `64538` were
listener-free after shutdown.

## Claim boundary

This promotes only the synthetic typed `location-state/continuity` path:
strict missing-field rejection, current/historical `locationId` retrieval,
source/Delta/Anchor/provenance retention, generated Remote and
`projectNarrative` agreement, existing selector/ledger rendering and reload,
and unchanged Canon/storage. It does not promote semantic location inference,
travel adjudication, rollback-specific restoration, process/transport recovery,
production installation or user acceptance.
