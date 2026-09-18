/**
 * The blast radius of a broken canvas.
 *
 * One occupant renders every novel view, and a view that throws used to take the
 * whole seat with it: the author got a blank rectangle, and because the crashed
 * tree was never replaced, every canvas they opened afterwards was blank too. The
 * workbench looked dead rather than damaged.
 *
 * This boundary stops that at the canvas that failed. It is deliberately small —
 * a class component, no dependency — because an error boundary is the one thing
 * React only offers as one. Two rules shape it:
 * - **The author is told which canvas died and why.** A card that only says
 *   "something went wrong" leaves them with no move to make.
 * - **重试 is a remount, not a repaint.** The subtree is keyed by the attempt, so
 *   a retry starts from a clean slate instead of re-rendering the tree that
 *   already failed.
 */
import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'

export interface CanvasBoundaryProps {
  /** The canvas this boundary protects, named on the card in the author's words. */
  readonly label: string
  readonly children: ReactNode
}

interface CanvasBoundaryState {
  readonly failure: string | undefined
  /** Bumped by 重试; it keys the subtree so a retry is a fresh mount. */
  readonly attempt: number
}

const CRASH_CSS = `
[data-novel-canvas-crashed] {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-000));
}
[data-novel-canvas-crashed] .nw-canvas-crashed-title {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--text-000));
}
[data-novel-canvas-crashed] .nw-canvas-crashed-why {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: hsl(var(--text-200));
  word-break: break-word;
}
[data-novel-canvas-crashed] .nw-canvas-crashed-hint {
  margin: 0;
  font-size: 12px;
  color: hsl(var(--text-200));
}
`

export class CanvasBoundary extends Component<CanvasBoundaryProps, CanvasBoundaryState> {
  override state: CanvasBoundaryState = { failure: undefined, attempt: 0 }

  static getDerivedStateFromError(error: unknown): Partial<CanvasBoundaryState> {
    return { failure: error instanceof Error ? error.message : String(error) }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Caught is not the same as hidden: whoever reads the console still sees it.
    console.error(`novel canvas "${this.props.label}" crashed`, error, info.componentStack)
  }

  private readonly retry = (): void => {
    this.setState(current => ({ failure: undefined, attempt: current.attempt + 1 }))
  }

  override render(): ReactNode {
    if (this.state.failure === undefined) {
      return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
    }
    return (
      <div data-novel-canvas-crashed={this.props.label} role="alert">
        <style>{CRASH_CSS}</style>
        <span className="nw-canvas-crashed-title">{`${this.props.label}打不开`}</span>
        <p className="nw-canvas-crashed-why">{this.state.failure}</p>
        <p className="nw-canvas-crashed-hint">
          别的画布还能用，稿子和故事内容都没有动过。可以先重试一次。
        </p>
        <button
          type="button"
          className="btn sm"
          data-novel-canvas-retry=""
          onClick={this.retry}
        >
          重试
        </button>
      </div>
    )
  }
}
