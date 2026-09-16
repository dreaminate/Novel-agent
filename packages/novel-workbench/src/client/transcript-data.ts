/**
 * The novel-mode transcript: the durable session log reduced to the lines an
 * author reads.
 *
 * This module owns no storage. It is a pure reduction of the entries the shipped
 * Session binding already exposes (`binding.eventSource.getSnapshot().entries`),
 * so the transcript can never disagree with the conversation the host recorded:
 * there is one log, and this is a view of it.
 *
 * The reduction keeps three things and drops the rest: what the author asked
 * (`user/message`), what the model wrote (`assistant/chunk` deltas, finalized by
 * `assistant/message`), and which tools ran (`tool/call` paired with
 * `tool/result`). Reasoning deltas are deliberately not folded into the prose —
 * they are the model thinking, not the manuscript.
 *
 * A turn that ended in failure is deliberately *not* a line here. It carries an
 * affordance (resend the sentence that failed) rather than prose, so it renders
 * as the strip that sits directly under these lines; emitting a notice line as
 * well would say the same thing twice.
 */

/** One durable log entry, in the shape the Session binding exposes. */
export interface SessionLogEntry {
  readonly type: string
  readonly event?: unknown
}

/**
 * One line of the transcript.
 *
 * The shape is deliberately uniform rather than a discriminated union: every
 * line can be described by the same handful of fields, and callers that render a
 * list should not have to narrow a union to ask for text.
 */
export interface TranscriptEntry {
  readonly kind: 'user' | 'assistant' | 'tool'
  readonly id: string
  /** The line's prose; for a tool line this is the tool's own name. */
  readonly text: string
  /** Set on an assistant line that is still receiving deltas. */
  readonly streaming?: boolean
  /** Set on a tool line once its result is known. */
  readonly state?: 'running' | 'done' | 'failed'
  /** What a tool line acted on — the path, pattern or the model's own short description. */
  readonly detail?: string
}

/** Read the visible text of one message-shaped payload. */
function textOf(message: unknown): string {
  const content = (message as { content?: unknown } | undefined)?.content
  if (!Array.isArray(content)) return ''
  return content
    .map(block => {
      const typed = block as { type?: unknown; text?: unknown } | undefined
      return typed?.type === 'text' && typeof typed.text === 'string' ? typed.text : ''
    })
    .join('')
}

/** Read the call id a tool result correlates to, when it carries one. */
function resultCallId(message: unknown): string | undefined {
  const content = (message as { content?: unknown } | undefined)?.content
  if (!Array.isArray(content)) return undefined
  for (const block of content) {
    const callId = (block as { callId?: unknown } | undefined)?.callId
    if (typeof callId === 'string' && callId !== '') return callId
  }
  return undefined
}

/**
 * The one detail worth showing on a tool line.
 *
 * Preference order matters: a shell call carries both a `command` and a
 * model-written `description`, and the description is the human sentence, so it
 * wins. File tools carry `file_path`; search tools carry `pattern`.
 */
function toolDetail(argumentsJson: unknown): string | undefined {
  if (typeof argumentsJson !== 'string' || argumentsJson === '') return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(argumentsJson)
  } catch {
    return undefined
  }
  if (parsed === null || typeof parsed !== 'object') return undefined
  const record = parsed as Record<string, unknown>
  for (const key of ['description', 'file_path', 'pattern', 'path']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return undefined
}

/**
 * Reduce a session log to transcript lines.
 * @param entries - durable log entries, oldest first.
 * @returns the lines an author reads, in the order they happened.
 */
export function transcriptOf(entries: readonly SessionLogEntry[]): TranscriptEntry[] {
  const lines: TranscriptEntry[] = []
  /** Index of the assistant line still open for one turn's step. */
  const drafts = new Map<string, number>()
  /** Index of a tool line, by call id. */
  const calls = new Map<string, number>()

  /** Find the tool line a result belongs to, preferring its explicit call id. */
  const openToolIndex = (callId: string | undefined): number | undefined => {
    if (callId !== undefined) return calls.get(callId)
    for (let at = lines.length - 1; at >= 0; at -= 1) {
      const line = lines[at]
      if (line !== undefined && line.kind === 'tool' && line.state === 'running') return at
    }
    return undefined
  }

  for (const entry of entries) {
    if (entry.type !== 'event') continue
    const event = entry.event as { type?: unknown; data?: unknown } | undefined
    if (typeof event?.type !== 'string') continue
    const data = (event.data ?? {}) as Record<string, unknown>

    switch (event.type) {
      case 'user/message': {
        const text = textOf(data)
        if (text !== '') {
          lines.push({ kind: 'user', id: String(data.id ?? `user-${String(lines.length)}`), text })
        }
        break
      }
      case 'assistant/chunk': {
        const chunk = data.chunk as { type?: unknown; text?: unknown } | undefined
        if (chunk?.type !== 'text-delta' || typeof chunk.text !== 'string' || chunk.text === '') break
        const key = `${String(data.turn)}/${String(data.step)}`
        const at = drafts.get(key)
        if (at === undefined) {
          drafts.set(key, lines.length)
          lines.push({ kind: 'assistant', id: `assistant-${key}`, text: chunk.text, streaming: true })
        } else {
          const current = lines[at]
          if (current === undefined) break
          lines[at] = { ...current, text: current.text + chunk.text, streaming: true }
        }
        break
      }
      case 'assistant/message': {
        const key = `${String(data.turn)}/${String(data.step)}`
        const text = textOf(data.message)
        const at = drafts.get(key)
        const current = at === undefined ? undefined : lines[at]
        if (at !== undefined && current !== undefined) {
          lines[at] = { ...current, text: text === '' ? current.text : text, streaming: false }
        } else if (text !== '') {
          drafts.set(key, lines.length)
          lines.push({ kind: 'assistant', id: `assistant-${key}`, text, streaming: false })
        }
        break
      }
      case 'tool/call': {
        const id = String(data.callId ?? `call-${String(lines.length)}`)
        const detail = toolDetail(data.arguments)
        calls.set(id, lines.length)
        lines.push({
          kind: 'tool',
          id,
          text: String(data.name ?? ''),
          state: 'running',
          ...(detail === undefined ? {} : { detail }),
        })
        break
      }
      case 'tool/result': {
        const at = openToolIndex(resultCallId(data.message))
        const current = at === undefined ? undefined : lines[at]
        if (at !== undefined && current !== undefined) {
          lines[at] = { ...current, state: data.error === undefined ? 'done' : 'failed' }
        }
        break
      }
      default:
        break
    }
  }

  return lines
}
