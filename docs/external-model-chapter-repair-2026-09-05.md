# Real-model Chapter repair and writing-memory UI recovery — 2026-09-05

Status: the first manuscript has been accepted; complete ten-Chapter acceptance
remains open. This record uses actual CLIProxyAPI model calls, not replay output.

2026-09-07 correction: the five accepted manuscripts below prove transaction
progress, not five quality-approved chapters. Current-data review found in-prose
chapter metadata, an inconsistent clue and unsupported debt references.
[The quality audit](accepted-chapter-quality-audit-2026-09-07.md) supersedes broad
quality claims and records the actual R19/R20 Chapter 2 repair. Earlier revisions
and their measured lengths remain historical evidence.

## Runtime and scope

The existing isolated rc.2 Web Profile was restored from
`C:\Users\33166\AppData\Local\Temp\novel-external-chapter-green-20260903-01a05b3c`.
It mounts `dsh-base`, `dsh-web-app` and the single local `novel-project` plugin.
The repository CLI reports `0.1.1-rc.2`. Its model selection uses the existing
`cliproxy/gpt-5.6-sol` route with `low` reasoning, resolving a configured
credential through the DSH Credentials provider. No credential value is part of
the evidence files. The model route returned `MODEL_ROUTE_OK` in a real turn.

Project Workspace: `4096c460-e003-473f-8528-ed1d5092fe3d`.
Planning Session: `session-7fe010b6-60ef-4c5d-9036-92c3c9837b5d`.
Separate writing Session: `session-80d0063d-4972-4ec6-9e34-f5cf0cca2b76`.

## Observed failures and changes

The earlier writing turn ended with a durable `QUOTA` error after its runner
had timed out. Its rejected manuscript had 3,029 non-whitespace characters.
The invalid proposal used invented `chapterContract` field names. The new
writer instructions reuse the architect's parser-valid Chapter example and
describe contract acceptance before Write, with post-check after manuscript
acceptance. The loader regression parses the shared example with the production
schema. A real Agent subsequently submitted a valid corrected proposal while
preserving the original prose.

The subsequent writing Session exposed a second failure: DSH had truncated the
large rendered retrieval text, and `latestWritingMemoryResult` attempted to
parse that preview as complete JSON. Selecting Novel Project crashed its Slot.
The panel now selects the latest successful writing-memory call and repeats its
original revision-bound query through the existing read-only `retrieve` Remote.
It no longer parses the model-facing retrieval preview. Focused inline and
spilled-output cases verify complete source-bearing memory and the exact query.

Implementation: [writer Skill](../packages/novel-project/src/index.ts),
[panel](../packages/novel-project/src/client/NovelProjectPanel.tsx).
Tests: [native loader](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts),
[client](../packages/novel-project/tests/novel-project-client.spec.ts).

## First-Chapter flow

1. The Agent proposed the Chapter plan separately. Author review in the actual
   panel accepted it as R2; `projectManuscripts(2)` remained empty.
2. A new DSH Session loaded the writer Skill, retrieved the accepted R2 Chapter
   contract, and submitted a successful manuscript-only proposal. Its turn ended
   `completed`, with exactly Skill, Retrieve and Propose native Tool calls.
3. Independent continuity review found the original draft conflated a maintenance
   sluice with the still-closed tidal gate. The model revised the text to identify
   the maintenance sluice and outer gallery, retaining the nine-bell gate rule.
4. The revised model draft had 3,109 non-whitespace characters. Author editing
   removed one 22-character nonessential sentence and generated a fresh unified
   Diff. The final manuscript has 3,087 visible characters. The packet explicitly
   records `producer: author-review`; it is not mislabelled as unedited model output.
5. After the UI fix, the previously crashing Session opened successfully. The
   actual Review packet / Accept all items / Apply Result Packet Review controls
   accepted `chapter-1-author-length-review-r2` as R3. Renderer reload showed the
   R3 manuscript and reconstructed historical R2 writing memory without browser
   errors. The original and edited proposals are preserved separately.

## Second-Chapter staged continuation

Using the same isolated Profile and Workspace, a new architect Session started
from accepted R4 and produced a Chapter 2 Plan packet (chapter-2-unit-plan-r4)
with the nested Chapter contract. The author review transaction accepted that
plan as R5. A separate writing Session then loaded the R5 contract with
chapterId "chapter-2" and produced chapter-2-write-r5-retry; after one
schema-rejected draft (missing manuscriptDiff and an invalid anchor hash), the
corrected packet was accepted as R6. Its manuscript is 2,930 non-whitespace
visible characters, 3,048 raw characters, and has SHA-256
d381507c7ba0bc8e68403418956afff8dedfb9b6e0eebb6fd686ae9bcbd2b0dc.

The same writing Session then loaded R6 and proposed the complete
chapter-state/post-check packet. Two malformed attempts were rejected (one
model-shaped Delta and one Delta carrying packet metadata); the corrected
chapter-2-post-check-r6-corrected was accepted as R7 with source anchor
chapter-2-accepted-prose-r6. A follow-up provenance-only post-check at R8
corrected that anchor's full-text range to start 0, end 3048 (the accepted
manuscript length), keeping the same hash and post-check value. A fresh
stock-Web panel read of the exact Chapter 2 Session after reload rendered
Novel state · R8, the Chapter 2 manuscript,
historical writing memory, and the post-check without console, page, or request
failures. This is bounded real-model/API acceptance plus post-accept UI
evidence; it does not claim pending-packet UI Apply was captured for every
Chapter 2 stage.

## Third-Chapter staged continuation

After restarting the same isolated Host with the existing sol route, an
architect Session proposed and the author accepted Chapter 3's contract as R9.
A new writing Session generated a valid 3,002-visible-character manuscript and
the author accepted it as R10 after two length/schema correction attempts. The
writing-memory organizer then proposed the Chapter 3 post-check, accepted as
R11; a provenance-only author correction changed its reused source hash to the
actual R10 manuscript SHA-256, producing R12 without changing prose or memory
fields. The compact record is
.novel-agent/acceptance/2026-09-05/chapter-3-summary.json.

The R12 stock-Web reload rendered the Chapter 3 manuscript, current revision and
historical writing memory without browser failures. Three chapter paths now have
real model Skill→Retrieve→Propose evidence, but Chapters 4–10, full ten-Chapter
quality/length acceptance, existing-novel takeover, production and user
acceptance remain open.

## Fourth-Chapter staged continuation

The same Profile accepted a Chapter 4 contract as R13. The model produced
2,588, then 2,795, then 3,132 visible characters; an author length edit removed
one redundant re-introduction paragraph and accepted the 3,005-character,
3,107-raw manuscript as R14. The post-check first lacked Delta sourceAnchorIds;
the corrected packet was accepted as R15 with a full Chapter 4 Anchor and the
actual manuscript SHA-256. The exact record is
.novel-agent/acceptance/2026-09-05/chapter-4-summary.json.

An exact Chapter 4 Session reload in stock Web rendered Novel state R15,
current writing memory and the manuscript with zero browser failures. This
adds a fourth real model chapter path; Chapters 5–10, the full 29,000–31,000
character acceptance, existing-novel takeover, production and user acceptance
remain open.

## Fifth-Chapter staged continuation

After the same Profile restarted, Chapter 5's Plan packet was accepted as R16.
The model Write draft first measured 2,257 visible characters, then 3,166;
author length review removed one redundant paragraph and two filler characters,
accepting a 3,100-visible-character, 3,224-raw manuscript as R17. Its
post-check was accepted as R18 with a full-text Anchor and the actual SHA-256.
The compact record is
.novel-agent/acceptance/2026-09-06/chapter-5-summary.json.

An exact Chapter 5 Session reload in stock Web rendered Novel state R18,
current writing memory and the manuscript without browser failures. Chapters
6–10, the full 29,000–31,000 character acceptance, existing-novel takeover,
production and user acceptance remain open.

## Local evidence and remaining acceptance

Generated evidence is retained under
`.novel-agent/acceptance/2026-09-05/`: rejected and corrected proposals,
the independent plan and its acceptance, the model's formal Write proposal,
the author-reviewed packet, `chapter-1.md`, the R3 acceptance receipt and
`manuscript-r3.png`. This directory is ignored runtime evidence, not a second
Canon source; accepted DSH storage remains authoritative.

The accepted post-check then survived a fresh Host lifetime. A new DSH Session
called the same read-only retrieval Tool at R4 and returned Lin Zhao's hand and
shoulder injuries, Xiao-Man's outer-gallery location, the still-closed tidal
gate and `sourceRevision: 4`. The first attempt ended with a provider stream
disconnect; the retry completed with native Skill + Retrieve calls and no Canon
mutation. The compact evidence is in
`.novel-agent/acceptance/2026-09-05/cross-session-recall-summary.json`.

Chapters 6–10, complete character/world setup, existing-novel takeover of the
final original manuscript, full quality acceptance and production/user
acceptance are not established by these four chapter paths.
