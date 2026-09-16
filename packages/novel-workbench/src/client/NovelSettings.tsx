/**
 * 设置: the sheet behind the topbar's 设置 button.
 *
 * The prototype keeps four author choices here — theme, 正文字号, 阅读行宽 and
 * whether threads show tool activity. The reading choices are not decoration:
 * the 正文阅读 canvas reads them from the same store, so what the author picks
 * here is what the text does.
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
        createElement('div', { className: 'setting-label' }, '线程里的工具活动'),
        createElement(
          'div',
          { className: 'seg', role: 'group' },
          [
            { id: 'show', label: '显示', value: true },
            { id: 'hide', label: '收起', value: false },
          ].map(choice => createElement(
            'button',
            {
              key: choice.id,
              type: 'button',
              'data-novel-settings-activity': choice.id,
              'aria-pressed': settings.showToolActivity === choice.value ? 'true' : 'false',
              onClick: () => { workbenchActions.setShowToolActivity(choice.value) },
            },
            choice.label,
          )),
        ),
        createElement(
          'div',
          { className: 'setting-note' },
          'AI 读过什么、跑过什么工具。线程里的工具活动目前由会话面渲染，这一项已记住选择、尚未生效。',
        ),
      ),
    ),
  )
}
