# Strict mystery clock stock-Web E2E — 2026-09-02

## Scope

This increment verifies the existing strict `mystery` narrative-clock path in
a fresh stock DSH Web Profile. R1 keeps one `volume-old-court` scope with four
ordered moves (`open-question`, `advance`, `misdirect`, `hold`); R2 keeps the
same scope and adds `partial-reveal`, `reveal` and `recontextualize`. Every move
references accepted mystery, clue or knowledge target ids and carries a
non-empty contribution. One Standard Agent calls the existing
`retrieve_novel_context` Tool with `compareRevision: 1`; the generated Remote
and existing Narrative clocks view expose the historical/current comparison,
source metadata and an open mystery debt. Reload restores the current R2 view.
No product code, Tool, store, queue, Workflow or new UI was added.

The exercised implementation is the existing strict mystery resolver and
[`MysteryClockEntryView`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated Profile mounted only the linked current
`@novel-agent/novel-project` and temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; the CLI reported DSH
`0.1.1-rc.2`. The user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-mystery-clock-stock-web-red-20260902-01a05b3c`

After accepting the valid R1 fixture, it submitted a shape-valid R2 packet
whose nested mystery moves contained a duplicate `moveId`. The generated wire
boundary accepted the packet shape and the strict domain refinement rejected it
with:

`mystery moveId 'mystery-move-open-survivor' must be unique within one clock value`

The RED runner asserted the real strict rejection, unchanged R1 Canon/storage
hashes and accepted head, and zero browser failures. Its summary is marked
`phase: RED`.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-mystery-clock-stock-web-green2-20260902-01a05b3c`

It restored unique anchored moves and ran the complete read-only retrieval,
Remote, projection, panel and reload flow.

## Observed flow

1. A fresh Workspace and Standard Session were created. R1 accepted the
   `book-main → volume-old-court` hierarchy, generic accepted target facts for
   the referenced mystery/clue/knowledge ids, the strict mystery value `v1`
   (`open-question → advance → misdirect → hold`) and open
   `debt-mystery-survivor`. R2 accepted the same scope as `v2` with three
   additional moves (`partial-reveal → reveal → recontextualize`).
2. The stock Agent emitted exactly one model-authored and one native
   `retrieve_novel_context` call:

   `{"revision":2,"compareRevision":1,"narrativeClock":"mystery","narrativeUnitId":"volume-old-court"}`

   The turn completed as `completed`; no proposal or workflow event occurred.
3. The native result returned `revision: 2`, `headRevision: 2`,
   `freshness: "current"`, one R2 `narrative-clock` hit and the R1 open plot
   debt. Its revision impact contained one changed clock entry (four R1 moves
   versus seven R2 moves), retaining nested references, Delta, Anchor ranges
   and provenance.
4. The generated Remote returned the same selected hits and revision impact;
   `projectNarrative` independently returned the R1 and R2 mystery buckets.
   The existing panel rendered `[data-narrative-clock="mystery"]`,
   `[data-mystery-clock-scope="volume-old-court"]`, seven
   `[data-mystery-move]` entries, each clue/knowledge reference and
   contribution, the R2 source label and the R1 debt source label. Reload
   restored the same seven-move R2 view.
5. Canon remained at R2 throughout all read-only queries and renderer reload.

## Evidence and shutdown

- GREEN host: `http://127.0.0.1:64272`; root navigation/fetch HTTP `200`.
- GREEN Workspace: `1288caf7-6281-46bc-975e-5758e2ba23ce`.
- GREEN Session: `session-5dc74af8-9b1a-42da-b2cf-586ee947e144`.
- GREEN direct RPC responses: `18`; browser-observed Web API responses: `87`;
  all succeeded. Console messages, page errors and failed requests: `0`.
- No post-seed `novel/` mux frame was observed (`0`). Native result stayed
  inline below the stock spill threshold.
- Canon `projectCanon` SHA-256 before/after:
  `8ae37a3aa06a477bac4b4a83b989eada991130976248cf8307ab3ba12145fd48`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `954340cb741abfc3762ed0322818dcc00b45bd7a53fac05e09838532510e85e4`.
- Host shutdown via PTY left port `64272` without a listener; a follow-up
  loopback request was refused. RED port `64268` was also cleared.
- GREEN artifacts: `green-summary.json`, `mystery-clock-stock-trace.zip`,
  `mystery-clock-r2.png`, `mystery-clock-r2-reloaded.png`, `session.jsonl`,
  `replay.override.json`, `prepare-mystery-fixture.mjs` and
  `run-mystery-smoke.mjs`.
- RED artifacts: `red-summary.json`, `mystery-clock-red-error.png`,
  `mystery-clock-stock-trace.zip`, replay inputs and the runner.

Selected SHA-256 evidence:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `BA3B50970688C4B9F97980CD7DD59A5D72E8DBF9CA1412BC594F91D27F7C042F` |
| GREEN `mystery-clock-stock-trace.zip` | `11EEDE60643D8686ACA1EAD2B8A7105B74202C5F10CE112BD5598E184EFA1081` |
| GREEN `mystery-clock-r2.png` | `44E5959D58E344AB806716B05C76157D684F3917D67C92EE2DFB5065F9590123` |
| GREEN `mystery-clock-r2-reloaded.png` | `DB6CE37CFE93C6A9E35D50394F527CD79358D32070EE05B98761A525A6FA0C2D` |
| GREEN `session.jsonl` | `46E87F48BCF579658F3C875667B028C7568E86BEC8CFB1FE3EAF3303E047853A` |
| GREEN `replay.override.json` | `68FC92F5498C518BAFCC15B56B3CBD367B20C10E983286B803A2A5A40FE3DD68` |
| RED `red-summary.json` | `3310AC99531E408959D1FEE88A4D55D132387B185FB1F70BF46F30023E70C124` |
| RED `mystery-clock-red-error.png` | `759E2533221973BFE8D950A58D2D7A8EA6DCA247E42027C8974F47BC7041A5D0` |
| RED `mystery-clock-stock-trace.zip` | `6316FE00106A056CB494B54053510B5E2116FD441B8EFC53DE7654FDD3E3DAB7` |
| Isolated Profile `package.json` | `A78183E13A680F0BA7DC0B525148301C2CD42D3C03B4AEFABA554FEB5D46D68B` |
| Isolated Profile `pnpm-lock.yaml` | `33E03A652DE61A2BC662219FEEE006E8D7535ABBE03CF91BCD9F1C9DE15013B4` |
| `packages/novel-project/lib/index.js` | `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771` |

## Claim boundary

This promotes only the fresh stock-Web strict `mystery` clock retrieval,
generated Remote equality, historical/current R1/R2 nested-move comparison,
source/provenance/debt rendering and reload for the stated synthetic fixture.
It does not promote the other strict clocks, broader mystery lifecycle
semantics, process/transport recovery, production installation or user
acceptance.
