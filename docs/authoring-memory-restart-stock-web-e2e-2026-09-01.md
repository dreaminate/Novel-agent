# Authoring-memory restart stock-Web E2E — 2026-09-01

## Scope

This run verifies the exact no-`chapterId` next-Chapter writing-memory path in
the single `@novel-agent/novel-project` plugin. One fresh stock Web Host accepts
R1 with all three strict authoring contracts, query-independent character
carry-forward, one complete character-arc hypothesis, reader disclosure and a
Chapter outcome. After that Host stops, another real Host opens the same
isolated DSH home and Project, creates a different Agent Session and calls the
existing `retrieve_novel_context` Tool again.

The accepted run used DSH `0.1.1-rc.2`, the stock Web `standard` preset, the
current local `novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-agent-authoring-memory-stock-web-bf4c32e8a69048018196f7855de13ad6`

The Profile contained only `dsh-base`, `dsh-web-app`,
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` and the linked
`@novel-agent/novel-project`. The user's global `.dsh` was not used.

## RED → GREEN

The focused restart regression first failed because `bootRuntimeAt` did not
exist. GREEN reuses the first runtime's temporary JSON-storage home while
recreating the Cordis Host, generated Remote and Agent identity. It then proves
that the new Agent retrieves byte-for-byte equal R1 writing memory through both
the generated Remote and the native Tool while the stored provenance still
names the accepting Agent.

The first restart browser pass completed all programmatic retrieval assertions
but its temporary Playwright locator matched two equal Session titles. The
runner was narrowed to the first, newest tree row. A later retry exhausted the
replay provider's one recorded Session, so that replay process was stopped and
restarted before the accepted pass. Neither correction changed product source
or persisted Canon.

## Observed stock-Agent and visible flow

1. The seed Host at `127.0.0.1:55551` created Workspace
   `259513c5-a221-4bb8-ad0e-5647956d49a4` and Session
   `session-8146072d-76ab-438a-8f7b-a3def8993e59`, then accepted R1.
2. R1 contained the strict style, serialization and reader contracts, one
   accepted character carry-forward and character-arc hypothesis, one latest
   reader disclosure, one latest Chapter outcome, accepted narrative structure
   and a Chapter manuscript. Every section retained R1, Anchor ranges and the
   accepting Session provenance.
3. The stock Agent emitted exactly one native `retrieve_novel_context` call
   with `writingMemoryQuery: "旧潮声 灯塔 海门"` and omitted `chapterId`. It made
   no proposal or workflow call and completed normally.
4. The existing `conversation.view` visibly rendered all three contracts, the
   character arc, reader-known/reader-suspected disclosure and the Chapter
   outcome, plus the ranked Arc source. Renderer reload restored the same six
   sections and R1 manuscript.
5. After the seed Host stopped, the accepted restart Host at
   `127.0.0.1:53058` opened the same Project at R1 and created new Session
   `session-85491da4-635c-4bb4-a156-503486d0d7fb`.
6. That new Session made its own one native Tool call and returned the same
   Project, Workspace and revision. The character-arc provenance still named
   `session-8146072d-76ab-438a-8f7b-a3def8993e59`, proving that the renderer was
   showing the new post-restart result with the old accepted source rather than
   merely reopening the old Session result.
7. The six visible sections survived a second renderer reload. Accepted Canon
   remained R1 before Plan, after Plan and after reload in both phases.

## Evidence and shutdown

- seed phase: 15 direct RPC responses and 63 captured Web API responses, all
  successful; zero browser console messages, page errors and failed requests;
- restart phase: 14 direct RPC responses and 61 captured Web API responses, all
  successful; zero browser console messages, page errors and failed requests;
- each phase completed with one model Tool call, one native Tool call and one
  native Tool result; proposal calls/results and `tool-workflow/*` events were
  zero;
- the restart regression passed 1/1, the full Remote and Client gates passed
  117/117 and 40/40, and the five-file package gate passed 224/224;
- package typecheck, root lint, package build and package `pack --dry-run`
  passed; the dry-run listed only the 15 `novel-project` package files and did
  not create a tarball;
- `seed-host-writing-memory-panel-r1.png`,
  `seed-host-writing-memory-r1-reloaded.png`,
  `restart-host-writing-memory-panel-r1.png`,
  `restart-host-writing-memory-r1-reloaded.png`, both summaries, the replay
  fixture, runner and Playwright traces remain under the isolated root;
- `seed-summary.json` SHA-256:
  `841567985C22240B601D0A5F319D9416F7AF29291C163839644DFE4B9880A675`;
- `restart-summary.json` SHA-256:
  `3C4A941A28E122A5F8730605125EB26A5E839A281C98F2D84CFB8E840D6737C6`;
- accepted `lib/client.js` SHA-256:
  `0199BB2880A0674E6BA88F82E49F2D6575AB61BB26451934EC1063BE48AD793F`;
- after shutdown, the accepted seed/restart loopback ports `55551` and `53058`
  both had zero listeners.

## Claim boundary

This promotes only the fresh stock-Web no-`chapterId` path for all three strict
authoring contracts, the query-independent character arc, latest reader
disclosure, latest Chapter outcome, post-restart retrieval from a new Session
and renderer reload to `verified`. Character and relationship carry-forward,
knowledge boundaries, rolling-roadmap recall, hydrated exemplar/delivery
evidence, the accepted-`chapterId` control-pack branch, production installation
and user acceptance remain outside this run.
