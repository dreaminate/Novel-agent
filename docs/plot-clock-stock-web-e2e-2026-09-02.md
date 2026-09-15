# Strict plot clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `plot` narrative-clock path in a
fresh stock DSH Web Profile: R1 contains one `book-main` plot line with an
obstacle and a choice; R2 keeps the same scope and adds a consequence and a
reversal. One Standard Agent calls the existing
`retrieve_novel_context` Tool with `compareRevision: 1`; the generated Remote
and existing Novel Project Narrative clocks view expose the historical/current
comparison, source metadata and plot debt. The panel restores the current R2
projection after reload. No product code, Tool, store, queue, Workflow or new
UI was added.

The implementation exercised is the existing strict plot resolver and
[`PlotProgressionEntryView`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted only the linked current
`@novel-agent/novel-project` and temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; the CLI reported DSH
`0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-plot-clock-stock-web-red4-20260902-01a05b3c`

After accepting the valid R1 fixture, it submitted a shape-valid R2 packet with
the strict plot delta's `sourceAnchorIds: []`. The generated wire boundary
accepted the packet shape and the domain refinement rejected it with:

`plot progression requires at least one source anchor`

The RED runner asserted the real strict rejection, retained accepted head R1,
and captured 7 direct RPC and 22 browser-observed Web API responses with zero
console, page or request failures. This is a controlled schema RED, not a host
setup or selector failure.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-plot-clock-stock-web-green2-20260902-01a05b3c`

It restored the anchored R1/R2 values and ran the complete read-only retrieval
and panel flow.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   `book-main` narrative unit, strict plot value `v1` with
   `obstacle → choice`, and open `debt-find-survivor`; R2 accepted the same
   scope with `v2` and `obstacle → choice → consequence → reversal`.
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"narrativeClock":"plot","narrativeUnitId":"book-main"}`

   The turn completed as `completed`; no proposal or workflow event occurred.
3. The native result returned `revision: 2`, `headRevision: 2`,
   `freshness: "current"`, one `narrative-clock` hit for R2 and one R1 plot
   debt. The revision impact contained one changed clock entry: R1 `v1` with
   two turns versus R2 `v2` with four turns. Both hits retained source Delta,
   Anchor range and provenance; debt remained `open` at R1.
4. The generated Remote returned the same selected hits and revision impact.
   `projectNarrative` independently returned the R1 and R2 plot buckets. The
   existing panel rendered `[data-narrative-clock="plot"]`,
   `[data-plot-progression-scope="book-main"]`,
   `[data-plot-line="line-old-case"]` and four `[data-plot-turn]` entries,
   including source labels for `plot-book-main-r2` and the R1 debt. Reload
   restored the same four-turn R2 view.
5. Canon remained at R2 throughout the read-only queries and renderer reload.

## Evidence and shutdown

- GREEN host: `http://127.0.0.1:64264`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `17bfdd2f-ac8d-472a-be05-357af6462153`.
- GREEN Session: `session-a64f8624-73fb-4ab8-a714-4686e97bc3d5`.
- GREEN direct RPC responses: `18`; browser-observed Web API responses: `65`;
  all succeeded. Console messages, page errors and failed requests: `0`.
- No post-seed `novel/` mux frame was observed (`0`). Native result stayed
  inline below the stock spill threshold.
- Canon `projectCanon` SHA-256 before/after:
  `1c5f4d5e142d1b869db75e3f01f0b78e7c451866d9fde5b4bd560ad30a7e3ece`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `3ef2132313aae60446a083e96a0ca9dcd96d1165360e3b1cb377836c4c4c8b13`.
- Host shutdown via PTY left port `64264` without a listener; a follow-up
  loopback request was refused. RED port `64260` was also cleared.
- GREEN artifacts: `green-summary.json`, `plot-clock-stock-trace.zip`,
  `plot-clock-r2.png`, `plot-clock-r2-reloaded.png`, `session.jsonl`,
  `replay.override.json`, `prepare-plot-fixture.mjs` and `run-plot-smoke.mjs`.
- RED artifacts: `red-summary.json`, `plot-clock-red-error.png`,
  `plot-clock-stock-trace.zip`, replay inputs and the runner.

Selected SHA-256 evidence:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `2F55A2B31B63EAF2729409AE9666D96BB629E0F695F22A7F3E7570BEB17A605A` |
| GREEN `plot-clock-stock-trace.zip` | `0712768D581E3292BF2F17C198D930BA0C6E7D37BC7F5F3A51C2DA86212C4A6A` |
| GREEN `plot-clock-r2.png` | `2B2371780F431A6ACA2AAF87100754C8D95F6E06C116302732EE0E0FD9C3EB75` |
| GREEN `plot-clock-r2-reloaded.png` | `BB63E0116BF58E419200EBB8EB539373FCCC1EE425AD15B4A4ECF151AA0BFD6C` |
| GREEN `session.jsonl` | `D5A55C26FB154FCBF0E34C1133B487E989C1A84A237D727E2C84B67897D73229` |
| GREEN `replay.override.json` | `808F4E5D77438EB973FE80E2646CFBBE210098A019EC67D1144791588A6414F8` |
| RED `red-summary.json` | `6A0F00E3F1536E5F8BC6EFD94FFA35E3F5DFD9BF580CBD873D8EA292E40C6287` |
| RED `plot-clock-red-error.png` | `94B0434791414860FD741A87743566C0F40E816C29EF8C564E0F9A42C2AFE6D2` |
| RED `plot-clock-stock-trace.zip` | `AEC6C56F011B2C2D29387963A5D1D102F832D3E2EDCACF9FBCCDC1E25A6367E6` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |
| `packages/novel-project/lib/index.js` | `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771` |

## Claim boundary

This promotes only the fresh stock-Web strict `plot` clock retrieval, generated
Remote equality, historical/current R1/R2 projection, existing Narrative
clocks rendering and reload for the stated synthetic fixture, including
source/provenance/debt and unchanged Canon/storage. It does not promote the
other strict clocks, broader authoring semantics, process/transport recovery,
production installation or user acceptance.
