# Reader-response SimulationRun stock-Web E2E — 2026-09-02

## Scope

This increment verifies the smallest visible reader-response SimulationRun path
in the existing `@novel-agent/novel-project` `conversation.view`: one accepted
R1 manuscript unit, one configured Persona, explicit reading history, one
native `simulate_novel_reader_response` call, one typed synthetic reaction and
the proposal-only result rendered before and after a renderer reload. The run
does not add product code, a Tool, a store, a queue, a Workflow or a
TUI/sidebar surface.

The implementation exercised is the existing
[`simulate_novel_reader_response`](../packages/novel-project/src/index.ts) Tool
and [`ReaderResponseSimulationView`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The fresh isolated profile contained only the linked current
`@novel-agent/novel-project` and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The CLI reported DSH
`0.1.1-rc.2`; the user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-red-20260902-01a05b3c`

It seeded the same accepted R1 manuscript and replayed a single reaction whose
`evidence` was `文本中不存在的证据`. The native Tool ran once and returned an
error Result (not a setup or selector failure):

`Error: reader-response reaction evidence "文本中不存在的证据" does not occur in the presented text`

The RED runner asserted `tool-result.isError === true`, the exact evidence
mismatch, unchanged R1 Canon/storage hashes, one native Tool call/result and
zero browser failures. Its summary is marked `phase: RED` in `red-summary.json`.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-green-20260902-01a05b3c`

Its child replay restored the exact presented-text evidence `却没有看见来人`
and emitted one `confusion` hypothesis.

## Observed flow

1. `workspace.create`, `novelProject/open` and a stock Standard Session were
   created on a fresh profile. `novelProject/review` accepted one manuscript
   unit (`chapter-1`) as R1.
2. The stock Agent made exactly one model-authored and one native
   `simulate_novel_reader_response` call with revision R1, the accepted unit,
   Persona `serial-mystery-reader`, seed and explicit reading history. The
   child replay returned one structured-output reaction; the parent then
   completed with `READER_SIMULATION_DONE_R1`.
3. The native Result was one proposal-only run:
   - `runId = 74224416-c2ab-4804-9545-2f8686f75322`;
   - `sourceRevision = 1`, `unitId = chapter-1`;
   - `seed = reader-response-stock-seed-r1`;
   - `replayKey = 3534565b36fefae137607dcc40907831bb75dd383684423f13f0a7bc4e67f063`;
   - presented text source `accepted`, with SHA-256
     `80de9e6e5290159d7ef75bf2b2f7200922e54ec6564842efa119d7de50de3d14`;
   - one `confusion` reaction with exact evidence `却没有看见来人`;
   - `marketRepresentative = false` and provenance producer
     `novel-reader-response-simulation`.
4. The existing panel selector
   `[data-reader-response-simulation="74224416-c2ab-4804-9545-2f8686f75322"]`
   rendered R1, run/seed/replay identity, Persona, presented text/source/hash,
   reading history, hypothesis, reaction evidence, synthetic-only label,
   limitations and provenance. The reaction selector
   `[data-reader-response-reaction="confusion"]` was present. A page reload
   restored the same run and replay key.
5. No Result Packet proposal, author Apply, workflow event or Canon mutation
   occurred. The stock session ended with `turn/end: completed`.

## Evidence and shutdown

- GREEN host: `http://127.0.0.1:64252`; root navigation and follow-up root
  fetch returned HTTP `200` while running.
- GREEN Workspace: `22a2a527-d645-4f25-a6b6-43cb147f6ba8`.
- GREEN Session: `session-197edad5-b76f-4d4f-8c75-9fe4c32099d2`.
- GREEN direct RPC responses: `18`; browser-observed Web API responses: `63`.
  Every response was successful; console messages, page errors and failed
  requests were all `0`.
- No post-seed `novel/` mux frame was observed (`0`); the native result stayed
  below the stock 50,000-byte spill threshold.
- Canon remained R1. `projectCanon` SHA-256 before/after:
  `657db32b21200804bbcef1b374f87f5699c570984f5bef181b58040572f4bba5`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `3051cd8f34a3b5a06b381cfa788f32aa865f5df3b5dddee8d4629de0a79f06e3`.
- The Host was stopped through its PTY. Port `64252` then had no listener and
  a follow-up loopback request was refused.
- The repository gate after this evidence remained green: `corepack pnpm test`
  passed 5 files / 234 tests, and `corepack pnpm typecheck`, `corepack pnpm lint`,
  `corepack pnpm build` and the single-package `pack --dry-run` all passed. The
  rebuilt `packages/novel-project/lib/index.js` SHA-256 stayed
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the root above: `green-summary.json`,
  `reader-response-stock-trace.zip`, `reader-response-r1.png`,
  `reader-response-r1-reloaded.png`, `session.jsonl`, `child.jsonl`,
  `replay.override.json`, `prepare-reader-fixture.mjs` and
  `run-reader-smoke.mjs`.
- RED artifacts under the RED root above: `red-summary.json`,
  `reader-response-red-error.png`, the replay inputs and the same runner.

Selected SHA-256 evidence:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `C6BD5DB3BB2C3A61D7191DDA41C020D3E4B3095910CD218BDBA725F3200C4C61` |
| GREEN `reader-response-stock-trace.zip` | `22BFD2224DA2FB836E3E7B1F0542706A7E897E6852E4F985A5D92ACDCA0478A0` |
| GREEN `reader-response-r1.png` | `0F3A8CE298120E29FE8C78898EAA56364761323BE37D14E8243CC1475BAE48F3` |
| GREEN `reader-response-r1-reloaded.png` | `48049919F4D3DB5EAAA826600ED448F212A3348AC4859012C9BAF4BC07435EE0` |
| GREEN `session.jsonl` | `0277D166D1EE61A486CE356DAF4F3896BAF2BC2225B15FECFE0ACAE41B5DE031` |
| GREEN `child.jsonl` | `6E4F538DAC9C0C7ACA4093E63E139325A95EB427F7E1CB49B892B1949FB60E5E` |
| GREEN `replay.override.json` | `B6A1C57322A82739E6ADC63F7875BC4833BE2E42AE88F2A7087BF3C506E06272` |
| RED `red-summary.json` | `C71A6B1C8CD3A32635E9D8C6C6F4163D5F6AA37A41E8F00800E48EEBEEFDF8DF` |
| `packages/novel-project/lib/index.js` | `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771` |

## Claim boundary

This promotes only the single visible stock-Web accepted-text reader-response
run and its existing panel/reload plumbing against a frozen accepted revision,
including exact presented-text identity, typed evidence, synthetic-only label,
stable replay identity metadata and unchanged Canon/storage. The manuscript,
reaction and reading history are synthetic smoke inputs; this is
plumbing/projection evidence, not a claim about external-reader semantics or
model determinism. It does not claim child isolation, parent-session filtering,
child disposal, multi-seed/candidate/Persona/variant comparisons, process or
transport crash recovery, production installation or user acceptance.
