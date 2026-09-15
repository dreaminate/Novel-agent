# Strict ending closure clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `ending` closure clock and its
Book-scoped ending hypothesis/debt ledger in a fresh stock DSH Web Profile. R1
accepts `book-main`, a complete ending hypothesis, two acyclic narrative debts
and a `converge → hold` ending clock. R2 accepts one same-scope Result Packet
that updates the hypothesis and one debt, then advances the clock to
`resolve → aftermath → hold`. The existing `retrieve_novel_context` Tool,
generated Remote, `projectNarrative`, closure ledger and `conversation.view`
Ending/Narrative clocks surfaces expose historical/current values, source
metadata and reload state. No product code, Tool, store, queue, Workflow or
new UI was added.

The exercised implementation is the existing strict schema, closure resolver
and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project`
and temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages
were `0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-ending-clock-stock-web-red2-20260902-01a05b3c`

After accepting valid R1/R2 hypothesis, debt and clock values, it submitted a
shape-valid R3 ending-clock value whose second move reused the first move's
`moveId`. The HTTP/RPC envelope returned HTTP `200` with `result.ok: false`; the
strict domain refinement rejected it with:

`ending moveId 'ending-move-resolve-trust' must be unique within one clock value`

The RED runner retained accepted head R2 and verified byte-identical Canon and
storage hashes. It recorded 10 direct RPC and 21 browser-observed Web API
responses with zero console, page or request failures. This is a controlled
strict-domain RED, not a host setup or selector failure.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-ending-clock-stock-web-green4-20260902-01a05b3c`

The stock Agent retrieval intentionally carried only
`revision`, `compareRevision`, `narrativeClock` and `narrativeUnitId`. A separate
generated-Remote closure query supplied `closureScopeId: "book-main"` and
`remainingChapterBudget: 9`, avoiding the stock inline spill boundary while
still exercising the complete closure ledger.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   `book-main` Book unit, strict `ending/hypothesis` v1, an open relationship
   debt and an open world debt depending on it, plus the v1 ending clock
   (`converge → hold`). R2 accepted the v2 hypothesis (`resolutionMode:
   closure`), changed the relationship debt to `resolved`, and accepted the v2
   clock (`resolve → aftermath → hold`) in the same review transaction.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"narrativeClock":"ending","narrativeUnitId":"book-main"}`

   The turn ended `completed`; no proposal or workflow event occurred. The
   native result retained the R2 clock, debt references, source Delta, Anchor
   range and provenance, and its revision impact contained the complete R1/R2
   clock before/after.
3. The generated Remote returned the same selected ending-clock hit and
   revision impact. Its closure query returned `book-main`, budget `9`, the R2
   hypothesis, ending entry and dependency order
   `relationship/debt-ending-trust → world/debt-ending-world`; the two debts
   retained their expected `resolved`/`open` statuses and source metadata.
   Independent `projectNarrative` calls returned ending clock v1 and v2.
4. The existing panel rendered
   `[data-narrative-clock="ending"]`,
   `[data-ending-clock-scope="book-main"]` and the three accepted
   `[data-ending-move]` rows with debt references and contributions. The
   existing closure controls (`Ending closure scope`, `Remaining Chapter
   budget`, `data-build-ending-closure`) rendered
   `[data-ending-closure-ledger]`, `[data-ending-hypothesis]`, three
   `[data-ending-final-state]` rows and two
   `[data-ending-closure-dependency]` rows. After reload the ending clock and
   closure ledger rebuilt with the same R2 values.
5. Canon remained at accepted revision R2 throughout retrieval, Remote,
   `projectNarrative`, closure building, panel rendering and reload.

## Corrected attempts

Two disposable GREEN attempts are retained as diagnostic artifacts, not
completion evidence:

- `...novel-ending-clock-stock-web-green-20260902-01a05b3c` (port `64289`)
  failed in the runner by looking for debts inside the `ending` bucket. The
  existing projection correctly groups each debt under its own `relationship`
  or `world` bucket; the closure Remote is the cross-clock debt surface.
- `...novel-ending-clock-stock-web-green2-20260902-01a05b3c` (port `64290`)
  failed only because the runner expected a `Movement:` label; the existing
  Ending renderer emits `resolve-and-aftermath · …` without that prefix.

GREEN3 passed with an extra Canon filter but was superseded so the final run
could use the explicitly required four-key Agent query. All three Hosts were
stopped and are excluded from the final counts.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64293`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `9bbe0e58-441c-4853-9f41-8a93342f822a`.
- GREEN Session: `session-8d0956a6-2a54-4ed7-8cbe-51c30c5e4f21`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 20 direct RPC and 89 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 24,842 UTF-8
  bytes. Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon `projectCanon` SHA-256 before/after:
  `B3C915EBB347E55B75D870C3F061CF462F6F9AEF0A12E8F13753F21FCF41F999`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `98FCD61C4CFEFEDB40BC0215204B857E9E34EB94EFFEAD4CD393B0B5AFFD0506`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The final GREEN Host on port `64293` and RED Host on port `64292` were
  stopped through their PTYs; follow-up listener probes returned zero.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `6732028B825A452F98574F103CC1C544CB08673CAAA6A583E9BCBBC678DC6DC0` |
| GREEN `ending-clock-stock-trace.zip` | `14A4A85E4FE246660B02D6ADD809D98C4537D491904B5E4F0025D927D146FD0C` |
| GREEN `ending-clock-r2.png` | `5E7EEB84B7836821C31126B5ECC4C25C4C54EA711F7B48ED49F3084AB7405F8B` |
| GREEN `ending-clock-r2-reloaded.png` | `5E7EEB84B7836821C31126B5ECC4C25C4C54EA711F7B48ED49F3084AB7405F8B` |
| GREEN `session.jsonl` | `647FF4041B58328439D733820569AA8C3F8BD83B930FACBBC2C37DBA8B3EAA11` |
| GREEN `replay.override.json` | `5A37BD761EEC3D78103149DE7FAE35C0785F6CD512971E90FE1E7F4FC641DF51` |
| RED `red-summary.json` | `F41BCD57DB1B874982597FAA06C455DA7EE460244279E261C8FE41C5DB328DE8` |
| RED `ending-clock-red-error.png` | `53E557FA56FA43F475D05D86C5962046C5028E356CBBCF9C1372E50949B8DB5D` |
| RED `ending-clock-stock-trace.zip` | `9B725CAF4C6E3701046BD01D2BCE33EAF5CC1934EF6972ED8A417109652954A8` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web strict ending-clock and Book-scoped
ending-hypothesis/debt closure path: R1/R2 accepted projection, same-packet
hypothesis/debt/clock update, split native/closure retrieval, generated-Remote
and `projectNarrative` agreement, existing Ending/Narrative clocks and closure
ledger rendering, renderer reload recovery, strict duplicate-`moveId`
rejection and unchanged Canon/storage for this synthetic fixture. It does not
promote the other strict clocks, broader ending semantics, process/transport
crash recovery, production installation or user acceptance.
