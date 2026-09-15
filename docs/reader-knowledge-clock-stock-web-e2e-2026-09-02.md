# Strict reader-knowledge clock stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `reader-knowledge` narrative-clock
projection in a fresh stock DSH Web Profile. R1 contains a chapter-scoped
reader-knowledge value for `chapter-reader-knowledge` and the accepted
Knowledge target `reader-main->knowledge-secret-route`. Its nested events cover
`disclosure`, `hint`, `reminder`, `misdirection` and `recontextualization`,
each retaining intended effect, scene, viewpoint/access, description and
source Anchor. R2 keeps the same target and five-event shape while changing the
hint evidence, state, story time, version, ambiguity policy and revision
rationale. The existing `retrieve_novel_context` Tool, generated Remote and
`projectNarrative` projections return current and historical values; the stock
Novel Project Narrative clocks area renders the accepted R2 value and restores
it after renderer reload. Retrieval is read-only and this increment adds no
product code.

The exercised implementation is the existing strict schema and resolver in
[`src/index.ts`](../packages/novel-project/src/index.ts),
[`types.ts`](../packages/novel-project/src/types.ts) and
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
with the existing `conversation.view` renderer in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency under:

`C:\Users\33166\AppData\Local\Temp\novel-reader-knowledge-clock-stock-web-green4-20260902-01a05b3c`

The isolated Profile mounted `dsh-base`, `dsh-web-app` and the linked novel
plugin only (plus the replay provider); the user-global `.dsh` was not used.
The complete native retrieval result was 28,861 UTF-8 bytes and stayed below
the stock inline-output cap.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-reader-knowledge-clock-stock-web-red4-20260902-01a05b3c`

It first accepted valid R1 and R2 values, then submitted an R3 packet whose
nested event had an empty `sourceAnchorIds` array. The stock RPC envelope was
HTTP `200` with `result.ok: false`; the only strict failure path was
`packet.deltas[0].value.events[0].sourceAnchorIds` (`too_small`, minimum 1).
The accepted head remained R2 and both Canon and storage hashes were unchanged.
The RED recorded 10 direct RPC and 22 browser-observed Web API responses, with
zero console, page or failed-request errors. This was a domain-schema RED, not
a host setup or selector failure.

The GREEN restored anchored R1/R2 events and ran the complete native retrieval,
generated Remote, historical/current narrative projection, panel and reload
checks. The same runner asserted the nested event arrays and source metadata,
so a changed outer summary could not hide an event-level revision change.

## Observed flow

1. The fresh Web Host created one Workspace and Standard Session. R1 accepted a
   minimal original manuscript, a Book → Volume → Arc → Chapter → Scene
   hierarchy, the `reader-main->knowledge-secret-route` Knowledge fact and a
   version-1 `reader-knowledge` clock at Chapter scope. The R1 clock used
   `controlled-disclosure`, story time `第一卷第二夜`, a `preserve` ambiguity
   policy and five anchored events.
2. R2 accepted a second manuscript and a version-2 clock at the same scope. It
   changed the hint description/source Anchor, state to
   `读者确认暗门方向，但仍不知道引路人的身份`, story time to `第一卷第三夜`,
   policy to `narrow` (`缩小为北侧暗门与旧井两种解释`) and rationale
   `加入重新描深的刻痕并收窄歧义`.
3. The Standard Agent emitted exactly one native call:

   `retrieve_novel_context({"revision":2,"compareRevision":1,"narrativeClock":"reader-knowledge","narrativeUnitId":"chapter-reader-knowledge"})`

   It produced exactly one successful native result. No
   `propose_novel_result_packet` call and no `tool-workflow/*` event occurred.
4. Current retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Its `reader-knowledge` hit retained all five event
   kinds, the shared Knowledge target, intended `know`/`suspect`/`remember`/
   `misread` effects, scene/viewpoint/access fields, R2 source range and
   provenance (`task-reader-knowledge-clock-r2`).
5. The R1→R2 revision impact reported one changed `reader-knowledge` clock
   entry. The before value was version 1 with the `preserve` policy and R1
   nested events; the after value was version 2 with the `narrow` policy and R2
   hint evidence. Both complete nested arrays, source revisions, Anchor ids and
   provenance were present. A historical Remote request returned R1 with
   `freshness: "historical"` and version 1; the current Remote matched the
   native retrieval. Historical `projectNarrative` exposed version 1 and
   current `projectNarrative` exposed version 2 with Delta, Anchor and
   provenance metadata.
6. The existing panel rendered
   `[data-novel-project-narrative]`,
   `[data-reader-knowledge-scope="chapter-reader-knowledge"]` and one
   `[data-reader-knowledge-event="..."]` selector for each of the five events.
   The visible text included `chapter · chapter-reader-knowledge · v2`, the
   movement, narrowed ambiguity policy, revision rationale, event descriptions,
   target id and source Anchors. After `page.reload()`, the same scope and all
   five event selectors remained visible.
7. `novelProject/current` stayed at accepted revision R2. Retrieval, Remote
   reads, panel rendering and reload did not change Canon or storage.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64273`; root and navigation HTTP status `200`.
- GREEN Workspace: `d7bd071c-0661-43e2-a96e-ba5898059e0f`.
- GREEN Session: `session-df51f936-a2d2-48bd-8e37-ffa24f92cc23`.
- Native retrieval call/result counts: `1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`.
- GREEN recorded 19 direct RPC and 64 browser-observed Web API responses. All
  responses succeeded; console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 28,861
  UTF-8 bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `1a3cf60d57e55cd87dacf3fa49366c6f3b73f9bd686d45eb6d1022f2f417855e`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `9a220e776c8730366f456b1fbe11c9924210ff0b23781c90a63afbefbbff72ca`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the GREEN root are `green-summary.json`,
  `reader-knowledge-clock-stock-trace.zip`,
  `reader-knowledge-clock-r2.png`,
  `reader-knowledge-clock-r2-reloaded.png`,
  `session.jsonl`, `replay.override.json`,
  `prepare-reader-knowledge-clock-fixture.mjs` and
  `run-reader-knowledge-clock-smoke.mjs`. The RED root retains the matching
  runner/fixture inputs, `red-summary.json`, the failure screenshot and trace.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `47DDF02C5E904ECD47C2B1568E991AF2ADA5A2D64BBE773153260439C82CD41C` |
| GREEN `reader-knowledge-clock-stock-trace.zip` | `B907B5527753839650DB2DBD8B17A663A847783CE944FDBCF353565B8D8D0987` |
| GREEN `reader-knowledge-clock-r2.png` | `5108FAAE3B702469D4FE9677ABF289FCEB324EB67E37C03F095371483484B311` |
| GREEN `reader-knowledge-clock-r2-reloaded.png` | `772C342177744E99076020CC0B4959B61D8DD6189B08940BF91CA3BC95C8CDEB` |
| RED `red-summary.json` | `4158587E2976926B71C77DE1ECB6B52AEBD57A3301E562D07B717E610F46DBBF` |
| RED `reader-knowledge-clock-red-error.png` | `C8F687E45BCEB24B3430A898A7ECD0E6A5194F8DDC1F108A3B9B73A33C4DD40E` |
| RED `reader-knowledge-clock-stock-trace.zip` | `986B114BB8DE9ACF8FC0978860E926A0EF5A93500139D76350673F21C3E8C926` |

The GREEN Host on port `64273` and RED Host on port `64272` were stopped; a
follow-up listener probe returned zero for both. A separate stale DSH node
(`--port 64271`, PID `27168`) was identified from its exact command line and
stopped as well; the final probe returned zero. That stale process was not part
of the measured GREEN/RED counts.

## Claim boundary

This promotes only the strict `reader-knowledge` R1/R2 nested-event
projection, historical/current revision isolation, generated-Remote equality,
existing Narrative clocks rendering, renderer reload recovery, strict nested
Anchor rejection and unchanged Canon/storage for this synthetic fixture. The
manuscripts, target and source ranges are smoke inputs, so this is
schema/projection and visible plumbing evidence rather than semantic disclosure
planning or writing-quality evidence. It does not promote the separate
`knowledge/state` lifecycle, the other strict narrative clocks, process or
transport crash recovery, cross-Session/restart recovery, production
installation or user acceptance.
