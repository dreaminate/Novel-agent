# Accepted-revision Chapter control-pack proof — 2026-08-28

## Scope

This increment extends the existing read-only `retrieve_novel_context` Tool in
the single `@novel-agent/novel-project` plugin. Supplying the optional
`chapterId` rebuilds a `controlPack` from the requested accepted revision for
Ask or Plan. Omitting `chapterId` preserves the existing retrieval result.

No second Tool, UI, Better Sidebar tab, Pi TUI extension, adapter, Profile,
Bundle, cache, Job or persistent fact source was added. Necessary author-facing
decisions remain in the existing `conversation.view` Novel Project panel.

## RED

The focused domain test first failed before product code changed because the
strict existing retrieval schema rejected the new input:

```text
Unrecognized key: "chapterId"
```

GREEN added the optional request field and optional response value to the same
retrieval contract.

## Accepted-revision projection

For one accepted Chapter, the control pack is rebuilt directly from the
requested revision and contains:

- the target Chapter and its accepted root-to-Chapter scope;
- Canon facts whose target belongs to that scope;
- all ten narrative-clock buckets, filtered to the same scope;
- up to nine preceding accepted Chapter manuscripts in accepted hierarchy
  order;
- the original source revisions, anchors and provenance already carried by
  those accepted projections.

The focused proof accepts R1 with Chapters 1–3, an R1 Chapter-3 location, plot
movement, promise debt and Chapter-1 manuscript. It then accepts R2 with an
updated Chapter-3 location/plot state and a Chapter-2 manuscript. The R2 pack
contains the R2 facts and both preceding manuscripts with their true R1/R2
source revisions. Re-reading R1 after R2 reconstructs the original R1 pack and
marks it `historical`; the current R2 pack is marked `current`.

The pack is deep-frozen before it leaves the service. It is not cached and
never advances Canon.

## Real DSH Tool integration

The Remote integration boots the real DSH `0.1.1-rc.2` Tool Runtime, storage,
Workspace, generated Remote and `novel-project` service. A normal Agent owner
calls the existing `retrieve_novel_context` Tool with
`{ revision: 1, chapterId: "chapter-2" }`. The Tool resolves the calling
Agent's Workspace, returns the Chapter scope and preceding R1 manuscript as
normal JSON text, and leaves the accepted head at R1.

## Fresh rc.2 Profile load

The current package was installed alone into a new temporary Web Profile rooted
at:

`C:\Users\33166\AppData\Local\Temp\novel-agent-control-pack-rc2-1787921608955`

The repository-installed DSH CLI reported `0.1.1-rc.2`.
`dsh plugin --profile web add <current novel-project>` completed with Profile
pnpm `11.19.0`, and `--dump-config` exited `0` with one
`@novel-agent/novel-project` row. The real Host then started at
`127.0.0.1:53603`; `/` returned HTTP `200` and 14,788 bytes, while
`/plugins/@novel-agent/novel-project/client.js` returned HTTP `200` and 270,122
bytes.

The user's global `.dsh` was not used. The Host was stopped after the probes;
the port had zero listeners and a follow-up loopback request was refused.

## Verification

- focused accepted-revision rebuild test: passed;
- existing real DSH retrieval-Tool integration: passed;
- package and root suite: 5 files, 88 tests passed;
- root typecheck: passed;
- root lint with warnings denied: passed;
- root build: passed; the client bundle detected only `zod`;
- single-package dry-run: passed and listed only the existing
  `@novel-agent/novel-project` payload;
- fresh rc.2 Web Profile add/config/load and both HTTP probes: passed;
- independent read-only review found no normal-path defect; its two focused
  Vitest reruns passed.

## Claim boundary

This verifies deterministic Chapter control-pack reconstruction through the
existing read-only retrieval Tool and a current isolated rc.2 package load. It
does not claim that a live model has already selected `chapterId` in a visible
stock-Agent Plan turn, nor production installation or user acceptance.
