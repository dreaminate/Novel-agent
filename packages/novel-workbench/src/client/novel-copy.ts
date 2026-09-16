/**
 * Author-facing copy for one proposed setting change.
 *
 * Client plugins cannot import each other's modules (each ships a standalone
 * bundle), so this is the workbench's own vocabulary rather than a shared one.
 * It is deliberately smaller than the Novel Project panel's engineering copy:
 * only the families and detail keys the review screen renders.
 */
import type { AnchoredIssue, CanonDelta } from '@novel-agent/novel-project/types'

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

/** One plain Chinese line for one proposed change. */
export function describeDelta(delta: CanonDelta): string {
  if (delta.kind === 'narrative-unit') {
    const value = delta.value as { readonly level?: unknown; readonly objective?: unknown } | null
    const level = typeof value?.level === 'string'
      ? LEVEL_LABELS[value.level] ?? '结构单元'
      : '结构单元'
    if (delta.operation === 'remove') return `删除${level}`
    const objective = typeof value?.objective === 'string' ? value.objective.trim() : ''
    return objective.length === 0 ? `新增${level}` : `新增${level}：${shorten(objective, 40)}`
  }
  if (delta.kind === 'narrative-clock') {
    const clock = CLOCK_LABELS[delta.field] ?? delta.field
    return `更新${clock}时钟`
  }
  if (delta.kind === 'narrative-debt') {
    return delta.operation === 'remove' ? '收束叙事债务' : '登记叙事债务'
  }
  const label = delta.kind === 'extension'
    ? `${delta.namespace} 设定`
    : KIND_LABELS[delta.kind] ?? delta.kind
  if (delta.operation === 'remove') return `删除${label}`
  const detail = describeValue(delta.value)
  return detail.length === 0 ? `更新${label}` : `更新${label}：${detail}`
}

/** Author-facing name for one Canon fact family. */
export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind
}

/** Severity label for one review issue. */
export function severityLabel(severity: AnchoredIssue['severity']): string {
  return SEVERITY_LABELS[severity] ?? severity
}

/** Dimension label for one review issue. */
export function dimensionLabel(dimension: string): string {
  return DIMENSION_LABELS[dimension] ?? dimension
}

/** Chinese character count without whitespace. */
export function countCharacters(text: string): number {
  return text.replace(/\s+/g, '').length
}

/**
 * Author-facing phrase for a tool the assistant used.
 *
 * The transcript shows a tool call as a line of prose, so it must not print the
 * tool's own name: `propose_novel_result_packet` and `retrieve_novel_context`
 * are the harness's vocabulary, not the author's. The names below are the ones
 * this profile actually runs, read out of its own session logs rather than
 * guessed. Anything unmapped falls back to a neutral phrase instead of leaking
 * an identifier into the manuscript.
 */
const TOOL_PHRASES: Readonly<Record<string, string>> = {
  read: '读取文件',
  write: '写入文件',
  edit: '修改文件',
  glob: '查找文件',
  grep: '在文件里搜索',
  bash: '运行命令',
  read_image: '查看图片',
  web_search: '检索资料',
  web_fetch: '读取网页',
  retrieve_novel_context: '翻查作品设定',
  rebuild_novel_index: '重建检索索引',
  propose_novel_result_packet: '整理成提案',
  propose_novel_import: '导入作品',
  publish_novel_manuscript: '导出稿件',
  simulate_novel_story_world: '推演故事走向',
  simulate_novel_reader_response: '推演读者反应',
  update_goal: '更新目标',
  todo_write: '整理待办',
  subagent: '分派子任务',
  subagent_fork: '分派子任务',
  send_message: '发送消息',
  skill: '按既有方法处理',
  workflow: '按既有流程处理',
}

/** Author-facing phrase for one tool name. */
export function toolPhrase(name: string): string {
  return TOOL_PHRASES[name] ?? '处理'
}

function describeValue(value: unknown): string {
  if (typeof value === 'string') return shorten(value.trim(), 60)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.length === 0 ? '' : `共 ${String(value.length)} 项`
  if (value === null || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of DETAIL_KEYS) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return shorten(candidate.trim(), 60)
    }
  }
  return ''
}

function shorten(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit)}…`
}
