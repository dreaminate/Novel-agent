import { describe, expect, it } from 'vitest'
import {
  chapterDraftPath,
  draftFromRead,
  proposalRequest,
  saveResultFromWrite,
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
