// @vitest-environment jsdom
import './webgl-env.js'
import { Context } from '@deepseek-ai/cordis'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'

interface RegisteredEntry {
  options: {
    name: string
    locale?: string
    children?: Record<string, unknown>
  }
  component: unknown
}

/** Minimal ledger for the root declaration this package owns. */
class RootSlots {
  private readonly entriesValue: RegisteredEntry[] = []

  inject(name: string, callback: () => () => void): () => void {
    return name === 'root' ? callback() : () => {}
  }

  register(options: RegisteredEntry['options'], component: unknown): () => void {
    const entry: RegisteredEntry = { options, component }
    this.entriesValue.push(entry)
    return () => {
      const index = this.entriesValue.indexOf(entry)
      if (index >= 0) this.entriesValue.splice(index, 1)
    }
  }

  entries(): readonly RegisteredEntry[] {
    return this.entriesValue
  }
}

const themeSnapshot = {
  preference: 'light',
  fontSize: 16,
  active: { id: 'light', colorScheme: 'light', tokens: { '--dsw-alias-bg-base': '#fff' } },
  themes: [],
  revision: 1,
}

describe('novel-workbench root occupant', () => {
  it('declares the frame slots, renders its own root frame and provides ctx.layout', async () => {
    const { apply } = await import('../src/client/index.js') as {
      apply: (ctx: Context) => () => void
    }
    const ctx = new Context()
    const slots = new RootSlots()
    ctx.provide('slots', slots as never)
    ctx.provide('theme', { getTheme: () => themeSnapshot } as never)
    // The frame mirrors the Session Controller's selection, so the feed has to
    // exist before the root occupant installs.
    ctx.provide('sessions', {
      open: () => {},
      list: { getSnapshot: () => ({ current: undefined }), subscribe: () => () => {} },
    } as never)

    const dispose = apply(ctx as never)
    const entry = slots.entries()[0]

    expect(entry?.options.name).toBe('root')
    expect(entry?.options.locale).toBe('common')
    expect(Object.keys(entry?.options.children ?? {}).sort()).toEqual([
      'conversation',
      'details',
      'novel.canvas',
      'novel.composer',
      'novel.thread.header',
      'novel.thread.notice',
      'novel.topbar',
      'shell.overlay',
      'sidebar',
    ])
    expect(typeof ctx.get('layout')?.openDetails).toBe('function')

    const container = document.createElement('div')
    document.body.append(container)
    const Frame = entry?.component as (props: Record<string, unknown>) => unknown
    const renderSlot = () => null
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(() => createElement(
        Frame as never,
        { renderSlot, actions: { toggleSidebar() {}, openDetails() {}, closeDetails() {} } },
      )))
    })
    expect(container.querySelector('[data-novel-workbench="frame"]')).not.toBeNull()

    await act(async () => { root.unmount() })
    dispose()
    expect(slots.entries()).toHaveLength(0)
  })
})
