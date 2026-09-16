// @vitest-environment jsdom
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { describe, expect, it } from 'vitest'
import { transcriptOf, type SessionLogEntry } from '../src/client/transcript-data.js'
import { NovelTranscript } from '../src/client/NovelTranscript.js'

/** One durable log entry wrapping one session event. */
function event(type: string, data: unknown): SessionLogEntry {
  return { type: 'event', event: { type, data } }
}

/** A user message carrying one text block. */
function userMessage(id: string, text: string): unknown {
  return { id, role: 'user', content: [{ type: 'text', text }], source: {} }
}

/** An assembled assistant message for one step. */
function assistantMessage(turn: number, step: number, text: string): SessionLogEntry {
  return event('assistant/message', {
    turn,
    step,
    message: { id: `am-${String(turn)}-${String(step)}`, role: 'assistant', content: [{ type: 'text', text }], source: {} },
  })
}

describe('transcriptOf', () => {
  it('turns session messages into one transcript entry each', () => {
    const transcript = transcriptOf([
      event('user/message', userMessage('u1', '写一段开场。')),
      assistantMessage(1, 1, '风起于青萍之末。'),
      event('user/message', userMessage('u2', '再来一段。')),
      assistantMessage(2, 1, '雨落在旧瓦上。'),
    ])

    expect(transcript.map(entry => entry.kind)).toEqual(['user', 'assistant', 'user', 'assistant'])
    expect(transcript[0].text).toBe('写一段开场。')
    expect(transcript[3].text).toBe('雨落在旧瓦上。')
    expect(transcript.every(entry => entry.streaming !== true)).toBe(true)
  })

  it('appends streamed text deltas and lets the assembled message finalize them', () => {
    const streamed = transcriptOf([
      event('user/message', userMessage('u1', '继续。')),
      event('assistant/chunk', { turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '风' } }),
      event('assistant/chunk', { turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '起' } }),
    ])

    expect(streamed).toHaveLength(2)
    expect(streamed[1].kind).toBe('assistant')
    expect(streamed[1].text).toBe('风起')
    expect(streamed[1].streaming).toBe(true)

    const finalized = transcriptOf([
      event('user/message', userMessage('u1', '继续。')),
      event('assistant/chunk', { turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: '风' } }),
      assistantMessage(1, 1, '风起于青萍之末。'),
    ])

    expect(finalized).toHaveLength(2)
    expect(finalized[1].text).toBe('风起于青萍之末。')
    expect(finalized[1].streaming).toBe(false)
  })

  it('does not fold reasoning into the visible prose', () => {
    const transcript = transcriptOf([
      event('assistant/chunk', { turn: 1, step: 1, chunk: { type: 'reasoning-delta', index: 0, text: '先想一下' } }),
      assistantMessage(1, 1, '正文。'),
    ])

    expect(transcript).toHaveLength(1)
    expect(transcript[0].text).toBe('正文。')
  })

  it('pairs a tool call with its result', () => {
    const running = transcriptOf([
      event('tool/call', { turn: 1, step: 1, callId: 'c1', name: 'Read', arguments: '{"path":"a.md"}' }),
    ])
    expect(running).toHaveLength(1)
    expect(running[0].kind).toBe('tool')
    expect(running[0].state).toBe('running')

    const settled = transcriptOf([
      event('tool/call', { turn: 1, step: 1, callId: 'c1', name: 'Read', arguments: '{"path":"a.md"}' }),
      event('tool/result', { turn: 1, step: 1, message: { id: 'r1', role: 'user', content: [], source: {} } }),
    ])
    expect(settled).toHaveLength(1)
    expect(settled[0].state).toBe('done')

    const failed = transcriptOf([
      event('tool/call', { turn: 1, step: 1, callId: 'c1', name: 'Bash', arguments: '{}' }),
      event('tool/result', { turn: 1, step: 1, message: { id: 'r1', role: 'user', content: [], source: {} }, error: { name: 'E', code: 'E_FAIL' } }),
    ])
    expect(failed[0].state).toBe('failed')
  })

  it('leaves a failed turn to the strip under the transcript, not to a line', () => {
    // A failure carries an affordance (resend the sentence), not prose, so it
    // renders as NovelThreadNotice. Emitting a line here as well would say the
    // same thing twice — which is exactly what this increment removed.
    const transcript = transcriptOf([
      event('turn/end', { reason: { kind: 'error', error: { message: '连接中断' } } }),
    ])

    expect(transcript).toEqual([])
  })

  it('reads the one useful detail out of a tool call', () => {
    const transcript = transcriptOf([
      event('tool/call', { turn: 1, step: 1, callId: 'c1', name: 'read', arguments: '{"file_path":"/books/x/ch1.md"}' }),
      event('tool/call', { turn: 1, step: 2, callId: 'c2', name: 'bash', arguments: '{"command":"ls -la","description":"看看目录里有什么"}' }),
      event('tool/call', { turn: 1, step: 3, callId: 'c3', name: 'read', arguments: 'not json at all' }),
    ])

    expect(transcript[0].detail).toBe('/books/x/ch1.md')
    // A shell call carries both the raw command and the model's own sentence;
    // the sentence is the human one, so it wins.
    expect(transcript[1].detail).toBe('看看目录里有什么')
    expect(transcript[2].detail).toBeUndefined()
  })

  it('ignores log entries that carry no transcript meaning', () => {
    expect(transcriptOf([event('step/start', {}), event('request/context', {})])).toEqual([])
  })
})

describe('NovelTranscript', () => {
  it('renders one node per entry and marks the streaming one', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(createElement(NovelTranscript, {
        entries: [
          { kind: 'user', id: 'a', text: '写一段开场。' },
          { kind: 'assistant', id: 'b', text: '风起于青萍之末。', streaming: true },
          { kind: 'tool', id: 'c', name: 'Read', state: 'done' },
        ],
      }))
    })

    expect(container.querySelectorAll('[data-novel-transcript-entry]')).toHaveLength(3)
    expect(container.querySelector('[data-novel-transcript-streaming="true"]')).not.toBeNull()
    expect(container.textContent).toContain('风起于青萍之末。')

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('renders a tool call as prose, never as the tool name', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(createElement(NovelTranscript, {
        entries: [
          { kind: 'tool', id: 'a', text: 'propose_novel_result_packet', state: 'done', detail: '第一章' },
          { kind: 'tool', id: 'b', text: 'read', state: 'running' },
          { kind: 'tool', id: 'c', text: 'write', state: 'failed', detail: '/books/x/ch2.md' },
        ],
      }))
    })

    const text = container.textContent ?? ''
    expect(text).toContain('已整理成提案')
    expect(text).toContain('第一章')
    expect(text).toContain('正在读取文件')
    expect(text).toContain('写入文件时出错')
    // The harness's identifiers must not reach the manuscript.
    expect(text).not.toContain('propose_novel_result_packet')
    expect(text).not.toContain('running')
    expect(text).not.toContain('done')

    await act(async () => { root.unmount() })
    container.remove()
  })

  it('says so when there is nothing to show, rather than rendering an empty box', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => { root.render(createElement(NovelTranscript, { entries: [] })) })

    expect(container.querySelectorAll('[data-novel-transcript-entry]')).toHaveLength(0)
    expect((container.textContent ?? '').trim()).not.toBe('')

    await act(async () => { root.unmount() })
    container.remove()
  })
})
