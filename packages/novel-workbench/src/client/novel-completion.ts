/**
 * Sentence-level completion: the grey text that appears at the caret after a
 * pause, accepted with Tab and dropped with Esc.
 *
 * Two things here are the whole reason this is not trivial:
 *
 * 1. **It paints with a ProseMirror decoration, not by editing the document.**
 *    A suggestion is not the author's text yet — it must not enter the document,
 *    the undo history, or the draft file until it is accepted. A decoration is
 *    the only mechanism that shows text without being text.
 * 2. **Chinese input never triggers it.** An IME composes inside the editor, and
 *    a suggestion that appears mid-composition corrupts the composing region —
 *    the one failure an author would notice immediately and unforgivingly. So the
 *    policy refuses to ask while composition is live, and the caller cancels a
 *    pending pause the moment composition starts.
 *
 * The module is pure where it can be: the policy and the decoration builder are
 * plain functions, so the trigger rules can be tested without an editor.
 */
// `Extension` comes from `@tiptap/react`, which re-exports core: this package
// declares `@tiptap/react` and `@tiptap/pm`, and does not need a third direct
// dependency for one symbol.
import { Extension } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorState } from '@tiptap/pm/state'

/** Plugin identity, also used to nudge a redraw when a suggestion arrives. */
export const COMPLETION_PLUGIN_KEY = new PluginKey('novel-completion')

/** Everything the trigger policy needs to decide. */
export interface CompletionTrigger {
  /** The author's switch in the settings sheet. */
  readonly enabled: boolean
  /** True while an IME is composing — the one state that must never ask. */
  readonly composing: boolean
  /** A suggestion already on screen; one at a time. */
  readonly showing: boolean
  /** The prose before the caret. Nothing written means nothing to continue. */
  readonly tail: string
}

/**
 * Whether a pause is worth asking the model about.
 * @param trigger - the current editor facts.
 * @returns true when a request may go out.
 */
export function shouldAskForCompletion(trigger: CompletionTrigger): boolean {
  if (!trigger.enabled) return false
  if (trigger.composing) return false
  if (trigger.showing) return false
  return trigger.tail.trim().length > 0
}

/**
 * What accepting a suggestion inserts.
 * @param suggestion - what the model offered.
 * @param before - the text immediately before the caret.
 * @returns the text to insert.
 */
export function completionInsertion(suggestion: string, before: string): string {
  // The model is asked for the continuation only, but it frequently repeats the
  // whitespace it is continuing from; adding it again would double it.
  const trimmed = suggestion.replace(/^[ \t]+/, '')
  if (trimmed === '') return ''
  // A gap only where one belongs: between two Latin words. Chinese runs its
  // characters together, and a space inserted before 他 or before ，is not a
  // typo the author should have to fix.
  const needsGap = /[A-Za-z0-9]$/.test(before) && /^[A-Za-z0-9]/.test(trimmed)
  return `${needsGap ? ' ' : ''}${trimmed}`
}

/** The widget that paints the suggestion grey. */
function ghost(suggestion: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'novel-ghost'
  span.setAttribute('data-novel-ghost', 'true')
  span.setAttribute('aria-hidden', 'true')
  span.textContent = suggestion
  return span
}

/**
 * Build the decoration set for one suggestion, or `null` when there is none.
 * @param state - the editor state the caret is read from.
 * @param suggestion - the pending suggestion.
 * @returns decorations, or null.
 */
export function completionDecorations(state: EditorState, suggestion: string | undefined): DecorationSet | null {
  if (suggestion === undefined || suggestion === '') return null
  const { from } = state.selection
  return DecorationSet.create(state.doc, [Decoration.widget(from, () => ghost(suggestion), { side: 1 })])
}

/** Options the editor hands the extension. */
export interface NovelCompletionOptions {
  /** Read the suggestion currently on screen. */
  readonly suggestion: () => string | undefined
}

/** The Tiptap extension that shows the pending suggestion. */
export const NovelCompletion = Extension.create<NovelCompletionOptions>({
  name: 'novelCompletion',
  addOptions() {
    return { suggestion: () => undefined }
  },
  addProseMirrorPlugins() {
    const read = this.options.suggestion
    return [
      new Plugin({
        key: COMPLETION_PLUGIN_KEY,
        props: {
          decorations(state) {
            return completionDecorations(state, read())
          },
        },
      }),
    ]
  },
})
