# Strict tension-payoff clock stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `tension-payoff` narrative-clock
projection in a fresh stock DSH Web Profile. R1 contains a Chapter-scoped
value for `chapter-10` with two overlapping waves: `wave-old-court-escape`
records a costly partial release and planned recovery, while
`wave-trust-aftershock` remains ongoing with no release or recovery marker. R2
updates only the pursuit wave to a higher peak, full occurred release and
occurred recovery; the relationship aftershock remains ongoing. Each wave
retains source, three intensity levels, duration, release/recovery details and
scene-function contributions. The existing `retrieve_novel_context` Tool,
generated Remote and `projectNarrative` projections expose the R1/R2 comparison;
the stock Novel Project Narrative clocks area renders both waves and restores
the accepted R2 projection after renderer reload. Retrieval is read-only and
this increment adds no product code.

The exercised implementation is the existing strict schema and narrative
projection in [`src/index.ts`](../packages/novel-project/src/index.ts),
[`types.ts`](../packages/novel-project/src/types.ts) and
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
with the existing `conversation.view` renderer in
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency under:

`C:\Users\33166\AppData\Local\Temp\novel-tension-payoff-clock-stock-web-green2-20260902-01a05b3c`

The isolated Profile mounted `dsh-base`, `dsh-web-app` and the linked novel
plugin only (plus the replay provider); the user-global `.dsh` was not used.
The complete native retrieval result was 25,419 UTF-8 bytes and stayed inline
under the stock output cap.

## RED → GREEN

The valid controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-tension-payoff-clock-stock-web-red2-20260902-01a05b3c`

It accepted the complete R1 hierarchy and two-wave value, then sent an
otherwise valid R2 packet whose pursuit release deliberately omitted the
required `aftermath` field. The HTTP/RPC envelope succeeded with HTTP `200`
and `result.ok: false`; the Typert gateway reported its generic
`wire field "command" failed boundary validation` error. This is the strict
contract's wire-boundary RED for the crafted missing field, not a host setup,
transport or selector failure, and the gateway did not expose a nested path in
its returned `details`. The accepted head stayed at R1 and Canon/storage hashes
were unchanged. RED recorded 8 direct RPC and 22 browser-observed Web API
responses, with zero console, page or failed-request errors.

The GREEN restored the anchored R1/R2 values and ran the complete native
retrieval, generated Remote, historical/current narrative projection, panel and
reload checks. The pursuit wave moved from `low → high → medium` with a
partial/occurred release and planned recovery in R1 to `medium → peak → low`
with a full/occurred release and occurred recovery in R2. The aftershock wave
remained `rest → medium → high`, `scene-courtyard → ongoing`, with both markers
null in both revisions.

## Observed flow

1. The fresh Web Host created one Workspace and Standard Session. R1 accepted a
   minimal original manuscript, a Book → Volume → Arc → Chapter → Scene
   hierarchy, and the version-1 `tension-payoff` value at Chapter scope. The
   pursuit wave carried `pressure` and `release` scene functions; the overlapping
   aftershock carried `anticipation`.
2. R2 accepted a second manuscript and a version-2 value at the same scope. The
   pursuit wave changed its intensity, duration, release kind/details and
   recovery status/details, and added `climax` and `aftermath` scene functions.
   The aftershock wave was retained unchanged with no release or recovery.
3. The Standard Agent emitted exactly one native call:

   `retrieve_novel_context({"revision":2,"compareRevision":1,"narrativeClock":"tension-payoff","narrativeUnitId":"chapter-10"})`

   It produced exactly one successful native result. No
   `propose_novel_result_packet` call and no `tool-workflow/*` event occurred.
4. Current retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Its strict clock hit retained both wave ids, R2
   intensity/duration/release/recovery values, all scene-function contributions,
   source revision 2, Delta `tension-payoff-chapter-10-r2`, Anchor
   `anchor-tension-payoff-clock-r2` and seed provenance.
5. The R1→R2 revision impact contained one changed clock entry. Its complete
   before/after values retained both overlapping waves, including the R1
   partial/planned pursuit state and the unchanged ongoing aftershock. A
   historical `projectNarrative` request exposed version 1 and a current request
   exposed version 2 with source Delta, Anchor and provenance metadata. The
   generated Remote matched the selected narrative-clock hit and revision
   impact returned by the native Tool.
6. The existing panel rendered
   `[data-narrative-clock="tension-payoff"]`,
   `[data-tension-payoff-scope="chapter-10"]`, one
   `[data-tension-wave="wave-old-court-escape"]` and one
   `[data-tension-wave="wave-trust-aftershock"]`. It displayed intensity,
   duration, release, recovery, source and all three scene-function entries;
   the aftershock visibly showed `No release marker` and `No recovery marker`.
   After `page.reload()`, the same two waves and three scene-function entries
   remained visible with the R2 values.
7. `novelProject/current` stayed at accepted revision R2. Retrieval, Remote
   reads, panel rendering and reload did not change Canon or storage.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64276`; root and navigation HTTP status `200`.
- GREEN Workspace: `13643f96-50a3-4ca4-bbbc-80de06402f5c`.
- GREEN Session: `session-6434252b-045a-4694-bea9-5ed7887caccc`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 18 direct RPC and 87 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 25,419 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `d27843eece38be6a436d7f268114613ac1a1e226d6be8a337f1e4c25b28c98bb`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `272fbf25cbb5382c3ed0a9f2abfed835d66737186cb97dca96b684dcaa434bd9`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the GREEN root are `green-summary.json`,
  `tension-payoff-clock-stock-trace.zip`,
  `tension-payoff-clock-r2.png`, `tension-payoff-clock-r2-reloaded.png`,
  `session.jsonl`, `replay.override.json`,
  `prepare-tension-fixture.mjs` and `run-tension-smoke.mjs`. The RED root
  retains `red-summary.json`, `tension-payoff-clock-red-error.png`, the trace,
  replay inputs and the same fixture/runner.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `A09A403C6F059629852E59710739A7C48C3E40618AC75F84984D44FDD717ACFA` |
| GREEN `tension-payoff-clock-stock-trace.zip` | `E51FAEFA29B05A1A522A4E27A96DAD7B1D6668AA5601A41B99B8F4B0D055C3AA` |
| GREEN `tension-payoff-clock-r2.png` | `4005ECD9D8BACED28BC456EF1270406FE418702D912BE2AC2FDEBFA44E4049A3` |
| GREEN `tension-payoff-clock-r2-reloaded.png` | `4E7009F6B573896A0840D1A65224F79B0C0D92FFEB2AE086F5C43FD0D9AB9217` |
| RED `red-summary.json` | `3FCE0CD9AF848661FE5F997E8C49B369F5823020BF26ACFE9F845D78334FFDF0` |
| RED `tension-payoff-clock-red-error.png` | `AF56E5162BB204A34AB0C21DCFCC395CE5B7ABBAD2E9B24D97E0D222A3B196C4` |
| RED `tension-payoff-clock-stock-trace.zip` | `950EDE875B6ECF04F36E83615AE4DAE5F3F34B65F603CBF2C3B7960347B8927E` |

The GREEN Host on port `64276` and RED Host on port `64275` were stopped
through their PTYs; follow-up listener probes returned zero. A discarded first
attempt left a stale DSH Host on port `64274` (PID `36956`); its exact command
line was verified and that process was stopped separately, with a final zero
listener probe. It is not part of the measured GREEN/RED counts.

## Claim boundary

This promotes only the strict `tension-payoff` R1/R2 overlapping-wave
projection, complete intensity/duration/release/recovery/scene-function fields,
historical/current revision comparison, generated-Remote selected-hit/impact
agreement, existing Narrative clocks rendering, renderer reload recovery,
strict missing-`aftermath` wire-boundary rejection and unchanged Canon/storage
for this synthetic fixture. The RED gateway intentionally reports only its
generic command-boundary validation message, so no deeper parser-path claim is
made. The manuscript, scene ids and source ranges are smoke inputs; this is
schema/projection and visible plumbing evidence rather than semantic pacing or
writing-quality evidence. It does not promote the other strict narrative
clocks, process or transport crash recovery, production installation or user
acceptance.
