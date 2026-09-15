# Novel researcher method evaluation

**Decision:** adopt only source-discipline and bounded trend-observation methods
for the original `novel-researcher` runtime Skill. Do not copy or install any
upstream prompt, crawler, CLI, project layout, file memory or model configuration.

**Evidence date:** 2026-09-01

## Exact sources and licenses

| Source | Fixed revision and reviewed material | License | Decision |
| --- | --- | --- | --- |
| [`tance-mang/chinese-webnovel-skills`](https://github.com/tance-mang/chinese-webnovel-skills) | commit [`ecf552f6930e769d8bbf17818ad3d5a864a7a70b`](https://github.com/tance-mang/chinese-webnovel-skills/tree/ecf552f6930e769d8bbf17818ad3d5a864a7a70b): `skills/trends/SKILL.md`, `skills/deconstruct/SKILL.md`, `skills/memory/SKILL.md`, `LICENSE` | MIT, Copyright (c) 2026 tance-mang | Adopt high-level scope/time/source and single-sample limits. |
| [`KKKKhazix/human-writing`](https://github.com/KKKKhazix/human-writing) | commit [`4fda173f3fef7fb808f3eba991eeb2528ea4b189`](https://github.com/KKKKhazix/human-writing/tree/4fda173f3fef7fb808f3eba991eeb2528ea4b189): `human-writing/SKILL.md`, `human-writing/references/reality.md`, `fiction.md`, `revision.md`, `LICENSE` | MIT, Copyright (c) 2026 Human Writing Skill contributors | Adopt the distinction between observable facts, attributed claims, inference and unknowns. |
| [`zenstory-ai/oh-story-claudecode`](https://github.com/zenstory-ai/oh-story-claudecode) | commit [`5de060f9a47e7c4781c81edb320436b772e2955e`](https://github.com/zenstory-ai/oh-story-claudecode/tree/5de060f9a47e7c4781c81edb320436b772e2955e): `skills/story-long-scan/SKILL.md`, `scan-output-format.md`, `topic-decision.md`, `reader-profiling.md`, `LICENSE` | MIT, Copyright (c) 2025-2026 oh-story-claudecode | Evaluated only; its multi-source/sample/date concept agrees with the adopted method but is not needed by this increment. |
| [`wordflowlab/novel-writer-skills`](https://github.com/wordflowlab/novel-writer-skills) | commit [`5bc9b373ff609e8910e0e8d179e4a697bf2b1268`](https://github.com/wordflowlab/novel-writer-skills/tree/5bc9b373ff609e8910e0e8d179e4a697bf2b1268): `templates/commands/analyze.md`, knowledge-base notes, PowerShell analysis script, README and `LICENSE` | MIT, Copyright (c) 2025 Novel Writer Team | Reject its parallel CLI, `.specify` tree, tracking JSON, templates and automated quality workflow. |

The complete notices for adopted method sources are retained in
`THIRD_PARTY_NOTICES.md`. No upstream wording, example, code, script, asset or
runtime package is copied.

## Adopted method

The newly written Skill:

- narrows purpose, platform/readership, subject, place and time before searching;
- records source title or file id, visible publication/update date, access date,
  source category and scope for each important conclusion;
- separates observable facts, source-attributed claims, evidence-based inference,
  unknown/conflicting items and the next verification action;
- treats a single ranking or case as an observation rather than a trend, and
  requires repeated signals across independent sources or samples for a bounded
  trend candidate;
- abstracts comparable structure without copying recognizable prose, characters,
  places, plots or style.

External material remains untrusted data. It cannot override the task, expose
credentials or grant tool authority. Research defaults to a Session-visible
brief. Only an explicit request to propose a finding as novel Canon may use the
existing strict Result Packet with a real SourceAnchor and provenance; missing
source ranges stay an explicit gap rather than a fabricated hash.

## DSH seam and rejected architecture

The implementation is one static `SkillRegistration` in the single
`@novel-agent/novel-project` plugin, registered through the existing optional
`ctx.skills.register()` seam from `@deepseek-ai/dsh-skill@0.1.1-rc.2`. It uses
only Browser, Web search, file-reading or document-extraction Tools already
available in the selected DSH Profile. It adds no dependency, Tool, Provider,
crawler, index, store, file-memory layout, Profile, Workflow, Session, Agent Loop
or UI.

## Validation boundary

The RED resolved `novel-researcher` to `undefined` through the real rc.2 registry.
GREEN loads the canonical body through the stock `skill` Tool. Eight role-loader
tests pass 8/8; the package gate passes 234/234 with package/root typecheck, lint,
build and pack dry-run. A fresh isolated rc.2 Profile displayed all eight roles
in the stock Web slash catalog. `/novel-researcher` directly injected its
canonical body; a replay-driven real Agent then emitted native
`skill({ name: "novel-researcher" })`, whose successful Tool result matched that
body exactly (SHA-256
`f4c4b396402436fc236668a6d5a26c479c72ac96466ff457c72bc9f884f40d69`).
The run recorded 80/80 2xx same-origin responses and no console error/warning,
page error, request failure, `novel/` Canon event or unexpected storage record.
This proves the replayed Agent/Tool/UI path, not autonomous external-model Skill
selection or live Browser/Search execution. A separate fresh Profile verifies
only a Standard-parent foreground one-shot delegation to
`novel-writing-memory-organizer`; it does not exercise `novel-researcher` as a
child. Researcher Subagent composition, novel-role-to-role or message-based
composition, production and user acceptance remain `implemented-unverified`.
