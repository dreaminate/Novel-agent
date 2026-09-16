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
