# Host and plugin boundary note

**Status:** Scoped to the adopted community Desktop host. This is not a new
security-hardening workstream.

**Scope:** DSH `0.1.2-rc.1` with the repository's local `dsh-session` recovery
patch, the community DSH Desktop host (last verified `v2.0.2`; current target
`v2.0.5`), the separately selected community plugins, and the five
`@novel-agent/*` domain plugins (`novel-project` plus planning, writing, memory
and review). It replaces the former self-built Electron/IPC/zero-port threat
model.

## Execution principle

Feature delivery is the current priority. Security work is limited to the
minimum boundary rules required not to create a second Desktop or DSH control
plane. Do not add a parallel hardening project, a new carrier, or requirements
that delay normal host/plugin composition.

## Adopted boundary map

```text
Community DSH Desktop host (v2.0.2 verified / v2.0.5 target)
  Electron / window / tray / profiles / native terminal
                         │
                         ▼
DSH Host + dsh-base + dsh-web-app
  loopback HTTP/WebSocket at 127.0.0.1:ephemeral
                         │
                         ▼
Selected DSH Profile
  user-selected community plugins
  @novel-agent/novel-project (Canon)
  @novel-agent/novel-planning, novel-writing,
  novel-memory, novel-review (domain plugins)
                         │
                         ▼
DSH Session / Approval / Persistence / Novel Project Canon
```

The loopback HTTP/WebSocket carrier is a community-host implementation fact. It
is explicitly accepted here; novel-agent must not claim zero listeners, replace
it with a custom `novel-agent://`/IPC carrier, or attach a second local server.

## Minimum continuing rules

1. **Use the host's Profile/plugin path.** Novel-agent is installed or linked
   through the normal DSH CLI/Profile mechanism, including `dsh plugin --profile`.
   It does not own launcher configuration, plugin resolution or a marketplace.
2. **Keep DSH as the authority.** Session, approval, persistence, credentials,
   settings and plugin lifecycle stay in DSH. A novel Client Slot cannot settle
   an approval, invent Session state or become a credential store.
3. **Keep Desktop-native ownership upstream.** Electron window, tray, updater,
   notification, diagnostics, Profile switch and operator terminal belong to
   the community Desktop. New fiction features use its published DSH/Desktop
   seams rather than raw Electron bridges.
4. **Keep novel data in its declared seam.** The accepted manuscript, Canon
   deltas and provenance are the `novel-project` aggregate through DSH storage;
   renderer UI state stays transient.
5. **Do not create another network surface.** The existing host loopback carrier
   is reused. A novel-agent plugin does not bind a new HTTP, WebSocket, TCP or
   UDP listener as part of normal feature work.

These rules preserve runtime coherence; they do not add extra product safety
features beyond the host and DSH plugin boundaries.

## Retired claims and tests

The retired self-hosted Desktop path had custom-scheme, preload IPC,
sender/generation, zero-listener and Forge/ASAR test requirements. Those claims
do not describe the adopted community host. Related tests may be removed or
replaced during migration when they only protect that retired route; they are not
host security acceptance criteria.

## Evidence status

The retained historical runtime smoke verified the exact release EXE, loopback
carrier, `novel-project` and visible Result Packet behavior. That run also linked
now-removed aggregate/terminal packages, so it does not verify the current
five-plugin composition or the separately installed Better Sidebar/Pi TUI
surfaces. The release source/tag/license and installer asset are checked; a
fresh isolated current-composition smoke remains pending.

Production deployment, a user-owned Profile, full update/recovery lifecycle and
user acceptance are **not run**. Those are operational validation gaps, not a
reason to resurrect the retired local carrier.

## Deferred work

Future hardening, self-hosted remote access, new browser/automation authority,
or a new networked service needs its own concrete feature decision. Until a user
asks for such a feature, this document imposes no additional security project or
release gate on the current plugin implementation work.
