// @vitest-environment jsdom
// Everything the author reads is in their language. Canon's own vocabulary is
// not: relationship lines are keyed by entity id, and character aspects are
// keyed by whatever word the model chose (`realm`, `constitution`, …). Those are
// the machine's words, and a board that prints them is asking the author to
// translate.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import type { NovelCanonProjection, NovelRelationshipProjection } from '@novel-agent/novel-project/types'
import { CastView } from '../src/client/CastView.js'
import { PersonFileDrawer } from '../src/client/PersonFileDrawer.js'
import { buildCastBoard, buildStoryMap } from '../src/client/novel-data.js'
import { aspectLabel } from '../src/client/novel-copy.js'

const provenance = { taskId: 'task-1', sessionId: 'session-1', producer: 'proposal' }

function character(id: string, fields: Record<string, string>) {
  return {
    kind: 'character-state',
    targetId: id,
    fields,
    fieldSources: {},
    sourceRevision: 5,
    sourceDeltaId: `delta-${id}`,
    sourceAnchorIds: [],
    provenance,
  }
}

const canon = {
  projectId: 'p', workspaceId: 'ws', revision: 5, facts: [],
  entities: [
    character('guchen', { name: '顾尘', faction: '天机阁', realm: '凡尘境圆满' }),
    character('linxuan', { name: '林轩', persona: '沉默寡言' }),
    // One character Canon never names: the id is all anyone has, and that is
    // what the board has to fall back to rather than inventing something.
    character('sumubai', { realm: '归道·归一境' }),
  ],
} as unknown as NovelCanonProjection

const relationships = {
  projectId: 'p', workspaceId: 'ws', revision: 5, orphans: [],
  relationships: [{
    line: 'guchen <-> linxuan',
    participants: ['guchen', 'linxuan'],
    directions: [
      { pair: 'guchen->linxuan', from: 'guchen', to: 'linxuan', fields: { 'line-state': { form: '师徒', stage: '试探', turns: [], unresolvedDebts: [] } }, fieldSources: {}, sourceRevision: 5, sourceDeltaId: 'd1', sourceAnchorIds: [], provenance },
      { pair: 'linxuan->guchen', from: 'linxuan', to: 'guchen', fields: { 'line-state': { form: '师徒', stage: '敬重', turns: [], unresolvedDebts: [] } }, fieldSources: {}, sourceRevision: 5, sourceDeltaId: 'd2', sourceAnchorIds: [], provenance },
    ],
  }],
} as unknown as NovelRelationshipProjection

function faction(id: string, name: string, people: readonly string[]) {
  return { id, name, agenda: '守着一座快要塌的阁', people }
}

describe('novel-mode author-facing naming', () => {
  it('writes a relationship line with the people names, not their entity ids', () => {
    const board = buildCastBoard({ canon, relationships })

    expect(board.relations[0]?.forward).toBe('顾尘→林轩 师徒（试探）')
    expect(board.relations[0]?.backward).toBe('林轩→顾尘 师徒（敬重）')
    expect(board.relations[0]?.forward).not.toContain('guchen')
  })

  it('names the ends of a map edge too, and falls back to the id only when there is no name', () => {
    const map = buildStoryMap({
      canon: {
        ...canon,
        entities: [...canon.entities, character('solo', { realm: '不知' })],
      } as unknown as NovelCanonProjection,
      relationships: {
        ...relationships,
        relationships: [{
          ...relationships.relationships[0],
          line: 'sumubai <-> solo',
          participants: ['sumubai', 'solo'],
          directions: [{
            ...relationships.relationships[0]!.directions[0]!,
            from: 'sumubai',
            to: 'solo',
          }],
        }],
      } as unknown as NovelRelationshipProjection,
    })

    // 苏慕白 has no accepted name, so the id is the only honest thing to show.
    expect(map.edges[0]?.label).toContain('sumubai→solo')
    expect(map.nodes.map(node => node.label)).toContain('顾尘')
  })

  it('labels the aspects Canon records with the author words, and stays quiet about the rest', () => {
    expect(aspectLabel('realm')).toBe('境界')
    expect(aspectLabel('constitution')).toBe('体质')
    expect(aspectLabel('persona')).toBe('性情')
    // The vocabulary belongs to the model, not to us: a word we have never seen
    // gets no invented translation, and is not printed raw either.
    expect(aspectLabel('spirit-root')).toBeUndefined()
  })

  it('shows a 人物档案 with aspect labels instead of Canon keys', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(PersonFileDrawer as never, {
        file: {
          id: 'guchen', name: '顾尘', faction: '天机阁',
          aspects: [{ field: 'realm', value: '凡尘境圆满' }, { field: 'spirit-root', value: '剑骨' }],
          relations: [], appearances: [],
        },
        onClose: () => {}, onContinueFrom: () => {},
      }))
    })

    const text = container.textContent ?? ''
    expect(text).toContain('境界')
    expect(text).toContain('凡尘境圆满')
    expect(text).not.toContain('realm')
    // An unknown key is not a label the author can read, so only the value shows.
    expect(text).toContain('剑骨')
    expect(text).not.toContain('spirit-root')
    // ...and it has to span the row, or the sentence lands in the label column.
    const unlabelled = container.querySelector('[data-novel-person-aspect="spirit-root"] > span')
    expect(unlabelled?.getAttribute('style')).toContain('1 / -1')
    const labelled = container.querySelector('[data-novel-person-aspect="realm"] > span')
    expect(labelled?.getAttribute('style')).toBeNull()

    await act(async () => { root.unmount() })
  })

  it('says a faction has no accepted members rather than showing it as a zero', async () => {
    const board = {
      revision: 5,
      people: [],
      factions: [faction('dange-pavilion', '丹阁', []), faction('tianji', '天机阁', ['guchen'])],
      relations: [],
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(CastView as never, { board })) })

    const empty = container.querySelector('[data-novel-faction="dange-pavilion"]')
    const filled = container.querySelector('[data-novel-faction="tianji"]')
    expect(empty?.textContent).toContain('尚无已接受的成员')
    expect(empty?.textContent).not.toContain('0 人')
    expect(filled?.textContent).toContain('1 人')

    await act(async () => { root.unmount() })
  })

  it('never prints a Canon key on the cast board', async () => {
    const board = buildCastBoard({ canon, relationships })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(CastView as never, { board })) })

    const text = container.textContent ?? ''
    expect(text).toContain('境界')
    expect(text).not.toContain('realm')
    expect(text).not.toContain('persona')
    // The relationship line is the author's sentence, not a machine pair.
    expect(text).toContain('顾尘→林轩')

    await act(async () => { root.unmount() })
  })

  it('says a character Canon never named is unnamed, and keeps the id beside it', async () => {
    // This work's Canon carries no `name` aspect for anyone: every character
    // would show a slug where a name belongs, and a slug reads as though the
    // tool believed it was one. Saying 未命名人物 is the truth, and the id stays
    // beside it so seven unnamed people are still seven distinguishable cards —
    // and so the gap is visible enough to be worth closing.
    const board = buildCastBoard({ canon, relationships })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => { root.render(createElement(CastView as never, { board })) })

    const named = container.querySelector('[data-novel-person="guchen"]')
    expect(named?.textContent).toContain('顾尘')
    expect(named?.textContent).not.toContain('未命名人物')

    const unnamed = container.querySelector('[data-novel-person="sumubai"]')
    expect(unnamed?.textContent).toContain('未命名人物')
    // Still identifiable: the id is there, just not posing as a name.
    expect(unnamed?.textContent).toContain('sumubai')

    await act(async () => { root.unmount() })
  })

  it('opens the 人物档案 of an unnamed character under the same wording', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(PersonFileDrawer as never, {
        file: {
          id: 'sumubai', name: 'sumubai', faction: undefined,
          aspects: [{ field: 'realm', value: '归道·归一境' }],
          relations: [], appearances: [],
        },
        onClose: () => {}, onContinueFrom: () => {},
      }))
    })

    const drawer = container.querySelector('[data-novel-person-file]')
    expect(drawer?.textContent).toContain('未命名人物')
    expect(drawer?.textContent).toContain('sumubai')

    await act(async () => { root.unmount() })
  })

  it('asks the agent for the name, so the gap can actually close', async () => {
    // The display can only be honest; it cannot fix the data. The one path that
    // can is the refinement the author already runs — and its output is a
    // proposal the author accepts item by item, so Canon is not touched by this.
    const { refineRequest } = await import('../src/client/chapter-files.js')
    const prompt = refineRequest({ number: 1, title: '开篇章' }, 5)
    expect(prompt).toContain('name')
    expect(prompt).toMatch(/名字|姓名/u)
  })
})
