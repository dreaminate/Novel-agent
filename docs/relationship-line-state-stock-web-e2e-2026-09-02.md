# Strict relationship line-state stock-Web E2E — 2026-09-02

## Scope

This run verifies the strict bidirectional relationship/line-state projection
in a fresh DSH Web Profile. R1 contains independent alice->bob and bob->alice
line states, including their own goals, trust, conflicts, commitments,
boundaries, shared history, obstacles, unresolved debts, main-plot
consequences, agency evidence and source metadata. R2 updates only alice->bob,
adding an earned turn with a persistent consequence; the reverse direction
remains the accepted R1 state. The existing relationship and
relationship-clock views render the current projection and restore it after a
renderer reload. No product source, Tool, store, Profile, Workflow or UI was
added.

The exercised implementation is the existing relationship projection and
strict schema in [src/index.ts](../packages/novel-project/src/index.ts),
[types.ts](../packages/novel-project/src/types.ts) and
[result-packet-schema.ts](../packages/novel-project/src/result-packet-schema.ts),
with the existing conversation.view selectors in
[NovelProjectPanel.tsx](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile used DSH 0.1.1-rc.2, the linked current
@novel-agent/novel-project, and temporary
@deepseek-ai/dsh-llm-replay@0.1.1-rc.2; the user-global .dsh was not used.

## RED → GREEN

The controlled RED used:

C:\Users\33166\AppData\Local\Temp\novel-relationship-line-state-stock-web-red3-20260902-01a05b3c

After valid R1 and R2 acceptance, it submitted an R3 line-state turn without
persistentConsequence. The stock RPC returned an error containing only the
strict schema path
packet.deltas[0].value.turns[1].persistentConsequence; no manuscript-decision
or setup error was present. R2 remained the accepted head and Canon/storage
hashes were unchanged. RED recorded 10 direct RPC and 21 browser-observed Web
API responses, with zero console, page or request failures; port 64268 was
stopped and had no listener.

The GREEN used:

C:\Users\33166\AppData\Local\Temp\novel-relationship-line-state-stock-web-green7-20260902-01a05b3c

## Observed flow

1. The fresh Web Host created one Workspace and Standard Session. R1 accepted
   the manuscript, Book → Volume hierarchy, alliance event, both directional
   strict line states, status fields and the version-1 relationship clock.
   R2 accepted a second manuscript, the forward alice->bob version-2 state
   with one complete sacrifice turn, and a version-2 relationship clock with
   two ordered moves. No R2 delta touched bob->alice.
2. The stock Agent emitted exactly one native
   retrieve_novel_context call:
   {"revision":2,"compareRevision":1,"canonKind":"relationship","canonTargetId":"alice->bob","narrativeClock":"relationship","narrativeUnitId":"volume-old-court"}.
   The native result was successful; no propose_novel_result_packet or
   workflow event occurred.
3. Current retrieval returned the R2 forward line-state and relationship
   clock, with complete R1→R2 canonFacts and clockEntries changes. Generated
   Remote retrieval returned matching historical R1/current R2 values.
   projectRelationships preserved the stable alice<->bob line, both directions
   and their independent source revisions: forward R2, reverse R1. The forward
   turn retained its action, response, cost, persistent consequence and stage;
   both directions retained their debt and main-plot-consequence arrays.
4. The existing panel rendered
   [data-novel-project-relationships],
   [data-relationship-line-state="alice->bob"],
   [data-relationship-line-state="bob->alice"] and
   [data-relationship-clock-scope="volume-old-court"]. It displayed strict
   fields, source labels, both relationship-clock moves and revision-2 state;
   the same directional states were visible after reload.
5. Canon stayed at accepted R2. Retrieval, Remote reads, panel rendering and
   reload produced no Canon or storage mutation.

## Evidence and shutdown

- GREEN Host: http://127.0.0.1:64267; root/navigation HTTP 200.
- GREEN Workspace: 1ad128bc-5e49-471b-9f8f-38fa81b77d8c.
- GREEN Session: session-c11e9e4f-44d8-4d0f-bcb5-628cf2eb95d1.
- GREEN native Tool call/result counts: 1 / 1; proposal Tool calls 0;
  workflow events 0.
- GREEN recorded 21 direct RPC and 64 browser-observed Web API responses.
  Console, page and failed-request counts were all 0.
- Native retrieval stayed inline at 21,344 UTF-8 bytes (no spill marker).
  Post-seed mux frames: 70; post-seed novel/ frames: 0.
- Canon R2 SHA-256 before/after:
  36de5dbf17a9386b52f36f8a532ed0c475ab3195b65e464c12a8c60a1b37d0e6.
- dsh-home\storages\novel_project.json SHA-256 before/after:
  285d19cbc042685abf8efaa58a636c411240f3848631e3408e396616a04335f8.
- Built packages/novel-project/lib/index.js SHA-256:
  7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771.
- GREEN Host port 64267 was stopped through its PTY; a follow-up
  Get-NetTCPConnection -LocalPort 64267 -State Listen probe returned zero.
- GREEN artifacts under the root above:
  green-summary.json, relationship-line-state-stock-trace.zip,
  relationship-line-state-r2.png, relationship-line-state-r2-reloaded.png,
  session.jsonl, replay.override.json,
  prepare-relationship-line-state-fixture.mjs and
  run-relationship-line-state-smoke.mjs.
- RED artifacts under the RED root above:
  red-summary.json, relationship-line-state-red-error.png,
  relationship-line-state-stock-trace.zip, session.jsonl,
  replay.override.json, the fixture and the runner.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN green-summary.json | 2515D8AC81A275D308BFD54BB2FC1F353C6D4173469547933236859F4C5F523B |
| GREEN relationship-line-state-stock-trace.zip | 5BC9BBB17D749BDC5A31A9E1922469F8203F1FD13E224AC5B00C9C8D2E13F64B |
| GREEN relationship-line-state-r2.png | 529131CC9C0E92867647B476C69C1795E3A02E8518BA338FFE7F0CE6E41C3D8B |
| GREEN relationship-line-state-r2-reloaded.png | C2DDD046ECC3E972D68E388C952A6D474073039CEC2CA3233B83758171E4D3C7 |
| GREEN run-relationship-line-state-smoke.mjs | 23835C581EBBD747BFFA4DC4328D9560CD6A069135B7A903FFFFC800DD97AFCA |
| GREEN prepare-relationship-line-state-fixture.mjs | 3EA2FB91882E04EF2134E733B4F0F66E21EF239C6048C6DF20467E38EB9ACE02 |
| RED red-summary.json | BC9C5EF4492B5E552070610308109CCDCD478C74CC5BF0086C6BFEE45C133440 |
| RED relationship-line-state-red-error.png | F0FDD6929569F958677F8A3504D925E56E76FB9EC23368EF77A8F612B401D5AC |
| RED relationship-line-state-stock-trace.zip | 7CFCDBDC56D278C0D1469A4EE90A31DE78467CB803F96B9F2CA9BAAEEA938B04 |

## Claim boundary

This promotes the strict relationship/line-state R1/R2 projection through the
fresh stock-Web Tool/Remote path, the existing relationship and
relationship-clock views, reload recovery, strict missing-field rejection and
read-only Canon/storage behavior for this synthetic fixture. It does not claim
the other strict narrative clocks, relationship-clock invalid variants,
multi-role or simulation behavior, process/transport crash recovery,
production installation or user acceptance.
