# `retrieve_novel_context` stock-Agent E2E — 2026-08-28

## Scope

This run verifies the first real Ask-stage path in the single
`@novel-agent/novel-project` plugin. The stock DSH Agent reads accepted novel
evidence through one read-only domain Tool. The slice adds no workflow engine,
custom Session event, approval system, UI, Profile wrapper or community-plugin
adapter.

The final run used DSH `0.1.1-rc.2`, the stock Web `standard` preset, the current
local `novel-project` build and the official replay provider in a new temporary
Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-retrieve-stock-agent-935bb9589fc34db583827b279501dfd8`

The user's global `.dsh` was not used.

## RED → GREEN

The focused RED was:

`exposes accepted revision evidence through a read-only DSH Tool for Ask`

It failed because `ctx.tools.schemas()` contained only
`rebuild_novel_index`; `retrieve_novel_context` did not exist. GREEN registers
that Tool inside `novel-project`, resolves the calling Agent's existing DSH
Workspace from its Session `cwd`, and delegates directly to the existing
revision-aware `retrieve()` service. The focused test also observes the rendered
model-facing JSON and confirms that the accepted revision does not advance.

## Observed stock-Agent flow

1. Seeded accepted R1 with manuscript and Canon evidence.
2. The live `request/header.tools` exposed `retrieve_novel_context` with required
   integer `revision` and optional string `exactText`.
3. The model emitted one native Tool call for R1 and `雪落满旧庭`.
4. The Tool result returned `revision=1`, `headRevision=1` and
   `freshness=current`.
5. Results included:
   - an exact manuscript hit for `chapter-1`, range 7..12, source revision R1
     and its provenance;
   - a structured Canon hit with its SourceAnchor range and provenance.
6. The replay's final answer dynamically copied the returned project id and R1
   evidence, proving that the next model request received the Tool result.
7. The accepted Novel Project revision remained R1.

The completed Session was
`session-3c596e7d-a41b-4151-af56-816cd8503078` in Workspace
`795e38cd-d2e6-4140-af06-66b5b315eee1`.

## Event and Web evidence

- one `tool/call` and one `tool/result`;
- completed turn end;
- zero `tool-workflow/*` events;
- zero custom retrieval events;
- Web navigation and root fetch returned HTTP `200`;
- all 11 captured RPC responses returned HTTP `200`;
- zero console errors, page errors and failed requests.

The retained evidence includes `retrieve-agent-smoke-summary.json`,
`session.jsonl`, `stock-web.png`, the replay fixture and the runner script. The
temporary DSH PID was stopped and its loopback port `50405` was closed after
the run.

## Claim boundary

This promotes the ordinary Ask stage to `verified`: a stock Agent can read one
accepted revision and answer from returned evidence without mutating Canon.
Plan, Write, Review-to-panel delivery, Accept orchestration and Publish remain
separate increments.
