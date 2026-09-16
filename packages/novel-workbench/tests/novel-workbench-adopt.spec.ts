// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createNovelWorkFace } from '../src/client/novel-data.js'

/**
 * Adopting a folder is the first thing an author does, and the novel surface owns
 * it: the Host already knows how to mint a Workspace from an existing path
 * (`workspaces.create`) and how to open its native chooser (`pickDirectory`), so
 * the workbench composes those two instead of shipping its own file browser.
 */
function faceOver(deps: {
  workspaces: Record<string, unknown>
  workspace?: Record<string, unknown>
}) {
  return createNovelWorkFace({
    project: {} as never,
    sessions: {} as never,
    workspace: (deps.workspace ?? {}) as never,
    workspaces: deps.workspaces as never,
  })
}

describe('novel-mode work adoption', () => {
  it('adopts an existing folder through the Workspace controller', async () => {
    const create = vi.fn(async () => ({ workspaceId: 'ws-mist', path: '/books/mist', title: '雾港夜航' }))
    const pickDirectory = vi.fn(async () => '/books/mist')
    const face = faceOver({ workspaces: { create }, workspace: { pickDirectory } })

    await expect(face.pickWorkDirectory()).resolves.toBe('/books/mist')
    const picks = pickDirectory.mock.calls.length
    await expect(face.adoptWork('/books/mist')).resolves.toBe('ws-mist')
    expect(create).toHaveBeenCalledWith({ path: '/books/mist' })
    // Adopting a path never re-opens the chooser: the two steps stay separate.
    expect(pickDirectory.mock.calls.length).toBe(picks)
  })

  it('keeps the Host error text when adoption fails', async () => {
    const face = faceOver({
      workspaces: {
        create: vi.fn(async () => {
          throw new Error('workspace path does not exist')
        }),
      },
      workspace: { pickDirectory: vi.fn(async () => null) },
    })

    await expect(face.adoptWork('/nope')).rejects.toThrow('workspace path does not exist')
    await expect(face.pickWorkDirectory()).resolves.toBeUndefined()
  })

  it('renders the empty-project screen with the adopt form and its error', async () => {
    const { NovelWelcome } = await import('../src/client/NovelWelcome.js')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const adoptWork = vi.fn(async () => {
      throw new Error('路径不存在：/nope')
    })
    await act(async () => {
      root.render(createElement(NovelWelcome, {
        adoptWork,
        pickWorkDirectory: vi.fn(async () => undefined),
        notice: undefined,
      }))
    })

    const welcome = container.querySelector('[data-novel-welcome]')
    expect(welcome).not.toBeNull()
    expect(welcome?.textContent).toContain('还没有作品')
    const input = welcome?.querySelector('input[data-novel-welcome-path]') as HTMLInputElement
    expect(input).not.toBeNull()

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, '/nope')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      welcome?.querySelector<HTMLButtonElement>('[data-novel-welcome-adopt]')?.click()
    })
    expect(adoptWork).toHaveBeenCalledWith('/nope')
    await act(async () => { root.unmount() })
  })
})
