// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { NovelComposer } from '../src/client/NovelComposer.js'

/**
 * The prototype keeps a composer bar on every screen, so the author can talk to
 * the AI without leaving the story map. The bar is novel-owned, but submission
 * still goes through the Session Controller's own submission echo: the draft
 * never becomes a second queue.
 */
interface SubmissionLedger {
  readonly begun: { mode: string; text: string; images: readonly unknown[] }[]
  readonly prompts: { requestId: string; content: unknown; mode: string }[]
  beginSubmission(input: { mode: 'queue' | 'steer'; text: string }): { requestId: string; abandon(): void }
  prompt(content: unknown, mode: 'queue' | 'steer', signal?: AbortSignal, requestId?: string): Promise<{ ok: boolean }>
}

/** One session face that records exactly what the bar asked it to do. */
function sessionOver(): SubmissionLedger {
  const begun: { mode: string; text: string }[] = []
  const prompts: { requestId: string; content: unknown; mode: string }[] = []
  return {
    begun,
    prompts,
    beginSubmission(input: { mode: string; text: string; images: readonly unknown[] }) {
      begun.push(input)
      return { requestId: `req-${String(begun.length)}`, abandon() {} }
    },
    prompt(content: unknown, mode: string, _signal?: AbortSignal, requestId?: string) {
      prompts.push({ requestId: requestId ?? '', content, mode })
      return Promise.resolve({ ok: true, value: { accepted: true } })
    },
  }
}

describe('novel-mode composer row', () => {
  it('submits a draft through the session submission echo', async () => {
    const ledger = sessionOver()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(NovelComposer as never, {
        threadLabel: '第 1 章 · 立项',
        session: ledger as never,
        onOpenThread: vi.fn(),
      }))
    })

    const input = container.querySelector('textarea[data-novel-composer-input]') as HTMLTextAreaElement
    expect(input).not.toBeNull()
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(input, '把第 1 章的悬念再压紧一点')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-composer-send]')?.click()
    })
    await act(async () => {})

    // The echo carries the draft and an empty image list, which is the shape the
    // Session Controller's own submission input requires.
    expect(ledger.begun).toEqual([
      { mode: 'queue', text: '把第 1 章的悬念再压紧一点', images: [] },
    ])
    expect(ledger.prompts).toHaveLength(1)
    expect(ledger.prompts[0]?.requestId).toBe('req-1')
    expect(ledger.prompts[0]?.mode).toBe('queue')
    expect(JSON.stringify(ledger.prompts[0]?.content)).toContain('把第 1 章的悬念再压紧一点')
    // The draft clears only because the Host accepted it.
    expect((container.querySelector('textarea[data-novel-composer-input]') as HTMLTextAreaElement).value).toBe('')
    await act(async () => { root.unmount() })
  })

  it('hands `/` and `@` drafts to the thread composer instead of sending them as prose', async () => {
    const ledger = sessionOver()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const onOpenThread = vi.fn()
    await act(async () => {
      root.render(createElement(NovelComposer as never, {
        threadLabel: '第 1 章 · 立项',
        session: ledger,
        onOpenThread,
      }))
    })

    const input = container.querySelector('textarea[data-novel-composer-input]') as HTMLTextAreaElement
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
      setter?.call(input, '/goal 把第 2 章写成转折')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-novel-composer-send]')?.click()
    })
    await act(async () => {})

    // The `/` pipeline belongs to the shipped input machine, so the bar routes the
    // author there rather than re-implementing commands or sending the slash text.
    expect(ledger.prompts).toHaveLength(0)
    const hint = container.querySelector('[data-novel-composer-trigger]')
    expect(hint).not.toBeNull()
    expect(hint?.textContent).toContain('线程输入框')
    await act(async () => {
      hint?.querySelector<HTMLButtonElement>('[data-novel-composer-trigger-open]')?.click()
    })
    expect(onOpenThread).toHaveBeenCalled()
    await act(async () => { root.unmount() })
  })
})
