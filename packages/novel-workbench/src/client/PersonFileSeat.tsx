/**
 * The 人物档案 drawer's seat occupant: it reads which person the frame has open,
 * loads that person's file from accepted Canon, and renders nothing while the
 * drawer is closed.
 */
import { createElement, useEffect, useState, type ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { useWorkbenchState, workbenchActions } from './store.js'
import { resolveCurrentWork, type NovelPersonFile, type NovelWorkFace } from './novel-data.js'
import { PersonFileDrawer } from './PersonFileDrawer.js'

/** Everything the seat receives. */
export type PersonFileSeatProps = PropsRuntime<'sidebar'> & NovelWorkFace

/** The drawer seat: loads the open person and renders the drawer. */
export function PersonFileSeat(props: PersonFileSeatProps): ReactNode {
  const state = useWorkbenchState()
  const works = props.useWorkspaces(snapshot => snapshot.items)
  const current = props.useSessions(snapshot => snapshot.current)
  const work = resolveCurrentWork(works, current)
  const workId = work?.workspaceId
  const personId = state.personFileId
  const [file, setFile] = useState<NovelPersonFile | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (workId === undefined || personId === undefined) {
      setFile(undefined)
      setError(undefined)
      return
    }
    let live = true
    setError(undefined)
    props.loadPersonFile(workId, personId).then(
      value => {
        if (live) setFile(value)
      },
      (failure: unknown) => {
        if (!live) return
        setFile(undefined)
        setError(failure instanceof Error ? failure.message : String(failure))
      },
    )
    return () => {
      live = false
    }
  }, [workId, personId, props.loadPersonFile, state.revision])

  if (personId === undefined) return null
  if (error !== undefined) {
    return createElement('p', { className: 'nw-canvas-error', role: 'alert' }, error)
  }
  return createElement(PersonFileDrawer, {
    file,
    onClose: () => { workbenchActions.closePersonFile() },
    onContinueFrom: () => { workbenchActions.openDetails() },
  })
}
