# Third-party notices

**Inventory date:** 2026-09-09

**Scope:** the adopted community DSH Desktop host and novel-agent plugin
components. `novel-agent` itself remains `UNLICENSED`; that does not alter any
third-party license.

The [Writing I/O migration](docs/writing-io-migration-2026-09-09.md) transfers existing
diff 9.0.0 (BSD-3-Clause), docx 9.7.1 (MIT), fflate 0.8.3 (MIT) and DSH FS/sandbox-policy
rc.1 (MIT) production dependencies from Core to Writing; Core retains test dependencies.
Writing also declares already-resolved DSH Agent/util-values rc.1 and Zod 4.4.3 (MIT).
Tools remains a Host peer. No new resolved version, asset or upstream code is introduced.

The [retrieval migration](docs/memory-retrieval-migration-2026-09-09.md) transfers
MiniSearch 7.2.0 and Jieba 2.0.2 production ownership to Memory and declares the
existing DSH Agent/Jobs/Session rc.1 and Zod 4.4.3 there. All retain their existing
MIT licenses; there is no new resolved version or install lifecycle script. Core
keeps DSH Jobs as a test dependency. Memory's Tools dependency is a Host peer.

The [Memory graph migration](docs/memory-graph-migration-2026-09-09.md) relocates
project-authored graph, causal-path and knowledge-boundary code. It reuses the
existing Node crypto and DSH `dsh-util-values@0.1.2-rc.1` (MIT) APIs. No new
third-party package, version, asset or copied upstream implementation is added;
the lockfile is unchanged.

The [Memory projection migration](docs/memory-projection-migration-2026-09-09.md)
moves project-authored relationship and Chapter-context calculation into Memory.
It adds a direct declaration of the already-resolved `dsh-util-values@0.1.2-rc.1`
(MIT). Cordis 4.0.2 lifetime handling and Node's crypto library are reused.
There is no new resolved third-party version, copied upstream implementation or DSH patch.

The [Review execution migration](docs/review-engine-migration-2026-09-09.md) reuses
existing DSH `0.1.2-rc.1` Services/Subagents (MIT), `diff@9.0.0` (BSD-3-Clause),
and `zod@4.4.3` (MIT). Core and Review declare DSH Tools as a Host peer with the
same version as a development dependency. No new resolved package version, asset,
copied upstream implementation or additional DSH patch is introduced.

The [prompt ownership migration](docs/domain-prompt-migration-2026-09-09.md) directly
reuses the already-resolved `@deepseek-ai/dsh-system-prompt@0.1.2-rc.1` (MIT).
The project-authored instruction paragraphs were reassigned without copying DSH's
prompt assembly or reload implementation. No new third-party version or asset is added.

The [domain-role migration](docs/domain-role-migration-2026-09-09.md) moves existing
project-authored Skills into private `novel-memory` and `novel-review` packages
(`UNLICENSED`). Their Cordis/DSH dependencies reuse the already adopted exact versions
and MIT licenses; no third-party code or new version is added. Core keeps SkillRegistry
only as a development/test dependency after its role registrations are removed.

The [Planning role ownership migration](docs/planning-skill-ownership-2026-09-09.md)
moves existing project-authored Skills into `@novel-agent/novel-planning` (`UNLICENSED`).
It directly reuses the already adopted Cordis `4.0.2` and DSH SkillRegistry
`0.1.2-rc.1` (MIT), with no added third-party package version or copied upstream code.
The existing local DSH Session patch and its MIT notice remain applicable.

The [Writing dependency slice](docs/writing-planning-seam-2026-09-09.md) also moves
the project-authored prose Skill into `@novel-agent/novel-writing` (`UNLICENSED`).
Planning directly declares the already resolved DSH Workspace `0.1.2-rc.1` (MIT)
for its public service type. Cordis Service is reused unchanged; no new third-party
version, asset or upstream implementation is copied.

The [projection migration](docs/planning-projection-migration-2026-09-09.md) moves
existing project-authored narrative code into Planning and directly reuses
`@deepseek-ai/dsh-util-values@0.1.2-rc.1` (MIT) for `deepFreeze`.
That version was already resolved; no new third-party version or copied DSH implementation is added.

This is a source/notice index, not a claim that this repository redistributes
the community Desktop installer. A future distribution that bundles host or
resolved package artifacts must include the complete license/NOTICE payload from
that exact distribution.

## Historical external Desktop host

The current product baseline is official DSH `0.1.2-rc.1` (MIT), selected by the
user and validated to the boundaries in the [adoption record](docs/open-source-evaluations/dsh-0.1.2-rc.1-adoption-2026-09-08.md).
The Desktop 2.0.2 / rc.2 pairing below records the earlier adoption; its evidence
does not cover the current rc.1 baseline. Desktop 2.0.5 has not been installed here.

| Component | Exact source | Use | License |
| --- | --- | --- | --- |
| DSH Desktop | [GitHub Release `v2.0.2`](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/tag/v2.0.2), tag `9d18856ddea4f20eb3ef8c88b0436921c6b19606`, [Windows x64 installer](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/download/v2.0.2/DSH-Desktop-2.0.2-x64-Setup.exe) | Direct installed host: Electron/window/tray/Profile/native terminal/diagnostics/notifications/updates/market. Not copied or rebuilt by novel-agent. | MIT |
| DeepSeek Harness | Exact `0.1.1-rc.2` host packages **of that earlier pairing**, including `dsh-base`, `dsh-web-app` and `dsh-host-webserver` | DSH core and normal loopback Web carrier **of that earlier pairing only**. The current baseline resolves to `0.1.2-rc.1`; see the note above and the retained plugin dependency line below. | MIT |

### DSH Desktop `v2.0.2`

> Copyright (c) 2026 Anywhere Labs

License: MIT. The upstream project license requires this copyright and permission
notice to accompany copies or substantial portions. This repository only records
the use of the separately installed host; it does not copy its source, icons,
logos, themes or installer payload.

## Retained novel-agent plugin dependency line

The user-authorized local Session recovery patch is derived from
`@deepseek-ai/dsh-session@0.1.2-rc.1`, Copyright (c) 2026 DeepSeek, MIT.
The original notice is retained in [patches/LICENSE.deepseek](patches/LICENSE.deepseek).
[Patch scope and deployment](patches/README.md) identify the three published files
changed; no reader, Agent Loop or reference checkout was modified. The npm
version remains rc.1, but these patched bytes must not be described as the
unmodified official release.

All current direct DSH packages are exact `0.1.2-rc.1`, with Cordis `4.0.2` (MIT).
Newly selected direct DSH packages declare MIT and no install lifecycle hooks.
The current native cold-recovery test additionally mounts official
`dsh-api-session-controller`, `dsh-agent-default-model`, `dsh-session-query-sqlite`
and `dsh-attachment-local`, with the corresponding public service/type peers.
These are development dependencies, not a second product runtime or transport.

The attachment backend resolves `sharp@0.35.4` (Apache-2.0) and
`@img/sharp-win32-x64@0.35.4` (Apache-2.0 AND LGPL-3.0-or-later); the latter contains
libvips-family native DLLs and their LGPL notices. Neither package declares an
install lifecycle hook in this resolved version. No native binaries are copied
into the novel-agent package. Any future redistribution must retain the exact
native distribution's license/notice materials and meet its applicable terms.

The following paragraph describes the earlier rc.2 recovery proof; its DSH
dependencies have now moved to rc.1, while the recorded Koffi version remains.

Development-only native recovery proof additionally uses
`@deepseek-ai/dsh-session-persistence` and `@deepseek-ai/dsh-session-persistence-jsonl`
at exact `0.1.1-rc.2` **at the time of that proof** (MIT); the current lockfile
resolves both at `0.1.2-rc.1`. The latter resolves `koffi@3.2.1` and, on this
Windows x64 host, `@koromix/koffi-win32-x64@3.2.1` (MIT). Koffi's bundled
Node API headers and node-addon-api notices are also MIT and remain in the
upstream package. Installation used `--ignore-scripts`; no Koffi install script
was executed. These test dependencies do not add a novel-agent runtime or
transport. See [the native recovery proof](docs/native-author-session-lookup-2026-09-08.md).

| Package | Version/source | Use | License |
| --- | --- | --- | --- |
| `@deepseek-ai/dsh-*` | exact `0.1.2-rc.1` on the novel-agent product path | DSH Workspace, storage, Remote and Client Slot seams used by the single `novel-project` plugin | MIT |
| `minisearch` | `7.2.0`, [lucaong/minisearch](https://github.com/lucaong/minisearch) | In-memory full-text index rebuilt from one requested accepted novel revision | MIT |
| `@node-rs/jieba` | `2.0.2`, [napi-rs/node-rs](https://github.com/napi-rs/node-rs), package git head `3b2896520f4274d74aab262436e93e2cfbd4966f` | Chinese search-mode tokenization for the internal local index | MIT |
| `diff` | `9.0.0`, [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff), package git head `db0b12ace208da7fd741cf96d97f009347a9eaa8` | Host-only unified manuscript Diff generation after a reviewer returns complete rewritten prose | BSD-3-Clause |
| `docx` | `9.7.1`, [dolanmiu/docx](https://github.com/dolanmiu/docx) | Host-only OOXML/DOCX encoding for one accepted manuscript unit | MIT |
| `fflate` | `0.8.3`, [101arrowz/fflate](https://github.com/101arrowz/fflate) | Host-only ZIP encoding for the minimal EPUB 3 publication | MIT |

MiniSearch and Jieba are Host-only implementation dependencies inside the
`novel-memory` plugin. They do not add a search UI, Profile, Bundle, provider
registry or second fact store. The pinned npm tarballs contain no
`preinstall`, `install` or `postinstall` script. Jieba resolves an optional
prebuilt N-API package for the current platform; the Windows x64 lock entry is
`@node-rs/jieba-win32-x64-msvc@2.0.2` (MIT).

### `diff` `9.0.0`

> Copyright (c) 2009-2015, Kevin Decker <kpdecker@gmail.com>

BSD 3-Clause License. Redistribution and use in source and binary forms, with
or without modification, are permitted provided that source distributions
retain the copyright notice, conditions and disclaimer; binary distributions
reproduce them in accompanying documentation or materials; and neither the
copyright holder's name nor contributor names endorse derived products without
prior written permission. The software is provided "AS IS", without express or
implied warranties, and the authors are not liable for damages arising from its
use. The pinned tarball has registry integrity
`sha512-svtcdpS8CgJyqAjEQIXdb3OjhFVVYjzGAPO8WGCmRbrml64SPw/jJD4GoE98aR7r25A0XcgrK3F02yw9R/vhQw==`
and declares no `preinstall`, `install` or `postinstall` lifecycle script.

### Document export libraries

`docx@9.7.1`:

> Copyright (c) 2016 Dolan

MIT. Registry integrity:
`sha512-ilXFf9Moz47ABjFpDiA5s1w9lpb4EFSp7+5iiJSbfyYDM+bpZdAgLlSr7fW4aXhVe/E+F6QCv0EvRVFEd5CsWg==`.
The published package has no `preinstall`, `install` or `postinstall` script.

`fflate@0.8.3`:

> Copyright (c) 2026 Arjun Barrett

MIT. Registry integrity:
`sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==`.
It has no runtime dependency and no `preinstall`, `install` or `postinstall`
script; its `prepack` is a publication-time script and does not run on install.

For both packages, permission is granted free of charge to use, copy, modify,
merge, publish, distribute, sublicense and/or sell copies, provided the
copyright and permission notice remain with copies or substantial portions.
They are supplied without warranty; the authors or copyright holders are not
liable for claims, damages or other liability arising from their use.

The resolved `docx + fflate` production closure contains 23 packages. The
adoption scan found no install lifecycle script in that closure. Its licenses
are compatible permissive terms (MIT, ISC, Zlib and BlueOak); `jszip` declares
`(MIT OR GPL-3.0-or-later)` and this use follows its MIT option. A distribution
must retain the complete license files from the exact resolved closure; this
index is not a substitute for that payload.

## Adapted novel Skill method sources

| Component | Exact source | Adopted use | License |
| --- | --- | --- | --- |
| `tance-mang/chinese-webnovel-skills` | commit [`ecf552f6930e769d8bbf17818ad3d5a864a7a70b`](https://github.com/tance-mang/chinese-webnovel-skills/tree/ecf552f6930e769d8bbf17818ad3d5a864a7a70b), specifically `skills/outline/SKILL.md`, `skills/world/SKILL.md`, `skills/trends/SKILL.md`, `skills/deconstruct/SKILL.md` and `skills/memory/SKILL.md` | High-level planning and research methods only: layered structure, Chapter goal/obstacle/outcome/cost, foreshadow payoff, world-rule constraints, scoped/time-bearing observations and the rule that one ranking or case is not a trend. The `novel-architect` and `novel-researcher` texts are newly written for existing DSH seams. `novel-writing-memory-organizer` was evaluated separately and adopts no upstream memory method or text; it rejects the numbered-file, snapshot, CLI and generated-summary layout in favor of existing accepted-revision Canon projections. No upstream template, example, CLI, file-memory layout, model config or asset is copied. | MIT |
| `KKKKhazix/human-writing` | commit [`4fda173f3fef7fb808f3eba991eeb2528ea4b189`](https://github.com/KKKKhazix/human-writing/tree/4fda173f3fef7fb808f3eba991eeb2528ea4b189), specifically `human-writing/SKILL.md` and `human-writing/references/reality.md`, `fiction.md` and `revision.md` | High-level evidence discipline only: distinguish observable facts, attributed claims, inference and unknown/conflicting items. The `novel-researcher` text is newly written; no upstream wording, example, script, prompt or asset is copied. | MIT |

### `tance-mang/chinese-webnovel-skills`

> Copyright (c) 2026 tance-mang

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### `KKKKhazix/human-writing`

> Copyright (c) 2026 Human Writing Skill contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Separately installed community plugins

These packages are named product combinations, not copied source or hidden
dependencies of `novel-project`:

| Package | Version/source | Upstream capability | License |
| --- | --- | --- | --- |
| `dsh-better-sidebar` | `0.16.1`, tag `v0.16.1`, commit `f9153dfc1ce47cf43445c1b351ee3ae47b4ad9f1` | Files/editor/preview/terminal/Git/Diff/Jobs/Subagents/layout | MIT |
| `@anweat/dsh-browser` | `0.1.9`, [anweat/dsh-browser](https://github.com/anweat/dsh-browser) | Browser service and tools | MIT |
| `dsh-web-search-pro` | `0.1.11`, [anweat/dsh-web-search-pro](https://github.com/anweat/dsh-web-search-pro) | Web search over the browser service | MIT |
| `dsh-file-upload` | `0.4.3`, [HongMing-Huang/dsh-file-upload](https://github.com/HongMing-Huang/dsh-file-upload) | Upload and generic document extraction | MIT |
| `@xmoon76/dsh-pi-tui` | `0.3.4`, [XMoon/dsh-pi-tui](https://github.com/XMoon/dsh-pi-tui) | Complete TUI | MIT |
| `dsh-git-worktree` | `0.6.0`, [wloops/dsh-git-worktree](https://github.com/wloops/dsh-git-worktree) | Optional development Worktree workflow | MIT |

### `dsh-better-sidebar` `0.16.1`

> Copyright (c) 2026 dsh-external

License: MIT. The pinned npm tarball has SHA-256
`350486C712E17287C316DDB6BA15BC05741796AB0F4DE6C5C0DAAE729913F2B3`
and registry integrity
`sha512-fjFNzfrgdIbzlcC4Sd4aS1I2ZRbuA+/m3XQnOxY13jE6IKJzwz0+GjATcKTyFoLnXoDRp2QJz/U0GxhaOD70Dw==`.
The package's `install.ps1` and `install.sh` are shipped as manual Profile tools
and were not executed. Its direct `node-pty` dependency has npm lifecycle
scripts; the saved isolated Profile explicitly allowed that one native build.
The current repository manifest, lockfile and build policy contain no
`node-pty` entry.

Better Sidebar value-imports its `@deepseek-ai/dsh-client-ui-primitives` peer.
Its published DSH prerelease peer ranges did not pass the saved static rc.2 peer
check, even though the isolated runtime loaded. Novel-agent no longer depends
on Better Sidebar in its own manifest or lockfile, so compatibility is decided
by the separately installed Profile smoke rather than a local wrapper.

### `node-pty`

> Copyright (c) 2012-2015, Christopher Jeffrey
>
> Copyright (c) 2016, Daniel Imms
>
> Copyright (c) 2018-present Microsoft Corporation

License: MIT. Any distribution must retain the complete three-part license text
from the resolved package, including the native ConPTY payload notices.

### Historical `@xterm/xterm` `6.0.0`

> Copyright (c) 2017-2019, The xterm.js authors
>
> Copyright (c) 2014-2016, SourceLair Private Company
>
> Copyright (c) 2012-2013, Christopher Jeffrey

License: MIT. It belonged to the removed local terminal renderer and is not a
current novel-agent dependency. The historical stylesheet was covered by the
same license; no xterm.js logo, font or other branded media asset was adopted.

## Retired self-built foundation

Electron, Electron Forge, Vite, the custom asset origin, preload IPC carrier,
locally packaged installer, aggregate Profile, local terminal/xterm pair,
duplicate Better Sidebar Canon tab, Pi TUI footer, `desktop-workbench` and its
former `flexlayout-react` geometry dependency belonged to the retired novel-agent
Desktop route. They are not adopted product-host
dependencies under this decision. Electron and Electron Forge are absent from
the current root manifest and resolved lockfile; `flexlayout-react` is also
absent from the current resolved lockfile. Vite remains only as Vitest's
test-runner dependency and does not restore the retired application route.

The Better Sidebar Profile license scan observed 168 physical packages. One
transitive package, `khroma@2.1.0`, omits a `license` field from its manifest but
ships a lowercase `license` file containing MIT terms. This index does not
replace the complete resolved license/NOTICE payload required for a future
binary distribution.

## Update rule

When the community host release, a retained plugin dependency, its license, or
the distribution model changes, update this file together with
[`docs/upstream-sources.md`](docs/upstream-sources.md) and the relevant
evaluation. Do not substitute the npm `dsh-plugin-desktop@2.0.0` package: it is
not `v2.0.2` and carries DSH `0.1.0-rc.6`.

## Novel-mode web front end (2026-09-16)

`@novel-agent/novel-workbench` now ships the story map. It bundles three MIT
packages into its `lib/client.js` (no install or postinstall lifecycle scripts;
versions pinned in `packages/novel-workbench/package.json`):

- `sigma@3.0.3` — WebGL graph renderer.
- `graphology@0.26.0` — graph model; it declares `events@^3.3.0` (MIT) as its own
  dependency.
- `graphology-layout-forceatlas2@0.10.1` — force-directed layout, same project.

The npm `events@3.3.0` implementation of `EventEmitter` is additionally aliased
into the bundle (`packages/novel-workbench/tsdown.config.ts`): graphology imports
`events`, and a CommonJS-format browser bundle would otherwise externalize the
Node built-in and fail to load in the client module system.

All four are MIT. No upstream asset, font or paid licence is introduced; the
measured bundle cost and the rejected alternative are recorded in
`docs/open-source-evaluations/frontend-stack-2026-09-16.md`.

## Novel-mode editor stack (2026-09-17)

`@novel-agent/novel-workbench` declares the writing-editor stack as three direct
dependencies, pinned exact in `packages/novel-workbench/package.json`. The
lockfile gains 51 packages and removes none; no existing resolution changes.

- `@tiptap/react@3.31.3` — React bindings for the editor.
- `@tiptap/starter-kit@3.31.3` — the default Tiptap extension bundle.
- `@tiptap/pm@3.31.3` — the ProseMirror re-export layer. It exports no bare
  entry point, only subpaths (`@tiptap/pm/state`, `/view`, `/model`, ...).

All 51 packages in the added closure are MIT. None declares a `preinstall`,
`install` or `postinstall` script. The fifteen `prepare` scripts present in the
tree are build helpers (`pm-buildhelper`, `rollup -c`) and do not run for
registry installs. `react` and `react-dom` remain at the repository's pinned
`18.3.1`: both sit inside `@tiptap/react`'s declared peer range and no second
React version is resolved.

This dependency is declared but **not yet imported by any client module**, so
`lib/client.js` is unchanged by the addition (verified: the artifact still
hashes to `548d1124…` and is 645,428 bytes). A temporary import under the real
build measured the cost the editor will actually add: **645,428 → 1,559,851
bytes (+914,423 raw, +217,057 gzip)**.

Introducing it also exposed and fixed a bundle duplication: `tsdown.config.ts`
previously treated only `react` and `react/jsx-runtime` as host-provided, so
`@tiptap/react`'s `react-dom` import pulled React DOM and its scheduler into
`lib/client.js`. The official `dsh-client-ui-renderer` bundle reaches all four
by bare `require`, so `react-dom` and `react-dom/client` are host-provided too
and are now external. Without that fix the same three dependencies cost
2,511,029 bytes instead of 1,559,851.

The full measurement, the bundle-budget decision it forced and the rejected
alternatives are recorded in
`docs/open-source-evaluations/editor-stack-2026-09-17.md`.

## Novel-mode `@` reference source (2026-09-17)

`@novel-agent/novel-workbench` declares
`@deepseek-ai/dsh-client-ui-input-trigger@0.1.2-rc.1` as a **development
dependency, for its types only**. The package is a DSH platform plugin the host
already loads and provides; this bundle neither bundles it nor re-exports it. It
is declared so the `InputTriggerSource` contract and the `ctx.inputTriggers`
Context augmentation resolve at build time, the same way `dsh-client-ui-layout`
is declared for the `conversation` slot.

That is one new resolved lockfile entry. It is MIT, declares no `preinstall`,
`install` or `postinstall` script, and its only dependency `clsx@2.1.1` (MIT, no
lifecycle script) was already resolved in this tree and is unchanged.

The consumer is `packages/novel-workbench/src/client/novel-input-source.ts`: one
`@` trigger source adding a 人物与章节 group read from accepted Canon. It adds no
input machine, no second queue and no rival menu — the shipped trigger pipeline
owns detection, the menu, keyboard arbitration and the insertion itself.

## Chapter draft files (2026-09-17)

`@novel-agent/novel-project` declares two more DSH platform packages,
`@deepseek-ai/dsh-fs@0.1.2-rc.1` and `@deepseek-ai/dsh-sandbox-policy@0.1.2-rc.1`,
so the `novelProject` Remote can read and write the author's chapter draft files
in a workspace workdir. Both are MIT, ship no `preinstall` / `install` /
`postinstall` script, and are pinned to the same locked DSH version the
`novel-writing` package already resolves them at. The lockfile gains no new
resolution and removes none — the two entries simply take their alphabetical
place in that package's importer block.

These methods are a transport for the editor's draft medium only. A draft file
is not Canon state and reading or writing one advances nothing; only an accepted
Result Packet moves the accepted revision.
