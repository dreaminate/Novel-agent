# Chinese web-novel Skill method evaluation

**Decision:** adopt only the high-level planning methods needed by the original
`novel-architect` runtime Skill. The independently written
`novel-writing-memory-organizer` adopts no method or text from the reviewed
upstream memory Skill because its file-memory/snapshot workflow conflicts with
Novel Project Canon. Do not install or copy the upstream Claude Code plugin,
prompts, templates, examples, CLI, file-memory layout or model config.

**Evidence date:** 2026-09-01

## Exact source and license

| Item | Evidence |
| --- | --- |
| Repository | [`tance-mang/chinese-webnovel-skills`](https://github.com/tance-mang/chinese-webnovel-skills) |
| Fixed source | commit [`ecf552f6930e769d8bbf17818ad3d5a864a7a70b`](https://github.com/tance-mang/chinese-webnovel-skills/tree/ecf552f6930e769d8bbf17818ad3d5a864a7a70b) |
| Reviewed files | [`skills/outline/SKILL.md`](https://raw.githubusercontent.com/tance-mang/chinese-webnovel-skills/ecf552f6930e769d8bbf17818ad3d5a864a7a70b/skills/outline/SKILL.md), [`skills/world/SKILL.md`](https://raw.githubusercontent.com/tance-mang/chinese-webnovel-skills/ecf552f6930e769d8bbf17818ad3d5a864a7a70b/skills/world/SKILL.md), [`skills/memory/SKILL.md`](https://raw.githubusercontent.com/tance-mang/chinese-webnovel-skills/ecf552f6930e769d8bbf17818ad3d5a864a7a70b/skills/memory/SKILL.md), `cli/webnovel.py` and `LICENSE` |
| License | MIT, Copyright (c) 2026 tance-mang |
| Observed release state | upstream metadata reports `0.29.1`; the remote returned no tags and `main` resolved to the fixed commit during this evaluation |

The complete MIT notice is retained in `THIRD_PARTY_NOTICES.md`. No upstream
brand asset, icon, font, image or other media is adopted.

## Adopted capability

The newly written `novel-architect` instructions reuse these abstract methods:

- plan only the needed Book / Volume / Arc / Chapter layers;
- make each Chapter contract state a goal, obstacle, outcome and cost;
- connect foreshadow placement to an intended payoff rather than keeping an
  unbounded prompt-only list;
- treat world rules, capability ceilings and consequences as constraints on
  Chapter planning rather than decorative exposition.

Those concepts map directly onto the existing `narrative-unit`, Chapter
contract, `clue/state`, `promise/state`, narrative-clock, `world/rule`, ending
and post-check contracts. The Skill produces proposals only; strict Canon and
narrative Deltas, SourceAnchors, provenance and author review stay authoritative.

The writing-memory organizer was evaluated independently against the reviewed
`skills/memory/SKILL.md` and rejects its numbered story files, generated memory
files, Git snapshots and CLI-managed summaries. Its ordered carry-forward brief,
requested-revision boundary and strict post-check proposal instead come directly
from this repository's existing `writingMemory` projection, accepted Chapter
contracts and Canon/Result Packet schemas. No upstream memory prompt, category,
example, algorithm or file layout is adapted into that role.

## Rejected capability and architecture

- upstream file-based project memory and numbered story files are rejected
  because Novel Project Canon is the only fact authority;
- Git snapshots, Python/OpenAI-compatible CLI code, `config.json`, model
  selection and provider calls are rejected because DSH owns Agent, Session,
  credentials, models, tools and persistence;
- upstream commands, prompt wording, examples and templates are not copied;
- no upstream package, process, network request, runtime dependency, Profile,
  Bundle, UI, store or second Agent Loop is introduced.

## DSH seam, cost and compatibility

The only implementation seam is `@deepseek-ai/dsh-skill@0.1.1-rc.2` inside the
single `@novel-agent/novel-project` plugin. `SkillRegistry.register()` publishes
the static runtime definitions; the stock `@deepseek-ai/dsh-tool-skill` catalog,
model loader and `/novel-architect` / `/novel-writing-memory-organizer` user
gestures consume them. The external user
`novel` preset remains the normal DSH Agent composition because rc.2 discovers
Agent presets from `agent.cordis.yml` roots and exposes no runtime preset
registration API.

The method source adds no executable dependency or platform-specific behavior,
so Windows and community Desktop compatibility reduce to the normal DSH Skill
seam. Runtime cost is only the catalog description and the instruction tokens
when loaded. Keyboard/screen-reader behavior remains the responsibility of the
stock Web/TUI Skill surfaces; no client UI is added.

## Validation boundary

The focused integrations mount the real rc.2 SkillRegistry and stock `skill`
Tool, resolve all eight roles as model/user invocable and load their canonical
`<skill_content>` bodies. Eight loaders pass 8/8; package 234/234 plus
package/root typecheck, lint, build and pack dry-run pass. A fresh isolated rc.2
Profile presented all eight roles in the stock Web slash catalog.
`/novel-writing-memory-organizer` injected its canonical body directly, and a
replay-driven real Agent emitted native
`skill({ name: "novel-writing-memory-organizer" })`; its successful Tool result
matched that direct body exactly. The same run recorded 80/80 2xx same-origin
responses and no console error/warning, page error, request failure, `novel/`
Canon event or unexpected storage record. This verifies the Agent/Tool/UI
execution chain, not autonomous external-model Skill selection. A separate fresh
Profile verifies one representative Standard-parent foreground one-shot
delegation to `novel-writing-memory-organizer`: the child loaded the Skill,
completed read-only R1 retrieval and returned a fixed completion marker without
changing Canon. Another fresh Profile verifies the same pairing as a continuable
background child: it reported after the initial read-only R1 retrieval, became
inactive, cold-continued through stock `send_message`, retrieved R1 again and
reported a second time. Parent events arrived as
`report → settled → report → settled`; Stock Web retained both reports after
reload, Canon/storage/build remained unchanged and browser failures were zero.
The fixed markers prove report delivery and order, not transfer of the full R1
retrieval payload. The same pairing is now also `verified` across a real
two-process Host restart. The fresh evidence root
`C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-green2-20260901-190402-01a05b3c`
records Host 1 (`PID 22136`, port `55235`) and Host 2 (`PID 39276`, port
`56818`) using the same isolated DSH_HOME/Profile and workspace. The exact
parent/child lineage survived the stop boundary; cold catalog state was
`parentAvailable=false`, then one stock `send_message` resumed the same child,
which completed its second R1 retrieval/report/settle. Raw parent/child
`session.export` JSONL artifacts strictly extended the phase-1 prefixes, the
durable coordinator relay's `user/message` matched the inbox id/source/text,
Canon/storage/build stayed unchanged, and browser/RPC failures and final
listeners were zero. The controlled RED root
`C:\Users\33166\AppData\Local\Temp\novel-restart-continuation-red3-20260901-183831-01a05b3c`
omitted only the second report and failed with one observed report while the
child otherwise settled. Novel-role-to-role and other role/pairing composition,
parallel/fault recovery, production use, cross-Session product-memory
acceptance and user acceptance remain `implemented-unverified`.

The five remaining direct role calls are now separately `verified` in the fresh
stock-Web root
`C:\Users\33166\AppData\Local\Temp\novel-five-role-green-20260901-221440-01a05b3c`:
each role completed one native `skill({ name })` call and matching canonical
Tool result with accepted Canon at R1, zero browser failures and zero
`novel/` frames. The controlled RED at
`C:\Users\33166\AppData\Local\Temp\novel-five-role-red-20260901-221311-01a05b3c`
changed only `novel-reviewer` to `missing-role` and failed the exact call
assertion. Role-to-role/pairing, parallel/fault recovery, production,
cross-Session product-memory acceptance and user acceptance remain
`implemented-unverified`.
