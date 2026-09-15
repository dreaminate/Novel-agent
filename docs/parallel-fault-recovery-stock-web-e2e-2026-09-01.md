# Parallel role tool-failure isolation stock-Web E2E — 2026-09-01

## Scope

This run verifies the smallest parallel role path in the single
`@novel-agent/novel-project` plugin. One Standard parent emits two foreground
native `subagent` calls in the same assistant step. One child loads
`novel-architect` and retrieves accepted R1 successfully. The other child
attempts an unknown Skill (`missing-role`), receives the stock Skill-tool error,
and still settles its own turn. The parent receives both branch results and
completes. No novel-agent scheduler, retry service, branch store or Canon
mutation is involved.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-parallel-fault-green-20260901-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-parallel-fault-red5-20260901-01a05b3c`

It changed only the fault branch to a valid `novel-prose-writer` Skill. Both
parallel children then completed without a native Skill error, so the focused
runner failed its required failed-branch assertion.

The GREEN fixture restored `missing-role` for the fault branch and passed the
same runner. Replay child-script binding is first-call ordered, so the runner
classifies the two observed children by their actual Skill names rather than
assuming which parallel call wins the binding race.

## Observed flow

1. The Web Host created one Workspace and Standard parent Session, then the
   runner accepted one world-rule Delta as R1 through the existing Result
   Packet review path.
2. The parent emitted two `subagent` tool calls at one `(turn, step)` pair with
   `run_in_background: false`. The two child sessions were published and
   executed independently.
3. The successful child called native
   `skill({ name: "novel-architect" })`, received the canonical body, called
   `retrieve_novel_context({ revision: 1 })`, and returned
   `PARALLEL_SUCCESS_R1`.
4. The fault child called native `skill({ name: "missing-role" })`; the stock
   Tool result was marked `isError: true`. The child then completed with
   `PARALLEL_FAULT_HANDLED_R1`, and the parent completed with
   `PARALLEL_PARENT_DONE_R1`. One branch's tool failure therefore did not cancel
   or hide the sibling result.
5. `subagent.list` showed two one-shot children, both inactive. `session.list`
   linked both to the same parent with `origin: "subagent"`; the ZIP returned by
   `session.export?includeDescendants=true` showed header delegation depths 0
   and 1.

## Evidence and shutdown

- GREEN workspace: `a38849fd-164f-47c8-9541-3bb3bc31f60f`.
- Parent Session: `session-9912e8cb-789c-4a19-a512-c4b986657327`.
- Children: `b8694081-7dfb-4616-95e5-b7fe96b9a769` (`missing-role`) and
  `82343791-ec4c-45c6-9c12-b0465aac1299` (`novel-architect`).
- The Host listened on `127.0.0.1:64148`; after PTY shutdown the port had zero
  listeners.
- The runner recorded 24 direct RPC responses and 23 browser-observed Web API
  responses. Every response was successful; browser console messages, page
  errors and failed requests were all zero.
- Canon stayed at accepted revision R1. The `novel_project.json` hash was
  identical before and after the parallel run, and no post-seed `novel/` event
  frame appeared.
- The fresh Host served the stock Web root with HTTP `200`; a renderer reload
  completed without browser failures.

## Claim boundary

This promotes parallel sibling isolation for a native Skill-tool error and
normal parent completion. It does not prove process/transport crash recovery,
retry or cancellation semantics, all parallel role pairings, continuable
parallel children, cross-Host continuation for these roles, autonomous external
model selection, external-model prose quality, production installation or user
acceptance.
