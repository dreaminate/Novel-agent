/**
 * The novel-mode composer row — the frame's bottom bar on every screen.
 *
 * The prototype keeps this bar under the canvas so an author can keep talking to
 * the AI while looking at the story map. The bar itself is novel-owned; the
 * submission is not: the draft goes through the Session Controller's own
 * submission echo (`beginSubmission` then `prompt`) so the Host keeps its queue,
 * echo and failure semantics, and the bar never becomes a second input machine.
 */
import { createElement, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionFace } from '@deepseek-ai/dsh-api-session-controller/client'
import { workbenchActions } from './store.js'

/** The row's own rules: its three cells are the frame's composer grid columns. */
const COMPOSER_CSS = `
[data-novel-composer-row] { display: contents; }
[data-novel-composer-row] .ta {
  min-height: 34px;
  max-height: 88px;
  resize: vertical;
  font-family: var(--font-ui);
}
`

/** Everything the bar receives. */
export type NovelComposerProps = PropsRuntime<'novel.composer'> & {
  /** The thread the draft will be sent into; absent before one is chosen. */
  readonly threadLabel: string | undefined
  /**
   * The current session face the Host assembled for this thread, or `undefined`
   * while no thread is open. The bar calls the face's own submission verbs, so
   * the queue, echo and failure semantics stay the Controller's.
   */
  readonly session: SessionFace | undefined
  /** Open or create the thread the bar talks into. */
  readonly onOpenThread: () => void
}

/** The composer row. */
export function NovelComposer(props: NovelComposerProps): ReactNode {
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  /**
   * A draft that opens with `/` or `@` is a command or a reference, and both ride
   * the shipped input machine (the trigger pipeline mutates it with a draft
   * revision). This bar does not own that machine, so instead of sending the
   * slash text as prose it hands the author to the thread composer.
   */
  const triggerDraft = /^\s*[/@]/.test(draft)
  const ready = props.session !== undefined && draft.trim().length > 0 && !busy && !triggerDraft

  const send = (): void => {
    const text = draft.trim()
    if (props.session === undefined || text.length === 0 || busy) return
    if (triggerDraft) return
    setBusy(true)
    setNotice(undefined)
    const handle = props.session.beginSubmission({ mode: 'queue', text, images: [] })
    props.session.prompt([{ type: 'text', text }], 'queue', undefined, handle.requestId).then(
      result => {
        setBusy(false)
        if (!result.ok) {
          setNotice('这条消息没有被 Host 接受，草稿留在输入框里。')
          return
        }
        // Remember it: if this turn fails, the thread strip can resend exactly
        // this sentence instead of asking the author to retype it.
        if (props.sessionId !== undefined) workbenchActions.rememberSubmission(props.sessionId, text)
        setDraft('')
      },
      (failure: unknown) => {
        setBusy(false)
        setNotice(failure instanceof Error ? failure.message : String(failure))
      },
    )
  }

  return createElement(
    'div',
    { className: 'composer-row', 'data-novel-composer-row': 'true' },
    createElement('style', { key: 'css' }, COMPOSER_CSS),
    createElement(
      'button',
      {
        type: 'button',
        className: 'btn sm',
        id: 'cmpThread',
        title: props.threadLabel === undefined ? '还没有线程，点这里新建' : `当前线程：${props.threadLabel}`,
        onClick: () => { props.onOpenThread() },
      },
      createElement('span', { id: 'cmpThreadLabel' }, props.threadLabel ?? '新建线程'),
    ),
    createElement('textarea', {
      className: 'ta',
      'data-novel-composer-input': 'true',
      rows: 1,
      value: draft,
      placeholder: props.session === undefined ? '先在左栏的线程里开一条线，再在这里说话' : '发消息或做任务…',
      disabled: props.session === undefined,
      onChange: (event: { target: EventTarget | null }) => {
        setDraft((event.target as HTMLTextAreaElement).value)
      },
      onKeyDown: (event: { key: string; shiftKey: boolean; preventDefault?: () => void }) => {
        const key = event
        if (key.key === 'Enter' && !key.shiftKey) {
          key.preventDefault?.()
          send()
        }
      },
    }),
    createElement(
      'button',
      {
        type: 'button',
        className: 'btn primary',
        'data-novel-composer-send': 'true',
        disabled: !ready,
        onClick: send,
      },
      busy ? '正在发送…' : '发送',
    ),
    triggerDraft && createElement(
      'span',
      { className: 'note', 'data-novel-composer-trigger': 'true' },
      '`/` 指令与 `@` 引用在线程输入框里可用：',
      createElement(
        'button',
        {
          type: 'button',
          className: 'btn sm',
          'data-novel-composer-trigger-open': 'true',
          onClick: () => { props.onOpenThread() },
        },
        '切到线程输入',
      ),
    ),
    notice !== undefined && createElement('span', { className: 'note', role: 'alert' }, notice),
  )
}
