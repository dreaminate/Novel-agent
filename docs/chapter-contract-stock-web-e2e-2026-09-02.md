# Strict Chapter contract and control-pack stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `chapterContract` projection and the
`chapterId` control-pack retrieval path in a fresh stock DSH Web Profile. The
fixture accepts one Book → Volume → Arc → Chapter hierarchy. R1 stores a valid
Chapter contract with a 2900–3100 length range; R2 updates the same Chapter's
contract and manuscript. The existing `retrieve_novel_context` Tool, generated
Remote, `projectNarrative` and `conversation.view` control-pack builder are
used. No new Tool, store, page, package or product code is added.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-chapter-contract-stock-web-red-20260902-01a05b3c`

It accepted the valid R1 hierarchy and Chapter contract, then submitted an R2
contract with `lengthRange.min = 3101` and `lengthRange.max = 2900`. The stock
RPC envelope returned HTTP `200` with `result.ok: false`; the strict error
reported `Chapter contract maximum length must be at least its minimum length`.
The accepted head remained R1 and Canon/storage hashes were byte-identical
before and after rejection. RED recorded 8 direct RPC and 21 browser-observed
Web API responses, with zero console, page or request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-chapter-contract-stock-web-green-20260902-01a05b3c`

The stock Agent emitted one native retrieval call with the exact payload
`{"revision":2,"compareRevision":1,"chapterId":"chapter-control","writingMemoryQuery":"第二道锁 灯塔"}`.
The returned control pack selected the requested Chapter, retained the complete
Book/Volume/Arc/Chapter scope and the updated contract, and agreed with the
generated Remote. Historical R1 retrieval returned the original contract and
did not read the R2 update.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the four
   hierarchy units, the valid Chapter contract and its manuscript. R2 accepted
   the updated Chapter contract and manuscript in the same existing Result
   Packet review path.
2. Native retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The control-pack scope was ordered
   `book-control → volume-control → arc-control → chapter-control`; the
   contract retained viewpoint, story time, scene functions, information
   policy, ending pull, style constraints, acceptance gates and the 2900–3100
   range.
3. Historical/current generated Remote reads and the two `projectNarrative`
   projections retained their requested revisions. The current Remote control
   pack was equal to the native Tool result. Retrieval and panel reads did not
   advance Canon or create a proposal/workflow event.
4. The existing panel's Chapter selector and `Build Chapter control pack`
   action rendered `Chapter control pack · R2 · current`, the updated scene
   functions, reader facts, ending pull and `Length range: 2900–3100`. Nested
   contract values were readable and did not appear as `[object Object]`.
5. After renderer reload, selecting the same Chapter and rebuilding restored
   the same current control pack and length range.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64331`; root/navigation HTTP status `200`.
- GREEN Workspace: `10782c1a-b799-4b92-933c-1e11017b964f`.
- GREEN Session: `session-fa1b80f8-f6c2-478c-b995-c131daea1e57`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 18 direct RPC and 67 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 29,337
  UTF-8 bytes. Post-seed mux frames: `77`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `496FBA7ED90ECC36A53DD17549E65549B27EDB758BBE84869521CD055CD1405F`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `37728358C7B7A3244FC5681EC19CAC7A32DDE8AA7B0C2EA937765F84560AD143`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `chapter-contract-r2.png`,
  `chapter-contract-r2-reloaded.png`, `chapter-contract-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains the matching error screenshot, trace, summary and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `6794BC1AD46DDBB5DE345567EF4EEF01DCB224547AD99D1E2F8E138438671490` |
| GREEN `chapter-contract-r2.png` | `5B6DFE8CB57A4FD97B7CEC0321E4F4BED09E0BC491F61FF43F06D5CE6900210D` |
| GREEN `chapter-contract-r2-reloaded.png` | `568BF5854EFEC8CD59CE45D7564C6D2470158AB9E8AC5D8A64F159F6A5A4CB2E` |
| GREEN `chapter-contract-stock-web-trace.zip` | `B4A5C4CEA88F130A8BE0D3108CCE6DF1385BF4823B85ED7682DC2DB447D6BAA2` |
| GREEN `session.jsonl` | `C312CA18A7930B34FA48D9721013C0EAFFBF7F7BF9B919327D4C230A1CF83309` |
| GREEN `replay.override.json` | `6AFC8301EC8B4A354079864620533BA03EF55A95802218276EB39F289E64CD16` |
| RED `red-summary.json` | `FCFB2A88F35D51CF0E0B13574E26C39F6FD785ACAB031321508B3014A5378372` |
| RED `chapter-contract-red-error.png` | `9FF09232B85EC09939F57274D9DBB2201B8D527A92BD5492909B982AF880B96F` |
| RED `chapter-contract-stock-web-trace.zip` | `2B1CCF71EA8538B04FCDDCBAEC7EF6ED4D4890A328926FA63FFBF630A58DA236` |

The RED Host on port `64330` and GREEN Host on port `64331` were stopped
through their PTYs; follow-up listener probes returned zero. This smoke does
not include a Chapter `post-check` source-join or Scene/Beat descendant
fixture; those remain separate increments.

## Claim boundary

This promotes only the synthetic strict Chapter contract R1→R2 path:
`max >= min` validation, accepted hierarchy projection, exact `chapterId`
control-pack retrieval, historical/current generated-Remote agreement,
`projectNarrative` revision reads, existing panel rendering/reload and
unchanged Canon/storage. It does not promote `chapter-state/post-check` source
resolution, Scene/Beat planning, lock/reference resolution, process/transport
recovery, production installation or user acceptance.
