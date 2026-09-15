# Electron foundation evaluation

**Status:** Superseded for the `novel-agent` product path on 2026-08-26.

The previous decision to build and package a private Electron application with
Electron Forge, Vite, a custom `novel-agent://` origin, and an in-process IPC
carrier is no longer adopted. It duplicated the normal Desktop work that the
community DSH Desktop already provides and made that duplication a prerequisite
for fiction features.

## Replacement decision

`novel-agent` directly reuses the community Desktop host described in
[DeepSeek Harness Desktop host evaluation](deepseek-harness-desktop.md):

- GitHub Release `v2.0.2`, tag commit
  `9d18856ddea4f20eb3ef8c88b0436921c6b19606`;
- DSH `0.1.1-rc.2`;
- the Windows x64 NSIS setup asset supplied by that release;
- ordinary DSH plugin installation for `novel-project`.

The host owns Electron, its window lifecycle, tray, native terminal, profile
selection, diagnostics, notifications, updater and community market. It uses
the upstream loopback HTTP/WebSocket carrier; it is not a zero-port IPC host.
That carrier is a host fact, not a new novel-agent transport implementation.

## Retired local path

The following former foundation is retired from the product path:

- `apps/desktop` and its Forge/Vite packaging;
- `desktop-carrier`, `desktop-ipc-transport`, `desktop-asset-origin`, custom
  scheme and preload/carrier boot;
- carrier-specific Electron/Forge/zero-listener acceptance tests.

Migration code may temporarily retain files while it removes them. Such files
are not evidence for the shipped host, and their tests must not gate novel
feature work or be presented as product Desktop E2E evidence.

## What remains in this repository

`novel-agent` remains a DSH plugin project. It keeps only `novel-project`, which
owns fiction-domain behavior and the necessary DSH conversation view. Better
Sidebar, Pi TUI, browser, search, upload and optional Worktree remain separate
community downloads. Electron is therefore no longer a direct novel-agent
runtime selection or maintained local desktop foundation. If a later feature
needs a desktop-native capability, it first targets the community host's
published service rather than recreating an Electron bridge.

## Validation boundary

The source, tag, release asset, license and DSH dependency version have been
checked. A historical isolated runtime smoke verified the exact EXE, linked
Profile, HTTP surface, manifest, healthy lifecycle and visible Desktop window
for the then-current composition. It does not verify today's one-plugin setup.
Production operation and user acceptance remain not run; no claim about them is
implied.
