# Write Result Packet stock-Agent E2E — 2026-08-28

## Scope

This run verifies the real Write path inside the single
`@novel-agent/novel-project` plugin. A stock DSH Agent first reads one accepted
revision, then submits one complete authorization-free Result Packet proposal.
The existing `conversation.view` Novel Project panel discovers the proposal
from the native DSH Tool Result and leaves Canon unchanged until the author
decides every item and applies the review.

The slice adds no Agent Loop branch, workflow engine, custom Session event,
Better Sidebar tab, Pi TUI extension, Profile wrapper, Bundle or other
community-plugin adapter.

The accepted run used DSH `0.1.1-rc.2`, the stock Web `standard` preset, the
current local `novel-project` build and the official replay provider in a new
temporary Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-write-stock-agent-84275965aa774706932a5e7e2a913f8f`

The user's global `.dsh` was not used.

## RED → GREEN

The Host RED failed because `propose_novel_result_packet` was absent from the
registered DSH Tool schemas. The Client RED failed because the existing Novel
Project panel did not read a successful proposal Tool Result from the current
Session snapshot.

GREEN registers the Tool inside `novel-project`, resolves the calling Agent's
existing DSH Workspace from its Session `cwd`, validates the complete Result
Packet draft against the current accepted revision, and replaces the draft's
placeholder provenance Session with the calling Agent id. It returns the draft
without authorization and without calling review or acceptance. Stock DSH
persists the proposal through its existing `tool/call` and `tool/result`
events; the existing panel opens that result in its existing review controls.

## Observed stock-Agent and author flow

1. Seeded accepted R1 with manuscript `第一章 雪庭`.
2. The model called `retrieve_novel_context` once for R1 and received one native
   Tool Result.
3. The model called `propose_novel_result_packet` once with a complete R2 draft,
   one story-event Delta, one anchored Issue and a manuscript Diff.
4. The returned proposal carried the real calling Session id and no
   `authorization`; accepted Canon remained R1.
5. The stock Web Novel Project panel visibly rendered the R2 manuscript, Diff,
   Delta, Issue, SourceAnchor and pending author decision.
6. The author path selected `Accept all items` and
   `Apply Result Packet Review`. Only that existing Remote path minted
   `authorization.kind=author` and appended R2 with `parentRevision=1` and two
   accepted decisions.
7. After renderer reload, the head remained R2 and the manuscript selector
   restored `第一章 雪夜归来 · R2` with `sourceRevision=2`.

The completed Session was
`session-5d2179cd-7af1-40f9-8611-7f8b5d41282a` in Workspace
`8b5706f5-6e95-43ac-85c6-7b81a7970c88`.

## Event, Web and shutdown evidence

- 41 Session events;
- two native `tool/call` and two native `tool/result` events, one pair for
  retrieval and one pair for proposal;
- zero `tool-workflow/*` events;
- seven direct Novel Project RPC responses, all HTTP `200`;
- 100 captured Web API responses across proposal, Apply and reload, all 2xx;
- zero console errors, page errors and failed requests;
- the Host process was stopped; PID `45332` was absent, port `59963` had no
  listener and the origin was no longer connectable.

The retained evidence includes:

- `write-agent-smoke-summary.json`;
- `write-agent-apply-dom-evidence.json`;
- `process-evidence.json`;
- `write-r2-proposal-pending-r1.png`;
- `write-r2-accepted.png`;
- `write-r2-reloaded.png`;
- `write-agent-smoke-trace.zip`;
- `write-r2-reload-trace.zip`.

## Claim boundary

This promotes the current stock-Agent Write proposal and author-applied Accept
path to `verified`. Plan still needs its own normal-path evidence, and Publish
still requires a named destination and a separate decision. This run does not
verify production installation, user acceptance, Pi TUI rendering or unrelated
community-plugin interactions.
