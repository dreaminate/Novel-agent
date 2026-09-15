# Strict progression.advancement ledger stock-Web E2E — 2026-09-02

## Scope

This run verifies the existing typed `progression.advancement` projection for
one character through `progressionCharacterId` in a fresh stock DSH Web
Profile. R1 accepts a static breath-control advancement; R2 accepts a second
moving-control advancement. The retrieval must exclude another character's
typed advancement and a legacy free-text rank, preserve story order and source
metadata, and restore the existing Canon progression ledger after reload. The
native Tool, generated Remote and `projectNarrative` are reused; no new Tool,
store, page or package is added.

The isolated Profile used DSH `0.1.1-rc.2`, the current local
`@novel-agent/novel-project` build and the temporary
`@deepseek-ai/dsh-llm-replay@0.1.1-rc.2` fixture. The user's global `.dsh` was
not used.

## RED → GREEN

The controlled RED used:

`C:\Users\33166\AppData\Local\Temp\novel-progression-ledger-stock-web-red3-20260902-01a05b3c`

It submitted a malformed advancement delta whose typed `value` was missing.
The real Typert boundary rejected the command (`wire field "command" failed
boundary validation`) before a new revision was created. The accepted head
stayed R1, and the RED Canon/storage hashes were byte-identical before and
after:

- Canon:
  `b0a9afe736769d391486acdd6b94a0dab8733cc57b19e8afb9853080bff859c1`;
- storage:
  `c01d977d8ca69a11fc73d06ffc05edf63106d22bebd6a49f0916e4b40b41ac6c`.

The RED Host was `http://127.0.0.1:64356`; it recorded 8 direct RPC and 21
browser-observed Web API responses with zero console, page or request failures.
The Host and earlier failed-attempt processes were stopped; the final scan
found no listener on the tested ports.

The final GREEN used:

`C:\Users\33166\AppData\Local\Temp\novel-progression-ledger-stock-web-green3-20260902-01a05b3c`

The stock Agent emitted one native retrieval with:

`{"revision":2,"compareRevision":1,"progressionCharacterId":"shen-yan"}`

The current ledger returned the two accepted typed advancements. Historical R1
returned only the first, and the generated Remote matched the current and
historical projections.

## Observed flow

1. A fresh Workspace and Standard Session accepted the R1 hierarchy and
   `advancement-breath-control` for `shen-yan`; R2 accepted
   `advancement-moving-breath`. A typed advancement for another character and a
   legacy free-text rank were present only to verify filtering.
2. The current Tool result returned `revision: 2`, `headRevision: 2` and
   `freshness: "current"`. The ledger retained each advancement's dimension,
   prior limitation, setup, evidence, enabling action, resource/sacrifice,
   new capability, remaining limit, counter, social interpretation,
   downstream consequence, story order/event id and source ranges, Delta and
   provenance. Entries were ordered by story order and stable id.
3. Historical R1 retrieval was `historical` and excluded the R2 advancement,
   other character and legacy rank. Current/historical `projectNarrative` and
   generated Remote retained their requested revisions. Retrieval and panel
   reads created no proposal, workflow event or `novel/` Canon frame.
4. The existing Canon progression selector and ledger rendered both accepted
   entries without `[object Object]`. Renderer reload restored the same R2
   ledger and source labels.

## Evidence and shutdown

- GREEN Host: `http://127.0.0.1:64362`; root/navigation HTTP status `200`.
- GREEN Workspace: `f2bae83d-0e55-4bbc-a8ae-0e616c61c353`.
- GREEN Session: `session-823e5b96-8af8-409f-bcbb-b7280c820666`.
- Native model/tool/result counts: `1 / 1 / 1`; proposal Tool calls: `0`;
  workflow events: `0`; the replayed turn ended `completed`.
- GREEN recorded 19 direct RPC and 81 browser-observed Web API responses. All
  RPC responses were HTTP `200`; all Web API responses were below `400`;
  console, page and failed-request counts were `0`.
- Native result stayed inline (`nativeResultSpilled: false`) at 20,334 UTF-8
  bytes. Post-seed mux frames: `63`; post-seed `novel/` frames: `0`.
- Canon SHA-256 before/after:
  `b4f6c2991da1e25985bcac5ea3641d9c48e6f6e58edb09f8cffcb0f3f11b3ea5`.
- `dsh-home\storages\novel_project.json` SHA-256 before/after:
  `3cb81d98e8d7ddb4c47d3323d1a4c2675b791070fe77d8fa9233739b6f7f7bcf`.
- Built `packages/novel-project/lib/index.js` SHA-256:
  `7443C48FAD64D6D090532A63893A8307B44062B5B0DF291179E015D36554A771`.
- GREEN artifacts include `green-summary.json`, `progression-ledger-r2.png`,
  `progression-ledger-r2-reloaded.png`, `progression-ledger-stock-trace.zip`,
  `session.jsonl`, `replay.override.json`, the fixture and the runner. RED
  retains its summary, focused error screenshot, trace and replay inputs.

Selected artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| GREEN `green-summary.json` | `D18973253A8099AE9DEF7AAC1096CF4AE5BAE0F7372B208EDECF3525A4BF08BD` |
| GREEN `progression-ledger-r2.png` | `06311D94A48B4CB16CE300085E390F5C30CBE9376C0A445C77CF0F452297BE44` |
| GREEN `progression-ledger-r2-reloaded.png` | `06311D94A48B4CB16CE300085E390F5C30CBE9376C0A445C77CF0F452297BE44` |
| GREEN `progression-ledger-stock-trace.zip` | `BCF18257DADFAD34AA2C9277F2076CAEFEE2FA493E6B57D78E39EDF93D602092` |
| GREEN `session.jsonl` | `8894EE7FD637AE1E122D9C6B26F467BE364ADE316211B3ACEF832A2B4F972438` |
| GREEN `replay.override.json` | `B9992488AC98FDEB8AEE8B954F4885C697B775458363537C71C510E8DAA146B5` |
| RED `red-summary.json` | `F24D1E0C4D75BBF401CBEEC400690C6039C67641EFD955EBBC340D674AA239E0` |
| RED `progression-ledger-red-error.png` | `8D388A7E51E84EE51CA3095A508C552F09B39993AE555AAAA20985FAFCA283EC` |
| RED `progression-ledger-stock-trace.zip` | `4C65C71316074C87A4D65BFFCB99E26710E5784AC3988F358DBC69B3A57BD126` |
| RED `session.jsonl` | `DA415F06EE99B67FCE7178BFA10CE5FDF97505375473CD16FEB855363CA1DC79` |

The final GREEN and RED Hosts were stopped through their PTYs; ports `64362`
and `64356` and the earlier failed-attempt ports were re-probed with no
listeners.

## Claim boundary

This promotes only the synthetic typed `progression.advancement` R1→R2
ledger: character filtering, story-order sorting, historical/current retrieval,
generated Remote agreement, source/Delta/Anchor/provenance retention, existing
selector/Canon panel and reload, strict malformed-value rejection and unchanged
Canon/storage. It does not promote semantic growth inference, rollback-specific
restoration, process/transport recovery, production installation or user
acceptance.
