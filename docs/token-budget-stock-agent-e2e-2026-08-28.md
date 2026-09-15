# Provider-reported Token budget stock-Agent E2E — 2026-08-28

## Scope

This run verifies the Token-budget increment of the existing bounded Write
automation through the single `@novel-agent/novel-project` plugin and stock DSH
Web UI. The plugin reads DSH's existing `tokenUsage` Session projection; it does
not implement a tokenizer, meter, workflow engine, queue, UI, adapter, Profile
or Bundle.

The run used DSH `0.1.1-rc.2`, the stock Web `standard` Agent preset, the current
local `novel-project` package and `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` in a
new temporary Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-token-budget-stock-agent-547e1ccc05b245979289c1a8fe865425`

The user's global `.dsh` was not used. The Host bound only
`http://127.0.0.1:51009`; it was stopped after the run, the listener count became
zero and the origin was no longer reachable.

## Visible author flow

1. The driver seeded accepted R1 with `chapter-1` and one accepted Canon fact.
2. The stock Agent called `authorize_novel_automation` for R1, `chapter-1`,
   Write-only, one Result Packet, `maxTokens=20`, the Canon lock and the four
   fixed stop rules.
3. The stock approval card visibly showed `20 provider-reported tokens`. Before
   `Allow once`, Canon remained R1 and no `novel/automation-policy` event
   existed.
4. The first provider-reported usage sample totaled 28 Tokens. After
   `allowed-once`, the active policy recorded `baselineTokens=28` and
   `usedTokens=0`.
5. The next model step reported another 28 Tokens and attempted the existing
   `propose_novel_result_packet` Tool. The pre-execute policy rejected it because
   `usedTokens=28` exceeded `maxTokens=20`.
6. The Session appended a stopped snapshot with
   `stopReason=budget-exhausted`, `usedResultPackets=0` and `usedTokens=28`.
   No Result Packet appeared, the stock Agent completed its turn, and Canon
   remained R1. Accept and Publish were never called.

The successful Session was
`session-be1ca46d-0f72-4d46-b282-f43426b8b999` in Workspace
`2cdb76ac-e5f8-4da5-916a-24f5d28b99b1`.

## Observed evidence

- native Tool calls, in order:
  `authorize_novel_automation` → `propose_novel_result_packet`;
- stock approval outcome: `allowed-once`;
- active policy at `seq=22`: `maxTokens=20`, `baselineTokens=28`,
  `usedTokens=0`;
- stopped policy at `seq=33`: `budget-exhausted`, `usedTokens=28`,
  `usedResultPackets=0`, with the same run id;
- proposal Tool Result error:
  `exceeded token budget 20 with used 28`;
- completed `turn/end` at `seq=44`;
- accepted revision before approval, while pending and after completion: R1;
- Web navigation HTTP `200`;
- 13 direct RPC calls and 36 captured Web API responses, all successful;
- zero console warnings/errors, page errors and failed requests.

Retained artifacts include `automation-token-budget-smoke-summary.json`, the
replay fixture, two screenshots and `automation-smoke-trace.zip` under the
temporary root above.

## Claim boundary

This promotes only provider-reported Token budgeting for the existing
single-revision, single-unit, Write-only, single-Result-Packet envelope to
`verified`. Cost, wall-time, retry and multi-unit budgets, permanent project
locks, production installation and user acceptance remain separate increments.
Providers that do not report usage do not create measured Tokens; the plugin
does not add an estimator or pricing table.
