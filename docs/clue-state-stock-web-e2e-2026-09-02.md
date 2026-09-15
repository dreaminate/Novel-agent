# Strict clue/state lifecycle stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing strict `clue/state` lifecycle projection in a
fresh stock DSH Web Profile. R1 accepts one `foreshadowing` state for
`clue-moon-seal`, with its statement, linked mystery, reader visibility,
intended function and a pending payoff. R2 updates the same clue to a typed
paid-off state with an aftermath. The existing `clueLifecycleId` retrieval
Tool/generated Remote, Canon/clue lifecycle panel and reload path are used;
no parallel foreshadow store or UI is introduced.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-clue-state-stock-web-red-final-20260902-01a05b3c`

It accepted R1 and R2, then submitted an R3 paid-off `clue/state` whose typed
payoff omitted `aftermath`. The RPC envelope returned HTTP `200` with
`result.ok: false`; the strict path was
`packet.deltas[0].value.payoff.aftermath`. The accepted head stayed R2 and
Canon/storage hashes were byte-identical before and after rejection. RED
recorded 14 direct RPC and 21 browser-observed Web API responses, with zero
console, page or request failures.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-clue-state-stock-web-green-final-20260902-01a05b3c`

The stock Agent emitted one native retrieval call with the exact payload
`{"revision":2,"compareRevision":1,"clueLifecycleId":"clue-moon-seal"}`.
The current lifecycle returned the R2 paid-off state and its typed aftermath;
historical R1 returned the planted state with `payoff: null`. The generated
Remote and `projectNarrative` revisions agreed, and the existing clue panel
restored the lifecycle after reload.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted a Book →
   Volume hierarchy, a source-bearing clue and its strict planted state. R2
   accepted the typed payoff update in the same author Result Packet path.
2. The current lifecycle retained the clue role/status, statement, linked
   mystery id, reader visibility, intended function, payoff window, typed
   payoff/aftermath, revision rationale, source Delta/Anchor ranges and
   provenance. Historical R1 retained the original source and pending payoff.
3. The native Tool result, generated Remote and historical/current
   `projectNarrative` projections agreed on revision, lifecycle state and
   source metadata. Retrieval created no proposal, workflow event or `novel/`
   Canon frame.
4. The existing Canon/clue lifecycle area rendered the R2 state, payoff and
   aftermath with source labels. The nested value did not render as
   `[object Object]`.
5. After renderer reload, the clue selector and lifecycle builder restored the
   R2 paid-off state and aftermath.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64321`; root/navigation HTTP status `200`.
- GREEN Workspace: `b1fdcfa9-00b3-4b51-9bf4-732c21b777d5`.
- GREEN Session: `session-c11abb76-393b-40f1-8f21-69982ccc1b69`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 22 direct RPC and 67 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- The native result stayed inline (`nativeResultSpilled: false`) at 40,321
  UTF-8 bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `A9240A79F6D8E70EF5EDFFBE6BC981B4959522F606B2B96CC45DBE37288227A4`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `7023C0271B2092472D438C74D98F6185FE195A52EE419C21CAF48E54691DF5A8`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `clue-state-r2.png`,
  `clue-state-r2-reloaded.png`, `clue-state-stock-web-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains the matching error screenshot, trace, summary and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `0CFEAA5DD8993A8766DD76B6B88698F7F721DF6EC4D7BE1E55EE413F9ECFBF01` |
| GREEN `clue-state-r2.png` | `CD96D4124041E7506926A3F890C1412FFEE02E6548B9EAB2FC59A09AD5FFF2ED` |
| GREEN `clue-state-r2-reloaded.png` | `CD96D4124041E7506926A3F890C1412FFEE02E6548B9EAB2FC59A09AD5FFF2ED` |
| GREEN `clue-state-stock-web-trace.zip` | `39259666E6B516ACAC2E9A1DED955E5319AA12C57F4119AFE7420E60D097290F` |
| GREEN `session.jsonl` | `D05D4BAA27355CB98B6609CEB7EA5E237363C23E5445B567D6A52FBFA676AAEC` |
| GREEN `replay.override.json` | `871CF9C08D087D6B884CA91885FFF4C4F8E4791DD211653D484C3A69C4C5CBFB` |
| RED `red-summary.json` | `CE22C5C8A438BDD2C25E869FE4D0DD6A538F6C5D1AEF874972195067164F36E5` |
| RED `clue-state-red-error.png` | `AD7925CFD2E44BEE43F6191E7F7712E6CB04AD3DA441325BAE996B1D58C730BA` |
| RED `clue-state-stock-web-trace.zip` | `3CD337A32C9AAAAEC52D01FE8D652A89A14EA4F82D1DD7BE949DA5E72795C4E0` |

The RED Host on port `64320` and GREEN Host on port `64321` were stopped
through their PTYs; follow-up listener probes returned zero. This smoke is
limited to the synthetic strict clue lifecycle and does not claim semantic
foreshadowing quality.

## Claim boundary

This promotes only the synthetic strict `clue/state` R1→R2 lifecycle:
planted-to-paid-off state, typed payoff aftermath, historical/current
`clueLifecycleId` retrieval, generated-Remote and `projectNarrative` agreement,
source/provenance retention, existing panel/reload, strict missing-aftermath
rejection and unchanged Canon/storage. It does not promote full mystery
semantics, rollback-specific lifecycle restoration, process/transport recovery,
production installation or user acceptance.
