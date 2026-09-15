# Result Packet community Desktop E2E — 2026-08-26

## Evidence scope

This packet records the accepted fresh Windows run of community DSH Desktop
`v2.0.2` (tag `9d18856ddea4f20eb3ef8c88b0436921c6b19606`) with DSH packages fixed at
`0.1.1-rc.2`. The isolated evidence root is:

`C:\Users\33166\AppData\Local\Temp\novel-agent-result-packet-e2e-9b452978ba2749f0a31ed06234db8c16`

The run used Session
`session-40c1290e-64f3-4c87-9c84-071cdd60be45` and Workspace
`35f0b496-c00f-4dbf-9571-caff7b2202ca`. Its Profile manifest linked
`@novel-agent/novel-project` directly to the rebuilt package in this checkout.
It did not reuse the earlier `35ae4676...`, `40f9e2f9...` or `dfb68d9b...`
Result Packet storage.

The relevant product paths are the
[Client Slot](../packages/novel-project/src/client/NovelProjectPanel.tsx),
[Result Packet schema](../packages/novel-project/src/result-packet-schema.ts),
[Host service](../packages/novel-project/src/index.ts),
[Client regressions](../packages/novel-project/tests/novel-project-client.spec.ts),
and [Remote integration](../packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts).

## Verified visible behavior

- A new Profile began without Sessions, storage files or Temp credentials. A
  visible Workspace creation and keyless local replay prompt produced a real
  non-blank Session with the installed `Novel Project` Client Slot.
- R0 preview rendered manuscript, unified Diff, typed Delta, anchored Issue,
  SourceAnchor, provenance and authorization.
- Apply remained disabled until every Delta and Issue had a decision. The four
  exercised per-item Accept/Reject controls had unique accessible names.
- Mixed Delta `accept` / Issue `reject` advanced R0 to R1. Canon R1 included the
  accepted lighthouse fact and excluded the rejected Issue from Canon facts.
- A second accepted review advanced the head to R2.
- Visible rollback targeted R1 with `expectedRevision: 2` and
  `targetRevision: 1`, then appended R3 with `parentRevision: 2` and
  `rollbackOfRevision: 1`. Canon R3 retained the R1 fact and removed the R2
  fact.
- A renderer reload issued `open`, three `read` calls and `projectCanon`, and
  reconstructed R1/R2/R3, the mixed decisions, anchored Issue, SourceAnchor and
  Canon R3.
- All 13 captured Novel Project RPC responses were HTTP `200`.

## Raw captures and durable state

- `evidence\result-packet-trace.zip` is the main Playwright trace.
- `evidence\fresh-result-packet-summary.json` contains the 13 raw RPC exchanges,
  six named accessibility snapshots, browser diagnostics and rollback action
  names.
- `evidence\accepted-run-identity.json` ties the accepted process family,
  Profile links, source and bundle hashes, durable storage and shutdown checks
  to this evidence root.
- The principal screenshots are
  `evidence\fresh-r1-mixed-decisions-ready.png`,
  `evidence\fresh-r3-rollback-to-r1.png`, and
  `evidence\fresh-r3-after-reload.png`.
- The durable `dsh-home\storages\novel_project.json` SHA-256 after R3 is
  `E8FF6F80ED3A8B79A8B8AD110ED54A4893CEA8DD711A7298DAB793237A49D6B3`.
- The accepted Client source SHA-256 is
  `3002BA095DC0FB7BAA61617C26E55BDDB9CE625CBDB0CE1F0420E83C802B8444`;
  its rebuilt `lib/client.js` SHA-256 is
  `BAB47DFF32EC32AA08BB29EF3D99D02F1F2C12A1B4324BAA650179F20C094E56`.

## Local code validation

- `corepack pnpm --filter @novel-agent/novel-project test` — exit `0`, three
  files and 29 tests passed.
- `corepack pnpm --filter @novel-agent/novel-project typecheck` — exit `0`.
- `corepack pnpm --filter @novel-agent/novel-project build` — exit `0`, including
  Typert generation, Host/Client TypeScript builds and `tsdown`.
- `corepack pnpm exec oxlint --deny-warnings packages/novel-project/src packages/novel-project/tests packages/novel-project/build packages/novel-project/tsdown.config.ts`
  — exit `0`.
- `corepack pnpm exec vitest run packages/novel-project/tests/novel-project-result-packet-remote.integration.spec.ts`
  — exit `0`, two tests passed.
- Focused A→B→A coverage exercises both review and rollback late-success paths.
  A temporary mutation that suppressed rollback's stale-success reload made the
  regression fail with two A loads instead of three; restoring the
  implementation returned it to GREEN. The rollback regression also directly
  asserts `expectedRevision: 2` and `targetRevision: 1`.
- Three Client regressions cover rejected snapshot load, Result Packet review
  and rollback Promises. They require an epoch-current failure to clear the
  operation busy state, render a contextual error and restore the relevant
  controls without an unhandled rejection.

Unlike the earlier capture, the accepted fresh Profile linked the rebuilt
current package, so the visible Desktop evidence includes both the A→B→A race
fix and the post-mutation Canon projection rejection fix.

## Isolation and diagnostic boundary

- The generated Host command explicitly sets `DSH_HOME` to this evidence
  root's `dsh-home`; Profile, Workspace, successful-retry Electron user-data
  and storage paths are also under the same Temp root.
- The Temp root, `dsh-home`, Profile, Workspace, Electron user-data directory
  and `novel_project.json` were inspected as regular filesystem entries with no
  reparse link type.
- Raw `pre-metadata.json`, `active-metadata.json` and `post-metadata.json`
  captures are retained for user-global `.dsh/settings.yaml` and
  `.dsh/.credentials.yaml`. After removing only the localized `fsutil` File-ID
  label, all retained identity, length, creation time, last-write time,
  attributes and link metadata are equal. The whole-tree FileSystemWatcher log
  remained zero bytes.
- Credential content was never read or hashed.

Observed: the retained whole-tree FileSystemWatcher recorded no event, and the
two monitored-file snapshots showed no metadata change. Unverified:
FileSystemWatcher does not provide kernel PID attribution and cannot prove the
absence of a transient write that restored every observed field. The visible
Result Packet flow and the stated metadata comparison are verified; full
process-attributed isolation from every possible user-global `.dsh` write is
not claimed.

The first launch in this root exited the plugin load path because the isolated
Profile could not resolve `@deepseek-ai/dsh-llm-replay`; the raw
`PackageOverlayNotFoundError` is retained in `evidence\desktop.stderr.log`.
Only the isolated Profile was changed by installing exact
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2`; the accepted retry used a new Electron
user-data directory. Its stderr contains only the DevTools listener line.

Browser action lanes recorded zero console warnings/errors and zero page
errors. The explicit reload retained one failed lifecycle request,
`/_dsh/desktop/renderer-boot` with `net::ERR_ABORTED`; the successful retry's
stderr contains no warning beyond the DevTools listener line. No Novel Project
RPC failed. At `2026-08-26T11:06:37Z`, the retained post-shutdown verification
observed the accepted root and enumerated active-family PIDs absent, with Host
port `43120` and DevTools port `54651` not listening.

## Residual follow-up

At R3, two historical actions still share the accessible name `Roll back`.
Revision-specific rollback action names remain a P3 accessibility follow-up.
Focused tests do not yet directly cover late failure after returning to a
Workspace, unmount-after-success, or every cross-Workspace mutation
interaction.

## Delivery status

- Local checkout: implementation, tests and accepted E2E evidence are present;
  the repository is almost entirely untracked, so ordinary Git diff cannot
  identify a clean baseline.
- Remote branch or PR: not created or queried.
- Local tests: passed as listed above.
- CI: not run or queried.
- Production: not deployed or queried.
- User acceptance: not obtained.
