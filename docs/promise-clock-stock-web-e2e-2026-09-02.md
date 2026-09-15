# Strict Promise clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `promise` narrative-clock and
authoritative `promise/state` lifecycle in a fresh stock DSH Web Profile. R1
accepts a `volume-old-court` scope with an open Promise and debt, plus
`open → remind → hold` clock moves. R2 accepts one atomic Result Packet that
updates the Promise state to retired, retires the debt, and extends the same
clock with `partial-payoff → payoff → retire`. The existing
`retrieve_novel_context` Tool, generated Remote, `projectNarrative`, Promise
lifecycle builder and Narrative clocks area expose the historical/current
values, target/debt references, source metadata and reload state. No product
code, Tool, store, queue, Workflow or new UI was added.

The exercised implementation is the existing strict schema, lifecycle
resolver and panel renderer in
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts),
[`index.ts`](../packages/novel-project/src/index.ts) and
[`NovelProjectPanel.tsx`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted the current local `@novel-agent/novel-project`
and temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; DSH CLI and packages
were `0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-promise-clock-stock-web-red-20260902-01a05b3c`

After accepting the valid R1 Promise state, debt and clock, it submitted an
otherwise shape-valid R2 clock whose second move reused the first move's
`moveId`. The HTTP/RPC envelope returned HTTP `200` with `result.ok: false`; the
strict domain refinement rejected it with:

`promise moveId 'promise-move-open-moon-gate' must be unique within one clock value`

The RED runner asserted the rejection, retained accepted head R1, and verified
byte-identical Canon and storage hashes. It recorded 8 direct RPC and 20
browser-observed Web API responses with zero console, page or request failures.
This is a controlled strict-domain RED, not a host setup or selector failure.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-promise-clock-stock-web-green2-20260902-01a05b3c`

It restored the anchored R1/R2 values and ran the complete native clock
retrieval, generated Remote, lifecycle Remote, historical/current projection,
panel and reload flow.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   `book-main → volume-old-court` hierarchy, strict `promise/state` v1 with
   complete horizon/setup/reminder/resolution fields (`status: open`), an open
   `debt-promise-moon-gate`, and a strict Promise clock v1 with
   `open → remind → hold` moves. R2 accepted one review Packet containing the
   v2 Promise state (`status: retired`, payoff beat and aftermath), a debt
   update to `retired`, and the v2 clock with
   `open → remind → hold → partial-payoff → payoff → retire`.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call for the clock comparison:

   `{"revision":2,"compareRevision":1,"narrativeClock":"promise","narrativeUnitId":"volume-old-court"}`

   The turn ended `completed`; no proposal or workflow event occurred. The
   lifecycle-specific query was issued separately through the generated Remote
   and by the existing lifecycle builder so the stock Agent result stayed below
   the inline output cap.
3. The native result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Its Promise clock hit retained all six move kinds,
   Promise/debt ids, R2 source Delta, Anchor range and seed provenance. Its
   revision impact contained one changed clock entry (R1 three moves versus R2
   six) and one changed debt (open → retired). The generated Remote returned
   the same selected clock/debt hits and impact.
4. The lifecycle Remote returned `promiseLifecycleId: "promise-moon-gate"`,
   current R2/head R2 and entries for R1 and R2. The entries retained complete
   Promise state values, source ranges, accepted Delta ids and provenance; the
   R2 entry recorded the `state` change from open to retired. Independent
   `projectNarrative` calls returned the R1 v1 and R2 v2 Promise buckets with
   their debt status and source metadata.
5. The existing panel rendered
   `[data-narrative-clock="promise"]`,
   `[data-promise-clock-scope="volume-old-court"]` and one
   `[data-promise-move]` for each of the six accepted moves, including debt
   references and contributions. Its existing Promise lifecycle builder
   rendered `[data-promise-lifecycle]`, R1/R2 entries,
   `[data-promise-state="promise-moon-gate"]`, setup/reminder/complication
   beats, the retired resolution and the R2 state-change row. After reload the
   clock and all six moves remained visible; rebuilding the lifecycle restored
   both entries and the retired state.
6. Canon remained at accepted revision R2 throughout retrieval, Remote and
   `projectNarrative` reads, lifecycle building, panel rendering and reload.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64285`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `b2161799-d5bb-4669-a87d-50e835fdf769`.
- GREEN Session: `session-eca6abd1-22c8-406b-9664-b0e48f6c73cf`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; turn ended `completed`.
- GREEN recorded 20 direct RPC and 88 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon `projectCanon` SHA-256 before/after:
  `337587F06E5CF7B8EA1981C4586D34F206BCB54D769800B7230303C465E6E263`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `2AE988CBDDAC6BB326CEFCA9A0EB75FFB4EBB7023EE4C6EC4DB6664BB7C138D0`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- The GREEN Host on port `64285` and RED Host on port `64283` were stopped
  through their PTYs; follow-up listener probes returned zero. A discarded
  first GREEN attempt on port `64284` included the lifecycle payload in the
  stock Agent result and exceeded the inline spill boundary, causing the
  client parser to reject the appended spill notice; it was excluded from the
  measured run and required no product change.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `E9B9BBA9C178464174FE1693A7650B68BED5B71F7A30D00FEA52F1B20743F8C8` |
| GREEN `promise-clock-stock-trace.zip` | `FD44FB9710BE10C76BC78E472B9387DA57E14C99CA702DDFEC881B24D81416F9` |
| GREEN `promise-clock-r2.png` | `1000E957B0A11096C746EE1A9440FA47B01061B1B1193607334F2F7832C3E69A` |
| GREEN `promise-clock-r2-reloaded.png` | `CB338DB190B12EAA8B66C37C5DFE507AF18EC523570229AB3F3C3FAB17EE551F` |
| GREEN `session.jsonl` | `77B5426A84D0D9488BCA567A6D882CBD25082B3C8D009A628DFBC5FF59040779` |
| GREEN `replay.override.json` | `C8BDDE22596E823DC2D1E33EF4BB0FF9FC215F21E52946BF721A100922B5D122` |
| RED `red-summary.json` | `9B442897A21AF3EF2372CC8805060FB6C7673C5132AFCA800F310EE0F6DBA081` |
| RED `promise-clock-red-error.png` | `2A5265A17C822415F10E5282654D609ABF73DC294BF0671167892D33EAB30BA4` |
| RED `promise-clock-stock-trace.zip` | `7C2DD5592D56DBF801AE54D6AD40E019DF35253CBC4F75487D3F1D5CD9D5BAE9` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |

## Claim boundary

This promotes only the fresh stock-Web strict Promise clock and
`promise/state` R1/R2 atomic update, Promise/debt references, lifecycle source
metadata, historical/current comparison, generated-Remote and
`projectNarrative` agreement, existing Narrative clocks and Promise lifecycle
rendering, renderer reload recovery, strict duplicate-`moveId` rejection and
unchanged Canon/storage for this synthetic fixture. It does not promote the
other strict clocks, broader Promise semantics, process/transport crash
recovery, production installation or user acceptance.
