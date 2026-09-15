# Chinese full-text retrieval evaluation

**Decision:** adopt exact `minisearch@7.2.0` plus
`@node-rs/jieba@2.0.2` as Host-only implementation dependencies inside the
single `@novel-agent/novel-project` plugin.

**Evidence date:** 2026-08-27

## Product boundary

`NovelProjectService.retrieve()` remains the only DSH Remote and domain seam.
It builds an in-memory MiniSearch index from the explicitly requested accepted
revision and tokenizes Chinese in Jieba search mode. The index is a disposable
projection: it cannot write Canon and is not persisted as a second fact source.

`NovelProjectService.rebuildRetrievalIndex()` registers one `novel-index` job
with the existing DSH `ctx.jobs` service. A job accepts only the current head,
rebuilds one accepted manuscript revision, and populates one in-memory
current-head cache. Accept or rollback invalidates that cache. Job display,
waiting and cancellation remain DSH responsibilities; novel-agent adds no Jobs
registry, scheduler or frontend. Each rebuild is owned by the exact active DSH
Agent supplied by the caller, so the existing agent-scoped
`@deepseek-ai/dsh-tool-jobs` controller can list, read, wait and stop it.
Novel-agent does not attach a root/global controller.

There is no new package, Service/provider registry, Profile, Bundle, generic
search screen, Web adapter or TUI extension. The returned
`provider: "local-chinese"` value is provenance for the implementation engine,
not a selectable runtime registry.

## Exact artifacts and licenses

| Package | Source | npm artifact evidence | License |
| --- | --- | --- | --- |
| `minisearch@7.2.0` | [lucaong/minisearch](https://github.com/lucaong/minisearch) | 826,513 bytes unpacked; tarball SHA-256 `CB3B8126A3EA65D6B387787294F0792B0EA4A40B70F8F37688066A5638E0218A`; integrity `sha512-dqT2XBYUOZOiC5t2HRnwADjhNS2cecp9u+TJRiJ1Qp/f5qjkeT5APcGPjHw+bz89Ms8Jp+cG4AlE+QZ/QnDglg==` | MIT |
| `@node-rs/jieba@2.0.2` | [napi-rs/node-rs](https://github.com/napi-rs/node-rs), package git head `3b2896520f4274d74aab262436e93e2cfbd4966f` | 11,316,129 bytes unpacked; tarball SHA-256 `D71F6AEBF82D4611914D2839321C9C22FD304FC231B29005A1FA09D2FCC5FD25`; integrity `sha512-aONN6nwpbwHKenEzCcYUbm6ZFHWEs7N5eas7zwWFs3c4MmEdN79m9Si4PvOxCp285I2M+g4MfLyUm9WcYaQi7Q==` | MIT |

Both main tarballs contain no `preinstall`, `install` or `postinstall` script.
Jieba resolves prebuilt optional N-API packages rather than running node-gyp;
the current Windows x64 lock selects
`@node-rs/jieba-win32-x64-msvc@2.0.2`, also MIT and 2,649,476 bytes unpacked.

## Capability and cost

- MiniSearch supplies a local in-memory inverted index, ranked results and
  deterministic AND queries without a network service or external database.
- Jieba supplies Chinese dictionary segmentation and search-mode overlapping
  terms. The default dictionaries account for most of its package size.
- Exact package versions are locked. MiniSearch has no runtime dependencies;
  Jieba's platform binaries are optional dependencies selected by OS/CPU.
- The dependencies are imported only by the Host entry. The client build still
  reports only `zod` as bundled and did not absorb MiniSearch, Jieba or a native
  binary.
- An uncached query still rebuilds its explicitly requested revision inline so
  retrieval remains available before a background job settles. The DSH job
  only warms the current-head cache; historical revisions remain immutable,
  transient projections.

## Validation and limitations

The real generated DSH Remote test covers structured, exact-text and Chinese
full-text retrieval for historical R1 and current R2, a wrong-revision no-match,
and a non-contiguous query whose terms are not an exact phrase. Hits bind back
to the accepted manuscript's source revision, content hash, ranges and
provenance. The same real Remote composition mounts `dsh-jobs-local`, waits on
the registered owner-scoped `novel-index` job, checks its `ownerSession`,
advances R1 to R2, observes freshness invalidation and rejects a newly requested
R1 rebuild against the R2 head. A fresh stock Web Profile then created a
`standard` Agent. Successful Session
`session-c5048727-7feb-4c7f-a3e9-fc6000a0d33a` model-called
`rebuild_novel_index({"revision":1})`, received `novel-index-1`, consumed the
native `tool-jobs` completed notice, emitted `NOVEL_INDEX_REBUILT` and ended with
`turn/end` reason `completed`. The retained evidence root is
`C:\Users\33166\AppData\Local\Temp\novel-agent-stock-agent-replay-20260827-1932`;
the Profile contains no novel-agent Jobs controller. Focused tests pass 6/6;
the repository gate passes 57/57 plus typecheck, lint and build. Running-job kill
and the in-flight stale guard have not been promoted as verified behavior by
this slice.

This slice promises Chinese search behavior only. Its matched source-range
reconstruction is case-sensitive for Latin text; mixed-language normalization
is not promoted as verified until it has its own behavior test. Production and
user acceptance are unverified.
