# Execution checklist

## Front-end Phase 2 polish — I-P6, 2026-09-19

**Work order of record:** [`frontend-polish-handoff-2026-09-19.md`](frontend-polish-handoff-2026-09-19.md) §I-P6 (A12).

- [x] **One token sheet, and it is enforced.** `novel-workbench-tokens.spec.ts` reads every `*.tsx` in the client,
      strips comments, and fails on any colour written as a value. It found one on its first run:
      `ProposalReviewView.tsx` set `color: #fff` on the primary button while the prototype's `.btn.primary` used
      `hsl(var(--on-accent))` — the same accent with two different foreground decisions in one product, and the
      white one had about 3:1 contrast where the token gives about 7:1. Now the token.
- [x] **The one exception is named, not excused.** `StoryMapView.tsx` draws Canon's factions, and a faction's
      colour belongs to the faction; the allowed set is a one-line constant with the benchmark file cited beside it.
- [x] **Type and spacing hold the same line.** The spec also pins the font, size, spacing, radius, shadow and
      timing tokens, so a future surface cannot quietly invent its own.
- [x] **Whole-page evidence, in both themes.** `probe-i-p5-rest.mjs` captures `i-p6-whole-day.png` and
      `i-p6-whole-night.png`; the night frame reports `data-nw-theme="night"` and the sweep restores 跟随系统.

## Front-end Phase 2 polish — I-P5c / I-P5e / I-P5f / I-P5g, 2026-09-19

- [x] **I-P5c landing → Heptabase.** The ways in were a sentence with three rows under it and a button below that —
      a table of contents, leaving the author to find where the doing was. They are a card grid now, and the plan
      action is a card in the same grid (dashed edge, not a different shape).
- [x] **I-P5e cast → Notion.** Each card's facts were three loose sentences with no alignment; comparing two people
      meant reading both cards in full. They are property rows now, keys in their own column — measured live: keys
      at x=265, values at x=301, all rows sharing the column.
- [x] **I-P5f memory → Obsidian backlinks.** Cards became a dense reverse timeline with the origin and revision as
      chips, newest first, and the `mem-band` bar is gone — its width was `revision / acceptedRevision`, which is
      not a proportion of anything, and in a list already ordered newest-first the order *is* the recency. Removed
      from the prototype too, demo code included.
- [x] **I-P5g advanced → VSCode settings.json.** The raw projection sits on a code surface with a ceiling and a
      scrollbar, wraps at boundaries instead of `break-all` (which split `character-state` across two lines), and
      names the product's `--font-mono` token instead of its own font stack.
- [x] **Evidence.** `probe-i-p5-rest.mjs` + five screenshots + summary on the isolated Host, 0 console errors; four
      benchmark files under `docs/evidence/2026-09-19/benchmarks/`. 534 tests, typecheck/lint clean.
- **Parity matrix** updated in this pass, as promised at I-P5a.

## Blocked items cleared — 人物措辞 + 草稿残留, 2026-09-19

Two things the Phase 2 polish could not do on its own authority, cleared after the user said to.

- [x] **人物不再拿实体 id 当名字。** This work's Canon carries no `name` aspect for anyone, so the data face fell
      back to the entity id and every card was titled `guchen`. A slug where a name belongs reads as though the
      tool believed it *was* the name. The cast card, the 人物档案 and the map's selection readout now say
      **未命名人物** and keep the id beside it as a tag, so seven unnamed characters are still seven
      distinguishable cards. The map's *node* labels stay ids on purpose — on a graph a label's job is to tell
      one node from another, and seven nodes reading 未命名人物 would tell the author nothing.
- [x] **The gap can now close, without touching Canon.** `refineRequest` asks the organizer to add a `name`
      aspect for each character named in the chapter. Its output is a proposal the author accepts item by item,
      so this is the proposal path, not a Canon-semantics change — the root fix in the organizer contract is
      still D6's to decide.
- [x] **A layout regression the screenshot caught.** The first cut squeezed 未命名人物 into a one-character-wide
      vertical column behind three chips. No jsdom assertion could see it; the real-machine screenshot showed it
      immediately. The chips now wrap and the name does not.
- [x] **草稿残留已清。** `第1章《开篇章》.草稿.md` (54 B, entirely probe typing — `测测试试夜里风大…`) is removed. The
      chapter now opens blank: verified on a real Host, `chars 0`, empty surface, and opening an empty chapter
      does not write the file back. Full before/after in
      [`docs/evidence/2026-09-19/draft-hygiene-2026-09-19.json`](docs/evidence/2026-09-19/draft-hygiene-2026-09-19.json),
      with the exact bytes recorded so it is recoverable.
- [x] **Blast radius checked, not assumed.** Every other file in the workdir is byte-identical (sha256 diff of
      all `.md`); the author's Canon was read but not written; and all six of Canon's `pendingProposals` were
      checked for the residue — none has it. Two packet.json files under the author's own
      `.novel-project-proposal/` scratch dir do contain it; they are the author's own tooling output, the
      product does not read that directory, and so they were reported rather than touched.
- **Evidence.** `probe-naming.mjs` + three screenshots + summary; `probe-draft-hygiene.mjs` + screenshot +
  summary; 514 tests, typecheck/lint clean.

## Front-end Phase 2 polish — I-P5b, 2026-09-19

**Work order of record:** [`frontend-polish-handoff-2026-09-19.md`](frontend-polish-handoff-2026-09-19.md) §I-P5b (settings → macOS System Settings).

- [x] **One grouped pane, nine rows.** The nine settings were loose blocks with the label stacked above its
      control — a form, not a settings pane, with no column for the eye to run down. They are one rounded
      container now, hairline-ruled between rows, label on the leading edge and control on the trailing one,
      the explanation under the label. Nine rows fit on one screen, up from about seven.
- [x] **The markup did not change.** The arrangement is CSS grid (`"label control" / "note ."`), so every
      selector the specs and the sweep reach for still resolves.
- [x] **The geometry check earned its keep.** The first grid put the control across both rows, so a row whose
      explanation runs three lines pushed its switch *below its own label* — invisible to a CSS-text assertion,
      caught immediately by measuring bounding boxes. The probe now asserts, per row, that the control sits to
      the right of its label in the same line and the note begins below it: 9/9.
- [x] **Evidence.** `probe-i-p5b-settings.mjs` + screenshot + summary on the isolated Host, 0 console errors;
      `macos-settings-pane-params.json` records the benchmark.
- [ ] **Next: I-P5c** — landing to the Heptabase welcome benchmark.

## Front-end Phase 2 polish — I-P5a, 2026-09-19

**Work order of record:** [`frontend-polish-handoff-2026-09-19.md`](frontend-polish-handoff-2026-09-19.md) §I-P5a (topbar → Linear).

- [x] **One theme control, not three.** The bar spent its widest slot on a three-button theme segment.
      It is one button now whose own text is the mode it is in, cycling 跟随系统 → 日间 → 夜间 → 跟随系统;
      `title`/`aria-label` say what the next press does. Measured on a real Host: the cycle repaints the
      frame at every step (`auto` → `day` → `night` → `auto`).
- [x] **One loud thing.** The revision badge wore the accent — the same orange as the bar's primary action —
      so two elements competed for one glance. It is a neutral chip now (`--bg-300` / `--text-200` /
      `--border-100`). The status line dropped 13px → 12px to read as metadata.
- [x] **进阶 kept, deliberately.** The rail foot has the same switch and the sweep drives that one, but
      `.rail-foot .lbl` is hidden at ≤1280, so the bar's copy is the only labelled one in a narrow window.
      Five controls, no segmented group.
- [x] **Changed through the prototype**, as the design-source rule requires: the topbar rules were edited in
      `novel-mode-workbench.html` and `port-prototype-css.mjs` regenerated `workbench-css.ts` (`--check` passes).
- [x] **Evidence.** `probe-i-p5a-topbar.mjs` + day/night screenshots + summary on the isolated Host, 0 console
      errors; `linear-topbar-params.json` records the benchmark (Linear's app needs a login and has no public
      demo, so the params are its documented design language — the same honest deviation I-P1 and I-P3 took).
- [ ] **Next: I-P5b** — settings to the macOS System Settings benchmark.
- [ ] **Parity matrix**: the Phase 2 rows are being updated in one pass at I-P6 rather than seven times.

## Front-end Phase 2 polish — I-P4, 2026-09-19

**Work order of record:** [`frontend-polish-handoff-2026-09-19.md`](frontend-polish-handoff-2026-09-19.md) §I-P4 (A10).

- [x] **Gate checked before starting.** 499 tests / typecheck 0 / lint 0 / `lib/client.js` 1,685,186 B /
      host 401 all green; I-W1 (`canvas-boundary.tsx`), I-X1 (`NovelLanding.tsx`) and R1 are in the tree.
      I-P1 (forceatlas2 + Obsidian palette), I-P2 (iA Writer surface) and I-P3 (Things 3 rail) were already
      implemented and their probes are in `docs/evidence/2026-09-19/walkthrough/`.
- [x] **shadcn/ui evaluated, and not taken verbatim.** It is copy-paste Tailwind over Radix primitives, and
      this tree has no Tailwind — the workbench draws from one ported token sheet. The behaviour it wraps is
      the adoption: `@radix-ui/react-dialog@1.1.15` + `@radix-ui/react-popover@1.1.15` (MIT), styled here.
      Measured cost **+213,229 B** to `lib/client.js` (1,685,186 → 1,898,415; 79 % of the 2.4 MB guardrail).
      [Evaluation](open-source-evaluations/shadcn-ui-2026-09-19.md).
- [x] **One primitive for every modal.** `novel-dialog.tsx` carries the settings sheet, the person drawer and
      the accept-confirm; `novel-popover.tsx` carries the editor's `···`. `dialog-focus.ts` is deleted — the
      hand-rolled trap set `aria-modal` and never made it true, so nothing hid the page behind it from a
      screen reader. Radix does, and the probe measures it.
- [x] **The surfaces keep their own hooks.** `data-novel-settings`, `data-novel-settings-close`,
      `data-novel-person-file`, `data-novel-review-confirm*` all still resolve, so every existing spec and the
      sweep were left to assert what they always did. Two specs changed for a real reason: the editor menu is
      a popover now (a trigger to open, and it dismisses on an outside click), and focus returns on Radix's
      zero-delay timer rather than synchronously.
- [x] **A pre-existing gate defect fixed.** I-P1 replaced the map's cluster discs with forceatlas2 but left
      `scripts/smoke-workbench.mjs` reading `data-novel-story-map-{clusters,axis,folded}` — attributes the view
      stopped publishing. Every sweep since reported `map-no-clusters` as a failure for a map that had removed
      clusters on purpose; the main checkout's own recorded sweep shows it. The map screen now asserts what a
      force layout can be held to: the cast is spread (measured `spread 0.68`), the nodes sit inside the
      overlay, and one focusable named stop per character.
- [x] **Evidence.** `probe-i-p4-dialog.mjs` + three screenshots + summary, against an isolated Host on
      `127.0.0.1:4781`; 504 tests, typecheck/lint/`git diff --check` clean; the probed workdir's draft files are
      byte-identical before and after.
- [ ] **Next: I-P5a** — topbar to the Linear benchmark.

### Loose ends this increment did NOT take

- **The person drawer's title is `guchen`, the entity id.** `data-novel-person-file` and its heading both show
  the id because this work's `character-state` deltas carry no `name`. That is the A5/W8 pipeline gap, gated on
  D6 (a Canon-semantics change), not an I-P4 defect — but the drawer makes it plainer than the map did.
- **The draft still opens on 「测测试试夜里风大」.** The probe-typing residue in
  `/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md` is still there. Cleaning it writes to the author's own
  file, so it needs authorization that this increment did not have.

## Front-end refactor handoff — A6, 2026-09-18

**Status:** the two copy defects we owned are fixed and measured; S2 turned out not to be a defect at
all, and the thing that *was* wrong was the probe.

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(A6 section).

- [x] **The submission card speaks the author's language.** It used to say 「…作为一份提案提交，和已接受版本
  R5 对齐。…Canon 不会因为这一步改变 —— 只有你在审阅里逐条接受，它才动」: five words from the plumbing on
  the one card that asks for consent. It now says what the chapter is, what AI will do with it, and where
  the result goes — and that the story does not move until the author accepts, one by one.
- [x] **The subtitle under 写作 lost `workdir` and `Canon`.** Two names from the machine room, on the line
  the author reads every session.
- [x] **S2 is not a defect — verified, not assumed.** The composer's placeholder is a locale key with a
  complete zh dictionary beside the en one, and the shipped runtime falls back to English **only** for a
  browser that asks for no registered language. Measured both ways on this machine (its languages are
  `zh-CN,zh` either way): Chinese. And the whole `docs/evidence/` tree contains
  「Describe what you want to build」 **only in the files this increment just wrote** — the premise does not
  reproduce from any earlier record. The English on that row is the model's own name (provider data); the
  effort label beside it is localised. So: no locale injection, and stop condition #1 does not apply.
- [x] **What was wrong is the browser the probes used.** Headless Chrome carries no `Accept-Language`, so
  the walkthrough measured a browser no author has. Both the walkthrough probe and the smoke now ask for
  `zh-CN`, and the smoke gained an author-copy leak check over the canvas titles, the lines under them and
  the composer placeholder — deliberately not the bodies, where the author's and the model's own words live.
- [x] **Evidence** `docs/evidence/2026-09-18/composer-locale/` (findings + a re-runnable probe) and the
  re-run walkthrough: its step-6 card now reads in the author's words, with zero console errors. The
  walkthrough types into the draft, so the draft was restored to its recorded sha256.
- [x] **Deviation worth noting:** the order's subtitle wording ("选一章开始写…") describes the *no chapter*
  screen, which A5 moved to `NovelLanding`; the editor's subtitle only appears with a chapter open, so it
  says 「这一章的稿子」.
- [ ] **Phase A is done** (A1–A6). **B1 next** — filter the runtime-context injection out of the transcript.

## Front-end refactor handoff — A5, 2026-09-18

**Status:** `verified` for the screen an author lands on; the planning path is unit-covered only, and
the work order's own check for it needs a state this machine cannot be put into.

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(A5 section).

- [x] **写作 is a way in, not a sentence telling the author to go elsewhere.** With no chapter open it
  offers the first three chapters to open, named the way the rail names them. The old copy ("先在左栏选一
  章") is gone, and with it the engineering nouns that were on that screen.
- [x] **A work with nothing in it can get its first chapter.** 「让 AI 规划第一章」 asks the architect for
  one chapter — not a book — behind the same consent card the other Canon-reaching actions use, and says
  planning only produces a proposal. The offer appears only when the author has nothing to write, which is
  the state it is for.
- [x] **The two dead-end hints now carry their own way out.** Where the editor said a thread was missing it
  now offers 「开一条线程」, and the topbar's 对话 opens a thread when there is none instead of toggling a
  column that cannot render without one.
- [x] **`sendToThread` is the same transport, not a second one.** The plan request is queued into the
  thread through the same `beginSubmission` path the submit and refine requests use; the boundary is
  unchanged — the architect proposes, the author accepts.
- [x] **Evidence** `docs/evidence/2026-09-18/A5/`: `a5-summary.json` verdict **pass** — the landing card
  with its chapter, no `Canon` / `workdir` / `R5` / `expectedRevision` anywhere on it, and the chapter
  opening when clicked. Nothing was submitted, no Canon moved, no draft file written.
- [ ] **Not verified, and worth saying plainly:** the planning request end-to-end. This machine has one
  work, whose chapter is 待审, so the product *correctly* withholds 「规划下一章」 — the probe asserts that
  absence. Exercising the planning card needs an empty work, which means creating a second work (registry
  plus a new Canon) — a heavier fixture than the one just reverted. The request text and the card are
  unit-covered.
- [ ] **Also unit-only:** the no-session review banner and the editor's 「开一条线程」 button — same reason as
  A4: this profile always has a session and no UI unselects a chapter.
- [ ] **A6 next** — the copy pass: the submit confirmation card's five engineering nouns, the editor
  subtitle, and the composer locale check (which is the order's first stop condition).

## Front-end refactor handoff — A4, 2026-09-18

**Status:** `verified`, and the headline defect was only actually fixed on the second attempt — which the
machine is what caught.

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(A4 section).

- [x] **The waiting badge follows the agent.** A proposal filed by the agent is invisible from the client —
  the packet goes to the host — except for the tool call that filed it, which is in the same log the
  transcript is reduced from. A new call id there now triggers a re-read, and the thread header is keyed on
  the store's revision, so the badge moves without a single poll. Measured: **6 → 7 in 39 seconds**, with
  the author doing nothing.
- [x] **…and the first attempt at it did not work.** The seen-call set and its "already primed" flag were
  built inside `followTurnFailure`, which is re-entered on every session-list change — and an agent filing
  a proposal is exactly such a change. Each re-entry rebuilt the set and swallowed the call it had just
  missed. Both now live in the plugin's own scope. This is the case for running the machine before
  believing a fix.
- [x] **Accepting without a thread is no longer silent.** The review canvas says a thread has to carry the
  decision, offers 「开一条线程」, and the one deciding button explains itself instead of returning.
- [x] **The draft and the accepted chapter are two documents, and now the editor says so.** A divergence
  bar offers 「读已接受正文」 (Canon's text, read in the reading state) and 「写回稿子」 (writes it into the
  draft file under the version that file already has, so the conflict guard still applies). `loadManuscriptText`
  — dead code until now — is what supplies the accepted text.
- [x] **Evidence** `docs/evidence/2026-09-18/A4/`: `a4-summary.json` verdict **pass**, with the divergence
  bar, the read-back, the file check behind 写回稿子, and the badge measurement. The probe restores the
  draft it writes; the proposals its submissions produced have been removed, so the inbox is back to its
  six pre-existing entries and Canon is still at revision 5.
- [ ] **Unit-only:** the no-session review banner. This profile always has a session selected and CDP cannot
  take one away, so that state is unreachable on this machine.
- [ ] **A5 next** — the writing entry points: guidance when no chapter is picked, 「让 AI 规划第一章」 when a
  work has none, and 「开线程」 buttons where the editor currently only says a thread is missing.

## Front-end refactor handoff — second audit of A2/A3, 2026-09-18

**Status:** the first "done" for A2 and A3 was overstated. Four real defects came out of re-reading
the diff and re-running on the machine with a second chapter; all four are fixed and re-verified.

- [x] **An agent proposal could rename the author's chapter and move their draft file.** The outline
  built `titles` from accepted manuscripts, then let a *pending* proposal overwrite it — and the title
  is what names the draft file (`第N章《title》.草稿.md`). So one proposal from the agent renamed the
  chapter the author was writing, and the editor then opened a different, empty file. The workspace had
  the two files to prove it, one of them created by this increment's own A3 probe. Titles now come from
  accepted manuscripts only; a pending proposal marks the chapter 待审 and no more.
- [x] **A remembered chapter that no longer exists was an endless wait.** `chapterId` now survives a
  reload, and nothing cleared it when the author moved to another work — so the canvas sat on
  「正在读取这一章…」 for ever, where the old code at least offered 「先在左栏选一章」. The stale pick is
  now dropped when the outline does not contain it.
- [x] **A save for the chapter just left could install its version token on the next one.** The leaving
  flush and the next chapter's read are two requests in flight at once; answering in the wrong order
  made the next write carry a token belonging to another chapter — F2b's own CAS rejection by another
  road. `writeDraft` now checks the save still belongs to the chapter on screen before it touches the
  token, the status line or the errors.
- [x] **The smoke's review check had never worked.** `sweepProposal` looked for
  `[data-novel-proposal]`, which the product has never rendered — so it reported "nothing pending" on
  every run, including the runs where something was. It now reads the badge the author reads
  (`data-novel-thread-pending`) and opens the review canvas the way the author opens it. That also
  retired a claim of mine: the inbox held **8** pending proposals, not none.
- [x] **Chapter switching is now verified on the machine, not just in a unit test.** This workspace had
  one chapter, so that path was unreachable. With the author's agreement a second chapter was added to
  the workspace as an explicitly-labelled fixture (Canon revision 6; the pre-change storage is backed
  up beside the evidence). A2 now measures the real switch — 251ms, prose in the old chapter's file and
  not in the new one's — and A3 measures the state that must not follow the author across it.
- [x] **My own specs were leaking between cases.** They mounted React roots and never unmounted them,
  while the workbench store is module state — so a canvas from one case was still writing during the
  next. Three specs now tear down per case.
- [ ] **Open question for the author:** the fixture added a second chapter to the workspace's Canon, and
  the inbox now holds 8 pending proposals (at least 2 from this increment's probes). Say the word and
  they come out.

## Front-end refactor handoff — A3, 2026-09-18

**Status:** `verified`, including a real submission into the thread — the one acceptance step that
cannot be checked without spending a turn.

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(A3 section). Runs in the **main checkout** with absolute paths.

- [x] **Submitting is repeatable.** `submitState` goes back to `idle` on the next keystroke, so
  「提交本章」 returns and the 「已交给 AI 起草提案」 badge drops. Before this, one submission took the
  action away for the rest of the chapter. The submitted state now offers 「去收件箱」, so the author has
  somewhere to go instead of a dead end.
- [x] **One panel at a time.** The confirm card and the continue panel both opened, and stacked, on one
  896px row. Opening either closes the other.
- [x] **A chapter switch resets the chapter's own state.** `load()` clears confirming, continuing,
  submit, refine and both problems before the draft is read, so nothing the last chapter said describes
  this one.
- [x] **A failed outline read says so.** The canvas keeps its own `editorProblem`, and the editor branch
  distinguishes "could not read the chapter" (error card + 重试) from "no chapter picked" (guidance) and
  "still reading" — the middle case used to be reported as the author's omission.
- [x] **A jsdom gap found on the way, fixed in the test shim rather than the product.** ProseMirror
  measures the caret with `getClientRects`/`getBoundingClientRect` when a transaction moves the selection;
  jsdom implements neither on `Element` or `Range`, so the call threw out of band and failed the whole run
  even with 475 tests green. `tests/webgl-env.ts` now answers both.
- [x] **Evidence** `docs/evidence/2026-09-18/A3/`: `a3-summary.json` verdict **pass** — mutual exclusion
  measured, 「去收件箱」 155ms after confirming, 「提交本章」 back after writing again, version history still
  **R5**, console uncaught errors 0. The probe replaces the draft content before submitting, so the
  proposal request carries its own sentence rather than the test residue in the file, and it restores the
  draft afterwards: **sha256 before == after** (`c2d819ea…`). It left **no proposal** in the inbox.
- [x] **Correction, after the first pass was challenged.** The first version of the leaving flush still
  had a real bug: the flush and the next chapter's read are two requests in flight at once, and the save
  for the chapter just left could answer *after* the read and install **its** version token as the guard
  for the chapter now on screen — the next write into it would then be refused as a conflict the author
  never caused. Same failure F2b named, reached by another road. `writeDraft` now asks `stillOnScreen`
  before it touches the token, the status line or the errors. Two other things in the first report were
  wrong or overstated: the "13ms" was the click's round-trip and not the gap since the keystroke (the
  probe measures it properly now — 265ms), and **chapter switching was never verified on the real
  machine at all**: this workspace has one chapter, so that path is unit-only.
- [x] **The three probes were merged.** Each of A1/A2/A3 had grown its own ~200-line CDP script with the
  same session class and launch flags copied three times. They now share
  `docs/evidence/2026-09-18/probe-harness.mjs` and keep only their scenario — and all three were re-run so
  the evidence matches the code that is checked in.
- [ ] **A3 correction, same audit.** A3's own claim survives re-reading: mutual exclusion, the inbox
  affordance and the repeatable submit are all measured on the real machine, and the outline error card is
  unit-only (host RPCs cannot be stubbed over CDP). A chapter switch's state reset is unit-only for the
  same one-chapter reason as A2.
- [ ] **A4 next** — the collaboration loop: the pending-proposal badge never updates, "无 session 审阅"
  is a silent dead end, and accepted prose has nowhere to be read.

## Front-end refactor handoff — A2, 2026-09-18

**Status:** `verified`. The three ways typing got lost are closed, and the browser proves it: prose typed
13ms before leaving the editor is in the draft file, and a reload comes back to the chapter, not to "pick a
chapter".

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(A2 section). Runs in the **main checkout** with absolute paths — the session is pinned to a worktree.

- [x] **One write path, and the identity is pinned where the work is done.** `scheduleSave` became
  `writeDraft` (version guard, status line and failure handling in one place) plus a scheduler that pins
  `{chapter, version, text}` into `pendingRef` when the keystroke happens. The timer used to read all three
  at *fire* time, which is how the last paragraph of one chapter was written into the next one's file.
  Leaving — unmount, chapter switch, `pagehide` — goes through `flushPending()`, which writes the pinned
  text rather than reading a document that has already moved on.
- [x] **The browser is asked before it discards.** `beforeunload` calls `preventDefault` only while prose
  exists that the file lacks. That is answered by an `editCount`/`editsOnFile` pair rather than the status
  line, because a save landing while newer keystrokes are queued must not report the chapter clean.
- [x] **`chapterId` persists** (`store.ts` dehydrate/hydrate/`prefsChanged`, validated by a new `textOr`), so
  a reload reopens the chapter instead of the rail.
- [x] **Evidence** `docs/evidence/2026-09-18/A2/`: `a2-summary.json` verdict **pass** — switched away
  13ms after the insert, marker present in the draft file, readable again on return, and after reload
  `view=editor` / `chapter=vol01-ch0001` / no "先在左栏选一章" / console uncaught errors 0. The probe
  typed into the author's draft, so it backs the file up first and restores it: **sha256 before == after**
  (`c2d819ea…`).
- [x] **A deviation worth keeping in view.** The order said to pin only `{chapter, version}` and re-serialize
  in the timer; the text is pinned too, because at unmount Tiptap may already be destroyed and after a
  chapter switch the document already holds the *other* chapter's prose. It also said `vi.useFakeTimers`
  throughout; only `setTimeout`/`clearTimeout` are faked, since faking more stops the editor mounting at all.
- [ ] **A3 next** — the submit chain: the button disappears after one submit, the confirm card and the
  continue panel can be open at once, and a failed outline read claims "you picked no chapter".

## Front-end refactor handoff — Phase 0 + A1, 2026-09-18

**Status:** Phase 0 `verified` (10 read-only steps, two deviations recorded); A1 `verified` on the running
host under `--disable-gpu` — which *is* A1's acceptance environment — with the degraded card, the surviving
canvases and a zero-error console all measured, not inferred.

**Work order of record:** [`frontend-refactor-handoff-2026-09-18.md`](frontend-refactor-handoff-2026-09-18.md)
(supersedes `frontend-rewrite-handoff-2026-09-18.md`). Ran in the **main checkout** — the session is pinned to
worktree `.claude/worktrees/review-project-status-7c2dca` and `change_directory` was refused, so commands ran
with absolute paths, as on 2026-09-17. The worktree was not touched.

- [x] **Phase 0 baseline.** HEAD `33879fb`; `corepack pnpm test` **456 passed / 32 files**; typecheck 0;
  `git diff --check` 0; host `401`; `dev-host.sh rebuild` + `smoke-workbench.mjs` exit 0;
  `port-prototype-css --check` pass; `lib/client.js` 1,599,048 B. Two deviations from the order's
  expectations, both recorded at the top of the work order: **lint was red** (exit 1, one unused `dirname`
  import in the untracked walkthrough probe — removed, now 0), and **client.js is 336 B larger than the
  order states** (1,599,048 vs 1,598,712; `lib/` is gitignored, so the order's number was a stale build).
- [x] **A1: a crashing canvas no longer takes the workbench with it.** New `canvas-boundary.tsx` (class
  component, retry remounts the subtree under a fresh key, zero new dependencies) and `webgl-probe.ts`;
  `StoryMapView` asks the machine for WebGL before building sigma and draws a card when the answer is no;
  `index.tsx` wraps the canvas seat in the boundary, keyed by the view so switching canvas heals itself.
  Evidence `docs/evidence/2026-09-18/A1/` — `a1-summary.json` verdict **pass**: card `role=alert` with
  「去人物与关系」/「重试」 and `webglCanvases 0`; one click reaches a live cast canvas (6 people / 3
  relations / 4 factions); after 重试 the rail's 10 view entries and the frame are still there, no boundary
  card appeared, and **console uncaught errors were 0**. Gate: 461/461 (456 + 5 new), typecheck/lint/diff 0,
  rebuild + smoke exit 0, `client.js` 1,606,425 B.
- [x] **A probe defect found while re-running the walkthrough (not a product defect).** Step 8 reads the
  prototype's old class names (`.char-card`, `.rel-line`), so its `cardCount: 0` says nothing about whether
  the cast canvas is alive; screenshot `08-cast.png` shows it fully drawn. Same family as E7 — B4 fixes it.
- [ ] **A2 next** — the three ways typing gets lost (unmount cancels the pending save; the save timer reads
  the *new* chapter's identity; nothing flushes on `pagehide`/`beforeunload` and `chapterId` is not
  persisted). Serial after A1 per §5 is not required (A1 ∥ A2), but A2 → A3 is.

## Editor-first front-end rework — plan of record, 2026-09-17

**Status:** `not-started` as an implementation; the decisions are settled and the increment queue is written.

- [x] Grilling settled fourteen decisions, several of which override the prototype: the hand-writing editor
  becomes the main canvas (the prototype lands on the story map), the agent conversation moves into the
  editor's collapsible right column, Tiptap/ProseMirror owns the prose, `/` and `@` reuse the official
  trigger pipeline with our own menu, source anchors stay optional, and 正文阅读 merges into the editor's
  reading mode instead of keeping its own canvas.
- [x] New evidence, found while grilling: the client-side approval surface exists **only** in
  `@deepseek-ai/dsh-client-ui-chat` (it contributes `conversation.approval.detail`), and our bundle patch
  disables `ui-chat` — so the current build may have no way to approve a dangerous operation. Treated as a
  suspected regression and queued first (`I1.1`), not assumed.
- [x] Reference study: 阅文官方的 `/Applications/作家助手.app` v5.18.1 is Electron + React + TinyMCE. Its
  editor is the axis (EditorWrap / EditorMenu / SideChapterPanel), 设定·角色·大纲·**伏笔** hang off the
  editor menu, 伏笔 is first-class and binds to chapters, and its AI is 续写 with a 「情节灵感…按写作顺序
  逐条输入」 box plus a 采用/评价 loop. Notably it has **no relationship graph at all** — the map is我们的.
- [x] Full plan written to [`editor-first-frontend-2026-09-17.md`](editor-first-frontend-2026-09-17.md):
  seven phases, increment queue with RED/GREEN/verification per item, the repo invariants every iteration
  must respect, the prototype/CSS regeneration rule, and the stop conditions that require a human.
- [ ] Execute it. Phase 0 first (baseline + the editor stack's bundle-cost selection record), then Phase 1
  (the approval surface) ahead of everything visible.

## The empty thread stops being a dead column, 2026-09-18

**Status:** `verified` in the browser against the rebuilt profile, with the pixels and the focus measured.

- [x] **The complaint was two symptoms of one defect.** "对话栏鼠标不能交互" and "提示比例很难看" are both
  the empty thread: with no lines, the shipped conversation surface renders its *welcome page* — brand
  headline, workspace row, 312px hero composer — and that page claims 648px of the column. The frame's own
  empty state was left an 80px strip above 390px of scroll body, and measured, the column's centre and lower
  third both left focus on `body`. A thread *with* lines was already correct (674px, all ours).
- [x] **The existing hide rule could never have worked.** `[data-slot="conversation.session"] { display: none }`
  targeted a node the framework fills with an **inline** `display: contents` — inline beats any stylesheet —
  and which is an empty shell anyway (`childCount 0`). It was written for the transcript region; an empty
  thread draws a welcome page, which no region rule reaches.
- [x] **Named, not sniffed.** The frame already holds the transcript, so it publishes
  `data-novel-thread-state="empty"` on the column — the same way it publishes `data-narrow` — and the
  stylesheet answers that. Two rules: the composer stack keeps only its composer bar, and the shipped root
  stops claiming the column.
- [x] **Measured before and after, on the running host** (`docs/evidence/interaction-2026-09-18/`):
  transcript kept 80px → **539px**; shipped root 648 → **188**; empty state 17px serif at 31.45px leading,
  flush to the edge → **13px UI face, 22.1px leading, centred, 20px gutter**. A thread with lines is
  **unchanged** (674 / 53, no attribute). The composer still focuses and takes text on the empty thread —
  checked, because the fix edits the shipped surface's own flex.
- [x] **Ruled out, with evidence, not by eye:** all seven topbar controls, the settings sheet (night resolves
  `rgb(48, 48, 46)` — an earlier "white sheet at night" reading was a misread screenshot, corrected by
  sampling pixels), the advanced panel, theme switching, all ten rail views, the editor (focus + typing), and
  every clickable control's hit test.
- [ ] **Found and left alone:** below 1184px the solver closes the conversation column outright, so the 对话
  button is dead there. That closing is asserted as intended (`closes the conversation column rather than
  letting it squeeze the manuscript`), and the float path the frame's own comment describes *is* reachable
  between 1184 and `NARROW_AT` 1280. Whether the author should keep a way back below 1184 is a product call.
- [ ] Gates: **456/456** tests (3 added), `typecheck`, `lint`, `git diff --check`, `dev-host.sh rebuild` +
  sweep `exit 0`; `lib/client.js` 1,598,712 B against the 2.4 MB ceiling.

## The conversation chrome wears this product's colours, 2026-09-18

**Status:** `verified` in the browser, day and night, with the pixels measured.

- [x] **The clash is a palette, not a layout.** The shipped composer, hero and header render inside our column and are written entirely in the host
  theme's variables — cool greys and a blue accent (`#4176e6`), against this product's warm greys and orange. Its class names are build hashes
  (`wSkVaW_root`), so restyling its internals was never on the table; what was on the table is *answering the variables it is written in*, which is
  the same seam the community skins use. Forty of them are now defined inside our frame in terms of our own tokens, so day and night follow the
  frame automatically.
- [x] **Measured, not eyeballed** (`docs/evidence/editor-2026-09-17/probe-conversation-chrome.mjs`): in night mode the composer card's own background
  is **`rgb(48, 48, 46)`** — this product's warm dark — where the host palette would have been `#151517`; in day the accent it resolves is
  `hsl(15 63.1% 59.6%)`, our orange, not the host's blue; the font is ours; and the host's palette **outside** the frame is untouched (`body` still
  resolves `#fff`), so the bridge is scoped rather than global.
- [x] A first measurement read the tokens off `documentElement` and found them all empty, which looked like "the official tokens are missing
  entirely". They are written on `body` (custom properties do not inherit upwards) — the *answer* was right and the *reading* was wrong, and the
  wrong reading would have led to a much bigger change than the one needed.
- [x] A shell-spec assertion pins the four variables an author actually sees, so deleting the bridge fails a test rather than quietly returning the
  conversation to the host palette.
- [x] **Not done, and deliberately:** the composer's *structure* is untouched. An earlier round established, and the shipped types re-establish today,
  that the draft lives in the shell's Lexical editor, `InputActions` is write-only, and the one official package that does take over the composer
  (`user-questions`) can do so only because a question card needs no draft.
- [ ] Gates: **453/453** tests, `typecheck`, `lint`, `git diff --check`, rebuild + sweep `exit 0`; `lib/client.js` 1,596,323 B against the 2.4 MB
  ceiling.

## The columns can be dragged, 2026-09-18

**Status:** `verified` in the browser with real mouse, key and reload events.

- [x] **What the user asked for was a capability we dropped.** "The columns can't be dragged wider" is true,
  and the reason is that the official `@deepseek-ai/dsh-client-ui-layout` AppFrame — which we replace with our
  own root occupant — *is* the thing that has drag handles. Our frame has had fixed 248/296 tracks since it was
  written, and `workbenchActions` could only open or close a column, never size one.
- [x] **The official contract, with our numbers.** `columns.d.ts` solves this with a pure function: the centre
  column keeps a floor, the details column concedes first and then auto-closes, the rail never concedes.
  `frame-columns.ts` is that contract with the prototype's 248/296 as defaults, because adopting theirs
  (280/360) would have been a design change dressed up as a reuse. Widths are preferences (0 = closed), the
  same shape the store already had, so a closed column stays closed however wide the window gets.
- [x] **Handles, from the keyboard too.** Each boundary carries a `role="separator"` window splitter on the
  seam: pointer drag with capture, arrow keys for 16px, shift for 48. A resize only a mouse can perform is a
  resize half the authors cannot perform.
- [x] **Real-machine evidence** (`docs/evidence/editor-2026-09-17/probe-columns.mjs`): rail 248 → 337 by drag;
  conversation 296 → 386 by pulling the boundary left; over-dragging stops at the 360 ceiling; at a 1000px
  window the conversation column **closes itself** and the canvas keeps 942 ≥ its 640 floor; back at 1440 it
  returns with the **dragged** width, not the default; ArrowRight moves 200 → 216; a reload keeps both dragged
  widths; no console errors.
- [x] **The real machine caught a bug the unit tests had not asked about:** a dragged width was thrown away on
  the next load, because the I6.2 hydrator validated panel widths against the set `{0, default}` — right when
  the widths were only ever toggled, wrong the moment they became draggable. It validates against the panel's
  range now, and a spec pins a dragged width surviving a reload.
- [x] §4.3 not needed for RED here: the solver spec and the frame-wiring spec were both written first and both
  failed before the implementation existed.
- [ ] Gates: **452/452** tests (35 files; +12 columns), `typecheck`, `lint`, `git diff --check`, rebuild +
  sweep `exit 0`; `lib/client.js` 1,593,441 B against the 2.4 MB ceiling.
- [ ] **Next, and the other half of the complaint:** the official conversation chrome still looks like itself
  rather than like this product. The fix is the seam the skins use — overriding `--dsw-alias-*` and the
  `--dsh-composer-*` layout knobs inside our column — not a rebuild of the composer, whose input seams are
  closed to plugins (re-verified against the shipped types, not memory).

## Phase 6 closed out, 2026-09-17 (I6.7)

**Status:** `verified` — every gate re-run in full on the final tree.

- [x] **The generated stylesheet still matches the prototype** (`port-prototype-css.mjs --check`), and nothing
  needed regenerating: the only prototype change this round was `overflow: clip` on `.app`, made on both sides
  at the time. No new prototype file, so `prototypePath` is untouched.
- [x] **The records agree with the code**: `tasks/todo.md` has a section per increment, the parity matrix's
  frame and canvas rows were rewritten as the facts changed — including marking the old "at 1280 the rail is
  247px" line as superseded — and the plan file carries a checkbox and a pointer to repo-internal evidence for
  each one.
- [x] **One boundary stated rather than glossed:** the prototype's *demo page* was not written back. The
  product deliberately departs from it in several places that §1 agreed — the editor is the landing instead of
  the map, the conversation lives in the right column, there is no composer dock of ours, and the map is a
  sigma cluster layout. Those are decisions, not drift, but the demo still shows the pre-consensus flow. The
  *CSS* is generated from the prototype and in sync; the *HTML* demo and the product flow still differ, and
  that predates this round.
- [x] **Final gate run on the final tree:** **439/439** tests (31 files), `typecheck`, `lint`,
  `git diff --check`, the port gate, rebuild + sweep `exit 0` with 16 screens rendered (`review` honestly
  `skipped-no-proposal`); `lib/client.js` 1,586,954 B against the 2.4 MB ceiling. The standing real-machine
  assertions all report: narrow at 57px with a floating column, four map keyboard stops with one in the tab
  order, zero Canon keys on the cast board, and the author's choices kept for the next load.
- [ ] **Two Phase 6 items are deliberately not built, each with a checked reason:** 只看本卷 (one volume, and
  every accepted story event carries a null manuscript order, so the filter could not change a pixel) and
  裸 id 当标题 (no character in this Canon records a `name`, so the front end has no name to prefer). Both are
  recorded with the precondition that would make an honest version possible — the novel the user is bringing
  is likely to supply the second one.

## The work tree reads again, 2026-09-17 (I6.6)

**Status:** `verified` — measured before and after, in the browser.

- [x] **A measured layout defect, not a taste pass.** Screenshots did not say where the problem was, so the rail's
  rows were measured instead: every child's width and whether it overflowed. The numbers named it — the volume
  name had 50px and a chapter title 27px, both ellipsised. The cause was not CSS: the prototype closes
  `.vol-head` after the volume name and its count and emits the chapters *after* it, while our renderer nested
  them inside, so a flex row held the name, the count and every chapter at once. The chapters are siblings
  again, and **no CSS changed at all** — the DOM simply went back to the prototype's shape.
- [x] After: the volume name gets 183px and the chapter title 131px with no overflow, and the chapter row fills
  the 248px rail. A spec pins the structure (`[data-novel-volume]` may contain no `[data-novel-chapter]`, and
  the chapters are its next siblings); it failed before the fix and passes after.
- [x] **Nothing else was changed.** No measurable defect was found on the other screens, and inventing pixel
  tweaks to make a "polish" increment look busy would be dishonest — the last word on density and appearance
  is the author's eye, and the parity matrix keeps that cell at `implemented-unverified` until they look.
- [ ] Gates: **439/439** tests, `typecheck`, `lint`, `git diff --check`, rebuild + sweep `exit 0`.

## The screens speak the author's language, 2026-09-17 (I6.5a)

**Status:** `verified` live for everything the front end can control; the rest is a content gap with evidence.

- [x] **Four places where Canon's vocabulary reached the screen.** Relationship lines were written between
  entity ids (`guchen→han-potian 师徒（初识）`) on the cast board, in the person drawer *and* on the map's edges
  — one line, three screens, all machine pairs. The builders now take a name resolver. Character aspects were
  printed raw (`constitution · realm` on a card, `realm` as a drawer column), which is Canon's key and the
  model's choice of word, not a label. A faction Canon records without members showed `0 人` on all four
  cards: true, and not information. And a thread the author has not written in yet had no title, so the rail
  rendered an icon with nothing to identify it — worst at the narrow width, where the label is hidden anyway.
- [x] **`aspectLabel` deliberately has no fallback to the key**, unlike its `kindLabel` / `severityLabel`
  siblings: theirs are our own closed vocabularies, while aspects are whatever word the model chose, and
  inventing a Chinese translation for a key we have never seen is worse than showing the value alone — the
  value is a Chinese sentence that already says what it is. The keys that do have names were named only after
  reading every one of their values in this Canon's own store.
- [x] A defect introduced and caught inside this increment: an unlabelled aspect fell into the 96px label
  column and squeezed the sentence there. It spans the row now, and a spec pins that.
- [x] Real-machine evidence (`docs/evidence/editor-2026-09-17/probe-naming.mjs`): searching both surfaces for
  fifteen Canon keys finds **zero**; no `0 人` chip remains; no thread row is nameless; no console errors.
  The sweep now fails the cast screen on `cast-prints-canon-keys` or `cast-prints-a-zero`.
- [x] §4.3 targeted breakage: 6/6 bitten, five source files restored byte-for-byte.
- [ ] **Honestly still showing ids:** relationship lines, because this Canon records no character names at all
  — its `character-state` deltas carry `constitution` / `realm` / `persona` / … and never `name`. The front end
  now prefers a name and has none to prefer. Fixing that means writing names into Canon, which is a pipeline
  change recorded as I6.5b, and the novel the user is bringing will likely make it moot.
- [ ] Gates: **438/438** tests, `typecheck`, `lint`, `git diff --check`, rebuild + sweep `exit 0`;
  `lib/client.js` 1,586,948 B against the 2.4 MB ceiling.

## The map can be walked from the keyboard, 2026-09-17 (I6.4b)

**Status:** `verified` in the browser, keyboard and mouse both.

- [x] **The cast is drawn on WebGL, where nothing is focusable and a screen reader sees nothing.** The overlay
  that already carried the cluster discs is now also the map's accessible twin: one real element per drawn
  character, positioned by `graphToViewport` so the focus ring sits on the actual dot. The other option on the
  table — a separate cast list beside the map — was rejected because 人物与关系 already is that list; this way
  the spatial experience and the enumerable one are the same implementation.
- [x] Roving tabindex, so a forty-character cast is not forty Tab presses; arrow keys walk the cast and wrap,
  Enter selects, `d` opens the profile. `pointer-events: none` leaves the mouse story untouched — dragging a
  character to pin it still reaches sigma, which the probe re-measures every run. The discs and their labels
  are `aria-hidden`; the `+N` deliberately is not, since hiding it would delete the folded cast from the
  accessibility tree as well.
- [x] A character folded behind a `+N` is not drawn and so is not offered; search is the path to them, and it
  opens the cluster that hid them.
- [x] Real-machine evidence (`docs/evidence/editor-2026-09-17/probe-map-keyboard.mjs`): four stops for seven
  characters with three folded, exactly one in the tab order, all named; twenty Tabs from the view segment
  reach `guchen` with the accent ring drawn; the arrows walk guchen → linxuan → sumubai and back; Enter
  selects; `d` opens the drawer; a drag still pans by exactly its own delta; no console errors.
- [x] §4.3 targeted breakage: 6/6 bitten, `StoryMapView.tsx` restored byte-for-byte. The sweep now also fails
  the map screen on `map-keyboard-cast-mismatch`, `map-keyboard-tab-marathon` or `map-keyboard-unnamed`, and
  prints `4 stops (1 in the tab order, 4 named)`.
- [ ] **Recorded, not fixed:** the accessible names are Canon entity ids (`guchen`) because these characters
  carry no `name` field, so a screen reader reads an id aloud. Same root cause as the visible labels; I6.5.
- [ ] Gates: **431/431** tests, `typecheck`, `lint`, `git diff --check`, rebuild + sweep `exit 0`;
  `lib/client.js` 1,583,707 B against the 2.4 MB ceiling.

## The keyboard can use the dialogs, and the column can be read, 2026-09-17 (I6.4a)

**Status:** `verified` in the browser; two defects worse than the increment's own subject came out of it.

- [x] **Both modal surfaces declared `aria-modal` and kept none of it.** The 设置 sheet and the 人物档案 drawer
  took no focus, let Tab walk out, and never gave focus back — and inside the shipped host that means Tab
  lands in whatever other plugin is mounted behind us. One hook (`dialog-focus.ts`) now does all three for
  both, listening on the document rather than the dialog, because a trap attached to the element cannot see
  the Tab that starts outside it — which is the one that has to be caught.
- [x] **Tab order and focus rings needed measuring, not fixing.** Driven with real key events, the cycle is
  topbar → rail (chapter, ten views, threads) → conversation column (header, official controls, composer) →
  wrap: the visual order, with our accent ring on every stop. Two probe mistakes are recorded rather than
  papered over: `body.focus()` does not reset Chrome's sequential-navigation starting point, and a synthetic
  Enter needs its `text` or a button never activates.
- [x] **A defect the sweep found by failing:** the whole frame could be scrolled programmatically. `main`'s box
  came back 15523px above the viewport and the narrow screenshot had no topbar or rail in it at all — because
  `.app` is `overflow: hidden`, which still scrolls, and the conversation column was taller than its grid row.
  Any `focus()` could slide the entire application. It is `overflow: clip` now, in the generated stylesheet and
  the prototype together, with the port gate re-run.
- [x] **And the reason it was taller:** the transcript seat is `display: contents`, so a 59-message conversation
  had no scroll container and was clipped by the frame — the author could not read past the fold. The seat is a
  box now, with the header pinned above it and the composer below. Verified live: `overflow-y: auto`, `scrolls: true`.
- [x] §4.3 targeted breakage: four mutations on the focus hook all bitten, restored byte-for-byte; and the new
  `transcript-clipped` sweep check was shown to bite by putting `overflow-y: visible` back and watching the
  thread screen report exactly that.
- [x] Gates: **428/428** tests, `typecheck`, `lint`, `git diff --check`, the port-CSS gate, rebuild + sweep
  `exit 0`; `lib/client.js` 1,580,329 B against the 2.4 MB ceiling.
- [ ] **I6.4b is the rest of the keyboard work, and it has a real conflict to resolve first:** the prototype's
  map is focusable SVG nodes, and our map is sigma on WebGL, so there are no nodes to focus. The options are
  recorded in the plan rather than guessed at here.

## The frame fits a narrow window, 2026-09-17 (I6.3)

**Status:** `verified` at 1280 and 1440 in the browser, with measurements rather than impressions.

- [x] **The prototype's narrow rules were never switched on, and the reason was not the stylesheet.** The rules
  had shipped with the ported CSS all along, and our frame root carries the `.app` class they key off — but
  nothing ever set `data-narrow`, because `workbenchActions.resize` was **never called anywhere**: the window
  size in the store was dead state I wired up in I3.4 and never connected. So this increment was connecting a
  signal, not writing styles.
- [x] The frame now measures **its own seat** with a `ResizeObserver` rather than reading `window.innerWidth` —
  the host can seat it in a narrower column than the viewport — ignores a pre-layout width of 0, and at or
  below 1280 folds the rail to icons, floats the conversation column over the canvas, and gives every icon-only
  row its own `title` and `aria-label` (a hidden `.lbl` also leaves the accessibility tree). Not adding the
  `open` class would have `display: none`d the conversation with no way back, which is a regression, not a
  feature. The 1280 threshold is a recorded judgement: three columns still fit there, so it is a preference for
  the manuscript over permanently docked chrome, and it makes the sweep's existing 1280 screen a real check.
- [x] **A defect that was on every screen, found by measuring for this one:** the frame inherited the
  prototype's third grid row, the composer dock, and stopped rendering its own composer in I2.4 — so every
  screen had 88 dead pixels under it. `grid-template-rows: 44px 768px 88px` with the topbar, rail, canvas and
  column **all ending at y=812**. The frame now declares its own rows; the canvas reaches 900.
- [x] Real-machine measurements (`docs/evidence/editor-2026-09-17/probe-narrow.mjs`): 1440 → rail 247, canvas
  896, column 296 not overlapping; 1280 → rail 57, canvas 1222, column floating over it; closing the column
  leaves the canvas at 1222; no rail item spills its text; 0 console errors.
- [x] §4.3 targeted breakage: four mutations caught by the unit specs, and **two that only the browser can
  catch were actually run through the browser** — removing `observer.observe()` leaves `data-narrow` at 0 in a
  1280 window, and restoring the composer row drops the canvas bottom back to 812.
- [x] The sweep's 1280 screen now fails on `narrow-not-applied`, `narrow-rail-not-folded`,
  `narrow-column-takes-a-track` or `dead-row-under-canvas` instead of only checking for overflow.
- [ ] **Found and deliberately not fixed here:** one thread row has an empty title (a session with no messages),
  so it is an unnamed icon button at both widths. Naming it is a product judgement and belongs to I6.5.
- [ ] Gates: **424/424** tests (28 files; +5 narrow), `typecheck`, `lint`, `git diff --check`, rebuild + sweep
  `exit 0`; `lib/client.js` 1,576,982 B against the 2.4 MB ceiling.

## The author's choices survive a reload, 2026-09-17 (I6.2)

**Status:** `verified` on a real page reload in the browser.

- [x] **The frame's own choices are written to the browser's storage and read back.** One slice: the canvas
  the author was on, the theme, the two column folds, and the 设置 sheet's values. Deliberately *not* stored:
  the session, the transcript, the last submission, the open drawer — those are where the author is standing,
  not what they decided, and reopening the app should not reopen a sheet.
- [x] **Storage is treated as untrusted input.** It can be left over from an older build or edited by hand, so
  `hydrateWorkbench` validates field by field and falls back to the shipped default for anything this build
  cannot render — `readingSize: 99` becomes 17, not a clamped 18 the author never chose. Writes happen only
  when the preference slice changes, so a transcript append or a Canon refresh never touches storage, and a
  browser that refuses storage leaves the frame working and merely forgetful.
- [x] **A real `Page.reload` in the browser returns all four choices** (canvas, theme, both folds, reading
  size), the stored string carries no session state, and the probe clears it afterwards so the dev host is left
  as it was found. This is also what proved `localStorage` is reachable from inside the frame at all.
- [x] The standing sweep now checks the same thing: `sweepSettings` reads the prefs key and fails the screen as
  `prefs-not-stored` if the next load would find nothing, printing what it would restore.
- [x] §4.3 targeted breakage: **7/7 mutations bitten**, `store.ts` restored byte-for-byte. The fifth was a MISS
  first time — my assertion compared stored contents, which a redundant rewrite also satisfies — so it now
  counts `setItem` calls instead. The gap was in my test, not the implementation.
- [x] Gates: **419/419** tests (28 files; +8 prefs), `typecheck`, `lint`, `git diff --check`, rebuild + sweep
  `exit 0`; `lib/client.js` 1,575,040 B against the 2.4 MB ceiling.
- [ ] Pins still do not survive a reload, and the rail's 「展开其余 N 条」 is not remembered: whether pins cross
  a reload is a product decision, and expanding a list is a browsing action rather than a preference.

## Story map becomes a cluster map, 2026-09-17 (I6.1a)

**Status:** `verified` live on the rebuilt Host; the one prototype feature still not built (只看本卷) has a
checked reason rather than an assumption.

- [x] **The force-directed map is gone; the cast is laid out on cluster discs.** Faction clustering is the
  default axis and places are the other; each disc carries its own `+N` for the cast no accepted relationship
  line reaches, and dragging a character pins it where the author dropped it. The geometry is a pure function
  (`packages/novel-workbench/src/client/story-map-layout.ts`) so the ring maths, the folding rule and the pin
  rule are asserted without WebGL; the view only feeds sigma and translates mouse events into state.
  `graphology-layout` and `graphology-layout-forceatlas2` left the bundle, the dependencies and the lockfile
  (46 deletions, 0 additions) — `lib/client.js` 1,611,088 B → **1,569,730 B**.
- [x] **Three defects that only the real browser showed, all fixed.** ① The disc overlay was an SVG sized by
  `inset: 0` alone, which leaves a replaced element at its intrinsic 300×150, so every disc was drawn off the
  visible strip; ② sigma frames the nodes it is handed while a disc is wider than the members it holds, so the
  rims were cut and any Canon change rescaled the whole map — the graph now carries two zero-size framing
  anchors on the layout's own content box; ③ the `+N` sat inside the rim and collided with member labels.
  A fourth defect was in my own new smoke check, which compared the overlay against the stage's *border* box.
- [x] **Real-machine evidence** (`docs/evidence/editor-2026-09-17/probe-map-clusters.mjs`): overlay and sigma
  canvas both 894×492 with the disc fully inside; `+3` opens to 0 folded with the cast count unchanged; the
  axis switch really regroups; a drag that misses the cast pans the camera by exactly the drag delta (so the
  overlay does not swallow the gesture); a drag on a character raises `解除全部钉位（1）`; 0 console errors.
- [x] §4.3 targeted breakage: **10/10 mutations bitten**, three source files restored byte-for-byte. One of them
  hung vitest instead of failing, which exposed a wasted re-render in the search path — now guarded.
- [x] **Not built, on purpose: 只看本卷.** Both accepted story events carry `manuscriptOrder: null` and the
  work has one volume, so a volume filter cannot change a single pixel today. Building it would be a control
  that honors nothing, which is the rule this project keeps relearning. Recorded in `I6.1b` with the path to do
  it honestly once the data exists (extend the projection, do not fake the filter).
- [x] Gates: **411/411** tests (27 files; +10 layout, +2 view), `typecheck`, `lint`, `git diff --check`, and the
  sweep's map screen now asserts the framing, the discs, the axis and a `+N` that really reopens.
- [ ] Author review of the map's look is still outstanding, as it is for every ported screen.

## Front-end wrap-up: settings honesty and story-map scale, 2026-09-17

**Status:** `verified` live on the rebuilt Host for both changes; two prototype features deliberately
not built, with reasons recorded.

- [x] **设置 dropped a control it could never honor.** 「线程里的工具活动」only wrote to the client store —
  the transcript is rendered by the *shipped* conversation surface and `node_modules/@deepseek-ai/` holds no
  tool-activity switch to proxy, so the choice could be remembered and never applied. Removed together with
  `WorkbenchSettings.showToolActivity` and `setShowToolActivity`; the sheet now offers exactly 主题 / 正文大小 /
  阅读行宽. RED → GREEN in `novel-workbench-settings.spec.ts`, whose new assertion is the invariant: the sheet
  must not carry a control the frame cannot deliver.
- [x] **The sweep now guards that invariant**, not just this instance: `sweepSettings` opens the sheet, records
  `unhonorableControl`, and fails the `settings` screen as `offers-unhonorable-control` if
  `[data-novel-settings-activity]` ever comes back. It is the 16th screen in the sweep.
- [x] **Story map scale: folding + search.** A character no accepted relationship line reaches is no longer an
  unconnected dot: they fold into one `+N 位未连线人物` chip (names in its `title`, click to unfold). Live on the
  real Canon it folds **3 of 7** people while the header keeps the accepted totals (`R5 · 7 个人物 · 3 条关系`),
  so "what the graph draws" and "how many people Canon accepted" stay distinguishable. Search focuses by accepted
  name or id through the same fade-and-card path a click uses, unfolds the cast first when the match lives there,
  and says `没有匹配的人物。` when nothing matches. RED → GREEN in `novel-workbench-story-map.spec.ts` (2 new tests).
- [x] **Not built, on purpose.** 按卷 / 弧筛选 needs volume/arc ownership on the nodes, which `NovelStoryMap`
  does not carry — that is a projection gap, not a front-end gap, and a fake filter would be worse than none.
  钉位 is pure UI state with no persistence home yet, so it first needs a decision on whether pins survive
  reload; that is a design question, not wrap-up, and it is left open rather than half-built.
  *(Superseded in part, 2026-09-17: `I6.1a` builds pins as session state, explicitly without persistence;
  按卷筛选 stays open for a sharper reason — see the entry above.)*
- [x] Live re-verification on the rebuilt profile (`pid 63093`): 16 screens — **15 `rendered`, 1 honest
  `skipped-no-proposal`**, zero console/page/request failures; the map reports `+3 位未连线人物` and the settings
  sheet reports `unhonorableControl: false`. Record and sweep JSON refreshed.
- [x] Gates: 324/324 tests (19 files, +2 for the new map behaviours), `typecheck`, `lint`, `git diff --check`.
- [ ] Still open from the previous entry: the seven surfaces that need a write, another profile or a real
  failing turn (`提案审阅`, `过期提案`, `接受设定·拒绝正文`, `人物档案抽屉`, `空项目`, `缺插件`, `AI 无输出`),
  and any visual-fidelity review of the ported screens by the author.

## Front-end work landed as a reviewable delivery, 2026-09-17

**Status:** `verified` for the record itself — the 2026-09-16 front end is committed in three slices,
its live evidence is reproducible from the repo, and the stale status index is refreshed.

- [x] Committed the 2026-09-16 work in three green, single-purpose slices: `novel-project`'s Canon
  guidance + `chapterControlPack`; the whole `novel-workbench` prototype port (48 files); then this record.
  The 2,700-line worktree had no recovery point before this. The first attempt swept in a test rename the
  index had already staged — `git status` column 1 is not empty in this checkout, so check it before
  `git add` — and was redone.
- [x] `scripts/smoke-workbench.mjs`: the one-off `/tmp` CDP sweep is now a committed, dependency-free
  script (Node 24 `WebSocket` + the local Chrome; no Playwright, because the repo has no browser
  automation dependency and one smoke script does not justify adding one). It walks the 14 readable
  surfaces, screenshots each, collects console/page/request failures, and reports the write-path
  surfaces as `skipped-*` rather than faking them.
- [x] Its own two defects, found by reading its output rather than its exit code: `textContent` folded each
  canvas's inline `<style>` into the record, and the exit code counted an honest skip as a failure. Both
  fixed; `innerText` now matches what the author sees.
- [x] Live evidence recorded in [the front-end record](../docs/novel-mode-front-end-2026-09-16.md) plus the
  machine-readable [sweep JSON](../docs/novel-mode-front-end-sweep-2026-09-17.json). The 14 rendered
  surfaces were verified against accepted Canon at **R5**, with zero browser failures. It also confirms
  the numbers the previous entry claimed.
- [x] The record states the boundary it does not cover: 提案审阅 / 过期提案 / 接受设定·拒绝正文 (no pending
  proposal existed), 人物档案抽屉, and the 空项目 / 缺插件 / AI 无输出 states all keep their older evidence
  and are **not** re-claimed. No author review of visual fidelity is recorded either.
- [x] Profile install path fixed in both `install-plugins.sh` and `.ps1`: tarballs move from the OS temp
  directory into `<checkout>/.novel-agent/packages`, because the installed profile's lockfile pins the
  resolved `file:` path and dies with the temp directory. Cold start verified: `/var/folders` references
  in the profile lockfile went 6 → **0**, the Host restarted, and the full sweep passed on the fresh install.
- [x] `docs/claude-desktop-parity-matrix.md` gained a **Novel-mode front end — 2026-09-16** section, and the
  Host-composition and Workspace/Sidebar/Composer rows were corrected (they still described a
  `novel-project`-only install). Every new row is scoped to the Web Host.
- [x] Gates: 322/322 tests (19 files), `typecheck`, `lint`, `git diff --check`, and
  `node scripts/port-prototype-css.mjs --check` all clean.
- [ ] The sweep's seven uncovered surfaces still need a live run — most need a write (a pending proposal)
  or a second profile, so they belong with whoever drives the next real model turn.
- [ ] Unchanged and still open: the 12-chapter acceptance of `tasks/plan-final.md` §6. The dev profile's
  accepted work is a 穿越/系统 manuscript (`/private/tmp/nw-workspace/天机阁主`), **not** 《雾港夜航》.

## Novel-mode front end — final per-screen matrix, 2026-09-16

**Status:** every prototype screen is `verified` live on the running Host (profile `novel`, port 4780)
against real accepted Canon at **R5** (5 revisions, 7 people, 3 relationship lines, 6 promise/clue/mystery
facts, 2 story events, 1 accepted chapter of 213 characters). Screenshots and CDP dumps are listed per row;
the sweep itself is `/tmp/nwsweep.json` + `/tmp/nwsweep-<view>.png`.

| Prototype screen | Live evidence | State |
| --- | --- | --- |
| ① 工作台 (故事地图 + 三段左栏 + 右栏 + 底部输入) | `/tmp/nwsweep-map.png` — `R4 · 7 个人物 · 3 条关系` with sigma painting the accepted cast | verified |
| ② 提案审阅 | `/tmp/nwrev2-review.png`, `/tmp/nwacc-staged.png` — route line, 逐条 接受/拒绝, 审阅问题, 影响预览 | verified |
| ③ 过期提案 | `/tmp/nwreviewprobe.png` — real stale packet: `此提案已过期 · 它基于 R2，当前已是 R3，只能丢弃` + 丢弃提案, then discarded (`/tmp/nwdiscard.json`) | verified |
| ④ 接受设定·拒绝正文 | `/tmp/nwacceptloop-round1.png` — `已接受 2 条设定变更，正文未接受（R3）` | verified |
| ⑤ 正文阅读 | `/tmp/nwsweep-read.png` — the accepted 213-character chapter in the serif reading canvas at the author's chosen size/measure | verified |
| ⑥ 人物档案 | `/tmp/nwperson-drawer.png` — aspects under Canon's own field names, both directions, appearances | verified |
| ⑦ 伏笔与线索板 | `/tmp/nwsweep-clues.png` — 6 accepted promise/clue/mystery cards with anchors | verified |
| ⑧ 未收束债务 | `/tmp/nwfinal-debts.png` — **3 real debts** after R5, with clock labels (世界 / 关系 / 谜团), summaries, 回收窗口, age and the two row actions | verified |
| ⑨ 时间线 | `/tmp/nwsweep-timeline.png` — accepted story events in story order, last one 当下 | verified |
| ⑩ 写作记忆 | `/tmp/nwsweep-memory.png` — newest accepted facts with the revision they took effect in | verified |
| ⑪ 版本历史 | `/tmp/nwsweep-history.png` — R4/R3/R2/R1 with 回滚到此版本 and the real rollback warning (`/tmp/nwconfirm-rollback.png`) | verified |
| ⑫ 线程对话流 | `/tmp/nwtrig-slash.png`, `/tmp/nwstrip4.png` — shipped transcript with working `/` commands and `@` references, plus the novel header's revision, waiting-proposal and failed-turn strips | verified |
| ⑬ 进阶面 | `/tmp/nwadvview.png` — 内核 / 插件清单 (**155 real plugin rows**) / Agent preset (**4 real presets**) / Cordis 插件树 / 任务 / Subagent / 诊断 | verified (Cordis tree empty: this deployment holds no model-defined plugins) |
| ⑭ 夜间关键屏 | `/tmp/nwtheme-night.png` — `data-nw-theme="night"`, frame `rgb(48,48,46)` | verified |
| ⑮ 边界态 | 空项目 `/tmp/nwadopt2-form.png`; 加载中 (per-canvas 正在读取…); 缺插件 `/tmp/nwmin2-contract.png`; AI 无输出 `/tmp/nwstrip4.png`; 窄窗 1280 `/tmp/nwtheme-narrow.png` (frame 1280, rail 248, no horizontal scroll) | verified |

**How the last two panels were populated, and the one boundary that stays:**

- 未收束债务 was 0 until R5. Chasing it produced a useful fact: `narrative-debt` is its own delta kind
  (`unitId` + `field` = one narrative clock + `{summary, status, horizon?}`) and needs **no** anchors — unlike
  `narrative-clock` moves, which the planning validator refuses without at least one source anchor. A
  three-debt packet (mystery / world / relationship on chapter 1) was accepted as **R5** and the panel now
  renders them with their clocks, horizons and ages (`/tmp/nwfinal-debts.png`, `/tmp/nwfinal.json`).
- Cordis 插件树 is 0 because this deployment has no model-defined Cordis plugin; the panel reads
  `dynamicCordisRunner.inventory()` live and renders the honest empty sentence. Populating it means defining a
  dynamic Cordis plugin through the runner (a product action, not a front-end gap).
- 设置's 线程里的工具活动 is stored but not yet applied — the shipped conversation surface renders tool
  activity, so the sheet says so instead of implying an effect it does not have.

## Prototype-driven front end — the AI 无输出 boundary, 2026-09-16

**Status:** `verified` live against a real failed turn.

- [x] **The state existed and the author could not see it.** Driving a real failure (the same profile run with
  an invalid `DEEPSEEK_API_KEY`) produced a durable `turn/end` with
  `reason: {kind: 'error', code: 'AUTH', message: 'Authentication Fails, Your api key: ****test is invalid'}`
  — and the UI showed **nothing**: no alert node, no error text, no retry, just a quiet thread. Evidence:
  session log plus `/tmp/nwfail-after.png` and an empty DOM probe (`/tmp/nwfailstate.json`).
- [x] **Root cause, from the shipped code**: the snapshot's `lastAgentError` is fed by
  `handleAgentError` ← the `api-session/error` relay, which is "the outlet for live failures **with no turn
  position**". A turn that ends in error never reaches it, so the front end had no source for this state.
- [x] **Fix, using the authoritative source**: the plugin mirrors the current session's durable event window
  (`binding.eventSource`) and publishes the last failed `turn/end` into the workbench store; the novel thread
  strip renders it as `上次生成失败 <Host message>` with `重试上一句` when the novel bar knows the sentence
  it sent (the composer remembers its last accepted submission and resends it through the same submission
  echo). RED → GREEN in `novel-workbench-failure.spec.ts`; the advanced spec's header fixture gained the
  session-snapshot stub.
- [x] Live after the fix: `/tmp/nwstrip4.png` shows the strip on the failed thread with the Host's message
  (`Authentication Fails, Your api key: ****test is invalid`); the retry button is correctly absent for a
  turn the *official* composer sent, because the bar never learned that sentence (test covers the retry path
  for bar-sent turns).
- [x] Key restored and the profile proven healthy again: the host now runs with the real credential and a
  fresh turn completed (`turn/end {"kind":"completed"}`, reply 「恢复」).
- [x] Gates: 320/320 tests (18 files), `typecheck`, `lint`, `git diff --check` clean.
- [ ] Last surface outstanding: 进阶面's Cordis tree and plugin inventory.

## Prototype-driven front end — the 缺插件 boundary, 2026-09-16

**Status:** `verified` live against a real minimal profile.

- [x] `MissingPluginCard` + `missingDomainPlugin`: Novel Project's domain-unavailable answer
  (`novel project has no 'planning/narrative' projector registered; install the domain plugin that
  registers it`) is recognised and rendered as the prototype's card — 缺插件 chip, the namespace, the plugin
  the author has to install, what stops working, 重试检测 and 回到地图 — instead of a raw error string. The
  rail says the short form of the same thing. RED → GREEN in
  `novel-workbench-contexts.spec.ts` (card) and `novel-workbench-rail.spec.ts` (rail copy).
- [x] **Live evidence on an isolated minimal profile** (`.novel-agent/dsh-home/profiles/novel-min` =
  `dsh-base + dsh-web-app + novel-project + novel-workbench`, host on `127.0.0.1:4782`): the 本章合同 canvas
  renders the card verbatim (`缺插件 / planning/narrative / 未安装小说规划插件（novel-planning）` +
  重试检测 + 回到地图) while the rail, context column and composer row keep working — screenshot
  `/tmp/nwmin2-contract.png`. The smoke host was stopped afterwards; the profile stays for future checks.
- [x] A real finding about the plugin graph, from trying the obvious composition first: removing **only**
  `novel-planning` (keeping writing / memory / review) does not degrade — the Host refuses to boot
  (`3 entries did not activate: novel-memory waiting for novelPlanning, novelWriting; novel-review waiting
  for novelPlanning, novelWriting, novelMemory; novel-writing waiting for novelPlanning`). The domain
  plugins hard-require planning, so 缺插件 in this product means a *minimal* composition (novel-project +
  workbench), not a profile with one plugin missing. Worth deciding later whether that hard dependency is
  the product's intent; it is not a front-end question.
- [x] Gates: 319/319 tests, `typecheck`, `lint`, `git diff --check` clean; the main dev host (profile
  `novel`, port 4780) is the only host still running.
- [ ] Last boundary state outstanding: AI 无输出 (a turn that produces nothing). The shipped conversation
  surface owns that rendering, so verifying it means driving a real failing turn and reading its error
  card — worth doing before calling the boundary set complete.
- [ ] Then the last surface: 进阶面's Cordis tree and plugin inventory.

## Prototype-driven front end — the `/` and `@` boundary, 2026-09-16

**Status:** `verified` live. The triggers exist in the product and the novel bar routes to them instead of
re-implementing the input machine.

- [x] Live proof that `/` and `@` are real capabilities (`/tmp/nwtrig-slash.png`, `/tmp/nwtrig-at.png`):
  typing `/` in the shipped composer lists the Host's own commands (compact / export / feedback / goal /
  permission / plan / model), and typing `@` lists the real work directory (`12-创作中枢/`, `outputs/`,
  `04-设定大全.md`, …) and the real conversations.
- [x] `NovelComposer` now refuses to send a draft that opens with `/` or `@` and offers
  「`/` 指令与 `@` 引用在线程输入框里可用：切到线程输入」. The reason is architectural, not cosmetic: the
  trigger pipeline (`InputTriggerController.track(draft, caret, guard, draftRev)`) mutates the shipped
  per-session input machine with a draft revision and dispatches its pick outcomes through that machine's
  scoped events — rebuilding it in the novel bar is exactly the second input machine H1 forbids, so the bar
  hands the author to the surface that owns it. Live: `/tmp/nwtrigbar-slash.png`, dump
  `/tmp/nwtrigbar.json` (`hint: true`, `sendDisabled: true`, draft preserved).
- [x] Normal submission from the bar still works from the story map (the same run added a thread whose title
  came from the model's reply).
- [x] Gates: 317/317 tests, `typecheck`, `lint`, `git diff --check` clean; host rebuilt and live.
- [ ] Remaining in scope: 进阶面's Cordis tree and plugin inventory, and the two boundary states
  (缺插件, AI 无输出). The pending proposal `tiangege-status-r2-2026-09-16` is still waiting for an author
  decision (it was kept so the accept sheet stays demonstrable).

## Prototype-driven front end — confirmation sheets and the anchor rule, 2026-09-16

**Status:** `verified` live for both sheets; the proposal-filing friction behind them is fixed and
re-verified by a real model turn.

- [x] 接受本章 now confirms before writing, like the prototype's 弹层: the button opens a sheet that states
  the real impact (`R2 → R3：正文 0 篇 · 设定变更 2 条 · 未采纳建议 0 条`), the rollback note, and
  返回调整 / 确认接受 R3. Nothing reaches the Host until the author confirms. Live:
  `/tmp/nwaccsheet-sheet.png`, dump `/tmp/nwaccsheet.json` (返回调整 left the proposal pending).
- [x] 版本历史's rollback confirmation carries the prototype's own explanation with the real revisions:
  `回滚会把故事事实退回 R1：R2 到 R2 之间接受的正文与设定变更全部停用（不会被删除，历史里仍然查得到）`.
  Live: `/tmp/nwconfirm-rollback.png`.
- [x] **The real blocker behind three failed model turns is fixed.** A packet may carry
  `sourceAnchors: []` and empty per-delta `sourceAnchorIds` — anchors are optional, and a present anchor
  must carry the exact SHA-256 of its byte range. The model did not know that: it spent whole turns
  grepping for content to hash and never filed anything (22 `bash` calls, no proposal). The tool
  description and `novel_canon` guidance now say anchors are optional and must never be guessed; a
  re-run filed a two-delta proposal **in one turn** with `sourceAnchors: []`
  (`tiangege-status-r2-2026-09-16`, 2 deltas, 0 anchors in the durable inbox).
- [x] Gates: 316/316 tests, `typecheck`, `lint`, `git diff --check` clean; host rebuilt and live.
- [ ] That pending proposal was deliberately left unaccepted so the accept sheet stays demonstrable; accept
  or discard it before turning the profile over to an author.
- [ ] Still open: composer `/` and `@` triggers, 进阶面's Cordis tree and plugin inventory, and the
  boundary states 缺插件 and AI 无输出.

## Prototype-driven front end — 人物档案 drawer, 2026-09-16

**Status:** `verified` live from the cast board, `verified` by test from the story map.

- [x] `buildPersonFile` + `PersonFileDrawer` + `PersonFileSeat`: one person's accepted file —
  every aspect under Canon's own field name, the relationship lines that name them with **both**
  directions written out, and the accepted story events that list them as a participant (which is how
  the file knows their chapters without inventing an appearance index).
- [x] Opened two ways, matching the prototype: 看档案 on a 人物与关系 card, and double-clicking a node on
  the story map (`StoryMapView` now subscribes to sigma's `doubleClickNode` and hands the node to the
  frame store, which the drawer seat reads). The map's callback is `useCallback`-stable so the sigma
  renderer is not rebuilt on every render.
- [x] Live evidence (`/tmp/nwperson-drawer.png`, dump `/tmp/nwperson.json`): opening `junlinyuan` on the
  real R2 work shows `档案：1 条已接受设定` with the accepted aspect rendered under its own field name
  (`thread`), 关系 0 条 and 出场 0 个 with honest empty copy, 关闭 and 让 AI 从这个人物继续写. The map
  double-click path is proven in `novel-workbench-story-map.spec.ts` by firing the registered handler
  and asserting the frame store receives the node id.
- [x] Gates: 316/316 tests (17 files), `typecheck`, `lint`, `git diff --check` clean; host rebuilt and
  live (pid 61214).
- [ ] Still open: composer `/` and `@` triggers, the accept / rollback confirmation sheets, the 进阶面's
  Cordis tree and plugin inventory, and the two unverified boundary states (缺插件, AI 无输出). Canon
  still holds no relationships, so the drawer's relation block and the map's edges stay empty until a
  relationship proposal is accepted.

## Prototype-driven front end — simulation canvas and the settings sheet, 2026-09-16

**Status:** `verified` live. All nine rail entries are now real surfaces, and the 设置 sheet drives the
reading canvas instead of just remembering a preference.

- [x] `SimulationView` (推演): the prototype draws this screen as 沙盒侧车未连接 with disabled forms. The
  canvas now says what is true — the two experiments are real Agent tools (`simulate_novel_reader_response`,
  `simulate_novel_story_world`) that run in a thread against a frozen accepted revision and never advance
  Canon, while the external MiroFish sidecar is not connected. It lists each tool's own parameters (read out
  of the registered tool schemas, not the prototype's sample), shows the revision Canon would freeze
  (固定版本 R2), and hands the author to a thread. Live: `/tmp/nwsim-simulation.png`.
- [x] `NovelSettings` (设置) in the frame's `shell.overlay` seat plus the topbar's 设置 button: theme,
  正文字号 16/17/18, 阅读行宽 34/40 字, and 线程里的工具活动 显示/收起. The reading choices are real — the
  正文阅读 canvas applies them as its own type size and measure (asserted in
  `novel-workbench-contexts.spec.ts` with an accepted manuscript), and the sheet closes on 完成, on Escape
  and on a backdrop click. Live: sheet opened from the topbar with all four choices
  (`/tmp/nwset-sheet.png`, dump `/tmp/nwset.json`).
- [x] With this, every rail entry is `ready: true` and renders: 故事地图 / 伏笔与线索 / 未收束债务 /
  人物与关系 / 时间线 / 写作记忆 / 本章合同 / 推演 / 版本历史 (+ 提案审阅 from the waiting-proposal entry).
- [x] Gates: 314/314 tests, `typecheck`, `lint`, `git diff --check` clean.
- [ ] The 进阶面's Cordis tree and plugin inventory are still the shipped panels: their inventory does not
  arrive over a Remote a novel surface can simply read (the Cordis host-runner exposes it through the
  runner's own dispatch/approval flow), so re-rendering them needs that flow read through the same seam
  rather than a new one. Jobs, Subagent and the raw Canon projection are already novel-rendered.
- [ ] Still open overall: `/` command and `@` reference triggers in the composer, 人物档案抽屉, the accept /
  rollback confirmation sheets, and the boundary states 缺插件 and AI 无输出.

## Prototype-driven front end — cast board and the composer row, 2026-09-16

**Status:** `verified` live for both. Eight of the nine story surfaces now render, and the composer bar the
prototype keeps on every screen is real: a draft typed on 故事地图 reaches the Host and the model answers.

- [x] `CastView` + `buildCastBoard` (人物与关系): people, the factions they answer to, and every
  relationship line with **both** directions written separately — Canon stores each direction on its own, so
  the board never infers one from the other. Live: `5 人物 · 4 势力 · 0 条双向关系`, each person card showing
  their accepted aspects and a readable one-line summary (`/tmp/nwcast2-cast.png`, dump `/tmp/nwcast2.json`).
- [x] Reading the AI's *shape*, not a guessed key list: the model records character facts one aspect at a
  time (`constitution`, `realm`, `persona`, `mechanism`, …) with no `name`/`status` field, so the mapper
  falls back to the entity id, shows "N 条设定", the aspect names Canon holds, and the first aspect as the
  summary. Verified against the real accepted deltas before writing the code.
- [x] `NovelComposer` in the frame's `novel.composer` seat: the bar shows the thread, a textarea and 发送,
  and submits through the Session Controller's own verbs (`beginSubmission` → `prompt`) so the queue, echo
  and failure semantics stay the Host's. Live: typed a prompt on the 故事地图 screen, the Host accepted it,
  the model answered and a new thread appeared in the rail (`/tmp/nwbar-before.png`, `/tmp/nwbar-sent.png`).
- [x] Gates: 311/311 tests (composer spec added), `typecheck`, `lint`, `git diff --check` clean.
- [ ] Not yet in the bar, and honestly missing: `/` command and `@` reference triggers (the shipped
  `dsh-client-ui-input-trigger` service is the right seam), image attachments, model/permission indicators.
- [ ] 推演 (simulation) is still the one disabled rail entry; the advanced panels (Cordis tree, plugin
  inventory, presets, jobs, diagnostics, event log) are still the shipped ones, reachable only from the
  conversation view.
- [ ] Boundary states still unverified: 缺插件 (profile without `novel-planning`) and AI 无输出.
- [ ] Data gaps unchanged: 0 relationships and 0 open debts in Canon, so those two surfaces show counts of
  zero; the manuscript reading path still has no accepted text.

## Prototype-driven front end — first accepted Canon, dense screens, 2026-09-16

**Status:** `verified` for dense rendering of seven story surfaces against accepted Canon, and for the two
extra boundary states the brief lists (夜间, 窄窗 1280). The work now has a real R1/R2 with 22 accepted facts.

- [x] **The acceptance path works end to end.** R1 was accepted through the product's own 提案审阅 screen
  (5 narrative-unit deltas: series → book → volume → arc → chapter), then R2 with 22 facts (8
  character-state, 6 faction-state, 3 promise, 2 clue, 1 mystery, 2 story-event). Evidence:
  `/tmp/nwstruct-accepted.png`, `/tmp/nwacc2-accepted.png`, and storage
  `.novel-agent/dsh-home/storages/novel_project.json` → `acceptedRevision: 2`.
- [x] **Dense screens captured from the running Host** (`/tmp/nwden-*.png`, dump `/tmp/nwden.json`):
  故事地图 `R2 · 5 个人物 · 0 条关系` painting five real sigma nodes; 伏笔与线索板 6 cards with kind chips,
  lifecycle words and evidence anchors; 时间线 two story events with 第 N 天 labels and 当下 marker;
  写作记忆 the two newest facts with `R2 起生效`; 本章合同 the full contract sheet for chapter 1;
  版本历史 R2/R1 rows with 回滚到此版本; 未收束债务 the honest empty state.
- [x] **Two real UI defects the live data exposed, both fixed with RED→GREEN:**
  - the work tree grouped chapters by their immediate parent, which the real chain (chapter → arc → volume)
    turned into `篇章四`; it now groups by the Volume and names the heading after it (`卷一 · 天机入世`).
    `buildWorkOutline` + test in `novel-workbench-contexts.spec.ts`.
  - a Volume's objective is a full sentence, which wrapped one character per line in the 248 px rail; the
    heading now truncates inside the column (screenshot `/tmp/nwrail-clues.png`).
- [x] 正文阅读 stops pretending to load: a chapter with no accepted manuscript now says
  「这一章还没有被接受的正文。」(canvas test + live dump `/tmp/nwfin.json`).
- [x] Boundary states verified live: 空项目 (the welcome/adopt screen), 加载中 (正在读取… per canvas),
  夜间 (`data-nw-theme="night"`, frame `rgb(48,48,46)`), 窄窗 1280 (frame 1280, rail 248, no horizontal
  scroll).
- [x] Canon guidance corrected against the domain's own validator (`REQUIRED_PARENT_LEVEL` in
  `novel-planning/src/projection.ts`): the chain is `series → book → volume → arc → chapter → scene → beat →
  prose`, one level per step. My previous sentence had skipped `volume`, which is exactly the mistake that
  cost three model turns — evidence that the recipe has to be copied from the validator, not memory.
- [x] Gates: 309/309 tests, `typecheck`, `lint`, `git diff --check` clean; dev host live (pid 50618 rebased
  to the current build) with the API key inherited.
- [ ] Still not built in the novel surface: 人物与关系 (cast) and 推演 (simulation) canvases (both still
  disabled in the rail), the advanced panels (Cordis tree, plugin inventory, presets, jobs, diagnostics,
  event log) and the composer row the prototype keeps on every screen.
- [ ] Boundary states not yet verified: 缺插件 (a profile without `novel-planning`) and AI 无输出.
- [ ] Data gaps, not UI gaps: 0 relationships (the facts packet carried none) and 0 open debts, so the story
  map draws nodes without edges and 未收束债务 stays empty; a relationship/debt proposal or an accepted
  manuscript chapter would exercise those paths.

## Prototype-driven front end — work adoption and the review loop, 2026-09-16

**Status:** `verified` for the adoption flow and for the review screen rendering a real proposal. The empty
profile can now become a work entirely inside the novel product, and the first real proposal was reviewed in
it. Dense Canon is still missing: the AI's packet violates a Canon rule and the Host refuses the whole packet.

- [x] `NovelWelcome.tsx` + face methods `adoptWork(path)` / `pickWorkDirectory()`: the 空项目 canvas now owns
  the first step. It composes the Host's own chooser (`UiWorkspace.pickDirectory`) with the Workspace
  Controller's `create({ path })`, so the Host mints the Workspace id and the Novel Project binding can never
  drift; a typed path works too, and the Host's failure text is shown unchanged. RED → GREEN in
  `tests/novel-workbench-adopt.spec.ts` (3 tests). **Live-verified**: the form adopted
  `/private/tmp/nw-workspace/天机阁主` in the running product (screenshot `/tmp/nwadopt2-form.png`,
  state `/tmp/nwadopt2.json`), and `workspace.json` then carried the Host-minted id
  `b7cc9537-…` with path `/private/tmp/nw-workspace/天机阁主`.
- [x] The frame mirrors the Session Controller's current selection into the workbench store
  (`workbenchActions.setCurrentSession`, subscribed in the plugin). Before this the context column never
  appeared: a slot registration renders once, so the frame kept the session it saw at mount. Verified live —
  the right column and its 待审提案 card now render as soon as a thread opens.
- [x] The default canvas is 故事地图 (the prototype's first screen), and 新建线程 switches the column to 线程,
  so the author's first screen is the workbench and the composer appears when they ask to talk.
- [x] **Live: 提案审阅 with a real proposal.** A real DeepSeek turn (after its own long packet-building loop)
  produced a **47-delta pending proposal** — 2 creative-profile, 5 narrative-unit, 16 character-state,
  12 faction-state, 5 promise, 3 clue, 1 mystery, 3 story-event — and the canvas rendered its route line
  (`R0 → R1`), 逐条 接受/拒绝 rows, 审阅问题 and the 影响预览 error verbatim. Screenshots
  `/tmp/nwrev2-review.png`, `/tmp/nwacc-staged.png`.
- [x] Canon guidance now carries the rule the AI kept breaking: `series → book → arc → chapter → scene →
  beat`, plus the fact that **every delta of a packet is validated together**, so an author cannot rescue an
  invalid packet item by item. Asserted in `novel-project.spec.ts`.
- [ ] **Blocker for dense Canon (product-level, reproduced 3×):** the AI writes Chapters whose parent is a
  `book`; acceptance then fails with `narrative unit 'vol01-ch0001' at level chapter requires parent level
  arc, got book`. Rejecting those five rows on the review screen does not help — the Host validates the whole
  packet — so the author can only discard the proposal and ask again. The guidance fix is in but not yet
  re-verified against a fresh model turn.
- [ ] Second real friction, from the same session: building an R0 packet took the model ~50 tool calls and
  >10 minutes, with a 41 KB helper script written into the work directory. Worth a smaller setup entry
  (a domain-owned setup helper or a documented minimal packet) before calling the setup path usable.
- [ ] Still open from the previous increment: dense-data screenshots (故事地图 / 伏笔与线索 / 未收束债务 /
  时间线 / 写作记忆 / 本章合同) need accepted Canon; the advanced panels and the composer row are untouched.

## Prototype-driven front end — context canvases, 2026-09-16

**Status:** `implemented-unverified` for dense data, `verified` for routing and empty states on the real
Host. Five of the nine story surfaces now render from accepted Canon instead of a placeholder, and the
whole product was driven end to end by a real DeepSeek turn for the first time.

- [x] `chapterControlPack` on the novel-project Typert boundary: the 本章合同 canvas needed the control pack
  Memory assembles, and Canon owns the read. The Remote is a thin delegate to the `novelMemory` service, so
  the boundary stayed on one namespace (product-boundary now asserts 15 invocations, all `novelProject`).
- [x] Mappers in `novel-data.ts` — `buildClueBoard` (promise / clue / mystery facts with lifecycle words and
  the chapter their anchor names), `buildDebtBoard` (open debts aged by how long **their own clock** stood
  still, stalest first, resolved debts off the board), `buildChapterContract` (viewpoint, story time, must
  appear, forbidden contradictions, length range, acceptance gates, scenes, and the references Canon cannot
  resolve as explicit gaps), `buildTimeline` (accepted story events in story-time order, last one 当下) and
  `buildMemoryBoard` (newest accepted facts with the revision they took effect in).
- [x] Views `ClueBoardView.tsx`, `DebtBoardView.tsx`, `ChapterContractView.tsx`, `TimelineView.tsx` and
  `MemoryView.tsx` draw the prototype's cards, rails and sheets with the ported class names; the rail marks
  all five entries `ready`.
- [x] RED → GREEN captured for each mapping and each view (`packages/novel-workbench/tests/novel-workbench-contexts.spec.ts`,
  8 tests) plus the shell spec (3 tests). Gates: 304/304 tests, `typecheck`, `lint`, `git diff --check`.
- [x] Real Host evidence (pid 29304, `127.0.0.1:4780`): a real DeepSeek turn ran the full product loop —
  rail → official composer → Host → model → streamed reply — and a second turn produced a real pending
  proposal of **50 deltas** (series/book/3 chapters with contracts, creative profile, reader contract, 6+
  character and faction facts) via `propose_novel_result_packet`. Screenshots `/tmp/nwreal-*.png`.
- [x] All nine surfaces route to the right canvas on the live Host (CDP pass, `/tmp/nwviews.json`): the five
  new ones show their real empty states against an R0 work, 版本历史 shows 还没有已接受版本.
- [ ] **Dense-data render is unverified.** Accepted Canon is still empty, so 故事地图 / 伏笔与线索 / 未收束债务 /
  时间线 / 写作记忆 have only been seen with zero rows. The pending 50-delta proposal was never accepted.
- [ ] **Workspace creation in the novel profile is still blocked** (live-verified twice): the composer's
  workspace chip toggles `aria-expanded` but neither the picker menu nor the directory flow appears, so a
  new author cannot adopt a folder from the UI. Seeding `workspace.json` by hand works only when the
  workspace id is the one DSH itself minted — a path-based id I invented made Novel Project reject the
  binding (`has a conflicting DSH Workspace binding`), which is what a real user would hit if the id drifted.
- [ ] Next: adopt a folder through the app so the id is Host-minted, then accept a slice of the pending
  proposal and screenshot every canvas with real rows; then re-render the advanced panels (Cordis tree,
  plugin inventory, presets, jobs, diagnostics) inside the novel surface and fill the composer row.

## Prototype-driven front end — shell assembly, 2026-09-16

**Status:** `verified` for the shell on the real Host (pid 21037, `127.0.0.1:4780`). The prototype is now the
design source of truth: the frame renders the ported stylesheet and the prototype's `.app` grid
(topbar / rail / canvas / side / composer), and the navigation column is the prototype's three groups with
the 进阶 entry. The contexts and canvases that the prototype draws beyond 故事地图 / 版本历史 / 提案审阅 are
still the old surfaces, so their `ready: false` entries stay disabled.

- [x] `scripts/port-prototype-css.mjs` + `packages/novel-workbench/src/client/workbench-css.ts`: the
  prototype's 38 KB stylesheet is ported verbatim as the product stylesheet. The generator only drops the
  prototype's own screen switcher and demo page floor and binds the night selector to the frame
  (`[data-novel-workbench="frame"][data-nw-theme="night"]`) or the host dark theme. `--check` mode fails
  when the module drifts from the prototype.
- [x] `WorkbenchFrame.tsx` renders `.app` — `data-novel-topbar`, the three sections
  (`data-novel-shell="left|main|right"`) and `data-novel-composer` — and declares two new seats, `novel.topbar`
  (root) and `novel.composer` (session-maybe). It hands the Session down from `sessions.list` through the
  root registration's inject factory and scopes the strict `details` seat with `SessionProvider`, so the
  right column only renders with a live Session.
- [x] `NovelTopbar.tsx`: work title from the workspace registry, `R<n>` from Novel Project, the chapter
  context line, and the 进阶 / 跟随系统·日间·夜间 / 左栏 switches.
- [x] `NovelRail.tsx` (replaces `NovelSidebar.tsx`): the prototype's 作品 (volume heads + chapter rows with
  status dot, debt mark and 已接受/待审/计划中 tail), 线程 (real sessions minus subagent transcripts, plus
  新建线程) and 视图 (the nine story surfaces, unbuilt ones disabled) groups, 进阶 groups and the rail-foot
  toggle.
- [x] `NovelSide.tsx`: the context column's 当前章 / 待审提案 / 最近 AI 活动 blocks, fed by
  `loadOutline` / `loadReviews` / `loadManuscript` (first character-count read of accepted Canon).
- [x] `NovelCanvas.tsx` emits the prototype's `main-head` (title + one-line summary) and `main-body`, and
  gained the 正文阅读 canvas reading accepted manuscript text.
- [x] `cordis.patch.yml` also disables `ui-chat`, because the shipped 详情 column occupied the strict
  `details` seat at priority 0 and the novel context column could not register beside it.
- [x] Gates: 296/296 tests (12 in `novel-workbench`), `typecheck`, `lint`, `git diff --check`. Live: the
  headless CDP pass renders `小说模式 / R— / 尚未立项` topbar, the three-group rail, the nine view entries and
  the official conversation hero in the main column (screenshot `/tmp/nw-6-live.png`).
- [ ] Next in the same conversion: the prototype's remaining contexts (伏笔与线索, 未收束债务, 时间线,
  写作记忆, 本章合同, 推演, 人物档案抽屉, 设置弹层, 边界态) and their data reads, then the advanced panels
  (Cordis tree, plugin inventory, presets, jobs, diagnostics, event log) inside the novel surface.
- [ ] The composer row is still empty: the prototype's input bar (thread selector, `/` and `@` triggers, model
  and permission indicators) awaits the novel composer seat.

## Novel-mode front end, increments 2–5 — novel navigation, story map, review, advanced, 2026-09-16

**Status:** `verified` for the left column and the advanced surface on the real Host; `implemented-unverified`
for the story map, proposal review and version history against real Canon (unit-verified, and the isolated dev
profile has no work yet, so their live render is still the empty state).

- [x] `packages/novel-workbench/src/client/store.ts` — one React-external store for the frame: column
  geometry, the active canvas, the chapter the tree last opened, the advanced flag and a reload counter that
  every Canon-derived surface follows. `ctx.layout` writes through it.
- [x] Novel navigation column `NovelSidebar.tsx` (increment 2): three segments — 作品 (works + volume/chapter
  tree with 已接受/待审/计划中 badges and debt counts), 线程 (the work's own sessions, subagent transcripts
  filtered out) and 视图 (the brief's nine canvases, unbuilt ones rendered disabled) — closed by the 进阶
  entry. The bundle patch now disables `ui-sidebar` as well as `ui-layout`.
- [x] Novel data face `novel-data.ts`: pure mappers `buildWorkOutline` / `buildStoryMap` / `buildReviewProposal`
  / `describeRevision` plus the Remote-backed `createNovelWorkFace`, handed to every surface as one stable
  injected share. Canon stays in Novel Project; nothing here is a second source of truth.
- [x] Story map `StoryMapView.tsx` (increment 3): sigma 3 + graphology + forceAtlas2 (all MIT, upstream
  layout and rendering, no hand-written force simulation). Faction colouring, edge labels carrying both
  directions of a pair, node size from unresolved relationship debts, click-to-select neighbourhood fade.
  Bundle cost measured: workbench `lib/client.js` 33,334 B → 490,183 B (gzip 9,173 B → 89,048 B); isolated
  esbuild comparison and the `events`-shim build fix are recorded in
  [frontend-stack-2026-09-16](../docs/open-source-evaluations/frontend-stack-2026-09-16.md#5-实测故事地图选型与-bundle-体积2026-09-16).
- [x] Proposal review `ProposalReviewView.tsx` + history `VersionHistoryView.tsx` (increment 4): per-item
  接受/拒绝 on every proposed setting change, per-issue 采纳建议 toggle, live impact preview through
  `previewReview`, 「接受本章」/「暂不处理」/「丢弃提案」, the 接受设定·拒绝正文 acceptance path (the notice
  reports 已接受 N 条设定变更，正文未接受), the stale-proposal state (过期 → 只能丢弃) and a two-step
  rollback that writes a new revision.
- [x] Thread header `NovelThreadHeader.tsx` + advanced surface `AdvancedView.tsx` (increment 5): the strip
  above the conversation names the work, the accepted revision and the waiting proposals; the advanced canvas
  renders kernel facts, the current thread's background jobs, its subagent catalog and the raw accepted Canon
  projection. New slot `novel.thread.header` declared by the root registration.
- [x] RED → GREEN with captured failures: the sidebar seat was empty first; the story-map mapping test was
  shown to fail by returning the raw character id; the review spec first failed on the missing WebGL globals
  sigma reads at module scope. Tests: `packages/novel-workbench/tests/` (7 files, 9 tests).
- [x] Real-browser probe of the graph stack (headless Chrome + SwiftShader, `/tmp/ossize`): the same dependency
+ alias combination builds the graph, runs both layouts and paints 7 sigma canvases with no console error.
It caught two defects the unit tests could not — forceAtlas2 needs seeded coordinates before sigma accepts a
node, and the CJS bundle was externalizing `events`.
- [x] Real-Host evidence (pid 11095, `127.0.0.1:4780`): root page HTTP 200, client loader HTTP 200
  (5,753,853 B) contains every new surface, and a headless-Chrome CDP session rendered
  `frame=1`, `data-novel-sidebar="nav"=1`, official sidebar `=0`, segments `["works","threads","views"]`,
  the nine view entries and the 进阶 entry. Screenshot: `/tmp/novel-mode-left-column.png`.
- [x] Gates: 293/293 tests, `typecheck`, `lint`, package `build` and `git diff --check` clean.
- [x] `scripts/install-plugins.sh` now drops the six installed packages before `dsh plugin add`: re-packing
  keeps the same tarball path and `0.0.0` version, so pnpm had silently kept the previous copy and the host
  served a stale bundle (found by the live smoke, not by the unit tests).
- [ ] Next: seed one work in the isolated dev profile and run the V-a loop (real Canon → proposal → review →
  accept settings / reject manuscript → rollback) so the map, review and history screens get live evidence.
- [ ] Story map scale work not started: folding minor characters into 「+N」, per-volume/arc filters, pinned
  positions, search-to-focus.
- [ ] The advanced surface still covers only 内核/任务/Subagent/诊断. The shipped Cordis tree, plugin
  inventory, agent presets and settings pages remain the official ones, reachable from the conversation
  surface; re-rendering them inside the novel surface is not started.

## Novel-mode front end, increment 1 — root takeover, 2026-09-16

**Status:** `verified` for the root-occupant seam on the real Host. The novel surfaces themselves
(story map, proposal review, novel navigation) are not started.

- [x] `AGENTS.md` boundary amendments: the novel-mode front end is owned by novel-agent (root occupant +
  visible surfaces), the visible/invisible split (H1), Desktop compatibility-mode only, and the
  stale `conversation.view` wording in the reuse gate.
- [x] New package [`packages/novel-workbench`](../packages/novel-workbench/package.json): bundle patch that
  disables `ui-layout` and inserts the workbench row; client half registers the built-in `root` slot with
  the four child seats (`sidebar` / `conversation` / `details` / `shell.overlay`), provides `ctx.layout`,
  and carries the theme presenter upstream's frame used to own (color-scheme, dark attribute, token
  overrides, content font size, `theme-color`). Host half is an empty Loader seat.
- [x] RED → GREEN: `packages/novel-workbench/tests/novel-workbench-client.spec.ts` (jsdom) fails on the
  missing module first, then asserts the root registration shape, the rendered `data-novel-workbench="frame"`
  marker and the `ctx.layout` face.
- [x] `novel` profile = `dsh-base + dsh-web-app + six novel-agent plugins`; `scripts/install-plugins.sh` now
  packs/ships the workbench and repairs a profile scaffolded from tarballs by inserting `dsh-web-app`
  after `dsh-base`. `scripts/dev-host.sh` defaults to the `novel` profile and refuses to start a second
  host under a different profile/port.
- [x] Real-Host evidence (pid 78149, `127.0.0.1:4781`): root page HTTP `200` (24,547 B) lists
  `@novel-agent/novel-workbench/client.js`; client loader HTTP `200` (5,324,739 B) contains the plugin;
  a headless-Chrome CDP session rendered the page and returned a 337,848-byte DOM with 8
  `data-novel-workbench` markers, our `nw-sidebar` seat, and the official conversation surface rendering
  inside our frame. Screenshot: `.novel-agent/run/` is gitignored, the capture lives in `/tmp/novel-mode.png`.
- [x] Gates: 285/285 tests, `typecheck`, `lint`, package `build`, `git diff --check` clean.
- [ ] Next increments: novel navigation in the sidebar seat → story map → proposal review → thread view;
  OSS picks from the front-end selection record still need their bundle-cost and isolated-profile smoke.

## Novel-mode front end: prototype and OSS-reuse principle, 2026-09-16

**Status:** `implemented-unverified` for the design artifact (needs the author's eyes); `verified` for the
OpenDesign pipeline wiring and the reuse-principle record. No product code or test was touched.

- [x] Grilling settled the design tree: A (novel-agent owns the web front-end layer), S2 (Claude Code
  desktop skeleton + measured tokens), T1 (one book = one Workspace, many threads), H1 (all visible
  surfaces self-rendered, invisible client services reused), G-c (minimal acceptance guardrails first),
  `novel` profile + `@novel-agent/novel-workbench` bundle, AGENTS.md front-end boundary amendments, and
  the V-a real-loop acceptance slice.
- [x] Wrote the paste-ready brief: [novel-mode front-end brief](../docs/novel-mode-frontend-brief-2026-09-16.md)
  (Claude desktop measured tokens, three-segment left column, 15 screens, self-check list).
- [x] OpenDesign pipeline: first run failed (`AGENT_EXECUTION_FAILED`, codex CLI demanded API-key login and
  logged the CLI out of ChatGPT). Diagnosed from the machine config, then detected OpenCode was missing from
  the GUI PATH (OpenDesign scans `~/.local/bin` for `opencode-cli`), added a user-level symlink, switched the
  agent to `opencode` with model `deepseek-flash`, and its connection test returned
  `已连接。396 毫秒响应 — 'ok'`. The prototype itself was produced by the earlier codex run (`--model
  deepseek-flash`, xhigh) before that switch.
- [x] Imported the prototype to [docs/prototypes/2026-09-16-novel-mode](../docs/prototypes/2026-09-16-novel-mode/README.md):
  `novel-mode-workbench.html` (178,791 B), `design-tokens.md`, `README.md`; repository-side re-checks (0 external
  refs, 0 placeholder hits, key labels present, 124 buttons) and SHA256 recorded in that README.
- [x] Recorded the user's OSS-reuse-first principle in `AGENTS.md` and opened
  [frontend-stack selection](../docs/open-source-evaluations/frontend-stack-2026-09-16.md): Obsidian itself is
  closed-source, so the graph candidates are sigma.js + graphology / react-force-graph / Quartz's pixi graph,
  plus reuse picks for panels, command palette, virtualization, icons and charts.
- [ ] Author reviews the prototype visually and against the brief's checklist; failures go back to OpenDesign.
- [ ] Side effect to repair: the user's global Codex CLI is now `Not logged in` (`codex login status`) because
  OpenDesign forced an API-key login; the CLI needs a deliberate login choice.

## Persistent dev host (front + back), 2026-09-15

**Status:** `verified` for the local dev loop: detached fixed-port host, rebuild → install → restart, and
restart persistence. No product code, test, spec or dependency version changed.

- [x] Added `scripts/dev-host.sh`: `start` / `stop` / `restart` / `rebuild` / `status` / `url` / `open` / `logs`
  for the isolated home `.novel-agent/dsh-home` and profile `web` on the fixed loopback port `4780`.
  Front end (DSH Web UI, five novel plugins through `conversation.view`) and back end (the DSH services and the
  five plugins) are the same host process, which is the only serving path this repository has.
- [x] `nohup` was not enough: the process was reaped with the launching tool session. The launcher now forks with
  `os.setsid`, so the host is re-parented to `launchd` (`PPID 1`) and survives across sessions and turns.
- [x] Boot boundary re-measured on the running host: root page HTTP `200` (24,553 bytes) lists
  `@novel-agent/novel-project/client.js`; the client loader returns HTTP `200`, 5,336,593 bytes, 156
  `novel-project` hits; host log has no error line.
- [x] `scripts/dev-host.sh rebuild` ran the documented `pnpm install` → `build` → pack → `dsh plugin add` →
  verify path in ~14 s and restarted the host; the profile keeps the patched `dsh-session` and has no
  profile-level `dsh-tools` copy.
- [x] Persistence: restarting keeps port `4780` and a previously issued `dsh-auth-*` cookie still returns `200`
  (plain `/` without a cookie is `401`), so the tokenized URL is needed once per browser.
- [x] Runtime state lives in `.novel-agent/run/` (`host.pid`, `host.url` mode `600`, `host.log` with the token
  redacted). `.novel-agent/` stays gitignored; the user's global `~/.dsh` is untouched.
- [ ] Panel rendering/interaction in a real browser, real-model rounds and Desktop `2.0.5` remain unverified here.

## Documentation corrections for the current baseline, 2026-09-15

**Status:** `done` (documentation only; no product code or spec text changed).

- [x] Repaired `README.md`: the file ended with a UTF-16LE `# Novel-agent` fragment appended after
  the UTF-8 content, which made `rg`/`grep` treat the whole README as binary. The exact 29 trailing
  bytes were removed; the file is valid UTF-8 and every other repository file was clean.
- [x] Marked the community plugin table with the measured `0.1.2-rc.1` status: `dsh-better-sidebar@0.16.1`,
  `@anweat/dsh-browser@0.1.9` and `dsh-web-search-pro@0.1.11` fail to load on rc.1
  (`settingsNamespace` / `installSettingsSection` are absent), `dsh-file-upload@0.4.3` passed the load
  boundary, and the TUI/git-worktree rows are not verified on rc.1.
- [x] Framed the migration-era test counts in the README opening as dated records instead of current
  totals, and dated the legacy "single-plugin composition" line in the evidence boundary section.

## macOS 开发环境与唯一 DSH CLI, 2026-09-15

**Status:** `verified` for this machine's install, profile composition and host boot boundary.
Product code, tests and specs were not touched.

- [x] Retired the local `0.1.1-rc.2` CLI and the `dsh-coding` / `dsh-desktop` / `dsh-office`
  wrappers into `~/.local/lib/dsh-retired-20260915/` (moved, not deleted); `~/.local/lib/dsh/`
  now holds the single `0.1.2-rc.1` install and `~/.local/bin/dsh` is the only `dsh` command.
- [x] Added `scripts/install-dsh.sh`: installs official `@deepseek-ai/dsh@0.1.2-rc.1` with the
  repository's authorized `dsh-session` patch, verifies the shared-registry marker in every
  installed copy, and writes the `dsh` shim with the resolved `node`/`pnpm` directories.
  `dsh --version` now reports `0.1.2-rc.1`.
- [x] Added `scripts/install-plugins.sh`, the macOS/Linux counterpart of
  `scripts/install-plugins.ps1`: build, pack five plugins, write the profile
  `patchedDependencies` plus `autoInstallPeers: false`, install, and verify the patch marker and
  all five packages.
- [x] Isolated dev home `.novel-agent/dsh-home` with profile `web`: profile `dsh-session@0.1.2-rc.1`
  carries the patch, five novel plugins installed, bundles `dsh-base + dsh-web-app + five plugins`.
  The user's global `~/.dsh` was left untouched.
- [x] Boot boundary smoke: host starts with no error lines, root page HTTP `303` → `200` with the
  token cookie (24,553 bytes) and lists `@novel-agent/novel-project/client.js`; the client loader
  returns HTTP `200` (5,336,593 bytes, 156 `novel-project` references); port released on stop.
- [x] Repository gates on this machine: `corepack pnpm install --frozen-lockfile`, `build`,
  `typecheck`, `lint`, `test` (284/284) all pass.
- [ ] Real-model credential is not configured in the isolated home; GUI interaction, Desktop
  `2.0.5` and the community plugins that fail on rc.1 remain out of scope.
- [ ] Known nuisance: `dsh plugin add` can stall in pnpm's supply-chain policy check after the
  files are already written (one occurrence, >5 min; a re-run finished in 0.6 s). Verify the
  markers instead of reinstalling.

Record: [macOS development environment](../docs/development-environment-macos-2026-09-15.md).

## Writing-workbench prototype imported, 2026-09-15

**Status:** `implemented-unverified` for the design artifact; visual and interaction acceptance still needs the author's eyes.

- [x] Imported the OpenDesign prototype into [docs/prototypes/2026-09-15-writing-workbench](../docs/prototypes/2026-09-15-writing-workbench/README.md): `index.html` + `design-tokens.md`, with source, SHA256 and automated checks recorded.
- [x] Automated checks green: no external resources, Simplified Chinese copy, key screens and boundary states present, no lorem/TODO.
- [ ] Author opens the prototype and runs the brief's appendix C checklist; failures go back to OpenDesign, then this directory is replaced and re-hashed.

## Public repository publish and clone verification, 2026-09-15

**Status:** `done`; evidence in [repository publish](repository-publish-2026-09-15.md).

- [x] Committed the working tree as the initial import and pushed `main` to `dreaminate/Novel-agent` (public, per user confirmation): `47f2cc4`, `0f09e8f`, `3563ef6`.
- [x] Fixed the CRLF-sensitive `product-boundary` assertion that made a fresh clone fail; current suite is 284/284 green in both the origin checkout and a clone.
- [x] Added `scripts/install-plugins.ps1` and README steps so a second machine can clone, build, pack and install; the script writes the authorized `patchedDependencies` entry (and `autoInstallPeers: false`) into the selected profile, reinstalls, and verifies the patch marker plus all five plugin packages.
- [x] Verified from the public repo: fresh clone → install → build → 284 tests → pack → script install into a fresh isolated DSH_HOME → real host boot with empty stderr.
- [ ] Decide (user) whether to keep the repo public with historical machine paths and the `UNLICENSED` package license, and whether to stop the leftover host process (PID 15440, started 20:44, not part of this task).

## Front-end redesign brief for OpenDesign, 2026-09-15

**Status:** `done` (design artifact only; no product code changed).

- [x] Interviewed the writer-facing design tree: relationship-map-first story map, map + left nav + right rail IA, inline chat proposal card, persistent writing bar, paper-and-ink visual system with day/night themes, system fonts, full interactive prototype with hard acceptance checks.
- [x] Wrote [frontend redesign brief](frontend-redesign-brief-2026-09-15.md): paste-ready OpenDesign brief, sample data packet for《雾港夜航：第七码头》, implementation mapping to Canon/Remote fields and DSH slots, acceptance checklist.
- [next] After a satisfactory prototype, amend the `AGENTS.md` front-end boundary (`conversation.view` plus chat turn tail / tool details / input dock / session header) before any implementation slice.

## Project hygiene — retired residue and stale local state, 2026-09-15

**Status:** `done` for the listed deletions and doc/config consistency fixes.

- [x] Removed the retired `apps/` Electron build residue (357.1 MB) and the `apps/*/tests/**` Vitest include.
- [x] Removed regenerable `node_modules` from 14 historical acceptance environments and the date-evaluated upstream runtimes (about 1.3 GB); every acceptance evidence file, active environment and the shared patched CLI runtime was kept.
- [x] Removed the stale `patch-work` working copy that no longer matched the current Session patch.
- [x] Marked the `239/239` counts as 2026-09-02 milestone records in README/architecture/parity matrix; updated the `.gitignore` comment.
- [x] Gates after cleanup: 275 tests, typecheck, lint and build pass.

Record and kept/deleted rationale: [project hygiene](project-hygiene-2026-09-15.md).

## Real-model smoke — DeepSeek R1 project brief, 2026-09-15

**Status:** `verified` for this single native-RPC smoke scope.

- [x] User-configured credential in an isolated `dsh-home/.env`; `credentials/describe` reports `configured: true` without exposing the value.
- [x] First attempt RED: the harness had not opened the Novel Project, so the model's `retrieve_novel_context`/`propose_novel_result_packet` failed and it explored the repo; the runner also failed to stop the Host on error. Harness fixed (open first, workspace cwd, always stop).
- [x] GREEN: a real `deepseek-official/deepseek-v4-flash` turn (~60 s, 23,882/3,181 tokens) loaded `novel-architect` and submitted a valid authorization-free R1 packet (5 Deltas, 3 Anchors); author Apply produced R1 with 5 Canon facts, the head stayed R0 before approval, and the Host stopped with its port released.
- [ ] GUI interaction, chapter writing, review/memory/publish paths, approval paths and the 12-chapter acceptance remain.

Exact [smoke evidence](../docs/real-model-smoke-2026-09-15.md).

## M2 — Canon boundary and readable domain errors, 2026-09-15

**Status:** `verified` for W1–W5 local and isolated evidence; the six domain Slots, legacy remote removal, Memory/Writing value schemas and real-model/GUI acceptance remain in M3–M6.

- [x] W1 RED/GREEN: Core-only assembly runs the complete Canon chain (open/propose/preview/accept/rollback/lock) under a focused test.
- [x] W1 RED/GREEN: a missing projector, extension schema or domain service raises an exported `NovelProjectDomainUnavailableError` naming the capability and namespace/service instead of a bare `TypeError`.
- [x] W1 RED/GREEN: the `conversation.view` panel keeps Canon content and renders its existing unavailable sections when Planning/Memory projections are absent; a failed writing-memory rehydrate no longer produces an unhandled rejection.
- [x] 273/273, typecheck/lint/build pass.
- [x] W3 RED/GREEN: generated Typert host/remote artifacts keep every invocation on the single `novelProject` service namespace and describe identical parameters/results; a controlled artifact mutation fails the assertion. 274/274 after the addition.
- [x] W4a RED/GREEN: public `NovelCanonDeltaKind.validate` seam with lifecycle disposer; the `world` kind is envelope-only in Core and validated by `novel-planning` (Core-only raises `delta-kind/world`, invalid values raise the plugin ZodError, unload withdraws it). 275/275.
- [x] W4b RED/GREEN: the remaining Planning kinds (`mystery`/`clue`/`promise`/`roadmap`/`ending`/`character-state`/`creative-profile`/`reader-contract`/`relationship`/`narrative-unit`/`narrative-clock`) are envelope-only in Core and validated by `novel-planning`; the four affected Core tests now mount Planning with unchanged assertions. 275/275, typecheck/lint/build pass.
- [x] W5: isolated Core-only official rc.1 Host runs the Canon chain over the real gateway and returns readable missing-plugin errors; the composed five-plugin Host accepts a valid `world` Delta, rejects an invalid one with the plugin ZodError, and keeps the head at R0. Ports released; `tasks/history-migration-todo.md` M2 items dispositioned.

Exact [W1–W5 evidence](../docs/canon-boundary-m2-2026-09-15.md).

## M4 — Writing bounded automation and required log recovery, 2026-09-15

**Status:** `verified` for Writing budget-policy ownership and the listed native recovery paths.
Scripted probe only; no real model or GUI claim.

- [x] RED/GREEN: Writing owns `authorize_novel_automation`, its native ask approval, the fixed Write-only stages and the budget/stop-rule enforcement; Core no longer carries the enforcement path.
- [x] Keep the existing budget schema, proposal accounting and scripted-Host behavior; no new dependency version.
- [x] RED: the required `novel/automation-policy` event is refused when the persisted session is cold-resumed ("unknown to this harness and not marked ignorable").
- [x] Root cause: a real Host loads two `dsh-session` module instances (profile service vs official persistence reader); registration mutated one known-type set and the reader checked the other.
- [x] GREEN: extend the user-authorized Session patch so the known-type registry is process-shared; the new cross-copy focused test fails before and passes after.
- [x] 269/269, typecheck/lint/build pass; the lockfile diff is confined to `patch_hash`/peer-suffix lines.
- [x] Patched isolated Host cold-resumes the pending session in both the original and a fresh Profile: `resumed: true`, Canon stays R0, storage/session bytes unchanged, ports released.
- [ ] Real DeepSeek quality, GUI, a full automation-scenario Host rerun and the remaining dual-module packaging cleanup.

Exact [automation evidence](../docs/writing-automation-migration-2026-09-15.md).

## M2 — Writing import, publication and native approval, 2026-09-09

**Status:** `verified` for existing I/O ownership and the listed native paths.

- [x] RED/GREEN: Core validates and freezes authorization-free domain drafts through its schema/extension registry.
- [x] RED/GREEN: import/publication Tools are absent from Core and follow Writing install/unload.
- [x] Move existing publication resolution, approval hook and document encoding into Writing; reuse native FS and Host Tools peer.
- [x] Preserve existing assertions and 11 schema/codec declarations; 266/266, typecheck, lint and build pass; no new resolved dependency version.
- [x] Fresh Host: imports wait for explicit acceptance; denied publication writes nothing; UTF-8/source/EPUB/DOCX outputs pass; cold author preview and subsequent approved publication preserve R3.
- [x] Native reader: 226 events, 9 completed turns, 6 approval pairs and 3 recoverable Canon notifications. All test Hosts stopped.
- [ ] Final Writing interfaces, remaining domain migration, GUI, real DeepSeek and full novel acceptance.

Exact [I/O migration evidence](../docs/writing-io-migration-2026-09-09.md). External model and approval respondent were scripted.

## M2 — Memory retrieval engine and native index Jobs, 2026-09-09

**Status:** `verified` for backend ownership and the stated native Job/Tool paths.

- [x] RED/GREEN: Memory registers and withdraws the two existing retrieval/index Tools; Core no longer registers them.
- [x] Move complete retrieval assembly, Chinese search/ranking, remaining ledgers/lifecycles and index production into Memory; remove Core calculation methods and 49 related declarations.
- [x] Canon provides per-revision facts/metadata and generic revision impact; Writing supplies historical prose. No copied rollback interpreter or second fact store.
- [x] RED/GREEN: a real owned DSH Job rebuilds the Memory index and returns sourced full-text hits. Native Canon events invalidate derived indexes.
- [x] Preserve 1,740 complete expect chains with 16 direct service receiver updates; 17 algorithm/schema and two Tool declarations remain. 264/264 and package gates pass.
- [x] New Host: R3/R4 completed owned Jobs, stale-index rejections, pre/post-index Tool equivalence, history and rollback cold recovery; all Hosts stopped. Official quiet Job delivery used, zero model turns.
- [ ] Final Tool names, dedicated Memory Remote/Slot, wire/schema, other domain migration and real-model/GUI/novel acceptance.

Exact [retrieval and Jobs evidence](../docs/memory-retrieval-migration-2026-09-09.md).

## M2 — Memory graph, causal comparison and knowledge, 2026-09-09

**Status:** `verified` for these calculation families and the listed native Host paths.

- [x] RED/GREEN: Memory reads revision-bound graphs and sourced causal paths, retaining history and rollback hashes.
- [x] RED/GREEN: Core/Planning preview remains available without Memory; Memory supplies the causal contribution for accepted and unaccepted candidate inputs, then withdraws on unload.
- [x] RED/GREEN: Memory owns subject knowledge boundaries and complete query-independent writing boundaries with correct revision/head metadata.
- [x] Controlled RED/GREEN rejects mistakenly rereading an unaccepted candidate as stored Canon; restore explicit inputs to pass.
- [x] Preserve 1,719 original complete expect chains and 10 algorithm/formatting declarations; lockfile unchanged. 262/262 and package gates pass.
- [x] New Host: no-Memory preview, post-install candidate R2 while head stays R1, historical comparison, cold R3 and rollback R4 cold resume; 22 RPCs and four matching native Tool reads.
- [ ] Remaining retrieval/ranking, other ledgers/lifecycles, Jobs, wire/schema, dedicated Remote/Slot, GUI and real novel/model acceptance.

Exact [graph migration evidence](../docs/memory-graph-migration-2026-09-09.md).

## M2 — Memory relationships and chapter context, 2026-09-09

**Status:** `verified` for these implementation families and the listed native Host paths.

- [x] RED/GREEN: permit read-only projectors while retaining Planning's actual acceptance validation.
- [x] RED/GREEN: move bidirectional relationships and per-field sources into Memory; history and rollback retain the requested evidence.
- [x] RED/GREEN: Memory owns Chapter control packs, post-check joins, character carry-forward, reader disclosure, Chapter outcome and complete character arc recall.
- [x] Canon exposes immutable effective sources and lock resolution; Writing supplies historical prose; Memory does not replay rollback or mutate Canon.
- [x] Controlled RED/GREEN: restoring Core-owned relationship computation incorrectly keeps reads available after Memory withdrawal. Restore domain ownership to pass.
- [x] Preserve 1,706 original complete expect chains across the three affected test files; remove duplicate fixture mounts only. 259/259 and package gates pass.
- [x] New official Host/Profile: 18 successful RPCs, three matching native retrieval Tool reads, precise R1/R2 source joins, cold R3, rollback R4 and another cold recovery; all processes stopped.
- [ ] Remaining retrieval/ranking/knowledge/graph algorithms, Jobs, wire/schema, dedicated Remote/Slot, GUI and real model/novel acceptance.

Exact [Memory migration evidence](../docs/memory-projection-migration-2026-09-09.md).

## M2 — Review execution and Host Tools peer, 2026-09-09

**Status:** `verified` for Review algorithm ownership and the listed native Host paths.

- [x] RED/GREEN: Review owns draft execution, output schemas, source anchors and diff; reads Canon/Planning/Writing/Memory services.
- [x] Core retains author binding, current-revision checks and acceptance; its existing Remote delegates through a typed optional service lookup without a reverse lifecycle dependency.
- [x] Keep all eight direct review and three Remote scenarios, including failures, stale revision, source validation and partial acceptance assertions.
- [x] Real Host reproduced a second Tools module's scheduler Symbol mismatch; Core/Review now declare exact Host peer + dev dependency. The tested Profile disables peer auto-install and has no local Tools copy.
- [x] 256/256, typecheck/lint/build; fresh native spawn executes structured output, rejects an absent quote, survives full restart, and preserves accepted prose when the author accepts only an Issue.
- [ ] Dedicated Review Remote/Tools/Slot, remaining Core shrink, Memory algorithm, GUI and real DeepSeek/novel quality remain incomplete. The Host model boundary was scripted.

Exact [review migration evidence](../docs/review-engine-migration-2026-09-09.md).

## M2 — Domain-owned prompt sections, 2026-09-09

**Status:** `verified` for prompt ownership, native assembly/lifetime and the listed Host paths.

- [x] RED/GREEN: Core alone publishes only Canon guidance; the full composition contains five ordered sections.
- [x] Preserve all eleven original instruction paragraphs, assigned to the owning domain; retain the existing behavioral assertions.
- [x] Native dependency control: removing Writing's Planning dependency leaves an unwanted prompt; restoring it passes the unload test.
- [x] 255/255, typecheck/lint/build; actual Agent-scope assembly contains only the expected sections.
- [x] Official live Profile patch disables/re-enables Planning without restarting the Host; downstream sections withdraw/return with identical hashes; full process restart also restores the same hashes.
- [ ] Continue domain algorithms, wire/schema, Tool/Remote ownership and new Slots; real-model/GUI and full M2 acceptance remain separate.

Exact [prompt migration evidence](../docs/domain-prompt-migration-2026-09-09.md).

## M2 — All existing role Skills owned by domain plugins, 2026-09-09

**Status:** `verified` for role ownership, native dependency/lifetime and stated read paths.
This does not complete Core shrink or the full Memory/Review implementations.

- [x] Writing exposes accepted manuscript reads through the Canon authority, with historical/rollback RED/GREEN.
- [x] Move continuity/memory-organizer Skills to Memory and reviewer/researcher Skills to Review; Core registers zero domain Skills.
- [x] Keep all seven moved declarations unchanged except owner and retain all existing loader assertions.
- [x] Controlled RED/GREEN: Memory waits for Writing; Review waits for Memory; upstream unload withdraws dependent roles; requested revision is not replaced by head.
- [x] Move the unused Core production SkillRegistry dependency to dev-only; no new third-party version.
- [x] 254/254 and package gates; five real packages installed into a fresh official Host Profile, eight native Skill loaders and Writing/Memory reads before/after full restart and rollback R4.
- [ ] Move domain wire/schema, Tool/Remote bodies and remaining domain algorithms/Slots. Prompt ownership is completed above; Memory.retrieve still delegates to the Core retrieval implementation.

Exact [role migration evidence](../docs/domain-role-migration-2026-09-09.md).

## M2 — Planning projection ownership, 2026-09-09

**Status:** `verified` for this projection/validation family and the listed native Host paths.
Full M2 and the real novel remain incomplete.

- [x] RED/GREEN: Canon supplies frozen effective sources to registered projectors, excluding future revisions and rollback-discarded branches; Preview/Apply run domain validation before mutation.
- [x] Move narrative projection, hierarchy/identity/reference validation and ordering to Planning; delete the Core implementations and redundant per-revision projection state helpers.
- [x] Canon-only Preview returns generic manuscript/fact impact; composed Preview retains the existing domain impact.
- [x] Controlled RED/GREEN proves the Planning projector is withdrawn on plugin unload.
- [x] 251/251, typecheck/lint/build; existing narrative/Remote/review tests retain their assertions with Planning explicitly mounted where its behavior is required.
- [x] Fresh official Host: Core-only R1, composed R2/R3, orphan rejection in both Preview/Apply with unchanged Canon, cold history, rollback R4 and another cold preview; all four processes stopped.
- [ ] Move domain wire/schema, retrieval/graph/simulation/IO and dedicated Remote/Slots; the four roles moved in the follow-on slice above, while legacy entry consumers remain.

Implementation and exact [proof boundaries](../docs/planning-projection-migration-2026-09-09.md).

## M2 — Planning Service and Writing role, 2026-09-09

**Status:** `verified` for the native service, dependency and role-loading scope.
Full Core shrink, Planning and Writing remain `implemented-unverified`.

- [x] RED/GREEN: `novelPlanning.readPlan` returns the requested accepted chapter contract; later edits do not leak backward and rollback restores the prior contract.
- [x] RED/GREEN: Core no longer registers the prose writer; all existing loader/content/schema assertions remain.
- [x] Controlled RED/GREEN: Writing waits without Planning, loads with it, and withdraws when Planning unloads.
- [x] 249/249, typecheck/lint/build; three private packages installed through the official CLI into a fresh Profile.
- [x] Native Host ordered Writing → Planning → Core; cold author preview at R3, historical R2/R3 reads, rollback R4 and second cold preview; four Skill bodies unchanged and ports released.
- [x] Move narrative projection implementation out of Canon; completed by the projection-ownership increment above.
- [ ] Migrate domain Tools/types/projections; the four roles moved in the follow-on slice above. Finish Planning/Writing Remote/Slots and real-model acceptance.

Exact [evidence and limits](../docs/writing-planning-seam-2026-09-09.md).

## M2 — First Planning ownership slice, 2026-09-09

**Status:** the three-role ownership slice is `verified` for local and native Host
behavior. Full Canon shrink and Planning remain `implemented-unverified`.

- [x] RED/GREEN: Core alone no longer registers architect, hook/payoff or world/character Skills, while Canon opens normally.
- [x] Move those existing roles to `@novel-agent/novel-planning`; preserve their contents and valid loader assertions.
- [x] RED/GREEN: native Cordis leaves Planning pending without Canon; disposing Planning withdraws all three registrations.
- [x] 247/247 tests, typecheck, lint and build; separately packed Core and Planning install through the real official CLI.
- [x] Fresh patched rc.1 Host: Planning before Canon in bundle order, native `skill` reads before/after full restart, unchanged R0 Canon, zero-listener shutdown.
- [ ] Migrate domain Tools/types/projections; role and prompt ownership now belong to their domain plugins.
- [ ] Implement the v3 Planning contracts, tools and necessary `conversation.view`; complete GUI and real-model acceptance separately.

Scope, byte snapshot and exact evidence: [Planning role migration](../docs/planning-skill-ownership-2026-09-09.md).

## M1 — Canon extension seam, 2026-09-08

**Status:** native Canon notification recovery is `verified` with the user-authorized local patch; the new GUI recheck is `implemented-unverified`. Current migration follows
[`plan-final.md`](plan-final.md) and [`plugin-design-v3.md`](../docs/plugin-design-v3.md);
the older single-plugin queue below remains historical behavior evidence.

- [x] RED/GREEN: Cordis extension registration, namespace-safe Canon projection and per-extension schema.
- [x] RED/GREEN: extension locks across generated Remote, service reload, Preview/Apply and rollback.
- [x] RED/GREEN: real source Session append/flush, exact Canon event payload, and unload rejection for set/remove.
- [x] Local gates: 243/243, typecheck, lint, build, package and baseline diff checks.
- [x] Fresh Profile: no-manuscript R1, R2, rejected invalid value, rollback R3, Slot reload and zero-listener stops.
- [x] The user-authorized local patch now restores the two derived Canon notifications through real cold author lookup. The original unpatched failure remains in its dated report.
- [x] User authorized evaluation and adoption of verified official DSH and companion host versions.
- [x] Evaluate official `0.1.2-rc.1`, `0.1.3-alpha.2` and Desktop `2.0.5`; latest real-package writer/reader probe still rejects the custom event, while a built-in control passes. [Evidence](../docs/open-source-evaluations/dsh-session-event-upgrade-2026-09-08.md).
- [x] Full official `0.1.2-rc.1` isolated Web Host trial: install, authenticated Remote, full process restart; builtin control resumes, custom Canon event still fails. [Evidence](../docs/dsh-full-host-upgrade-trial-2026-09-08.md).
- [ ] **Blocked at environment build:** full `0.1.3-alpha.2` dependencies and fixture installed, but `fs-ext` native build fails downloading Node's Windows import library. Host startup and cold recovery have not run successfully; no exact-version official prebuilt carrier was found.
- [x] Independent author lookup repair: native JSONL cold-session RED/GREEN, 244/244 package tests, build/typecheck/lint, and fresh Web Profile post-Host-restart preview with unchanged R0. [Exact proof boundaries](../docs/native-author-session-lookup-2026-09-08.md).
- [x] User selected rc.1; migrated product pins, Session reads, client facets and real cold-session test assembly. 244/244, typecheck/lint/build and root peer checks pass. Fresh rc.1 Web Profile: R1/R2/R3 rollback/reload pass, while full Host restart still rejects custom events; Canon R3 remains readable. [Adoption record](../docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md).
- [x] User authorized the bounded local writer patch; native/full-Host API restore and continuation passed. The new GUI recheck remains separate and unverified.

**2026-09-09 update:** user authorized the local writer patch. [Recovery evidence](../docs/canon-session-recovery-2026-09-09.md) proves native JSONL and full-Host API cold restore after both accept and rollback, followed by R4 continuation; 245 tests and package gates pass. The original unmodified-package failures above remain historical evidence. Required unknown events are still refused. Fresh GUI recheck remains pending after Computer Use could not verify the browser URL; no broader completion claim.

Full implementation, exact failure, upstream API evidence and limits:
[`M1 checkpoint`](../docs/canon-extension-m1-2026-09-08.md). No chapter-quality or new-plugin completion claim.

This is the canonical queue for novel-agent. The governing rule is simple:
install DSH/community plugins for generic capability; write novel-agent code
only for novel-domain behavior and its necessary stock-DSH conversation view.
Do not add a community-UI adapter or wrapper. Necessary novel interactions belong
to the owning domain plugin in the existing `conversation.view`, per the final plan.
The queue below retains dated single-plugin evidence from before this migration.

## A-001 — Retire duplicate generic packages

**Status:** `verified` for the current repository/product-boundary gate.

- [x] remove the `desktop-profile` source, installer, tests and root reference;
- [x] remove `terminal-remote` and `client-ui-terminal` source, tests and root
  references;
- [x] stop disabling Better Sidebar terminal/sidechat in a novel-owned Profile;
- [x] remove the redundant Better Sidebar Canon tab and Pi TUI footer packages;
- [x] update the root focused test command to the one retained package;
- [x] regenerate the lockfile/workspace graph: pnpm reports two workspace
  projects including the root;
- [x] confirm no active manifest, config, current architecture row or parity
  claim still invokes the removed packages;
- [x] remove the retired package directories from the checkout itself;
- [x] run focused/full tests, typecheck, lint, build and diff checks.

Retired package manifests, source artifacts and physical package directories
are absent. Workspace, build, package and runtime discovery contain only the
root project and `novel-project`; ignored build residue is not a product
package. The removed directories were moved to a timestamped system-temp
backup during this cleanup so the change remains recoverable.

## B-001 — Independently installable novel plugin

**Status:** `verified` for the stated isolated Web/Pi install, resolution and
startup scope; complete generic-plugin UI and novel authoring flows remain
separate checks.

- [x] `novel-project` declares its own `dsh.bundle.patch` and mounts only
  `@novel-agent/novel-project`;
- [x] focused RED captured the single-package product boundary before GREEN;
- [x] the necessary Result Packet/Canon UI remains inside `novel-project` on
  DSH's stock `conversation.view` Slot;
- [x] fresh Temp `DSH_HOME`: add/load novel-project, then Better Sidebar beside
  it; Web root and both client artifacts returned HTTP `200`;
- [x] fresh Temp `DSH_HOME`: add/load Pi TUI + novel-project without a local
  adapter; the input-ready Pi TUI shell was visible;
- [x] record the isolated root and resolved versions without changing the
  user's global `.dsh`:
  `C:\Users\33166\AppData\Local\Temp\novel-agent-single-plugin-24a1442e00e2488d8af95f5d8eeb1360`.

Pi TUI needs four official DSH provider rows in the user's selected
`pi-tui` Profile, as documented in README. They must not be added to Web,
because `dsh-web-app` already mounts the same loader ids.

## N-001 — Novel Project Canon and Result Packet

**Status:** `verified` for the accepted Result Packet, per-item decision,
revision, rollback, reload and revision-specific rollback-action naming scope.
The Canon-only project brief plus strict style/reader contract setup is also
`verified` for the fresh stock-Web R1/R2 and malformed-R3 evidence below.

- [x] one Novel Project per DSH Workspace;
- [x] immutable source anchors and provenance;
- [x] exhaustive manuscript/Delta/Issue accept/reject decisions; rejecting a
  rewritten manuscript may still accept its Delta/Issue items and retains the
  previously accepted manuscript projection;
- [x] atomic accepted revision and stale-revision rejection;
- [x] deterministic rollback through the same Canon authority;
- [x] generated Typert Remote and essential project UI;
- [x] let the stock Agent propose a Canon-only `creative-profile` / `reader-contract`
  project brief before the first manuscript; reuse the existing per-Delta review
  and Apply path, append the accepted revision without a placeholder manuscript,
  and preserve that project state when later Write revisions add manuscripts;
- [x] retain JSON arrays and nested objects in Canon fact values across the stock
  Tool, generated Remote, accepted revision and projections; render those values
  as stable readable JSON in the existing conversation panel and compare
  structured Canon locks by value rather than object identity;
- [x] reserve `creative-profile/style-profile` as a strict versioned author
  contract covering voice, viewpoint, sentence rhythm, dialogue, sensory and
  subtext/exposition rules, forbidden habits, approved source-bearing exemplars
  and adaptation boundaries while leaving other Creative Profile fields generic;
- [x] retrieve historical/current style profiles with revision, Anchor ranges and
  provenance through the existing Tool/generated Remote and render the accepted
  profile in the existing Canon area without another Tool, store, page or package;
- [x] reserve `reader-contract/contract-profile` as a strict versioned premise
  and delivery contract covering the core experience, named promises,
  exclusions, target audience expectations, source-bearing evidence and
  revision rationale while leaving other Reader Contract fields generic;
- [x] retrieve historical/current reader contracts with revision, Anchor ranges
  and provenance through the existing Tool/generated Remote and render the
  accepted contract in the existing Canon area without another form, Tool,
  store, page or package;
- [x] give multiple rollback actions revision-specific accessible names.
- [x] expose each accepted revision's packet, parent/rollback source, decisions,
  provenance and authorization in the existing history list.
- [x] preview the exact selected manuscript/Delta Result Packet impact before
  Apply in the same review article, without minting authorization or writing a
  revision, and clear stale previews whenever the author changes a decision.

The revision audit disclosure is covered by the client normal-path regression;
fresh-Profile visible use remains unverified. It adds no history store or view
outside the existing `conversation.view` panel.

The project-brief Host RED failed because both `manuscript` and
`manuscriptDiff` were mandatory. The Client RED then reproduced
`Cannot read properties of undefined (reading 'title')` when the stock Tool
Result reached the existing review panel. GREEN keeps the same
`propose_novel_result_packet` Tool, Result Packet transaction and
`conversation.view`: manual setup packets may omit both manuscript fields,
while bounded Write automation still requires a manuscript. R0 → Canon-only R1
leaves the manuscript projection empty; a normal Write at R2 retains the R1
Creative Profile and Reader Contract. The focused Host and Client regressions,
107/107 package tests, typecheck and lint pass; the fresh stock-Web setup path is
covered by the dated evidence below. No setup package, form, Profile, adapter,
Sidebar tab or TUI extension was added.

The structured-value RED then showed the stock Tool rejecting an array/object
brief and the existing panel rendering an object as `[object Object]`. GREEN
extends the same Canon Delta/Remote/storage contract to recursive JSON values,
keeps arrays and nested objects intact after Apply, uses stable key ordering for
visible JSON and graph labels, and preserves structured lock equality across
separate object instances. The same 120-test package gate, typecheck, lint and
build pass; the fresh stock-Web setup path is covered by the dated evidence
below.

The strict style-profile RED then showed that `creative-profile/style-profile`
still accepted an arbitrary object and the Canon area had no dedicated readable
voice evidence. GREEN reserves only that field as a versioned value containing
profile name, voice principles, viewpoint person/distance/rules, sentence rhythm,
dialogue and character differentiation, sensory priorities, subtext/exposition
rules, forbidden habits, approved exemplars with source revision/Anchor ids, and
adaptation boundaries with invariants and allowed variation. The existing
retrieval Tool/generated Remote returns historical R1 and current R2 values with
source ranges and provenance while leaving Canon unchanged; the existing Canon
area renders every rule, exemplar, boundary and rationale. An R3 exemplar missing
its purpose is rejected without advancing the head. The fresh stock-Web visible
path is covered by the dated evidence below; no form, Tool, store, page or
package was added.

The strict reader-contract RED then showed that
`reader-contract/contract-profile` accepted malformed delivery evidence and the
Canon area had no dedicated readable contract view. GREEN reserves only that
field as a versioned value containing a premise with distinctive situation,
central dramatic question, reader fantasy, constraints and tonal range, plus
the core experience, named promises, exclusions, target audience expectations,
source unit/revision/Anchor-bearing delivery evidence and revision rationale.
The existing retrieval Tool/generated Remote returns historical R1 and current
R2 values with source ranges and provenance while leaving Canon unchanged; the
existing Canon area renders the complete premise, promises, exclusions,
audience, evidence and rationale. An R3 evidence item missing `demonstrates` is
rejected without advancing the R2 head. The fresh stock-Web visible path is
covered by the dated evidence below; no form, Tool, store, page or package was
added.

The manuscript-decision RED showed that Result Packet Apply always installed a
rewritten manuscript even when the author only wanted its Canon or review
items. GREEN extends the existing decision vocabulary and generated Typert
Remote with `manuscript`, renders the same Accept/Reject/reason controls in the
stock `conversation.view`, and lets a rejected rewrite retain the prior
accepted manuscript while accepted Delta/Issue items advance the aggregate
revision. Canon-only packets still have no manuscript decision. The real rc.2
Remote regression, client normal path and current 120/120 package gate pass;
fresh stock-Web visible use remains `implemented-unverified`. No Tool, package,
Profile, Sidebar tab, TUI extension or alternate review UI was added.

The Apply-preview RED showed that authors could inspect individual packet items
but could not see the combined Canon result before committing the revision.
GREEN adds one generated `previewReview` Remote and one button inside the existing
Result Packet article. Preview and Apply share decision selection, revision CAS,
Canon-lock and narrative validation; Preview projects only accepted manuscript
and Delta items in memory, returns the complete manuscript/Canon/structure/clock/
debt/causal impact, and creates no revision, index entry or authorization. The
same decisions then produce an accepted impact exactly equal to the preview.
Client decision/reason changes clear the result and an independent epoch rejects
late async responses. The current package gate passes 186/186; fresh stock-Web
visible use remains `implemented-unverified`.

The fresh stock-Web Canon-only project-brief/style/reader smoke now promotes the
visible setup path for this increment. R1 accepted only strict `project`
style/reader contracts and `projectManuscripts(revision: 1)` was empty; R2
accepted `chapter-brief` plus source-bearing style exemplar and reader evidence.
The stock Agent's revision-bound `writingMemoryQuery` retrieval, historical R1
isolation, generated Remote, existing contract/manuscript panel and reload all
passed. GREEN recorded 17 direct RPC and 59 Web API responses with zero browser
failures, unchanged Canon/storage and a zero-listener shutdown on port `64304`;
RED recorded 11/22 and rejected missing `purpose` and `demonstrates` atomically
with head R2 unchanged. Exact artifacts and claim limits are in
[`project-brief-style-reader-stock-web-e2e-2026-09-02.md`](../docs/project-brief-style-reader-stock-web-e2e-2026-09-02.md).

The previous terminal slice was implemented by packages now removed as duplicate
generic work. Its historical smoke does not count for the current product.

## N-002 — Story hierarchy and ten narrative clocks

**Status:** `verified` for the accepted-revision hierarchy and clocks through
the Host service, generated Remote, existing conversation panel, rollback/reload
and a fresh isolated stock-Web visible smoke. Production and user acceptance
remain unverified. The strict `plot`, `reader-knowledge`, `mystery`,
`tension-payoff`, `progression`, `promise`, `character`, `relationship` and
`ending` and `world` contracts are now `verified` for the fresh stock-Web
evidence below; all ten fixed clock contracts have current visible evidence.

- [x] define accepted-delta vocabulary for
  `series|book|volume|arc|chapter|scene|beat|prose`;
- [x] validate legal parent level, unique parent, sibling order, standalone Book
  root, no orphan and no cycle against the actual accepted subset before the
  durable revision update;
- [x] make a unit's accepted identity/level immutable across later revisions;
- [x] project all ten fixed clock buckets in deterministic order, including
  empty buckets;
- [x] require explicit clock/debt deltas linked to an existing structure unit;
  reject mismatched debt-removal links and do not
  infer clocks from arbitrary `status` facts;
- [x] retain `sourceRevision`, delta, anchors and provenance in derived rows;
- [x] rollback must rebuild the target state while the new rollback revision
  remains the projection head;
- [x] extend the existing Novel Project panel only; no new package, duplicate
  sidebar tab, tree workbench or state store;
- [x] add focused unit, real Remote and client rendering tests.
- [x] reserve only `plot` as a strict versioned clock contract while leaving the
  other non-tension clocks generic; scope it to one accepted narrative unit and
  retain at least one plot line with goal, stakes, status and ordered obstacle,
  choice, consequence or reversal turns carrying story event, cost and
  resulting state;
- [x] compare the complete accepted clock value so nested line/turn/version/
  rationale changes appear in revision impact even when movement/state/story
  time are unchanged, while provenance-only rewrites remain outside story
  change;
- [x] return historical/current strict plot state, plot debt and complete
  before/after evidence through the existing Tool/generated Remote and render
  scope, lines and turns in the existing Narrative clocks area without another
  Tool, store, page or package;
- [x] reject empty plot lines, scope target/level mismatch, missing source
  anchors and incomplete turns atomically without advancing the accepted head.
- [x] reserve only `reader-knowledge` as a strict versioned disclosure clock
  while leaving the other non-plot/non-tension clocks generic; scope it to one
  scene/chapter/arc/volume and retain disclosure, hint, reminder, misdirection
  or recontextualization events that reference existing Knowledge targets;
- [x] retain each event's intended know/suspect/misread/remember effect, unit,
  viewpoint/access, description and source Anchors plus one preserve/narrow/
  resolve ambiguity policy, without copying `knowledge/state` belief, memory,
  truth alignment or access authority;
- [x] return historical/current nested events and complete revision comparison
  through the existing Tool/generated Remote and render them in the existing
  Narrative clocks area, allowing an empty event list for a deliberate hold;
- [x] reject invalid version, scope target/level, top-level or nested Anchors and
  empty required fields atomically without adding a Tool, query, store, page or
  package.
- [x] reserve only `mystery` as a strict versioned progression clock while
  leaving the remaining non-plot/non-reader/non-tension clocks generic; retain
  at least one open-question/advance/complicate/misdirect/partial-reveal/reveal/
  recontextualize/hold move per scene/chapter/arc/volume scope;
- [x] make each move reference existing Mystery, Clue and Knowledge target ids
  plus a contribution summary without copying truth, hypotheses, clue content,
  knowledge belief/access or another lifecycle authority;
- [x] return historical/current nested mystery moves and complete revision
  comparison through the existing Tool/generated Remote and render all refs in
  the existing Narrative clocks area without another Tool, query, store, page
  or package;
- [x] reject empty moves, duplicate move ids, invalid scope target/level, missing
  source anchors and empty required fields atomically while allowing explicit
  `hold` as the sole no-progress move.
- [x] reserve `progression` as a strict versioned scope/track clock that records
  main/supporting growth pacing, action, accepted advancement/Promise/Ending
  target references, setup/payoff readiness, drift warnings and contribution
  without copying the referenced facts;
- [x] reserve `promise` as a strict versioned scope/move clock that records
  open/remind/complicate/partial-payoff/payoff/retire/hold against real Promise
  and debt ids while keeping `promise/state` authoritative in the same atomic
  accepted revision;
- [x] reserve `character` as a strict versioned scope/move clock that records
  pressure/decision/consequence/commitment/transformation/hold against real
  character and story-event ids without copying arc or trajectory facts;
- [x] reserve `relationship` as a strict versioned scope/move clock that links a
  stable pair line, one directional relationship target and real story-event/
  emotion ids while preserving independent A-to-B and B-to-A accepted states;
- [x] return all four clocks through the existing Tool/generated Remote with
  historical/current complete comparison and render them only in the existing
  Narrative clocks area; reject invalid strict values atomically without adding
  a Tool, query, store, page, Profile, TUI extension or package.
- [x] reserve `ending` as a strict versioned closure-pacing clock whose moves
  reference existing narrative debts and whose R1/R2 values remain aligned with
  the authoritative ending hypothesis and closure ledger in the same accepted
  revision; reuse one Ending view in both existing UI locations;
- [x] reserve `world` as a strict versioned reference-only clock whose moves
  identify existing world-rule targets and faction/location/object continuity
  entries without copying their content or source evidence;
- [x] remove the now-consumerless generic clock value, schema and delta branches
  after all ten fixed clocks have strict contracts, while retaining narrative
  debts and ending debt references;
- [x] reserve only `tension-payoff` as a strict versioned clock contract while
  leaving the other nine narrative-clock buckets generic;
- [x] scope tension/payoff to one `unitId` at `scene|chapter|arc|volume` level
  and retain multiple overlapping waves with source, qualitative
  opening/peak/closing intensity, duration, typed scene functions and nullable
  release/recovery records;
- [x] return historical R1, current R2 and R1→R2 comparison through the existing
  retrieval Tool/generated Remote with source revision, Anchor ranges, Delta and
  provenance while leaving Canon unchanged;
- [x] render the accepted scope and waves in the existing Narrative clocks area,
  including intensity, duration, release, recovery and scene functions, without
  another Tool, store, page or package;
- [x] reject a release that omits its required aftermath atomically without
  advancing the accepted head.

Current evidence: the narrative focused file passes 30/30 and the package suite
passes 239/239; focused Remote passes 131/131 and focused Client passes 41/41;
typecheck, lint, build and the single-package dry-run pass. The
fresh isolated stock Web Profile at
`C:\Users\33166\AppData\Local\Temp\novel-agent-current-web-270cd52400ab417aa0682681e224b4c4`
visibly accepted and reloaded R1 with a Book unit, plot movement, promise debt,
all ten fixed clock buckets, source/provenance labels and no console/page/request
errors. Its final accessibility capture is a normal list, not a false Tree
widget. The strict plot fixture covers an R1 line with obstacle/choice and an R2
with the same outer summary but added consequence/reversal; full-value revision
comparison, plot debt, source evidence, strict rejection and the existing panel
all pass locally. Its fresh stock-Web interaction is now verified by
[`plot-clock-stock-web-e2e-2026-09-02`](../docs/plot-clock-stock-web-e2e-2026-09-02.md):
R1/R2 retrieval, Remote, Narrative clocks rendering and reload passed with 18
RPC/65 Web, browser failures 0 and unchanged Canon/storage. The stricter
reader-knowledge fixture is now separately verified by
[`reader-knowledge-clock-stock-web-e2e-2026-09-02`](../docs/reader-knowledge-clock-stock-web-e2e-2026-09-02.md):
R1/R2 nested disclosure events, historical/current retrieval, Remote,
Narrative clocks rendering and reload passed with 19 RPC/64 Web, browser
failures 0 and unchanged Canon/storage; the clean RED rejected an empty nested
Anchor list. The strict mystery fixture is now separately verified by
[`mystery-clock-stock-web-e2e-2026-09-02`](../docs/mystery-clock-stock-web-e2e-2026-09-02.md):
R1 four ordered moves became seven at R2, and one native retrieval matched
selected Remote hits/impact and historical/current `projectNarrative`; the
existing Narrative clocks panel restored all seven moves after reload. It
records 18 RPC/87 Web, browser failures 0, unchanged Canon/storage and a
zero-listener shutdown on port `64272`; the clean RED rejected a duplicate
`moveId` with R1 unchanged. The strict tension-payoff fixture is now separately
verified by
[`tension-payoff-clock-stock-web-e2e-2026-09-02`](../docs/tension-payoff-clock-stock-web-e2e-2026-09-02.md):
R1 retains two overlapping waves with a partial/planned pursuit release and
ongoing relationship aftershock; R2 advances only the pursuit to full release
and occurred recovery. Retrieval, Remote, Narrative clocks rendering and reload
passed with 18 RPC/87 Web, browser failures 0 and unchanged Canon/storage. The
clean RED exercised the omitted `release.aftermath` wire-boundary rejection.
The strict progression fixture is now separately verified by
[`progression-clock-stock-web-e2e-2026-09-02`](../docs/progression-clock-stock-web-e2e-2026-09-02.md):
R1 setup/hold became R2 apply-consequence with delivered readiness and a typed
missing-cost drift warning; one native retrieval matched the generated Remote,
historical/current `projectNarrative`, Narrative clocks panel and reload. It
records 18 RPC/87 Web, browser failures 0, unchanged Canon/storage and a
zero-listener shutdown on port `64282`; the clean RED rejected an advance with
no advancement id. Process/transport recovery, production and user acceptance
remain unverified.

The strict ending closure-clock branch is now separately verified by
[`ending-clock-stock-web-e2e-2026-09-02`](../docs/ending-clock-stock-web-e2e-2026-09-02.md).
The fresh GREEN accepts a Book-scoped R1 ending hypothesis, two acyclic debts
and a `converge→hold` clock, then one atomic R2 packet updates the hypothesis,
resolves one debt and advances the clock to `resolve→aftermath→hold`. A native
four-key retrieval, generated closure Remote, `projectNarrative`, the existing
Ending/Narrative clocks and closure-ledger views, and reload all agree. GREEN
records 20 direct RPC and 89 Web API responses, zero browser failures, unchanged
Canon/storage, no post-seed `novel/` frames and a zero-listener shutdown on
port `64293`; RED2 rejects a duplicate `moveId` with R2 unchanged. Process/
transport recovery, production and user acceptance remain outside this evidence.

The strict world reference-clock branch is now separately verified by
[`world-clock-stock-web-e2e-2026-09-02`](../docs/world-clock-stock-web-e2e-2026-09-02.md).
The fresh GREEN accepts a Book→Volume→Arc→Chapter hierarchy, typed world rule
and faction/location/object continuity facts, then updates all four families
and adds a fourth reference-bearing world move at R2. The native four-key
retrieval, generated Remote, typed continuity ledgers, `projectNarrative`,
existing World/Narrative clocks panel and reload agree. GREEN records 20 direct
RPC and 86 Web API responses, zero browser failures, unchanged Canon/storage,
no post-seed `novel/` frames and a zero-listener shutdown on port `64297`;
RED rejects a duplicate `moveId` with R2 unchanged. Cross-Canon existence
validation, world simulation, process/transport recovery, production and user
acceptance remain outside this evidence.

## N-003 — Revision-aware retrieval and review

**Status:** `verified` for direct structured/exact-text retrieval, local Chinese
full-text search, freshness invalidation, the bounded current-index DSH Job, the
accepted-revision relationship Remote and its existing domain panel. The
bidirectional RelationshipLine and strict `relationship/line-state` extension
are `verified` for the fresh stock-Web R1/R2 projection, rejection and reload
evidence below.
The strict Book/Series `ending.hypothesis` closure-ledger extension is
`verified` for the fresh stock-Web R1/R2 closure-clock, retrieval, Remote,
ledger rendering and reload evidence below.
The reserved strict `character-state/arc-hypothesis` trajectory extension is
`verified` for the fresh stock-Web R1→R2 trajectory/retrieval/Remote/panel
evidence below; the broader generic character trajectory and other
`character-state` fields remain unverified or generic.
The strict `promise/state` lifecycle extension and `promise` pacing clock are
`verified` for the fresh stock-Web R1/R2 lifecycle/clock evidence below; other
`promise` fields remain generic.
The strict `relationship` pacing clock is likewise `verified` for the fresh
stock-Web R1/R2 retrieval, generated-Remote, Narrative-clocks/relationship
views, duplicate-move rejection and reload evidence below; other relationship
fields remain generic.
The strict `mystery/state` lifecycle is now `verified` for the fresh stock-Web
R1→R2 retrieval, linked-clue projection, generated Remote, panel/reload and
malformed-truth rejection evidence below; broader mystery/reveal semantics
remain unverified.
The strict `world` reference clock and typed rule/faction/location/object
continuity retrieval are `verified` for the fresh stock-Web R1/R2 projection,
historical/current reads, generated Remote, Narrative clocks and reload evidence
below; cross-Canon existence validation remains out of scope.
The typed `progression.advancement`, `faction-state.continuity`,
`location-state.continuity`, `object-state.continuity` and
`emotion-state.episode` ledgers are now also `verified` for their fresh
stock-Web R1/R2 retrieval, Remote, selector/reload and strict boundary evidence
below; broader growth, faction, location, inventory and emotion semantics retain
their narrower statuses.
Query-independent no-`chapterId` character carry-forward is now `verified` for
the fresh stock-Web synthetic projection: the current/historical carry item is
query-independent, source-bearing, Remote-equal and restored by the existing
writing-memory panel after reload. The strict scope and remaining limits are
recorded in the evidence entry below; long-range control-pack carry-forward
remains covered only by its separate `implemented-unverified` path.
The relationship carry-forward and complete character/reader knowledge-boundary
sub-scopes are now promoted by the fresh stock-Web evidence below. The exact no-`chapterId`
writing-memory path for all three strict authoring contracts, the character
arc, latest reader disclosure and latest Chapter outcome is
`verified` across a new Agent Session, Host restart and renderer reload by the
[2026-09-01 stock-Web evidence](../docs/authoring-memory-restart-stock-web-e2e-2026-09-01.md);
the accepted-`chapterId` Chapter control-pack retrieval and existing-panel
builder path is also `verified` by a fresh stock-Web smoke; the remaining
writing-memory branches retain their narrower evidence status.
Anchored issue generation, target-manuscript selection and decision application
are `verified` for the current fresh stock-Web flow, including a
reviewer-proposed rewritten manuscript and non-empty unified Diff.

- [x] structured and exact-text retrieval with source anchors;
- [x] optionally restrict structured Canon fact hits to one existing
  `canonKind` without changing narrative, graph or manuscript results;
- [x] optionally restrict structured Canon fact hits to one accepted
  `canonTargetId`, including composition with `canonKind`;
- [x] optionally restrict structured narrative-unit hits to one existing
  `narrativeLevel` such as Chapter or Scene;
- [x] optionally restrict structured narrative-unit, clock-entry and debt hits
  to one accepted `narrativeUnitId` while retaining unrelated Canon and text hits;
- [x] optionally restrict structured narrative-clock and narrative-debt hits to
  one existing `narrativeClock` such as Plot or Promise;
- [x] optionally restrict exact-text and Chinese full-text manuscript hits to
  one accepted `unitId` while retaining that unit's source revision;
- [x] internal local Chinese full-text index with MiniSearch + Jieba; no public
  provider registry, package or search UI;
- [x] freshness invalidation and one-current-revision rebuild jobs through the
  existing DSH Jobs service and UI/tool surface;
- [x] bind every rebuild to the exact active DSH Agent so the standard preset's
  scoped `dsh-tool-jobs` controller owns read/wait/kill; do not attach a global
  novel-agent controller;
- [x] generate read-only manuscript/Canon review issues through the stock DSH
  Subagent service, with exact unique anchors and no draft authorization or
  Canon mutation;
- [x] reuse the existing `conversation.view` Result Packet decisions and Apply
  path, including an independent manuscript Accept/Reject choice; do not add a
  review tab, TUI extension or another package;
- [x] expose the existing reviewer `focus` and optional per-item author decision
  `reason` in that same Result Packet panel;
- [x] generate and review a non-empty manuscript Diff when a reviewer proposes
  rewritten prose;
- [x] graph retrieval is an on-demand rebuildable projection, never Canon;
  vector retrieval remains intentionally unimplemented until a concrete domain
  query requires it.
- [x] carry the latest explicit accepted post-Chapter state for every character
  beyond the bounded nine-Chapter control-pack window, preserving the exact
  source Chapter, revision, Delta, Anchor ranges and provenance.
- [x] when a next-Chapter writing-memory request omits `chapterId`, reuse the same
  latest-per-character state as mandatory query-independent recall, preserve
  explicit empty-state clears and requested-revision isolation, and leave the
  top-level field empty when a control pack already owns that memory.
- [x] reuse the accepted relationship projection as mandatory query-independent
  next-Chapter recall, retaining complete A↔B lines, both directions and every
  field source; historical revisions exclude later one-way rewrites and a
  control-pack request leaves the top-level relationship list empty.
- [x] reuse every requested-revision accepted knowledge projection as mandatory
  query-independent next-Chapter recall, returning a stable boundary for each
  character/reader with complete known-fact fields, source ranges, provenance and
  freshness; historical revisions exclude future subjects/rewrites and a
  control-pack request leaves the top-level boundary list empty.
- [x] accept optional `writingMemoryQuery` on the existing read-only retrieval
  Tool/Remote and rank at most three requested-revision manuscript excerpts,
  setting facts, continuity facts or narrative-clock entries, and narrative
  debts per bucket through the existing MiniSearch/Jieba path.
- [x] rank at most three accepted rolling roadmaps for the same Plan/Write intent
  and return their cross-Chapter horizon, milestones, ranges, dependencies and
  scoped debts through the existing revision-bound roadmap resolver.
- [x] when a not-yet-accepted next Chapter has no `chapterId`/control pack, rank
  at most three accepted narrative units by hierarchy, objective, entry/exit
  state, status and Chapter contract; retain exact revision/Anchor/provenance
  and return an empty bucket when a control pack already owns that structure.
- [x] index strict narrative-clock `revisionRationale` and reader-knowledge
  `ambiguityPolicy`, retain complete source evidence, exclude later revisions
  from historical recall and leave Canon/head unchanged.
- [x] trace one accepted story event's downstream causal impact through stable
  shortest paths while retaining every edge's revision, Delta, Anchor, range
  and provenance; impact-only retrieval does not return the full graph or write
  Canon.
- [x] assemble a Book/Series closure ledger from its inclusive accepted subtree,
  ending entries, all still-projected debts and an author-supplied remaining
  Chapter budget without inferring status or priority; explicit composite debt
  references produce a stable dependency order.
- [x] accept strict Book/Series `ending.hypothesis` set/remove values with a
  positive version, target, conflict, choice, theme, afterimage, fixed resolution
  mode, typed final states, aftermath, unresolved debt references and nullable
  epilogue purpose.
- [x] project the scoped current or historical ending hypothesis with complete
  source metadata, or `null` when absent, through the same closure Tool/Remote
  and existing `conversation.view` without mutating Canon or adding another
  ending store.
- [x] compare two complete accepted revision snapshots across manuscripts,
  Canon facts, narrative units, clock entries and debts, returning stable
  added/removed/changed sets with complete before/after source evidence.
- [x] compare both accepted causal projections and report, for each explicit
  source event, downstream consequences that were added, removed or reached by
  a different shortest path with complete before/after edge evidence; do not
  return the unrequested full graph or treat provenance-only rewrites as impact.
- [x] accept first-class `knowledge` Canon facts with explicit `subject->fact`
  endpoints, expose them through the existing `canonKind` structured query and
  project one source-bearing typed knowledge edge without adding a graph store,
  Tool or UI.
- [x] reserve only `knowledge/state` as a strict versioned reader-or-character
  belief contract covering known/suspected/misread status, retained/recalled/
  forgotten memory, truth alignment and source unit/viewpoint access while
  leaving other Knowledge fields generic; render it in the existing Canon and
  Knowledge boundary views without another query, store, page or package.
- [x] accept versioned typed `world.rule` values with scope, statement,
  exceptions, public belief, hidden truth and observed consequences through the
  existing Result Packet and Canon revision transaction.
- [x] retrieve one targeted world rule through the existing Tool/generated
  Remote, preserving the current hit/source and R1/v1 to R2/v2 before/after
  comparison while leaving Canon unchanged and adding no dedicated UI or store.
- [x] accept strict typed `roadmap.plan` values with a version, detailed horizon
  and ordered units carrying Chapter ranges, milestones, status, unit
  dependencies, scoped debt ids and change rationale.
- [x] retrieve one targeted rolling plan through the existing Tool/generated
  Remote, resolve its revision-bound ordered units and dependency/debt references
  as resolved, missing or ambiguous with source evidence, and expose the selector
  plus complete result in the existing `conversation.view`. Preserve R1/v1 to
  R2/v2 comparison without automatic replanning or a new Tool, store, package or
  Profile.
- [x] project accepted `relationship` facts into deterministic directional
  states, then combine `A->B` and `B->A` into one lexicographically keyed
  RelationshipLine while preserving independent fields, field sources and
  provenance; rebuild it from the requested accepted revision so remove and
  rollback follow Canon.
- [x] render both directions under that line in the existing `conversation.view` panel;
  refresh it after author Apply and rollback without adding a Sidebar tab, TUI
  extension or generic relationship UI.
- [x] reserve `relationship/line-state` as a strict versioned directional value
  containing premise/form/stage, independent goal, trust/conflict/commitment,
  boundaries, shared history, obstacles, unresolved debts, main-plot
  consequences, earned turns, agency evidence, target ending and rationale while
  leaving other Relationship fields generic;
- [x] require every earned turn to retain event, action, other-side response,
  cost, persistent consequence and resulting stage, then render both directions'
  strict state, turns, debts and main-plot consequences in the existing panel;
- [x] assemble one participant's accepted typed `story-event` facts into a
  story-time ledger ordered by story-time start, manuscript order and event id,
  retaining source ranges and provenance without parsing free text.
- [x] reconstruct one character's accepted `character-state` trajectory by
  diffing consecutive aggregate revision projections, including rollback,
  same-value/new-evidence changes, field removal, current fields, before/after
  evidence and the accepted Delta's source ranges.
- [x] reserve strict `character-state/arc-hypothesis` set/remove values with a
  positive version, scope, hypothesis, starting belief, target transformation,
  dimensions, pressures, costly decision chain, current stage, unresolved
  question and nullable change rationale while leaving other CharacterState
  fields on the generic Canon path.
- [x] project the arc through the existing `characterTrajectoryId`
  Tool/generated Remote for historical and current before/after/source evidence,
  and render its decisions in the existing `conversation.view` without changing
  Canon or adding a fact family, Tool, store or package.
- [x] render both ledgers in the existing Canon area of `conversation.view`;
  character decisions and `emotionalResidue` remain ordinary accepted
  `character-state` fields, with no guessed link to free-form `emotion-state`
  targets and no new package, tab, store or adapter.
- [x] reconstruct one explicit `clue` target across accepted revisions and render
  its current fields, before/after, set/remove Delta ranges, packet, provenance
  and rollback-restored sources in that same Canon area without interpreting
  status or creating another Tool, store, tab, adapter, Profile or package.
- [x] reserve only `clue/state` as a strict versioned value covering clue,
  foreshadowing and red-herring roles, linked mysteries, lifecycle status,
  reader visibility, intended function, payoff window, typed payoff/aftermath,
  abandonment reason and revision rationale while leaving other Clue fields
  generic; render the same source-labelled state in Canon and clue lifecycle.
- [x] accept strict typed `mystery.state` values containing positive version,
  question, an author-unknown/author-known discriminated truth, hypotheses,
  knowers, reader visibility, concealment rule, reveal conditions, earliest fair
  resolution, desired reveal window, actual reveal, aftermath and rationale;
- [x] expose that lifecycle through `mysteryLifecycleId` on the existing
  Tool/generated Remote and Canon area with current/historical, before/after,
  accepted Delta/source ranges, packet and provenance; exclude other mysteries
  and add no Tool, store, Profile or package.
- [x] derive matching strict `clue/state` foreshadowing/red-herring evidence for
  each Mystery lifecycle revision, including Delta, Anchors and provenance, and
  retain evidence-only lifecycle entries without creating another clue store.
- [x] reserve only `promise/state` as a strict versioned value covering
  version/type/weight/horizon, source-bearing setup/reminders/complications and
  an `open|partially-paid|paid|retired` resolution with fixed payoff types,
  retirement rationale and required partial/paid aftermath, while leaving other
  Promise fields on the generic Canon path.
- [x] project historical/current R1/R2 Promise state, before/after revisions,
  accepted Delta ranges, packet, source ranges and provenance through the
  existing `promiseLifecycleId`, and render the same state in the existing Canon
  and lifecycle areas without another Tool, store, page or package.
- [x] assemble one character's explicit typed `progression.advancement` facts at
  the requested accepted revision in story-order/event/id order, retaining the
  earned change, remaining limits, counters and complete source evidence while
  excluding other characters and legacy free-form rank facts.
- [x] expose that ledger through `progressionCharacterId` on the existing
  retrieval Tool/generated Remote and render it in the existing Canon area.
- [x] assemble one faction's explicit typed `faction-state.continuity` entries
  in story-order/event/id order, retaining goals, resources, constraints,
  current action, membership/alliance changes, off-screen consequences and
  complete source evidence while excluding other factions and legacy text.
- [x] expose that ledger through `factionId` / `factionContinuity` on the existing
  Tool/generated Remote and Canon area with current/historical freshness, adding
  no Tool, store, Profile or package.
- [x] validate record-shaped `faction-state/continuity` values at the Result
  Packet boundary while preserving primitive/array legacy values as generic
  Canon facts;
- [x] assemble one location's explicit typed `location-state.continuity` entries
  in story-order/event/id order, retaining nesting, scale, access, governing
  factions, active rules, resource flows, typed travel links, current change,
  consequence and complete source evidence.
- [x] expose that ledger through `locationId` / `locationContinuity` on the
  existing Tool/generated Remote and Canon area with current/historical
  freshness, excluding other locations and legacy text without adding a map,
  travel adjudication, Tool, store or Profile.
- [x] validate record-shaped `location-state/continuity` values at the Result
  Packet boundary while preserving primitive/array legacy values as generic
  Canon facts;
- [x] assemble one object's explicit typed `object-state.continuity` entries in
  story-order/event/id order, retaining holder, location, quantity, condition,
  status, current change, consequence and complete source evidence.
- [x] expose that ledger through `objectId` / `objectContinuity` on the existing
  Tool/generated Remote and Canon area with current/historical freshness,
  excluding other objects and legacy text without inventory auto-sync,
  deduplication, conservation checks or a new Tool, store or Profile.
- [x] validate record-shaped `object-state/continuity` values at the Result
  Packet boundary while preserving primitive/array legacy values as generic
  Canon facts;
- [x] project one character's typed `emotion-state/episode` records through
  `emotionCharacterId`, retaining mixed emotions, expression/suppression,
  residue, reactivation, downstream choices and complete source evidence;
- [x] validate record-shaped `emotion-state/episode` values at the Result Packet
  boundary while preserving primitive/array legacy values as generic Canon facts.

Current evidence: the generated real DSH `retrieve` Remote rebuilds the requested
accepted revision, returns structured Canon/narrative rows, exact-text ranges
and Chinese full-text hits with matched source ranges, provenance, source
revision and `current|historical` freshness. Its real DSH `novel-index` Job
rebuilds exactly the current accepted revision, records the exact owner Session,
and is waited through `ctx.jobs`; accepting R2 invalidates the cached R1 index
and a newly requested R1 rebuild is then rejected. A fresh stock Web Profile
created a `standard` Agent. In successful Session
`session-c5048727-7feb-4c7f-a3e9-fc6000a0d33a`, the model called
`rebuild_novel_index`, received `novel-index-1`, observed the native
`tool-jobs` completed notification and ended normally without a novel-agent Jobs
controller. The retained evidence root is
`C:\Users\33166\AppData\Local\Temp\novel-agent-stock-agent-replay-20260827-1932`.
The generated `reviewDraft` Remote resolves the active `conversation.view`
Session through DSH's live Agent registry, starts the stock `spawn` Subagent as
that same Agent's child and always disposes the run. The resulting draft has no
author authorization, carries the complete rewritten manuscript, and uses
`diff@9.0.0` to produce a hunk with actual removed/added prose. Each quoted
anchor must exist exactly once in the original accepted text. An unchanged or
no-effective-Diff rewrite is rejected, as is a result whose accepted revision
advanced while review was running. The existing panel lets the author select
the review manuscript, provide the reviewer focus, decide every item, record an
optional reason and adds authorization only on Apply. Focused client tests prove
the two request payloads; their fresh-Profile visible use remains unverified. A fresh isolated stock-Web
run accepted R1 `chapter-a` and R2 `chapter-b`, selected `chapter-a` for review,
applied its rewrite as R3, rolled back aggregate R2 as R4, and reconstructed
both units with their original `sourceRevision` and provenance after reload.
All 29 Novel Project RPC responses were HTTP `200`; console/page/request errors
were zero. See
[`multi-manuscript-review-stock-web-e2e-2026-08-28.md`](../docs/multi-manuscript-review-stock-web-e2e-2026-08-28.md).

The manuscript-scoped retrieval RED failed because the existing strict
`retrieve_novel_context` schema rejected `unitId`. GREEN adds the optional id to
the same query/Tool/Remote and filters only exact-text/full-text manuscript hits;
structured Canon, narrative, graph and Chapter control-pack results are
unchanged. A real rc.2 Tool regression uses two accepted Chapters containing
the same Chinese term and returns only `chapter-a` text hits with its original
R1 source revision while the Canon head remains R2. Fresh stock-Web visible use
remains `implemented-unverified`; no index, Tool, UI, package or store was added.

The Canon-family retrieval RED likewise failed because the strict query schema
rejected `canonKind`. GREEN exposes the existing `CANON_FACT_KINDS` enum through
the same query, Tool and generated Remote, filtering only structured Canon fact
hits. A real rc.2 Tool/Remote regression requests `clue` from a revision that
also contains character-state and promise facts, retains the clue's R1 source,
anchor and provenance, and leaves Canon at R1. Fresh stock-Web visible use
remains `implemented-unverified`; no query subsystem, index, UI or store was
added.

The exact-entity retrieval RED then failed because the same strict query
rejected `canonTargetId`; the generated Remote independently proved its old
codec discarded that field. GREEN passes the accepted target id through the
same query, Tool and generated Remote and filters only structured Canon fact
hits. A real rc.2 Tool/Remote regression selects `clue-moon-gate` from two
accepted clue targets, preserves its R1 Anchor, provenance and source revision,
and leaves Canon at R1. No entity index, query service, Tool, UI or store was
added.

The narrative-level retrieval RED failed on the same strict boundary for
`narrativeLevel`. GREEN exposes the existing eight-level hierarchy enum through
the same query, Tool and generated Remote and filters only structured
narrative-unit hits. A legal Book → Volume → Arc → Chapter R1 regression returns
only the Chapter with its Anchor, provenance and source revision while Canon
stays R1. Fresh stock-Web visible use remains `implemented-unverified`; no
hierarchy query service, index, UI or store was added.

The exact narrative-unit RED failed because that strict query rejected
`narrativeUnitId`; the old generated Remote then discarded it. GREEN passes one
accepted unit id through the same query, Tool and generated Remote and applies
it only to structured narrative units, clock entries and debts. A legal R1 with
two Chapters returns only `chapter-a` narrative state, while the same query
retains its Canon hit and an exact-text hit from `chapter-b`; Anchors,
provenance, source revisions and Canon head remain unchanged. No narrative
query service, index, Tool, UI or store was added.

The narrative-clock retrieval RED failed because that strict query rejected
`narrativeClock`; the generated Remote then independently proved its old codec
discarded the new field. GREEN exposes the existing ten-clock enum through the
same query, Tool and generated Remote and filters only structured clock entries
and debts. A real rc.2 Tool/Remote regression requests `promise` from R1 with
both plot and promise movement, returns the promise entry and debt with their
Anchor, provenance and source revision, and leaves Canon at R1. Fresh stock-Web
visible use remains `implemented-unverified`; no clock query service, index, UI
or store was added.

The graph projection is derived only from the requested accepted revision. It
contains narrative hierarchy, Canon facts, explicit `A->B` relationship
endpoints, typed `story-event.causes = target-event-id` causal edges, and
typed `knowledge` subject-to-fact edges, plus narrative clock/debt links. Every
node and edge carries source revision, delta, anchors, source ranges and
provenance; stable ordering yields a content hash. The same accepted knowledge
fact is directly selectable with `canonKind: "knowledge"`, and Story World can
name it through the existing explicit role-knowledge input. No graphology
dependency, graph store, graph Remote, Job, cache or UI was added. The focused
real-DSH graph Tool proof passes while a fresh stock-Web visible graph request
remains `implemented-unverified`; vector retrieval remains open.

The same query now accepts `impactEventId` and derives a stable breadth-first
impact trace from those accepted causal edges. A real rc.2 Tool and generated
Typert Remote regression returns B at depth one and C at depth two for A→B→C,
retains each shortest path's source metadata, excludes an unrelated event and
does not expose the internally rebuilt full graph or advance R1 Canon. Fresh
stock-Web visible use remains `implemented-unverified`; no Tool, graph store,
UI, package or dependency was added.

The same query now accepts `closureScopeId` plus a positive
`remainingChapterBudget`. A real rc.2 Tool and generated Typert Remote regression
selects one accepted Book subtree in hierarchy order, returns its ending entries
and every debt still present in the requested revision by fixed clock/unit order,
retains source metadata and excludes another Book. A non-`open` debt remains in
the ledger until an accepted remove, so no free-form status meaning is invented.
The read-only result returns the author's budget, omits the full graph and leaves
R1 Canon unchanged. Fresh stock-Web visible use remains
`implemented-unverified`; no forecast engine, Tool, UI, store or dependency was
added.

Accepted debt values can now declare `dependsOn` with `{clock,id}` references,
so ids remain unambiguous across the ten clocks. The same closure regression
orders an explicit chain as relationship trust → old-city promise → return
promise → relationship vow while retaining the non-`open` but still-projected
trust debt. Independent ready debts keep the existing fixed clock/unit order;
the plugin does not invent edges, weights, priorities or resolution state.

Accepted Canon now also owns strict Book/Series `ending.hypothesis` set/remove
values. A real rc.2 Tool and generated Typert Remote regression advances one
Book from R1/v1 to R2/v2, returns every typed hypothesis field plus revision,
Delta, Anchor, source range and provenance, excludes another Book and restores
the R1 value for a historical read. The earlier closure path still returns
`endingHypothesis: null` when the scope has no accepted hypothesis. Retrieval
leaves the R2 Canon projection and head unchanged, and the existing ending area
in `conversation.view` renders the value and source evidence. Fresh stock-Web
visible interaction remains `implemented-unverified`; no new Tool, store, page,
Profile or package was added.

Optional `compareRevision` now treats the requested `revision` as the target and
compares the two reconstructed accepted snapshots. A real rc.2 Tool and generated
Typert Remote regression reports a changed Chapter manuscript, changed
relationship fact, removed clue, changed Chapter unit and relationship clock,
and two added debts in fixed clock/id order. A same-value Canon set with new
provenance is correctly omitted; every actual before/after retains its original
revision, Delta, Anchor and provenance. The existing revision history in
`conversation.view` now calls that generated Remote for any historical accepted
revision and renders the complete manuscript, Canon, narrative-unit, clock, debt
and causal net impact against the current head without Apply or rollback. The
query returns no graph and leaves the accepted head at R2. The focused client
normal path and current 186/186 package gate pass; fresh stock-Web visible use
remains `implemented-unverified`. No comparison Tool, store, dependency or new UI
surface was added.

The same revision impact now compares the two explicit causal projections. In
the real Tool/Remote regression, R1 `A→B→C` changes to `A→B→D` at R2 while both
`C→E` and `D→E` remain accepted. The result reports C removed, D added and E's
shortest path changed for both affected upstream sources; unchanged C/D source
paths are omitted. Every before/after edge retains revision, Delta, Anchor, range
and provenance, no full graph is returned and the accepted head remains R2.

That same revision-impact builder now powers Result Packet Apply preview. A real
rc.2 Remote regression previews selected R1→R2 manuscript and relationship/
causal changes, excludes a rejected clue, preserves the C-removed/D-added path
evidence, leaves R2 unreadable before Apply, and then matches the accepted R2
impact exactly. The existing `conversation.view` article renders this result and
invalidates it on decision changes; no comparison store, workflow or new UI
surface was added.

The same `novel-project` package exposes `projectRelationships` through its
generated DSH Remote. It groups accepted `relationship` facts by the explicit
`from->to` key, preserves each field's value and source metadata, then groups
opposite directions into one stable `A<->B` line without treating their state as
symmetric. The existing `conversation.view` panel now loads each line and
renders both directional states, including field values and each direction's
latest source label, then refreshes them after Apply or rollback. The
projection remains derived on demand: it is not a relationship store and adds
no Sidebar tab, TUI extension or generic UI. The focused client and real-DSH
Remote proofs pass; a fresh stock-Web user interaction remains a separate
host-acceptance check.

Only `relationship/line-state` is now strict. A real generated-Remote regression
keeps Alice→Bob and Bob→Alice as independent R1 states, advances only the forward
direction at R2, and preserves each field's own revision, Delta, Anchor and
provenance. The accepted value includes independent goals, trust/conflict/
commitment, boundaries, shared history, obstacles, `unresolvedDebts`,
`mainPlotConsequences`, agency evidence and desired ending. Its earned sacrifice
turn retains the story event, action, other response, cost, persistent
consequence and resulting stage. The existing panel gives both directions a
dedicated readable display; an R3 turn missing `persistentConsequence` is rejected
without advancing the head. Fresh stock-Web visible use remains
`implemented-unverified`; no new Tool, store, tab, adapter, Profile or package was
added.

Optional `timelineParticipantId` on the existing retrieval query/Tool/generated
Remote selects only accepted typed `story-event.event` values that explicitly
list the participant, orders them by story time and manuscript order, and keeps
event effects plus complete revision/Delta/Anchor/range/provenance evidence. The
same Canon area lets the author select an accepted participant and build that
read-only ledger without exposing a graph or changing Canon.

Optional `characterTrajectoryId` reconstructs only accepted `character-state`
for that character at each changed aggregate revision. A real Tool/generated
Remote regression covers R1 decisions and emotional residue, R2 before/after
changes, an unrelated R3 head, historical freshness and exact accepted-Delta
source ranges. A second regression covers explicit field removal; rollback is
derived by diffing consecutive rebuilt projections, so restored fields retain
their original fact sources while the trajectory entry retains the rollback
revision's packet and provenance. The existing Canon area renders the same
entries, fields, before/after values, removal Delta, source ranges and producer.
This is locally `implemented-unverified` pending a fresh stock-Web interaction.

Within that generic trajectory, only `character-state/arc-hypothesis` is now a
reserved strict set/remove value. The real Tool/generated-Remote regression moves
one accepted arc from R1/v1 with no accepted decisions to R2/v2 with one costly
decision and R3/v3 with a second; every version retains scope, hypothesis,
starting belief, target transformation, dimensions, pressures, current stage,
unresolved question, rationale and the complete decision evidence. A historical
R2 request against head R3 and a current R3 request both return exact before/after
facts, accepted Delta ranges, packet and provenance through the existing
`characterTrajectoryId` path, while another generic CharacterState field remains
ordinary Canon. The existing `conversation.view` renders a dedicated arc section
and both costly decisions. Retrieval leaves Canon unchanged; an invalid strict
decision missing its persistent consequence is rejected without advancing R3.
The fresh stock-Web R1→R2 trajectory path is now verified in
[`character-arc-trajectory-stock-web-e2e-2026-09-02.md`](../docs/character-arc-trajectory-stock-web-e2e-2026-09-02.md):
the RED omitted `persistentConsequence` and kept R2 plus Canon/storage hashes,
while GREEN covered historical/current retrieval, generated Remote agreement,
panel rendering and reload (20 RPC / 68 Web, browser failures 0). The fixture
is synthetic; rollback-specific arc restoration, broader trajectory fields,
process/transport recovery, production and user acceptance remain unverified.
No new fact family, Tool, store, page or package was added.

Optional `clueLifecycleId` now applies the same accepted-revision reconstruction
to one `clue` target. The real Tool/generated Remote proof covers R1 planted
fields, R2 status change and field removal, current R3 rollback restoration,
historical R2 freshness, packet/provenance, accepted Delta ranges and restored
R1 fact sources. Only `clue/state` is now a reserved strict set/remove value;
other Clue fields remain generic. Its positive version distinguishes clue,
foreshadowing and red-herring roles and retains the statement, linked mysteries,
lifecycle status, reader visibility, intended function, expected payoff window,
typed payoff with aftermath, abandonment reason and revision rationale. The
strict normal path advances R1 planted foreshadowing to R2 paid-off, while an R3
payoff missing aftermath is rejected atomically and the head remains R2. The
existing Canon and clue lifecycle areas reuse the same source-labelled state
view without adding a foreshadow store, Tool, page, tab, adapter or package.
Package `188/188`, focused Remote `100/100` and focused Client `34/34` pass.
Fresh stock-Web clue/state interaction is now `verified` for the synthetic
R1→R2 lifecycle in
[`clue-state-stock-web-e2e-2026-09-02`](../docs/clue-state-stock-web-e2e-2026-09-02.md):
generated Remote, historical/current `clueLifecycleId`, existing panel/reload
and strict missing-payoff-aftermath RED all passed (22/67 RPC/Web in GREEN,
14/21 in RED, browser failures 0). Broader mystery/foreshadowing semantics,
process/transport recovery, production and user acceptance remain unverified.

Only `knowledge/state` is now a reserved strict set/remove value; other
Knowledge fields remain generic. It separates reader and character subjects,
known/suspected/misread belief, retained/recalled/forgotten memory, belief text
and truth alignment. Its access record identifies observed/told/inferred/
remembered/misreported acquisition, the source unit, optional viewpoint and
direct/limited/reported/unreliable viewpoint access. The real R1→R2 path retains
character and reader updates, historical/current freshness, source revision,
Delta, Anchor, provenance, subject isolation, generic confidence fields and the
existing typed knowledge edge while leaving Canon unchanged. Missing
`access.unitId` and non-null remove values reject R3 with the head at R2. Canon
and Knowledge boundary reuse one source-labelled state view; no Tool, query,
store, page, Profile, adapter or package was added. Package `188/188`, focused
Remote `100/100` and focused Client `34/34` pass. Fresh stock-Web knowledge/state
interaction is now `verified` for the synthetic R1→R2 path in
[`knowledge-state-stock-web-e2e-2026-09-02`](../docs/knowledge-state-stock-web-e2e-2026-09-02.md):
the current/historical `knowledgeSubjectId` boundary, generated Remote,
existing panel/reload and strict missing-`access.unitId` RED all passed (17/67
RPC/Web in GREEN, 8/22 in RED, browser failures 0). Broader semantic truth
inference, process/transport recovery, production and user acceptance remain
unverified.

Optional `mysteryLifecycleId` now reconstructs one strict typed `mystery.state`
through the existing Tool/generated Remote. The real normal path covers R1
author-unknown truth plus a red herring, then R2 author-known truth, reveal
window, actual reveal and matching foreshadowing. It retains version, question,
truth union, hypotheses, knowers, reader visibility, concealment rule, reveal
conditions, earliest fair resolution, desired window, actual reveal, aftermath,
rationale, current/historical freshness, before/after, accepted Delta/source
ranges, packet and provenance. Each entry also derives every accepted strict
`clue/state` whose linked mystery ids match at that revision; evidence-only clue
changes remain visible with an empty state-change list. Another mystery is
excluded, query leaves Canon unchanged, and an author-unknown truth with a
non-null answer rejects atomically with head R2. The existing Canon area reuses
the same Mystery/Clue presentation; no new Tool, store, Profile or package was
added. Fresh stock-Web strict `mystery/state` use is now `verified` for the
synthetic R1→R2 lifecycle in
[`mystery-state-stock-web-e2e-2026-09-02`](../docs/mystery-state-stock-web-e2e-2026-09-02.md):
the current/historical lifecycle, linked clue evidence, generated Remote,
`projectNarrative`, existing Mystery/Clue panel and reload all agree. GREEN
records 22 direct RPC and 60 Web API responses, zero browser failures,
unchanged Canon/storage and a zero-listener shutdown on port `64463`; RED
rejects an author-unknown truth carrying an answer and keeps R2 (14/21
RPC/Web). Broader mystery/reveal semantics, rollback-specific restoration,
process/transport recovery, production and user acceptance remain unverified.

Only `promise/state` is now a reserved strict set/remove value; other Promise
fields remain generic. Its positive version, promise, open type,
`minor|supporting|major|core` weight and opened/payoff-start/payoff-end horizon
travel with source-bearing setup, reminders and complications. The discriminated
resolution is `open|partially-paid|paid|retired`: open carries no payoff;
partial/paid carries one
`micro|chapter|arc|relationship|mystery|progression|thematic|final` payoff type
and beat and requires non-empty aftermath; retired carries a beat and non-empty
retirement rationale. Optional `promiseLifecycleId` reconstructs the same R1
open to R2 partially-paid state through the existing Tool/generated Remote with
current/historical freshness, before/after revisions, accepted Delta/source
ranges, packet and provenance while leaving Canon unchanged. A paid R3 without
aftermath is rejected atomically and the head remains R2. The existing Canon and
Promise lifecycle areas reuse the same readable state view; no new Tool, store,
page, payoff store, tab, adapter or package was added. Package `188/188`, focused
Remote `100/100` and focused Client `34/34` pass. Fresh stock-Web Promise
interaction has not run, so this remains `implemented-unverified`.

Optional `progressionCharacterId` now assembles only explicit typed
`progression.advancement` facts for one character through the existing
Tool/generated Remote. The real Remote normal path covers two accepted
advancements across R1/R2, orders them by story order/event/id, retains
dimension, prior limitation, setup, evidence, enabling action, resource or
sacrifice, new capability, remaining limit, counter, social interpretation,
downstream consequence, source range and provenance, and marks historical R1
freshness without changing Canon. It excludes another character and a legacy
free-text rank. The existing Canon area selects accepted progression characters
  and renders the same source-bearing ledger. Fresh stock-Web
  `progressionCharacterId` interaction is now `verified` for the synthetic
  R1→R2 path in
  [`progression-ledger-stock-web-e2e-2026-09-02`](../docs/progression-ledger-stock-web-e2e-2026-09-02.md):
  historical/current retrieval, generated Remote, `projectNarrative`, selector,
  ledger panel and reload agree. GREEN records 19 direct RPC and 81 Web API
  responses, zero browser failures, unchanged Canon/storage and a zero-listener
  shutdown on port `64362`; RED at `64356` rejects a missing typed value and
  keeps R1 (8/21 RPC/Web). Broader growth semantics, rollback-specific
  restoration, process/transport recovery, production and user acceptance remain
  unverified.

Optional `factionId` now assembles only explicit typed
`faction-state.continuity` entries for one faction through the existing
Tool/generated Remote and returns `factionContinuity`. The real normal path
orders entries by story order/event/id, retains goal, resources, constraints,
current action, membership or alliance change, off-screen consequence,
source ranges and provenance, supports current/historical freshness, excludes
another faction and legacy text, and leaves Canon unchanged. The existing Canon
area supplies the faction selector and read-only ledger; no new Tool, store,
Profile or package was added. The typed record schema now rejects a missing
`offscreenConsequence` at the Result Packet boundary while primitive/array
legacy values remain generic. Fresh stock-Web faction use is now `verified` for
the synthetic R1→R2 path in
[`faction-state-stock-web-e2e-2026-09-02`](../docs/faction-state-stock-web-e2e-2026-09-02.md):
generated Remote, historical/current isolation, `projectNarrative`, selector,
panel and reload agree (20/89 RPC/Web, browser failures 0, zero-listener
shutdown on port `64531`; RED 12/22 at `64530`). Broader faction semantics,
rollback-specific restoration, process/transport recovery, production and
user acceptance remain unverified.

Optional `locationId` now assembles only explicit typed
`location-state.continuity` entries for one location through the existing
Tool/generated Remote and returns `locationContinuity`. The real normal path
orders entries by story order/event/id and retains `parentLocationId`, `scale`,
`accessConditions`, `governingFactionIds`, `activeRuleIds`, `resourceFlows`,
`currentChange`, `consequence` and typed `travelLinks` with destination, travel
time, access conditions and status. It preserves current/historical source
evidence, excludes another location and legacy text, and leaves Canon unchanged.
The existing Canon area supplies the location selector and read-only ledger; no
map, travel adjudication, Tool, store or Profile was added. The typed record
schema now rejects a missing `consequence` at the Result Packet boundary while
primitive/array legacy values remain generic. Fresh stock-Web location use is
now `verified` for the synthetic R1→R2 path in
[`location-state-stock-web-e2e-2026-09-02`](../docs/location-state-stock-web-e2e-2026-09-02.md):
generated Remote, historical/current isolation, `projectNarrative`, selector,
panel and reload agree (20/88 RPC/Web, browser failures 0, zero-listener
shutdown on port `64541`; RED 12/22 at `64538`). Broader location/travel
semantics, rollback-specific restoration, process/transport recovery, production
and user acceptance remain unverified.

Optional `objectId` now assembles only explicit typed `object-state.continuity`
entries for one object through the existing Tool/generated Remote and returns
`objectContinuity`. The real normal path orders entries by story order/event/id,
retains `holderId`, `locationId`, `quantity`, `condition`, `status`,
`currentChange`, `consequence`, source ranges and provenance, supports
current/historical freshness, excludes another object and legacy text, and
leaves Canon unchanged. The existing Canon area supplies the object selector and
read-only ledger; no inventory auto-sync, deduplication, conservation check, new
Tool, store or Profile was added. The typed record schema now rejects a missing
`consequence` at the Result Packet boundary while primitive/array legacy values
remain generic. Fresh stock-Web object use is now `verified` for the synthetic
R1→R2 path in
[`object-state-stock-web-e2e-2026-09-03`](../docs/object-state-stock-web-e2e-2026-09-03.md):
generated Remote, historical/current isolation, `projectNarrative`, selector,
panel and reload agree (20/90 RPC/Web, browser failures 0, zero-listener
shutdown on port `64373`; RED 9/21 at `64372`). Broader inventory semantics,
rollback-specific restoration, process/transport recovery, production and user
acceptance remain unverified.

Accepted `world.rule` values now carry explicit scope, statement, positive
version, exceptions, public belief, hidden truth and observed consequences.
The real Result Packet/Tool/generated-Remote normal path advances one rule from
R1/v1 to R2/v2, filters it with `canonKind: "world"` plus its target id, returns
the current structured hit with source ranges/provenance and compares the full
R1/R2 value as before/after impact. The query leaves Canon at R2. Existing
generic Canon and revision UI can display the accepted fact and comparison; no
world-rule selector, UI, Tool, store or Profile was added. Fresh stock-Web
visible use remains open.

Accepted `roadmap.plan` values now require a positive `version`,
`detailedThroughUnitId`, `horizonSummary` and ordered `units`. Every unit retains
its explicit `targetChapterStart`/`targetChapterEnd`, `milestone`, `status`,
`dependsOnUnitIds`, `scopedDebtIds` and nullable `changeRationale`. The existing
Result Packet/Tool/generated-Remote path advances one plan from R1/v1 to R2/v2,
filters it by `canonKind: "roadmap"` and target id, returns the current
source-bearing hit and complete before/after revision impact, and leaves Canon at
R2. For that exact target, `roadmapResolution` is bound to the requested revision:
`orderedUnits` are stable by plan order, and repeated dependency/debt references
remain visible as resolved, missing or ambiguous entries with complete candidates
and provenance. The existing `conversation.view` selects plans and displays the
Chapter scope, milestone, status, rationale, Anchor, Delta, source ranges and all
resolution results. This does not automatically replan and adds no Tool, store,
package or Profile. Remote+Client 143/143, package 210/210, root typecheck, lint
and build pass locally. Fresh stock-Web visible use remains open.

Optional `emotionCharacterId` now projects one character's explicit typed
`emotion-state.episode` facts through the existing Tool/generated Remote and
Canon area. The Host proof filters unrelated characters and legacy free-form
emotion facts, preserves opaque episode ids, source ranges and provenance, and
orders episodes by structured story order/event/id. The existing panel selects
accepted characters and renders mixed emotion intensity, appraisal, expression,
suppression, coping, residue, reactivation and downstream choices. It neither
derives `character-state.emotionalResidue` nor adds a store, tab, adapter or
package. The typed record schema now rejects a missing `downstreamChoices` at
the Result Packet boundary while primitive/array legacy values remain generic.
Fresh stock-Web emotion use is now `verified` for the synthetic R1→R2 path in
[`emotion-state-stock-web-e2e-2026-09-03`](../docs/emotion-state-stock-web-e2e-2026-09-03.md):
generated Remote, historical/current isolation, character/legacy filtering,
`projectNarrative`, selector, panel and reload agree (21/89 RPC/Web, browser
failures 0, zero-listener shutdown on port `64613`; RED 10/22 at `64610`).
Broader psychological semantics, rollback-specific restoration,
process/transport recovery, production and user acceptance remain unverified.

Writing memory now has complementary source-bearing normal paths. A later Chapter control
pack carries each character's last explicit accepted post-check state even when
its source Chapter is older than the recent nine-Chapter window; a later empty
`carries` value clears the prior state. A not-yet-accepted next Chapter now gets
the same latest-per-character set at the top level when it omits `chapterId`,
independently of query terms; a historical R1 request excludes R2 state and keeps
the full source Chapter/revision/Delta/Anchor/provenance chain. With a control
pack this top-level list is empty rather than duplicating its memory.
The same no-`chapterId` result now carries every accepted strict
`character-state/arc-hypothesis` at the requested revision independently of
query terms. Each character retains the complete hypothesis, starting belief,
target transformation, dimensions, pressures, ordered decision chain, current
stage, unresolved question and exact Delta/Anchor/provenance source. Historical
R1 excludes an R2 arc update. A `chapterId` request carries the same complete
list inside the existing Chapter control pack while leaving the top-level list
empty. Both the control-pack and no-`chapterId` writing-memory areas render the
same role arc and source chain without adding a Tool, endpoint, store, page or
package.
The same no-`chapterId` result carries `latestReaderDisclosure` from the latest
accepted Chapter post-check at the requested revision, preserving the complete
`readerNowKnows` and `readerNowSuspects` arrays plus Chapter/revision/Delta/
Anchor ranges/provenance independently of query terms. A historical R1 request
excludes an R2 rewrite; a newer explicit pair of empty arrays remains the latest
source-bearing value instead of falling back to an older Chapter. No post-check
returns `null`, and a control-pack request also leaves the top-level value `null`
because its recent post-check resolutions already carry the same disclosure.
The same resolver also carries `latestChapterOutcome` from that exact latest
post-check: `contractAssessment`, `manuscriptSourceRevision`, `changes`, `costs`,
`newlyPossible` and `newlyImpossible` plus the complete source chain. It does not
repeat reader, character or debt fields. Historical R1 excludes an R2 rewrite;
newer explicit empty outcome arrays remain source-bearing instead of falling
back; no post-check and control-pack requests return top-level `null`.
The same no-`chapterId` result now carries the requested revision's complete
bidirectional Relationship projection independently of query ranking. Each line
keeps both directions, field maps and per-field revision/Delta/Anchor/provenance;
historical R1 excludes an R2 one-way rewrite. With a control pack the top-level
relationship list is empty because selected lines remain in its existing
reference resolution. The same path now enumerates every accepted `knowledge`
subject at the requested revision and reuses the existing knowledge-boundary
resolver for each character/reader. Each ledger keeps every knowledge field,
referenced accepted fact field, source range, provenance and freshness;
historical R1 excludes R2 rewrites and future-only subjects. With a control pack
the top-level boundary list is empty. Separately, optional
`writingMemoryQuery` ranks accepted rolling roadmaps, manuscript excerpts,
setting facts, continuity Canon or clock entries, and narrative debts from exactly
the requested revision. Each roadmap hit carries its horizon, ordered Chapter
ranges, milestones, status, rationale, dependencies and scoped debts through the
existing full resolution. The real Tool/generated Remote proof covers historical R1 recall while
head is R2, Tool/Remote equality, no R2 leakage, no Canon/head write, clock
ambiguity/rationale matching and complete score/terms/ranges/provenance. The
same continuity bucket now recalls a complete accepted
`chapter-state/post-check`, including changes, costs, newly possible/impossible
state and reader knowledge/suspicion, from its exact historical revision with
Delta/Anchor/provenance while excluding later revisions and leaving Canon/head
unchanged. The setting bucket keeps intent-ranked setting facts separate from
reserved authoring-contract fields. Independently of query terms, every
writing-memory result now carries the requested revision's exact accepted
`creative-profile/style-profile`, `creative-profile/serialization-profile` and
`reader-contract/contract-profile` under `authoringContracts`, retaining their
complete nested constraints, source revision, Anchor ranges and provenance but
no synthetic score or matched terms. Each style `approvedExemplar` and reader
delivery-evidence item now also resolves its declared accepted revision,
manuscript unit and Anchors into the actual excerpt, purpose/demonstration and
source provenance. Historical R1 style recall excludes an unrelated R2 exemplar;
the existing generated Remote retains these nested fields and the existing
`conversation.view` renders them directly under their contract. The existing
Chapter control-pack area and the no-`chapterId` writing-memory result both display
their character carry-forward with full source evidence. The same writing-memory
area renders the latest reader disclosure as compact reader-knows/reader-suspects
lists and the latest Chapter outcome as contract/deviation/change/cost/possibility
lists with their complete source evidence, then reuses the existing Relationship renderer for complete bidirectional lines
and the existing Knowledge boundary ledger for every character/reader, exposing
their full source data. After the
Agent calls the same Tool with `writingMemoryQuery`, the existing
`conversation.view` selects the latest successful Session result that actually
contains writing memory and renders the mandatory contracts plus all six
ranked buckets with their full source evidence; a later ordinary retrieval does
not hide it. The narrative-structure bucket supplies accepted Book/Volume/Arc/Chapter structure
only when no `chapterId` control pack exists; historical R1 recall excludes an R2
future rewrite while retaining score, terms, Delta/Anchor and provenance. The
existing Review `focus` selects the same revision-bound contracts and memory and
places them in the stock reviewer prompt beside manuscript, Canon and any Chapter
control pack.
The reviewer still returns only the existing unauthorised Result Packet/Diff and
leaves Canon/head unchanged. No query form, Tool, Remote endpoint, store, Provider,
package, Profile, Bundle, Sidebar or TUI extension was added. The existing Agent
System Prompt and retrieval Tool contract now also direct Plan and Write to call
the same accepted-revision retrieval with the current planning or drafting intent
as `writingMemoryQuery`; work on an accepted Chapter includes its `chapterId`,
while a not-yet-accepted next Chapter omits it and consumes the ranked narrative
units plus query-independent character carry-forward and accepted character arc
hypotheses, latest accepted post-Chapter
reader disclosure and Chapter outcome, relationship carry-forward and knowledge boundaries. The subsequent existing Result Packet is grounded in those carry-forwards,
knowledge boundaries, the six buckets, mandatory
authoring contracts and any control pack. This is the normal
model-visible path, not a new writer service or proposal gate.
Package `224/224`, Remote `117/117`, Client `40/40`, typecheck, lint and build pass
locally; fresh stock-Web visible
use of the no-`chapterId` narrative-unit path is verified by
[`writing-memory-stock-web-e2e-2026-08-31.md`](../docs/writing-memory-stock-web-e2e-2026-08-31.md):
one stock-Agent Tool call, three visible ranked units, reload recovery, Canon
held at R1, 15 direct RPC and 64 Web API responses successful, and zero browser
console/page/request failures. The follow-up
[`authoring-memory-restart-stock-web-e2e-2026-09-01.md`](../docs/authoring-memory-restart-stock-web-e2e-2026-09-01.md)
uses a fresh visible fixture containing all three strict authoring contracts,
the query-independent character arc, reader disclosure and latest Chapter
outcome. It retrieves them once in the accepting Session and
again from a different Session after a Host restart, preserves the accepting
Session provenance, restores all six target sections after renderer reload and
keeps Canon at R1. Its seed/restart phases pass 15/63 and 14/61 direct RPC/Web
responses respectively with zero browser console/page/request failures. This
exact visible path is `verified`; the remaining writing-memory branches retain
their narrower evidence status.

Within that verified restart slice, the query-independent
`latestReaderDisclosure` and `latestChapterOutcome` paths are promoted for
the synthetic fixture: both retain their accepted Chapter source, revision,
Delta, Anchor ranges and provenance, exclude later revisions, render in the
existing writing-memory area and survive the second Host and renderer reload.
Character carry-forward is covered by the separate fresh stock-Web evidence
entry below; relationship/knowledge variants and other memory branches keep
their own evidence boundaries.

The accepted-`chapterId` branch is separately verified by the fresh
`chapter-control-pack-stock-web-e2e-2026-09-01` smoke: one stock Agent call
returned the complete R1 Book→Chapter control pack with its 2900–3100 contract,
the top-level narrative-unit bucket stayed empty, and the existing panel Build
button rendered the same pack after reload. The controlled RED omitted only
`chapterId` and failed at `controlPack.chapter`; 13/59 RPC/Web responses were
successful, browser failures were zero, Canon/storage stayed R1 and port 64152
had no listener after shutdown. Other writing-memory branches remain open.

The strict Chapter contract/control-pack branch is now separately verified by
[`chapter-contract-stock-web-e2e-2026-09-02`](../docs/chapter-contract-stock-web-e2e-2026-09-02.md).
The fresh GREEN accepts a Book→Volume→Arc→Chapter hierarchy, updates a valid
2900–3100 Chapter contract at R2, and confirms exact `chapterId` retrieval,
generated Remote agreement, historical R1 isolation, `projectNarrative`, the
existing control-pack panel and reload. It records 18 direct RPC and 67 Web API
responses, zero browser failures, unchanged Canon/storage and a zero-listener
shutdown on port `64331`; the controlled RED rejects `max < min` and keeps R1
unchanged. The separate strict post-check/source-join smoke below covers the
accepted Chapter contract → manuscript/debt → post-check chain; Scene/Beat
plan, lock/reference resolution, process/transport recovery, production or
user acceptance remain open.

The strict `chapter-state/post-check` source-join branch is now separately
verified by
[`chapter-postcheck-source-join-stock-web-e2e-2026-09-02`](../docs/chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md).
The fresh GREEN retrieves R3 with `compareRevision: 2`, `chapterId` and
`canonKind: "chapter-state"`; it resolves the R1 Chapter contract, R2
manuscript and R2 Promise debt transition, while the R3 post-check retains its
reader/character/cost/change fields and source chain. Historical R2 omits the
post-check resolution, generated Remote and `projectNarrative` agree, and the
existing control-pack panel restores the same ledger after reload. GREEN
records 23 direct RPC and 63 Web API responses, zero browser failures,
unchanged Canon/storage and a zero-listener shutdown on port `64416`; the
controlled RED at `64410` omits the debt Delta and fails `0 !== 1` without
changing the accepted head. This promotes only the synthetic source join;
Scene/Beat, lock/reference, rollback-specific source restoration,
process/transport recovery, production and user acceptance remain unverified.

The no-`chapterId` relationship and knowledge branches are now separately
verified by
[`writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02`](../docs/writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md).
Its fresh stock-Web GREEN retrieves historical R1 against head R2 with one
native `retrieve_novel_context` call, preserves both directions of the
`alice<->bob` line and the complete `alice`/`reader-main` knowledge ledgers,
and renders them again after reload. The run records 16 direct RPC and 65 Web
API responses, zero browser failures, unchanged Canon/storage, no post-seed
`novel/` frames and a zero-listener shutdown on port `64212`. The controlled
RED omits the R1 relationship/knowledge facts and fails at
`relationshipCarryForward.length` (`0 !== 1`). Process/transport recovery,
production and user acceptance remain open; character carry-forward is covered
by the separate evidence entry below.

The no-`chapterId` hydrated-evidence branch is now separately verified by
[`writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02`](../docs/writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md).
The fresh GREEN retrieves historical R1 against head R2, hydrates the accepted
style exemplar and reader-contract evidence with exact manuscript excerpts,
purpose/demonstrates, source ranges and provenance, excludes the R2 evidence,
and renders both evidence items after reload. It records 20 direct RPC and 65
Web API responses, zero browser failures, unchanged Canon/storage, no post-seed
`novel/` frames and a zero-listener shutdown on port `61514`; the controlled RED
fails at `readerContract.evidence.length` (`0 !== 1`). Process/transport
recovery, production and user acceptance remain open; character carry-forward
is covered by the separate evidence entry below.

The no-`chapterId` rolling-roadmap branch is now separately verified by
[`writing-memory-roadmap-stock-web-e2e-2026-09-02`](../docs/writing-memory-roadmap-stock-web-e2e-2026-09-02.md).
The fresh GREEN retrieves historical R1 against head R2, returns one compact
versioned roadmap with two ordered Chapter units, a resolved dependency and
an open resolved debt with complete source metadata, excludes the R2 future
route, and renders the same roadmap row after reload. It records 19 direct RPC
and 66 Web API responses, zero browser failures, unchanged Canon/storage, no
post-seed `novel/` frames and a zero-listener shutdown on port `64228`; the
controlled RED fails at `writingMemory.roadmaps.length` (`0 !== 1`).
Process/transport recovery, production and user acceptance remain open;
character carry-forward is covered by the separate evidence entry below.

The no-`chapterId` query-independent character-arc branch is now separately
verified by
[`writing-memory-character-arc-stock-web-e2e-2026-09-02`](../docs/writing-memory-character-arc-stock-web-e2e-2026-09-02.md).
The fresh GREEN requests R2 with `compareRevision: 1`,
`characterTrajectoryId: "shen-yan"` and an unrelated `writingMemoryQuery`;
`characterArcHypotheses` still returns the complete v2 hypothesis and costly
decision. Historical R1 returns only v1 with an empty decision chain, a second
unrelated query returns the same arc list, and the existing writing-memory/
trajectory panel restores it after reload. GREEN records 21 direct RPC and 67
Web API responses, zero browser failures, unchanged Canon/storage and a
zero-listener shutdown on port `64324`; the controlled RED rejects a missing
`persistentConsequence` and keeps R2. This promotes only the synthetic arc
memory path; rollback-specific arc restoration, process/transport recovery,
production and user acceptance remain open. Character carry-forward is covered
by its separate no-`chapterId` evidence entry. No new Tool, store, page or
package was added.

The no-`chapterId` query-independent character carry-forward branch is now
separately verified by
[`writing-memory-character-carry-forward-stock-web-e2e-2026-09-02`](../docs/writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md).
The fresh GREEN requests R2 with `compareRevision: 1`,
`characterTrajectoryId: "shen-yan"` and an unrelated writing-memory query;
the accepted R1 Chapter post-check still returns both carry values with the
Chapter, revision, Delta, Anchor range and provenance. Historical R1 excludes
the unrelated R2 event, a second unrelated query and generated Remote agree,
and the existing writing-memory/trajectory panel restores the item after
reload. GREEN records 20 direct RPC and 68 Web API responses, zero browser
failures, unchanged Canon/storage and a zero-listener shutdown on port `64343`;
the focused RED at port `64344` fails on an empty carry-forward (`0 !== 1`)
while retaining R2. This promotes only the synthetic carry-forward projection;
semantic inference, rollback-specific restoration, process/transport recovery,
production and user acceptance remain unverified. No new Tool, store, page or
package was added.

The strict relationship line-state branch is now separately verified by
[`relationship-line-state-stock-web-e2e-2026-09-02`](../docs/relationship-line-state-stock-web-e2e-2026-09-02.md).
The fresh GREEN accepts independent alice→bob and bob→alice R1 states, updates
only alice→bob at R2, returns historical/current retrieval and complete
revision impact, renders both directions and relationship-clock moves in the
existing panel, and restores them after reload. It records 21 direct RPC and
64 Web API responses, zero browser failures, unchanged Canon/storage, no
post-seed `novel/` frames and a zero-listener shutdown on port `64267`; the
controlled RED rejects an R3 turn missing `persistentConsequence` with R2
unchanged. Process/transport recovery, production and user acceptance remain
outside this evidence.

The strict character pacing-clock branch is now separately verified by
[`character-clock-stock-web-e2e-2026-09-02`](../docs/character-clock-stock-web-e2e-2026-09-02.md).
One fresh stock-Web Agent retrieved R1 pressure/hold and R2
decision/consequence/commitment/transformation/hold moves with real character
and story-event references; the existing Narrative clocks panel restored all
seven moves after reload. It records 19 RPC/57 Web, browser failures 0,
unchanged Canon/storage and a zero-listener shutdown on port `64284`; the clean
RED rejected a duplicate `moveId` with R1 unchanged. The separate
`character-state/arc-hypothesis` lifecycle, process/transport recovery,
production and user acceptance remain outside this evidence.

The strict Promise clock/lifecycle branch is now separately verified by
[`promise-clock-stock-web-e2e-2026-09-02`](../docs/promise-clock-stock-web-e2e-2026-09-02.md).
One fresh stock-Web Agent accepted R1 `promise/state`, debt and
open→remind→hold, then one atomic R2 packet updated the lifecycle/debt and
partial-payoff→payoff→retire clock. Retrieval, lifecycle Remote,
`projectNarrative`, existing Promise/Narrative clocks UI and reload passed with
20 RPC/88 Web, browser failures 0, unchanged Canon/storage and a zero-listener
shutdown on port `64285`; the clean RED rejected a duplicate `moveId` at R2.
Process/transport recovery, production and user acceptance remain outside this
evidence.

The strict relationship pacing-clock branch is now separately verified by
[`relationship-clock-stock-web-e2e-2026-09-02`](../docs/relationship-clock-stock-web-e2e-2026-09-02.md).
One fresh stock-Web Agent retained an R1 alliance move, added an R2 sacrifice
move with stable pair/directional, story-event and emotion-episode references,
and kept the independent `alice->bob` / `bob->alice` line-state projections.
Native retrieval with `compareRevision: 1`, the generated Remote,
`projectNarrative`, the existing Narrative clocks/relationship views and reload
agreed. GREEN recorded 22 direct RPC and 64 Web API responses, zero browser
failures, unchanged Canon/storage and a zero-listener shutdown on port `64287`;
the controlled RED rejected a duplicate `moveId` with R2 unchanged. Process/
transport recovery, production and user acceptance remain outside this evidence.

The current package suite passes 239/239; the Remote gate passes 131/131 and the
Client gate passes 41/41. Root typecheck, lint, build and diff-check pass. The
single-package dry-run passes and lists only `novel-project`.
Running-job kill, the in-flight stale guard and
production behavior are not claimed. No generic
search or Jobs UI, provider registry, Web adapter, TUI extension, Profile or
Bundle was added.

## N-004 — Authoring workflow

**Status:** `verified` for the stock-Agent Ask, proposal-only Plan,
accepted-revision Chapter control pack, Write-to-author-Apply, independently
approved Publish and provider-reported Token-budget paths. Total-run and per-unit
USD cost budgeting are locally `implemented-unverified`. The ordered
multi-unit Write scope is `implemented-unverified` pending fresh stock-Web
approval/completed-turn evidence. Total-run and per-unit wall-time/retry budgeting
and permanent project Canon locks are `implemented-unverified` through real rc.2
Session/Tool/Remote/storage integration; their fresh stock-Web visible approvals
remain open. The optional strict Chapter `chapterContract` extension and the
exact current `chapter-state/post-check` source-join path are `verified` by the
fresh stock-Web evidence below; broader control-pack history, Scene/Beat and
lock/reference branches remain locally `implemented-unverified`. The
model-visible six-stage contract is implemented.

- [x] contribute Ask / Plan / Write / Review / Accept / Publish semantics through
  the stock DSH system-prompt seam inside `novel-project`;
- [x] reserve the stock `workflow` tool for explicit or genuinely large
  multi-agent orchestration so its existing Session events and UI remain the
  only workflow record; do not invoke `workflowEngine` directly or copy its
  recorder;
- [x] expose accepted Canon, narrative and manuscript evidence to an ordinary
  Ask/Plan turn through the read-only `retrieve_novel_context` DSH Tool;
- [x] let an ordinary stock Agent submit one complete authorization-free Write
  proposal through `propose_novel_result_packet`, persisted by native DSH
  `tool/call` / `tool/result` events without advancing Canon;
- [x] surface that native Tool Result in the existing `conversation.view`
  Result Packet controls and advance Canon only through the existing
  author-decided Apply transaction;
- [x] deliver the real proposal-only Plan flow on the existing DSH Agent and
  read-only retrieval Tool without adding another UI or workflow record;
- [x] deliver Publish on the existing DSH Agent, Tool, Result Packet and
  approval seams with a named destination and an independent decision;
- [x] author locks, automation scope, budgets and stop rules through existing
  DSH approval;
  - [x] first bounded slice: one accepted revision, one manuscript unit, Write
    only, one Result Packet, author-specified accepted Canon locks and four fixed
    stop rules, activated only by stock DSH `allowed-once`, with a fresh
    stock-Web visible approval/completed-turn proof;
  - [x] ordered multi-unit Write scope: `unitIds` (with `unitId` shorthand),
    positive `maxResultPackets`, at most one proposal per scoped unit, one DSH
    Session/turn, replayable `completedUnitIds` policy snapshots, and native
    `concludeTurn()` after scope or packet completion; focused rc.2 integration
    covers two units, while fresh stock-Web multi-unit approval/completed-turn
    smoke remains `implemented-unverified`;
  - [x] author-specified positive `maxTokens`, DSH provider-reported Token
    baseline, replayed `usedTokens` and pre-proposal `budget-exhausted` stop,
    with a fresh stock-Web visible approval/denial/completed-turn proof;
  - [x] author-specified positive `maxTokensPerUnit` for ordered multi-unit Write;
    derive each unit's provider-reported usage from consecutive active policy
    snapshots, retain completed units and stop before an over-budget unit's
    proposal; focused rc.2 integration covers 18/18/21 Tokens against a 20-Token
    per-unit limit, while fresh stock-Web visible approval remains unverified;
  - [x] author-specified positive `maxCostUsd` plus explicit non-negative USD
    prices per million Tokens for DSH uncached input, output, cache-read and
    cache-write usage; price only provider-reported usage after authorization and
    stop before proposal when the total exceeds the approved amount;
  - [x] author-specified positive `maxCostUsdPerUnit`; subtract the latest active
    snapshot's cumulative priced usage so each ordered unit receives an
    independent approved cost allowance while total-run accounting stays intact;
  - [x] author-specified positive `maxWallTimeMs`, the DSH policy SessionEvent
    timestamp as the run baseline, replayed `elapsedMs` and pre-proposal
    `budget-exhausted` stop, with a real rc.2 Session/Tool integration proof;
  - [x] author-specified positive `maxWallTimeMsPerUnit`; keep the first same-run
    policy event as the cumulative baseline, use the latest active policy
    event's timestamp as the current-unit baseline, and stop before a unit
    exceeding its own limit while retaining prior completed units;
  - [x] author-specified non-negative `maxRetries`; count only DSH
    `llm/retry-started` events after authorization, ignore queued `llm/retry`, and
    stop before proposal when started retries exceed the budget. Real rc.2
    Session seed/replay tests cover both the over-budget and exact-boundary paths;
    fresh stock-Web retry interaction remains `implemented-unverified`;
  - [x] author-specified non-negative `maxRetriesPerUnit`; subtract the latest
    active snapshot's cumulative `usedRetries`, retain total-run counting from
    the first same-run policy event, and stop before an over-budget unit proposal;
  - [x] project-persistent author Canon locks through stock DSH `allowed-once`:
    resolve the current accepted value, reject conflicting ordinary Apply and
    rollback transactions, retain the lock across service reload, and allow the
    same proposal only after an explicit approved unlock;
- [x] control-pack rebuild after accepted revisions through the existing
  read-only retrieval Tool;
- [x] optionally attach a strict Chapter `chapterContract` covering viewpoint,
  story time, scene functions, active plot/relationship lines, promises,
  information policy, progression setup/payoff, emotional movement, ending pull,
  contradiction/style constraints, positive length range and acceptance gates;
- [x] reject a Chapter contract on non-Chapter units and `lengthRange.max < min`,
  preserve the legacy path when the field is omitted, and expose an accepted
  contract with its Chapter source metadata through the existing `chapterId`
  control pack and `conversation.view` surface;
- [x] accept strict `chapter-state/post-check` set/remove values that reference
  the contract and manuscript revisions and record outcome/deviations, actual
  changes/costs, newly possible/impossible state, reader knowledge/suspicion,
  character carry-forward and source-bearing debt transitions;
- [x] preserve the R1 contract → R2 manuscript/actual Delta → R3 post-check source
  chain through the existing `chapterId` control pack, structured Canon query and
  `conversation.view`; do not infer a check, auto-reject a Chapter or add a Tool,
  store, hypothesis path or fact authority;
- [x] resolve the post-check's exact contract, manuscript and debt-transition sources
  against the requested effective accepted lineage, preserving ordered repeated
  references, ranges and provenance while excluding rollback copies and abandoned
  future revisions;
- [x] carry accepted post-check resolutions for up to nine recent preceding Chapters
  into the next Chapter control pack and render their changes, costs, reader/character
  carry-forward, debt transitions and complete sources in the existing view;
- [x] pass the complete same-revision Chapter control pack to the existing anchored
  reviewer so contract gates, ten clocks/debts, resolved references and post-check
  evidence participate without adding a Review Tool or mutating Canon;
- [x] resolve the Chapter contract's active plot-line, relationship-line and
  Promise references at the requested accepted revision into ordered
  source-bearing `resolved` results plus explicit `missing` ids, while leaving
  missing references non-blocking and adding no query, Tool, store or page;
- [x] resolve each active relationship line's scoped Relationship-clock
  `emotionEpisodeIds` into ordered, duplicate-preserving strict episodes with full
  source evidence, require exact directional-pair ownership, and retain missing ids
  without inferring a line or scanning clocks outside the control-pack scope;
- [x] project the target Chapter's accepted Scene/Beat descendants into the same
  control pack in deterministic depth-first hierarchy order, retain their complete
  sources, include their Canon/clocks/debts in scope, and exclude sibling/future/
  rollback-abandoned plans without adding a Scene editor, generator or new seam;
- [x] project current Canon locks into the same control pack in stable order,
  resolving only exact requested-revision kind/target/field/value facts with complete
  sources and reporting absent or value-drifted historical locks as unavailable;
- [x] no new workflow tool, engine, task store, Agent Team system, UI or package.

The stage-vocabulary RED failed because `novel:authoring-stages` did not exist.
The Ask Tool RED then failed because the registered schemas contained only
`rebuild_novel_index`; `retrieve_novel_context` did not exist. GREEN keeps Ask
read-only and delegates the new Tool directly to existing revision-aware
retrieval. A fresh stock-Web `standard` Agent called it once, received R1/head
R1/current manuscript and Canon evidence, completed its answer, and left the
accepted revision at R1. The Session contains one native `tool/call`, one
`tool/result`, no `tool-workflow/*` and no custom retrieval event. All 11 Web
RPCs were HTTP `200`, with no console/page/request errors. See
[`retrieve-novel-context-stock-agent-e2e-2026-08-28.md`](../docs/retrieve-novel-context-stock-agent-e2e-2026-08-28.md).

The Write Host RED then failed because `propose_novel_result_packet` did not
exist, and the Client RED failed because the existing panel did not read its
proposal from the current Session Tool Result. GREEN validates a complete draft
at the calling Agent's current Workspace revision, binds its provenance to the
real Session, and returns it without authorization. Stock DSH records one
retrieve and one propose `tool/call` / `tool/result` pair; the existing panel
opens the proposal, while Canon remains R1. Only the author's two explicit item
decisions and Apply create author authorization and append R2. Reload restores
the R2 manuscript with `sourceRevision=2`. The Session contains 41 events and
zero `tool-workflow/*`; seven direct Novel Project RPCs and 100 captured Web API
responses succeeded, with zero console/page/request errors. See
[`write-result-packet-stock-agent-e2e-2026-08-28.md`](../docs/write-result-packet-stock-agent-e2e-2026-08-28.md).

The fresh proposal-only Plan run called `retrieve_novel_context` once, rendered
the accepted/source R1, narrative scope, two alternatives, constraints and stop
condition in stock `conversation.view`, and made no Result Packet proposal or
workflow call. Canon remained R1 before Plan, after Plan and after reload. All
14 direct RPCs and 62 captured Web API responses succeeded, with zero
console/page/request errors. See
[`plan-stock-agent-e2e-2026-08-28.md`](../docs/plan-stock-agent-e2e-2026-08-28.md).

The Chapter control-pack RED failed with `Unrecognized key: "chapterId"`.
GREEN adds only that optional input and optional `controlPack` output to the
same `retrieve_novel_context` Tool. R1 → R2 focused proof rebuilds scope Canon,
all ten scoped clock buckets and preceding Chapter manuscripts with their real
source revisions, then re-reads historical R1 unchanged. The real DSH Tool
integration resolves the calling Agent's Workspace and leaves Canon at R1. A
fresh isolated rc.2 Web Profile installed and loaded only `novel-project`; `/`
and its current client artifact both returned HTTP `200`. See
[`chapter-control-pack-rc2-smoke-2026-08-28.md`](../docs/chapter-control-pack-rc2-smoke-2026-08-28.md).

An accepted Chapter unit may now optionally carry one strict `chapterContract`
with the complete planning and acceptance fields listed above. Runtime validation
rejects `lengthRange.max < min` and any contract attached to a non-Chapter unit;
omission retains the original contract-free path. The real Tool/generated-Remote
regression rebuilds the existing `chapterId` control pack at the current revision
with the accepted Chapter's original revision, Delta, Anchors and provenance, and
the existing `conversation.view` panel renders the same contract before Write.
Fresh stock-Web visible contract interaction remains `implemented-unverified`;
no new Tool, store, control-card page, Profile or package was added.

The same control pack now exposes an always-present `referenceResolution`.
Active plot-line ids resolve against the most specific accepted strict Plot
Clock on the Chapter ancestry and retain the complete source-bearing clock
entry; active relationship-line ids resolve to the exact stable bidirectional
line; Promise touches resolve to the current accepted strict state/source fact
while preserving intended movement. All three keep declaration order and
separate resolved from missing. Missing ids and a missing Chapter contract are
normal read-only output and never block Accept. Current/historical Tool,
generated Remote and existing `conversation.view` regressions pass without a
new API, query, store or page.

Accepted Canon now also permits strict `chapter-state/post-check` set/remove
values. The real normal path keeps the R1 Chapter contract and source Delta,
accepts the R2 manuscript plus the actual Canon/clock/debt Deltas, then accepts an
R3 post-check that records `met` contract outcome and deviations, manuscript
source revision, changes, costs, newly possible/impossible state, reader
knowledge/suspicion, character carry-forward and created/advanced/paid/retired
debt transitions with their source Deltas. The existing `chapterId` control pack
and `canonKind: "chapter-state"` query/generated Remote return the R3 fact with
its range/provenance while retaining the R1 contract and R2 manuscript chain;
the existing `conversation.view` renders the same accepted ledger. Retrieval
leaves R3 Canon unchanged. This is explicit accepted accounting, not a generated
hypothesis, inferred assessment or automatic rejection. Fresh stock-Web visible
use remains `implemented-unverified`; no new Tool, store, page, Profile or package
was added.

The Publish receipt RED failed because the native Tool Result omitted the
source revision, title, create/update operation and character count. GREEN only
expanded the existing Tool Result text. A fresh stock-Web Agent called Publish
once; the target did not exist before the stock approval, `allowed-once` then
wrote the exact accepted R1 text, and the native event order was call → asked →
decided → result → completed turn. Canon remained R1 before, after and after a
separate Host restart; the restarted stock panel restored `Revision 1` and
`R1 · 第一章 雪庭`. The Publish flow's 16 direct RPC / 36 Web API responses and
the restart's 3 direct RPC / 38 Web API responses all succeeded, with zero
console/page/request errors. See
[`publish-stock-agent-e2e-2026-08-28.md`](../docs/publish-stock-agent-e2e-2026-08-28.md).

The bounded-automation RED failed because `authorize_novel_automation` did not
exist. GREEN asks through stock `tools/pre-execute` approval, appends one full
`novel/automation-policy` active snapshot only after `allowed-once`, folds that
snapshot from a seeded DSH Session, enforces the fixed revision/unit/lock/packet
scope on the existing `propose_novel_result_packet`, consumes the single packet
and calls native `concludeTurn()` with `scope-complete`. The focused real-Session
integration passes, the accepted head remains R1, and Accept/Publish remain
separate. A fresh isolated stock-Web Agent then displayed the complete approval
scope, accepted stock `Allow once`, emitted active then `scope-complete` stopped
policy snapshots with one consumed packet, rendered the proposal in the existing
Novel Project panel and ended the turn as `completed`; Canon remained R1. Its 11
direct RPC and 36 Web API responses succeeded with zero console/page/request
errors. See
[`bounded-automation-stock-agent-e2e-2026-08-28.md`](../docs/bounded-automation-stock-agent-e2e-2026-08-28.md).

The Token-budget RED failed because the strict authorization schema rejected
`maxTokens`. GREEN requires a positive author-visible value, records the
authorization-time cumulative DSH `tokenUsage` baseline and sums only its four
disjoint provider-reported buckets. Before an automated proposal, a run with
`usedTokens > maxTokens` appends a stopped `budget-exhausted` snapshot and
denies that Tool without advancing Canon. A fresh stock-Web Agent visibly
requested 20 Tokens, recorded a 28-Token baseline after `allowed-once`, then
reported another 28 Tokens; the proposal was denied with `usedResultPackets=0`,
the turn completed and Canon remained R1. Its 13 direct RPC and 36 Web API
responses succeeded with zero console/page/request errors. See
[`token-budget-stock-agent-e2e-2026-08-28.md`](../docs/token-budget-stock-agent-e2e-2026-08-28.md).
The per-unit Token RED failed because the strict authorization schema rejected
`maxTokensPerUnit`. GREEN requires a positive author-visible value and derives
the current unit's use as the latest provider-reported run total minus the
previous active policy snapshot's `usedTokens`. In one Session, `chapter-a` and
`chapter-b` each consume 18 Tokens and emit proposals even though cumulative use
reaches 36; `chapter-c` then consumes 21 against a 20-Token unit limit, stops as
`budget-exhausted`, retains the first two completed units and leaves Canon
unchanged. No counter service, new event, queue, UI or store was added; fresh
stock-Web visible approval remains `implemented-unverified`.
The wall-time RED failed because the strict authorization schema rejected
`maxWallTimeMs`. GREEN uses the existing DSH policy event's Unix-millisecond
timestamp as the run baseline, stores `elapsedMs` in the next full policy
snapshot and rejects only when `elapsedMs > maxWallTimeMs`. A seeded/replayed
real rc.2 Session authorized 100ms, attempted the existing proposal at 101ms,
recorded `budget-exhausted` with zero consumed Result Packets and left Canon at
R1. No timer service, scheduler, UI, adapter, Profile or Bundle was added. A
fresh stock-Web visible approval remains unverified. A later multi-unit RED
proved total wall-time and retry budgets had been restarting from each active
snapshot; GREEN now anchors totals to the first same-run event. Required
`maxWallTimeMsPerUnit` then allows 50ms and 55ms units independently before a
61ms unit exceeds 60ms, retaining 166ms total and two completed ids. Required
`maxRetriesPerUnit` allows one retry for the first unit, then rejects two retries
for the second against a limit of one while retaining three cumulative retries
and only the first completed id. A focused event-timing regression additionally
uses the latest active event timestamp, not its already-serialized cumulative
`elapsedMs`, as the next unit's wall-time origin. The USD-cost REDs failed because
the strict authorization schema rejected `maxCostUsd`, `maxCostUsdPerUnit` and
the four author-supplied rates. GREEN prices only the four disjoint DSH usage
buckets. One real rc.2 Session/Tool path records a $0.00004 authorization
baseline and stops at $0.000046 against $0.000045; the multi-unit path allows
$0.000018 and $0.000018 independently, then stops a $0.000021 third unit against
$0.00002 while retaining the first two completed ids. Canon never advances.
Fresh visible cost and per-unit wall-time/retry interaction remains
`implemented-unverified`.

The permanent-lock RED failed because `manage_novel_canon_lock` was not a
registered Tool. GREEN keeps the accepted value in the sole Novel Project
record, shows lock/unlock through stock DSH approval, and checks the central
Result Packet review and rollback transactions. The real rc.2 integration locks
one R2 fact, rejects both conflicting paths without advancing the head, reloads
the plugin from JSON storage and rejects again, then unlocks and accepts the
  same proposal as R3. The package passes 97/97 tests plus build, root typecheck
and lint. No UI, Pi TUI extension, Better Sidebar tab, adapter, Profile, Bundle
or second fact store was added; fresh stock-Web visible approval is still open.

Review and Accept keep using the already verified Result Packet path; Publish
uses the separate named destination and native DSH decision above. No second
workflow tool, engine, task store, Agent Team system, UI, adapter, Profile,
Bundle or package was added.

The first complete ten-chapter acceptance smoke is now `verified` for the
replay-backed DSH Agent/Tool/Result Packet/Accept mechanics. A fresh isolated
rc.2 stock-Web Profile used an original Project brief at R1, then one real Agent
turn per Chapter: `novel-prose-writer` Skill load, current-revision
`retrieve_novel_context`, and authorization-free `propose_novel_result_packet`
with a Chapter contract and `chapter-state/post-check`. The existing
`novelProject/review` transaction accepted each packet in order; storage contains
R1 plus Chapters 1–10 at R2–R11, every chapter's visible manuscript length is
3000 characters and the total is 30000. Historical reads did not expose a later
chapter, reload preserved the final R11 state, 110 direct RPC and 26 Web API
responses succeeded, browser failures were zero, and the Host (`PID 25520`, port
`64096`) was stopped with zero listeners. The controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-ten-chapter-red-final-20260901-215159-01a05b3c`
set Chapter 6 to 2800 and failed at the explicit length assertion. The GREEN
evidence is under
`C:\Users\33166\AppData\Local\Temp\novel-ten-chapter-green3-20260901-215849-01a05b3c`.
This is a deterministic replay/transaction and continuity proof, not a claim
about external-model prose quality, production operation or user acceptance;
those remain `implemented-unverified`.

## N-005 — Simulation

**Status:** the first story-world action and first reader-response hypothesis
run are `verified` through the real DSH rc.2 in-process seam. A stable,
revision/input/seed/trace-derived replay identity is also `verified` locally;
the existing `conversation.view` Results surface for the single story-world and
reader-response single runs is `verified` in the fresh stock-Web evidence below;
typed, bounded multi-action story-world replay is `implemented-unverified` locally;
sequential multi-seed story-world and reader variance are
`implemented-unverified` locally;
explicit same-state story-world branch comparison is `implemented-unverified` locally;
explicit story-world branch-by-seed variance comparison is `implemented-unverified` locally;
explicit isolated story-world role comparison is `implemented-unverified` locally;
explicit same-context reader candidate comparison is `implemented-unverified` locally;
explicit same-text reader Persona comparison is `implemented-unverified` locally;
explicit reader candidate-by-Persona matrix comparison is `implemented-unverified` locally;
explicit accepted-versus-candidate reader variant comparison is `implemented-unverified` locally;
provenance-bearing real-reader feedback calibration is `implemented-unverified` locally;
model-generation determinism and later simulation slices remain open.

- [x] story-world sandbox reads one frozen accepted revision;
- [x] story-world emits one proposal-only, typed `SimulationRun` and never
  advances Canon;
- [x] explicit role knowledge, a fresh child Session identity and a
  structured-output-only tool namespace use stock DSH `spawn`;
- [x] let the same story-world Tool compare at least two actors in input order,
  give each child only that actor's goal, resources and accepted role-visible
  facts, preserve every independent run, and leave Canon unchanged;
- [x] let the same story-world Tool run at least two independent seeds in
  order over one frozen role view, preserve every child run/replay identity,
  and summarize all fixed action types without advancing Canon;
- [x] let the same story-world Tool compare at least two explicit branches from
  one frozen role state and shared seed, preserve ordered independent runs, and
  return a stable typed final-state comparison without advancing Canon;
- [x] let explicit story-world branches share at least two ordered seeds, run
  branch-major then seed-minor, retain every replay identity and per-branch
  action variance, and return a stable final-state matrix without ranking or
  advancing Canon;
- [x] reader-response first slice sees only one accepted presented-text unit,
  configured audience Persona and explicit reading history, then returns typed
  synthetic hypotheses without advancing Canon;
- [x] render the latest single story-world and reader-response Tool Results in
  the existing `conversation.view`, including replay identity, frozen revision,
  state transitions or presented-text evidence, limitations and provenance;
- [x] let the same reader-response Tool present one explicit unaccepted
  candidate, returning its id, accepted baseline revision, text source and
  content hash without exposing the accepted manuscript to that candidate run;
  the same path works at R0 before any manuscript has been accepted;
- [x] reject a reader reaction when its claimed exact `evidence` is absent from
  the presented accepted text or candidate;
- [x] let the same reader-response Tool run at least two independent seeds in
  order, preserve every child run/replay identity, and summarize the fixed six
  reaction dimensions without advancing Canon;
- [x] let the same reader-response Tool compare at least two unaccepted text
  candidates over one Persona, reading history and ordered seed set, preserve
  every independent experiment, and return fixed-dimension candidate ratios
  without ranking, rewriting or advancing Canon;
- [x] let the same reader-response Tool compare at least two configured Personas
  over one frozen text, reading history and ordered seed set, preserve every
  independent experiment, and return fixed-dimension cohort ratios without
  ranking, rewriting or advancing Canon;
- [x] let the same reader-response Tool combine at least two candidates, two
  Personas and two ordered seeds into isolated candidate-major, Persona-major,
  seed-minor experiments, then return fixed-dimension matrix ratios without
  ranking, rewriting or advancing Canon;
- [x] let the same reader-response Tool compare the accepted manuscript directly
  with explicit candidate variants under one Persona, reading history and seed,
  preserve ordered isolated runs and fixed-dimension values, and leave Canon
  unchanged;
- [x] calibrate one accepted-text multi-seed experiment against caller-supplied,
  consented real feedback with exact provenance, separate qualitative and
  quantitative evidence, preserve the author's decision, and return only
  explicit mapped ratios or unmapped/insufficient-data status without rewriting;
- [ ] an independent simulation store or durable queue, if the later workflow
  actually requires one;
- [x] deterministic replay identity tests: canonicalize frozen input and the
  emitted trace/reactions, preserve array order, and derive a stable SHA-256
  `replayKey` while keeping the real DSH child `runId` separate.
- [x] derive a frozen typed state from the role's exact resources and known
  Canon facts, require typed preconditions, apply ordered `set` / `remove`
  effects, and return deterministic before/after/final projections without
  advancing Canon.
- [x] let one existing story-world child return an author-bounded ordered
  action trace, replay each step from the prior step's state, and reject a
  trace longer than `maxActions` without adding a Tool, Workflow or queue.

Current proof seeds an allowed R1 character location plus an ungranted hidden
plan, then verifies that the child receives only the location and does not
inherit the parent's conversation. The exact rc.2 Agent Loop, Subagent Runtime,
in-process driver and spawn provider create a distinct child with parent
lineage, expose only DSH's scoped structured-output tool, validate the typed
action and dispose the child. Canon stays R1. The reader-response proof requests
historical R1 after R2 exists, exposes neither the hidden R1 Canon identity nor
R2 text, marks the synthetic result non-representative and leaves the accepted
head unchanged. Its real rc.2 child likewise excludes the parent conversation
and sees only DSH's scoped structured-output tool. A second local Tool path now
presents an explicit unaccepted candidate instead of the R1 manuscript, records
its id and SHA-256 text identity, excludes both accepted R1 and later R2 prose,
and leaves head R2 unchanged. A focused R0 path now opens an empty project and
runs that candidate without first requiring or creating an accepted manuscript;
it returns `sourceRevision: 0` and leaves head R0 unchanged. A fresh rc.2
candidate run remains unverified. Both
simulation Tools accept an optional caller seed and return a stable `replayKey`
derived from the frozen input and emitted trace/reactions. The key is a data
identity for replay bookkeeping; it does not make a model call deterministic.
For story-world runs, each resource and role-visible fact now has a typed state
path. The existing Tool sends the frozen initial state to the child, rejects an
action whose exact path/value precondition is unmet, applies ordered `set` and
`remove` effects only to the counterfactual copy, and returns every transition
plus the final state. Optional positive `maxActions` defaults to one and bounds
the same child's ordered trace; each later action reads the prior action's
projected state. Replaying the same initial state and trace produces the same
projection; accepted Canon remains unchanged.
The story-world Tool now also accepts `seeds`, runs each seed sequentially over
the same accepted revision and explicit role knowledge, and returns every
independent run plus stable-order `count` / `total` / `ratio` summaries for all
twelve action types. Each run contributes at most once to an action type and
Canon stays at R1.
It also accepts at least two explicit `branches`. Each branch supplies its own
id, hypothesis and assumptions while reusing the same accepted revision, actor,
typed initial state, story time and caller seed. Common assumptions are appended
to each branch's assumptions; the result preserves branch order and compares the
union of final-state paths in stable order, including missing values. Canon stays
at R1.
Branches may now be combined with at least two ordered `seeds`. The Tool runs
branch-major then seed-minor from the same frozen role state, preserves every
run id/seed/replay key/trace/final state, summarizes all twelve action types per
branch and returns exact present/value cells for each stable final-state path.
It makes no winner decision and Canon remains R1.
The same Tool now also accepts at least two ordered `actors` instead of one
`actor`. It calls the existing single-role path once per actor under the shared
revision, story time, question, assumptions and optional seed. Each frozen child
input contains only that actor's id, goal, resources and explicitly referenced
accepted facts; the result retains every actor and complete run without sharing
state, ranking actions or advancing Canon.
Reader-response output is accepted only when every reaction's exact evidence is
a substring of the frozen presented text; fabricated evidence rejects the Tool
result and leaves Canon unchanged. The same Tool now accepts `seeds`, runs each
seed sequentially through the existing isolated child path, and returns the
independent runs plus stable-order `count` / `total` / `ratio` summaries for all
six dimensions. One run contributes at most once to each dimension, the shared
presented-text hash is retained, `marketRepresentative` stays false and Canon
stays at R1.
The same Tool now also accepts at least two unaccepted `candidates` together
with at least two `seeds`. It runs candidate-major then seed-minor through the
existing isolated child path, exposes only the current candidate text to each
child, and returns every candidate experiment plus fixed-order six-dimension
count/total/ratio comparisons. It does not select a winner or change prose;
`marketRepresentative` remains false and an R0 proof leaves Canon at R0.
The same Tool now also accepts at least two `personas` together with at least
two `seeds`. It runs Persona-major then seed-minor over one frozen accepted text
or single candidate, gives each child only its Persona, and returns every
Persona experiment plus fixed-order six-dimension count/total/ratio comparisons.
It does not rank Personas or change prose; `marketRepresentative` remains false
and the accepted revision stays unchanged.
The same request may now combine `candidates`, `personas` and `seeds`. It runs
candidate-major, Persona-major then seed-minor, gives each child only its one
candidate and Persona, retains every candidate hash and cell experiment, and
returns fixed-order six-dimension matrix comparisons. It makes no winner or
rewrite decision, remains non-representative and leaves R0 Canon unchanged.
Every reader path first verifies that its frozen baseline revision exists while
retaining R0 as a valid explicit-candidate baseline.
The same Tool now also accepts ordered `variants` under one Persona and optional
shared seed. An `accepted` variant resolves the unit from the frozen revision;
a `candidate` variant carries its unaccepted text. Each child sees only its own
text, and the result retains source/hash/run plus fixed six-dimension 0/1 values
without ranking, rewriting or advancing Canon.
The accepted-text multi-seed path now also accepts one provenance-bearing real
feedback bundle. The Host runs synthetic children without feedback, then maps
only quantitative comprehension/expectation/emotion observations to the fixed
confusion/expectation/emotion ratios. Qualitative observations remain
`insufficient-data`; preference, coordinated noise and continuity remain
`unmapped`. The output preserves source, uncertainty and author decision, makes
no threshold judgment or rewrite, and leaves Canon unchanged.
The current local gate passes 5 files and 234 tests, typecheck, lint and build. See
[`story-world-simulation-rc2-smoke-2026-08-28.md`](../docs/story-world-simulation-rc2-smoke-2026-08-28.md)
and
[`reader-response-simulation-rc2-smoke-2026-08-28.md`](../docs/reader-response-simulation-rc2-smoke-2026-08-28.md).

The existing `conversation.view` now renders both latest single-run results;
these slices add no Pi TUI extension, Better Sidebar tab, Profile, Bundle,
Workflow, Job, store or queue. They do not claim market representativeness,
model-generation determinism, fresh-Profile state/multi-seed/branch/role interaction, production or
user acceptance.

The fresh stock-Web story-world GREEN used the isolated root
`C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-green4-20260902-01a05b3c`
with the controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-red2-20260902-01a05b3c`.
One stock Standard Session made a native `simulate_novel_story_world` call for
R1; the existing `conversation.view` rendered the typed single `observe` trace,
Before/After/Final state, replay identity and provenance, and restored the same
run after reload. GREEN recorded 18 successful RPC and 63 successful Web API
responses, zero browser failures, unchanged Canon/storage and zero post-seed
`novel/` frames; root navigation was HTTP `200`, and port `64248` had no
listener after shutdown. The RED used an unmet typed location precondition and
asserted the native error (`expected "北岸", received "旧庭"`) with R1 unchanged.
The exact artifacts and narrower claim boundary are recorded in
[`story-world-simulation-stock-web-e2e-2026-09-02.md`](../docs/story-world-simulation-stock-web-e2e-2026-09-02.md).
This promotes only single visible action/UI plumbing and typed projection;
child role-knowledge isolation, process/transport recovery, multi-action/seed/
branch/role comparisons, reader-response comparison UI, production and user acceptance
remain outside the claim.

The fresh stock-Web reader-response GREEN used the isolated root
`C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-green-20260902-01a05b3c`
with the controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-red-20260902-01a05b3c`.
One stock Standard Session made a native `simulate_novel_reader_response` call
for accepted R1 `chapter-1`; the existing `conversation.view` rendered the
Persona, presented-text source/hash, reading history, typed reaction evidence,
synthetic-only label and provenance, and restored the same run after reload.
GREEN recorded 18 successful RPC and 63 successful Web API responses, zero
browser failures, unchanged Canon/storage and zero post-seed `novel/` frames;
root navigation was HTTP `200`, and port `64252` had no listener after
shutdown. The RED supplied an absent evidence span and asserted the native
error without changing R1. The exact artifacts and narrower claim boundary are
recorded in
[`reader-response-simulation-stock-web-e2e-2026-09-02.md`](../docs/reader-response-simulation-stock-web-e2e-2026-09-02.md).
This promotes only single visible accepted-text reader-response plumbing;
child isolation, process/transport recovery, multi-seed/candidate/Persona/
variant comparisons, production and user acceptance remain outside the claim.

## N-006 — Import and export

**Status:** `verified` for TXT/Markdown normalized-text round trips, one-unit
EPUB/DOCX publication, accepted-hierarchy whole-book assembly, and the fresh
Profile-visible existing-novel takeover → new-Session continuation path with a
caller-extracted Canon Delta and Workspace `sourcePath`. Normalized EPUB/DOCX
extracted-text import, optional EPUB PNG/JPEG covers and Workspace DOCX templates
remain `implemented-unverified` pending fresh Profile-visible calls; the complete
File Upload UI remains `implemented-unverified` because of the unchanged upstream
dock error.

- [x] TXT and Markdown normalized-text → proposal → author Apply → accepted-revision
  Publish round trip;
- [x] accept EPUB and DOCX normalized text produced by the external extractor in
  the same proposal → author Apply → reload → Publish transaction, with
  `novel-import:epub|docx` provenance and no in-plugin binary parser;
- [x] leave upload and generic extraction to separately installed
  `dsh-file-upload@0.4.3`; isolated rc.2 install/load/client-artifact smoke passed;
- [x] keep import Diff, full-text hash anchor, provenance, revision and rollback in
  the existing `novel-project` Result Packet transaction;
- [x] reuse the existing `conversation.view` Result Packet panel and
  `publish_novel_manuscript`; no upload UI, export Tool, adapter, Profile or Bundle;
- [x] exercise a real browser TXT upload through the community plugin into the
  stock Agent and author Apply flow; the flow reached durable R1 and reload, but
  the upstream attachment dock logged an `undefined.text` slot error;
- [x] publish one accepted manuscript unit as a real EPUB 3 or DOCX binary through
  the same Tool, stock approval and DSH Produced Files presentation;
- [x] publish one whole Book by ordering its descendant Chapter manuscripts from
  the accepted narrative hierarchy while preserving every unit's source revision;
  whole-book DOCX adds a Chapter-only TOC after the title and begins each Chapter
  on a new page;
- [x] retain importer-reported `sourceEncoding`, `sourceBom` and
  `sourceByteLength` on the SourceAnchor through Result Packet, author Apply and
  storage reload;
- [x] publish a Workspace PNG or JPEG as an EPUB `cover-image` plus a cover page
  before the accepted manuscript through the same Tool and stock approval;
- [x] write explicit author metadata to EPUB and DOCX plus EPUB language metadata
  through the same Tool, and write the existing title to DOCX core metadata,
  without a second settings store or export UI;
- [x] patch accepted title and content into a Workspace DOCX template through
  the same Tool and approval, preserving the template's other content;
- [x] preserve exact imported source bytes, including BOM and original newline
  encoding, through Apply/reload and the same Publish Tool's `source` format.
- [x] carry caller-extracted, strictly validated Canon/narrative Deltas beside the
  manuscript in the same authorization-free import Result Packet, bind empty
  Delta source references to its full-text SourceAnchor, and atomically restore
  author-accepted manuscript, Canon, Anchor and provenance as one revision.

The first Host RED failed because `propose_novel_import` was absent, and the
client RED failed because the existing selector ignored that Tool Result. The
single-plugin GREEN accepts complete normalized text, generates its Diff against
the requested accepted revision, adds one SHA-256 full-text SourceAnchor and
returns an authorization-free draft. TXT, Markdown, EPUB and DOCX normalized text
all round-trip through existing author review, reload and Publish; EPUB/DOCX keep
the extractor outside `novel-project` and record format-specific provenance. A second test imports
R1→R2, rolls back to R1 as auditable R3 and publishes the restored R1 text. The
binary RED then failed because the strict Publish request rejected `format`;
the presenter RED separately proved stock Produced Files could not see an
`execute` card without locations. GREEN keeps the one Tool, emits real EPUB/DOCX
bytes after approval through the public DSH target/process-path seam, reports
aggregate/source revision and leaves Canon unchanged. The whole-book RED then
failed because that same strict request rejected `scope` and `title`. GREEN uses
the accepted Book → Volume → Arc → Chapter projection as the order source,
assembles the matching accepted manuscripts, reports their individual source
revisions and still adds no Tool, UI, adapter or package. See
[`txt-markdown-import-export-rc2-smoke-2026-08-28.md`](../docs/txt-markdown-import-export-rc2-smoke-2026-08-28.md)
and
[`epub-docx-export-rc2-smoke-2026-08-28.md`](../docs/epub-docx-export-rc2-smoke-2026-08-28.md).

The whole-book DOCX pagination RED found contiguous Chapter headings. GREEN
adds OOXML `pageBreakBefore` to every accepted Chapter heading, so each Chapter
starts a new page without changing the Canon-derived order, unit publication or
EPUB output. A following RED found no navigation field; GREEN inserts an OOXML
TOC after the book title with heading range `2-2` and hyperlinks, before the
first Chapter.

The EPUB metadata RED failed because the strict request rejected `author` and
`language`. GREEN keeps both fields optional and writes explicit values to
`dc:creator` and `dc:language`; existing calls without them retain the prior
compatible metadata. A following DOCX RED exposed the library default
`Un-named` creator; GREEN passes the same optional author to core properties.
A final core-metadata RED found no DOCX `dc:title`; GREEN writes the already
resolved publication title without adding another request field.

The cover RED failed because the same strict Publish request rejected
`coverPath`. GREEN resolves and reads the approved Workspace source through
`ctx.fs`, preserves PNG/JPEG bytes, emits the EPUB 3 `cover-image` manifest item
and a cover XHTML first in the spine, and leaves Canon unchanged. The
parameterized real-DSH integration covers `.png` and `.jpeg` → `.jpg`; a fresh
Profile-visible call remains open.

The import source slice now accepts optional encoding, BOM and byte-length
metadata plus a Workspace `sourcePath`. The Host reads that path through the
existing DSH fs seam, records its resolved path and exact bytes on the immutable
SourceAnchor, and preserves them through the authorization-free packet, author
Apply, Typert Remote and storage reload. The same Publish Tool's `source` format
follows the projected manuscript's accepted source revision and writes those
bytes unchanged, so UTF-8 BOM and CRLF survive while normalized Canon text and
the accepted revision remain unchanged. The upload plugin or model does not
need to supply Base64. The local real-DSH integration proves Workspace read and
byte-for-byte output; a fresh Profile-visible call remains
`implemented-unverified`.

The existing-novel Canon RED failed because the strict `propose_novel_import`
request rejected `deltas`. GREEN adds the optional Delta array to that same Tool,
binds an empty `sourceAnchorIds` array to the import's full-text SourceAnchor, then
runs every caller value and the assembled draft through the existing strict
Canon/Result Packet schemas. The fresh Profile-visible takeover GREEN used
`C:\Users\33166\AppData\Local\Temp\novel-existing-novel-takeover-green-20260901-205410-01a05b3c`:
an original Workspace `existing-novel.md` was read through DSH fs by a stock Agent
`propose_novel_import` call, its authorization-free manuscript/world-Delta packet
was shown in the existing panel and applied from R1 to R2. After Host 1 (`PID
29208`, port `51887`) stopped, Host 2 (`PID 32584`, port `58567`) created a new
Session, retrieved current R2 anchored/provenance memory, proposed a second
chapter through `propose_novel_result_packet`, and the same panel applied R3;
reload restored the exact manuscript, Delta, Anchor and producer. Both Host
shutdowns left zero listeners and both browser phases had zero console/page/request
failures. The controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-existing-novel-takeover-red4-20260901-205238-01a05b3c`
omitted only the import Delta and failed with the explicit
`existing-world-rule-r2` assertion. No parser, import pipeline, second Tool, store,
Profile or UI was added; full checked fields are linked from
[`docs/upstream-sources.md#checked-evidence`](../docs/upstream-sources.md#checked-evidence).

The DOCX-template RED failed because the strict Publish request rejected
`templatePath`. GREEN resolves and reads the approved Workspace template through
the existing DSH fs seam, uses the already adopted `docx@9.7.1`
`patchDocument` API to replace `{{title}}` and `{{content}}`, preserves the
template's static content, writes only after stock approval, reports the resolved
template path and leaves Canon at R1. The current package gate is 129/129; a
fresh Profile-visible template call remains `implemented-unverified`.

## N-007 — DSH-native novel role Skills

**Status:** `verified` for fresh isolated Profile catalog visibility of all eight
independently callable runtime Skills, direct-user/native-Agent invocation of
`novel-researcher` and `novel-writing-memory-organizer`, the earlier representative
architect path, one representative foreground one-shot DSH-native delegation
from a Standard parent to `novel-writing-memory-organizer`, and the same pairing's
continuable background path with two native `report` calls plus a cold stock
`send_message` continuation after the first settlement. The same pairing's
cross-Host/restart continuation is also `verified` by a fresh two-process stock-Web
smoke: one persisted parent and child crossed a real Host stop/start boundary,
retained the R1 retrieval and completed a second child turn through the stock relay.
Direct invocation of the remaining five roles is also `verified` by a fresh
stock-Web Agent smoke. One depth-two `novel-architect` → `novel-prose-writer`
native pairing is now `verified` by a separate fresh stock-Web replay. Parallel
sibling isolation for a native Skill-tool error is also `verified` by a fresh
stock-Web replay; process/transport fault recovery and other parallel modes
remain `implemented-unverified`, as do other role/pairing compositions,
cross-Session product memory, production use and user acceptance.

Current links: [implementation](../packages/novel-project/src/index.ts),
[focused integration](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts),
and [checked runtime evidence](../docs/upstream-sources.md#checked-evidence).

- [x] register `novel-architect` from the single `novel-project` plugin through
  the native rc.2 `SkillRegistry`, with model/user invocation and the stock
  `skill` loader;
- [x] add the independently callable hook/payoff planner role;
- [x] add the independently callable world/character setting role;
- [x] add the independently callable prose writer role;
- [x] add the independently callable continuity checker role;
- [x] add the independently callable novel reviewer role;
- [x] add the independently callable research role;
- [x] add the independently callable writing-memory organizer role;
- [x] verify one depth-two native role chain (`novel-architect` →
  `novel-prose-writer`) through nested one-shot DSH Subagents;
- [x] verify parallel sibling isolation when one native Skill call returns an
  error while the other child completes;
- [x] keep the user-level `novel` Agent preset as an external DSH composition;
  do not create plugin-owned Preset directories, a Profile, Bundle, second Agent
  Loop, standing expert team or role state store.

The seam RED loaded the real rc.2 `SkillRegistry` and stock `skill` Tool beside
the existing Novel Project service, then received `undefined` for
`novel-architect`. GREEN adds exact `@deepseek-ai/dsh-skill@0.1.1-rc.2` as the
one Host seam dependency and registers the role under optional
`ctx.inject(['skills'], ...)`, so headless test compositions remain valid. The
runtime Skill reads current accepted revision context, plans only the requested
Series/Book/Volume/Arc/Chapter/Scene layers, emits Chapter contracts and strict
Canon/narrative Result Packet proposals, and cannot authorize or write Canon. It
maps objectives and entry/exit state to `narrative-unit`, supported Chapter
constraints to existing contract fields, obstacle/entrants/payoff/hook to
`sceneFunctions` plus `acceptanceGates`, and accepted prose's actual changes/costs
to `chapter-state/post-check`; it does not invent contract fields.
The stock loader returns the canonical `<skill_content>` body; all eight role
loaders pass 8/8, package 234/234, package/root typecheck, lint, build and pack
dry-run pass. A fresh isolated rc.2 Profile exposed all eight roles in the stock
Web slash catalog. `/novel-researcher` and `/novel-writing-memory-organizer`
injected their canonical Skill bodies directly, and a replay-driven real Agent
emitted the matching native `skill({ name })` call for each; both Tool results
matched the direct bodies exactly. The same smoke observed 80/80 2xx same-origin
responses, zero console errors/warnings, page errors, request failures,
`novel/` Canon event frames or unexpected novel storage records; the built
`lib/index.js` SHA-256 stayed
`7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`,
one Session persisted, and port `50845` had zero listeners after shutdown.
Evidence is under
`C:\Users\33166\AppData\Local\Temp\novel-skill-eight-role-20260901-161000-01a05b3c`.
This verifies the Agent/Tool/UI execution chain, not autonomous external-model
Skill selection. The earlier architect direct/native path also passed. One
Standard-parent foreground one-shot and one continuable background composition
with `novel-writing-memory-organizer` are separately verified below; novel-role-
to-role and other role/pairing Subagent compositions, parallel/fault-recovery
behavior, cross-Host/restart continuation for other pairings, cross-Session
product memory, production use and user acceptance remain `implemented-unverified`.

The five-role direct invocation GREEN used the fresh isolated root
`C:\Users\33166\AppData\Local\Temp\novel-five-role-green-20260901-221440-01a05b3c`
and the controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-five-role-red-20260901-221311-01a05b3c`.
A Standard Session loaded each of `novel-hook-payoff-planner`,
`novel-world-character-setting`, `novel-prose-writer`,
`novel-continuity-checker` and `novel-reviewer` through exactly one native
`skill({ name })` call and matching canonical Tool result; accepted Canon stayed
R1. The GREEN recorded 27 direct RPC and 23 Web API responses, zero console/page/
request failures, zero `novel/` frames, and Host `PID 28616`/port `63906` left no
listener after PTY shutdown. The RED changed only the reviewer skill name to
`missing-role` and failed at the exact native-call assertion. This verifies
direct invocation only, not autonomous external-model selection or any role
collaboration/pairing.

The hook/payoff planner RED resolved the same real rc.2 SkillRegistry lookup to
`undefined`. GREEN registers `novel-hook-payoff-planner` through the existing
optional Skill seam. Its stock-loaded instructions read only the current accepted
revision, hold to the accepted reader contract and existing Canon constraints,
map reader retention and local releases to the existing scene/Chapter fields and
the strict `narrative-clock/tension-payoff` contract, and submit only an
authorization-free Result Packet. The runtime body embeds a parser-valid strict
tension/payoff packet example, so it cannot introduce a parallel hook/payoff
store, field, Agent Loop, Session, Preset, Profile or Bundle. The focused loader
test passes 1/1; current package 234/234, root typecheck, lint and build pass. Fresh
isolated Profile catalog visibility is verified; direct user/model invocation, temporary
Subagent composition, production and user acceptance remain
`implemented-unverified`.

The world/character setting RED likewise resolved the real rc.2 SkillRegistry
lookup to `undefined`. GREEN registers `novel-world-character-setting` through
the same optional Skill seam. Its stock-loaded instructions use the strict
`world/rule` value and existing `character-state` fields, distinguish public
belief from hidden truth and observed consequence, require stable ids and source
anchors, and reserve `arc-hypothesis` for its already strict contract. The
runtime body embeds a parser-valid Result Packet containing a strict world rule,
character goal and complete `arc-hypothesis` Delta; it creates no parallel Character/World store, Agent
Loop, Session, Preset, Profile or Bundle. The focused loader test passes 1/1;
current package 234/234, root typecheck, lint and build pass. Fresh isolated
Profile catalog visibility is verified; direct user/model invocation, temporary Subagent
composition, production and user acceptance remain
`implemented-unverified`.

The prose-writer RED also resolved the real rc.2 SkillRegistry lookup to
`undefined`. GREEN registers `novel-prose-writer` through the same optional
Skill seam. Its stock-loaded instructions require accepted-revision retrieval
with the current writing intent, bind prose to the returned writing-memory and
Chapter contracts, exclude internal control material from manuscript text and
submit only an authorization-free Write Result Packet. The embedded parser-valid
example proves that `manuscript` and `manuscriptDiff` travel together, while an
empty Delta/Issue list remains legal for a text-only draft. It adds no writer
service, Agent Loop, Session, Preset, Profile or Bundle. The focused loader test
passes 1/1; current package 234/234, root typecheck, lint and build pass. Fresh
isolated Profile catalog visibility is verified; direct user/model invocation, temporary
Subagent composition, production and user acceptance remain
`implemented-unverified`.

The continuity-checker RED resolved the real rc.2 SkillRegistry lookup to
`undefined`. GREEN registers `novel-continuity-checker` through the same optional
Skill seam. Its stock-loaded instructions retrieve the accepted revision and
Chapter control pack, compare prose only against source-bearing world, character,
relationship, knowledge, debt and contract facts, and return strict anchored
continuity Issues or a paired optional manuscript Diff. The runtime body embeds a
parser-valid Issue-only Result Packet and does not create a review store, Agent
Loop, Session, Preset, Profile or Bundle. The focused loader test passes 1/1;
current package 234/234, root typecheck, lint and build pass. Fresh isolated
Profile catalog visibility is verified; direct user/model invocation, temporary Subagent
composition, production and user acceptance remain
`implemented-unverified`.

The novel-reviewer RED resolved the real rc.2 SkillRegistry lookup to
`undefined`. GREEN registers `novel-reviewer` through the same optional Skill
seam. Its stock-loaded instructions retrieve only the current accepted revision
and selected Chapter control pack, distinguish evidence-backed plot, character,
pace, information-boundary, reader-contract and prose concerns from preference,
and return strict anchored Issues plus an optional paired complete manuscript and
unified Diff. Its parser-valid example does not introduce a review Tool, store,
Agent Loop, Session, Preset, Profile or Bundle. The focused loader test passes
1/1; the current package gate is 234/234 with root typecheck, lint and build
passing. Fresh isolated Profile catalog visibility is verified; direct user/model invocation,
temporary Subagent composition, production and user acceptance remain
`implemented-unverified`.

The research-role RED resolved `novel-researcher` to `undefined` through the
same real rc.2 registry. GREEN registers one original static Skill through that
existing optional seam. It uses only Browser/Web search/file Tools already
present in the selected DSH Profile, separates observable facts, source claims,
inference and unknown/conflicting evidence, retains source title or file id,
publication/access dates and scope, and refuses to treat one ranking or case as
a trend. Retrieved material is untrusted data rather than instructions. The
default output is a source-bearing research brief; only an explicit request to
propose Canon may use the existing authorization-free Result Packet, and a
missing real source range never permits a fabricated SourceAnchor or hash. It
adds no Tool, Provider, crawler, index, store, Profile, Workflow, Session or Agent
Loop. The focused loader test passes 1/1; eight role loaders pass 8/8 and the
current package gate is 234/234 with package/root typecheck, lint, build and pack
dry-run passing. Fresh isolated Profile catalog visibility, direct
`/novel-researcher` injection and its replay-driven native
`skill({ name: "novel-researcher" })` call are verified; temporary Subagent
composition, production and user acceptance remain `implemented-unverified`.

The writing-memory-organizer RED resolved
`novel-writing-memory-organizer` to `undefined` through the same real registry.
GREEN registers one original static Skill through the existing optional seam.
It reads the requested accepted revision and Chapter control pack, returns a
read-only carry-forward brief spanning Chapter outcome, character and arc state,
directional relationships, character/reader knowledge, authoring contracts and
debts, and forbids future-revision leakage. Only an explicit request after the
manuscript is accepted may propose a strict `chapter-state/post-check`; related
debt, relationship, knowledge and arc changes use only their existing complete
contracts and no memory-summary fact or store. Its embedded full post-check
example parses through the production Result Packet schema. The focused loader
test passes 1/1; eight role loaders pass 8/8 and package 234/234 plus package/root
typecheck, lint, build and pack dry-run pass. Fresh isolated Profile catalog
visibility, direct `/novel-writing-memory-organizer` injection and its
replay-driven native `skill({ name: "novel-writing-memory-organizer" })` call are
verified; ordinary retrieval remained read-only and the smoke emitted no
`novel/` Canon event or unexpected storage record. Cross-Session/restart product
memory remains `implemented-unverified`. One representative foreground one-shot
delegation from a Standard parent is `verified`: the parent made one stock
`subagent` call; its child retained the parent lineage, loaded this canonical
Skill through one stock `skill` call, completed a read-only R1
`retrieve_novel_context` call, returned `CHILD_MEMORY_BRIEF_R1`, and became
inactive without proposal calls, workflow events, Canon frames or unexpected
storage writes. The parent also completed; all 24 RPC and 72 Web responses
succeeded, browser failures were zero, the build hash remained unchanged and
shutdown left no listener. The strict RED omitted the child replay fixture and
reached the native boundary with `Error: subagent run failed`; its retained root
is
`C:\Users\33166\AppData\Local\Temp\novel-subagent-role-foreground-20260901-163838-01a05b3c`.
GREEN evidence is under
`C:\Users\33166\AppData\Local\Temp\novel-subagent-role-foreground-green5-20260901-165316-01a05b3c`.
The complete R1 memory payload remains in the child Tool result; the parent saw
only the fixed completion marker.

A second RED disabled both child `report` calls while leaving the real native
continuable boundary intact; after both child turns settled it failed only on
`expected two native reports from the two continuable child turns — 0 !== 2`.
GREEN used a fresh isolated rc.2 Web Profile with a Standard parent and a
`mode=continuable` child. The child loaded the canonical Skill once, completed
two read-only R1 `retrieve_novel_context` calls and emitted
`CHILD_REPORT_R1` / `CHILD_FOLLOWUP_REPORT_R1`. After the first settlement the
parent made one native stock `send_message` with `FOLLOWUP_MEMORY_R1`, causing a
cold second child turn; the parent event order was
`subagent-report → subagent-settled → subagent-report → subagent-settled`, and the
catalog visibly moved from running to inactive. Parent/child completed 5/2 turns;
all 60 RPC and 59 Web API responses succeeded, console/page/request failures were
zero, proposals, workflow events and post-baseline `novel/` frames were zero, and
accepted revision remained R1 through reload. Novel storage and built
`lib/index.js` retained SHA-256
`4ED059C042B5BC4E0E97076F972AEDCAA2A30F8E04C4AB03CD271C9D4DECAD6` and
`7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`;
shutdown left no listener. Stock Web expanded both reports and settlements,
showed the two child turns and cold coordinator message, retained the reports
after reload, and did not present the continuable child as a Job. The fixed
report markers prove delivery and order; the complete R1 retrieval payloads
remain in the child Tool results. The valid RED root is
`C:\Users\33166\AppData\Local\Temp\novel-subagent-role-background-red2-20260901-173150-01a05b3c`;
GREEN evidence is under
`C:\Users\33166\AppData\Local\Temp\novel-subagent-role-background-green4-20260901-174227-01a05b3c`.

This verifies only the Standard parent → writing-memory organizer pairing.
The two-process cross-Host/restart continuation for this same pairing is now
`verified` in the fresh evidence below; novel-role-to-role and other role/pairing
delegations, parallel/fault-recovery behavior, cross-Session product memory,
production use and user acceptance remain `implemented-unverified`.

The cross-Host/restart RED/GREEN smoke used the same isolated DSH_HOME/Profile in
`C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-green2-20260901-190402-01a05b3c`
and retained the controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-red3-20260901-183831-01a05b3c`.
Host 1 (`PID 22136`, `127.0.0.1:55235`) created the Standard parent
`session-be372582-3af3-452c-b80c-a0fd6afc371a` and continuable child
`1eb3b95b-3478-4a87-88ec-7c10d10f2908`, completed the first R1 retrieval/report/settle,
and was stopped with PTY `Ctrl+C`; the boundary recorder observed zero listeners and
the exact process instance gone. Host 2 (`PID 39276`, `127.0.0.1:56818`) restored the
same parent/child, exposed `parentAvailable=false` before the parent was resumed, then
completed the second retrieval/report/settle after exactly one stock `send_message`.
The final summary records `report → settled → report → settled`, one child with two
completed turns, one durable coordinator relay whose `user/message` id/source/text
matches the inbox message, strict phase-1 prefixes for both raw `session.export`
JSONL artifacts, unchanged R1/Canon/storage/build, zero browser/RPC failures, and
zero listeners after both Host shutdowns. The RED omitted only the second report and
failed with `reports=1` while the child otherwise settled. Full checked fields are
linked from [upstream-sources.md#checked-evidence](../docs/upstream-sources.md#checked-evidence).

## C-001 — Community Web/Desktop plugins

**Status:** closed as an external-download boundary. The current no-wrapper Web
composition and both client artifacts are `verified`; complete upstream plugin
interaction is not a novel-agent implementation task.

- [x] select `dsh-better-sidebar@0.16.1` for files, editor, terminal, Git, Diff,
  Jobs/Subagents and layout;
- [x] remove the duplicate local Canon tab; the necessary domain panel already
  uses DSH's stock conversation view;
- [x] isolated current install/load smoke for Better Sidebar unchanged beside
  novel-project, including Web root plus both client artifacts at HTTP `200`;
- [x] list Better Sidebar Files/terminal/Git/Diff as upstream behavior rather
  than creating a novel-agent acceptance or replacement implementation;
- [x] isolated rc.2 install/resolve/Host/client-artifact/UI smoke for
  `@anweat/dsh-browser@0.1.9` + `dsh-web-search-pro@0.1.11`: the normal first
  add reported only `@jackwener/opencli` at the Pnpm build gate, the retry
  allowed that exact build, both loaders and settings contributions mounted,
  both client artifacts returned HTTP `200`, and the visible plugin inventory
  showed `browser` / `web-search-pro` enabled with no browser console error,
  page error or failed request; outbound browser/search execution remains
  upstream behavior rather than a novel-agent implementation task;
- [x] isolated rc.2 install/resolve/Host/client-artifact and real TXT upload →
  composer → Agent smoke for `dsh-file-upload@0.4.3`; its attachment dock console
  error remains an upstream caveat and is not a novel-agent patch target;
- [x] list optional `dsh-git-worktree@0.6.0` as a development-only user download;
- [x] do not implement a generic browser, uploader, terminal, file tree, Diff,
  Git client or Workbench in novel-agent.

## C-002 — Community Pi TUI

**Status:** closed as an external-download boundary; isolated rc.2 resolution,
startup and the visible input-ready TUI shell are `verified`. Novel-agent does
not own a second TUI interaction backlog.

- [x] use `@xmoon76/dsh-pi-tui@0.3.4` for the complete TUI;
- [x] remove the nonessential local Canon footer package;
- [x] no `novel-tui-profile`, Bundle aggregator, adapter or installer;
- [x] fresh isolated Profile install/load/visible input-ready TUI smoke;
- [x] keep necessary novel review/accept interaction in the existing
  `novel-project` stock `conversation.view` rather than making Pi TUI behavior a
  novel-agent implementation gate;
- [x] if an upstream TUI lacks that interaction, document the Web conversation
  view as the required surface; do not create a TUI package, Pi TUI extension,
  community-UI adapter or wrapper.

## Increment completion rule

### 2026-09-07 — Reopen quality acceptance; repair before Chapter 6

The accepted five-chapter count is transaction progress, not quality completion.
[Current-data audit](../docs/accepted-chapter-quality-audit-2026-09-07.md) found
explicit violations and corrects the earlier interpretation.

- [x] Repair Chapter 2 meta prose and box/marker continuity after independent
  review; validate a real applicable unified diff and 2,979 visible characters.
- [x] Use the actual panel for R19 manuscript and R20 sourced post-check Apply;
  clear unsupported Chapter 2 debt transitions, preserve historical revisions,
  and verify another existing Session after Host restart without storage writes.
- [ ] Repair six remaining chapter-meta references in Chapters 3–5 with genuine
  diffs and source-bound post-check updates.
- [ ] Resolve the Chapter 4→5 lead-plaque three-versus-two-mark contradiction.
- [ ] Resolve six remaining unbacked Chapter 3–5 debt transitions; verify the
  Chapter 5 trial prerequisites against actual accepted prose and contracts.
- [ ] Complete project setup and per-chapter quality review before treating the
  remaining Chapter 6–10 run as full original-novel acceptance.

No product source, global Profile, reference repository or graphify output was
changed by this evidence-and-accepted-data repair.

### 2026-09-05 — Real-model Chapter and spilled writing memory

The writer Skill reuses the existing architect Chapter example and makes
Plan acceptance, Write acceptance and post-check separate steps. The native
loader regression parses the shared example. Actual model calls recovered a
rejected first-Chapter proposal, accepted its independent contract as R2, then
used a new Session to retrieve that contract and revise the manuscript.
Independent review plus a 22-character author cut produced 3,087 visible
characters, accepted through the real panel as R3; post-check was reviewed with
the actual manuscript Anchor and accepted as R4.

This run exposed a concrete UI crash: large DSH Tool output is a truncated
preview, not complete JSON. The writing-memory panel now reruns the successful
call's original revision-bound query through the existing read-only Remote.
Inline/spilled regressions pass; the previously crashing Session now renders
and reloads without browser errors. Current gates: 239 package tests, 41 Client
tests, 131 Remote tests, typecheck, lint, build and pack. This does not establish
the full ten-Chapter acceptance. See
[the real-model evidence](../docs/external-model-chapter-repair-2026-09-05.md).

The same isolated Profile subsequently completed a real Chapter 2 Plan→Write→
post-check continuation from R4 through R8 (R8 corrected the full-manuscript
anchor range). Chapter 3 then reached R9/R10/R12 with a 3,002-character
manuscript and a corrected full-text hash. Chapter 4 then reached R13/R14/R15
with a 3,005-character author-reviewed manuscript. Chapter 5 reached R16/R17/R18
with a 3,100-character author-reviewed manuscript. The 2,930-character manuscript and
the two schema-rejected/retried proposals are recorded in the dated evidence;
the post-accept stock-Web reload showed R8 and historical writing memory. This
does not promote the full ten-Chapter, pending-packet UI, production or user
acceptance requirements.

- RED → GREEN → REFACTOR for every behavior change.
- Run the focused/package gate, then root test/typecheck/lint/build.
- Cross-plugin claims require a fresh isolated real Profile smoke.
- Update README, architecture, parity and upstream records with current evidence.
- Review `git diff --check`, relevant diff and `git status --short`.
- Do not commit, push, publish, deploy or touch the user's global `.dsh` without
  an explicit current request.

## 2026-09-15 作者工作台重设计 + 提案收件箱

按用户要求重做 conversation.view 面板：默认停在写作台，四个页签（写作台/故事/历史/高级），
全中文人话渲染，视觉参考 ml4trading.io 的深蓝+琥珀+暖纸白设计系统。提案改由项目记录里的
持久化收件箱提供（新增 pendingProposals/discardProposal Remote，旧记录靠 schema 默认值
兼容，接受后自动清理），不再从聊天记录里抓取。写作台提供提案卡、正文阅读、两步接受
（接受本章 → 影响预览 → 确认接受）与「继续写第 N 章」（经 DSH 输入接口发给 agent）。

逐切片 RED → GREEN；根门禁 284 tests / typecheck / lint / build 全绿，包已重打包并装进隔离
真实环境，官方 Host 正常启动（http://127.0.0.1:50267/ 返回 303）。用户目视验收与真实模型
完整回合（接受后继续写）尚未完成。详见
[证据](../docs/ui-redesign-2026-09-15.md) 与
[parity 行](../docs/claude-desktop-parity-matrix.md)。
