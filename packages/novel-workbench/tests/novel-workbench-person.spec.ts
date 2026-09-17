// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type {
  NovelCanonProjection,
  NovelRelationshipProjection,
} from '@novel-agent/novel-project/types'
import { buildPersonFile } from '../src/client/novel-data.js'

/**
 * 人物档案 opens from a map node or a cast card. Everything it shows has to come
 * from accepted Canon: the aspects the AI filed for that person, the relations
 * pointing at them in **both** directions, and the accepted story events that
 * name them as a participant (which is how the file knows their chapters).
 */
const canon = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 2,
  facts: [],
  entities: [
    {
      kind: 'character-state',
      targetId: 'guchen',
      fields: {
        name: '顾辰',
        role: '天机阁阁主',
        constitution: '本尊虚无体',
        'artifact[]': ['天机罗盘', '万物母气鼎'],
      },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd1', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'faction-state',
      targetId: 'faction-tiange',
      fields: { name: '天机阁' },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd2', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'story-event',
      targetId: 'event-awaken',
      fields: {
        event: {
          storyTime: { startOrder: 1, label: '第 1 天' },
          manuscriptOrder: 1,
          participants: ['guchen'],
          location: '天机山四合院',
          effects: [],
        },
      },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd3', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'story-event',
      targetId: 'event-refusal',
      fields: {
        event: {
          storyTime: { startOrder: 9, label: '第 9 天' },
          manuscriptOrder: 2,
          participants: ['han-potian'],
          location: '柳家正厅',
          effects: [],
        },
      },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd4', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
  ],
} as unknown as NovelCanonProjection

const relationships = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 2,
  relationships: [
    {
      line: 'guchen~han-potian',
      participants: ['guchen', 'han-potian'],
      directions: [
        { pair: 'guchen->han-potian', from: 'guchen', to: 'han-potian', fields: { 'line-state': { form: '师徒', stage: '初识' } }, fieldSources: {} },
        { pair: 'han-potian->guchen', from: 'han-potian', to: 'guchen', fields: { 'line-state': { form: '师徒', stage: '立誓' } }, fieldSources: {} },
      ],
    },
    {
      line: 'linxuan~sumubai',
      participants: ['linxuan', 'sumubai'],
      directions: [
        { pair: 'linxuan->sumubai', from: 'linxuan', to: 'sumubai', fields: {}, fieldSources: {} },
      ],
    },
  ],
} as unknown as NovelRelationshipProjection

describe('novel-mode person file', () => {
  it('maps one person\u2019s aspects, both directions of their relations and their appearances', () => {
    const file = buildPersonFile({ canon, relationships, personId: 'guchen' })

    expect(file).toBeDefined()
    expect(file?.name).toBe('顾辰')
    expect(file?.aspects.map(aspect => aspect.field)).toEqual([
      'name', 'role', 'constitution', 'artifact[]',
    ])
    expect(file?.aspects.find(aspect => aspect.field === 'artifact[]')?.value).toBe('天机罗盘 · 万物母气鼎')
    // Only the line that names this person, and both of its directions.
    expect(file?.relations.map(relation => relation.id)).toEqual(['guchen~han-potian'])
    expect(file?.relations[0]?.forward).toBe('顾辰→han-potian 师徒（初识）')
    expect(file?.relations[0]?.backward).toBe('han-potian→顾辰 师徒（立誓）')
    // Appearances come from accepted story events that list them as a participant.
    expect(file?.appearances).toEqual([{ chapter: 1, label: '第 1 天' }])
  })

  it('renders the file as a drawer with the person, their relations and the continue action', async () => {
    const { PersonFileDrawer } = await import('../src/client/PersonFileDrawer.js')
    const file = buildPersonFile({ canon, relationships, personId: 'guchen' })
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const onContinue = vi.fn()
    const onClose = vi.fn()
    await act(async () => {
      root.render(createElement(PersonFileDrawer as never, {
        file,
        onClose,
        onContinueFrom: onContinue,
      }))
    })

    const drawer = container.querySelector('[data-novel-person-file="guchen"]')
    expect(drawer).not.toBeNull()
    expect(drawer?.textContent).toContain('顾辰')
    expect(drawer?.textContent).toContain('本尊虚无体')
    expect(drawer?.textContent).toContain('顾辰→han-potian 师徒（初识）')
    expect(drawer?.textContent).toContain('第 1 天')
    await act(async () => {
      drawer?.querySelector<HTMLButtonElement>('[data-novel-person-continue]')?.click()
    })
    expect(onContinue).toHaveBeenCalledWith('guchen')
    await act(async () => {
      drawer?.querySelector<HTMLButtonElement>('[data-novel-person-close]')?.click()
    })
    expect(onClose).toHaveBeenCalled()
    await act(async () => { root.unmount() })
  })
})
