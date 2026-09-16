/**
 * 本章合同: the Chapter contract the author and the AI agreed on before writing.
 *
 * The prototype's sheet opens with the unit line and a status chip, then the
 * labelled rows (视角 / 故事时间 / 必须出现 / 禁止矛盾 / 长度范围 / 接受标准 /
 * 场景) and closes with the two ways out — review the proposal or read the
 * accepted text. Contract references Canon cannot resolve at this revision show
 * up as gaps rather than as missing rows.
 */
import { createElement, type ReactNode } from 'react'
import type { NovelChapterContractView } from './novel-data.js'

/** Everything the sheet receives: the mapped contract plus its two exits. */
export interface ChapterContractViewProps {
  readonly contract: NovelChapterContractView
  readonly onReview?: () => void
  readonly onRead?: () => void
}

/** The sheet. */
export function ChapterContractView(props: ChapterContractViewProps): ReactNode {
  const { contract } = props
  return createElement(
    'section',
    { 'data-novel-contract': contract.unitId },
    createElement(
      'div',
      { className: 'card plain', style: { marginBottom: '16px' } },
      createElement(
        'div',
        { className: 'card-h' },
        createElement(
          'span',
          { className: 't' },
          `${contract.volumeTitle ?? '本章'} · 第 ${String(contract.chapterNumber)} 章《${contract.title}》`,
        ),
        createElement(
          'span',
          { className: 'r' },
          createElement(
            'span',
            { className: `chip ${contract.status === 'accepted' ? 'ok' : 'accent'}` },
            contract.status === 'accepted' ? `已按此合同接受 R${String(contract.revision)}` : '按此合同生成的提案待审',
          ),
        ),
      ),
      contract.rows.map(row => createElement(
        'div',
        {
          key: row.label,
          className: 'row',
          'data-novel-contract-row': row.label,
          style: { alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderTop: '1px solid hsl(var(--border-100))' },
        },
        createElement(
          'span',
          { style: { flex: 'none', width: '76px', fontSize: '12px', color: 'hsl(var(--text-200) / .72)' } },
          row.label,
        ),
        createElement(
          'span',
          { style: { fontSize: '13px' } },
          row.items === undefined
            ? row.value ?? '—'
            : row.items.map(item => createElement(
                'span',
                { className: 'tag', key: item, style: { marginRight: '6px' } },
                item,
              )),
        ),
      )),
    ),
    contract.gaps.length > 0 && createElement(
      'div',
      { className: 'err-card', 'data-novel-contract-gaps': 'true' },
      createElement('span', { className: 'chip err' }, '合同缺口'),
      createElement(
        'p',
        { className: 'note', style: { marginTop: '8px' } },
        `这些引用在本修订不存在：${contract.gaps.join('；')}`,
      ),
    ),
    createElement(
      'div',
      { className: 'row', style: { gap: '8px', marginTop: '18px', display: 'flex' } },
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn primary',
          onClick: () => { props.onReview?.() },
        },
        '去审阅提案',
      ),
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn',
          onClick: () => { props.onRead?.() },
        },
        '读已接受正文',
      ),
    ),
  )
}
