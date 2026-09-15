# Desktop workbench layout evaluation

**Decision:** **superseded**. Do not restore `@novel-agent/desktop-workbench` or
`flexlayout-react`. The user separately installs `dsh-better-sidebar@0.16.1`
for generic Files/editor/sidebar/terminal behavior; novel-agent does not wrap
it or contribute a duplicate Canon summary tab.

**Evaluated:** 2026-08-24

**Superseded:** 2026-08-26 by
[`dsh-better-sidebar`](dsh-better-sidebar.md).

**Exact source:** tag [`v0.10.5`](https://github.com/caplin/FlexLayout/tree/v0.10.5),
commit `c01813b2276a88ff437b4f2f73149d615da73a7b`.

## Current boundary

Better Sidebar may own generic tab geometry, Files, tree, editor and preview
presentation. Novel Project/Canon remains Host-owned by
`@novel-agent/novel-project`, whose necessary UI uses the stock DSH
`conversation.view` Slot. Better Sidebar's terminal, sidechat, agent terminal
tools and automatic terminal remain upstream features rather than settings a
novel-owned Profile disables.

The empty `packages/desktop-workbench` directory has no manifest or product
source, and `flexlayout-react` is absent from the current resolved lockfile.

## Historical boundary

FlexLayout may own only pane ids, tab selection, docking and geometry. Pane
bodies are DSH Client Slot contributions. DSH continues to own Client Runtime,
Session, Workspace, conversation, approval, Remote and Novel Project facts.
Browser-window popout is disabled in Electron; same-window resize, docking and
floating remain available.

The first composition keeps the stock DSH AppFrame, Sidebar, Conversation and
Tool Details unchanged. A workbench contribution mounts through the additive
`shell.overlay` lifecycle, portals a pane host beside the existing Conversation,
declares `desktop.workbench.pane`, and renders Novel Project through that Slot.

## Candidates

| Criterion | FlexLayout `0.10.5` | react-mosaic `7.0.0` | Allotment `1.20.5` |
| --- | --- | --- | --- |
| Source/license | [caplin/FlexLayout](https://github.com/caplin/FlexLayout/tree/v0.10.5), MIT | [nomcopter/react-mosaic](https://github.com/nomcopter/react-mosaic/tree/v7.0.0), Apache-2.0 | [johnwalley/allotment](https://github.com/johnwalley/allotment/tree/v1.20.5), MIT |
| Exact reviewed revision | `c01813b2276a88ff437b4f2f73149d615da73a7b` | `3991eec…` | `cd4937e…` |
| Runtime dependency cost | No runtime dependencies; React/ReactDOM are peers. Candidate audit measured about 45.3 KB gzip before novel-agent bundling. | Eleven runtime dependencies; about 37.3 KB gzip. | Six runtime dependencies; about 9.6 KB gzip. |
| Layout capability | Tabs, nested rows, splitter resize, drag/reorder, dock, same-window float and JSON round-trip. | Capable tiled layout, but its v7 model is newly migrated. | One-dimensional splits; no general tab/dock graph. |
| Accessibility | Built-in tab/tablist/tabpanel semantics, keyboard navigation, focus styling and keyboard-operable ARIA splitters. | Reviewed splitter lacked equivalent keyboard/ARIA behavior. | Accessible split primitives, but insufficient layout capability. |
| DSH seam fit | Model can remain a replaceable geometry adapter while DSH Slots render all content. | Could fit the seam, but adds dependencies and an accessibility adapter. | Would require a second custom docking/tab system around it. |
| Decision | Historical selection, now superseded by Better Sidebar composition. | Rejected. | Rejected. |

## Registry and installation review

- npm package: <https://registry.npmjs.org/flexlayout-react/-/flexlayout-react-0.10.5.tgz>
- Integrity: `sha512-VP2AGJxERKeECmW1xHFnJRm3tl7wsFUl/o4XLAmaExGmpr30/kn41yDRpYtZW5RiGstNqZ1l6e96UdSYnwNYfw==`.
- Peer range: React and ReactDOM `^18.0.0 || ^19.0.0`; the repository uses React
  `18.3.1`.
- The published manifest has build/prepack scripts but no install or postinstall
  lifecycle script. pnpm lifecycle approval is therefore unchanged.
- The MIT theme CSS is bundled into the workbench client artifact; no upstream
  logo, font or other branded asset is adopted.

## Historical license record and retirement rule

Copyright (c) 2017 Caplin Systems Ltd. License: MIT. The copyright and MIT
permission notice must accompany distributed copies or substantial portions.

No FlexLayout artifact is part of the current product composition. Reintroducing
it or a custom workbench would require a new user-directed decision and proof
that the community plugin seam cannot supply the required behavior. No Session,
Workspace, Canon or approval data migration is associated with this retirement.
