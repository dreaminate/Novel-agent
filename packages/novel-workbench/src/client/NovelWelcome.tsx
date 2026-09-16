/**
 * 空项目: the canvas shown while this profile has no work yet.
 *
 * The prototype's boundary state says one line — 还没有任何设定与正文 — but an
 * author who just installed the novel mode has to get from there to a work, and
 * the shipped composer's picker is not part of the novel surface. So this screen
 * owns the first step: pick a folder with the Host's own chooser, or type the
 * path, and adopt it as the work. The Host mints the Workspace (so its id and the
 * Novel Project binding always agree), and the failure text comes straight from
 * the Host instead of being reworded here.
 */
import { createElement, useState, type ReactNode } from 'react'

/** Everything the welcome screen receives: the two adopt actions plus a frame notice. */
export interface NovelWelcomeProps {
  /** Adopt an existing folder path as the work. */
  readonly adoptWork: (path: string) => Promise<unknown>
  /** Open the Host's directory chooser; absent when the author cancelled. */
  readonly pickWorkDirectory: () => Promise<string | undefined>
  /** Frame-level notice the canvas is already showing, if any. */
  readonly notice: string | undefined
  /** Called after a work lands, so the caller can refresh what it holds. */
  readonly onAdopted?: (path: string) => void
}

/** The empty-project screen. */
export function NovelWelcome(props: NovelWelcomeProps): ReactNode {
  const [path, setPath] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const adopt = (target: string): void => {
    const wanted = target.trim()
    if (wanted.length === 0) {
      setError('先写出作品目录的完整路径。')
      return
    }
    setBusy(true)
    setError(undefined)
    props.adoptWork(wanted).then(
      () => {
        setBusy(false)
        props.onAdopted?.(wanted)
      },
      (failure: unknown) => {
        setBusy(false)
        setError(failure instanceof Error ? failure.message : String(failure))
      },
    )
  }

  return createElement(
    'section',
    { 'data-novel-welcome': 'true' },
    createElement(
      'div',
      { className: 'card', style: { maxWidth: '640px' } },
      createElement('h2', { style: { margin: '0 0 8px', fontSize: '16px' } }, '还没有作品'),
      createElement(
        'p',
        { className: 'note' },
        '小说模式把一部作品的设定、正文与版本都存在它的目录里。选择一个已经放好资料的目录（例如小说的写作目录），它就成为这部作品；目录里的文件不会被改动。',
      ),
      createElement(
        'div',
        { className: 'row', style: { gap: '8px', marginTop: '14px', display: 'flex' } },
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn primary',
            disabled: busy,
            'data-novel-welcome-pick': 'true',
            onClick: () => {
              setBusy(true)
              setError(undefined)
              props.pickWorkDirectory().then(
                picked => {
                  setBusy(false)
                  if (picked === undefined) return
                  setPath(picked)
                  adopt(picked)
                },
                (failure: unknown) => {
                  setBusy(false)
                  setError(failure instanceof Error ? failure.message : String(failure))
                },
              )
            },
          },
          '选择目录…',
        ),
        createElement('input', {
          type: 'text',
          'data-novel-welcome-path': 'true',
          className: 'inp',
          value: path,
          placeholder: '/Users/你/写作/我的小说',
          spellCheck: false,
          style: { flex: '1 1 auto', minWidth: 0 },
          onChange: event => { setPath((event.target as HTMLInputElement).value) },
          onKeyDown: event => {
            if ((event as unknown as KeyboardEvent).key === 'Enter') adopt(path)
          },
        }),
        createElement(
          'button',
          {
            type: 'button',
            className: 'btn',
            disabled: busy,
            'data-novel-welcome-adopt': 'true',
            onClick: () => { adopt(path) },
          },
          busy ? '正在采纳…' : '采纳这个目录',
        ),
      ),
      (error ?? props.notice) !== undefined && createElement(
        'p',
        { className: 'nw-canvas-error', role: 'alert', style: { marginTop: '12px' } },
        error ?? props.notice,
      ),
    ),
  )
}
