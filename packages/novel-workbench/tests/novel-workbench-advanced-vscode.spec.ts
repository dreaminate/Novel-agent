// @vitest-environment jsdom
// I-P5g: 进阶 goes VSCode's settings.json — bare JSON on a monospaced surface.
//
// Two things were wrong with the block that showed the raw Canon projection.
// It named its own font stack instead of the product's `--font-mono`, which is
// the same token every other monospaced line in the frame uses; and it wrapped
// with `word-break: break-all`, which breaks an identifier wherever the box runs
// out — `character-state` split across two lines is not JSON anyone can read.
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { AdvancedView } from '../src/client/AdvancedView.js'

const diagnostics = {
  projectId: 'p-1',
  workspaceId: 'ws-1',
  cwd: '/books/x',
  acceptedRevision: 5,
  locks: [],
  canonJson: '{\n  "character-state": {\n    "guchen": { "realm": "凡尘境圆满" }\n  }\n}',
}

async function mountAdvanced() {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(createElement(AdvancedView as never, {
      sessionId: 'session-1',
      jobs: {},
      subagents: {},
      diagnostics,
      panels: undefined,
      onReload: () => {},
    } as never))
  })
  await act(async () => {})
  return { container, root }
}

const css = (container: HTMLElement): string =>
  container.querySelector('[data-novel-advanced] style')?.textContent ?? ''

describe('novel-mode 进阶, against VSCode settings.json (I-P5g)', () => {
  it('draws monospaced text in the product\'s own monospace token', async () => {
    const { container } = await mountAdvanced()
    const rule = css(container).match(/\[data-novel-advanced\] \.nw-mono \{([^}]*)\}/u)?.[1] ?? ''
    expect(rule).toMatch(/font-family:\s*var\(--font-mono\)/u)
    // Naming a stack here is how this drifted from every other monospaced line
    // in the frame in the first place.
    expect(rule).not.toMatch(/ui-monospace|SFMono|Menlo/u)
  })

  it('wraps JSON at boundaries, not through the middle of an identifier', async () => {
    const { container } = await mountAdvanced()
    const rule = css(container).match(/\[data-novel-advanced\] \.nw-mono \{([^}]*)\}/u)?.[1] ?? ''
    expect(rule).not.toMatch(/word-break:\s*break-all/u)
  })

  it('puts the raw projection on a code surface, not on the page', async () => {
    const { container } = await mountAdvanced()
    const block = container.querySelector('[data-novel-advanced-canon] .nw-mono')
    expect(block).not.toBeNull()
    expect(block?.className).toContain('nw-code')
    expect(block?.textContent).toContain('character-state')

    const rule = css(container).match(/\[data-novel-advanced\] \.nw-code \{([^}]*)\}/u)?.[1] ?? ''
    // An editor pane, in tokens: its own surface, its own radius, and a ceiling
    // so a large projection scrolls instead of running the panel off the page.
    expect(rule).toMatch(/background:\s*hsl\(var\(--bg-200\)\)/u)
    expect(rule).toMatch(/border-radius:\s*var\(--r-ctl\)|var\(--r-card\)/u)
    expect(rule).toMatch(/max-height:/u)
    expect(rule).toMatch(/overflow:\s*auto/u)
  })

  it('keeps the raw projection behind its disclosure, off the sections above', async () => {
    const { container } = await mountAdvanced()
    const details = container.querySelector<HTMLDetailsElement>('[data-novel-advanced-canon]')
    expect(details?.tagName).toBe('DETAILS')
    // Collapsed by default: the dump is reachable, not in the way of the panel.
    expect(details?.open).toBe(false)
    // And it is not leaking upward — the sections that are not the 诊断 dump say
    // nothing from Canon's own vocabulary.
    const above = [...container.querySelectorAll('section')]
      .filter(node => node.getAttribute('aria-label') !== '诊断')
      .map(node => node.textContent ?? '')
      .join(' ')
    expect(above).not.toContain('character-state')
    expect(above).not.toContain('guchen')
  })
})
