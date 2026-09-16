/**
 * 设置: the sheet behind the topbar's 设置 button.
 *
 * The prototype keeps four author choices here — theme, 正文字号, 阅读行宽 and
 * whether threads show tool activity. Only the first three are offered: the
 * transcript belongs to the shipped conversation surface, so a 工具活动 switch
 * could be remembered but never honored, and this sheet does not carry controls
 * it cannot deliver. The reading choices are not decoration: the 正文阅读 canvas
 * reads them from the same store, so what the author picks here is what the text
 * does.
 */
import { createElement, useEffect, type ReactNode } from 'react'
import { useWorkbenchState, workbenchActions, type WorkbenchTheme } from './store.js'

/** Sheet rules: the frame's own overlay above the three columns. */
const SETTINGS_CSS = `
[data-novel-settings] {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 84px;
  background: hsl(var(--text-000) / .18);
}
[data-novel-settings] .sheet {
  width: min(520px, calc(100% - 48px));
  background: hsl(var(--bg-000));
  border: 1px solid hsl(var(--border-100));
  border-radius: var(--r-card);
  box-shadow: var(--sh-3);
  padding: var(--s5);
}
[data-novel-settings] .sheet-head {
  display: flex; align-items: center; gap: var(--s2);
  margin-bottom: var(--s4);
}
[data-novel-settings] .sheet-head h2 { margin: 0; font-size: var(--fs-16); }
[data-novel-settings] .sheet-head .btn { margin-left: auto; }
[data-novel-settings] .setting + .setting {
  margin-top: var(--s4);
  padding-top: var(--s4);
  border-top: 1px solid hsl(var(--border-100));
}
[data-novel-settings] .setting-label { font-size: var(--fs-13); margin-bottom: var(--s2); }
[data-novel-settings] .setting-note { font-size: var(--fs-12); color: hsl(var(--text-200) / .75); margin-top: var(--s2); }
`

/** The theme choices, in the prototype's order. */
const THEMES: readonly { readonly id: WorkbenchTheme; readonly label: string }[] = [
  { id: 'auto', label: '跟随系统' },
  { id: 'day', label: '日间' },
  { id: 'night', label: '夜间' },
]

/** The sheet; renders nothing while it is closed. */
export function NovelSettings(): ReactNode {
  const state = useWorkbenchState()
  const open = state.settingsOpen

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') workbenchActions.closeSettings()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [open])

  if (!open) return null
  const { settings } = state

  const segment = (
    attribute: string,
    active: boolean,
    label: string,
    onClick: () => void,
  ): ReactNode => createElement(
    'button',
    {
      key: label,
      type: 'button',
      [attribute]: label,
      'aria-pressed': active ? 'true' : 'false',
      onClick,
    },
    label,
  )

  return createElement(
    'div',
    {
      'data-novel-settings': 'true',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '设置',
      onClick: (event: { target: unknown; currentTarget: unknown }) => {
        if (event.target === event.currentTarget) workbenchActions.closeSettings()
      },
    },
    createElement(
      'div',
      { className: 'sheet', style: { position: 'relative' } },
      createElement('style', null, SETTINGS_CSS),
      createElement(
        'div',
        { className: 'sheet-head' },
        createElement('h2', null, '设置'),
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn sm',
            'data-novel-settings-close': 'true',
            onClick: () => { workbenchActions.closeSettings() },
          },
          '完成',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '主题'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          THEMES.map(theme => segment(
            'data-novel-settings-theme',
            state.theme === theme.id,
            theme.label,
            () => { workbenchActions.setTheme(theme.id) },
          )),
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '正文大小'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [16, 17, 18].map(size => createElement(
            'button',
            {
              key: size,
              type: 'button',
              'data-novel-settings-size': String(size),
              'aria-pressed': settings.readingSize === size ? 'true' : 'false',
              onClick: () => { workbenchActions.setReadingSize(size) },
            },
            `${String(size)} px`,
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '正文阅读按这个字号排版，行高保持 1.85。',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '阅读行宽'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [34, 40].map(measure => createElement(
            'button',
            {
              key: measure,
              type: 'button',
              'data-novel-settings-measure': String(measure),
              'aria-pressed': settings.readingMeasure === measure ? 'true' : 'false',
              onClick: () => { workbenchActions.setReadingMeasure(measure) },
            },
            `${String(measure)} 字`,
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '行宽越窄，眼睛回扫越省力；40 字是原型的默认值。',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '段首缩进'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [0, 2].map(indent => createElement(
            'button',
            {
              key: indent,
              type: 'button',
              'data-novel-settings-indent': String(indent),
              'aria-pressed': settings.readingIndent === indent ? 'true' : 'false',
              onClick: () => { workbenchActions.setReadingIndent(indent) },
            },
            indent === 0 ? '顶格' : '缩进 2 字',
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '中文稿子的惯例是段首缩进两个字；顶格更像屏幕阅读。',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '行高'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [1.6, 1.85, 2.1].map(leading => createElement(
            'button',
            {
              key: leading,
              type: 'button',
              'data-novel-settings-leading': String(leading),
              'aria-pressed': settings.readingLeading === leading ? 'true' : 'false',
              onClick: () => { workbenchActions.setReadingLeading(leading) },
            },
            leading.toFixed(2).replace(/0$/, ''),
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '行距越大，读长段越松快；1.85 是原型的默认值。',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '句子续写'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [[true, '开'], [false, '关']].map(([value, label]) => createElement(
            'button',
            {
              key: String(value),
              type: 'button',
              'data-novel-settings-completion': String(value),
              'aria-pressed': settings.completionEnabled === value ? 'true' : 'false',
              onClick: () => { workbenchActions.setCompletionEnabled(value as boolean) },
            },
            label as string,
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '停笔一会儿，在光标处给一句灰色的续写建议；Tab 采纳，Esc 丢掉。它只是建议，不会自己写进稿子。',
        ),
      ),
      createElement(
        'div',
        { className: 'setting' },
        createElement('div', { className: 'setting-label' }, '续写等待'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [600, 900, 1500].map(delay => createElement(
            'button',
            {
              key: delay,
              type: 'button',
              'data-novel-settings-completion-delay': String(delay),
              'aria-pressed': settings.completionDelayMs === delay ? 'true' : 'false',
              onClick: () => { workbenchActions.setCompletionDelayMs(delay) },
            },
            `${(delay / 1000).toFixed(1)} 秒`,
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          '等得越久越不容易打扰你，但也越像在等它。',
        ),
      ),
    ),
  )
}
