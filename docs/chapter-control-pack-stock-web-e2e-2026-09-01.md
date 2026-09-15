# Chapter control-pack retrieval stock-Web E2E — 2026-09-01

## Scope

This run verifies the accepted-`chapterId` writing-memory path in the single
`@novel-agent/novel-project` plugin. A Standard stock Agent retrieves one
accepted Chapter at R1 with `chapterId` and `writingMemoryQuery`; the result
contains the revision-bound Chapter control pack and keeps the top-level
`writingMemory.narrativeUnits` bucket empty because the pack owns that
structure. The existing `conversation.view` builder then requests the same
pack and renders the accepted Chapter contract. Retrieval remains read-only.

The run used DSH `0.1.1-rc.2`, a fresh stock Web Profile, the current local
`novel-project` build and the official replay provider under:

`C:\Users\33166\AppData\Local\Temp\novel-control-pack-green3-20260901-01a05b3c`

The Profile installed only the linked `@novel-agent/novel-project` and the
temporary `@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture dependency. The
user-global `.dsh` was not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-control-pack-red-20260901-01a05b3c`

It omitted only `chapterId` from the replayed native retrieval call. The real
Tool result consequently had no `controlPack`, and the focused runner failed
when it tried to read `retrieval.controlPack.chapter`.

The GREEN fixture restored `chapterId: "chapter-control"` and passed the same
runner. After a renderer reload, the runner selected the persisted Session,
clicked the existing `Build Chapter control pack` button, and verified the
visible result in the existing panel.

## Observed flow

1. The Web Host created one Workspace and Standard Session. The runner
   accepted a manuscript plus Book → Volume → Arc → Chapter narrative units as
   R1 through the existing Result Packet review transaction. The Chapter unit
   carried a complete accepted Chapter contract with a 2900–3100 length range.
2. The stock Agent made exactly one native
   `retrieve_novel_context({ revision: 1, chapterId: "chapter-control",
   writingMemoryQuery: "第二道锁 灯塔" })` call and completed normally. No
   proposal or workflow call occurred.
3. The Tool returned `controlPack.chapter.id = "chapter-control"`, the full
   root-to-Chapter scope, the accepted contract and `freshness: "current"`;
   `writingMemory.narrativeUnits` was an empty array.
4. The existing panel's control-pack builder re-read the same accepted R1 and
   rendered `Chapter control pack · R1 · current`, the Chapter objective and
   the accepted style constraint `短句推进压力`.

## Evidence and shutdown

- GREEN Workspace: `bb7d9552-f78e-4f5a-a2fe-eae17fbed2d1`.
- Session: `session-3f6da3e4-6789-4876-bb60-1c8639aa2bfd`.
- The run recorded 13 direct RPC responses and 59 browser-observed Web API
  responses. Every response was successful; browser console messages, page
  errors and failed requests were all zero.
- Canon stayed at accepted revision R1. The `novel_project.json` hash was
  unchanged after retrieval and panel rebuild, and no `novel/` event frame was
  emitted.
- The fresh Host served the stock Web root with HTTP `200`; after PTY shutdown
  port `64152` had zero listeners.

## Claim boundary

This promotes the fresh stock-Web accepted-`chapterId` control-pack retrieval
and existing-panel builder path. It does not promote the no-`chapterId` path's
remaining writing-memory branches, external-model drafting quality,
cross-Host continuation for this branch, production installation or user
acceptance.
