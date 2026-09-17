// @vitest-environment jsdom
import './webgl-env.js'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import type {
  NovelCanonProjection,
  NovelChapterControlPack,
  NovelNarrativeProjection,
} from '@novel-agent/novel-project/types'
import {
  buildChapterContract,
  buildClueBoard,
  buildDebtBoard,
  buildMemoryBoard,
  buildCastBoard,
  buildTimeline,
  buildWorkOutline,
} from '../src/client/novel-data.js'

/**
 * The prototype's 伏笔与线索板 reads accepted Canon facts whose kind is
 * `promise`, `clue` or `mystery`. This fixture is the smallest accepted
 * projection carrying two of them plus one fact the board must ignore, so the
 * mapping is asserted against the shapes the Remote returns.
 */
const canon = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 5,
  facts: [],
  entities: [
    {
      kind: 'promise',
      targetId: 'P2',
      fields: {
        statement: '3 号冷库的铅封被换过',
        status: 'progress',
        window: '第 6–8 章',
        note: '第 6 章提案确认为人为调换',
      },
      fieldSources: {},
      sourceRevision: 4,
      sourceDeltaId: 'd-p2',
      sourceAnchorIds: ['chapter-4#seal'],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'clue',
      targetId: 'C1',
      fields: {
        statement: '货单 KC-0413 与失踪夜同批出港',
        status: 'progress',
      },
      fieldSources: {},
      sourceRevision: 1,
      sourceDeltaId: 'd-c1',
      sourceAnchorIds: ['chapter-1#manifest'],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'character-state',
      targetId: 'chen-mo',
      fields: { name: '陈默', status: 'suspended' },
      fieldSources: {},
      sourceRevision: 1,
      sourceDeltaId: 'd-cm',
      sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
  ],
} as unknown as NovelCanonProjection

const narrative = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 5,
  units: [
    { id: 'chapter-1', level: 'chapter', order: 1, parentId: null, objective: '', sourceRevision: 1 },
    { id: 'chapter-4', level: 'chapter', order: 4, parentId: null, objective: '', sourceRevision: 1 },
  ],
  clocks: [],
} as unknown as NovelNarrativeProjection

describe('novel-mode clue board', () => {
  it('maps the promise and clue Canon facts the prototype board lists', () => {
    const board = buildClueBoard({ canon, narrative })

    expect(board.revision).toBe(5)
    expect(board.rows.map(row => row.id)).toEqual(['P2', 'C1'])
    expect(board.rows[0]).toMatchObject({
      typeLabel: '伏笔',
      text: '3 号冷库的铅封被换过',
      statusLabel: '推进中',
      statusKey: 'progress',
      // The anchor names `chapter-4`, whose position in narrative order is the
      // second chapter; the board shows the reader's number, not the unit id.
      chapter: 2,
      window: '第 6–8 章',
      note: '第 6 章提案确认为人为调换',
    })
    expect(board.rows[1]).toMatchObject({
      typeLabel: '线索',
      text: '货单 KC-0413 与失踪夜同批出港',
      statusKey: 'progress',
      chapter: 1,
    })
  })

  it('renders the board the prototype draws, with its rows and anchors', async () => {
    const { ClueBoardView } = await import('../src/client/ClueBoardView.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const board = buildClueBoard({ canon, narrative })
    await act(async () => {
      root.render(createElement(ClueBoardView, { board }))
    })

    const section = container.querySelector('[data-novel-clues]')
    expect(section).not.toBeNull()
    expect(section?.querySelectorAll('[data-novel-clue]')).toHaveLength(2)
    const first = section?.querySelector('[data-novel-clue="P2"]')
    expect(first?.textContent).toContain('伏笔')
    expect(first?.textContent).toContain('3 号冷库的铅封被换过')
    expect(first?.textContent).toContain('推进中')
    expect(first?.textContent).toContain('第 2 章')
    expect(first?.textContent).toContain('第 6–8 章')
    await act(async () => { root.unmount() })
  })
})

/**
 * The 未收束债务板 reads the debts Canon keeps per narrative clock. The fixture
 * carries one debt whose clock moved after it was opened and one that never
 * moved, so the board's ordering and its age both have something to show.
 */
const debtNarrative = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 5,
  units: [
    { id: 'chapter-1', level: 'chapter', order: 1, parentId: null, objective: '', sourceRevision: 1 },
    { id: 'chapter-2', level: 'chapter', order: 2, parentId: null, objective: '', sourceRevision: 2 },
    { id: 'chapter-3', level: 'chapter', order: 3, parentId: null, objective: '', sourceRevision: 3 },
    { id: 'chapter-4', level: 'chapter', order: 4, parentId: null, objective: '', sourceRevision: 4 },
    { id: 'chapter-5', level: 'chapter', order: 5, parentId: null, objective: '', sourceRevision: 5 },
  ],
  clocks: [
    {
      clock: 'mystery',
      entries: [
        { unitId: 'chapter-5', clock: 'mystery', movement: 'remind', state: 'progress', sourceRevision: 5 },
      ],
      debts: [
        {
          id: 'D1',
          unitId: 'chapter-3',
          clock: 'mystery',
          summary: '02:41 这个时间点还没有任何解释',
          status: 'open',
          horizon: '第 9–11 章',
          sourceRevision: 3,
          sourceDeltaId: 'd-d1',
          sourceAnchorIds: ['chapter-3#sms'],
          provenance: { agentId: 'a', packetId: 'k' },
        },
      ],
    },
    {
      clock: 'object',
      entries: [],
      debts: [
        {
          id: 'D2',
          unitId: 'chapter-2',
          clock: 'object',
          summary: '录音笔下落未明',
          status: 'open',
          sourceRevision: 2,
          sourceDeltaId: 'd-d2',
          sourceAnchorIds: ['chapter-2#recorder'],
          provenance: { agentId: 'a', packetId: 'k' },
        },
        {
          id: 'D3',
          unitId: 'chapter-1',
          clock: 'object',
          summary: '已收束的旧债',
          status: 'resolved',
          sourceRevision: 1,
          sourceDeltaId: 'd-d3',
          sourceAnchorIds: [],
          provenance: { agentId: 'a', packetId: 'k' },
        },
      ],
    },
  ],
} as unknown as NovelNarrativeProjection

describe('novel-mode debt board', () => {
  it('orders open debts by how long their clock has stood still and ignores resolved ones', () => {
    const board = buildDebtBoard({ narrative: debtNarrative, chapterCount: 5 })

    expect(board.rows.map(row => row.id)).toEqual(['D2', 'D1'])
    expect(board.rows[0]).toMatchObject({
      summary: '录音笔下落未明',
      age: 3,
      chapter: 2,
      clockLabel: '物件',
      level: 'warn',
      horizon: undefined,
    })
    expect(board.rows[1]).toMatchObject({
      age: 2,
      chapter: 3,
      clockLabel: '谜团',
      horizon: '第 9–11 章',
      // The prototype marks 临期 only past three chapters without progress, so a
      // debt whose clock moved two chapters ago stays informational.
      level: 'info',
    })
  })

  it('renders the prototype debt rows with their summary cards', async () => {
    const { DebtBoardView } = await import('../src/client/DebtBoardView.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const board = buildDebtBoard({ narrative: debtNarrative, chapterCount: 5 })
    await act(async () => {
      root.render(createElement(DebtBoardView, { board }))
    })

    const section = container.querySelector('[data-novel-debts]')
    expect(section).not.toBeNull()
    expect(section?.querySelectorAll('[data-novel-debt]')).toHaveLength(2)
    expect(section?.textContent).toContain('临期提醒（已超过 3 章未推进）')
    const first = section?.querySelector('[data-novel-debt="D2"]')
    expect(first?.textContent).toContain('录音笔下落未明')
    expect(first?.textContent).toContain('3 章未推进')
    expect(first?.textContent).toContain('让 AI 推进')
    await act(async () => { root.unmount() })
  })
})

/**
 * 本章合同 renders the Chapter contract planning accepted: viewpoint, story
 * time, the promises it must move, what must not contradict, and the gates the
 * chapter is judged by. The fixture is one accepted Chapter plus its ancestry.
 */
const contract = {
  projectId: 'p',
  workspaceId: 'ws',
  sourceRevision: 5,
  headRevision: 5,
  freshness: 'current',
  chapter: {
    id: 'chapter-6',
    level: 'chapter',
    parentId: 'volume-2',
    order: 6,
    objective: '下到 3 号冷库的通道',
    entryState: '陈默拿到钥匙',
    exitState: '通道入口被发现',
    status: 'planned',
    chapterContract: {
      viewpoint: '陈默',
      storyTime: '第 41 天夜',
      sceneFunctions: ['确认通道存在'],
      activePlotLineIds: ['plot-1'],
      activeRelationshipLineIds: ['chen-mo->bai-hua'],
      promisesTouched: [{ promiseId: 'P2', intendedMovement: 'confirm' }],
      informationPolicy: { readerMayKnow: ['通道存在'], characterMayKnow: [] },
      progressionSetups: [],
      progressionPayoffs: [],
      emotionalMovement: '警觉',
      endingPull: '章末留下通道尽头的悬念',
      prohibitedContradictions: ['陈默左臂的伤还没好'],
      styleConstraints: ['保持第三人称限知'],
      lengthRange: { min: 2500, max: 3200 },
      acceptanceGates: ['必须出现：铅封钥匙'],
    },
    sourceRevision: 5,
    sourceDeltaId: 'd-ch6',
    sourceAnchorIds: [],
    provenance: { agentId: 'a', packetId: 'k' },
  },
  scope: [
    { id: 'volume-2', level: 'volume', parentId: null, order: 2, objective: '', entryState: '', exitState: '', status: 'planned', sourceRevision: 5, sourceDeltaId: 'd-v2', sourceAnchorIds: [], provenance: { agentId: 'a', packetId: 'k' } },
  ],
  sceneBeats: [
    { id: 'scene-1', level: 'scene', parentId: 'chapter-6', order: 1, objective: '在通道口遇到险情', entryState: '', exitState: '', status: 'planned', sourceRevision: 5, sourceDeltaId: 'd-s1', sourceAnchorIds: [], provenance: { agentId: 'a', packetId: 'k' } },
  ],
  canonLockResolution: { resolved: [], unavailableAtRevision: [] },
  referenceResolution: {
    plotLines: {
      resolved: [],
      missing: ['plot-missing'],
    },
    relationshipLines: { resolved: [], missing: [] },
    promises: { resolved: [], missing: ['P9'] },
  },
  clocks: [],
  recentManuscripts: [],
  recentPostChapterChecks: [],
  writingMemory: { characterCarryForward: [], characterArcHypotheses: [] },
} as unknown as NovelChapterControlPack

describe('novel-mode chapter contract', () => {
  it('maps the accepted Chapter contract into the prototype contract rows', () => {
    const view = buildChapterContract(contract)

    expect(view.chapterNumber).toBe(6)
    expect(view.title).toBe('下到 3 号冷库的通道')
    expect(view.rows.map(row => row.label)).toEqual([
      '视角',
      '故事时间',
      '必须出现',
      '禁止矛盾',
      '长度范围',
      '接受标准',
      '场景',
    ])
    expect(view.rows[0]?.value).toBe('陈默')
    expect(view.rows[2]?.items).toEqual(['铅封钥匙'])
    expect(view.rows[3]?.items).toEqual(['陈默左臂的伤还没好'])
    expect(view.rows[4]?.value).toBe('2,500 – 3,200 字')
    expect(view.gaps).toEqual(['情节线 plot-missing 在本修订不存在', '伏笔 P9 在本修订不存在'])
  })

  it('renders the contract sheet with its rows and gaps', async () => {
    const { ChapterContractView } = await import('../src/client/ChapterContractView.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(ChapterContractView, { contract: buildChapterContract(contract) }))
    })

    const sheet = container.querySelector('[data-novel-contract="chapter-6"]')
    expect(sheet).not.toBeNull()
    expect(sheet?.textContent).toContain('第 6 章《下到 3 号冷库的通道》')
    expect(sheet?.querySelectorAll('[data-novel-contract-row]')).toHaveLength(7)
    expect(sheet?.querySelector('[data-novel-contract-row="视角"]')?.textContent).toContain('陈默')
    expect(sheet?.querySelector('[data-novel-contract-row="必须出现"]')?.textContent).toContain('铅封钥匙')
    expect(sheet?.querySelector('[data-novel-contract-gaps]')?.textContent).toContain('伏笔 P9 在本修订不存在')
    await act(async () => { root.unmount() })
  })
})

/**
 * 时间线 orders accepted story events by the story time Canon records, and
 * cross-references the chapter each event was accepted in.
 */
const timelineCanon = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 5,
  facts: [],
  entities: [
    {
      kind: 'story-event',
      targetId: 'event-sms',
      fields: {
        event: {
          storyTime: { startOrder: 3, label: '第 3 天' },
          manuscriptOrder: 3,
          participants: ['hei-zai'],
          location: '沉船酒吧',
          effects: [],
        },
      },
      fieldSources: {},
      sourceRevision: 3,
      sourceDeltaId: 'd-e1',
      sourceAnchorIds: ['chapter-3#sms'],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'story-event',
      targetId: 'event-stair',
      fields: {
        event: {
          storyTime: { startOrder: 41, label: '第 41 天 · 当下' },
          manuscriptOrder: 6,
          participants: ['chen-mo', 'bai-hua'],
          location: '3 号冷库地下通道',
          effects: [],
        },
      },
      fieldSources: {},
      sourceRevision: 5,
      sourceDeltaId: 'd-e2',
      sourceAnchorIds: ['chapter-6#stairs'],
      provenance: { agentId: 'a', packetId: 'k' },
    },
  ],
} as unknown as NovelCanonProjection

describe('novel-mode timeline', () => {
  it('orders accepted story events by story time and cross-references their chapter', () => {
    const board = buildTimeline({ canon: timelineCanon, narrative: debtNarrative })

    expect(board.rows.map(row => row.id)).toEqual(['event-sms', 'event-stair'])
    expect(board.rows[0]).toMatchObject({
      label: '第 3 天',
      chapter: 3,
      location: '沉船酒吧',
      current: false,
    })
    expect(board.rows[1]).toMatchObject({
      label: '第 41 天 · 当下',
      chapter: 6,
      location: '3 号冷库地下通道',
      current: true,
    })
    expect(board.rows[1]?.participants).toEqual(['chen-mo', 'bai-hua'])
  })
})

describe('novel-mode writing memory', () => {
  it('summarises the newest accepted facts the AI writes from, with their revision', () => {
    const board = buildMemoryBoard({ canon: timelineCanon, limit: 3 })

    expect(board.revision).toBe(5)
    // Two accepted story events in the fixture, and the limit only caps the list.
    expect(board.rows).toHaveLength(2)
    // Newest accepted revision first: the chapter-6 event outranks the chapter-3 one.
    expect(board.rows[0]).toMatchObject({
      id: 'story-event/event-stair',
      revision: 5,
      sourceLabel: '故事事件',
    })
    expect(board.rows[0]?.detail).toContain('第 41 天 · 当下')
    expect(board.rows.every(row => row.revision <= 5)).toBe(true)
  })
})

/**
 * The work tree groups chapters by Volume. Canon's chain puts arc and volume
 * between a book and its chapters, so grouping by the immediate parent would
 * print one heading per arc and name it after the wrong level.
 */
const chainNarrative = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 1,
  units: [
    { id: 'series-1', level: 'series', order: 1, parentId: null, objective: '全书', sourceRevision: 1 },
    { id: 'book-1', level: 'book', order: 1, parentId: 'series-1', objective: '卷一《天机入世》', sourceRevision: 1 },
    { id: 'volume-1', level: 'volume', order: 1, parentId: 'book-1', objective: '天机入世', sourceRevision: 1 },
    { id: 'arc-1', level: 'arc', order: 1, parentId: 'volume-1', objective: '开篇章', sourceRevision: 1 },
    { id: 'chapter-1', level: 'chapter', order: 1, parentId: 'arc-1', objective: '顾辰在废弃四合院醒来', sourceRevision: 1 },
    { id: 'chapter-2', level: 'chapter', order: 2, parentId: 'arc-1', objective: '柳家登门退婚', sourceRevision: 1 },
  ],
  clocks: [],
} as unknown as NovelNarrativeProjection

describe('novel-mode work tree', () => {
  it('groups chapters by their Volume and names the heading after it', () => {
    const outline = buildWorkOutline({
      project: { acceptedRevision: 1 } as never,
      narrative: chainNarrative,
      manuscripts: [],
      proposals: [],
    })

    expect(outline.groups).toHaveLength(1)
    expect(outline.groups[0]?.id).toBe('volume-1')
    expect(outline.groups[0]?.title).toBe('卷一 · 天机入世')
    expect(outline.groups[0]?.chapters.map(chapter => chapter.id)).toEqual(['chapter-1', 'chapter-2'])
    expect(outline.groups[0]?.chapters.map(chapter => chapter.number)).toEqual([1, 2])
    expect(outline.chapterCount).toBe(2)
  })
})

// 正文阅读 used to be a canvas of its own and had its coverage here. It is the
// editor's reading state now — one document in two states — so those assertions
// moved to `novel-workbench-editor.spec.ts` with the surface. The old entry is
// gone rather than hidden: no view id, no rail entry, no head copy.

describe('novel-mode missing-plugin boundary', () => {
  it('explains a missing domain plugin and offers a retry instead of a raw error', async () => {
    const { NovelCanvas } = await import('../src/client/NovelCanvas.js')
    const { workbenchActions } = await import('../src/client/store.js')
    workbenchActions.setCurrentSession('session-3' as never)
    workbenchActions.setView('contract')

    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const work = { workspaceId: 'ws-3', path: '/books/x', title: '天机阁主', sessionIds: ['session-3'], createdAt: '', updatedAt: '' }
    await act(async () => {
      root.render(createElement(NovelCanvas as never, {
        sessionId: 'session-3',
        useWorkspaces: (selector: (value: unknown) => unknown) => selector({ items: [work] }),
        useSessions: (selector: (value: unknown) => unknown) => selector({
          current: 'session-3', ids: ['session-3'], byId: {}, jobsBySession: {}, subagentsByParent: {},
        }),
        // What the Host answers when the planning plugin is not installed.
        loadOutline: async () => {
          throw new Error("打开作品失败：novel project has no 'planning/narrative' projector registered; install the domain plugin that registers it")
        },
      } as never))
    })
    await act(async () => {})

    const card = container.querySelector('[data-novel-missing-plugin]')
    expect(card).not.toBeNull()
    expect(card?.textContent).toContain('缺插件')
    expect(card?.textContent).toContain('未安装小说规划插件')
    expect(card?.textContent).toContain('planning/narrative')
    expect(card?.querySelector('[data-novel-missing-plugin-retry]')).not.toBeNull()
    expect(card?.querySelector('[data-novel-missing-plugin-map]')).not.toBeNull()
    await act(async () => { root.unmount() })
  })
})

/**
 * 人物与关系 reads accepted character and faction facts plus the bidirectional
 * relationship projection, where each direction of a pair carries its own state.
 */
const castCanon = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 2,
  facts: [],
  entities: [
    {
      kind: 'character-state',
      targetId: 'guchen',
      fields: { name: '顾辰', faction: 'faction-tiange', status: '天机阁阁主', emotion: '沉稳' },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd1', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'character-state',
      targetId: 'han-potian',
      // The AI records a character one aspect at a time and does not always
      // write a name or a faction, so the board has to read what is there.
      fields: {
        constitution: '身怀至尊骨（万古神体榜第五）',
        realm: '出场时尚未正式踏入凡尘境',
      },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd2', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'faction-state',
      targetId: 'faction-tiange',
      fields: { name: '天机阁', agenda: '重建情报网' },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd3', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
    {
      kind: 'faction-state',
      targetId: 'faction-liu',
      fields: { name: '柳家', agenda: '退婚并吞并田产' },
      fieldSources: {}, sourceRevision: 2, sourceDeltaId: 'd4', sourceAnchorIds: [],
      provenance: { agentId: 'a', packetId: 'k' },
    },
  ],
} as unknown as NovelCanonProjection

const castRelationships = {
  projectId: 'p',
  workspaceId: 'ws',
  revision: 2,
  relationships: [
    {
      line: 'guchen~han-potian',
      participants: ['guchen', 'han-potian'],
      directions: [
        {
          pair: 'guchen->han-potian',
          from: 'guchen',
          to: 'han-potian',
          fields: { 'line-state': { form: '师徒', stage: '初识', unresolvedDebts: [{ id: 'D1' }] } },
          fieldSources: {},
        },
        {
          pair: 'han-potian->guchen',
          from: 'han-potian',
          to: 'guchen',
          fields: { 'line-state': { form: '师徒', stage: '试探' } },
          fieldSources: {},
        },
      ],
    },
  ],
} as unknown as NovelRelationshipProjection

describe('novel-mode cast board', () => {
  it('maps people, factions and both directions of every relationship line', () => {
    const board = buildCastBoard({ canon: castCanon, relationships: castRelationships })

    expect(board.revision).toBe(2)
    // Sorting is by display name; the aspect-only character falls back to its id.
    // Chinese collation puts 顾辰 before the id-only character.
    expect(board.people.map(person => person.id)).toEqual(['guchen', 'han-potian'])
    expect(board.people.map(person => person.name)).toEqual(['顾辰', 'han-potian'])
    expect(board.people[0]).toMatchObject({
      id: 'guchen',
      faction: '天机阁',
      emotion: '沉稳',
      summary: '天机阁阁主',
      aspectNames: ['name', 'faction', 'status', 'emotion'],
    })
    expect(board.people[1]).toMatchObject({
      summary: '身怀至尊骨（万古神体榜第五）',
      aspects: 2,
      aspectNames: ['constitution', 'realm'],
    })
    // Factions sort by name, and each carries the people Canon files under it.
    expect(board.factions.map(faction => faction.name)).toEqual(['柳家', '天机阁'])
    expect(board.factions[1]?.people).toEqual(['guchen'])
    expect(board.factions[0]?.people).toEqual([])
    expect(board.relations).toHaveLength(1)
    expect(board.relations[0]).toMatchObject({
      id: 'guchen~han-potian',
      // A relationship line is stored between entity ids but written for the
      // author: the ends are the names Canon holds, and an id only where it
      // holds none.
      forward: '顾辰→han-potian 师徒（初识）',
      backward: 'han-potian→顾辰 师徒（试探）',
      debts: 1,
    })
  })
})
