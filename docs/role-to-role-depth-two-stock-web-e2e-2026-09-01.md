# Role-to-role depth-two stock-Web E2E — 2026-09-01

## Scope

This run verifies one DSH-native novel-role composition through the single
`@novel-agent/novel-project` plugin. A stock Standard parent starts an outer
one-shot child for `novel-architect`; that child reads accepted R1 and starts a
second one-shot child for `novel-prose-writer`, passing the explicit
`ARCHITECT_PLAN_R1` handoff. Both child sessions use the stock `subagent`
provider and the stock `skill` and `retrieve_novel_context` tools. No role
state, scheduler, workflow, proposal, or Canon mutation is added by the
composition.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build, and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-role-chain-green4-20260901-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-role-chain-red3-20260901-01a05b3c`

It changed only the inner native Skill name to `missing-role`. The real child
session reached the stock Skill loader and returned
`Error: skill "missing-role" is unknown or no longer available`; the focused
runner then failed at the canonical `novel-prose-writer` result assertion.

The GREEN fixture restored `novel-prose-writer` and passed the same runner. The
runner itself also checked the parent and both nested child histories, the
stock session catalog, and the ZIP returned by `session.export`.

## Observed flow

1. The Web Host created one Workspace and a Standard parent Session, then the
   runner accepted one world-rule Delta as R1 through the existing Result
   Packet review path.
2. The parent made one native foreground `subagent` call. Its prompt named
   `novel-architect`, required an R1 retrieval, and required the outer role to
   pass `ARCHITECT_PLAN_R1` to a `novel-prose-writer` child.
3. The outer child made exactly one native `skill({ name: "novel-architect" })`
   call and one `retrieve_novel_context({ revision: 1 })` call, then made one
   native foreground `subagent` call for the prose-writer role. The child
   prompt contained the exact handoff marker.
4. The inner child made exactly one native
   `skill({ name: "novel-prose-writer" })` call and one
   `retrieve_novel_context({ revision: 1 })` call, then returned
   `INNER_PROSE_R1`. The outer result contained
   `OUTER_ARCHITECT_GOT_INNER_R1`, and the parent completed with
   `ROLE_CHAIN_DONE_R1`.
5. `session.list` reported three distinct sessions with the durable links
   parent → outer → inner and `origin: "subagent"` on both children. The
   exported JSONL headers independently reported delegation depths 0, 1 and 2
   for the same links.
6. Both children were one-shot and inactive after settlement. The inner child
   had no descendants; the outer catalog row reported a descendant.

## Evidence and shutdown

- GREEN workspace: `259182e8-ad5e-4e06-b2ae-1429cf171122`.
- Parent Session: `session-efcd9a0b-e9ec-4f8c-a74d-08b9eb3af631`.
- Outer `novel-architect` child: `be4e4069-1aee-44d2-a7fc-4729676097a0`.
- Inner `novel-prose-writer` child: `cb152bd5-6364-4cfe-833c-265577d3197c`.
- The Host listened on `127.0.0.1:64142`; after PTY shutdown the port had zero
  listeners.
- The runner recorded 27 direct RPC responses and 23 browser-observed Web API
  responses. Every response was successful; browser console messages, page
  errors and failed requests were all zero.
- Canon stayed at accepted revision R1. The `novel_project.json` hash was
  identical before and after the role chain, and no post-seed `novel/` event
  frame appeared.
- The fresh Host served the stock Web root with HTTP `200`; a renderer reload
  completed without browser failures.

## Claim boundary

This promotes one real nested `novel-architect → novel-prose-writer`
foreground pairing through DSH's native subagent and message/result path. It
does not claim all role pairings, parallel sibling strategy, fault recovery,
continuable cross-Host/restart behavior for these roles, autonomous external
model role selection, external-model prose quality, production installation,
or user acceptance.
