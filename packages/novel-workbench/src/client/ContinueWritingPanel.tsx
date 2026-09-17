/**
 * Paragraph-level continuation: the author says what happens next, asks for
 * prose, and decides whether to keep it.
 *
 * This is the deliberate counterpart of the grey sentence suggestion, and the
 * differences are the whole design:
 *
 * 1. **The author asks.** A suggestion arrives on its own after a pause; this one
 *    waits for a click. That is why a failure here is spoken out loud — silence
 *    the author did not ask for is polite, silence they did ask for is a button
 *    that does nothing.
 * 2. **The beats are theirs, in their order.** The inspiration box is not a
 *    prompt: one line is one thing that should happen, kept in the order written.
 * 3. **Nothing reaches the draft until they adopt it.** The prose sits in the
 *    panel until the author takes it; discarding costs nothing, and neither
 *    outcome can reach Canon.
 *
 * Stopping has to orphan the answer, not just hide it: a request the author
 * already stopped must not reappear when the model finally replies.
 */
import { useRef, useState, type ReactNode } from 'react'
import type { NovelContinuationResult } from '@novel-agent/novel-project/types'

const PANEL_CSS = `
.novel-continue {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-100) / .5);
  font-family: var(--font-ui); font-size: 13px;
}
.novel-continue-head { display: flex; align-items: center; gap: 10px; color: hsl(var(--text-200)); }
.novel-continue-input {
  width: 100%; min-height: 64px; resize: vertical;
  padding: 8px 10px;
  border: 1px solid hsl(var(--border-100)); border-radius: 8px;
  background: hsl(var(--bg-000)); color: hsl(var(--text-000));
  font-family: var(--font-serif); font-size: 14px; line-height: 1.7;
}
.novel-continue-actions { display: flex; gap: 8px; align-items: center; }
.novel-continue-text {
  padding: 10px 12px; border-radius: 8px;
  background: hsl(var(--bg-000));
  font-family: var(--font-serif); font-size: var(--read-size); line-height: var(--read-lh);
  white-space: pre-wrap; color: hsl(var(--text-000));
}
.novel-continue-problem { color: hsl(var(--warn)); }
`

/** The author's beats: one per line, blank lines dropped, order kept. */
export function inspirationBeats(raw: string): readonly string[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
}

/** Everything the panel needs. */
export interface ContinueWritingPanelProps {
  /** Ask for the prose. Rejects only when the transport itself fails. */
  readonly onGenerate: (inspiration: readonly string[], signal: AbortSignal) => Promise<NovelContinuationResult>
  /** Take the prose into the draft. The panel does not write anything itself. */
  readonly onAdopt: (text: string) => void
}

/** Where the panel is in its own small cycle. */
type PanelState = 'idle' | 'working' | 'ready' | 'failed'

/** The continuation panel. */
export function ContinueWritingPanel(props: ContinueWritingPanelProps): ReactNode {
  const [raw, setRaw] = useState('')
  const [state, setState] = useState<PanelState>('idle')
  const [prose, setProse] = useState('')
  const [problem, setProblem] = useState<string | undefined>(undefined)
  /**
   * Which request is the live one. Stopping bumps this, so an answer to a
   * request the author already stopped is dropped on arrival instead of
   * appearing after they cancelled it.
   */
  const generation = useRef(0)
  const inFlight = useRef<AbortController | undefined>(undefined)

  const generate = (): void => {
    const controller = new AbortController()
    inFlight.current = controller
    const token = (generation.current += 1)
    setState('working')
    setProblem(undefined)
    setProse('')
    void props.onGenerate(inspirationBeats(raw), controller.signal).then(
      answer => {
        if (generation.current !== token) return
        inFlight.current = undefined
        if (answer.state === 'ok') {
          setProse(answer.text)
          setState('ready')
          return
        }
        setProblem(answer.message)
        setState('failed')
      },
      () => {
        if (generation.current !== token) return
        inFlight.current = undefined
        setProblem('这次续写没能完成，可以再试一次。')
        setState('failed')
      },
    )
  }

  const stop = (): void => {
    // Bump first: the in-flight answer is no longer this panel's business.
    generation.current += 1
    inFlight.current?.abort()
    inFlight.current = undefined
    setState('idle')
  }

  const discard = (): void => {
    setProse('')
    setProblem(undefined)
    setState('idle')
  }

  const adopt = (): void => {
    props.onAdopt(prose)
    setProse('')
    setProblem(undefined)
    setState('idle')
  }

  return (
    <div className="novel-continue" data-novel-continue="true">
      <style>{PANEL_CSS}</style>
      <div className="novel-continue-head">
        <span>接着往下写</span>
        <span className="novel-continue-problem" data-novel-continue-state={state}>
          {state === 'working' ? '正在写…'
            : state === 'ready' ? '写好了，要不要用？'
              : state === 'failed' ? ''
                : '一行一件事，按你写的顺序推进'}
        </span>
      </div>
      <textarea
        className="novel-continue-input"
        data-novel-continue-input="true"
        placeholder={'接下来发生什么？一行一件事。\n例如：\n先写风声\n再写脚步声'}
        value={raw}
        onChange={event => { setRaw(event.target.value) }}
        aria-label="情节灵感"
      />
      <div className="novel-continue-actions">
        {state === 'working' ? (
          <button type="button" className="btn sm" data-novel-continue-stop="true" onClick={stop}>
            停止
          </button>
        ) : (
          <button
            type="button"
            className="btn primary sm"
            data-novel-continue-generate="true"
            onClick={generate}
          >
            {state === 'failed' ? '再试一次' : '生成'}
          </button>
        )}
        {problem !== undefined && (
          <span className="novel-continue-problem" role="alert">{problem}</span>
        )}
      </div>
      {state === 'ready' && (
        <>
          <div className="novel-continue-text" data-novel-continue-text="true">{prose}</div>
          <div className="novel-continue-actions">
            <button
              type="button"
              className="btn primary sm"
              data-novel-continue-adopt="true"
              onClick={adopt}
            >
              采用进稿子
            </button>
            <button
              type="button"
              className="btn sm"
              data-novel-continue-discard="true"
              onClick={discard}
            >
              丢弃
            </button>
            <span className="novel-continue-problem">
              采用只写进草稿；要进 Canon，仍然要提交这一章、再在收件箱里逐条接受。
            </span>
          </div>
        </>
      )}
    </div>
  )
}
