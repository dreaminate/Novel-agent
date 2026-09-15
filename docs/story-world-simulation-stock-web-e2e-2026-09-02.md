# Story-world SimulationRun stock-Web E2E — 2026-09-02

## Scope

This increment verifies the smallest visible story-world SimulationRun path in
the existing `@novel-agent/novel-project` `conversation.view`: one accepted R1
character location, one actor resource, one native
`simulate_novel_story_world` call, one child structured-output action, and the
proposal-only result rendered before and after a renderer reload. The run does
not add product code, a Tool, a store, a queue, a Workflow or a TUI/sidebar
surface.

The implementation exercised is the existing
[`simulate_novel_story_world`](../packages/novel-project/src/index.ts) Tool and
the existing [`StoryWorldSimulationView`](../packages/novel-project/src/client/NovelProjectPanel.tsx).
The isolated profile contained only the linked current
`@novel-agent/novel-project` and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The CLI reported DSH
`0.1.1-rc.2`; the user's global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-red2-20260902-01a05b3c`

It seeded the same R1 `character-state:shen-yan:location = 旧庭` and actor
resource `灯笼`, then replayed a single structured action whose exact location
precondition was `北岸`. The native Tool still ran once and returned an error
Result (not a setup or selector failure):

`Error: story-world action 1 has unmet precondition ... expected "北岸", received "旧庭"`

The RED runner asserted `tool-result.isError === true`, the exact mismatch,
unchanged R1 Canon/storage hashes, one native Tool call/result, and zero
browser failures. Its summary is marked `phase: RED` in `red-summary.json`.

The GREEN used a new root:

`C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-green4-20260902-01a05b3c`

Its child replay restored the exact accepted precondition (`旧庭`) and emitted
one `observe` action that sets
`fact:knowledge:footprints:direction = 西墙`.

## Observed flow

1. `workspace.create`, `novelProject/open`, and a stock Standard Session were
   created on a fresh profile. `novelProject/review` accepted one manuscript
   and one location delta as R1.
2. The stock Agent made exactly one model-authored and one native
   `simulate_novel_story_world` call with the R1 revision, seed, actor goal,
   `location` knowledge reference and `灯笼` resource. The child replay
   returned one typed structured-output action; the parent then completed with
   `SIMULATION_DONE_R1`.
3. The native Result was one proposal-only run:
   - `runId = ce30379f-db58-4b09-8489-5456fb7179f9`;
   - `sourceRevision = 1`, `maxActions = 1`;
   - `seed = story-world-stock-seed-r1`;
   - `replayKey = 5e31d24b7aeb30987eba7895424fe5f6e61e61a2e1f370e219ceebc7faa0648a`;
   - one `observe · 西墙脚印` trace item;
   - initial state: location `旧庭`, resource `灯笼 = true`;
   - final state: knowledge `footprints.direction = 西墙`, location `旧庭`,
     resource `灯笼 = true`;
   - provenance producer `novel-story-world-simulation`.
4. The existing panel selector
   `[data-story-world-simulation="ce30379f-db58-4b09-8489-5456fb7179f9"]`
   rendered R1, run/seed/replay identity, hypothesis, actor/action trace,
   Before/After/Final state and provenance. The action selector
   `[data-story-world-action="0"]` was present. A page reload restored the
   same run and replay key.
5. No Result Packet proposal, author Apply, workflow event or Canon mutation
   occurred. The stock session ended with `turn/end: completed`.

## Evidence and shutdown

- GREEN host: `http://127.0.0.1:64248`; root navigation HTTP `200`.
- GREEN Workspace: `812034d4-918a-4f3c-aabc-f067fb192304`.
- GREEN Session: `session-74802eff-9f34-40f7-ba69-064464ab29ae`.
- GREEN direct RPC responses: `18`; browser-observed Web API responses: `63`.
  Every response was successful; console messages, page errors and failed
  requests were all `0`.
- No post-seed `novel/` mux frame was observed (`0`); the run was inline and
  did not hit the stock 50,000-byte spill threshold.
- Canon remained R1. `projectCanon` SHA-256 before/after:
  `34b6088d91eecb1b4323680c7a8290f92f9f4ab3e57d776054f81151322e7df3`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `899cf5bb122364bc0d944dc87570923ddb9f5b719821634730fa91a6c378b1b8`.
- The Host was stopped through its PTY. Port `64248` then had no listener and
  a follow-up loopback request was refused.
- The repository gate after this evidence remained green: `corepack pnpm test`
  passed 5 files / 234 tests, and `corepack pnpm typecheck`, `corepack pnpm lint`,
  `corepack pnpm build` and the single-package `pack --dry-run` all passed. The
  rebuilt `packages/novel-project/lib/index.js` SHA-256 stayed
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts under the root above: `green-summary.json`,
  `story-world-stock-trace.zip`, `story-world-r1.png`,
  `story-world-r1-reloaded.png`, `session.jsonl`, `child.jsonl`,
  `replay.override.json`, `prepare-simulation-fixture.mjs` and
  `run-simulation-smoke.mjs`.
- RED artifacts under the RED root above: `red-summary.json`,
  `story-world-red-error.png`, the replay inputs and the same runner.

Selected SHA-256 evidence:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `835F1D9807EF09D794DB81AB037426D74D84C90E47D3CA2AAC99FDA1AFF88999` |
| GREEN `story-world-stock-trace.zip` | `A355796E126529CB45AFBDD9DC71790C69BC8DE6E22114ACFEC7FB8C8AD54901` |
| GREEN `story-world-r1.png` | `5D42309C72B60F3F851DAE4F673761663D603C3143E46F94B536F04BA1CB7C66` |
| GREEN `story-world-r1-reloaded.png` | `62832817414958A62D5272C2110A6EFBC460C789DF351E4B16D2A6199368E63A` |
| GREEN `session.jsonl` | `9BC916CB1E9397DA695EA4E3E03771C00E32B7B6DFBC501FC4BFCE3B1BD3C9BE` |
| GREEN `child.jsonl` | `D38A803DFFC1405523F3EC3A9686AF55E5FE276F80D9EDE91B46055DAED99652` |
| GREEN `replay.override.json` | `45B43D42F4FCE5EA8A6ED8EBAA8053E971EEF0D3723FB6FEF59CB64AA9367552` |
| RED `red-summary.json` | `612048F4915746D882A153E2859B3CD1AD6A154074D4033ABB2B96C0EB013F82` |
| `packages/novel-project/lib/index.js` | `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771` |

## Claim boundary

This promotes only the single visible stock-Web story-world action and its
existing panel/reload plumbing against a frozen accepted revision, including
the typed before/after/final projection, stable replay identity metadata and
unchanged Canon/storage. The action and manuscript are synthetic smoke inputs;
this is plumbing/projection evidence, not a claim about external-model prose
quality or semantic determinism. It does not claim child role-knowledge
isolation, parent-session filtering, child disposal, process/transport crash
recovery, multi-action/seed/branch/role comparisons, production installation
or user acceptance.
