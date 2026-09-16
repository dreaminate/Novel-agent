/**
 * The writing surface: one chapter's draft, edited in place.
 *
 * The draft is a file in the author's workdir (I3.1), so this component is the
 * only place that holds unsaved prose. Two rules follow from that and are worth
 * stating because breaking either loses the author's work:
 *
 * 1. A save carries the version its read returned. If the file moved under us —
 *    the author edited it in their own editor — the save is refused and the
 *    editor keeps *their* text on screen and says so. It never overwrites, and it
 *    never silently drops what is in the buffer.
 * 2. Autosave is debounced but never cancelled by unmount. Losing a paragraph to
 *    a view switch would be worse than one late write.
 *
 * Tiptap owns the editing model; what the file holds is still plain text with
 * blank-line paragraphs, so saving serializes back to that shape.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { countCharacters } from './novel-copy.js'
import type { ChapterDraft, ChapterDraftSave, ChapterIdentity } from './chapter-files.js'

/** How long the author has to stop typing before a save goes out. */
const AUTOSAVE_MS = 700

const EDITOR_CSS = `
.novel-editor { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0; }
.novel-editor-bar {
  display: flex; align-items: center; gap: 12px;
  font-family: var(--font-ui); font-size: 12px; color: hsl(var(--text-200));
}
.novel-editor-count { margin-left: auto; font-variant-numeric: tabular-nums; }
.novel-editor-state { color: hsl(var(--warn)); }
.novel-editor-surface {
  flex: 1 1 auto; min-height: 0; overflow: auto;
  padding: 8px 2px 40px;
}
.novel-editor-surface .ProseMirror {
  outline: none;
  font-family: var(--font-serif);
  font-size: var(--read-size);
  line-height: var(--read-lh);
  color: hsl(var(--text-000));
  min-height: 40vh;
}
.novel-editor-surface .ProseMirror p { margin: 0 0 .86em; }
.novel-editor-surface .ProseMirror p:empty::after { content: '​'; }
.novel-editor-reading {
  font-family: var(--font-serif);
  color: hsl(var(--text-000));
}
.novel-editor-reading p { margin: 0 0 .86em; }
.novel-editor-toggle { display: flex; gap: 6px; }
.novel-editor-toggle .btn.on { border-color: hsl(var(--accent-brand)); color: hsl(var(--accent-text)); }
.novel-editor-confirm {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px;
  border: 1px solid hsl(var(--accent-brand) / .5);
  border-radius: 10px;
  background: hsl(var(--accent-brand) / .08);
  font-family: var(--font-ui); font-size: 13px; line-height: 1.7;
  color: hsl(var(--text-100));
}
.novel-editor-confirm p { margin: 0; }
.novel-editor-confirm-note { color: hsl(var(--text-200)); font-size: 12px; }
`

/** Everything the writing surface needs. */
export interface NovelEditorProps {
  readonly workId: WorkspaceId | undefined
  /** The chapter being written, or `undefined` while the author has not chosen one. */
  readonly chapter: ChapterIdentity | undefined
  readonly loadChapterDraft: (workId: WorkspaceId, chapter: ChapterIdentity) => Promise<ChapterDraft>
  readonly saveChapterDraft: (
    workId: WorkspaceId,
    chapter: ChapterIdentity,
    text: string,
    version: string,
  ) => Promise<ChapterDraftSave>
  /** Reading measure/body size from the settings sheet. */
  readonly readingSize: number
  readonly readingMeasure: number
  /** First-line indent in em and line height, both from the settings sheet. */
  readonly readingIndent: number
  readonly readingLeading: number
  /** The thread the proposal request is sent into; absent before one is chosen. */
  readonly sessionId: SessionId | undefined
  /** Accepted revision the proposal will be made against. */
  readonly revision: number | undefined
  /** Ask the agent to file this chapter's draft as a proposal. */
  readonly submitChapterProposal: (
    sessionId: SessionId,
    chapter: ChapterIdentity,
    revision: number,
    chars: number,
  ) => Promise<void>
}

/** ProseMirror blocks back to the file's shape: blank line between paragraphs. */
function serialize(editor: { getText(options: { blockSeparator: string }): string }): string {
  return editor.getText({ blockSeparator: '\n\n' })
}

/** The writing surface. */
export function NovelEditor(props: NovelEditorProps): ReactNode {
  const { workId, chapter, loadChapterDraft, saveChapterDraft } = props
  const [status, setStatus] = useState<'loading' | 'clean' | 'dirty' | 'saving' | 'failed'>('loading')
  const [problem, setProblem] = useState<string | undefined>(undefined)
  const [conflict, setConflict] = useState<string | undefined>(undefined)
  const [chars, setChars] = useState(0)
  /** Writing or reading: one document, two states — not two screens. */
  const [mode, setMode] = useState<'write' | 'read'>('write')
  /**
   * Submitting is the one action here whose effect can reach Canon, so it is two
   * steps: the author sees exactly what will be proposed, and against which
   * revision, before anything is sent.
   */
  const [confirming, setConfirming] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [submitProblem, setSubmitProblem] = useState<string | undefined>(undefined)

  // Refs, not state: the debounce timer and the newest version must be readable
  // from the timer callback without re-registering it on every keystroke.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const versionRef = useRef('')
  const chapterRef = useRef<ChapterIdentity | undefined>(chapter)
  chapterRef.current = chapter

  const extensions = useMemo(() => [StarterKit], [])
  const editor = useEditor({
    extensions,
    content: '',
    onUpdate: ({ editor: live }) => {
      setChars(countCharacters(live.getText()))
      setStatus('dirty')
      scheduleSave(live)
    },
  })

  const scheduleSave = useCallback((live: { getText(options: { blockSeparator: string }): string }) => {
    if (timer.current !== undefined) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      const target = chapterRef.current
      if (workId === undefined || target === undefined) return
      const text = serialize(live)
      setStatus('saving')
      void saveChapterDraft(workId, target, text, versionRef.current).then(
        result => {
          if (result.state === 'saved') {
            versionRef.current = result.version
            setProblem(undefined)
            setConflict(undefined)
            setStatus('clean')
            return
          }
          if (result.state === 'conflict') {
            // The author's text stays exactly where it is. Only the state line
            // changes: overwriting here is how a draft gets eaten.
            setConflict(result.message)
            setStatus('failed')
            return
          }
          setProblem(result.message)
          setStatus('failed')
        },
        (failure: unknown) => {
          setProblem(failure instanceof Error ? failure.message : String(failure))
          setStatus('failed')
        },
      )
    }, AUTOSAVE_MS)
  }, [saveChapterDraft, workId])

  // Unmount must not cancel a pending save.
  useEffect(() => () => {
    if (timer.current !== undefined) clearTimeout(timer.current)
  }, [])

  /** Save right now, cancelling the debounce: submitting must not race the file. */
  const flush = useCallback(async (): Promise<void> => {
    if (timer.current !== undefined) {
      clearTimeout(timer.current)
      timer.current = undefined
    }
    const target = chapterRef.current
    if (editor === null || editor === undefined || workId === undefined || target === undefined) return
    const result = await saveChapterDraft(workId, target, serialize(editor), versionRef.current)
    if (result.state === 'saved') {
      versionRef.current = result.version
      setProblem(undefined)
      setConflict(undefined)
      setStatus('clean')
      return
    }
    if (result.state === 'conflict') {
      setConflict(result.message)
      setStatus('failed')
      return
    }
    setProblem(result.message)
    setStatus('failed')
  }, [editor, saveChapterDraft, workId])

  const submit = useCallback(async (): Promise<void> => {
    const target = chapterRef.current
    const sessionId = props.sessionId
    const revision = props.revision
    if (workId === undefined || target === undefined) return
    if (sessionId === undefined || revision === undefined) {
      setSubmitProblem('还没有选定线程，先在左栏开一条线再提交。')
      return
    }
    setSubmitState('sending')
    setSubmitProblem(undefined)
    // The agent is asked to read the file, so the file has to be current first.
    await flush()
    try {
      await props.submitChapterProposal(sessionId, target, revision, chars)
      setSubmitState('sent')
      setConfirming(false)
    } catch (error) {
      setSubmitProblem(error instanceof Error ? error.message : String(error))
      setSubmitState('idle')
    }
  }, [chars, flush, props, workId])

  const load = useCallback((target: ChapterIdentity) => {
    if (workId === undefined) return
    setStatus('loading')
    setProblem(undefined)
    setConflict(undefined)
    void loadChapterDraft(workId, target).then(
      draft => {
        if (draft.state === 'unreadable') {
          setProblem(draft.message)
          setStatus('failed')
          return
        }
        const text = draft.state === 'loaded' ? draft.text : ''
        versionRef.current = draft.state === 'loaded' ? draft.version : ''
        editor?.commands.setContent(text === '' ? '' : text.split(/\n{2,}/).map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join(''))
        setChars(countCharacters(text))
        setStatus('clean')
      },
      (failure: unknown) => {
        setProblem(failure instanceof Error ? failure.message : String(failure))
        setStatus('failed')
      },
    )
  }, [editor, loadChapterDraft, workId])

  useEffect(() => {
    if (editor === undefined || editor === null || chapter === undefined) return
    load(chapter)
    // Deliberately not keyed on `load`: it changes when the editor instance does,
    // and re-loading on every keystroke would fight the author's cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, chapter?.number, chapter?.title, workId])

  if (chapter === undefined || workId === undefined) {
    return (
      <div className="novel-editor">
        <style>{EDITOR_CSS}</style>
        <p className="nw-note">先在左栏选一章，这里就是这一章的稿子。</p>
      </div>
    )
  }

  return (
    <div className="novel-editor" data-novel-editor="true">
      <style>{EDITOR_CSS}</style>
      <div className="novel-editor-bar">
        <span>{`第${String(chapter.number)}章《${chapter.title}》`}</span>
        <span className="novel-editor-toggle">
          <button
            type="button"
            className={mode === 'write' ? 'btn sm on' : 'btn sm'}
            data-novel-editor-mode="write"
            onClick={() => { setMode('write') }}
          >
            写作
          </button>
          <button
            type="button"
            className={mode === 'read' ? 'btn sm on' : 'btn sm'}
            data-novel-editor-mode="read"
            onClick={() => { setMode('read') }}
          >
            阅读
          </button>
        </span>
        <span className="novel-editor-state" data-novel-editor-status={status}>
          {status === 'loading' ? '正在读取草稿…'
            : status === 'saving' ? '正在保存…'
              : status === 'dirty' ? '未保存'
                : conflict !== undefined ? ''
                  : problem !== undefined ? problem
                    : '已保存到稿子文件'}
        </span>
        {conflict !== undefined && <span className="novel-editor-state" role="alert">{conflict}</span>}
        <span className="novel-editor-count" data-novel-editor-count={chars}>{`${String(chars)} 字`}</span>
        {chars > 0 && submitState !== 'sent' && (
          <button
            type="button"
            className="btn sm"
            data-novel-editor-submit="true"
            onClick={() => { setConfirming(true); setSubmitState('idle'); setSubmitProblem(undefined) }}
          >
            提交本章
          </button>
        )}
        {submitState === 'sent' && (
          <span className="novel-editor-state" data-novel-editor-submitted="true">已交给 AI 起草提案</span>
        )}
      </div>
      {confirming && (
        // The one action here that can reach Canon gets said out loud first.
        <div className="novel-editor-confirm" data-novel-editor-confirm="true">
          <p>
            {`把第${String(chapter.number)}章《${chapter.title}》的草稿（${String(chars)} 字）作为一份提案提交，`}
            {`和已接受版本 R${String(props.revision ?? 0)} 对齐。`}
          </p>
          <p className="novel-editor-confirm-note">
            草稿先存盘，再由 AI 读它、产出提案放进提案收件箱。
            Canon 不会因为这一步改变 —— 只有你在审阅里逐条接受，它才动。
          </p>
          {submitProblem !== undefined && (
            <p className="novel-editor-state" role="alert">{submitProblem}</p>
          )}
          <div className="novel-editor-toggle">
            <button
              type="button"
              className="btn sm"
              data-novel-editor-confirm-cancel="true"
              onClick={() => { setConfirming(false) }}
            >
              先不提交
            </button>
            <button
              type="button"
              className="btn primary sm"
              data-novel-editor-confirm-submit="true"
              disabled={submitState === 'sending'}
              onClick={() => { void submit() }}
            >
              {submitState === 'sending' ? '正在提交…' : '提交成提案'}
            </button>
          </div>
        </div>
      )}
      {mode === 'read' ? (
        // Reading is the same text, set as a manuscript: the author should not
        // have to read their own chapter in the editor's voice.
        <article
          className="novel-editor-reading"
          data-novel-editor-reading="true"
          style={{
            padding: '8px 2px 40px',
            fontSize: `${String(props.readingSize)}px`,
            lineHeight: props.readingLeading,
            maxWidth: `${String(props.readingMeasure)}em`,
            ...(props.readingIndent === 0 ? {} : { textIndent: `${String(props.readingIndent)}em` }),
          }}
        >
          {readParagraphs(editor).map((paragraph, index) => (
            <p key={`${String(index)}-${paragraph.slice(0, 8)}`}>{paragraph}</p>
          ))}
        </article>
      ) : (
        <div
          className="novel-editor-surface"
          style={{ fontSize: `${String(props.readingSize)}px`, maxWidth: `${String(props.readingMeasure)}em` }}
        >
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  )
}

/** Escape one paragraph for the HTML Tiptap parses on load. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** The draft's paragraphs, for the reading state. */
function readParagraphs(editor: { getText(options: { blockSeparator: string }): string } | null): readonly string[] {
  if (editor === null) return []
  return editor
    .getText({ blockSeparator: '\n\n' })
    .split(/\n+/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph !== '')
}
