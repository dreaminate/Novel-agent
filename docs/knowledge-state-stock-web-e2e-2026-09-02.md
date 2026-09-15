# Strict knowledge/state stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `knowledge/state` Canon value and its
source-labelled Knowledge boundary projection in a fresh stock DSH Web Profile.
The fixture contains one character subject (`alice`) and one reader subject
(`reader-main`) who each track the same accepted clue. R1 records a suspected
belief; R2 updates Alice to a known, accurate belief and revises the reader's
suspected belief. The existing `knowledgeSubjectId` retrieval path, generated
Remote and Knowledge boundary area in `conversation.view` are used. No second
knowledge store, graph authority, Tool or page is added.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-knowledge-state-stock-web-red-final-20260902-01a05b3c`

It accepted R1, then submitted an R2 character `knowledge/state` value with
`access.unitId` omitted. The RPC envelope returned HTTP `200` with
`result.ok: false`; the strict error path was
`packet.deltas[1].value.access.unitId`. The accepted head stayed R1 and Canon
and storage hashes were byte-identical before and after rejection. RED recorded
8 direct RPC and 22 browser-observed Web API responses, with zero console, page
or request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-knowledge-state-stock-web-green-final-20260902-01a05b3c`

The stock Agent emitted one native retrieval call with the exact payload
`{"revision":2,"compareRevision":1,"knowledgeSubjectId":"alice"}`. The
current boundary returned Alice's v2 known/retained/accurate state and its
accepted clue fact; historical R1 returned only the v1 suspected state. The
generated Remote matched the current boundary and the existing panel restored
it after reload.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the clue
   summary plus strict character and reader knowledge states; R2 updated both
   state values in the existing author Result Packet path.
2. The current `knowledgeBoundary` was scoped to `alice`, contained one
   `clue-moon-gate` entry, and retained `sourceRevision: 2`, Delta
   `knowledge-state-alice-r2`, Anchor `anchor-knowledge-state-r2`, source range
   and producer provenance. Alice's state rendered the exact belief and direct
   observed access metadata.
3. Historical Remote retrieval at R1 returned `freshness: "historical"`, the
   v1 suspected/partial state and the R1 Anchor; the R2 belief text was absent.
   A second current Remote call agreed with the first result. Retrieval and
   panel reads did not create a proposal, workflow event or `novel/` Canon
   frame.
4. The existing panel's Knowledge boundary selector and Build action rendered
   `Knowledge boundary · R2 · head R2 · current`, Alice's v2 state, belief,
   observed access, source ranges and producer. The nested value did not render
   as `[object Object]`.
5. After renderer reload, selecting Alice and rebuilding restored the same v2
   boundary and belief.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64341`; root/navigation HTTP status `200`.
- GREEN Workspace: `a660bc12-8cfd-42d1-9959-ed0cb8500661`.
- GREEN Session: `session-7acecf21-fcc3-4749-8772-32abb69cfbc1`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 17 direct RPC and 67 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 12,965
  UTF-8 bytes. Post-seed mux frames: `77`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `270E3749A6B55FE4DD47AF1E3F2CCC6ABB23536148BF38B1EFEDC8E94261C0AC`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `80D0440874423EE69C399E1C561F0BFE25FFCA9A6918F5028BAA45E1C33C5D06`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `knowledge-state-r2.png`,
  `knowledge-state-r2-reloaded.png`, `knowledge-state-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains the matching error screenshot, trace, summary and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `8248396C2CAA3A2800ACA3089103A537EE6D018727FD23923F584CF90A95A32E` |
| GREEN `knowledge-state-r2.png` | `E265FC14CC4F4EA92AE6936E1960A1F1E74D6AA83BBA79A8CCF75D63FD04FA6F` |
| GREEN `knowledge-state-r2-reloaded.png` | `E265FC14CC4F4EA92AE6936E1960A1F1E74D6AA83BBA79A8CCF75D63FD04FA6F` |
| GREEN `knowledge-state-stock-web-trace.zip` | `95E56B22A36582B7C7C4A99BE7B2D4523E080C6E4C03D8A060096E4D427DA56F` |
| GREEN `session.jsonl` | `31763A846ADF0C63893BE8D12C0E4C9565D83888ED335D9FD870FB8F5B588DF2` |
| GREEN `replay.override.json` | `4080B80E6A2C69BAB819C596120846B27E7C42B98DF800B32C32145FAC6D9FE4` |
| RED `red-summary.json` | `D73AC6ABA967AD3D8EEA38DADD4FFD0AB0EF2563C8934AEB26D3FCDA885D2A70` |
| RED `knowledge-state-red-error.png` | `2B22B4AC126B7CE6BA24364A4AF4DCD746707AD03FED6C413FA9E1E15FC8646A` |
| RED `knowledge-state-stock-web-trace.zip` | `B4855739B17AD65AED6B6656595402EEA2D8BE7FB3266A37C40C3790BA5EB9A0` |

The RED Host on port `64340` and GREEN Host on port `64341` were stopped
through their PTYs; follow-up listener probes returned zero. This smoke is
limited to the strict knowledge/state boundary and does not claim reader
semantics beyond the synthetic fixture.

## Claim boundary

This promotes only the synthetic strict `knowledge/state` R1→R2 path:
character-subject filtering, source-bearing current/historical Knowledge
boundary retrieval, generated-Remote agreement, existing panel rendering,
reload recovery, strict missing-`access.unitId` rejection and unchanged
Canon/storage. It does not promote semantic truth inference, graph comparison,
cross-Session/process recovery, production installation or user acceptance.
