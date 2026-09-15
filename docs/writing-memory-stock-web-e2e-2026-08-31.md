# Writing-memory stock-Web E2E — 2026-08-31

## Scope

This run verifies the current writing-memory path in the single
`@novel-agent/novel-project` plugin. A stock DSH Agent calls the existing
`retrieve_novel_context` Tool with `writingMemoryQuery` and no `chapterId` for a
not-yet-accepted next Chapter. The result ranks accepted narrative structure,
and the existing `conversation.view` renders that source-bearing memory without
adding a Tool, page, Profile, Bundle, Sidebar tab or TUI extension.

The accepted run used DSH `0.1.1-rc.2`, the stock Web `standard` preset, the
current local `novel-project` build and the official replay provider in a new
temporary Profile rooted at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-writing-memory-stock-web-f2d6042030d8432ca039fe34c3882c86\attempt-2-d977fff583c14bf89437fe60b0ffd6f6`

The user's global `.dsh` was not used.

## RED → GREEN

The focused Remote RED failed because `writingMemory.narrativeUnits` did not
exist. The focused Client RED failed because the Novel Project panel rendered no
accepted narrative structure. GREEN reuses the existing MiniSearch/Jieba
ranking and accepted-revision narrative projection:

- without `chapterId`, at most three accepted units are ranked from id, level,
  parent, objective, entry/exit state, status and optional Chapter contract;
- every hit retains score, matched terms, source revision, Anchor ranges and
  provenance;
- with an accepted `chapterId`, the bucket is empty because the existing Chapter
  control pack already owns that structure;
- no Canon, narrative or manuscript fact is written by retrieval.

The same slice also keeps strict style, serialization and reader profiles in
`authoringContracts` independently of query terms. Their Host/generated-Remote
and Client paths are covered by the local integration suite; this Web fixture
intentionally contained no accepted authoring contracts.

## Observed stock-Agent and visible flow

1. A fresh Workspace and standard Session accepted R1 with Book, Volume, Arc
   and Chapter units plus one manuscript and story-event fact.
2. The replay model emitted exactly one native `retrieve_novel_context` call
   with `{ revision: 1, writingMemoryQuery: "旧潮声 灯塔 海门" }` and omitted
   `chapterId`.
3. The Tool returned current R1 writing memory with three ranked narrative
   units and no `controlPack`. The Arc hit retained objective
   `登上灯塔并确认海门信号`, entry `旧潮声初现`, exit `海门信号确认`, R1,
   `anchor-plan-r1` and the accepting Session provenance.
4. The model's final Plan reused that returned objective and entry/exit state.
5. The existing Novel Project tab visibly rendered `Writing memory · R1 ·
   current` and the Arc, Volume and Chapter rows with score, terms, source ranges
   and provenance.
6. Renderer reload restored the same Arc row from the native Session Tool
   Result.
7. No `propose_novel_result_packet` call, Result Packet review or workflow event
   occurred. Accepted Canon remained R1 before Plan, after Plan and after reload.

The accepted Session was
`session-edec5390-4115-4315-b9e7-733cec70618f` in Workspace
`29c11c8f-9892-430b-8801-4f90e74467cb`.

## Evidence and shutdown

- 15 direct RPC responses, all HTTP `200`;
- 64 captured Web API responses, all below HTTP `400`;
- zero browser console warnings/errors, page errors and failed requests;
- completed turn with one model Tool call, one native Tool call and one native
  Tool result;
- zero proposal calls/results and zero `tool-workflow/*` events;
- `writing-memory-panel-r1.png`, `writing-memory-plan-answer-r1.png`,
  `writing-memory-r1-reloaded.png`, the replay fixture, runner, summary and
  Playwright trace are retained under the accepted temporary root;
- summary SHA-256:
  `A2732B39542944F754870AE0F4090433C966C8DBBE64D94DE3844BBECCE236F4`;
- accepted `lib/client.js` SHA-256:
  `12A55689377D4D7022860455DC3117B3BAD732BF04AC7D0C79D0A446E86BFFC4`;
- after shutdown, loopback port `58207` had zero listeners.

The first isolated attempt stopped before R1 because the temporary seed omitted
the now-required explicit manuscript decision. Only the temporary runner was
corrected; the accepted evidence comes from the completely new Profile above,
and no product source changed to obtain the Web GREEN.

## Claim boundary

This verifies the normal no-`chapterId` Plan retrieval and visible
`narrativeUnits` memory path in a fresh stock Web Profile. Historical-revision
isolation, mandatory authoring-contract delivery, Review injection and the
accepted-`chapterId` empty-bucket/control-pack branch remain covered by local
Host/generated-Remote/Client tests. A fresh visible run containing all three
strict authoring contracts, production installation and user acceptance remain
unverified.
