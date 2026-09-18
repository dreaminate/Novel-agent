/**
 * The novel-mode main canvas: the seat the frame shows for every view except
 * 线程. One occupant switches on the workbench view state, so a canvas change
 * never re-declares a seat and the conversation surface stays mounted beside it.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { NovelResultItemDecision } from '@novel-agent/novel-project/types'
import { useWorkbenchState, workbenchActions } from './store.js'
import { NovelEditor } from './NovelEditor.js'
import { planChapterRequest, type ChapterIdentity } from './chapter-files.js'
import {
  resolveCurrentWork,
  type NovelReviewDeck,
  type NovelReviewImpact,
  type NovelRevisionRow,
  type NovelStoryMap,
  type NovelDiagnostics,
  type NovelClueBoard,
  type NovelDebtBoard,
  type NovelChapterContractView,
  type NovelAdvancedPanels,
  type NovelCastBoard,
  type NovelMemoryBoard,
  type NovelTimeline,
  type NovelWorkFace,
  type NovelWorkOutline,
} from './novel-data.js'
import { AdvancedView } from './AdvancedView.js'
import { CastView } from './CastView.js'
import { ChapterContractView } from './ChapterContractView.js'
import { ClueBoardView } from './ClueBoardView.js'
import { DebtBoardView } from './DebtBoardView.js'
import { MemoryView } from './MemoryView.js'
import { MissingPluginCard, missingDomainPlugin } from './MissingPluginCard.js'
import { NovelLanding } from './NovelLanding.js'
import { NovelWelcome } from './NovelWelcome.js'
import { SimulationView } from './SimulationView.js'
import { TimelineView } from './TimelineView.js'
import { ProposalReviewView } from './ProposalReviewView.js'
import { StoryMapView } from './StoryMapView.js'
import { VersionHistoryView } from './VersionHistoryView.js'

/** Everything the canvas seat receives: the framework shares and the data face. */
export type NovelCanvasProps = PropsRuntime<'novel.canvas'> & NovelWorkFace

const CANVAS_CSS = `
[data-novel-canvas] .nw-note {
  padding: 12px 16px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-000));
  font-size: 13px;
  color: hsl(var(--text-200));
}
[data-novel-canvas] .nw-canvas-error {
  padding: 12px 16px;
  border: 1px solid hsl(var(--border-100));
  border-radius: 10px;
  background: hsl(var(--bg-000));
  font-size: 13px;
  color: hsl(var(--text-100));
}
[data-novel-canvas] .reading {
  max-width: var(--read-measure);
  margin: 0 auto;
  font-family: var(--font-serif);
  font-size: var(--read-size);
  line-height: var(--read-lh);
  color: hsl(var(--text-000));
}
[data-novel-canvas] .reading h2 {
  margin: 0 0 var(--s5);
  font-size: var(--fs-20);
  font-weight: 600;
}
[data-novel-canvas] .reading p { margin: 0 0 .86em; }
`

/** Head copy per canvas, in the prototype's wording. */
const VIEW_HEAD: Readonly<Record<string, { readonly title: string; readonly sub: string }>> = {
  // The prototype's exact head copy (its `HEAD` table), so a screen reads the same
  // in the product as it does in the design.
  map: { title: '故事地图', sub: '人物、关系与进度一眼看清 · 点节点看摘要，双击开档案' },
  clues: { title: '伏笔与线索板', sub: '未收束的伏笔 / 线索 / 谜团 · 点证据锚点回到正文' },
  debts: { title: '未收束债务', sub: '按「多久没推进」排序 · 临期项加提示色' },
  cast: { title: '人物与关系', sub: '人物、势力与双向关系（每条两个方向各自独立）' },
  timeline: { title: '时间线', sub: '故事内时间与章节交叉引用' },
  memory: { title: '写作记忆', sub: 'AI 记得什么 · 来源与新鲜度' },
  contract: { title: '本章合同', sub: '这一章要写成什么样，先和 AI 对齐' },
  simulation: { title: '推演', sub: '读者反应与人物压力实验 · 只作创作参考' },
  review: { title: '提案审阅', sub: '作者是决策者，AI 是稿手：逐条决定，再写入故事事实' },
  history: { title: '版本历史', sub: '每个已接受版本一句人话摘要 · 回滚会停用其后的变更' },
  editor: { title: '写作', sub: '这一章的稿子 · 自动保存在你自己的文件夹里' },
  advanced: { title: '进阶面', sub: '内核 / Agent / 插件 / 任务 / 诊断 · 默认关闭，关闭后整组消失' },
}

/**
 * A canvas's own name, for anything outside the seat that has to talk about it —
 * the error boundary says "故事地图打不开" rather than naming a view id.
 */
export function canvasTitle(view: string): string {
  return VIEW_HEAD[view]?.title ?? view
}

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
  const [clues, setClues] = useState<NovelClueBoard | undefined>(undefined)
  const [cast, setCast] = useState<NovelCastBoard | undefined>(undefined)
  const [debts, setDebts] = useState<NovelDebtBoard | undefined>(undefined)
  const [contract, setContract] = useState<NovelChapterContractView | undefined>(undefined)
  /** Accepted revision an experiment would freeze; read from Novel Project. */
  const [acceptedRevision, setAcceptedRevision] = useState<number | undefined>(undefined)
  const [timeline, setTimeline] = useState<NovelTimeline | undefined>(undefined)
  const [memory, setMemory] = useState<NovelMemoryBoard | undefined>(undefined)
  /** True once the reading canvas has an answer for the chapter it opened. */
  const [deck, setDeck] = useState<NovelReviewDeck | undefined>(undefined)
  const [impact, setImpact] = useState<NovelReviewImpact | undefined>(undefined)
  const [history, setHistory] = useState<readonly NovelRevisionRow[]>([])
  /** The chapter the writing surface is editing, named the way its draft file is. */
  const [editorChapter, setEditorChapter] = useState<ChapterIdentity | undefined>(undefined)
  /**
   * The work's outline, read for the writing view whether or not a chapter is
   * open. Without it there is nothing to offer an author who has not picked one,
   * and a work with no chapters has no way to get its first.
   */
  const [editorOutline, setEditorOutline] = useState<NovelWorkOutline | undefined>(undefined)
  /** True while the author is confirming a request to plan the first chapter. */
  const [planning, setPlanning] = useState(false)
  /**
   * Why the writing surface has no chapter: the outline read failed, which is a
   * different thing from the author never having picked one.
   */
  const [editorProblem, setEditorProblem] = useState<string | undefined>(undefined)
  /**
   * What Canon holds for the chapter being written. The draft file is not Canon
   * and accepting never writes it, so the editor needs both to say when they have
   * parted ways.
   */
  const [acceptedText, setAcceptedText] = useState<string | undefined>(undefined)
  const [diagnostics, setDiagnostics] = useState<NovelDiagnostics | undefined>(undefined)
  const [panels, setPanels] = useState<NovelAdvancedPanels | undefined>(undefined)
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
    if (state.view !== 'clues' || workId === undefined) return
    let live = true
    setError(undefined)
    setClues(undefined)
    props.loadClues(workId).then(
      value => {
        if (live) setClues(value)
      },
      (failure: unknown) => {
        if (!live) return
        setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadClues, state.revision])

  useEffect(() => {
    if (state.view !== 'cast' || workId === undefined) return
    let live = true
    setError(undefined)
    setCast(undefined)
    props.loadCast(workId).then(
      value => {
        if (live) setCast(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadCast, state.revision])

  useEffect(() => {
    if (state.view !== 'debts' || workId === undefined) return
    let live = true
    setError(undefined)
    setDebts(undefined)
    props.loadDebts(workId).then(
      value => {
        if (live) setDebts(value)
      },
      (failure: unknown) => {
        if (!live) return
        setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadDebts, state.revision])

  useEffect(() => {
    if (state.view !== 'contract' || workId === undefined) return
    let live = true
    setError(undefined)
    setContract(undefined)
    // The sheet follows the chapter the author opened, and falls back to the one
    // still waiting on a decision — that is the contract the AI is writing against.
    props.loadOutline(workId).then(
      outline => {
        if (!live) return
        const chapters = outline.groups.flatMap(group => group.chapters)
        const chapterId = state.chapterId
          ?? chapters.find(chapter => chapter.status === 'pending')?.id
          ?? chapters.at(-1)?.id
        if (chapterId === undefined) return
        props.loadContract(workId, chapterId).then(
          value => {
            if (live) setContract(value)
          },
          (failure: unknown) => {
            if (live) setError(message(failure))
          },
        )
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, state.chapterId, workId, props.loadOutline, props.loadContract, state.revision])

  useEffect(() => {
    if (state.view !== 'timeline' || workId === undefined) return
    let live = true
    setError(undefined)
    setTimeline(undefined)
    props.loadTimeline(workId).then(
      value => {
        if (live) setTimeline(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadTimeline, state.revision])

  useEffect(() => {
    if (state.view !== 'memory' || workId === undefined) return
    let live = true
    setError(undefined)
    setMemory(undefined)
    props.loadMemory(workId).then(
      value => {
        if (live) setMemory(value)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadMemory, state.revision])

  useEffect(() => {
    if (state.view !== 'simulation' || workId === undefined) return
    let live = true
    setError(undefined)
    setAcceptedRevision(undefined)
    props.loadOutline(workId).then(
      outline => {
        if (live) setAcceptedRevision(outline.revision)
      },
      (failure: unknown) => {
        if (live) setError(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, workId, props.loadOutline, state.revision])

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
    props.loadAdvancedPanels().then(
      value => {
        if (live) setPanels(value)
      },
      () => {
        if (live) setPanels(undefined)
      },
    )
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
  }, [state.view, workId, loadDiagnostics, props.loadAdvancedPanels, state.revision])

  /**
   * The writing surface names its draft file after the chapter, so it needs the
   * chapter's number and title rather than the id the tree carries. The outline
   * is the only place that has both — and it is also what 写作 has to offer an
   * author who has not picked a chapter yet, so it is read whether or not one is
   * open. The chapter id is therefore a branch inside the read, not a gate on it.
   *
   * What the read says when it fails is stated as itself. Leaving the chapter
   * undefined instead made the editor say "先在左栏选一章" — telling the author
   * they had not done something they had, and hiding the actual failure.
   */
  useEffect(() => {
    if (state.view !== 'editor' || workId === undefined) {
      setEditorChapter(undefined)
      setEditorProblem(undefined)
      setEditorOutline(undefined)
      setAcceptedText(undefined)
      return
    }
    let live = true
    setEditorProblem(undefined)
    // The accepted manuscript is what 读已接受正文 shows and what 写回稿子 writes
    // back. It is a second read, not a field of the outline.
    if (state.chapterId === undefined) setAcceptedText(undefined)
    else {
      void props.loadManuscriptText(workId, state.chapterId).then(
        manuscript => {
          if (live) setAcceptedText(manuscript?.text)
        },
        () => {
          // A chapter Canon has never accepted is the normal first case, and a
          // read that fails is not worth a card of its own: the editor simply
          // has no accepted version to compare against.
          if (live) setAcceptedText(undefined)
        },
      )
    }
    props.loadOutline(workId).then(
      outline => {
        if (!live) return
        setEditorOutline(outline)
        // 提交本章 proposes against the accepted revision, and this read is where
        // the writing surface learns it. (The simulation view reads it too, but
        // only when it is showing.)
        setAcceptedRevision(outline.revision)
        if (state.chapterId === undefined) {
          setEditorChapter(undefined)
          return
        }
        const chapter = outline.groups
          .flatMap(group => group.chapters)
          .find(candidate => candidate.id === state.chapterId)
        if (chapter === undefined) {
          // The remembered chapter is not in this work — most often a pick left
          // over from a work the author has since moved away from. Holding on to
          // it would leave the canvas waiting for a chapter that is not coming,
          // so the pick is dropped and the author is asked which one instead.
          setEditorChapter(undefined)
          workbenchActions.openChapter(undefined)
          return
        }
        setEditorChapter({ number: chapter.number, title: chapter.title })
      },
      (failure: unknown) => {
        if (!live) return
        setEditorChapter(undefined)
        setEditorOutline(undefined)
        setEditorProblem(message(failure))
      },
    )
    return () => {
      live = false
    }
  }, [state.view, state.chapterId, workId, props.loadOutline, props.loadManuscriptText, state.revision])

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

  // A stable identity: the story map re-creates its sigma renderer when this
  // callback changes, so an inline arrow would rebuild the graph every render.
  const openPerson = useCallback((id: string): void => {
    workbenchActions.openPersonFile(id)
  }, [])

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

  /**
   * 让 AI 规划第一章. A request runs *in* a thread, so an author who has none is
   * given one first — that is what they wanted anyway — and the confirmation
   * waits until there is somewhere for the request to go.
   */
  const planFirstChapter = (): void => {
    if (sessionId === undefined) {
      if (workId !== undefined) props.newThread(workId)
      workbenchActions.openDetails()
      return
    }
    setPlanning(true)
  }

  const confirmPlan = (): void => {
    setPlanning(false)
    if (sessionId === undefined || acceptedRevision === undefined) return
    void run(async () => {
      await props.sendToThread(sessionId, planChapterRequest(acceptedRevision))
      return '已请 AI 规划这一章。提案到了会显示在右栏的待审里。'
    })
  }

  // No work yet: the canvas owns the first step, so an author never has to hunt
  // for the shipped composer's picker to get started.
  if (workId === undefined) {
    return (
      <Shell view={state.view} tools={null}>
        <style>{CANVAS_CSS}</style>
        <NovelWelcome
          adoptWork={path => props.adoptWork(path)}
          pickWorkDirectory={() => props.pickWorkDirectory()}
          notice={error}
          onAdopted={() => { workbenchActions.refresh() }}
        />
      </Shell>
    )
  }

  // A missing domain plugin is a state, not a failure: the card names what the
  // Host is missing and lets the author retry once it is installed.
  const gap = error === undefined ? undefined : missingDomainPlugin(error)
  if (gap !== undefined) {
    return (
      <Shell view={state.view} tools={null}>
        <style>{CANVAS_CSS}</style>
        <MissingPluginCard
          gap={gap}
          onRetry={() => { workbenchActions.refresh() }}
          onBackToMap={() => { workbenchActions.setView('map') }}
        />
      </Shell>
    )
  }

  if (state.view === 'map') {
    return (
      <Shell view="map" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && map === undefined && <p className="nw-canvas-error">正在读取人物关系…</p>}
        {map !== undefined && (
          <StoryMapView
            map={map}
            onOpenPerson={openPerson}
            onOpenCast={() => { workbenchActions.setView('cast') }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'clues') {
    return (
      <Shell view="clues" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && clues === undefined && <p className="nw-canvas-error">正在读取伏笔与线索…</p>}
        {clues !== undefined && (
          <ClueBoardView
            board={clues}
            // The anchor jumps into 正文阅读; which chapter it lands on arrives with
            // the chapter outline, so the jump is wired when that read lands.
            onOpenAnchor={() => { workbenchActions.setView('editor') }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'debts') {
    return (
      <Shell view="debts" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && debts === undefined && <p className="nw-canvas-error">正在读取未收束债务…</p>}
        {debts !== undefined && (
          <DebtBoardView
            board={debts}
            onOpenAnchor={() => { workbenchActions.setView('editor') }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'cast') {
    return (
      <Shell view="cast" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && cast === undefined && <p className="nw-canvas-error">正在读取人物与关系…</p>}
        {cast !== undefined && (
          <CastView
            board={cast}
            onOpenPerson={openPerson}
            onContinueFrom={() => { workbenchActions.openDetails() }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'contract') {
    return (
      <Shell view="contract" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && contract === undefined && (
          <p className="nw-canvas-error">正在读取本章合同…</p>
        )}
        {contract !== undefined && (
          <ChapterContractView
            contract={contract}
            onReview={() => { workbenchActions.setView('review') }}
            onRead={() => { workbenchActions.setView('editor') }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'timeline') {
    return (
      <Shell view="timeline" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && timeline === undefined && <p className="nw-canvas-error">正在读取时间线…</p>}
        {timeline !== undefined && (
          <TimelineView
            timeline={timeline}
            onOpenChapter={() => { workbenchActions.setView('editor') }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'memory') {
    return (
      <Shell view="memory" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && memory === undefined && <p className="nw-canvas-error">正在读取写作记忆…</p>}
        {memory !== undefined && (
          <MemoryView
            memory={memory}
            onOpenClues={() => { workbenchActions.setView('clues') }}
            onOpenThread={() => { workbenchActions.openDetails() }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'simulation') {
    return (
      <Shell view="simulation" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        {error === undefined && acceptedRevision === undefined && (
          <p className="nw-canvas-error">正在读取已接受版本…</p>
        )}
        {acceptedRevision !== undefined && (
          <SimulationView
            revision={acceptedRevision}
            onOpenThread={() => { workbenchActions.openDetails() }}
          />
        )}
      </Shell>
    )
  }

  if (state.view === 'review') {
    return (
      <Shell view="review" tools={null}>
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
            sessionless={sessionId === undefined}
            onOpenThread={() => {
              if (workId === undefined) return
              props.newThread(workId)
              workbenchActions.openDetails()
            }}
            onAccept={decisions => {
              if (sessionId === undefined) {
                // Accepting is a request into a thread. Without one there is
                // nowhere for the decision to go, and doing nothing at all is
                // how the author concluded the button was broken.
                setNotice('要先开一条线程，才能把接受的决定交给 AI。')
                return
              }
              if (workId === undefined) return
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
      </Shell>
    )
  }

  if (state.view === 'history') {
    return (
      <Shell view="history" tools={null}>
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
      </Shell>
    )
  }

  if (state.view === 'editor') {
    return (
      <Shell view="editor" tools={null}>
        <style>{CANVAS_CSS}</style>
        {editorProblem !== undefined && (
          <div className="nw-canvas-error" data-novel-editor-outline-error="" role="alert">
            <p>{`这一章读不出来：${editorProblem}`}</p>
            <button
              type="button"
              className="btn sm"
              data-novel-editor-outline-retry=""
              onClick={() => { workbenchActions.refresh() }}
            >
              重试
            </button>
          </div>
        )}
        {editorProblem === undefined && notice !== undefined && (
          <p className="nw-note" role="status">{notice}</p>
        )}
        {editorProblem === undefined && editorChapter === undefined && editorOutline === undefined && (
          // The catalogue is read for both cases below, so this is what the author
          // sees for the moment it takes — not a claim about what they did.
          <p className="nw-note">正在读取作品目录…</p>
        )}
        {editorProblem === undefined && editorChapter === undefined && editorOutline !== undefined && (
          // No chapter open. This screen owns both of the ways in: the chapters
          // to open, and — when there are none — asking for a first one.
          <NovelLanding
            outline={editorOutline}
            onOpenChapter={id => { workbenchActions.openChapter(id) }}
            onPlan={planFirstChapter}
            planning={planning}
            onConfirmPlan={confirmPlan}
            onCancelPlan={() => { setPlanning(false) }}
          />
        )}
        {editorProblem === undefined && editorChapter !== undefined && (
          <NovelEditor
            workId={workId}
            chapter={editorChapter}
            loadChapterDraft={props.loadChapterDraft}
            saveChapterDraft={props.saveChapterDraft}
            readingSize={state.settings.readingSize}
            readingMeasure={state.settings.readingMeasure}
            readingIndent={state.settings.readingIndent}
            readingLeading={state.settings.readingLeading}
            sessionId={sessionId}
            revision={acceptedRevision}
            submitChapterProposal={props.submitChapterProposal}
            completionEnabled={state.settings.completionEnabled}
            completionDelayMs={state.settings.completionDelayMs}
            requestCompletion={async (before: string) => {
              if (workId === undefined || sessionId === undefined) return undefined
              const text = await props.completeSentence(sessionId, workId, before, new AbortController().signal)
              return text === '' ? undefined : text
            }}
            requestContinuation={async (before, inspiration, signal) => {
              if (workId === undefined || sessionId === undefined) {
                return { state: 'failed', message: '还没有选定线程，先在左栏开一条线再续写。' }
              }
              return await props.continueWriting(sessionId, workId, { inspiration, before }, signal)
            }}
            requestRefine={props.refineChapter}
            refineMode={state.settings.refineMode}
            onOpenInbox={() => { workbenchActions.setView('review') }}
            onOpenThread={() => {
              if (workId === undefined) return
              props.newThread(workId)
              workbenchActions.openDetails()
            }}
            acceptedText={acceptedText}
          />
        )}
      </Shell>
    )
  }

  // 正文阅读 used to be a canvas of its own. It is the editor's reading state
  // now — one document in two states instead of two screens for one manuscript —
  // so the entry is gone rather than hidden, and everything that used to open it
  // opens 写作 instead.

  if (state.view === 'advanced') {
    return (
      <Shell view="advanced" tools={null}>
        <style>{CANVAS_CSS}</style>
        {error !== undefined && <p className="nw-canvas-error" role="alert">{error}</p>}
        <AdvancedView
          sessionId={sessionId}
          jobs={jobs}
          subagents={subagents}
          diagnostics={diagnostics}
          panels={panels}
          onReload={() => { workbenchActions.refresh() }}
        />
      </Shell>
    )
  }

  return (
    <Shell view={state.view} tools={null}>
      <style>{CANVAS_CSS}</style>
      <p className="nw-note">该画布由后续增量实现。</p>
    </Shell>
  )
}

/**
 * The prototype's canvas skeleton: the head carries the title, the one-line
 * summary and the canvas tools; the body scrolls the canvas itself.
 */
function Shell(props: {
  readonly view: string
  readonly tools: ReactNode
  readonly children: ReactNode
}): ReactNode {
  const copy = VIEW_HEAD[props.view] ?? { title: props.view, sub: '' }
  return (
    <section data-novel-canvas={props.view} aria-label={copy.title} style={{ display: 'contents' }}>
      <div className="main-head">
        <div className="h-wrap">
          <h1>{copy.title}</h1>
          {copy.sub.length > 0 && <div className="sub">{copy.sub}</div>}
        </div>
        <div className="tools">{props.tools}</div>
      </div>
      <div className="main-body flush">{props.children}</div>
    </section>
  )
}

function message(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure)
}
