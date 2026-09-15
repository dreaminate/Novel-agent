# Publish stock-Agent E2E — 2026-08-28

## Scope

This run verifies Publish through the single `@novel-agent/novel-project`
plugin and the stock DSH Agent, Tool Runtime, approval events and
`conversation.view`. It publishes one manuscript from an accepted revision to
an explicit local UTF-8 file only after the user selects the stock `Allow once`
decision. Publishing does not advance Canon.

No Publish UI, approval implementation, Better Sidebar tab, Pi TUI extension,
Profile, Bundle, community-plugin adapter or second workflow record was added.

The accepted evidence used DSH `0.1.1-rc.2`, the stock Web `standard` preset,
the current local `novel-project` build and the official replay provider in the
temporary Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-publish-stock-agent-ce9336a4fcdc44528432878427df7d17\attempt-3-ff591fecb5cc48c3acaff49f3127cf5c`

The user's global `.dsh` was not used.

## Observed stock-Agent flow

1. Seeded accepted R1 with manuscript `第一章 雪庭` and text
   `她推开门，看见雪落满旧庭。`.
2. The replay model called `publish_novel_manuscript` once with R1,
   `chapter-1` and `published-chapter-1.txt`.
3. Before the decision, the target file did not exist, Canon was R1 and the
   stock approval card showed the revision, title, destination and preview.
4. The user-facing stock Web button `允许一次` produced the native
   `allowed-once` decision. Only then did the Tool write the file.
5. The resulting UTF-8 file exactly matched the accepted R1 manuscript. The
   durable native Tool Result retained aggregate revision R1, source revision
   R1, unit id, title, absolute destination, `create` and 13 characters.
6. Canon remained R1 after Publish. No workflow or custom approval event was
   introduced.

The durable Session order was:

`tool/call` seq 19 → `approval/asked` seq 20 → `approval/decided` seq 21 →
`tool/result` seq 22 → completed `turn/end` seq 32.

The Session was `session-b9732dae-958c-47e2-9a1a-28cf3c130005` in Workspace
`7ef7da0e-5639-44b0-a833-eb0804fa46ac`; the Novel Project id was
`0f29a128-1c7e-4914-b207-aedbcb9e2925`.

## Persistence restart

After the Publish Host, browser and event stream were closed, the same isolated
Profile was restarted without creating a Workspace or Session and without
prompting the Agent or invoking Publish again.

- `current`, `read` and `projectManuscripts` all reconstructed accepted R1;
- the manuscript projection retained `sourceRevision=1` and exactly matched
  the accepted title and text;
- `published-chapter-1.txt` still exactly matched the accepted manuscript;
- stock Web restored the existing Session and displayed `Revision 1` and
  `R1 · 第一章 雪庭`.

## Web, evidence and shutdown

- the Publish flow captured 16 direct RPC responses and 36 Web API responses;
- the persistence restart captured 3 direct RPC responses and 38 Web API
  responses;
- every direct RPC was HTTP `200`, no captured Web response was `>=400`, and
  console errors, page errors and failed requests were all zero;
- the Publish Host used `127.0.0.1:51886` as PID `3192`; the persistence Host
  used `127.0.0.1:55208` as PID `46808`;
- after each shutdown, the recorded PID was absent, the port had no listener
  and refused a loopback connection, no process referenced the temporary root,
  Playwright was disconnected and the event Mux was closed.

Retained evidence in the temporary attempt includes:

- `publish-agent-smoke-attempt-3-failure.json`;
- `publish-approval-pending-r1.png`;
- `publish-agent-smoke-trace.zip`;
- `publish-persistence-reload-summary.json`;
- `publish-persistence-reloaded-r1.png`;
- `publish-persistence-reload-trace.zip`.

The attempt-3 file is named `failure` because its final temporary locator
incorrectly waited for the full manuscript body inside the Novel Project panel.
That panel intentionally renders the accepted revision and title rather than
the whole manuscript body. The Publish flow had already completed, and the
separate restart check used the panel's actual public surface plus direct
revision/manuscript RPCs. Earlier temporary attempts respectively used an
auto-reject permission preset and an English-only approval selector; neither
changed repository code.

## Claim boundary

This promotes the current stock-Agent Publish normal path to `verified`: an
accepted manuscript can be written to a named local destination only after an
independent stock DSH decision, while Canon remains unchanged and reconstructs
after restart. This does not verify production installation, user acceptance,
Pi TUI rendering or unrelated community-plugin interactions.
