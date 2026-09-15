# Strict emotion-state episode stock-Web E2E — 2026-09-03

## Scope

This run verifies the typed `emotion-state/episode` Result Packet boundary and
the existing `emotionCharacterId` / `emotionContinuity` projection in a fresh
stock DSH Web Profile. R1 and R2 track two event-derived emotional episodes for
`shen-yan`, including mixed emotions, appraisal, expression/suppression,
coping, residue, reactivation and downstream choices. The ledger excludes
another character and legacy free-form facts. Existing Tool, generated Remote,
`projectNarrative`, Canon selector and reload paths are reused.

This code increment adds a strict record-shaped episode schema branch to
[`result-packet-schema.ts`](../packages/novel-project/src/result-packet-schema.ts)
and a focused boundary regression in
[`novel-project-result-packet-remote.integration.spec.ts`](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts).
Primitive/array legacy values remain generic Canon facts; typed records must
retain the complete episode contract.

## RED → GREEN

The final controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-emotion-state-stock-web-red-final-20260903-01a05b3c`

It accepted valid R1, then submitted an R2 typed episode with
`downstreamChoices` omitted. The real review boundary rejected
`packet.deltas[0].value.downstreamChoices` (`expected array, received
undefined`); the accepted head stayed R1 and Canon/storage hashes were
byte-identical before and after:

- Canon:
  `430c83347a9ea30b7c28fda6c32fc1f8d96d918128b9362b6fe08e575d8c42ff`;
- storage:
  `501cb3b747a9c96056f52dafb2f091c64f16dc13fd862de7b7753a29d8fdc436`.

The RED Host was `http://127.0.0.1:64610`; it recorded 10 direct RPC and 22
browser-observed Web API responses with zero console, page or request failures.
Listener PID `5932` was stopped and the follow-up probe returned zero listeners.
The earlier pre-fix schema-gap run that accepted and then omitted the malformed
episode is retained in Temp only as diagnosis, not completion evidence.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-emotion-state-stock-web-green-final3-20260903-01a05b3c`

The stock Agent emitted exactly one native retrieval:

`{"revision":2,"compareRevision":1,"emotionCharacterId":"shen-yan"}`

The current ledger returned both valid episodes; historical R1 excluded R2,
the other character and legacy facts. Generated Remote and the native result
agreed, and the existing selector/ledger panel restored after renderer reload.

## Observed flow

1. A fresh Workspace and Standard Session accepted one R1 episode and one R2
   update for `shen-yan`, plus filtering fixtures for another character and
   legacy free-form emotion facts.
2. Current retrieval returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. Each episode retained trigger, object, appraisal,
   normalized mixed-emotion intensities, bodily expression, action tendency,
   expression, suppression, coping, residue, reactivated episode ids,
   downstream choices, story order/event/id, source ranges, Delta and
   provenance.
3. Historical R1 retrieval was `historical` and excluded R2-only data.
   Current/historical generated Remote and `projectNarrative` hierarchy reads
   retained their requested revisions. Retrieval created no proposal, workflow
   event or `novel/` Canon frame.
4. The existing Canon emotion selector and continuity ledger rendered both
   typed episodes without `[object Object]`; renderer reload restored the same
   source labels.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64613`; root/navigation HTTP status `200`.
- GREEN Workspace: `e9bf7100-ec34-4a02-92fa-6859ce1f4ad6`.
- GREEN Session: `session-636f4dc1-7870-4134-92ac-47984243408e`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal/workflow counts: `0 / 0`;
  the replayed turn ended `completed`.
- GREEN recorded 21 direct RPC and 89 browser-observed Web API responses with
  zero console, page or failed-request errors.
- Post-seed mux frames: `70`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `39b89725007dc90b66cb7270800e2dad13ab37bb211da772ea8272c1e9bb2623`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `84ca588607567cc23513fa467348bdf2c90cd14592691033815d5f8885ccdcc1`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- Built `packages/novel-project/lib/result-packet-schema.js` SHA-256:
  `D57A0DB48C0B783737F9BDCFF2790516386A957DDF451A0BA3978AB136D1B158`.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `4E8379034A1F282F544C7402FABB32960FA10D3EE480F56E660BA3E3DC280FFD` |
| GREEN `emotion-state-r2.png` | `1A2D45940AC11A09E292E473375EC09FB55C07D3A2B9303F023591DA6597ED54` |
| GREEN `emotion-state-r2-reloaded.png` | `1A2D45940AC11A09E292E473375EC09FB55C07D3A2B9303F023591DA6597ED54` |
| GREEN `emotion-state-stock-web-trace.zip` | `DA3A7B0CCB9A991DD93190F5D271DCA4619A14B9272BE984AE12C34C3541571A` |
| GREEN `session.jsonl` | `B1A06D614228D1E84D9A99CF757798295BE4FC23781D28C046B0EB2D3A3D3697` |
| RED `red-summary.json` | `FA844CBB1639449976EE8D877AB7682905B86E578145D0F947074E9C67760220` |
| RED `emotion-state-red-error.png` | `9D42287782E2A16D669C795B47C2F3435E8006153310752FF3C1C88B1E2A21EA` |
| RED `emotion-state-stock-web-trace.zip` | `45F1446671E630B1BBC0F242D7C8D25C5C417B5977D62B65BA3CECA2162A3159` |
| RED `session.jsonl` | `2741B2F2D7101B50EF81E8AFEDD9B58C252E2314396D4BE334B5B5B71A21522F` |

Both final Hosts were stopped; ports `64610–64613` had zero listeners/processes
and loopback probes were refused.

## Claim boundary

This promotes only the synthetic typed `emotion-state/episode` path: strict
missing-field rejection, current/historical `emotionCharacterId` retrieval,
character/legacy filtering, source/Delta/Anchor/provenance retention, generated
Remote and `projectNarrative` agreement, existing selector/ledger rendering and
reload, and unchanged Canon/storage. It does not promote semantic emotion
inference, broader character psychology, rollback-specific restoration,
process/transport recovery, production installation or user acceptance.
