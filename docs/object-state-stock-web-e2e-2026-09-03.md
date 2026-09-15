# Strict object-state continuity stock-Web E2E — 2026-09-03

## Scope

This run verifies the typed `object-state/continuity` Result Packet boundary
and the existing `objectId` / `objectContinuity` retrieval projection in a
fresh stock DSH Web Profile. R1 and R2 track the custody, location, quantity,
condition and status of `tide-key`. The ledger retains current change,
consequence and complete source metadata while excluding another object and a
legacy value. The existing Tool, generated Remote, `projectNarrative`, Canon
selector and reload path are reused.

This code increment adds a strict record-shaped object schema branch to
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts)
and a focused boundary regression in
[`novel-project-result-packet-remote.integration.spec.ts`](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts).
Primitive/array legacy values remain generic Canon facts; typed records must
contain the complete contract, including `consequence`.

## RED → GREEN

The final controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-object-state-stock-web-red2-20260903-01a05b3c`

It accepted valid R1/R2 data, then submitted an R3 typed object record with
`consequence` omitted. The real review boundary rejected
`packet.deltas[0].value.consequence`; the accepted head remained R2 and Canon
and storage were byte-identical before and after:

- Canon:
  `d6d619cb44689926fb939e5c7314a199597cad97449bfbd31347d4e252eaf0b5`;
- storage:
  `cc564f064ea7a7e1676cc3fc75d8078ef080534bb354414304425eed7375b1ae`.

The RED Host was `http://127.0.0.1:64372`; it recorded 9 direct RPC and 21
browser-observed Web API responses with zero console, page or request failures.
Listener PID `5836` was stopped and the follow-up probe returned zero listeners.
An earlier pre-fix exploratory RED is retained in Temp only as diagnosis of the
acceptance/read divergence and is not completion evidence.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-object-state-stock-web-green2-20260903-01a05b3c`

The stock Agent emitted one native `objectId: "tide-key"` retrieval at R2 with
historical R1 comparison. The current ledger returned the valid R1/R2 entries;
historical R1 excluded the R2 entry, another object and legacy text. Generated
Remote and the native projection agreed, and the existing selector/ledger panel
restored after renderer reload.

## Observed flow

1. A fresh Workspace and Standard Session accepted the hierarchy and R1
   `tide-key` continuity record; R2 updated the same object and included an
   unrelated object/legacy value for filtering checks.
2. The current ledger returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Each entry retained holder, location, quantity,
   condition, status, current change, consequence, story order/event/id,
   source Delta/Anchor ranges and producer provenance.
3. Historical R1 retrieval was `historical` and excluded all R2-only data.
   Current/historical generated Remote and `projectNarrative` hierarchy reads
   retained their requested revisions. Retrieval created no proposal, workflow
   event or `novel/` Canon frame.
4. The existing Canon object selector and ledger rendered both typed entries
   without `[object Object]`; renderer reload restored the same source labels.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64373`; root/navigation HTTP status `200`.
- GREEN Workspace: `bb941528-ae13-4a3f-accd-0187d7f41903`.
- GREEN Session: `session-7164237d-57aa-4bd2-a1be-1328d6a3ebe2`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal/workflow counts: `0 / 0`;
  the replayed turn ended `completed`.
- GREEN recorded 20 direct RPC and 90 browser-observed Web API responses with
  zero console, page or failed-request errors.
- Native result stayed inline at 17,013 UTF-8 bytes. Post-seed mux frames: `70`;
  post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `e07978a147ef2ec7cfba60cdd569717ccc91278964d8415d9539102cea0fc523`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `1321aeeafb4bc7c29a8bd195b156b4e6fde671b2bd28a355e92ab2c52ea5898b`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `3372442AC34E5792DB58F775A9777B3DA883872F9F97B524005F4E3778D7933C` |
| GREEN `object-state-r2.png` | `22FA290524BD510021D195225714CB0347EF92C513C3CE02FBD6013F6440F55E` |
| GREEN `object-state-r2-reloaded.png` | `22FA290524BD510021D195225714CB0347EF92C513C3CE02FBD6013F6440F55E` |
| GREEN `object-state-stock-web-trace.zip` | `ABEFB3B3A6592F1FA9B70682686BB35BBF86975E6BA303D6DAC9837871B48BF7` |
| GREEN `host-runtime.json` | `BE5487FEE4B0BB23AE7B03577E3D17A8A9EE63FBB84A1E8825518E3C617607A9` |
| RED `red-summary.json` | `30C8B8DFBAAFA580EFD70F1FF519A6F8DB7888CC142F2A1074409208195F3DB4` |
| RED `object-state-red-error.png` | `1E5614C6BB07DD5F2061DD3C401317C88F13026883AF3567287BBA020BFF2515` |
| RED `object-state-stock-web-trace.zip` | `1902C6050D014B79147E7F13ABDCAC377DB636D3FBEE1FAF486C3F832C966C0A` |
| RED `host-runtime.json` | `7EDEC09E908746B5BAACB7D363BD162609DAB56653B6722DB23AF28A9C87B8FA` |

Both Hosts were stopped; ports `64372` and `64373` had zero listeners and
loopback probes were refused.

## Claim boundary

This promotes only the synthetic typed `object-state/continuity` path: strict
missing-field rejection, current/historical `objectId` retrieval,
source/Delta/Anchor/provenance retention, generated Remote and
`projectNarrative` agreement, existing selector/ledger rendering and reload,
and unchanged Canon/storage. It does not promote inventory synchronization,
deduplication/conservation semantics, rollback-specific restoration,
process/transport recovery, production installation or user acceptance.
