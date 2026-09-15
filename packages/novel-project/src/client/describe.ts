import type { AnchoredIssue } from '../types.js'

/** One structural Delta envelope as it appears inside a reviewable Result Packet. */
interface DescribableDelta {
  readonly kind: string
  readonly operation: 'set' | 'remove'
  readonly targetId: string
  readonly field?: string | undefined
  readonly value?: unknown
  readonly namespace?: string | undefined
}

const KIND_LABELS: Readonly<Record<string, string>> = {
  canon: '作品事实',
  'creative-profile': '创作画像',
  'reader-contract': '读者契约',
  world: '世界规则',
  'faction-state': '势力状态',
  'location-state': '地点状态',
  'object-state': '物件状态',
  'story-event': '故事事件',
  'chapter-state': '章节状态',
  'character-state': '人物状态',
  'emotion-state': '情绪状态',
  progression: '能力成长',
  relationship: '人物关系',
  knowledge: '认知边界',
  promise: '承诺',
  clue: '线索',
  mystery: '谜团',
  ending: '结局',
  roadmap: '路线图',
  timeline: '时间线',
  'narrative-unit': '故事结构',
  'narrative-clock': '叙事时钟',
  'narrative-debt': '叙事债务',
  extension: '扩展设定',
}

const CLOCK_LABELS: Readonly<Record<string, string>> = {
  plot: '主线',
  promise: '承诺',
  character: '人物',
  relationship: '关系',
  progression: '成长',
  'reader-knowledge': '读者认知',
  mystery: '谜团',
  tension: '张力',
  emotion: '情绪',
  ending: '结局',
}

const LEVEL_LABELS: Readonly<Record<string, string>> = {
  series: '系列',
  book: '书',
  volume: '卷',
  arc: '篇章',
  chapter: '章',
  scene: '场景',
  beat: '节拍',
}

const SEVERITY_LABELS: Readonly<Record<AnchoredIssue['severity'], string>> = {
  critical: '严重',
  major: '重要',
  minor: '提示',
}

const DIMENSION_LABELS: Readonly<Record<string, string>> = {
  structure: '结构',
  pacing: '节奏',
  continuity: '连续性',
  foreshadowing: '伏笔',
  payoff: '兑现',
  style: '风格',
  voice: '语言',
  character: '人物',
  world: '世界观',
  'reader-contract': '读者契约',
  knowledge: '认知',
  timeline: '时间线',
}

const DETAIL_KEYS = [
  'objective',
  'statement',
  'summary',
  'question',
  'description',
  'coreExperience',
  'genreMix',
  'reason',
  'text',
] as const

export function deltaKindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind
}

export function clockLabel(clock: string): string {
  return CLOCK_LABELS[clock] ?? clock
}

export function issueSeverityLabel(severity: AnchoredIssue['severity']): string {
  return SEVERITY_LABELS[severity] ?? severity
}

export function issueDimensionLabel(dimension: string): string {
  return DIMENSION_LABELS[dimension] ?? dimension
}

/** Describe one Delta as one plain Chinese line; identifiers stay in the technical fold. */
export function describeDelta(delta: DescribableDelta): string {
  if (delta.kind === 'narrative-unit') {
    const value = delta.value as { readonly level?: unknown; readonly objective?: unknown } | null
    const level = typeof value?.level === 'string' ? LEVEL_LABELS[value.level] ?? '结构单元' : '结构单元'
    if (delta.operation === 'remove') return `删除${level}`
    const objective = typeof value?.objective === 'string' ? value.objective.trim() : ''
    return objective.length === 0 ? `新增${level}` : `新增${level}：${truncate(objective, 40)}`
  }
  if (delta.kind === 'narrative-clock') {
    const clock = typeof delta.field === 'string' ? CLOCK_LABELS[delta.field] ?? delta.field : '叙事'
    return `更新${clock}时钟`
  }
  if (delta.kind === 'narrative-debt') {
    return delta.operation === 'remove' ? '收束叙事债务' : '登记叙事债务'
  }
  const label = delta.kind === 'extension' && delta.namespace !== undefined
    ? `${delta.namespace} 设定`
    : deltaKindLabel(delta.kind)
  if (delta.operation === 'remove') return `删除${label}`
  const detail = describeValue(delta.value)
  return detail.length === 0 ? `更新${label}` : `更新${label}：${detail}`
}

/** Describe one Issue as a plain Chinese line without anchor identifiers. */
export function describeIssue(issue: AnchoredIssue): string {
  return `${issueSeverityLabel(issue.severity)} · ${issueDimensionLabel(issue.dimension)}：${issue.problem.trim()}`
}

/** Summarize the reviewable scope of one packet in plain Chinese. */
export function describePacketSummary(packet: {
  readonly manuscript?: unknown
  readonly deltas: readonly unknown[]
  readonly issues: readonly unknown[]
}): string {
  const parts: string[] = []
  if (packet.manuscript !== undefined) parts.push('正文 1 篇')
  parts.push(`${String(packet.deltas.length)} 条设定变更`)
  parts.push(`${String(packet.issues.length)} 个审阅问题`)
  return parts.join(' · ')
}

/** Count Chinese manuscript characters without whitespace. */
export function countManuscriptCharacters(text: string): number {
  return text.replace(/\s+/g, '').length
}

/** One-line revision summary used by the history view. */
export function describeRevisionSummary(revision: {
  readonly revision: number
  readonly manuscript?: {
    readonly title?: string | undefined
    readonly text?: string | undefined
  } | undefined
  readonly deltas: readonly unknown[]
  readonly issues: readonly unknown[]
  readonly rollbackOfRevision?: number | undefined
}): string {
  const parts = [revision.manuscript?.title ?? '立项提案']
  if (revision.manuscript?.text !== undefined) {
    parts.push(`约 ${String(countManuscriptCharacters(revision.manuscript.text))} 字`)
  }
  parts.push(`${String(revision.deltas.length)} 条设定变更`)
  parts.push(`${String(revision.issues.length)} 个审阅问题`)
  if (revision.rollbackOfRevision !== undefined) {
    parts.push(`回滚自 R${String(revision.rollbackOfRevision)}`)
  }
  return parts.join(' · ')
}

function describeValue(value: unknown): string {
  if (typeof value === 'string') return truncate(value.trim(), 60)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length === 0 ? '' : `共 ${String(value.length)} 项`
  if (value === null || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of DETAIL_KEYS) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return truncate(candidate.trim(), 60)
    }
  }
  return ''
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit)}…`
}
