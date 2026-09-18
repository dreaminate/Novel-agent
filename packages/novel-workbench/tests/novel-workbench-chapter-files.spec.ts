import { describe, expect, it } from 'vitest'
import {
  WHILE_WRITING_MIN_CHARS,
  chapterDraftPath,
  draftFromRead,
  planChapterRequest,
  proposalRequest,
  refineRequest,
  saveResultFromWrite,
  shouldRefineWhileWriting,
  type ChapterDraft,
  type ChapterDraftSave,
} from '../src/client/chapter-files.js'

/**
 * The chapter draft is a *file the author owns* in their workdir — where the
 * manuscript is written before anything is proposed. Canon is not involved: an
 * accepted Result Packet is the only thing that moves the accepted revision, and
 * a draft file is not it.
 *
 * What this module owes the editor is a translation: the host answers six
 * concrete states, and each one has to become something the author can see and
 * act on rather than a remote result.
 */
describe('chapter draft path', () => {
  it('names the draft after the chapter, in the workdir root', () => {
    // The workdir root and not a subdirectory: the fs seam creates and replaces
    // files but does not create parent directories, so a nested path would fail
    // the first time an author opened a chapter that had never been drafted.
    expect(chapterDraftPath({ number: 1, title: '开篇章' }))
      .toBe('第1章《开篇章》.草稿.md')
    expect(chapterDraftPath({ number: 12, title: '旧瓦' }))
      .toBe('第12章《旧瓦》.草稿.md')
  })
})

describe('reading a draft', () => {
  it('carries the text and the version a later write guards against', () => {
    const draft = draftFromRead({ state: 'ok', text: '风起于青萍之末。', version: 'v1' })
    expect(draft).toEqual<ChapterDraft>({ state: 'loaded', text: '风起于青萍之末。', version: 'v1' })
  })

  it('treats a missing file as a blank draft, not as an error', () => {
    // A chapter that has never been drafted is the normal first case, not a
    // failure: the editor opens blank and the first save creates the file.
    expect(draftFromRead({ state: 'missing' })).toEqual<ChapterDraft>({ state: 'new' })
  })

  it('passes the host’s own words through when the file cannot be read', () => {
    const draft = draftFromRead({ state: 'unreadable', reason: '这不是 UTF-8 文本，编辑器打不开。' })
    expect(draft.state).toBe('unreadable')
    expect(draft.state === 'unreadable' ? draft.message : '').toContain('UTF-8')
  })
})

describe('saving a draft', () => {
  it('returns the new version so the next save can guard against it', () => {
    expect(saveResultFromWrite({ state: 'ok', version: 'v2' }))
      .toEqual<ChapterDraftSave>({ state: 'saved', version: 'v2' })
  })

  it('calls a version mismatch a conflict, and says what to do about it', () => {
    // The file moved under the editor — the author edited it elsewhere. Saying
    // "conflict" with the current version is what lets the editor offer to
    // re-read instead of silently overwriting their work.
    const saved = saveResultFromWrite({ state: 'conflict', version: 'v9' })
    expect(saved.state).toBe('conflict')
    if (saved.state !== 'conflict') throw new Error('unreachable')
    expect(saved.version).toBe('v9')
    expect(saved.message).toContain('别处')
  })

  it('passes the host’s own words through when the file cannot be written', () => {
    const saved = saveResultFromWrite({ state: 'unwritable', reason: '没有权限读写这个文件。' })
    expect(saved.state).toBe('failed')
    expect(saved.state === 'failed' ? saved.message : '').toContain('权限')
  })
})

describe('the chapter proposal request', () => {
  it('names the file, the revision, and the boundary the agent must respect', () => {
    const text = proposalRequest({ number: 2, title: '旧瓦' }, 7, 1200)

    expect(text).toContain('第2章《旧瓦》.草稿.md')
    expect(text).toContain('propose_novel_result_packet')
    expect(text).toContain('expectedRevision：7')
    expect(text).toContain('1200 字')
    // The boundary is the whole reason this sentence exists: the draft reaches
    // Canon through a proposal the author reviews, never through this request.
    expect(text).toContain('不要直接改动 Canon')
  })
})

/**
 * A work with no chapters has nothing for the author to open, so 写作 offers to
 * plan the first one. This is the third sentence the product sends to the agent,
 * and it carries the same boundary as the other two: the architect proposes
 * structure, and the author accepting it is what puts it in Canon.
 */
describe('the first-chapter planning request', () => {
  it('names the architect, the lineage, and the boundary the agent must respect', () => {
    const text = planChapterRequest(5)

    // The skill that owns structure — without naming it the run invents shapes
    // the strict parser then rejects.
    expect(text).toContain('novel-architect')
    expect(text).toContain('propose_novel_result_packet')
    expect(text).toContain('expectedRevision：5')
    expect(text).toContain('不要直接改动 Canon')
  })

  it('asks for a first chapter to write, not for the whole book at once', () => {
    const text = planChapterRequest(5)

    // Planning everything is how an author ends up with fifteen chapters they
    // did not agree to before writing a word of the first one.
    expect(text).toContain('第一章')
  })
})

/**
 * Refinement is the second sentence this product sends to the agent, and it is
 * the one that asks for *setting* deltas rather than the chapter itself. It has
 * to name the skill that knows those shapes, and it has to say the two things
 * the model otherwise gets wrong.
 */
describe('the chapter refinement request', () => {
  it('names the organizer, the accepted lineage, and every delta shape it may use', () => {
    const text = refineRequest({ number: 1, title: '开篇章' }, 5)

    // The skill that owns these shapes, so the agent does not invent its own.
    expect(text).toContain('novel-writing-memory-organizer')
    // The lineage the proposal must be made against.
    expect(text).toContain('第1章《开篇章》')
    expect(text).toContain('R5')
    // The shapes the organizer produces, named so a run cannot silently drop one.
    expect(text).toContain('chapter-state')
    expect(text).toContain('post-check')
    expect(text).toContain('narrative-debt')
    expect(text).toContain('relationship')
    expect(text).toContain('knowledge')
    expect(text).toContain('arc-hypothesis')
  })

  it('allows an empty anchor list, because demanding one makes the model spin', () => {
    // Known trap: told nothing, the model burns its budget trying to hash anchors
    // that do not exist, and produces no proposal at all.
    const text = refineRequest({ number: 1, title: '开篇章' }, 5)
    expect(text).toContain('sourceAnchors')
    expect(text).toContain('[]')
  })

  it('keeps refinement proposal-only, and says so', () => {
    const text = refineRequest({ number: 1, title: '开篇章' }, 5)
    expect(text).toContain('propose_novel_result_packet')
    expect(text).toContain('不要直接改动 Canon')
  })
})

/**
 * 边写边提炼 is the expensive mode: every refinement is an agent turn that can
 * file several proposals. The throttle is what keeps it from spending the
 * author's money and filling their inbox with the same chapter over and over.
 */
describe('the while-writing refine throttle', () => {
  it('never fires in the submit-time mode, however much was written', () => {
    expect(shouldRefineWhileWriting({
      whileWriting: false, asking: false, chars: 40_000, refinedAt: 0,
    })).toBe(false)
  })

  it('waits for enough new prose, and then asks', () => {
    const below = WHILE_WRITING_MIN_CHARS - 1
    expect(shouldRefineWhileWriting({
      whileWriting: true, asking: false, chars: below, refinedAt: 0,
    })).toBe(false)
    expect(shouldRefineWhileWriting({
      whileWriting: true, asking: false, chars: WHILE_WRITING_MIN_CHARS, refinedAt: 0,
    })).toBe(true)
  })

  it('never asks twice for the same text, which is what keeps the inbox quiet', () => {
    // A refinement just ran at this length: nothing has been written since, so
    // asking again would re-propose the same chapter.
    expect(shouldRefineWhileWriting({
      whileWriting: true, asking: false, chars: 5000, refinedAt: 5000,
    })).toBe(false)
  })

  it('does not stack turns on top of each other', () => {
    expect(shouldRefineWhileWriting({
      whileWriting: true, asking: true, chars: 9000, refinedAt: 0,
    })).toBe(false)
  })
})
