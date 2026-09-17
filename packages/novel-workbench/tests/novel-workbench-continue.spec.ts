// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { NovelContinuationResult } from '@novel-agent/novel-project/types'
import { ContinueWritingPanel, inspirationBeats } from '../src/client/ContinueWritingPanel.js'

/**
 * The paragraph-level continuation is the deliberate counterpart of the grey
 * text: the author says what happens next, asks for prose, and decides whether
 * to keep it. Three things here are the ones an author would notice losing —
 * their beats are used in the order they wrote them, generation can be stopped,
 * and nothing reaches the draft until they say so.
 */
type Generate = (inspiration: readonly string[], signal: AbortSignal) => Promise<NovelContinuationResult>

function mount(options: { onGenerate: Generate, onAdopt?: (text: string) => void } = { onGenerate: async () => ({ state: 'ok', text: '' }) }) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const onAdopt = options.onAdopt ?? (() => {})
  const ready = act(async () => {
    root.render(createElement(ContinueWritingPanel as never, {
      onGenerate: options.onGenerate,
      onAdopt,
    }))
  })
  const setText = async (text: string) => {
    const node = container.querySelector<HTMLTextAreaElement>('[data-novel-continue-input]')
    if (node === null) throw new Error('no inspiration input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
    setter?.call(node, text)
    await act(async () => { node.dispatchEvent(new window.Event('input', { bubbles: true })) })
  }
  const click = async (selector: string) => {
    const node = container.querySelector<HTMLButtonElement>(selector)
    if (node === null) throw new Error(`no ${selector}`)
    await act(async () => { node.click() })
  }
  return {
    container,
    root,
    ready,
    setText,
    click,
    text: () => container.textContent ?? '',
    state: () => container.querySelector('[data-novel-continue-state]')?.getAttribute('data-novel-continue-state') ?? null,
    async dispose() {
      await act(async () => { root.unmount() })
      container.remove()
    },
  }
}

/** A promise the test resolves by hand, so "while generating" is observable. */
function deferred() {
  let settle: (result: NovelContinuationResult) => void = () => {}
  const promise = new Promise<NovelContinuationResult>(resolve => { settle = resolve })
  return { promise, settle }
}

describe('inspirationBeats', () => {
  it('keeps the author order and drops the blank lines between beats', () => {
    expect(inspirationBeats('  他想起旧账  \n\n第二件事\n   \n第三件事  ')).toEqual([
      '他想起旧账',
      '第二件事',
      '第三件事',
    ])
  })

  it('reads an empty sheet as no beats rather than one empty beat', () => {
    expect(inspirationBeats('   \n\n  ')).toEqual([])
  })
})

describe('novel-mode continuation panel', () => {
  it('asks with the beats in the order they were written', async () => {
    const seen: (readonly string[])[] = []
    const rendered = mount({
      onGenerate: async (inspiration) => { seen.push(inspiration); return { state: 'ok', text: '门开了。' } },
    })
    await rendered.ready
    await rendered.setText('先写风声\n再写脚步声')
    await rendered.click('[data-novel-continue-generate]')
    expect(seen).toEqual([['先写风声', '再写脚步声']])
    await rendered.dispose()
  })

  it('shows work in progress and offers to stop it, rather than a second generate', async () => {
    const pending = deferred()
    const rendered = mount({ onGenerate: () => pending.promise })
    await rendered.ready
    await rendered.click('[data-novel-continue-generate]')
    expect(rendered.state()).toBe('working')
    expect(rendered.container.querySelector('[data-novel-continue-stop]')).not.toBeNull()
    expect(rendered.container.querySelector('[data-novel-continue-generate]')).toBeNull()
    await rendered.dispose()
  })

  it('keeps the prose only when the author adopts it', async () => {
    const adopted: string[] = []
    const rendered = mount({
      onGenerate: async () => ({ state: 'ok', text: '门开了，风灌进来。' }),
      onAdopt: text => adopted.push(text),
    })
    await rendered.ready
    await rendered.click('[data-novel-continue-generate]')
    expect(rendered.state()).toBe('ready')
    expect(rendered.text()).toContain('门开了，风灌进来。')
    expect(adopted).toEqual([])
    await rendered.click('[data-novel-continue-adopt]')
    expect(adopted).toEqual(['门开了，风灌进来。'])
    await rendered.dispose()
  })

  it('lets the author throw the prose away without touching the draft', async () => {
    const onAdopt = vi.fn()
    const rendered = mount({ onGenerate: async () => ({ state: 'ok', text: '门开了。' }), onAdopt })
    await rendered.ready
    await rendered.click('[data-novel-continue-generate]')
    await rendered.click('[data-novel-continue-discard]')
    expect(onAdopt).not.toHaveBeenCalled()
    expect(rendered.state()).toBe('idle')
    expect(rendered.text()).not.toContain('门开了。')
    await rendered.dispose()
  })

  it('stops generation on request, aborting the work it started', async () => {
    let handed: AbortSignal | undefined
    const pending = deferred()
    const onAdopt = vi.fn()
    const rendered = mount({
      onGenerate: (_inspiration, signal) => { handed = signal; return pending.promise },
      onAdopt,
    })
    await rendered.ready
    await rendered.click('[data-novel-continue-generate]')
    expect(handed?.aborted).toBe(false)
    await rendered.click('[data-novel-continue-stop]')
    expect(handed?.aborted).toBe(true)
    expect(rendered.state()).toBe('idle')
    // A late answer to a request the author already stopped must not appear.
    await act(async () => { pending.settle({ state: 'ok', text: '门开了。' }) })
    expect(onAdopt).not.toHaveBeenCalled()
    expect(rendered.text()).not.toContain('门开了。')
    await rendered.dispose()
  })

  it('says a failure out loud, because the author asked for this one', async () => {
    const rendered = mount({
      onGenerate: async () => ({ state: 'failed', message: '这次没能写出内容，可以再试一次。' }),
    })
    await rendered.ready
    await rendered.click('[data-novel-continue-generate]')
    expect(rendered.state()).toBe('failed')
    expect(rendered.text()).toContain('这次没能写出内容')
    // And the author can ask again.
    expect(rendered.container.querySelector('[data-novel-continue-generate]')).not.toBeNull()
    await rendered.dispose()
  })
})
