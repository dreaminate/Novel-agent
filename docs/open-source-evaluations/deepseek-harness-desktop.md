# DeepSeek Harness Desktop host evaluation

**Decision:** adopt the community Desktop as the direct Desktop host for
`novel-agent`.

**Decision date:** 2026-08-26

**Scope:** Windows desktop host only. This decision does not copy, fork or
modify the community host or DeepSeek Harness; all novel-agent code remains in
this repository as the single ordinary DSH plugin `novel-project`.

## Exact source and release

| Item | Evidence |
| --- | --- |
| Repository | [anywhere-labs/deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) (the release URL currently redirects to the renamed `anywhere-labs/dsh-desktop` repository) |
| Adopted release | GitHub Release [`v2.0.2`](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/tag/v2.0.2), tag commit `9d18856ddea4f20eb3ef8c88b0436921c6b19606` |
| Audited source snapshot | Local read-only audit checkout HEAD `b13e1fa47e3ac5925bcd664091cfe5db85ee7fab` |
| DSH dependency line | `@deepseek-ai/dsh-base`, `dsh-web-app` and `dsh-host-webserver` are exact `0.1.1-rc.2` in the release package manifest |
| Windows asset | [DSH-Desktop-2.0.2-x64-Setup.exe](https://github.com/anywhere-labs/deepseek-harness-desktop/releases/download/v2.0.2/DSH-Desktop-2.0.2-x64-Setup.exe) |
| License | MIT, Copyright (c) 2026 Anywhere Labs |

The asset URL was checked with a HEAD request and resolves to an
`application/octet-stream` installer named `DSH-Desktop-2.0.2-x64-Setup.exe`.

## Why this is the smallest compatible host

The community project is already a Cordis Desktop plugin host. Its Desktop
package launches the Host Cordis root, composes the normal `dsh-base` and
`dsh-web-app` Bundles, and provides the desktop concerns that novel-agent had
started to recreate:

| Community host responsibility | novel-agent decision |
| --- | --- |
| Electron process, BrowserWindow, system tray and lifecycle | Reuse unchanged; do not maintain a second carrier. |
| Profile discovery, selection, repair and restart | Reuse its Desktop Profile mechanism; install `novel-project` as an ordinary plugin. |
| Native Desktop terminal, diagnostics, notifications and updates | Reuse unchanged. |
| Community market | Reuse the host integration; do not create a novel-agent market or plugin registry. |
| DSH web client and Host services | Reuse ordinary DSH composition rather than patching Agent, Session, Client Runtime or approval. |

The host's documented presentation carrier is loopback HTTP and WebSocket on
`127.0.0.1` with an ephemeral port. Electron loads that same-origin page in a
sandboxed renderer. This replaces the former local `novel-agent://` plus
in-process IPC/zero-listener design; novel-agent must neither reintroduce that
carrier nor claim that the adopted host has no listener.

## Plugin seam and retained module

`novel-agent` is an ordinary profile-installed DSH plugin project, not another
desktop application or aggregate Bundle. The retained product module is:

- `packages/novel-project`: the fiction Canon and Result Packet service plus
  the necessary DSH `conversation.view` panel.

Generic Web terminal behavior comes from separately installed Better Sidebar;
terminal-mode interaction comes from Pi TUI; the host also keeps its native
operator terminal. Novel-agent does not maintain another Remote/xterm pair.

Install and composition use the host's normal DSH CLI/Profile path (including
`dsh plugin --profile`), so Host/profile/plugin resolution stays upstream-owned.
Novel-agent adds only its domain Cordis plugin; it does not supply
a launcher, web carrier, alternate profile manager, marketplace, session or
approval system.

## Registry candidate rejected

The npm package is not the release adoption path:

| Registry result | Consequence |
| --- | --- |
| Published versions: `0.0.1`, `2.0.0`; latest: `2.0.0` | `2.0.2` is not published to npm. |
| `dsh-plugin-desktop@2.0.0` depends on `@deepseek-ai/dsh-base@0.1.0-rc.6` | It is incompatible with the adopted `0.1.1-rc.2` product line. |

Do not install the npm latest package as a substitute for the GitHub `v2.0.2`
release.

## Maintenance, compatibility and operational limits

- The evaluated GitHub tag, release asset and current audited source checkout
  are concrete maintenance/release evidence; they are not a warranty or a
  claim that later upstream commits are compatible.
- Windows support is supplied by the named x64 setup asset. Historical isolated
  host/profile smoke is verified for its recorded composition. A later isolated
  CLI/Web/Pi smoke verified one-plugin/no-wrapper resolution and startup without
  launching the Desktop EXE; normal production/user lifecycle remains a
  separate validation scope.
- The host has a normal Electron/DSH runtime cost and loopback carrier. This
  project deliberately accepts that cost to avoid building an equivalent
  launcher/carrier.
- The host's normal DSH UI remains the accessible base surface. Novel-agent
  Client Slots must still validate their own keyboard and rendering behavior.
- MIT permits the integration approach, but no community-host code, logo, icon
  or installer is copied into this repository. If a future distribution bundles
  host artifacts, its complete upstream notices must accompany that
  distribution.

## Current validation state

- Source/version/license/release metadata: checked.
- **Historical isolated host smoke verified:** the exact `v2.0.2` EXE ran with
  an isolated `base + web + novel` Profile; HTTP returned `200`, lifecycle was
  healthy, and the visible window showed `DeepSeek Harness Desktop` /
  `Responding`. That Profile also linked local aggregate/terminal packages now
  removed, so it is not current composition proof.
- **Novel Remote smoke verified:** the running isolated host created a real DSH
  Workspace, then `novelProject/open`, `novelProject/current` and
  `novelProject/projectCanon(revision=0)` returned HTTP `200`, echoed their
  rpcIds and returned one consistent project/workspace identity. The initial
  accepted revision and projected Canon revision were both `0`.
- **Visible plugin interaction verified for the Result Packet slice:** a real
  non-blank Session exposed the `Novel Project` Client Slot. A complete packet
  rendered its manuscript,
  unified Diff, typed Delta, anchors, provenance and authorization. The visible
  Accept action called the generated Remote, advanced R0 to R1, refreshed
  history and Canon, and cleared the review input. A fresh browser load read the
  same R1 history and Canon through `open`, `read` and `projectCanon`. Every
  observed plugin response was HTTP `200`; there were no console errors or
  warnings and no failed browser requests.
- **Retired terminal observation:** the same historical run exercised local
  terminal packages. Those packages are removed, so that result does not
  verify Better Sidebar terminal or Pi TUI.
- **Historical aggregate Profile observation:** the real DSH CLI once installed
  the removed novel Bundle wrapper and `--dump-config` exited `0`. The current
  architecture does not use that wrapper.
- **Current single-plugin composition smoke:** a fresh temporary `DSH_HOME`
  resolved `novel-project` beside Better Sidebar `0.16.1` in Web and beside
  Pi TUI `0.3.4` in a separate terminal Profile. Web started on
  `127.0.0.1:3080`; its root page and both client artifacts returned HTTP
  `200`. Pi TUI displayed its input-ready main shell after the user Profile
  mounted the four official DSH storage/workspace provider rows. The run did
  not launch the Desktop EXE and does not verify complete generic-plugin UI or
  novel-specific TUI interactions.
- Production deployment, normal user-owned Profile lifecycle, update behavior
  and user acceptance: **not run**.

Future host lifecycle work continues in fresh temporary Profiles and exercises
only the next selected community plugin interaction; the user's default Profile
is not used. Existing isolated results verify only their named startup,
artifact, host and Result Packet scopes, not every novel-agent feature or
production operation.

One upstream packaging anomaly is recorded rather than patched locally: pnpm's
lock and dependency graph resolve `@deepseek-ai/dsh-base@0.1.1-rc.2`, matching
the community Desktop release manifest, while that registry tarball's embedded
`package.json` reports `0.1.1-rc.1`. Novel-agent does not rewrite the upstream
package; the locked resolver identity, community release contract and real CLI
composition are the evidence used for this release line.
