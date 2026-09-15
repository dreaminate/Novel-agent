# Implementation Plan: novel-agent on DSH

## 1. Objective

Implement the complete novel-agent feature set on DSH `0.1.1-rc.2` while
reusing the community Desktop and community plugins for every mature generic
surface. Novel-agent owns novel-domain behavior and only the necessary UI inside
its domain plugin.

Functionality comes first. Additional hardening, old carrier repair and generic
infrastructure work do not precede visible novel features unless the current
slice crosses a real trust boundary.

## 2. Product boundary

```text
DSH / Community DSH Desktop
  └─ user-selected Profile
      ├─ user-installed community plugins
      │   ├─ Better Sidebar (Web workbench + terminal)
      │   ├─ Browser + Search Pro + File Upload
      │   ├─ Pi TUI
      │   └─ optional Git Worktree
      └─ independently installed novel-agent plugin
          └─ novel-project (domain core + necessary novel UI)
```

- No novel-agent Electron app, transport, Profile manager, aggregate Bundle
  wrapper, installer, terminal, generic Workbench, browser or complete TUI.
- The single novel package self-mounts only its own Cordis entry.
- `novel-project` is the one Canon/revision authority.
- Its stock DSH `conversation.view` contribution is the necessary novel UI.
- There is no Better Sidebar adapter or Pi TUI extension merely for duplicate
  status display.
- Community plugin versions and installation commands are explicit in README;
  novel-agent does not silently bundle them.

## 3. Execution phases

### A — Remove duplicate generic implementations

Delete the retired local Desktop route, aggregate Profile wrapper and local
terminal implementation. Remove their active tests, root build references and
dependencies. Preserve historical smoke only as explicitly superseded evidence.

Exit criteria:

- workspace discovery contains only `novel-project` plus the root project;
- no current manifest, test command or architecture row invokes the retired
  packages;
- lockfile no longer retains dependencies used only by those packages.

### B — Keep the novel plugin independently installable

Keep `novel-project` on its own minimal DSH bundle patch. The patch mounts only
that package; it cannot mount community dependencies or construct a product
Profile.

Exit criteria:

- focused RED proves the missing install contract;
- manifest, packaged files and patch agree;
- real isolated `dsh plugin --profile ... add ...` and load smoke succeeds with
  the selected Web or TUI community surface before marking a composition
  verified.

### C — Implement novel-domain capabilities

Continue inside `novel-project` and reuse its accepted Result Packet/revision
path. Current order:

1. Series/Book/Volume/Arc/Chapter/Scene/Beat/Prose hierarchy and ten narrative
   clock projections from accepted deltas, with deterministic rollback.
2. Revision-aware retrieval, freshness invalidation, source anchors and
   provenance, plus the derived pair-keyed relationship projection.
3. Ask/Plan/Write/Review/Accept/Publish definitions on the stock DSH workflow
   engine.
4. Story-world and reader-response `SimulationRun` sandboxes that read a frozen
   accepted revision and emit proposals only.
5. TXT/Markdown, then EPUB/DOCX import/export with accepted-revision round trips.

Keep every novel-domain capability and necessary UI inside `novel-project`.
A community extension surface is not a reason to add another package or
adapter; generic capability stays a separately installed download.

### D — Maintain only necessary domain UI

- `novel-project` renders Result Packet review, accepted revisions, rollback and
  Canon through the stock DSH `conversation.view` Slot.
- Better Sidebar and Pi TUI are installed and used unchanged. A second Canon
  tab or status footer is not a necessary authoring surface.
- Generic capabilities remain visible through their upstream plugins. If an
  upstream plugin already supplies the screen and interaction, documentation
  names the required download instead of implementing another screen.

### E — Validate actual combinations

Use a fresh temporary `DSH_HOME` and Profile for every compatibility smoke.
Order:

1. Stock Web + novel-project, then Better Sidebar alongside it.
2. Pi TUI + novel-project, without a local TUI adapter.
3. Browser + Search Pro.
4. File Upload with a novel-domain import transaction.
5. Optional Git Worktree in a development-only Profile.

Current evidence for steps 1–2 is deliberately narrow. A fresh isolated Web
Profile resolved `novel-project` beside Better Sidebar, started the loopback
Host, returned HTTP `200` for the root page and both client artifacts, and shut
down cleanly. A fresh isolated Pi TUI Profile resolved `novel-project` beside
Pi TUI and displayed the input-ready main shell after the user Profile mounted
the four official DSH storage/workspace providers. This verifies composition
and startup only; Better Sidebar's complete Files/terminal/Git/Diff interaction
and Pi TUI's novel-specific review/accept flow remain separate visible smokes.

Do not start the user's default Desktop or modify global `.dsh`. A package README,
peer range, unit test or former implementation smoke cannot substitute for a
real current combination load.

## 4. Status model

- `not-started`: no implementation evidence.
- `researching`: the upstream or domain contract is being checked.
- `red`: a focused test demonstrates the missing behavior.
- `implemented-unverified`: code exists but current runtime evidence is absent.
- `verified`: implementation, tests and the required runtime scope have current
  evidence.
- `blocked`: a concrete external condition prevents progress.

## Definition of Done for a slice

### Behavior

- The slice provides a real novel-authoring outcome or a necessary domain view.
- Generic behavior comes from an installed DSH/community plugin.
- Canon and durable decisions use the existing accepted revision path; no UI or
  third-party store becomes authoritative.

### Verification

- A focused test fails for the intended gap, then passes with the smallest
  implementation.
- Applicable package tests, root tests, typecheck, lint and build pass.
- Cross-plugin behavior remains `implemented-unverified` until an isolated real
  Profile load/UI/TUI smoke succeeds.

### Handoff

- README names every required community download and exact version; no local
  manifest silently pulls in a generic UI plugin.
- Architecture, task list, parity matrix and upstream records describe the
  current composition rather than a removed implementation.
- `git diff --check`, relevant diff and `git status --short` are reviewed.
- Commit, push, release, deploy and production activation remain unrequested.
