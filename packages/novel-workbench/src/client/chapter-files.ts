/**
 * The chapter draft file: the medium the author writes into.
 *
 * A novel-mode draft is a plain file in the workdir, not Canon state. That is
 * deliberate — the manuscript is written before it is ever proposed, so it has
 * to be a file the author owns and can open in their own editor. An accepted
 * Result Packet is still the only thing that moves the accepted revision, and a
 * draft file is not it.
 *
 * This module is the translation layer: the host answers six concrete states
 * and every one of them becomes something the editor shows and acts on. It is
 * pure — the remote call lives on the data face — so the states are testable
 * without a host.
 */
import type { NovelChapterFileRead, NovelChapterFileWrite } from '@novel-agent/novel-project/types'

/** One chapter as the outline describes it. */
export interface ChapterIdentity {
  /** 1-based position among the work's chapters in story order. */
  readonly number: number
  readonly title: string
}

/**
 * Where one chapter's draft lives, relative to the workspace root.
 *
 * The workdir root, not a subdirectory: the filesystem seam creates and replaces
 * files but does not create parent directories, so a nested path would fail the
 * first time an author opened a chapter that had never been drafted. The name
 * carries the chapter so the author recognises it in their own file manager.
 */
export function chapterDraftPath(chapter: ChapterIdentity): string {
  return `第${String(chapter.number)}章《${chapter.title}》.草稿.md`
}

/** What the editor has after reading a chapter's draft. */
export type ChapterDraft =
  | { readonly state: 'loaded'; readonly text: string; /** Token the next save guards against. */ readonly version: string }
  /** No draft file yet — the normal first case, not a failure. */
  | { readonly state: 'new' }
  | { readonly state: 'unreadable'; readonly message: string }

/** What the editor has after saving. */
export type ChapterDraftSave =
  | { readonly state: 'saved'; readonly version: string }
  /** The file changed outside the editor; the caller re-reads against `version`. */
  | { readonly state: 'conflict'; readonly message: string; readonly version: string }
  | { readonly state: 'failed'; readonly message: string }

/**
 * What 提交本章 asks the agent to do.
 *
 * This is the one sentence in the product whose effect can reach Canon, so it
 * is deliberately explicit: which file, which revision it is proposed against,
 * and the boundary — a proposal, never a direct write. The author's click on the
 * confirmation is the authorization; the sentence is what that authorization
 * turns into.
 */
export function proposalRequest(
  chapter: ChapterIdentity,
  revision: number,
  chars: number,
): string {
  return [
    '请把这一章的草稿作为一份 Result Packet 提案提交，用 propose_novel_result_packet。',
    '',
    `- 草稿文件：${chapterDraftPath(chapter)}（就在工作区根目录，直接读这个文件）`,
    `- 章节：第${String(chapter.number)}章《${chapter.title}》，${String(chars)} 字`,
    `- expectedRevision：${String(revision)}`,
    '',
    '只产出提案、放进提案收件箱等作者审阅：不要直接改动 Canon，也不要顺手改别的章节。',
  ].join('\n')
}

/**
 * What 重新提炼 asks the agent to do.
 *
 * The second sentence in the product whose effect can reach Canon, and the one
 * that asks for *setting* deltas instead of the chapter. Two things it has to
 * get right, both learned from what the model does when they are missing:
 *
 * 1. **Name the skill.** `novel-writing-memory-organizer` owns the post-check
 *    and the debt / relationship / knowledge / arc shapes. Without naming it the
 *    run invents its own shapes, which the strict parser then rejects.
 * 2. **Say that no anchors is allowed.** Told nothing, a model asked for
 *    provenance burns its budget trying to hash anchors it does not have — the
 *    known trap — and files nothing at all.
 *
 * The boundary is the same as the chapter request: a proposal the author
 * reviews, never a direct write.
 */
export function refineRequest(
  chapter: ChapterIdentity,
  revision: number,
): string {
  return [
    '请对已接受的这一章做一次写作记忆提炼，用 novel-writing-memory-organizer 技能。',
    '',
    `- 章节：第${String(chapter.number)}章《${chapter.title}》`,
    `- 对齐版本：R${String(revision)}（current accepted revision）`,
    '',
    '按该技能的章节后写回约定，产出一份提案，用 propose_novel_result_packet：',
    '- chapter-state / post-check：本章实际造成的变化、付过的代价、新可行与新不可行、读者已知与可疑、角色携带、债务转变；',
    // The one place a character can be given a name without touching Canon
    // semantics: the organizer proposes it and the author accepts it item by
    // item. Until one lands the cast, the map and the 人物档案 have nothing but
    // the entity id — `guchen` is all this Canon holds.
    '- character-state：人物在本章第一次被具名称呼时，给 TA 补一个 name 方面（值就是正文里怎么称呼这个人）；',
    '  这一部的人物目前只有实体 id，界面只能显示 guchen 这样的 slug，补上 name 之后才显示成名字。',
    '- narrative-debt、relationship、knowledge、character-state / arc-hypothesis：',
    '  post-check 之外的真实变化各自用它自己的严格 contract，不要塞进 post-check 的自由文本。',
    '',
    '没有可指向的正文锚点时，sourceAnchors 就直接写 [] —— 不要为了凑锚点去硬算 hash。',
    '',
    '只产出提案、放进提案收件箱等作者逐条审阅：不要直接改动 Canon，也不要自动接受任何一条。',
  ].join('\n')
}

/**
 * What 让 AI 规划第一章 asks the agent to do.
 *
 * The third sentence in this product whose effect can reach Canon, and the one
 * an author reaches for when a work has nothing in it yet. Two things it has to
 * carry, both learned from how the other two requests fail without them:
 *
 * 1. **Name the skill.** `novel-architect` owns the book / volume / arc / chapter
 *    shapes. Unnamed, the run invents its own and the strict parser rejects them.
 * 2. **Ask for one chapter, not a book.** A model asked to plan will plan
 *    everything, and an author who sat down to write the first chapter ends up
 *    reviewing fifteen chapter contracts before typing a word.
 *
 * The boundary is the same as the others: a proposal the author accepts, never a
 * write.
 */
export function planChapterRequest(revision: number): string {
  return [
    '请为这部作品规划第一章，用 novel-architect 技能。',
    '',
    '- 只规划到「作者可以动手写第一章」为止：从现有的叙事层级往下补齐到第一章的章节合同。',
    '- 不要一次规划整本书的章节：后面的事等这一章写完、作者再决定。',
    `- expectedRevision：${String(revision)}`,
    '',
    '用 propose_novel_result_packet 产出一份提案，放进提案收件箱等作者逐条审阅：',
    '只产出提案，不要直接改动 Canon，也不要顺手改动已有章节。',
  ].join('\n')
}

/**
 * How much new prose earns a while-writing refinement.
 *
 * Deliberately large. Every refinement is an agent turn that can file several
 * proposals, so a small threshold would spend the author's money and fill their
 * inbox with the same chapter again and again. This is the number that decides
 * whether 边写边提炼 is useful or a nuisance.
 */
export const WHILE_WRITING_MIN_CHARS = 1200

/** What the while-writing throttle needs to decide. */
export interface RefineThrottle {
  /** True only in the 边写边提炼 mode; the submit-time mode never fires here. */
  readonly whileWriting: boolean
  /** A refinement already in flight. One at a time, always. */
  readonly asking: boolean
  /** Characters in the draft now. */
  readonly chars: number
  /** Characters at the last refinement; 0 when none has run for this chapter. */
  readonly refinedAt: number
}

/**
 * Whether writing has earned another refinement.
 *
 * The condition is *new prose since the last one*, not prose in total: that is
 * what stops the same chapter being proposed twice, and it is the whole reason
 * the inbox can be trusted to stay readable in this mode.
 */
export function shouldRefineWhileWriting(throttle: RefineThrottle): boolean {
  if (!throttle.whileWriting) return false
  if (throttle.asking) return false
  return throttle.chars - throttle.refinedAt >= WHILE_WRITING_MIN_CHARS
}

/**
 * Translate one read.
 * @param read - the host's answer.
 * @returns what the editor shows.
 */
export function draftFromRead(read: NovelChapterFileRead): ChapterDraft {
  switch (read.state) {
    case 'ok': return { state: 'loaded', text: read.text, version: read.version }
    // A chapter nobody has drafted yet opens blank and saves into a new file.
    case 'missing': return { state: 'new' }
    case 'unreadable': return { state: 'unreadable', message: read.reason }
  }
}

/**
 * Translate one write.
 * @param write - the host's answer.
 * @returns what the editor shows.
 */
export function saveResultFromWrite(write: NovelChapterFileWrite): ChapterDraftSave {
  switch (write.state) {
    case 'ok': return { state: 'saved', version: write.version }
    case 'conflict':
      return {
        state: 'conflict',
        version: write.version,
        // The author did this, somewhere else, on purpose or not — so the line
        // says what happened and what to do, not that a write failed.
        message: '这个章节文件在别处被改过了（你自己打开过，或另一个窗口存过）。先重新读一次，再决定怎么合并。',
      }
    case 'unwritable': return { state: 'failed', message: write.reason }
  }
}
