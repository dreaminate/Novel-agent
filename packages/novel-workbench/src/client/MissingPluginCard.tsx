/**
 * 缺插件: the boundary state a profile lands in when a domain plugin is not
 * installed. Novel Project answers with its own domain-unavailable error
 * (`novel project has no 'planning/narrative' projector registered`), and the
 * prototype's answer to that is a card that names the missing piece, says which
 * surfaces still work, and offers 重试检测 — not a raw error string.
 */
import { createElement, type ReactNode } from 'react'

/** One recognised domain gap: the namespace the Host named plus what it powers. */
export interface MissingDomainPlugin {
  /** Namespace the Host reported, e.g. `planning/narrative`. */
  readonly namespace: string
  /** Author-facing name of the plugin that registers it. */
  readonly plugin: string
  /** What stops working while it is absent. */
  readonly impact: string
}

/**
 * Recognise Novel Project's domain-unavailable answer. Anything else stays a
 * plain error: this card only speaks for a missing domain plugin.
 */
export function missingDomainPlugin(error: string): MissingDomainPlugin | undefined {
  const namespace = /has no '([^']+)' (?:projector|extension) registered/.exec(error)?.[1]
  if (namespace === undefined) return undefined
  const [domain] = namespace.split('/')
  const known: Readonly<Record<string, { plugin: string; impact: string }>> = {
    planning: {
      plugin: '小说规划插件（novel-planning）',
      impact: '卷章结构、章节合同与时间线都来自它',
    },
    memory: {
      plugin: '写作记忆插件（novel-memory）',
      impact: '关系投影、控制包与检索都来自它',
    },
    writing: {
      plugin: '写作插件（novel-writing）',
      impact: '正文投影与提案记账都来自它',
    },
  }
  const entry = known[domain ?? ''] ?? {
    plugin: `提供「${namespace}」的领域插件`,
    impact: '依赖它的画布会停用',
  }
  return { namespace, plugin: entry.plugin, impact: entry.impact }
}

/** Everything the card receives. */
export interface MissingPluginCardProps {
  readonly gap: MissingDomainPlugin
  /** Re-run whatever failed, so the card clears as soon as the plugin lands. */
  readonly onRetry: () => void
  /** Leave for a canvas that does not depend on the missing plugin. */
  readonly onBackToMap: () => void
}

/** The card. */
export function MissingPluginCard(props: MissingPluginCardProps): ReactNode {
  return createElement(
    'div',
    { className: 'err-card', 'data-novel-missing-plugin': props.gap.namespace },
    createElement(
      'div',
      { className: 'row', style: { gap: '6px', display: 'flex', alignItems: 'center' } },
      createElement('span', { className: 'chip err' }, '缺插件'),
      createElement('span', { className: 'chip num' }, props.gap.namespace),
    ),
    createElement('h3', { style: { marginTop: '10px' } }, `未安装${props.gap.plugin}`),
    createElement(
      'p',
      { className: 'note', style: { marginTop: '8px' } },
      `${props.gap.impact}。装好之后这一页会自动恢复；故事地图、正文、伏笔与版本历史不受影响，可以继续用。`,
    ),
    createElement(
      'div',
      { className: 'row', style: { gap: '8px', marginTop: '14px', display: 'flex' } },
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn primary',
          'data-novel-missing-plugin-retry': 'true',
          onClick: () => { props.onRetry() },
        },
        '重试检测',
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn',
          'data-novel-missing-plugin-map': 'true',
          onClick: () => { props.onBackToMap() },
        },
        '回到地图',
      ),
    ),
  )
}
