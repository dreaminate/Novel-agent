# Plan stock-Agent E2E — 2026-08-28

## Scope

This run verifies the proposal-only Plan path through the single
`@novel-agent/novel-project` plugin and a stock DSH Agent. The Agent reads the
accepted Novel Project revision, then returns a bounded plan in the stock
`conversation.view`. It does not submit a Result Packet, invoke the workflow
tool or advance Canon.

No product code, Plan UI, workflow wrapper, Better Sidebar tab, Pi TUI
extension, Profile, Bundle or community-plugin adapter was added for this
verification.

The accepted run used DSH `0.1.1-rc.2`, the stock Web `standard` preset, the
current local `novel-project` build and the official replay provider in a new
temporary Profile rooted at:

`C:\\Users\\33166\\AppData\\Local\\Temp\\novel-agent-plan-stock-agent-5a697a87710048a087d313681f5fc9ac\\attempt-3-289031f802a742f38b82f3fc4cf24b3a`

The user's global `.dsh` was not used.

## Observed stock-Agent flow

1. Seeded accepted R1 with manuscript `第一章 雪庭`.
2. The model called `retrieve_novel_context` once for R1 and received one
   native Tool Result.
3. The stock conversation rendered a plan containing the accepted/source
   revision, narrative scope, two alternatives, constraints and a stop
   condition that waits for the author's choice.
4. The model made zero `propose_novel_result_packet` calls and emitted zero
   workflow events.
5. Accepted Canon remained R1 before Plan, after Plan and after renderer reload.
6. The Novel Project panel restored `第一章 雪庭 · R1` after reload and displayed
   no Result Packet proposal.

The completed Session was
`session-518a860f-a1f0-40f8-9791-25ff21d3908f` in Workspace
`c05905ee-938c-4e6e-a387-04210bd13159`; the Novel Project id was
`9495dc73-172f-4ba5-9ba9-6b267d5285e1`.

## Event, Web and shutdown evidence

- one model retrieval call, one native `tool/call` and one native
  `tool/result`;
- zero proposal calls/results and zero `tool-workflow/*` events;
- two visible plan alternatives and a completed turn;
- 14 direct RPC responses, all HTTP `200`;
- 62 captured Web API responses, all successful;
- zero console errors, page errors and failed requests;
- the Host originally listened on `127.0.0.1:59205` as PID `23560`, with
  parent PID `45852`; after Ctrl+C both processes were absent, listener count
  was zero and the loopback request was refused.

The retained evidence includes:

- `plan-agent-smoke-summary.json`;
- `process-evidence.json`;
- `plan-answer-r1.png`;
- `plan-canon-r1.png`;
- `plan-r1-reloaded.png`;
- `plan-agent-smoke-trace.zip`.

The first temporary attempt timed out only because its Playwright locator used
an exact match for the first line while stock Web rendered the complete
multi-line plan as one paragraph. The temporary locator was changed to a
non-exact match and the accepted evidence came from a completely new Profile;
no repository source was changed to obtain GREEN.

## Claim boundary

This promotes the current stock-Agent Plan normal path to `verified`. Ask,
Write, Review and author-applied Accept retain their separately recorded
evidence. Publish still requires a named destination and an independent author
decision. This run does not verify production installation, user acceptance,
Pi TUI rendering or unrelated community-plugin interactions.
