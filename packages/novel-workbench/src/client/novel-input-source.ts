/**
 * The `@` reference source that puts 人物与章节 next to the shipped file
 * candidates.
 *
 * This is a *source*, not an input: the trigger pipeline owns detection, the
 * menu, keyboard arbitration and the insertion itself. A source only answers
 * "what can be referenced here" and "what does picking one mean", which is why
 * adding a group costs this file and no second input machine.
 *
 * The candidates are Canon reads through this plugin's own face — the contract
 * hands sources a session projection and nothing else, so the RPC access is
 * captured here at registration, exactly as the contract intends.
 */
import type {
  InputTriggerCandidate,
  InputTriggerPick,
  InputTriggerSource,
  PickOutcome,
  ReferenceCodec,
  ReferenceInsert,
} from '@deepseek-ai/dsh-client-ui-input-trigger/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { resolveCurrentWork, type NovelWorkFace } from './novel-data.js'

/** Group label the menu shows above these candidates. */
export const NOVEL_REFERENCE_GROUP = '人物与章节'

/** Reference kind for a person. */
const PERSON = '人物'
/** Reference kind for a chapter. */
const CHAPTER = '章节'
/** How many candidates one group offers before the author should narrow the query. */
const MAX_CANDIDATES = 12

/** One thing an author can point the model at. */
interface NovelReference {
  readonly kind: string
  readonly name: string
  readonly detail: string | undefined
}

/** The reference ids the source hands out: `<kind>:<name>`, opaque to the pipeline. */
function refFor(reference: NovelReference): string {
  return `${reference.kind}:${reference.name}`
}

/** Name half of a reference id. */
function refName(ref: string): string {
  const at = ref.indexOf(':')
  return at < 0 ? ref : ref.slice(at + 1)
}

/** Kind half of a reference id. */
function refKind(ref: string): string {
  const at = ref.indexOf(':')
  return at < 0 ? '' : ref.slice(0, at)
}

/**
 * Clipboard and model projections for one reference.
 *
 * The model form is a self-describing tag rather than a bare name: an author
 * typing `@顾尘` means "this is about that person", and the model should be able
 * to tell a person reference from a chapter reference without guessing.
 */
const CODEC: ReferenceCodec = {
  clipboardText: ref => `@${refName(ref)}`,
  serialize(ref) {
    const kind = refKind(ref)
    const name = refName(ref)
    return Promise.resolve(kind === '' ? name : `<${kind}>${name}</${kind}>`)
  },
}

/** Everything the source reads through. */
export interface NovelReferenceSourceDeps {
  /** Accepted Canon reads: the cast board and the volume/chapter outline. */
  readonly face: NovelWorkFace
  /** The works this client knows, for mapping a session to the work it serves. */
  readonly works: () => readonly WorkspaceView[]
  /** Accepted-Canon revision; a change invalidates the cached reference list. */
  readonly revision: () => number
}

/** Read the references a session can offer; an unreadable work offers none. */
async function loadReferences(
  deps: NovelReferenceSourceDeps,
  sessionId: SessionId,
): Promise<readonly NovelReference[]> {
  const work = resolveCurrentWork(deps.works(), sessionId)
  if (work === undefined) return []
  try {
    const [cast, outline] = await Promise.all([
      deps.face.loadCast(work.workspaceId),
      deps.face.loadOutline(work.workspaceId),
    ])
    const people = cast.people.map(person => ({
      kind: PERSON,
      name: person.name,
      detail: person.faction ?? person.summary,
    }))
    const chapters = outline.groups.flatMap(group => group.chapters.map(chapter => ({
      kind: CHAPTER,
      name: `第 ${String(chapter.number)} 章《${chapter.title}》`,
      detail: group.title,
    })))
    return [...people, ...chapters]
  } catch {
    // An `@` menu is never allowed to be the thing that breaks a send.
    return []
  }
}

/** One menu row for one reference. */
function candidateOf(reference: NovelReference): InputTriggerCandidate {
  return {
    name: reference.name,
    ...(reference.detail === undefined || reference.detail === '' ? {} : { description: reference.detail }),
    icon: 'file',
    value: refFor(reference),
  }
}

/**
 * Build the `@` source.
 * @param deps - the reads this source draws on.
 * @returns the source, ready for `ctx.inputTriggers.registerSource`.
 */
export function createNovelReferenceSource(deps: NovelReferenceSourceDeps): InputTriggerSource {
  /**
   * The reference list per session, keyed by the Canon revision it was read at.
   * The pipeline polls candidates on every keystroke, so the reads must not
   * happen per keystroke; keying on the revision means an accepted proposal
   * refreshes the list by itself.
   */
  const cache = new Map<string, Promise<readonly NovelReference[]>>()

  const referencesFor = (sessionId: SessionId): Promise<readonly NovelReference[]> => {
    const key = `${String(sessionId)}#${String(deps.revision())}`
    const warm = cache.get(key)
    if (warm !== undefined) return warm
    // One entry per session: the previous revision's list is never needed again.
    // Deleting through a Map iterator is safe — the iterator tolerates it.
    for (const stale of cache.keys()) {
      if (!stale.startsWith(`${String(sessionId)}#`)) continue
      cache.delete(stale)
    }
    const pending = loadReferences(deps, sessionId)
    cache.set(key, pending)
    return pending
  }

  return {
    trigger: '@',
    name: NOVEL_REFERENCE_GROUP,
    // Above the file group: in a novel workbench the cast and the chapters are
    // what an author reaches for most, and the file tree is one keystroke away.
    order: -10,
    async candidates(session, req) {
      const references = await referencesFor(session.sessionId)
      const query = req.query.trim().toLowerCase()
      const matched = query === ''
        ? references
        : references.filter(reference => reference.name.toLowerCase().includes(query))
      return matched.slice(0, MAX_CANDIDATES).map(candidateOf)
    },
    onPick(pick: InputTriggerPick): PickOutcome {
      const ref = pick.candidate.value
      if (ref === undefined || ref === '') return undefined
      return {
        insert: {
          source: NOVEL_REFERENCE_GROUP,
          ref,
          label: pick.candidate.name,
          appearance: 'file',
          clipboardText: CODEC.clipboardText(ref),
        } satisfies ReferenceInsert,
      }
    },
    codec: CODEC,
  }
}
