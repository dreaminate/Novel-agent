# Canon-only project brief and style/reader contract stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing Canon-only project-brief path and the
strict `creative-profile/style-profile` and
`reader-contract/contract-profile` contracts in a fresh stock DSH Web Profile.
R1 accepts the two contracts without a manuscript or manuscript diff. R2 adds
the first accepted Chapter manuscript and updates both contracts with
source-bearing style and reader-delivery evidence. The existing
`propose_novel_result_packet`/review path, generated retrieval Remote and
`conversation.view` Canon area are used; no setup form, store, Tool, queue,
Workflow, Profile, package or product code was added.

The exercised implementation is the existing strict schema, Canon transaction,
retrieval projection and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project` and
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages were
`0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-n001-clean4-red-20260902-01a05b3c`

After accepting R1 Canon-only contracts and the R2 manuscript/contract update,
it submitted two shape-invalid R3 packets independently: one omitted an
approved style exemplar's `purpose`, and the other omitted reader evidence's
`demonstrates`. Both HTTP/RPC envelopes returned HTTP `200` with
`result.ok: false`; the strict schema errors named the missing fields. The
accepted head stayed R2 and Canon/storage hashes were byte-identical before and
after both rejections. RED recorded 11 direct RPC and 22 browser-observed Web
API responses with zero console, page or request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-n001-clean4-green-20260902-01a05b3c`

The stock Agent replay requested only the revision-bound writing-memory query
`writingMemoryQuery: "brief setup style reader contract"`; the generated
retrieval result remained inline and the runner also checked the historical R1
contract values did not contain the R2 evidence.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted strict
   style and reader contracts targeting `project` with empty packet anchors and
   no manuscript. `projectManuscripts(revision: 1)` returned an empty list.
2. R2 accepted `chapter-brief` plus updated style/reader contracts in one
   author review. The style exemplar and reader-delivery evidence both pointed
   to the accepted R2 manuscript, `sourceRevision: 2` and
   `anchor-n001-brief-r2`.
3. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"writingMemoryQuery":"brief setup style reader contract"}`

   The turn completed with no proposal or workflow event. The result contained
   exactly the two requested-revision authoring contracts, hydrated
   `brief-exemplar-r2` and `brief-evidence-r2` excerpts, source ranges and
   provenance. Historical R1 returned both version-1 contracts with empty
   evidence and no R2 exemplar leakage. The generated Remote matched the
   native authoring-contract projection.
4. After reload the existing panel rendered the R2 manuscript, dedicated style
   and reader contract views, the R2 exemplar/evidence selectors and readable
   nested values without `[object Object]`.
5. Canon remained at accepted revision R2 throughout retrieval, historical
   reads, Remote reads, panel rendering and reload.

## Corrected attempts

Two disposable RED attempts are retained as runner diagnostics, not completion
evidence:

- `novel-n001-clean-red-20260902-01a05b3c` and
  `novel-n001-clean2-red-20260902-01a05b3c` reached valid R1 acceptance but
  stopped in the runner while trying to open the Novel Project tab before a
  session message had been rendered. No product or protocol failure was
  observed; the final runner relies on the existing post-message panel path.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64304`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `2f2d38e1-7c90-40e8-8bea-223f3e2dad8e`.
- GREEN Session: `session-0b25c39e-6731-4029-a662-ad8bca52b13e`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 17 direct RPC and 59 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 24,359
  UTF-8 bytes. The captured mux stream contained 77 frames and no `novel/`
  Canon frames.
- Canon `projectCanon` SHA-256 before/after:
  `B6AF11E643FFFBB8D4A3C957D6CC20165372AC936894DA9B37EA6EA11B25D654`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `57B57130B3177B5FE681DEF6D2FBF6E0F4434C973C282B05DF3C500BCA810368`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN port `64304` and RED port `64303` were stopped through their PTYs;
  follow-up listener probes returned zero.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `04E7497CA2A650ECD5565571504ECD3393525912A68821D6E2EB4E09E346D298` |
| GREEN `n001-r2.png` | `75C4A1E83E11B8DF48E8A9C68F1F4C8B5B1C10A644154EA5A2C2E283341763E3` |
| GREEN `n001-stock-trace.zip` | `38216DA6B642ED3E3D307F1DF07321DBAFD280BAD0E9E710AC2642FAD097622F` |
| GREEN `session.jsonl` | `91B0115B9441672F9CF19B846CBF6EC5A64EE1ADB0DA899421EDE00FE93C7024` |
| GREEN `replay.override.json` | `C1FFD0D4458AF2644F0B8339BF9FA80CE63D61C3A6BFB42BB9EF968BB970194B` |
| RED `red-summary.json` | `11358F93CBE19ACE229F53016B16B0FFDF1120D86A810B8D8A15774C9675932B` |
| RED `n001-red-error.png` | `895B9680B386746B991F7CBD8EE950D5B3463BC3A607E96730ABD892AC92689A` |
| RED `n001-stock-trace.zip` | `251EE197C2530BE13E1791A79B011A61A0D7CD22F667C00ED429EC2857D91A01` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web Canon-only project-brief path, strict
style/reader contract R1→R2 acceptance, source-bearing evidence hydration,
historical/current retrieval and generated-Remote agreement, existing panel
rendering/reload, strict missing-field rejection and unchanged Canon/storage for
this synthetic fixture. It does not promote external-model writing quality,
complete multi-chapter authoring, production installation or user acceptance.
