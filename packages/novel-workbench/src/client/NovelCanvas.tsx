/**
 * The novel-mode main canvas: the seat the frame shows for every view except
 * 线程. One occupant switches on the workbench view state, so a canvas change
 * never re-declares a seat and the conversation surface stays mounted beside it.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NovelResultItemDecision } from '@novel-agent/novel-project/types'
import { WORKBENCH_VIEWS, useWorkbenchState, workbenchActions } from './store.js'
import {
  resolveCurrentWork,
  type NovelReviewDeck,
  type NovelReviewImpact,
  type NovelRevisionRow,
  type NovelStoryMap,
  type NovelDiagnostics,
  type NovelWorkFace,
} from './novel-data.js'
import { AdvancedView } from './AdvancedView.js'
import { ProposalReviewView } from './ProposalReviewView.js'
import { StoryMapView } from './StoryMapView.js'
import { VersionHistoryView } from './VersionHistoryView.js'

/** Everything the canvas seat receives: the framework shares and the data face. */
export type NovelCanvasProps = PropsRuntime<'novel.canvas'> & NovelWorkFace

const CANVAS_CSS = `
[data-novel-canvas] {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 24px 28px;
  box-sizing: border-box;
  background: hsl(var(--nw-bg-100));
  color: hsl(var(--nw-text-000));
}
[data-novel-canvas] h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
[data-novel-canvas] p { margin: 0; color: hsl(var(--nw-text-100)); }
[data-novel-canvas] .nw-note {
  padding: 12px 16px;
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 10px;
  background: hsl(var(--nw-bg-000));
  font-size: 13px;
  color: hsl(var(--nw-text-200));
}
[data-novel-canvas] .nw-canvas-error {
  padding: 12px 16px;
  border: 1px solid hsl(var(--nw-border-100));
  border-radius: 10px;
  background: hsl(var(--nw-bg-000));
  font-size: 13px;
  color: hsl(var(--nw-text-100));
}
`

/** The novel canvas occupant. */
export function NovelCanvas(props: NovelCanvasProps): ReactNode {
  const state = useWorkbenchState()
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const work = resolveCurrentWork(works, props.sessionId)
  const workId = work?.workspaceId
  const sessionId = props.sessionId
  const {
    loadStoryMap,
    loadReviews,
    loadHistory,
    previewReview,
    submitReview,
    discardProposal,
    rollbackTo,
    loadDiagnostics,
  } = props
  const jobs = props.useSessions(snapshot => snapshot.jobsBySession)
  const subagents = props.useSessions(snapshot => snapshot.subagentsByParent)
  const [map, setMap] = useState<NovelStoryMap | undefined>(undefined)
  const [deck, setDeck] = useState<NovelReviewDeck | undefined>(undefined)
  const [impact, setImpact] = useState<NovelReviewImpact | undefined>(undefined)
  const [history, setHistory] = useState<readonly NovelRevisionRow[]>([])
  const [diagnostics, setDiagnostics] = useState<NovelDiagnostics | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (state.view !== 'map' || workId === undefined) return
    let live = true
    setError(undefined)
    loadStoryMap(workId).then(
      value => {
        if (live) setMap(value)
      },
      (failure: unknown) => {
        if (!live) return
        setMap(undefined)
        setError(failure instanceof Error ? failure.message : String(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, loadStoryMap, state.revision])

  useEffect(() => {
    if (state.view !== 'review' || workId === undefined) return
    let live = true
    setError(undefined)
    setDeck(undefined)
    setImpact(undefined)
    setNotice(undefined)
    loadReviews(workId).then(
      value => {
        if (live) setDeck(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, loadReviews, state.revision])

  useEffect(() => {
    if (state.view !== 'history' || workId === undefined) return
    let live = true
    setError(undefined)
    setNotice(undefined)
    loadHistory(workId).then(
      value => {
        if (live) setHistory(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, loadHistory, state.revision])

  useEffect(() => {
    if (state.view !== 'advanced' || workId === undefined) return
    let live = true
    setError(undefined)
    loadDiagnostics(workId).then(
      value => {
        if (live) setDiagnostics(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, loadDiagnostics, state.revision])

  const proposal = deck?.proposals.find(
    candidate => candidate.unitId !== undefined && candidate.unitId === state.chapterId,
  ) ?? deck?.proposals[0]

  const stageImpact = useCallback((decisions: readonly NovelResultItemDecision[]): void => {
    if (sessionId === undefined || workId === undefined || proposal === undefined) return
    previewReview(sessionId, workId, proposal.packet, decisions).then(
      setImpact,
      (failure: unknown) => { setError(message(failure)) },
    )
  }, [sessionId, workId, proposal, previewReview])

  const run = async (action: () => Promise<string>): Promise<void> => {
    setBusy(true)
    setNotice(undefined)
    try {
      setNotice(await action())
    } catch (failure) {
      setNotice(message(failure))
    } finally {
      setBusy(false)
    }
  }

  if (state.view === 'map') {
    return (
      <section data-novel-canvas="map" aria-label="故事地图">
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && map === undefined && <p className="nw-canvas-error">正在读取人物关系…</p>}
        {map !== undefined && <StoryMapView map={map} />}
      </section>
    )
  }

  if (state.view === 'review') {
    return (
      <section data-novel-canvas="review" aria-label="提案审阅">
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && deck === undefined && <p className="nw-canvas-error">正在读取待审提案…</p>}
        {deck !== undefined && proposal === undefined && (
          <p className="nw-canvas-error">没有待审提案。</p>
        )}
        {deck !== undefined && proposal !== undefined && (
          <ProposalReviewView
            proposal={proposal}
            acceptedRevision={deck.acceptedRevision}
            impact={impact}
            busy={busy}
            notice={notice}
            onDecisions={stageImpact}
            onAccept={decisions => {
              if (sessionId === undefined || workId === undefined) return
              void run(async () => {
                const outcome = await submitReview(sessionId, workId, proposal.packet, decisions)
                workbenchActions.refresh()
                setDeck(await loadReviews(workId))
                return outcome.manuscriptAccepted
                  ? `已接受本章，版本更新到 R${String(outcome.revision)}`
                  : `已接受 ${String(outcome.acceptedSettings)} 条设定变更，正文未接受（R${String(outcome.revision)}）`
              })
            }}
            onDiscard={() => {
              if (workId === undefined) return
              void run(async () => {
                await discardProposal(workId, proposal.packetId)
                workbenchActions.refresh()
                setDeck(await loadReviews(workId))
                return `已丢弃提案 ${proposal.packetId}`
              })
            }}
          />
        )}
      </section>
    )
  }

  if (state.view === 'history') {
    return (
      <section data-novel-canvas="history" aria-label="版本历史">
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        <VersionHistoryView
          rows={history}
          headRevision={history[0]?.revision ?? 0}
          busy={busy}
          notice={notice}
          onRollback={target => {
            if (sessionId === undefined || workId === undefined) return
            void run(async () => {
              const outcome = await rollbackTo(sessionId, workId, target)
              workbenchActions.refresh()
              setHistory(await loadHistory(workId))
              return `已回滚到 R${String(target)}，新版本 R${String(outcome.revision)}`
            })
          }}
        />
      </section>
    )
  }

  if (state.view === 'advanced') {
    return (
      <section data-novel-canvas="advanced" aria-label="进阶">
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        <AdvancedView
          sessionId={sessionId}
          jobs={jobs}
          subagents={subagents}
          diagnostics={diagnostics}
        />
      </section>
    )
  }

  const entry = WORKBENCH_VIEWS.find(candidate => candidate.id === state.view)
  const title = entry?.label ?? '小说画布'

  return (
    <section data-novel-canvas={state.view} aria-label={title}>
      <style>{CANVAS_CSS}</style>
      <h1>{title}</h1>
      <p className="nw-note">该画布由后续增量实现。</p>
    </section>
  )
}

function message(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure)
}
