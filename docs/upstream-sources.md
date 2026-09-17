# Upstream source and supply-chain ledger

**Last evidence refresh:** 2026-09-17

**Writing I/O:** [migration evidence](writing-io-migration-2026-09-09.md) moves existing
import/publication and codec code into Writing. It reuses DSH Agent/FS/sandbox-policy/
util-values rc.1, Host Tools peer, diff 9.0.0, docx 9.7.1, fflate 0.8.3 and Zod 4.4.3.
The 439 lockfile package resolution keys are unchanged. Existing approval and file
semantics remain; 266 tests and actual Host four-format/cold recovery paths pass.
Only external LLM and approval responses were scripted; no GUI or real model claim.

**Memory retrieval and native Jobs:** [current evidence](memory-retrieval-migration-2026-09-09.md)
moves existing search/ranking/ledger/lifecycle and Job producer code into Memory.
MiniSearch 7.2.0 and Jieba 2.0.2 remain the implementations; no new resolved version.
Memory declares existing DSH Agent/Jobs/Session rc.1 and Zod 4.4.3. Tools is an exact
Host peer, and Core retains Jobs only for its integration tests. The native session/event
feed invalidates derived indexes; the native Job controller remains owner-bound.
264 tests and fresh Host R3/R4 Job/history/restart paths pass. Official completionDelivery
quiet was used for this test Profile; default model wakeup and GUI quality are not proved.

**Memory graph and candidate inputs:** [current evidence](memory-graph-migration-2026-09-09.md)
moves the existing project-authored graph, causal comparison and knowledge-boundary
calculation into Memory. Typed Cordis Service calls carry explicit Canon/Planning
views, including unaccepted author candidates. Ten algorithm/formatting declarations
are unchanged apart from export; no new package version or lockfile change occurs.
262 tests, 22 successful native RPCs and four Tool comparisons pass. Missing Memory
omits only its causal contribution from base preview. GUI and real model quality remain unverified.

**Memory projection ownership:** [current evidence](memory-projection-migration-2026-09-09.md)
moves seven project-authored relationship/control-pack functions into Memory, reusing
native Cordis Services/effects and the already-resolved `dsh-util-values@0.1.2-rc.1`
(MIT). Canon selects effective sources and resolves locks; Writing reads historical prose.
No new third-party version, DSH patch, rollback reader or state store is introduced.
259 tests, 18 successful native RPCs, three Tool comparisons and two full Host restarts
verify the stated scope. GUI, Desktop and real DeepSeek quality are unverified.

**Review execution and Tools peer:** [current evidence](review-engine-migration-2026-09-09.md)
moves project-authored review schemas, anchored proposal construction and diff into Review.
It consumes native Canon/Planning/Writing/Memory Services and the official rc.1 spawn provider.
Real Agent Loop execution exposed distinct Host/Profile Tools scheduler Symbols. Core and
Review now use `dsh-tools@0.1.2-rc.1` as peer + dev dependency; the tested Profile sets
`autoInstallPeers: false` and resolves Tools from the full Host's official fallback.
No upstream scheduler or loop code changed. Existing rc.1, diff 9.0.0 and zod 4.4.3
dependencies add no resolved lock entry. 256 tests and native cold review/partial acceptance
pass with a scripted LLM boundary; GUI, Desktop and real DeepSeek quality remain unverified.

**Domain-owned prompt sections:** [current evidence](domain-prompt-migration-2026-09-09.md)
directly reuses `@deepseek-ai/dsh-system-prompt@0.1.2-rc.1` section effects and assembly.
Four domain plugins now declare that already-resolved dependency. Canon keeps only
its authority/read/accept/general DSH guidance; all eleven original paragraphs remain.
The official CLI's `watchUserPatches` and Cordis include's native `disabled` patch
provided the actual live unload/restore test. No prompt registry, watcher, kernel or
new third-party version was added. Only novel-section names/lengths/hashes were saved;
no assembled prompt body or other section content entered the evidence.

**Complete existing-role ownership:** [current evidence](domain-role-migration-2026-09-09.md)
moves the final four project-authored Skills into Memory and Review. Writing exposes
native accepted-manuscript reads; Memory exposes the existing revision-bound retrieval
path while its algorithm still resides in Core. Cordis controls the required-service
chain and withdraws dependent roles. All five packages use the existing Cordis 4.0.2
and DSH 0.1.2-rc.1 APIs; no new third-party version was selected. Core's now-unused
production SkillRegistry dependency becomes dev-only. Three full Host lifetimes
prove eight native loaders and historical/rollback reads; no GUI or model-quality claim.

**Planning projection ownership:** [current evidence](planning-projection-migration-2026-09-09.md)
moves the narrative algorithm and hierarchy/identity/reference validators into Planning.
Canon selects effective revision sources and invokes registered domain projectors;
no domain replay authority or persistent store is introduced. Planning reuses
`@deepseek-ai/dsh-util-values@0.1.2-rc.1` for deep freezing and the existing public
Canon wire vocabulary. No Core Service implementation is imported by Planning.
The local lock adds only that already-resolved direct dependency. The four actual
Host lifetimes and 251 tests cover basic Core Preview, composed validation/history
and cold rollback recovery; GUI and model quality remain unverified.

**Planning Service and Writing dependency:** [follow-on evidence](writing-planning-seam-2026-09-09.md)
uses Cordis `Service` directly for `novelPlanning.readPlan`, then moves the existing
prose Skill to Writing. Writing requires the real Canon/Planning services and
withdraws when Planning unloads. That increment initially delegated to Canon's
projector; the ownership migration above supersedes that intermediate implementation.
Existing DSH Workspace `0.1.2-rc.1` is now a direct Planning type dependency;
the lock has no new third-party version. Three actual Host lifetimes prove
R2/R3 contract isolation, rollback R4 and four Skill loaders. No new GUI or model proof.

**Planning role ownership:** the [first migration slice](planning-skill-ownership-2026-09-09.md)
uses the existing Cordis 4.0.2 injection/lifetime and DSH `dsh-skill` / `dsh-tool-skill`
`0.1.2-rc.1` directly. Three local role declarations moved from Canon to Planning;
there is no new third-party implementation, dependency version, remote service or UI.
Real installation, native Tool loading and a full Host restart pass with unchanged
Canon bytes. GUI, model quality and the remaining Planning contract are unverified.

**Authorized recovery patch:** [current evidence](canon-session-recovery-2026-09-09.md)
uses official rc.1 plus a local pnpm patch for explicit log-only compatibility intent.
The development tree, actual Host and selected Profile share the same patched
Session bytes. Native/full-Host API recovery now passes; GUI recheck is pending.
This is not an unmodified official release or a claim that old logs were migrated.

**Current version adoption:** the user explicitly selected DSH `0.1.2-rc.1`.
[The migration record](open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md)
supersedes the earlier decision to retain rc.2: 52 direct and 68 actually resolved
DSH packages are all rc.1, with Cordis 4.0.2. Package gates and the listed real Web
UI actions pass; custom-event cold continuation in that unpatched run failed.
The authorized patch above supplies the later native-recovery result.
Desktop 2.0.2 rows below are historical; Desktop 2.0.5 has only release/source evidence.

**Official version evaluation:** user permission now allows verified official DSH and
companion host releases. The [published-package evaluation](open-source-evaluations/dsh-session-event-upgrade-2026-09-08.md)
checked DSH `0.1.2-rc.1` / `0.1.3-alpha.2` and community Desktop `2.0.5`.
Neither DSH candidate passed the required external-event writer/resume gate;
the latest package's actual reader rejects its own unmarked custom-event output.
No product dependency, lockfile or adopted-license change resulted.

The later [full official Host trial](dsh-full-host-upgrade-trial-2026-09-08.md)
completed rc.1 installation, authenticated Remote and process restart: builtin
recovery succeeds, custom-event recovery still fails. Alpha dependencies were
installed but its native-addon build is incomplete, so no alpha full-Host claim
is made. Official PyPI and alpha Release assets supplied no same-version Windows
prebuilt alternative. These candidates remain evaluation-only.

**Subsequent independent author lookup repair:** the [native recovery report](native-author-session-lookup-2026-09-08.md)
records direct reuse of the registered DSH Agent provider, the published generator's
external-type limit, and the existing generator-only metadata façade update. Two
exact rc.2 development dependencies now provide actual JSONL proof; their Koffi
dependency and MIT notices are recorded in THIRD_PARTY_NOTICES. This is not an
adoption of a newer DSH or Desktop version.

**2026-09-08 M1 supplement:** [The current checkpoint](canon-extension-m1-2026-09-08.md)
uses the verified local rc.2 source archive and real isolated Profile. Cordis registration
is supported, but first-party persistence refuses out-of-repo SessionEvent names;
the runtime event-registration and ignorable-writer surfaces are explicitly deferred
upstream. No dependency, version or license change was made. Historical rows below
do not override this current cold-resume failure.

**Scope:** the community Desktop host and the novel-agent plugin components
that compose into it. This ledger records observed source/release information;
it does not claim production trust or user acceptance.

## Adopted Desktop host

| Component | Exact source / artifact | License | Role and boundary | Evidence state |
| --- | --- | --- | --- | --- |
| Community DSH Desktop | [GitHub Release `v2.0.2`](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/tag/v2.0.2), tag commit `9d18856ddea4f20eb3ef8c88b0436921c6b19606`; audited checkout HEAD `b13e1fa47e3ac5925bcd664091cfe5db85ee7fab`; [Windows x64 setup](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/download/v2.0.2/DSH-Desktop-2.0.2-x64-Setup.exe) | MIT, Copyright (c) 2026 Anywhere Labs | Direct host for Electron, window/tray/lifecycle, Profiles, native terminal, diagnostics, notifications, updates and market integration. Novel-agent does not copy or package this host. | Tag, source, license and installer asset checked; isolated host/Profile and Novel Remote smoke verified; production and user acceptance not run. |
| DSH runtime in the host | Release manifest `dsh-plugin-desktop@2.0.2`: `@deepseek-ai/dsh-base`, `dsh-web-app`, `dsh-host-webserver` exact `0.1.1-rc.2` | MIT upstream DSH | Sole Agent/Session/approval/persistence/plugin core and normal loopback Web carrier. | Manifest, lock/why resolution and real CLI Profile composition checked. Packaging anomaly: the resolved `dsh-base@0.1.1-rc.2` tarball embeds a manifest versioned `0.1.1-rc.1`; no local patch is applied. |
| npm `dsh-plugin-desktop` candidate | npm metadata: published `0.0.1`, `2.0.0`; latest `2.0.0` | Registry package license metadata is not the adoption basis | Rejected. It has no `2.0.2` and its `dsh-base` dependency is `0.1.0-rc.6`. | Registry metadata checked. |

The release URL currently redirects from `anywhere-labs/deepseek-harness-desktop`
to the renamed `anywhere-labs/dsh-desktop` repository. The original release link
above remains the pinned adoption reference.

## Adopted community plugins

| Component | Exact source / artifact | License | Role and boundary | Evidence state |
| --- | --- | --- | --- | --- |
| `dsh-better-sidebar@0.16.1` | [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar), tag `v0.16.1`, commit `f9153dfc1ce47cf43445c1b351ee3ae47b4ad9f1`; npm tarball SHA-256 `350486C712E17287C316DDB6BA15BC05741796AB0F4DE6C5C0DAAE729913F2B3`, integrity `sha512-fjFNzfrgdIbzlcC4Sd4aS1I2ZRbuA+/m3XQnOxY13jE6IKJzwz0+GjATcKTyFoLnXoDRp2QJz/U0GxhaOD70Dw==` | MIT, Copyright (c) 2026 dsh-external | Separately installed Files/editor/preview/terminal/Git/Diff/Jobs/Subagents/layout surface. Novel-agent does not wrap it or register a duplicate Canon tab. | Current no-wrapper rc.2 Profile resolved Better Sidebar beside `novel-project`, started Web, and served the root plus both client artifacts with HTTP `200`. Historical Files/tree/editor/reload UI smoke also passed, but it disabled terminal/sidechat; current unchanged Files/terminal/Git/Diff interaction remains unverified. Static `pnpm peers check` exited `1`; published prerelease peer ranges remain a compatibility caveat. |
| [`@anweat/dsh-browser@0.1.9`](open-source-evaluations/dsh-browser-and-web-search-pro.md) | [anweat/dsh-browser](https://github.com/anweat/dsh-browser), npm `0.1.9`, integrity `sha512-q+C/1LrAOgpgfiuwgfOcUSfWXEjvUqz7T84gdqZb+e2zgESgvms6UqP5Zk6hoW2dqqa+8Jnxayd2XPlbf+2xyw==` | MIT | Separately installed Playwright/OpenCLI browser service and tools. | A fresh isolated rc.2 Web Profile installed it after allowing only the reported `@jackwener/opencli` build, mounted its Host and client settings contribution, served its client artifact at HTTP `200`, and showed the enabled `browser` loader in stock Plugin Inventory. The visible run had no console error, page error or failed request. Outbound browser execution and production use remain unverified. |
| [`dsh-web-search-pro@0.1.11`](open-source-evaluations/dsh-browser-and-web-search-pro.md) | [anweat/dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro), npm `0.1.11`, integrity `sha512-nJuOUxvK26wksgUlBFlSQ3cylWuWrTHXORqWYNVVgKySolkNThfsF3drODJe2Ha0PugPN3KRfvCzyX7kjrEXiQ==` | MIT | Separately installed multi-engine and Chinese-site search over the browser service. | The same fresh Profile mounted its Host and client settings contribution, served its client artifact at HTTP `200`, and showed the enabled `web-search-pro` loader with synchronized search/backend settings. The visible run had no console error, page error or failed request. Live engine queries, credentials, production and user acceptance remain unverified. |
| [`dsh-file-upload@0.4.3`](open-source-evaluations/dsh-file-upload.md) | [HongMing-Huang/dsh-file-upload](https://github.com/HongMing-Huang/dsh-file-upload), npm `0.4.3` | MIT | Separately installed upload and generic document-to-text entry. Novel import transactions remain in `novel-project`. | Fresh isolated DSH `0.1.1-rc.2` Web Profile installed after explicitly allowing only `sharp` and `tesseract.js` builds, resolved `file-upload`, started the Host and served its client artifact at HTTP `200`. A later real TXT upload inserted exact composer text and reached Novel Project R1/reload, while the unchanged attachment dock logged an upstream `undefined.text` slot error. |
| `@xmoon76/dsh-pi-tui@0.3.4` | [XMoon/dsh-pi-tui](https://github.com/XMoon/dsh-pi-tui), npm `0.3.4` | MIT | Separately installed complete TUI. Novel-agent provides no TUI runtime, Profile or status-only adapter. | Fresh isolated rc.2 Profile resolved Pi TUI beside `novel-project`, mounted the four official DSH state providers through the user Profile, and displayed the input-ready main shell. Novel-specific review/accept interaction remains unverified. |
| `dsh-git-worktree@0.6.0` | [wloops/dsh-git-worktree](https://github.com/wloops/dsh-git-worktree), npm `0.6.0` | MIT | Optional development-only Worktree workflow. | Source/manifest/version/license researched; exact rc.2 DSH dependencies observed, runtime smoke pending. |

The saved npm attestation declares GitHub Actions release workflow
`refs/tags/v0.16.1` and the same commit/digest. Local `git verify-commit` exited
`1`; online Sigstore/npm cryptographic verification was not run. The package
tarball itself declares no npm lifecycle script, but its direct
`node-pty@1.1.0` dependency does: install succeeded only after that one native
build was explicitly allowed. A second `node-pty@1.2.0-beta.15` remains in the
DSH subprocess chain; Better Sidebar terminal paths were disabled and are not
covered by the Files/editor smoke.

## Retained novel-agent component source

| Component | Exact source / artifact | License | Replacement boundary |
| --- | --- | --- | --- |
| `@novel-agent/novel-project` | This repository; DSH storage/Remote/Slot/Jobs/Subagent seams exact `0.1.2-rc.1` | `UNLICENSED` project code; DSH is MIT | Novel Canon aggregate, Result Packet service, revision-aware retrieval jobs and on-demand graph projection, proposal-only story-world/reader-response SimulationRun with stable replay identity, and necessary DSH `conversation.view` panel; no alternate Session/persistence/Jobs/UI host. |
| `minisearch@7.2.0` | [lucaong/minisearch](https://github.com/lucaong/minisearch); npm integrity `sha512-dqT2XBYUOZOiC5t2HRnwADjhNS2cecp9u+TJRiJ1Qp/f5qjkeT5APcGPjHw+bz89Ms8Jp+cG4AlE+QZ/QnDglg==` | MIT | Host-only in-memory index rebuilt from the explicitly requested accepted revision. It is a derived projection, never Canon. |
| `@node-rs/jieba@2.0.2` | [napi-rs/node-rs](https://github.com/napi-rs/node-rs), package git head `3b2896520f4274d74aab262436e93e2cfbd4966f`; npm integrity `sha512-aONN6nwpbwHKenEzCcYUbm6ZFHWEs7N5eas7zwWFs3c4MmEdN79m9Si4PvOxCp285I2M+g4MfLyUm9WcYaQi7Q==` | MIT | Host-only Chinese tokenizer in `novel-memory`; optional platform binaries remain normal package dependencies, not a novel-agent runtime or UI seam. |
| `diff@9.0.0` | [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff), package git head `db0b12ace208da7fd741cf96d97f009347a9eaa8`; npm integrity `sha512-svtcdpS8CgJyqAjEQIXdb3OjhFVVYjzGAPO8WGCmRbrml64SPw/jJD4GoE98aR7r25A0XcgrK3F02yw9R/vhQw==` | BSD-3-Clause | Host-only `createTwoFilesPatch` behind `reviewDraft`; it produces a proposal Diff and owns no author authorization, Canon, renderer or generic Diff surface. |
| `docx@9.7.1` | [dolanmiu/docx](https://github.com/dolanmiu/docx); npm integrity `sha512-ilXFf9Moz47ABjFpDiA5s1w9lpb4EFSp7+5iiJSbfyYDM+bpZdAgLlSr7fW4aXhVe/E+F6QCv0EvRVFEd5CsWg==` | MIT, Copyright (c) 2016 Dolan | Host-only `Document`/`Packer.toBuffer()` encoding and `patchDocument`/`PatchType` Workspace-template replacement for the existing Publish Tool; no document UI or state store. |
| `fflate@0.8.3` | [101arrowz/fflate](https://github.com/101arrowz/fflate); npm integrity `sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==` | MIT, Copyright (c) 2026 Arjun Barrett | Host-only in-memory ZIP encoder for the minimal EPUB 3 container; no reader, downloader, UI or Canon ownership. |
| `tance-mang/chinese-webnovel-skills` Skill methods | [commit `ecf552f6930e769d8bbf17818ad3d5a864a7a70b`](https://github.com/tance-mang/chinese-webnovel-skills/tree/ecf552f6930e769d8bbf17818ad3d5a864a7a70b), `skills/outline/SKILL.md`, `skills/world/SKILL.md`, `skills/trends/SKILL.md`, `skills/deconstruct/SKILL.md` and `skills/memory/SKILL.md` | MIT, Copyright (c) 2026 tance-mang | High-level planning methods are re-expressed in `novel-architect`; scoped/time/source-bearing observations and the single-sample limit are re-expressed in `novel-researcher`. `novel-writing-memory-organizer` adopts no upstream memory method or text: its reviewed file/snapshot/CLI/summary workflow is rejected in favor of existing accepted-revision Canon projections and strict Result Packet contracts. No upstream code, prompt text, template, example, file memory, CLI, model config or asset is included. |
| `KKKKhazix/human-writing` research method | [commit `4fda173f3fef7fb808f3eba991eeb2528ea4b189`](https://github.com/KKKKhazix/human-writing/tree/4fda173f3fef7fb808f3eba991eeb2528ea4b189), `human-writing/SKILL.md` and `human-writing/references/reality.md`, `fiction.md`, `revision.md` | MIT, Copyright (c) 2026 Human Writing Skill contributors | Observable fact, attributed claim, inference and unknown/conflicting-evidence separation is re-expressed in the original `novel-researcher`. No upstream wording, example, script, prompt, runtime or asset is included. |
| `sigma@3.0.3`, `graphology@0.26.0` | [jacomyal/sigma.js](https://github.com/jacomyal/sigma.js) and [graphology/graphology](https://github.com/graphology/graphology); pinned in `packages/novel-workbench/package.json` | MIT (both); no install lifecycle script | Browser-side story-map rendering inside the workbench client bundle. The map is a derived projection and owns no Canon, proposal or authorization. Rejected alternative and measured bundle cost in [the frontend stack evaluation](open-source-evaluations/frontend-stack-2026-09-16.md). **`graphology-layout@0.6.1` and `graphology-layout-forceatlas2@0.10.1` were removed 2026-09-17** (I6.1a): the cast is laid out on cluster rings by `src/client/story-map-layout.ts`, so the force-directed stack left both the bundle and the lockfile (46 deletions, 0 additions). |
| `@tiptap/react@3.31.3`, `@tiptap/starter-kit@3.31.3`, `@tiptap/pm@3.31.3` (+48 transitive) | [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap); pinned exact in `packages/novel-workbench/package.json`; lockfile adds 51 packages, removes none | MIT (all 51 in the added closure); no install lifecycle script | Writing-editor surface inside the workbench client bundle. It produces draft text only — Canon changes still require an accepted Result Packet. Declared 2026-09-17 and **not yet imported** by any client module. Measured cost, composition and budget decision in [the editor stack evaluation](open-source-evaluations/editor-stack-2026-09-17.md). |
| `@deepseek-ai/dsh-client-ui-input-trigger@0.1.2-rc.1` (+ `clsx@2.1.1`) | DSH platform plugin, pinned to the locked DSH version; declared in `packages/novel-workbench/package.json` as a **development dependency for types only** | MIT (both); no install lifecycle script | Types for the `@` trigger-source contract the workbench now implements. `novel-input-source.ts` registers one source adding a 人物与章节 group read from accepted Canon; the shipped pipeline still owns detection, the menu, keyboard arbitration and the insertion, so no input machine, queue or menu is added. The package is provided by the Host at runtime and is not bundled. Lockfile adds exactly one resolved entry, no removals, no version changes. |
| `@deepseek-ai/dsh-fs@0.1.2-rc.1`, `@deepseek-ai/dsh-sandbox-policy@0.1.2-rc.1` | DSH platform packages, pinned to the locked DSH version; declared in `packages/novel-project/package.json` | MIT (both); no install lifecycle script | Host seam for the editor's chapter draft files: `readChapterFile` / `writeChapterFile` on the existing `novelProject` Remote resolve a workspace-relative path through `ctx.fs` and write under a resolved sandbox policy, with `replaceIfVersion` guarding the write against an edit made outside the editor. Draft files are not Canon state — these methods advance nothing. Lockfile adds no resolution and removes none; both entries were already resolved in this tree at the same version. |
| `@deepseek-ai/dsh-llm@0.1.2-rc.1` | DSH platform package, pinned to the locked DSH version; already resolved in this tree and moved in `packages/novel-project/package.json` from a **development dependency to a runtime one** | MIT; no install lifecycle script; its dependencies (`zod`, `@deepseek-ai/schemastery` and five DSH packages) are all already resolved at the same versions | Host seam for the editor's sentence continuation: `completeSentence` on the existing `novelProject` Remote calls `ctx.llm.stream` with the requesting agent's own `provider`/`model`, one system prompt and no tools, and returns one sentence of text or the empty string. It is the narrowest model call in the product and writes nothing — a continuation is a decoration until the author's Tab turns it into draft text, and Canon still moves only through an accepted Result Packet. Lockfile adds no resolution and removes none; the importer entry only changes section. |

The exact dependency evaluation, artifact hashes, runtime cost and current test
boundary are recorded in
[the Chinese full-text retrieval evaluation](open-source-evaluations/chinese-full-text-retrieval.md).
The exact unified-Diff artifact, API, lifecycle-script and validation boundary
are recorded in
[the unified manuscript Diff evaluation](open-source-evaluations/unified-diff.md).
The exact document-writer APIs, artifact sizes, closure scan, rejected candidates
and publication boundary are recorded in
[the EPUB/DOCX export evaluation](open-source-evaluations/epub-docx-export.md).
The exact adopted/rejected Skill boundary and DSH seam are recorded in
[the Chinese web-novel Skill evaluation](open-source-evaluations/chinese-webnovel-skills.md).
The exact adopted research methods, rejected parallel tooling and current
runtime proof are recorded in
[the novel researcher method evaluation](open-source-evaluations/novel-researcher-methods.md).
The exact editor-stack license closure, install-script audit, transitive
versions and measured bundle cost are recorded in
[the editor stack evaluation](open-source-evaluations/editor-stack-2026-09-17.md).

## Explicitly retired local foundation

Electron `43.4.1`, Forge `7.11.2`, Vite `6.4.3`, Playwright Electron carrier
tests, custom origin, preload IPC and local packaging were evaluated for the
former self-built Desktop route. The former `desktop-workbench` and
`flexlayout-react` selection are superseded by the community Better Sidebar
composition and are absent from the current resolved lockfile. The former
aggregate Profile, local terminal/xterm pair, Better Sidebar Canon tab and Pi
TUI Canon footer are also retired. These components
are no longer adopted as novel-agent
runtime architecture. They must not be reintroduced as a normal host dependency
without a new user-directed decision; see
[the superseded foundation record](open-source-evaluations/electron-foundation.md).

## Checked evidence

- `git ls-remote --tags` returned the `v2.0.2` tag commit recorded above.
- The release-tag manifest reports Desktop `2.0.2` and the exact DSH
  `0.1.1-rc.2` packages named above.
- The npm registry reports only `0.0.1` and `2.0.0`, with latest `2.0.0`
  depending on `dsh-base@0.1.0-rc.6`.
- A HEAD request to the pinned setup URL resolved to the named Windows installer.
- An isolated local runtime smoke exercised the release EXE, linked Profile,
  HTTP endpoint, manifest, lifecycle and visible Desktop/Responding window.
- The same isolated host created a real Workspace and served
  `novelProject/open/current/projectCanon(0)` with HTTP `200`, rpcId echo and a
  consistent project/workspace identity.
- The visible community client reviewed and accepted a Result Packet R0→R1 and
  reconstructed its history/Canon after reload. The same historical run also
  exercised now-retired local terminal packages; that terminal result is not
  evidence for the current Better Sidebar or Pi TUI path.
- A historical dedicated aggregate Profile installed through the real DSH CLI;
  its successful `--dump-config` is not evidence for the current single-plugin
  no-wrapper composition.
- A separate fresh Profile installed `dsh-better-sidebar@0.16.1`; the initial
  add exited `1` at the native-build gate, the retry allowing only
  `node-pty@1.1.0` exited `0`, and `--dump-config` exited `0`. `pnpm peers
  check` exited `1` and is retained as a compatibility caveat.
- The DSH-managed Profile install/link logs report internal pnpm `11.19.0`.
  Repository `corepack pnpm install` is a separate outer operation pinned to
  pnpm `11.7.0`. The current repository lock contains no Better Sidebar
  importer or consumer; its dependency closure belongs to the isolated Profile.
- The corresponding visible smoke opened the English accessible `Files` tab,
  read the workspace tree and text file through HTTP `200`, retained the editor
  across reload, and recorded no console/page errors or unexpected failed
  requests. Two reload navigation aborts were classified separately as
  expected. Terminal and sidechat were disabled in that historical Profile;
  the current product does not preserve those overrides.
- A later single-plugin composition smoke used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-single-plugin-24a1442e00e2488d8af95f5d8eeb1360`.
  The Web Profile resolved Better Sidebar `0.16.1` and linked only
  `novel-project`; the root page and the two client artifacts returned HTTP
  `200`. The Pi Profile resolved Pi TUI `0.3.4`, linked only `novel-project`,
  mounted the four official DSH storage/workspace rows in its user Profile, and
  displayed the input-ready TUI shell. Web's full generic UI and Pi's
  novel-specific interactions were not exercised by that smoke.
- A separate File Upload smoke used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-dsh-file-upload-rc2-smoke-20260828-575bd2edfb4342c99cedaa83845afe6c`.
  The first add stopped at Pnpm's ignored-build gate for `sharp@0.34.5` and
  `tesseract.js@6.0.1`; the retry used DSH/Pnpm's documented
  `--allow-build=sharp --allow-build=tesseract.js` flags and exited `0`.
  `--dump-config` contained the `file-upload` loader. The real Host listened only
  on `127.0.0.1:3188`, returned HTTP `200` for `/` and
  `/plugins/dsh-file-upload/client.js?rev=7d2699585484`, then shut down with no
  listener remaining. Browser clicks, real Session upload and document
  conversion were not exercised.
- A real composition run then used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-file-upload-e2e-20260828-1905`.
  File Upload inserted `[file: uploaded-chapter.txt]` plus the exact TXT into the
  stock composer. The replay-backed stock Agent made one native
  `propose_novel_import` call; the existing Novel Project panel displayed the
  accepted-base Diff and one hash anchor while the head remained R0. Author
  Apply returned HTTP `200`, appended R1 with author authorization, and reload
  restored the exact text at `sourceRevision=1`. There were no page errors,
  failed requests or post-reload additions, but the upload moment recorded two
  console errors from File Upload's own `UploadDock` / `conversation.input.dock`
  reading `undefined.text`. The flow is retained as evidence with that upstream
  caveat; novel-agent adds no compatibility code.
- The EPUB/DOCX whole-book current-package load used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-whole-book-rc2-mtcxjbqy-f639ceec`.
  A fresh rc.2 Web Profile installed only the linked `novel-project`,
  `--dump-config` resolved its one row, the Host started on `127.0.0.1:52360`,
  and `/` returned 14,788 bytes while the 259,173-byte Novel Project client
  artifact also returned HTTP `200`. The Host then stopped, the port had zero
  listeners and a follow-up loopback request was refused. This verifies
  current package resolution/startup and that the Host-only document encoders
  did not enter the client artifact; the binary content path is covered by the
  in-process Tool/approval integration.
- A separate current-package stock-Web smoke used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-current-web-270cd52400ab417aa0682681e224b4c4`.
  It linked only `novel-project`, used `dsh-llm-replay@0.1.1-rc.2` solely as a
  no-credential fixture, and exercised R0→R1 narrative review, reload and the
  existing `conversation.view` panel. The first run captured 10 successful
  Novel Project RPCs and the post-build accessibility run captured 4 more, all
  HTTP `200`; both summaries report no console messages, page errors or failed
  requests. The final hierarchy capture is an ordinary list with no `tree`,
  `treeitem` or `aria-level` claim. This verifies the novel-domain view only;
  it does not verify generic community-plugin interactions or production use.
- The owner-scoped retrieval-Job Agent replay used
  `C:\Users\33166\AppData\Local\Temp\novel-agent-stock-agent-replay-20260827-1932`.
  Successful stock Web Session
  `session-c5048727-7feb-4c7f-a3e9-fc6000a0d33a` declares
  `agentPreset: "standard"`; its model emitted
  `rebuild_novel_index({"revision":1})`, the real tool returned
  `novel-index-1`, native `tool-jobs` reported `completed`, and the turn ended
  with reason `completed`. The Profile links only the replay fixture and
  `novel-project`, with no novel-agent Jobs controller. The matching real
  in-process Remote test verifies exact `ownerSession` and terminal wait;
  running-job kill and the in-flight stale branch remain outside this evidence.
- The eight-role stock-Web smoke used
  `C:\Users\33166\AppData\Local\Temp\novel-skill-eight-role-20260901-161000-01a05b3c`.
  The repository-local CLI reported `0.1.1-rc.2`; a newly initialized isolated
  Web Profile linked the current `novel-project` and loaded all eight roles in
  the slash catalog. `/novel-researcher` and
  `/novel-writing-memory-organizer` each injected a canonical body directly;
  replay-driven real Agent turns emitted the matching native `skill({ name })`
  calls and returned byte-identical bodies. All 80 observed same-origin
  responses were 2xx, with zero console errors/warnings, page errors, request
  failures or `novel/` Canon frames. Only stock `workspace.json` and
  `session_projcache.json` appeared under isolated storage, one Session
  persisted, the built package SHA-256 stayed
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`,
  and port `50845` had zero listeners after shutdown. Replay proves the real
  Agent/Tool/UI call path, not autonomous Skill selection by an external model.
- The continuable background role-composition GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-subagent-role-background-green4-20260901-174227-01a05b3c`.
  A Standard parent started one continuable child, which loaded
  `novel-writing-memory-organizer`, completed two read-only R1 retrievals and
  emitted two native reports. The first settlement preceded the parent's stock
  `send_message`, proving a cold second child turn; parent events arrived as
  `subagent-report → subagent-settled → subagent-report → subagent-settled` and
  the catalog exposed running → inactive. Stock Web showed both reports and
  settlements, the second-turn coordinator message and the child composer; both
  reports survived reload, while the child did not appear as a background Job.
  All 60 RPC and 59 Web API responses succeeded, browser failures, proposals,
  workflow events and post-baseline `novel/` frames were zero, accepted revision
  stayed R1, build/storage hashes were unchanged and shutdown left no listener.
  Its strict RED is retained at
  `C:\Users\33166\AppData\Local\Temp\novel-subagent-role-background-red2-20260901-173150-01a05b3c`;
  with both report calls disabled it failed only because zero of the expected two
  native reports arrived. This verifies only Standard parent → memory-organizer,
  not novel-role-to-role, other pairings or parallel/fault recovery; cross-Session
  product memory, production use and user acceptance remain outside this run.
- The two-process cross-Host/restart continuation GREEN used the fresh isolated
  root `C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-green2-20260901-190402-01a05b3c`
  and the controlled RED root
  `C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-red3-20260901-183831-01a05b3c`.
  Host 1 (`PID 22136`, `127.0.0.1:55235`) created the Standard parent
  `session-be372582-3af3-452c-b80c-a0fd6afc371a` and continuable child
  `1eb3b95b-3478-4a87-88ec-7c10d10f2908`, completed the first accepted-R1
  retrieval/report/settle, and was stopped by PTY `Ctrl+C`; the boundary recorder
  confirmed the exact process instance gone and two consecutive refused probes.
  Host 2 (`PID 39276`, `127.0.0.1:56818`) used the same DSH_HOME/Profile and
  workspace, exposed `parentAvailable=false` before exact-parent resume, then
  completed the second retrieval/report/settle through exactly one stock
  `send_message`. The final summary records one child with two completed turns,
  `report → settled → report → settled`, one durable coordinator relay whose
  `user/message` id/source/text matches the inbox insertion, strict phase-1
  prefixes for both raw `session.export` JSONL artifacts, unchanged R1/Canon/
  storage/build, zero browser/RPC failures, and zero listeners after both Host
  shutdowns. The RED removed only the second report and failed with
  `reports=1` while the child otherwise settled. This verifies only the
  Standard parent → memory-organizer pairing across Host restart; other role
  pairings, parallel/fault recovery, cross-Session product memory, production
  use and user acceptance remain unverified.
- The remaining five direct role invocations used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-five-role-green-20260901-221440-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-five-role-red-20260901-221311-01a05b3c`.
  A Standard stock-Web Session called each of
  `novel-hook-payoff-planner`, `novel-world-character-setting`,
  `novel-prose-writer`, `novel-continuity-checker` and `novel-reviewer` exactly
  once through the native `skill` Tool and received the matching canonical
  result; accepted Canon stayed at R1. The GREEN recorded 27 direct RPC and 23
  Web API responses, zero browser failures and zero `novel/` frames, and Host
  `PID 28616` on port `63906` left no listener after shutdown. The RED changed
  only the reviewer name to `missing-role` and failed the native-call assertion.
This verifies direct invocation only; role-to-role/pairing, parallel/fault
recovery, production and user acceptance remain unverified.
- The depth-two role-chain GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-role-chain-green4-20260901-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-role-chain-red3-20260901-01a05b3c`.
  A Standard parent started an outer one-shot `novel-architect` child; that
  child read accepted R1, passed `ARCHITECT_PLAN_R1` to an inner one-shot
  `novel-prose-writer` child, and received `INNER_PROSE_R1` through the same
  native `subagent` result path. `session.list` and the ZIP from
  `session.export?includeDescendants=true` showed three distinct sessions with
  parent/origin links and delegation depths 0, 1 and 2. The run recorded 27
  successful RPC and 23 successful Web API responses, zero browser failures,
  unchanged R1 Canon/storage and zero post-seed `novel/` frames; port `64142`
  had no listener after shutdown. The RED changed only the inner Skill name to
  `missing-role` and failed at the canonical prose Skill result assertion.
  This promotes one nested `novel-architect → novel-prose-writer` pairing;
  other role pairings, parallel/fault recovery, these roles' cross-Host
  continuation, production and user acceptance remain unverified.
- The parallel role fault-isolation GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-parallel-fault-green-20260901-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-parallel-fault-red5-20260901-01a05b3c`.
  One Standard parent emitted two foreground `subagent` calls in the same
  assistant step. The `novel-architect` child completed its R1 Skill/retrieval
  path while the sibling's `missing-role` Skill returned a native error result;
  that child still settled independently and the parent completed. Two
  inactive one-shot children, shared parent links, unchanged R1 Canon/storage,
  zero post-seed `novel/` frames, 24 successful RPC and 23 successful Web API
  responses, zero browser failures and a zero-listener shutdown on port `64148`
  were observed. The RED made both child Skills valid and failed because no
  error branch remained. This promotes only native Skill-tool sibling isolation;
  process/transport crash recovery, retry/cancel, continuable parallel work and
  other role pairings remain unverified.
- The existing-novel takeover GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-existing-novel-takeover-green-20260901-205410-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-existing-novel-takeover-red4-20260901-205238-01a05b3c`.
  In phase 1, a Workspace `existing-novel.md` was read by the stock Agent's
  `propose_novel_import` call through DSH fs, carrying normalized text, a strict
  `world` Delta, full-text SourceAnchor and provenance. The existing
  `conversation.view` displayed the manuscript, Diff, Delta, Anchor and pending
  authorization; the author applied it from R1 to R2. After a real Host stop/start,
  phase 2 created a new Session in the same Project, retrieved current R2 with
  anchored provenance, called `propose_novel_result_packet` for a second chapter,
  and applied it in the same panel to R3. Reload restored the exact manuscript,
  Delta, Anchor and producer. Host 1 (`PID 29208`, port `51887`) and Host 2
  (`PID 32584`, port `58567`) were distinct; both PTY shutdowns left zero
  listeners and both browser phases recorded zero console/page/request failures.
  The RED omitted only `existing-world-rule-r2` and failed at the strict proposal
  assertion. This verifies the same-work takeover and new-Session continuation,
  not EPUB/DOCX optional imports, other role pairings, parallel/fault recovery,
  the ten-chapter acceptance target, production use or user acceptance.
- The ten-chapter acceptance GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-ten-chapter-green3-20260901-215849-01a05b3c`
  and the controlled RED root
  `C:\Users\33166\AppData\Local\Temp\novel-ten-chapter-red-final-20260901-215159-01a05b3c`.
  The stock Web Profile seeded an original R1 Project brief, then completed ten
  real Agent turns. Each turn loaded `novel-prose-writer`, retrieved the current
  accepted revision, and submitted one authorization-free Result Packet with a
  complete Chapter contract and `chapter-state/post-check`; the existing review
  transaction accepted each packet through R11. Independent storage parsing
  found ten distinct Chapter manuscripts, each exactly 3000 visible characters
  (30000 total), with all ten post-check targets and no future chapter text in
  historical reads. The run recorded 110 direct RPC and 26 Web API responses,
  zero browser failures, zero post-seed `novel/` frames, and a zero-listener
  shutdown for Host `PID 25520`, port `64096`. The RED changed only Chapter 6 to
  2800 and failed the explicit `2800 !== 3000` length assertion. This verifies
  deterministic replay/transaction mechanics and the stated length/continuity
  contract, not external-model prose quality, repeated per-chapter visible panel
  interaction, production use or user acceptance.
- The fresh stock-Web Canon-only project-brief and strict style/reader-contract
  GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-n001-clean4-green-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-n001-clean4-red-20260902-01a05b3c`.
  R1 accepted the style and reader contracts without a manuscript; R2 added
  `chapter-brief` and source-bearing exemplar/reader-delivery evidence. One
  native `retrieve_novel_context` call with the requested `writingMemoryQuery`
  returned current R2 contracts, while historical R1 excluded the R2 evidence;
  the existing Canon panel rendered the contracts and evidence after reload.
  GREEN recorded 17 successful RPC and 59 successful Web API responses, zero
  browser failures, unchanged Canon/storage, root HTTP `200` and a zero-listener
  shutdown on port `64304`; the RED at `64303` rejected missing exemplar
  `purpose` and reader evidence `demonstrates`, keeping head R2 (11 RPC / 22
  Web API, browser failures 0). This promotes only the synthetic Canon-only
  brief and strict style/reader-contract path; external-model writing quality,
  complete multi-chapter authoring, production installation and user acceptance
  remain unverified. Exact hashes, screenshots, trace and claim boundary are in
  [`project-brief-style-reader-stock-web-e2e-2026-09-02.md`](project-brief-style-reader-stock-web-e2e-2026-09-02.md).
- The accepted-`chapterId` control-pack GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-control-pack-green3-20260901-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-control-pack-red-20260901-01a05b3c`.
  A stock Agent made one native `retrieve_novel_context` call for
  `chapter-control` at R1; the result returned the complete Book→Chapter
  scope and 2900–3100 Chapter contract while leaving the top-level narrative
  unit bucket empty. After reload the existing panel's Build Chapter control
  pack button rendered the same R1 contract. The run recorded 13 successful
  RPC and 59 successful Web API responses, zero browser failures, unchanged
  Canon/storage and no `novel/` frames; port `64152` had no listener after
  shutdown. The RED omitted only `chapterId` and failed at `controlPack.chapter`.
  This promotes the visible accepted-`chapterId` control-pack path; other
  writing-memory branches, production and user acceptance remain unverified.
- The strict Chapter-contract R1→R2 GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-chapter-contract-stock-web-green-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-chapter-contract-stock-web-red-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted a Book→Volume→Arc→Chapter hierarchy,
  updated a valid 2900–3100 `chapterContract` at R2 and retrieved it with the
  exact `chapterId` control-pack query. Generated Remote, historical/current
  `projectNarrative`, the existing control-pack panel and reload agreed. GREEN
  recorded 18 successful RPC and 67 Web API responses, zero browser failures,
  unchanged Canon/storage and a zero-listener shutdown on port `64331`; the RED
  rejected `lengthRange.max < min` and kept R1 unchanged (8 RPC / 21 Web API,
  browser failures 0). Exact artifacts and claim boundary are recorded in
  [`chapter-contract-stock-web-e2e-2026-09-02.md`](chapter-contract-stock-web-e2e-2026-09-02.md).
- The strict Chapter `post-check` source-join GREEN used the fresh isolated
  root
  `C:\Users\33166\AppData\Local\Temp\novel-chapter-postcheck-source-join-green-final5-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-chapter-postcheck-source-join-red-20260902-01a05b3c`.
  The stock Agent made one native retrieval at R3 with `compareRevision: 2`,
  `chapterId: "chapter-postcheck"`, `canonKind: "chapter-state"` and the
  source-join query. The current control pack resolved the R1 Chapter contract,
  R2 manuscript and R2 Promise debt transition and retained the R3 post-check;
  historical R2 omitted that resolution, while generated Remote,
  `projectNarrative`, the existing panel and reload agreed. GREEN recorded 23
  successful RPC and 63 successful Web API responses, zero browser failures,
  unchanged Canon/storage, no post-seed `novel/` frames and a zero-listener
  shutdown on port `64416`; root HTTP status was `200`. The RED omitted the
  debt Delta and failed at `0 !== 1` while retaining the accepted head (15 RPC /
  21 Web API, browser failures 0). Exact artifacts, hashes and claim boundary
  are recorded in
  [`chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md`](chapter-postcheck-source-join-stock-web-e2e-2026-09-02.md).
- The no-`chapterId` relationship/knowledge GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-rel-knowledge-green4-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-rel-knowledge-red3-20260902-01a05b3c`.
  The stock Agent made one native
  `retrieve_novel_context({ revision: 1, writingMemoryQuery: "回忆关系边界" })`
  call. Historical R1 returned one complete `alice<->bob` line with both
  directions and two character/reader knowledge boundaries, including their
  accepted fact fields, source ranges and provenance; R2's one-way rewrites
  and future-only subject were absent. The existing panel rendered the same
  selectors and restored them after reload. GREEN recorded 16 successful RPC
  and 65 successful Web API responses, zero browser failures, unchanged
  Canon/storage, no post-seed `novel/` frames and a zero-listener shutdown on
  port `64212`; root navigation was HTTP `200`. The RED omitted the R1 facts
  and failed at `relationshipCarryForward.length` (`0 !== 1`). The compact
  native result was 27,621 UTF-8 bytes and did not hit the stock spill limit.
  Exact screenshots, trace, summaries and claim boundary are recorded in
  [`writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md`](writing-memory-relationship-knowledge-stock-web-e2e-2026-09-02.md).
- The no-`chapterId` hydrated-evidence GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-evidence-green2-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-evidence-red2-20260902-01a05b3c`.
  The stock Agent made one native retrieval at R1 while head R2. The R1 style
  exemplar and reader-contract evidence hydrated to the exact accepted
  manuscript excerpt, purpose/demonstrates, source ranges and provenance; the
  R2-only evidence id was absent. The existing panel rendered both evidence
  selectors and restored them after reload. GREEN recorded 20 successful RPC
  and 65 successful Web API responses, zero browser failures, unchanged
  Canon/storage, no post-seed `novel/` frames and a zero-listener shutdown on
  port `61514`; root navigation was HTTP `200`. The RED retained the contract
  but left `evidence: []` and failed at `readerContract.evidence.length`
  (`0 !== 1`). The native result was 48,277 UTF-8 bytes and stayed below the
  50,000-byte spill cap. Exact artifacts and claim boundary are recorded in
  [`writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md`](writing-memory-hydrated-evidence-stock-web-e2e-2026-09-02.md).
- The no-`chapterId` rolling-roadmap GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-roadmap-green6-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-roadmap-red4-20260902-01a05b3c`.
  The stock Agent made one native retrieval at R1 while head R2. Historical R1
  returned one versioned `roadmap-main` with two ordered Chapter units, a
  resolved dependency and an open resolved `debt-lighthouse`; the R2 future
  route and debt were absent. The existing roadmap row rendered both units and
  restored them after reload. GREEN recorded 19 successful RPC and 66
  successful Web API responses, zero browser failures, unchanged Canon/storage,
  no post-seed `novel/` frames and a zero-listener shutdown on port `64228`;
  root navigation was HTTP `200`. The RED omitted the R1 roadmap/debt and
  failed at `writingMemory.roadmaps.length` (`0 !== 1`). The compact native
  result was 30,759 UTF-8 bytes and did not hit the stock spill limit. Exact
  artifacts and claim boundary are recorded in
  [`writing-memory-roadmap-stock-web-e2e-2026-09-02.md`](writing-memory-roadmap-stock-web-e2e-2026-09-02.md).
- The no-`chapterId` query-independent character-arc GREEN used the fresh
  isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-arc-stock-web-green3-fce0f099b1e24376818e73b2aa042b11`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-arc-stock-web-red-ff31a69fbb37435ba27fa5c0e17ee2c1`.
  The stock Agent made one native retrieval with R2, `compareRevision: 1`,
  `characterTrajectoryId: "shen-yan"` and an unrelated writing-memory query.
  The current writing-memory arc bucket returned the complete v2 hypothesis
  and decision; historical R1 returned v1 with no decision, a second unrelated
  query was equal, and the existing writing-memory/trajectory panel restored
  both views after reload. GREEN recorded 21 successful RPC and 67 Web API
  responses, zero browser failures, unchanged Canon/storage, no post-seed
  `novel/` frames and root HTTP `200`; port `64324` had no listener after
  shutdown. The RED omitted `persistentConsequence` and kept R2 unchanged
  (14 RPC / 21 Web API, browser failures 0). Exact artifacts and claim
  boundary are recorded in
  [`writing-memory-character-arc-stock-web-e2e-2026-09-02.md`](writing-memory-character-arc-stock-web-e2e-2026-09-02.md).
- The no-`chapterId` query-independent character carry-forward GREEN used the
  fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-character-carry-forward-stock-web-green3-20260902-01a05b3c`
  with the focused RED at
  `C:\Users\33166\AppData\Local\Temp\novel-writing-memory-character-carry-forward-stock-web-red2-20260902-01a05b3c`.
  The stock Agent made one native retrieval at R2 with `compareRevision: 1`,
  `characterTrajectoryId: "shen-yan"` and an unrelated writing-memory query.
  The result returned the accepted R1 Chapter post-check carry values with
  their Chapter, revision, Delta, Anchor range and provenance; historical R1
  excluded the unrelated R2 event, a second unrelated query and generated
  Remote agreed, and the existing writing-memory/trajectory panel restored the
  same item after reload. GREEN recorded 20 successful RPC and 68 successful
  Web API responses, zero browser failures, unchanged Canon/storage, no
  post-seed `novel/` frames and a zero-listener shutdown on port `64343`; root
  HTTP status was `200`. The RED failed at the empty carry-forward assertion
  (`0 !== 1`) while retaining R2 (11 RPC / 22 Web API, browser failures 0).
  Exact artifacts, hashes and claim boundary are recorded in
  [`writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md`](writing-memory-character-carry-forward-stock-web-e2e-2026-09-02.md).
- The strict `clue/state` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-clue-state-stock-web-green-final-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-clue-state-stock-web-red-final-20260902-01a05b3c`.
  A fresh stock-Web Profile advanced one accepted foreshadowing from planted
  R1 to typed paid-off R2 and made one native retrieval with
  `clueLifecycleId: "clue-moon-seal"` and `compareRevision: 1`.
  Historical/current Tool and generated Remote results, `projectNarrative`,
  the existing clue panel and reload agreed; the typed aftermath and complete
  source chain were retained. GREEN recorded 22 successful RPC and 67
  successful Web API responses, zero browser failures, unchanged Canon/storage
  and a zero-listener shutdown on port `64321`; the RED omitted
  `payoff.aftermath`, failed atomically and retained R2 (14 RPC / 21 Web API,
  browser failures 0). Exact artifacts and claim boundary are recorded in
  [`clue-state-stock-web-e2e-2026-09-02.md`](clue-state-stock-web-e2e-2026-09-02.md).
- The strict `mystery/state` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-mystery-state-stock-web-green-20260902-01a05b3c-v3`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-mystery-state-stock-web-red-20260902-01a05b3c-v3`.
  A fresh stock-Web Profile accepted R1 author-unknown and R2 author-known
  `mystery-moon-record` states, linked red-herring/foreshadowing evidence, and
  made one native retrieval with `mysteryLifecycleId` and `compareRevision`.
  Historical/current lifecycle reads, linked clue evidence, generated Remote,
  `projectNarrative`, the existing Mystery/Clue panel and reload agreed. GREEN
  recorded 22 successful RPC and 60 successful Web API responses, zero browser
  failures, unchanged Canon/storage, no post-seed `novel/` frames and a
  zero-listener shutdown on port `64463`; the RED rejected an author-unknown
  truth carrying an answer and retained R2 (14 RPC / 21 Web API, browser
  failures 0). Exact artifacts, hashes and claim boundary are recorded in
  [`mystery-state-stock-web-e2e-2026-09-02.md`](mystery-state-stock-web-e2e-2026-09-02.md).
- The strict `knowledge/state` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-knowledge-state-stock-web-green-final-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-knowledge-state-stock-web-red-final-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted separate `alice` character and
  `reader-main` reader knowledge states at R1, updated them at R2, and made one
  native retrieval with `knowledgeSubjectId: "alice"` and `compareRevision: 1`.
  Current/historical Knowledge boundary results, generated Remote, existing
  panel and reload agreed; GREEN recorded 17 successful RPC and 67 Web API
  responses, zero browser failures, unchanged Canon/storage and a zero-listener
  shutdown on port `64341`. The RED omitted `access.unitId`, returned the
  strict error and kept R1 unchanged (8 RPC / 22 Web API, browser failures 0).
  Exact artifacts and claim boundary are recorded in
  [`knowledge-state-stock-web-e2e-2026-09-02.md`](knowledge-state-stock-web-e2e-2026-09-02.md).
- The fresh stock-Web story-world SimulationRun GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-green4-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-story-world-stock-web-red2-20260902-01a05b3c`.
  A stock Standard Session made one native `simulate_novel_story_world` call
  at accepted R1. The existing `conversation.view` rendered the typed single
  `observe` trace, replay identity, Before/After/Final state and provenance,
  then restored the same run after reload. GREEN recorded 18 successful RPC
  and 63 successful Web API responses, zero browser failures, unchanged
  Canon/storage, zero post-seed `novel/` frames and root HTTP `200`; port
  `64248` had no listener after shutdown. The RED used an unmet typed
  precondition and asserted `expected "北岸", received "旧庭"` with R1
  unchanged. This promotes only single visible action/UI plumbing and typed
  projection, not child-isolation/disposal, model determinism, comparison
  experiments, reader-response comparison UI, production or user acceptance. Exact
  hashes, screenshots, trace and claim boundary are in
  [`story-world-simulation-stock-web-e2e-2026-09-02.md`](story-world-simulation-stock-web-e2e-2026-09-02.md).
- The fresh stock-Web reader-response SimulationRun GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-green-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-reader-response-stock-web-red-20260902-01a05b3c`.
  A stock Standard Session made one native `simulate_novel_reader_response`
  call at accepted R1. The existing `conversation.view` rendered the Persona,
  accepted presented-text source/hash, reading history, typed reaction evidence,
  synthetic-only label and provenance, then restored the same run after reload.
  GREEN recorded 18 successful RPC and 63 successful Web API responses, zero
  browser failures, unchanged Canon/storage, zero post-seed `novel/` frames and
  root HTTP `200`; port `64252` had no listener after shutdown. The RED supplied
  an evidence span absent from the presented text and asserted the native error
  with R1 unchanged. This promotes only single visible accepted-text
  reader-response plumbing and typed evidence, not child isolation, model
  determinism, multi-seed/candidate/Persona/variant comparisons, process
  recovery, production or user acceptance. Exact hashes, screenshots, trace and
  claim boundary are in
  [`reader-response-simulation-stock-web-e2e-2026-09-02.md`](reader-response-simulation-stock-web-e2e-2026-09-02.md).
- The strict mystery clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-mystery-clock-stock-web-green2-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-mystery-clock-stock-web-red-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted four ordered R1 mystery moves and an
  open debt, then added partial-reveal, reveal and recontextualize at R2. One
  native `retrieve_novel_context` call with `compareRevision: 1` matched the
  selected generated-Remote hits/impact and historical/current
  `projectNarrative`; the existing Narrative clocks area rendered all seven
  moves and restored them after reload. GREEN recorded 18 successful RPC and
  87 Web API responses, zero browser failures, unchanged Canon/storage, zero
  post-seed `novel/` frames and root HTTP `200`; port `64272` had no listener
  after shutdown. The RED rejected a duplicate `moveId` and kept R1 unchanged
  (8 RPC / 22 Web API, browser failures 0). Exact hashes, screenshots, trace
  and claim boundary are in
  [`mystery-clock-stock-web-e2e-2026-09-02.md`](mystery-clock-stock-web-e2e-2026-09-02.md).
- The strict character pacing-clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-character-clock-stock-web-green4-20260902-01a05b3c`
  with the clean controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-character-clock-stock-web-red3-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted R1 pressure/hold and R2
  decision/consequence/commitment/transformation/hold moves with real
  character and story-event references. One native retrieval with
  `compareRevision: 1` matched the generated Remote and historical/current
  `projectNarrative`; the existing Narrative clocks area rendered all seven
  moves and restored them after reload. GREEN recorded 19 successful RPC and 57
  Web API responses, zero browser failures, unchanged Canon/storage, zero
  post-seed `novel/` frames and root HTTP `200`; port `64284` had no listener
  after shutdown. The RED rejected a duplicate `moveId` and kept R1 unchanged
  (8 RPC / 22 Web API, browser failures 0). Exact hashes, screenshots, trace
  and claim boundary are in
  [`character-clock-stock-web-e2e-2026-09-02.md`](character-clock-stock-web-e2e-2026-09-02.md).
- The strict `character-state/arc-hypothesis` trajectory GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-character-arc-trajectory-green5-20260902-arcsmoke-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-character-arc-trajectory-red2-20260902-arcsmoke-01a05b3c`.
  A fresh stock-Web Profile accepted a v1 hypothesis with no decisions at R1,
  then a v2 hypothesis with one complete costly decision at R2. The native
  `retrieve_novel_context` call used
  `{"revision":2,"compareRevision":1,"characterTrajectoryId":"shen-yan"}`;
  generated Remote historical/current reads, accepted Delta/Anchor/provenance
  evidence, the existing trajectory panel and renderer reload all agreed. GREEN
  recorded 20 successful RPC and 68 Web API responses, zero browser failures,
  unchanged Canon/storage, zero post-seed `novel/` frames and root HTTP `200`;
  port `64308` had no listener after shutdown. The RED omitted
  `persistentConsequence`, returned `result.ok: false`, kept R2 and preserved
  both hashes (14 RPC / 21 Web API, browser failures 0). Exact hashes,
  screenshots, trace and claim boundary are in
  [`character-arc-trajectory-stock-web-e2e-2026-09-02.md`](character-arc-trajectory-stock-web-e2e-2026-09-02.md).
- The strict Promise clock/lifecycle GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-promise-clock-stock-web-green2-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-promise-clock-stock-web-red-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted an open R1 Promise, debt and
  open→remind→hold pacing, then one atomic R2 packet retired the Promise/debt
  and added partial-payoff→payoff→retire. One native retrieval, lifecycle
  Remote, `projectNarrative`, Promise/Narrative clocks UI and reload agreed on
  the source metadata and state change. GREEN recorded 20 successful RPC and 88
  Web API responses, zero browser failures, unchanged Canon/storage, zero
  post-seed `novel/` frames and root HTTP `200`; port `64285` had no listener
  after shutdown. The RED rejected a duplicate `moveId` and kept R1 unchanged
  (8 RPC / 20 Web API, browser failures 0). Exact hashes, screenshots, trace
  and claim boundary are in
  [`promise-clock-stock-web-e2e-2026-09-02.md`](promise-clock-stock-web-e2e-2026-09-02.md).
- The strict progression clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-progression-clock-stock-web-green-clean3-20260902-01a05b3c`
  with the clean controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-progression-clock-stock-web-red-clean-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted an R1 setup/hold main track with
  advancement and Promise references, then moved it at R2 to
  apply-consequence with delivered readiness and a missing-cost drift warning.
  One native `retrieve_novel_context` call with `compareRevision: 1` matched
  the generated Remote and historical/current `projectNarrative`; the existing
  Narrative clocks area rendered the track, warning and source metadata and
  restored R2 after reload. GREEN recorded 18 successful RPC and 87 Web API
  responses, zero browser failures, unchanged Canon/storage, zero post-seed
  `novel/` frames and root HTTP `200`; port `64282` had no listener after
  shutdown. The RED rejected an advance with no advancement id and kept R1
  unchanged (8 RPC / 22 Web API, browser failures 0). Exact hashes,
  screenshots, trace and claim boundary are in
  [`progression-clock-stock-web-e2e-2026-09-02.md`](progression-clock-stock-web-e2e-2026-09-02.md).
- The strict tension-payoff clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-tension-payoff-clock-stock-web-green2-20260902-01a05b3c`
  with the valid controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-tension-payoff-clock-stock-web-red2-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted two overlapping R1 waves, then advanced
  only the pursuit wave at R2 to peak/full release and occurred recovery while
  the relationship aftershock remained ongoing. One native
  `retrieve_novel_context` call with `compareRevision: 1` matched the selected
  generated-Remote hit/impact and historical/current `projectNarrative`; the
  existing Narrative clocks area rendered intensity, duration, release,
  recovery and scene functions and restored both waves after reload. GREEN
  recorded 18 successful RPC and 87 Web API responses, zero browser failures,
  unchanged Canon/storage, zero post-seed `novel/` frames and root HTTP `200`;
  port `64276` had no listener after shutdown. The RED intentionally omitted
  `release.aftermath` and was rejected at the generic Typert command boundary
  with R1 unchanged (8 RPC / 22 Web API, browser failures 0). Exact hashes,
  screenshots, trace and claim boundary are in
  [`tension-payoff-clock-stock-web-e2e-2026-09-02.md`](tension-payoff-clock-stock-web-e2e-2026-09-02.md).
- The strict reader-knowledge clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-reader-knowledge-clock-stock-web-green4-20260902-01a05b3c`
  with the clean controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-reader-knowledge-clock-stock-web-red4-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted a Chapter-scoped R1 value with five
  anchored disclosure event kinds, then an R2 nested-event/policy update. One
  native `retrieve_novel_context` call matched the generated Remote and
  historical/current `projectNarrative`; the existing Narrative clocks area
  rendered all five events and restored them after reload. GREEN recorded 19
  successful RPC and 64 Web API responses, zero browser failures, unchanged
  Canon/storage, zero post-seed `novel/` frames and root HTTP `200`; port
  `64273` had no listener after shutdown. The RED rejected an empty nested
  Anchor list and kept R2 unchanged (10 RPC / 22 Web API, browser failures 0).
  Exact hashes, screenshots, trace and claim boundary are in
  [`reader-knowledge-clock-stock-web-e2e-2026-09-02.md`](reader-knowledge-clock-stock-web-e2e-2026-09-02.md).
- The strict Plot clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-plot-clock-stock-web-green2-20260902-01a05b3c`
  with the clean controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-plot-clock-stock-web-red4-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted an R1 `book-main` plot line with
  obstacle→choice and an open debt, then an R2 consequence→reversal update.
  One native `retrieve_novel_context` call with `compareRevision: 1` matched
  the generated Remote and historical/current `projectNarrative`; the existing
  Narrative clocks area rendered four turns, source metadata and debt and
  restored R2 after reload. GREEN recorded 18 successful RPC and 65 Web API
  responses, zero browser failures, unchanged Canon/storage, zero post-seed
  `novel/` frames and root HTTP `200`; port `64264` had no listener after
  shutdown. The RED rejected a strict plot value with no source anchor and
  kept R1 unchanged (7 RPC / 22 Web API, browser failures 0). Exact hashes,
  screenshots, trace and claim boundary are in
  [`plot-clock-stock-web-e2e-2026-09-02.md`](plot-clock-stock-web-e2e-2026-09-02.md).
- The strict relationship line-state GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-relationship-line-state-stock-web-green7-20260902-01a05b3c`
  with the clean controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-relationship-line-state-stock-web-red3-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted independent alice→bob and bob→alice R1
  states, advanced only alice→bob at R2, and made one native
  `retrieve_novel_context` call with historical/current comparison. The
  existing relationship and relationship-clock views rendered both strict
  directions, source metadata, turns, debts and consequences, and restored
  them after reload. GREEN recorded 21 successful RPC and 64 Web API
  responses, zero browser failures, unchanged Canon/storage, zero post-seed
  `novel/` frames and root HTTP `200`; port `64267` had no listener after
  shutdown. The RED rejected only a missing `persistentConsequence` at R3 with
  R2 unchanged (10 RPC / 21 Web API, browser failures 0). Exact hashes,
  screenshots, trace and claim boundary are in
  [`relationship-line-state-stock-web-e2e-2026-09-02.md`](relationship-line-state-stock-web-e2e-2026-09-02.md).
- The strict relationship pacing-clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-relationship-clock-stock-web-green-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-relationship-clock-stock-web-red-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted one R1 `volume-old-court` alliance move,
  then an R2 sacrifice move naming the stable pair, directional target,
  story-event id and emotion-episode id. One native retrieval, generated
  Remote, `projectNarrative` and the existing Narrative clocks/relationship
  panel agreed on historical/current values and source metadata; reload restored
  both moves and the independent A→B v2/B→A v1 line states. GREEN recorded 22
  successful RPC and 64 successful Web API responses, zero browser failures,
  unchanged Canon/storage, zero post-seed `novel/` frames and a zero-listener
  shutdown on port `64287`; the RED at `64286` rejected a duplicate `moveId`
  with R2 unchanged (10 RPC / 21 Web API, browser failures 0). This promotes
  only the strict pacing-clock projection and existing panel path for the
  synthetic fixture; broader relationship semantics, process/transport recovery,
  production and user acceptance remain unverified.
  Exact hashes, screenshots, trace and claim boundary are in
  [`relationship-clock-stock-web-e2e-2026-09-02.md`](relationship-clock-stock-web-e2e-2026-09-02.md).
- The strict ending closure-clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-ending-clock-stock-web-green4-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-ending-clock-stock-web-red2-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted a Book-scoped ending hypothesis, two
  acyclic debts and `converge → hold` at R1, then an atomic R2 update changed
  the hypothesis and one debt and advanced the clock to
  `resolve → aftermath → hold`. Native retrieval, generated Remote, closure
  query, `projectNarrative`, Ending/Narrative clocks and closure ledger agreed;
  the existing panel restored the three moves, hypothesis and dependency rows
  after reload. GREEN recorded 20 successful RPC and 89 successful Web API
  responses, zero browser failures, unchanged Canon/storage, zero post-seed
  `novel/` frames and root HTTP `200`; port `64293` had no listener after
  shutdown. The RED at `64292` rejected a duplicate `moveId` and kept head R2
  unchanged (10 RPC / 21 Web API, browser failures 0). This promotes only the
  strict Ending clock and Book closure path for the synthetic fixture; broader
  ending semantics, process/transport recovery, production and user acceptance
  remain unverified.
  Exact hashes, screenshots, trace and claim boundary are in
  [`ending-clock-stock-web-e2e-2026-09-02.md`](ending-clock-stock-web-e2e-2026-09-02.md).
- The strict World reference-clock GREEN used
  `C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-green3-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-world-clock-stock-web-red-20260902-01a05b3c`.
  A fresh stock-Web Profile accepted a Book→Volume→Arc→Chapter hierarchy,
  typed world-rule and faction/location/object continuity facts, and three R1
  reference-bearing moves; R2 updated all four fact families and added a fourth
  move. Native retrieval, generated Remote, `projectNarrative`, typed ledgers,
  Narrative clocks and the existing panel agreed on historical/current values
  and source metadata, and reload restored the world clock and references.
  GREEN recorded 20 successful RPC and 86 successful Web API responses, zero
  browser failures, unchanged Canon/storage, zero post-seed `novel/` frames and
  root HTTP `200`; port `64297` had no listener after shutdown. The RED at
  `64294` rejected a duplicate `moveId` and kept head R2 unchanged (10 RPC /
  22 Web API, browser failures 0). This promotes only the strict World
  reference-clock projection and existing ledger/panel path for the synthetic
  fixture; cross-Canon existence validation, broader world simulation
  semantics, process/transport recovery, production and user acceptance remain
  unverified. Exact hashes, screenshots, trace and claim boundary are in
  [`world-clock-stock-web-e2e-2026-09-02.md`](world-clock-stock-web-e2e-2026-09-02.md).
- The typed `progression.advancement` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-progression-ledger-stock-web-green3-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-progression-ledger-stock-web-red3-20260902-01a05b3c`.
  A stock Agent made one native `progressionCharacterId: "shen-yan"` retrieval;
  the typed R1/R2 ledger, historical/current isolation, generated Remote,
  `projectNarrative`, selector/panel and reload agreed. GREEN recorded 19
  successful RPC and 81 successful Web API responses, zero browser failures,
  unchanged Canon/storage and a zero-listener shutdown on port `64362`; the RED
  rejected a malformed advancement value and kept R1 (8 RPC / 21 Web API).
  Exact artifacts, hashes and claim boundary are recorded in
  [`progression-ledger-stock-web-e2e-2026-09-02.md`](progression-ledger-stock-web-e2e-2026-09-02.md).
- The typed `faction-state/continuity` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-faction-state-stock-web-green-20260902-final-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-faction-state-stock-web-red-20260902-final-01a05b3c`.
  A stock Agent made one native `factionId: "moon-council"` retrieval; the
  typed R1/R2 ledger, historical/current isolation, generated Remote,
  `projectNarrative`, selector/panel and reload agreed. GREEN recorded 20
  successful RPC and 89 successful Web API responses, zero browser failures,
  unchanged Canon/storage and a zero-listener shutdown on port `64531`; the
  RED rejected a missing `offscreenConsequence` at the Result Packet boundary
  and kept R2 (12 RPC / 22 Web API). Exact artifacts, hashes and claim boundary
  are recorded in
  [`faction-state-stock-web-e2e-2026-09-02.md`](faction-state-stock-web-e2e-2026-09-02.md).
- The typed `location-state/continuity` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-location-state-stock-web-green4-20260902-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-location-state-stock-web-red3-20260902-01a05b3c`.
  A stock Agent made one native `locationId: "lighthouse"` retrieval; the
  typed R1/R2 ledger, historical/current isolation, generated Remote,
  `projectNarrative`, selector/panel and reload agreed. GREEN recorded 20
  successful RPC and 88 successful Web API responses, zero browser failures,
  unchanged Canon/storage, no post-seed `novel/` frames and a zero-listener
  shutdown on port `64541`; the RED rejected a missing `consequence` at the
  Result Packet boundary and kept R2 (12 RPC / 22 Web API). Exact artifacts,
  hashes and claim boundary are recorded in
  [`location-state-stock-web-e2e-2026-09-02.md`](location-state-stock-web-e2e-2026-09-02.md).
- The typed `object-state/continuity` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-object-state-stock-web-green2-20260903-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-object-state-stock-web-red2-20260903-01a05b3c`.
  A stock Agent made one native `objectId: "tide-key"` retrieval; the typed
  R1/R2 ledger, historical/current isolation, generated Remote,
  `projectNarrative`, selector/panel and reload agreed. GREEN recorded 20
  successful RPC and 90 successful Web API responses, zero browser failures,
  unchanged Canon/storage, no post-seed `novel/` frames and a zero-listener
  shutdown on port `64373`; the RED rejected a missing `consequence` at the
  Result Packet boundary and kept R2 (9 RPC / 21 Web API). Exact artifacts,
  hashes and claim boundary are recorded in
  [`object-state-stock-web-e2e-2026-09-03.md`](object-state-stock-web-e2e-2026-09-03.md).
- The typed `emotion-state/episode` GREEN used the fresh isolated root
  `C:\Users\33166\AppData\Local\Temp\novel-emotion-state-stock-web-green-final3-20260903-01a05b3c`
  with the controlled RED at
  `C:\Users\33166\AppData\Local\Temp\novel-emotion-state-stock-web-red-final-20260903-01a05b3c`.
  A stock Agent made one native `emotionCharacterId: "shen-yan"` retrieval;
  the typed R1/R2 ledger, historical/current isolation, character/legacy
  filtering, generated Remote, `projectNarrative`, selector/panel and reload
  agreed. GREEN recorded 21 successful RPC and 89 successful Web API responses,
  zero browser failures, unchanged Canon/storage, no post-seed `novel/` frames
  and a zero-listener shutdown on port `64613`; the RED rejected a missing
  `downstreamChoices` at the Result Packet boundary and kept R1 (10 RPC / 22 Web
  API). Exact artifacts, hashes and claim boundary are recorded in
  [`emotion-state-stock-web-e2e-2026-09-03.md`](emotion-state-stock-web-e2e-2026-09-03.md).

- The real-model first-Chapter run restored the isolated
  `novel-external-chapter-green-20260903-01a05b3c` Profile. The native writer
  and writing-memory-organizer produced real proposals; author review accepted
  the contract as R2, a 3,087-character manuscript as R3 and sourced post-check
  as R4. The same Profile then accepted Chapter 2 as R5/R6/R8, Chapter 3 as
  R9/R10/R12 (3,002 visible characters), Chapter 4 as R13/R14/R15
  (3,005 visible characters), and Chapter 5 as R16/R17/R18
  (3,100 visible characters), after recording schema rejection/retry evidence
  and provenance corrections.
  The model-facing retrieval preview was truncated by
  the stock output policy; the novel panel now reconstructs the original
  requested revision via its existing Remote. Exact Session ids, hashes and
  limitations are in [the 2026-09-05 record](external-model-chapter-repair-2026-09-05.md).

No installer is redistributed by this repository. If a later novel-agent
distribution bundles any part of the host, add the full resolved notice payload
and exact distribution evidence before doing so.
