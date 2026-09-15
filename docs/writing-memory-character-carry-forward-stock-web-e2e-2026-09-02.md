# Query-independent character carry-forward writing memory stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing no-`chapterId` writing-memory projection for
query-independent character carry-forward in a fresh stock DSH Web Profile.
The fixture accepts a Chapter post-check at R1 with one character's next-step
state, then advances an unrelated story event to R2. A retrieval at current R2
includes an intentionally unrelated `writingMemoryQuery`; the carry-forward
must still be returned from the accepted post-check rather than from search
terms. Historical R1 must not see any later-only value. The existing native
`retrieve_novel_context` Tool, generated Remote, writing-memory panel and
renderer reload are used. No product source, Tool, store, page or package was
added for this increment.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-character-carry-forward-stock-web-red2-20260902-01a05b3c`

It seeded a valid R1 Chapter/post-check and an unrelated R2 revision whose
`characterCarryForward` was empty, then ran the focused next-Chapter
assertion. The assertion failed as intended with `0 !== 1` instead of accepting
an empty carry-forward. The RED summary records 11 direct RPC and 22
browser-observed Web API responses, with zero console, page or request
failures. The accepted head remained R2; Canon and the sole novel-project
storage record were byte-identical before and after the failed assertion
(`701d4b8e9b2daa17a3caa2ad28e2bb7df1e40b915c3f9246ed2751cc74fa8bb8` and
`10d3e04d0d4e0f39fa30c34c4cf2b4f6df0dae6897c11619e9e8d38c90e7e1f1`,
respectively). The RED Host was `127.0.0.1:64344`; its listener was stopped
and the follow-up probe returned zero.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-writing-memory-character-carry-forward-stock-web-green3-20260902-01a05b3c`

The stock Agent emitted exactly one native retrieval call:

`{"revision":2,"compareRevision":1,"characterTrajectoryId":"shen-yan","writingMemoryQuery":"完全无关检索词"}`

The current R2 result contains one `shen-yan` carry-forward even though the
query is unrelated. A second current Remote request with another unrelated
query returned the same carry list, and a historical R1 request returned the
same accepted R1 source while excluding the R2-only unrelated event. The
generated Remote matched the native writing-memory and trajectory payloads.

## Observed flow

1. A fresh Workspace and Standard Session accepted a Book → Volume → Arc →
   Chapter hierarchy, a Chapter contract and manuscript at R1. The accepted
   `chapter-state/post-check` stores the character carry-forward source for
   `shen-yan`; R2 adds an unrelated story event so the query-independent and
   revision-bound behavior can be distinguished.
2. The current Tool result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The carry item retained the exact values
   `决定把钥匙交给顾临川` and `仍隐瞒潮声真正来源`, the source Chapter
   `chapter-carry-forward-1`, source revision `1`, Delta
   `post-check-character-carry-forward-r1` (whose source Chapter delta is
   `unit-chapter-carry-forward-1-r1`), Anchor
   `anchor-character-carry-forward-r1`, range `0–23`, content hash and
   producer provenance. The same result retained the accepted character
   trajectory entry for `shen-yan`.
3. Historical retrieval at R1 returned `freshness: "historical"` and the R1
   carry-forward with its R1 source chain; the R2-only unrelated text was
   absent. The alternate unrelated current query and generated Remote were
   equal to the native current payload. Retrieval did not create a proposal,
   workflow event or `novel/` Canon frame.
4. The existing `conversation.view` displayed the carry values, source
   Chapter, R1 Delta/Anchor and producer, alongside the existing Character
   trajectory view. Nested values were readable and did not render as
   `[object Object]`.
5. After renderer reload, the same writing-memory item and trajectory were
   restored from the accepted revision. Canon and storage remained unchanged.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64343`; root/navigation HTTP status `200`.
- GREEN Workspace: `19d4bddd-2d8f-46f9-ab65-05420363848a`.
- GREEN Session: `session-157ddfe3-4875-409f-8f4f-fae6360f050c`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 20 direct RPC and 68 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 39,249
  UTF-8 bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `0569740a55b55f68f1f905e0617733ac87fb053f53720ee62418c29797ea9068`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `72488cdf0f8ad715156e6636bbe24f2037f64745aa681fd5bed70c514bcb174c`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`,
  `character-carry-forward-r2.png`,
  `character-carry-forward-r2-reloaded.png`,
  `character-carry-forward-stock-web-trace.zip`, `session.jsonl`,
  `replay.override.json`, the fixture and the runner. RED retains the
  corresponding summary, trace, replay inputs and focused failure evidence.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `01F1DD6065F78DCA4A9FF7FDF5160AE7660339377985ED3D40585CBEB08760DF` |
| GREEN `character-carry-forward-r2.png` | `AD80D94B9F26C1BADFB3856A90AD77BEC151BD30AB8FAEB6360CEA05F9F1912C` |
| GREEN `character-carry-forward-r2-reloaded.png` | `AD80D94B9F26C1BADFB3856A90AD77BEC151BD30AB8FAEB6360CEA05F9F1912C` |
| GREEN `character-carry-forward-stock-web-trace.zip` | `B87B58F793397F59F1D23AC33F17F617C1125792DCFFF5D0E10842E035D99D1F` |
| GREEN `session.jsonl` | `A3A98197BD00CDB301A81912A69E2ABDF0674CDCE27851959F6A0B80F271ECBF` |
| GREEN `replay.override.json` | `59799125E9DFD5D94D7D05560384785F0D1DDA0A35CFB069D1CA8D7266AF8C29` |
| RED `red-summary.json` | `CEF31AAC501298ECD7F132A18C89C90F3BBAB7D3A05B918D2672F72B21858C56` |
| RED `character-carry-forward-stock-web-trace.zip` | `05494CA3E2CFE50A817804F469170E4B46050169F8E6AC2C18E07AFE4648556C` |

The GREEN Host listener owner was Node PID `38264` (launch process PID
`15912`); the RED listener owner was Node PID `1572` (launch process PID
`2040`). Both Hosts were stopped through their PTYs, and follow-up probes
returned zero listeners on ports `64343` and `64344`.

## Claim boundary

This promotes only the synthetic no-`chapterId` query-independent
`writingMemory.characterCarryForward` path: current and historical accepted
revision retrieval, unrelated-query independence, generated Remote agreement,
source Chapter/Delta/Anchor/provenance retention, existing panel rendering,
renderer reload recovery, the focused empty-state RED and unchanged
Canon/storage. It does not promote semantic character inference, rollback-
specific carry restoration, the accepted-`chapterId` control-pack branch,
process/transport crash recovery, external-model writing quality, production
installation or user acceptance.
