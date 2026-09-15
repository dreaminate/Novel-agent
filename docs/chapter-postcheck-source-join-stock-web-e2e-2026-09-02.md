# Strict Chapter post-check source-join stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `chapter-state/post-check` source join
inside the accepted-`chapterId` Chapter control pack in a fresh stock DSH Web
Profile. R1 accepts a Book → Volume → Arc → Chapter hierarchy and Chapter
contract. R2 accepts the revised Chapter manuscript and the Promise debt that
the post-check names. R3 accepts a post-check containing contract assessment,
manuscript source revision, changes/costs, reader disclosure, character
carry-forward and a debt transition. The existing
`retrieve_novel_context` Tool, generated Remote, `projectNarrative` and
`conversation.view` control-pack panel are used; no new Tool, store, page or
package is introduced.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-chapter-postcheck-source-join-red-20260902-01a05b3c`

It accepted the R1 contract and R3 post-check but intentionally omitted the R2
`debt-transition-postcheck-r2` Delta. The read-only source-join assertion then
failed as intended with `0 !== 1` because the named debt source could not be
resolved. The RED Host was `http://127.0.0.1:64410`; it recorded 15 direct RPC
and 21 browser-observed Web API responses with zero console, page or request
failures. The accepted head, Canon and storage remained unchanged by the
failed read. Its listener PID was `37696`; the Host was stopped and a follow-up
probe returned zero listeners.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-chapter-postcheck-source-join-green-final5-20260902-01a05b3c`

The stock Agent emitted one native retrieval with the exact request:

`{"revision":3,"compareRevision":2,"chapterId":"chapter-postcheck","canonKind":"chapter-state","writingMemoryQuery":"post-check source join"}`

The current control pack resolved the contract, manuscript and debt sources
against the requested accepted lineage. Historical R2 excluded the post-check
resolution, while current R3 included it. The generated Remote and the native
result agreed.

## Observed flow

1. A fresh Workspace and Standard Session accepted the R1 hierarchy, Chapter
   contract and manuscript; R2 accepted the revised manuscript and the
   `promise` debt Delta `debt-transition-postcheck-r2`.
2. R3 accepted `post-check-postcheck-r3` with a `met` contract assessment,
   manuscript source revision `2`, changes/costs, newly possible/impossible
   state, reader-known/reader-suspected values, a `shen-yan` carry-forward and
   an `advanced` Promise debt transition.
3. The native Tool returned `revision: 3`, `headRevision: 3` and
   `freshness: "current"`. `postChapterCheckResolution` retained the R3
   post-check fact and `anchor-postcheck-r3`; its contract resolution pointed
   to Chapter source revision `1`, Delta `unit-chapter-postcheck-r1` and
   `anchor-postcheck-r1`. The manuscript resolution pointed to source revision
   `2` and the accepted Chapter text. The debt transition resolved exactly one
   `promise` debt `debt-postcheck-main` from source revision `2`, with no
   missing or ambiguous references.
4. Historical R2 retrieval was `historical` and did not expose
   `postChapterCheckResolution`; the current generated Remote, a
   `canonKind: "chapter-state"` query and `projectNarrative` R1/R2/R3 checks
   retained their requested revisions. Retrieval and panel reads created no
   proposal, workflow event or `novel/` Canon frame.
5. The existing Chapter control-pack panel rendered the post-check ledger and
   resolved contract/manuscript/debt source chain without `[object Object]`.
   After renderer reload, the same panel and source resolution were restored.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64416`; root/navigation HTTP status `200`.
- GREEN Workspace: `adee0fb0-05d9-4f82-94c0-9f03b98f5366`.
- GREEN Session: `session-b1753fbc-f1d6-453b-9ead-d595028cc069`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 23 direct RPC and 63 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 46,825 UTF-8
  bytes. Post-seed mux frames: `63`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `2e15b4b69da4f20b89b105ba9fda9af731bc5140b591d11b7c83df9a5e3fa4e5`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `c9f30cce2edca79194ed6d1563466bb6a6f7d109edfdd396cded8052da07eef6`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `host-runtime.json`,
  `chapter-postcheck-r3.png`, `chapter-postcheck-r3-reloaded.png`,
  `chapter-postcheck-source-join-trace.zip`, `session.jsonl`,
  `replay.override.json`, the fixture and the runner. RED retains its summary,
  trace, replay inputs and focused failure evidence.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `CB3BDF7E6AF4452365C6942CB50CB40B68C7C54652BA05FF6A5DDAD9493C9521` |
| GREEN `host-runtime.json` | `6B2708EDA9AE7969C444B925B75021A012C6713F23B67D6CA4E70018ADE88257` |
| GREEN `chapter-postcheck-r3.png` | `9DC0FA628DB5094D6B9D234A0D3D49407826A09DD47A8654CDC532C454D77452` |
| GREEN `chapter-postcheck-r3-reloaded.png` | `E48C5526B05B8ACD1B02F97713FA404A185B1B38EF98246E54262BD73F567711` |
| GREEN `chapter-postcheck-source-join-trace.zip` | `4754FB04C83388BF194462D3017E891C8E6D51095A4B59EC9E0B2EF9271A2993` |
| GREEN `session.jsonl` | `9F8025DE580DF4B1E46950AEA5701B16914FFE434E5745DA6DEE2E2CAB395FD6` |
| GREEN `replay.override.json` | `DF6DD5E0D139690A6536942258C3EA943DD4C298A4DB92595E24ADFDA5785D8A` |
| RED `red-summary.json` | `C3CB859E5D15743446BD0D6C3964DE3A8A60558909A7B39A437B1E19EA514657` |
| RED `chapter-postcheck-source-join-trace.zip` | `1515C69505C893AD8D942FC4C5BCE75D867C87A324688E477112475445895626` |
| RED `session.jsonl` | `40C6DE2D7A6FAA850BFEFCCEFEAAE28C8905C8F89EF7F391867192949059C74F` |

The GREEN Host runtime record captured listener PID `35928`, launch PTY
session `94057`, `zeroListeners: true` and `loopbackAfterStop: "refused"`;
the RED listener PID was `37696`. Both ports `64416` and `64410` were
listener-free after shutdown.

## Claim boundary

This promotes only the synthetic accepted R1 contract → R2 manuscript/debt →
R3 post-check exact source-join path through the existing `chapterId` control
pack, native/generated Remote, `projectNarrative`, panel/reload and read-only
invariants. It does not claim external-model writing quality, the full
10-chapter acceptance, Scene/Beat planning, lock/reference branches,
rollback-specific source restoration, process/transport recovery, production
installation or user acceptance.
