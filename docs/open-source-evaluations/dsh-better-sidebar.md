# `dsh-better-sidebar` evaluation

**Decision:** adopt fixed `dsh-better-sidebar@0.16.1` for the generic community
Files/editor/sidebar/terminal surface as a separately installed plugin.
Novel-agent does not wrap it or contribute a duplicate Canon tab.

**Evidence date:** 2026-08-26

**Exact source:** [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar),
lightweight tag `v0.16.1`, commit
`f9153dfc1ce47cf43445c1b351ee3ae47b4ad9f1` (`chore(release): 0.16.1`).

## Artifact and license

- npm artifact: `dsh-better-sidebar-0.16.1.tgz`, 3,377,628 bytes.
- SHA-256:
  `350486C712E17287C316DDB6BA15BC05741796AB0F4DE6C5C0DAAE729913F2B3`.
- Registry integrity:
  `sha512-fjFNzfrgdIbzlcC4Sd4aS1I2ZRbuA+/m3XQnOxY13jE6IKJzwz0+GjATcKTyFoLnXoDRp2QJz/U0GxhaOD70Dw==`.
- Registry shasum: `612a6f3c33d7b722df1cd6f7fa74dedfa1202907`.
- Registry snapshot reported `0.16.1` as `latest`, published
  `2026-08-25T03:22:03.513Z`; live registry state was not refreshed after the
  saved audit.
- Package license: MIT, Copyright (c) 2026 dsh-external. LICENSE SHA-256:
  `F4D265194E0824721AF0592462A71FE750C04DB3565C23C5D6C65FDEE25FB4B0`.
- The observed Profile closure contained 168 physical packages. One transitive
  package, `khroma@2.1.0`, omits manifest license metadata but ships an MIT
  `license` file (SHA-256
  `66B333B0F66759A0B710459E03F7029ABE17F4358114A128D2C972E642961B49`).

The saved npm attestations name the same package digest, GitHub-hosted release
workflow, `refs/tags/v0.16.1` and commit. `git verify-commit` exited `1` and no
online Sigstore/npm cryptographic verification was performed, so this is source
consistency evidence rather than a verified-signature claim.

## Capability and DSH seam

The package is a Host/Client DSH plugin that supplies a right sidebar, Files
tree, editor and preview surface. Its public client service exposes synchronous
`registerTab` and `registerFileViewer` methods. Registration is keyed by id,
duplicate ids fail immediately, and each method returns an idempotent disposer.

The public registry is an upstream capability, but the current product does not
register a local Better Sidebar tab or viewer. Necessary novel UI remains in
`novel-project`'s stock DSH conversation view, while the upstream plugin's
generic Markdown/editor behavior is reused unchanged.

## Install, peer and native-build evidence

- Fresh isolated Profile add initially exited `1` because the native build was
  not approved.
- The retry explicitly allowing only `node-pty@1.1.0` exited `0`.
- The package tar manifest has no npm `preinstall`, `install` or `postinstall`;
  shipped `install.ps1`/`install.sh` are manual Profile tools and were not run.
  The direct `node-pty@1.1.0` dependency does have install/postinstall scripts,
  which executed and installed the Windows ConPTY payload.
- The saved isolated install explicitly allowed the published `node-pty@1.1.0`
  build. A later fresh temporary Profile also resolved the unchanged plugin
  beside `novel-project`.
- Real `dsh --dump-config` exited `0` and the Host reached the plugin apply
  path.
- `pnpm peers check` exited `1`. Published DSH peer ranges begin at rc.8 and
  the isolated Profile manifest does not directly list all fallback peers.
  Default semver evaluation also reports that `0.1.1-rc.2` does not satisfy the
  prerelease range `^0.1.0-rc.8` unless `includePrerelease` is enabled. This
  must not be reported as a passing peer graph.
- Runtime inspection nevertheless observed 189/189 installed DSH packages at
  exact `0.1.1-rc.2`, with all 86 relevant DSH package names resolving to rc.2.
- A former local adapter exposed an older peer auto-install issue. That adapter
  is removed, and Better Sidebar is no longer present in the novel-agent
  workspace manifest or lockfile. Its rc.2 compatibility must therefore be
  established by the separately installed Profile, not a local dependency
  override or patch.
- The resolved graph contains `node-pty@1.1.0` for Better Sidebar and a separate
  `node-pty@1.2.0-beta.15` for the DSH subprocess chain. Terminal behavior for
  this dual chain remains unverified.
- The isolated DSH add/link logs use DSH-internal pnpm `11.19.0`. The repository
  lock regeneration used the separately pinned outer `corepack pnpm` `11.7.0`;
  these are distinct package-manager executions.

## Visible Windows smoke

The retained fresh-Profile run records `passed: true` for the scoped generic
surface:

- the English accessible `Files` tab and workspace tree were visible;
- `hello-sidebar.txt` opened in the editor and remained available after reload;
- `/sidebar/api/fs.tree`, `/sidebar/api/fs.read` and the editor bundle returned
  HTTP `200`;
- console errors and page errors were empty;
- two reload navigation aborts were classified as expected, with zero
  unexpected failed requests;
- `agentTerminalTools`, `bottomPanelAutoTerminal`, `tabsEnabled.terminal` and
  `tabsEnabled.sidechat` were all explicitly `false` in that historical smoke.
  Those overrides are retired; the current product intends to use the upstream
  features unchanged and has not yet rerun their visible smoke.

An earlier timeout waited for a Chinese `文件` tab while the actual accessible
tab name was English `Files`; the corrected role/name probe passed. That timeout
is probe failure evidence, not a product failure.

This smoke verifies only the historical Files/editor scope. The removed local
Canon tab is not a product target. Terminal, sidechat, agent terminal tools and
automatic-terminal behavior were disabled and remain outside that evidence.

A later no-wrapper composition smoke used
`C:\Users\33166\AppData\Local\Temp\novel-agent-single-plugin-24a1442e00e2488d8af95f5d8eeb1360`.
It resolved Better Sidebar `0.16.1` beside the single linked `novel-project`,
started Web on `127.0.0.1:3080`, and returned HTTP `200` for the root page,
the 198,257-byte Novel Project client artifact and the 1,246,879-byte Better
Sidebar client artifact. This verifies current composition and asset serving,
not the complete Files, terminal, Side Chat, Git or Diff interactions.

## Evidence locations and replacement rule

- Supply-chain audit root:
  `C:\Users\33166\AppData\Local\Temp\novel-agent-better-sidebar-audit-26ce5fa3c17d4a46b563b8de306aa01a`.
- Visible smoke summary:
  `C:\Users\33166\AppData\Local\Temp\novel-agent-better-sidebar-smoke-a52e1e179d634f49b62bfe022eaa06b5\evidence\better-sidebar-visible-smoke-summary.json`.
- Native-build and peer evidence are retained beside that summary in
  `better-sidebar-add-initial.log`, `better-sidebar-add-approved.log`,
  `peers-check-exit.json` and `peers-check.log`.

The plugin is replaceable: it owns generic UI and transient per-session tab
state only. DSH remains the Session/Workspace/runtime owner and
`@novel-agent/novel-project` remains the Canon authority. An upgrade must repeat
artifact/license/script review, exact rc.2 resolution, isolated install/load and
the visible upstream interactions used by the product before README pins a new
version. There is no novel-agent Bundle to update.
