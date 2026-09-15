# Strict world reference clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `world` reference clock in a
fresh stock DSH Web Profile. R1 accepts a Book → Volume → Arc → Chapter
hierarchy, one typed `world/rule`, one faction-continuity record, one
location-continuity record, one object-continuity record and a world clock with
three reference-bearing moves. R2 updates the rule and each continuity family
and retains those moves while adding a fourth reference-bearing move. The existing
`retrieve_novel_context` Tool, generated Remote, `projectNarrative`, typed
faction/location/object ledgers and Narrative clocks area expose the
historical/current values, references, source metadata and reload state. No
product code, Tool, store, queue, Workflow or new UI was added.

The exercised implementation is the existing strict world schema, typed
continuity resolvers and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project`
and temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages
were `0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-red-20260902-01a05b3c`

After accepting valid R1/R2 rule, continuity and world-clock values, it
submitted a shape-valid R3 world-clock value whose second move reused the first
move's `moveId`. The HTTP/RPC envelope returned HTTP `200` with `result.ok:
false`; the strict domain refinement rejected it with:

`world moveId 'world-move-public-r2' must be unique within one clock value`

The RED runner retained accepted head R2 and verified byte-identical Canon and
storage hashes. It recorded 10 direct RPC and 22 browser-observed Web API
responses with zero console, page or request failures. This is a controlled
strict-domain RED, not a host setup or selector failure.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-green3-20260902-01a05b3c`

An initial GREEN runner at
`C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-green-20260902-01a05b3c`
failed only in its historical ledger RPC call because the runner passed the
ledger fields at the wrong argument level; its preserved failure JSON recorded
the descriptor error, 16 direct RPC and 23 browser-observed Web API responses,
and zero browser failures. The corrected runner was rerun in the GREEN3 root
above; no product or host failure was involved.

The stock Agent retrieval deliberately used only
`revision`, `compareRevision`, `narrativeClock` and `narrativeUnitId`; separate
generated-Remote queries added `canonKind`/target and `factionId`, `locationId`
and `objectId` to exercise the typed ledgers without spilling the Agent result.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   hierarchy and v1 typed world rule, faction/location/object continuity facts,
   and a v1 world clock whose three moves referenced the rule plus the three
   continuity entry ids. R2 accepted v2 updates for all four typed fact
   families and a v2 clock retaining those three moves plus
   `world-move-public-r2`, whose references cover the rule and all three updated
   continuity families.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"narrativeClock":"world","narrativeUnitId":"volume-moon-gate"}`

   The turn ended `completed`; no proposal or workflow event occurred. The
   native result retained the R2 world clock, reference ids, source Delta,
   Anchor range and provenance, with a complete R1→R2 clock comparison.
3. The generated Remote returned the same selected world-clock hit and impact.
   Its typed queries returned the R2 world rule and the ordered R1/R2
   faction/location/object continuity entries, each with source revision, Delta,
   Anchor ranges and provenance. Historical queries returned only R1 entries
   and were marked `historical`; `projectNarrative` independently returned world
   clock versions 1 and 2.
4. The existing panel rendered `[data-narrative-clock="world"]`,
   `[data-world-clock-scope="volume-moon-gate"]`, all four `[data-world-move]` rows and
   every `[data-world-reference]` (rule, faction-continuity,
   location-continuity and object-continuity). The Canon area remained the
   existing source-labelled view for the typed facts. Reload restored the v2
   world clock and all references.
5. Canon remained at accepted revision R2 throughout retrieval, Remote,
   `projectNarrative`, typed ledger reads, panel rendering and reload.

## Corrected attempts

Two disposable GREEN attempts are retained as diagnostic artifacts, not
completion evidence:

- `C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-green-20260902-01a05b3c`
  (port `64295`) reached the Host successfully but its runner sent the
  historical ledger fields at the wrong RPC argument level. The preserved
  failure JSON records that descriptor error; no product behavior was changed.
- `C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-green2-20260902-01a05b3c`
  (port `64296`) was discarded before measurement because its copied Profile
  turned DSH's required `@deepseek-ai/dsh` junction into an ordinary directory,
  so Host boot rejected the installation. GREEN3 rebuilt the isolated Profile
  with the junctions preserved and is the only final GREEN evidence.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64297`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `09730efe-9d88-4e00-8ce7-e540ccbc3806`.
- GREEN Session: `session-481b7af9-1c46-4526-b05a-51cc27f7c602`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 20 direct RPC and 86 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 37,392 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon `projectCanon` SHA-256 before/after:
  `551b80bbd2f85488e1fc7d59755f55eff3deb2610d0887280097b6f2d1be02fa`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `3d7ebde50aca06bc9dd01f9c0c564196640f3d0a7fe5b06c36188f1788915ad0`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The initial GREEN Host on port `64295`, final GREEN Host on port `64297` and
  RED Host on port `64294` were stopped through their PTYs; follow-up listener
  probes returned zero.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `A648EBC831516EDAA6EA47C65760E751086F9BE428411725002AA0D14991C6B6` |
| GREEN `world-clock-stock-trace.zip` | `3873411D6A87D251AA35F0B486013E006CFB6EB496485788026C7FD94BAF0234` |
| GREEN `world-clock-r2.png` | `F358F000F1F429352FC2AD2FC500763E3238407CEAE1B6EA9280CB648FFF1C8E` |
| GREEN `world-clock-r2-reloaded.png` | `EB9ACEFED44485C22EB709B22464B2ECD731D7C8A3650FAD6A5D5A95A46E7649` |
| GREEN `session.jsonl` | `D2235D8DE2D7B450040022C1A271A15ECFDF3C164D27B0C6349D4944C5FC18BA` |
| GREEN `replay.override.json` | `5629C9753C5ECADB286094675601B30CCE8004AC02179E73EC1159F50E9FCD12` |
| Initial GREEN failure `green-summary.json` | `C7CC320AE6C566913A04DA493AC2873BD009243BAA5F00D1F777CE30380F58B3` |
| Initial GREEN failure `world-clock-stock-trace.zip` | `FC576F6CC148FAD571E7D3D695967DEAFA390320EB0F6937CA9FE708318C247F` |
| RED `red-summary.json` | `ECC215174407521BA426648196656A6417AF3DAC05BFA30A695698FBF818BEAA` |
| RED `world-clock-red-error.png` | `A865961504C966FDD0929A8C41ABB49DF59907DCB6018F2F2083587F737FA222` |
| RED `world-clock-stock-trace.zip` | `4FB57629F447A6144048AB6E815CE2FC1F81853EC436F529391156EEB00F3D70` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web strict world reference-clock R1/R2
projection, typed rule/faction/location/object references and ledgers,
historical/current comparison, generated-Remote and `projectNarrative`
agreement, existing Narrative clocks/Canon rendering, renderer reload recovery,
strict duplicate-`moveId` rejection and unchanged Canon/storage for this
synthetic fixture. It does not promote cross-Canon existence validation,
broader world simulation semantics, process/transport crash recovery,
production installation or user acceptance.
