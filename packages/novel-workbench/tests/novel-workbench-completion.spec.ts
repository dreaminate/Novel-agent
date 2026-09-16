// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { EditorState, TextSelection } from '@tiptap/pm/state'
import { Schema } from '@tiptap/pm/model'
import { completionDecorations, completionInsertion, shouldAskForCompletion } from '../src/client/novel-completion.js'
import { NovelEditor } from '../src/client/NovelEditor.js'

/**
 * A sentence-level continuation is a suggestion, not an edit. It is painted with
 * a decoration so it never enters the document, the undo history or the draft
 * file until the author accepts it — and it never appears while an IME is
 * composing, because a suggestion inside a composing region corrupts what the
 * author is typing.
 */
describe('when a pause is worth asking about', () => {
  const base = { enabled: true, composing: false, showing: false, tail: '风起于青萍之末' }

  it('asks after a pause with prose behind the caret', () => {
    expect(shouldAskForCompletion(base)).toBe(true)
  })

  it('never asks while an IME is composing', () => {
    // The one state that must not be interrupted, whatever else is true.
    expect(shouldAskForCompletion({ ...base, composing: true })).toBe(false)
  })

  it('asks nothing when it is switched off, already showing, or has nothing to continue', () => {
    expect(shouldAskForCompletion({ ...base, enabled: false })).toBe(false)
    expect(shouldAskForCompletion({ ...base, showing: true })).toBe(false)
    expect(shouldAskForCompletion({ ...base, tail: '   ' })).toBe(false)
  })
})

describe('what accepting inserts', () => {
  it('does not double the space it is continuing from', () => {
    expect(completionInsertion(' 他合上门。', '他说')).toBe('他合上门。')
  })

  it('takes no leading space before Chinese punctuation', () => {
    expect(completionInsertion('，然后离开。', '他合上门')).toBe('，然后离开。')
  })

  it('separates two Latin words when they would otherwise run together', () => {
    expect(completionInsertion('and left', 'he closed the door')).toBe(' and left')
  })
})

describe('painting the suggestion', () => {
  /** The smallest schema that can hold one paragraph, which is all this needs. */
  const prose = new Schema({
    nodes: {
      doc: { content: 'paragraph+' },
      paragraph: { content: 'text*', toDOM: () => ['p', 0] },
      text: {},
    },
  })

  /** A one-paragraph document with the caret at the end. */
  function stateAtEnd(text: string): EditorState {
    const doc = prose.node('doc', null, [prose.node('paragraph', null, [prose.text(text)])])
    return EditorState.create({ doc, selection: TextSelection.atEnd(doc) })
  }

  it('paints a grey widget without putting text in the document', () => {
    const state = stateAtEnd('风起于青萍之末')
    const decorations = completionDecorations(state, '。他合上门。')
    const found = decorations?.find(undefined, undefined, () => true) ?? []

    // The document is untouched: a decoration is the only way to show text that
    // is not text.
    expect(state.doc.textContent).toBe('风起于青萍之末')
    expect(found.length).toBeGreaterThan(0)
  })

  it('paints nothing when there is no suggestion', () => {
    expect(completionDecorations(stateAtEnd('风起'), undefined)).toBeNull()
    expect(completionDecorations(stateAtEnd('风起'), '')).toBeNull()
  })
})

describe('the editor offers, accepts and drops', () => {
  const chapter = { number: 1, title: '开篇章' }

  async function mountEditor(suggest: string | undefined, delayMs = 300) {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(createElement(NovelEditor as never, {
        workId: 'ws-1',
        chapter,
        loadChapterDraft: async () => ({ state: 'loaded', text: '风起于青萍之末', version: 'v1' }),
        saveChapterDraft: async () => ({ state: 'saved', version: 'v2' }),
        readingSize: 17, readingMeasure: 40, readingIndent: 2, readingLeading: 1.85,
        sessionId: 'session-1', revision: 5,
        submitChapterProposal: async () => {},
        completionEnabled: true,
        completionDelayMs: delayMs,
        requestCompletion: async () => suggest,
      } as never))
    })
    await act(async () => {})
    return { container, root }
  }

  /** Wait past the pause so the suggestion has landed. */
  const settle = (ms = 500) => act(async () => { await new Promise(resolve => { setTimeout(resolve, ms) }) })

  it('shows the suggestion as a decoration and accepts it with Tab', async () => {
    const { container, root } = await mountEditor('。他合上门。')
    await settle()

    const ghost = container.querySelector('[data-novel-ghost]')
    expect(ghost).not.toBeNull()
    expect(ghost?.textContent).toBe('。他合上门。')
    // It is a widget: in the DOM, but not in the document. The document is what
    // Esc proves — see the drop test below.
    expect(ghost?.getAttribute('aria-hidden')).toBe('true')

    const surface = container.querySelector<HTMLElement>('.ProseMirror')
    await act(async () => {
      surface?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })
    await act(async () => {})
    expect(container.querySelector('.ProseMirror')?.textContent).toBe('风起于青萍之末。他合上门。')
    expect(container.querySelector('[data-novel-ghost]')).toBeNull()

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('drops the suggestion with Esc and leaves the document alone', async () => {
    const { container, root } = await mountEditor('。他合上门。')
    await settle()
    expect(container.querySelector('[data-novel-ghost]')).not.toBeNull()

    const surface = container.querySelector<HTMLElement>('.ProseMirror')
    await act(async () => {
      surface?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    await act(async () => {})
    expect(container.querySelector('[data-novel-ghost]')).toBeNull()
    // Exactly the original text and not a character more: if the suggestion had
    // ever been written into the document, dropping it would have left it there.
    expect(container.querySelector('.ProseMirror')?.textContent).toBe('风起于青萍之末')

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('shows nothing when the seam has no answer', async () => {
    const { container, root } = await mountEditor(undefined)
    await settle()
    expect(container.querySelector('[data-novel-ghost]')).toBeNull()

    await act(async () => { root.unmount() })
    container.remove()
  })
})
