# Unified manuscript Diff evaluation

**Decision:** adopt exact `diff@9.0.0` as a Host-only implementation dependency
inside the single `@novel-agent/novel-project` plugin.

**Evidence date:** 2026-08-27

## Product boundary

`NovelProjectService.reviewDraft()` remains the only domain seam. The stock DSH
`spawn` Subagent returns a complete `revisedText`; the service validates it,
keeps Issue quotes anchored to unique text in the accepted manuscript, and uses
`createTwoFilesPatch()` to produce the reviewable unified Diff. The dependency
does not own manuscript state, authorization, acceptance, rendering or Canon.

There is no new package, adapter, wrapper, tab, TUI extension, Profile, Bundle,
Workbench or generic Diff viewer. The existing `conversation.view` Result
Packet panel renders the returned text and remains the only author decision and
Apply path.

## Exact artifact and license

| Item | Evidence |
| --- | --- |
| Package | `diff@9.0.0` |
| Source | [kpdecker/jsdiff](https://github.com/kpdecker/jsdiff), package git head `db0b12ace208da7fd741cf96d97f009347a9eaa8` |
| Release | npm publication `2026-04-13T12:39:24.498Z` |
| Artifact | 136 files, 615,597 bytes unpacked; SHA-1 `297c31cd7c280f13dfe335791ec2063bd4a73a6f`; integrity `sha512-svtcdpS8CgJyqAjEQIXdb3OjhFVVYjzGAPO8WGCmRbrml64SPw/jJD4GoE98aR7r25A0XcgrK3F02yw9R/vhQw==` |
| License | BSD-3-Clause, Copyright (c) 2009-2015 Kevin Decker |

The published manifest contains build, lint and test scripts but no
`preinstall`, `install` or `postinstall` lifecycle script. It has no runtime
dependency or native binary. The tarball includes ESM/CJS implementations,
bundled declaration files, README, release notes and the BSD license; no logo,
font, theme or other branded asset is adopted.

## Capability, compatibility and cost

- The published declaration exports synchronous
  `createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, ...)` returning
  a string for non-abortable options. The official package README describes it
  as equivalent to `diff -u` patch generation.
- Version 9 publishes typed ESM and CJS entry points. The Host build consumes
  the ESM export under the repository's NodeNext configuration.
- The implementation is pure JavaScript and has no platform-specific branch,
  so Windows requires no native build approval.
- Runtime cost is one Host-only library and an in-memory line Diff per review.
  It is not bundled into the browser client; the client build continues to
  report only `zod` as bundled.
- The Result Packet's existing `<pre>` presentation and decision buttons own
  accessibility. This package emits text and adds no interactive surface.

## Validation and limitations

Focused Host tests prove the pre-adoption header-only result is replaced by a
hunk containing the actual removed and added Chinese prose. A real generated
DSH Remote test returns the revised manuscript and the same non-empty unified
Diff, while the draft still lacks author authorization. Negative coverage
rejects an unchanged manuscript; a temporary mutation removing that guard made
the test resolve with a header-only patch, proving the regression test catches
the gap. Existing tests continue to cover unique original-text Issue anchors,
run disposal and in-flight revision conflict.

The local repository gate passes 68 tests plus typecheck, lint and build. A
fresh stock-Web click-through for this exact rewrite flow has not run, so the
visible review remains `implemented-unverified`; production and user acceptance
are also unverified.

