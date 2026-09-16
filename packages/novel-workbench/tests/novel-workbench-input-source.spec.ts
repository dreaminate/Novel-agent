import { describe, expect, it, vi } from 'vitest'
import { createNovelReferenceSource, NOVEL_REFERENCE_GROUP } from '../src/client/novel-input-source.js'
import type { NovelWorkFace } from '../src/client/novel-data.js'

/**
 * The `@` menu gains a 人物与章节 group beside the shipped file candidates. It is
 * a trigger *source*, so the pipeline still owns detection, the menu, keyboard
 * arbitration and the insertion — this spec only pins what the source answers:
 * which references exist, what picking one means, and that a broken Canon read
 * cannot take the composer down with it.
 */
const work = {
  workspaceId: 'ws-1',
  path: '/books/x',
  title: '天机阁主',
  sessionIds: ['session-1'],
  createdAt: '',
  updatedAt: '',
}

/** A face that answers the two reads this source makes. */
function faceOver(options: { people?: readonly string[], chapters?: readonly [number, string][], fail?: boolean } = {}) {
  const people = options.people ?? ['顾尘', '沈砚']
  const chapters = options.chapters ?? [[1, '开篇章'], [2, '旧瓦']]
  const face = {
    loadCast: vi.fn(async () => {
      if (options.fail === true) throw new Error('Canon 读不到')
      return {
        revision: 3,
        people: people.map(name => ({ id: name, name, faction: undefined, summary: undefined, aspects: 1 })),
        factions: [],
        relations: [],
      }
    }),
    loadOutline: vi.fn(async () => {
      if (options.fail === true) throw new Error('Canon 读不到')
      return {
        revision: 3,
        chapterCount: chapters.length,
        pending: 0,
        debts: 0,
        groups: [{ id: 'v1', title: '卷一', chapters: chapters.map(([number, title]) => ({ id: title, number, title, status: 'accepted', debts: 0 })) }],
      }
    }),
  }
  return { face: face as unknown as NovelWorkFace, loadCast: face.loadCast, loadOutline: face.loadOutline }
}

function source(deps: { face: NovelWorkFace, revision?: number, works?: readonly unknown[] }) {
  return createNovelReferenceSource({
    face: deps.face,
    works: () => (deps.works ?? [work]) as never,
    revision: () => deps.revision ?? 0,
  })
}

const req = (query: string) => ({ query, position: 'inline' as const, drilled: false, signal: new AbortController().signal })
const session = { sessionId: 'session-1' as never }

describe('novel @ reference source', () => {
  it('offers the cast and the chapters under one group', async () => {
    const { face } = faceOver()
    const found = await source({ face }).candidates(session, req(''))

    expect(source({ face }).name).toBe(NOVEL_REFERENCE_GROUP)
    expect(source({ face }).trigger).toBe('@')
    expect(found.map(candidate => candidate.name)).toEqual([
      '顾尘', '沈砚', '第 1 章《开篇章》', '第 2 章《旧瓦》',
    ])
    expect(found[0].value).toBe('人物:顾尘')
    expect(found[2].value).toBe('章节:第 1 章《开篇章》')
  })

  it('narrows by the live query', async () => {
    const { face } = faceOver()
    const found = await source({ face }).candidates(session, req('沈'))
    expect(found.map(candidate => candidate.name)).toEqual(['沈砚'])
  })

  it('inserts a reference chip and serializes it for the model', async () => {
    const { face } = faceOver()
    const built = source({ face })
    const [first] = await built.candidates(session, req('顾'))
    const outcome = built.onPick({ candidate: first, session, position: 'inline', via: 'menu', action: 'pick', span: { start: 0, end: 1, draftRev: 0 } })

    expect(outcome).toHaveProperty('insert')
    const insert = (outcome as { insert: { source: string, ref: string, label: string, clipboardText: string } }).insert
    expect(insert.source).toBe(NOVEL_REFERENCE_GROUP)
    expect(insert.ref).toBe('人物:顾尘')
    expect(insert.label).toBe('顾尘')
    expect(insert.clipboardText).toBe('@顾尘')
    // The model form says what kind of thing it is, so the model does not have to
    // guess whether 顾尘 is a person or a chapter.
    await expect(built.codec?.serialize('人物:顾尘', new AbortController().signal)).resolves.toBe('<人物>顾尘</人物>')
    await expect(built.codec?.serialize('章节:第 1 章《开篇章》', new AbortController().signal))
      .resolves.toBe('<章节>第 1 章《开篇章》</章节>')
  })

  it('offers nothing rather than failing when Canon cannot be read', async () => {
    const { face } = faceOver({ fail: true })
    await expect(source({ face }).candidates(session, req(''))).resolves.toEqual([])
  })

  it('reads Canon once per session and re-reads when accepted Canon moves', async () => {
    const { face, loadCast } = faceOver()
    const built = source({ face })
    await built.candidates(session, req(''))
    await built.candidates(session, req('顾'))

    // The pipeline polls on every keystroke; the reads must not follow it.
    expect(loadCast).toHaveBeenCalledTimes(1)

    // A new revision is a new question, so the source asks again.
    const afterAccept = source({ face, revision: 1 })
    await afterAccept.candidates(session, req(''))
    expect(loadCast).toHaveBeenCalledTimes(2)
  })

  it('offers nothing for a session that serves no work', async () => {
    const { face, loadCast } = faceOver()
    const built = source({ face, works: [] })
    await expect(built.candidates(session, req(''))).resolves.toEqual([])
    expect(loadCast).not.toHaveBeenCalled()
  })
})
