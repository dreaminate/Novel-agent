# Bounded Write automation stock-Agent E2E — 2026-08-28

## Scope

This run verifies the first author-approved bounded automation path through the
single `@novel-agent/novel-project` plugin and stock DSH Web UI. It uses the
existing `authorize_novel_automation` and `propose_novel_result_packet` Tools,
the stock approval responder, Session events and `concludeTurn()`. It adds no
automation engine, queue, Profile wrapper, community-plugin adapter or new UI.

The final run used DSH `0.1.1-rc.2`, the stock Web `standard` Agent preset, the
current local `novel-project` package and `@deepseek-ai/dsh-llm-replay`
`0.1.1-rc.2` in a new temporary Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-automation-stock-agent-6c81e6c6d1054131977f9ea9b80961c9`

The user's global `.dsh` was not used. The Host bound only
`http://127.0.0.1:54406`, was stopped after the run, and no listener remained on
that port.

## Visible author flow

1. The test seeded accepted R1 with `chapter-1` plus one accepted Canon fact.
2. The stock Agent called `authorize_novel_automation` for exactly R1,
   `chapter-1`, Write-only, one Result Packet, that accepted Canon lock and the
   four fixed stop rules.
3. The stock approval card visibly showed the complete revision, unit, budget,
   lock and stop-rule scope. Before the decision, Canon remained R1 and the
   Session contained no `novel/automation-policy` event.
4. The author clicked stock `Allow once`. DSH recorded one
   `approval/decided` with outcome `allowed-once`, then the Tool appended the
   active policy snapshot.
5. The Agent called the existing `propose_novel_result_packet` once. The
   proposal stayed authorization-free and appeared in the existing Novel
   Project `conversation.view` review controls.
6. The proposal consumed the one-packet budget, appended the stopped snapshot
   with `stopReason=scope-complete`, and native `concludeTurn()` ended the turn
   as `completed`. Canon remained R1; Accept and Publish were not called.

The successful Session was
`session-0bfab48e-e5cd-49f5-a5d3-8ae0dd11551b` in Workspace
`985b766f-4b8b-40d6-8fc0-bc7cdd30d09b`.

## Observed evidence

- native Tool calls, in order:
  `authorize_novel_automation` → `propose_novel_result_packet`;
- one stock approval decision: `allowed-once`;
- policy event `seq=22`: `active`, `usedResultPackets=0`;
- policy event `seq=33`: `stopped`, `usedResultPackets=1`,
  `stopReason=scope-complete`, with the same run id;
- completed `turn/end` at `seq=36`;
- accepted revision before approval, while pending and after completion: R1;
- Web navigation HTTP `200`;
- 11 direct RPC calls and 36 captured Web API responses, all successful;
- zero console warnings/errors, page errors and failed requests.

Retained artifacts include `automation-smoke-summary.json`, the replay fixture,
two screenshots (`automation-approval-pending.png` and
`automation-proposal-stopped-r1.png`) and `automation-smoke-trace.zip` under the
temporary root above.

## Claim boundary

This promotes only the single-revision, single-unit, Write-only,
single-Result-Packet envelope to `verified`. Token, cost, wall-time, retry and
multi-unit budgets, permanent project locks, production installation and user
acceptance remain separate increments. The run does not grant automatic Accept
or Publish authority.
