# Multi-manuscript review stock-Web E2E — 2026-08-28

## Scope

This run verifies the necessary novel-specific review interaction inside the
existing `@novel-agent/novel-project` `conversation.view`. It does not add or
exercise a Better Sidebar tab, Pi TUI extension, Profile wrapper, Bundle or
other community-plugin adapter.

The run used a fresh temporary DSH `0.1.1-rc.2` Web Profile and the current
local `novel-project` build. All state and replay data stayed under:

`C:\Users\33166\AppData\Local\Temp\novel-agent-review-select-e2e-5099b853f2cb483ab5aef51d9ca2edc4`

The user's global `.dsh` was not used. On Windows loopback, the stock Workspace
picker opens an operating-system directory chooser that headless Playwright
cannot drive. The script therefore registered the same temporary workspace
through DSH's existing Workspace Remote before continuing through the normal
stock Web UI; no DSH or Profile patch was added for this behavior.

## Observed flow

1. Accepted `chapter-a` as R1 and `chapter-b` as R2.
2. The Novel Project panel displayed both review targets as
   `甲章 雪庭 · R1` and `乙章 废塔 · R2`.
3. Selected `chapter-a`. The emitted `reviewDraft` request contained
   `revision: 2` and `unitId: "chapter-a"`.
4. The stock `spawn` reviewer returned a rewritten `chapter-a`, one anchored
   Issue and a unified Diff with real removed and added prose. The draft had no
   author authorization.
5. Accepted the Issue and applied the review. R3 carried an author
   authorization, updated `chapter-a`, and retained `chapter-b` from R2.
6. Rolled back to aggregate R2 as R4. The projected manuscripts were restored
   to `chapter-a` from R1 and `chapter-b` from R2, including each unit's
   original provenance.
7. Reloaded the page. R1 through R4, both review options and the restored
   aggregate projection were reconstructed from DSH storage.

## Evidence

- `review-select-flow-summary.json`: machine-readable requests, responses,
  selected unit, Diff, authorization checks and restored projections.
- `review-select-flow-trace.zip`: Playwright trace.
- `multi-unit-review-target-selected.png`
- `multi-unit-review-draft-no-authorization.png`
- `multi-unit-review-r3-applied.png`
- `multi-unit-review-r4-rollback.png`
- `multi-unit-review-r4-reloaded.png`

The final summary recorded 29 Novel Project RPC responses, all HTTP `200`, with
zero console warnings/errors, page errors and failed requests.

## Claim boundary

This promotes the current multi-manuscript stock-Web review, Apply, rollback
and reload path to `verified`. It does not verify production installation, user
acceptance, Pi TUI rendering, unrelated community-plugin interactions or the
complete Ask-to-Publish authoring workflow.
