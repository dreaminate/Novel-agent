#!/usr/bin/env node
/**
 * A2 — the last paragraph survives leaving.
 *
 * Three things, machine-checkable, and the middle one is the whole point of F2b:
 * ① prose typed and then abandoned by *switching view* within the 700ms debounce
 *    is still in that chapter's draft file (the unmount used to cancel it);
 * ② prose typed and then abandoned by *switching chapter* lands in the chapter it
 *    was typed into — and in no other chapter's file;
 * ③ a reload comes back to the chapter the author was last in.
 *
 * Page close (`pagehide`/`beforeunload`) is unit-only: CDP cannot ask Chrome to
 * really close a page.
 *
 * This probe writes into the author's draft, and creates one for the second
 * chapter if the app does. It backs up what it touches, restores the file it
 * edits and removes the one it creates, recording sha256 before and after.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, sleep, writeSummary } from '../probe-harness.mjs'

const outDir = fileURLToPath(new URL('.', import.meta.url))
const workspace = '/private/tmp/nw-workspace/天机阁主'
const firstDraft = join(workspace, '第1章《开篇章》.草稿.md')
const secondDraft = join(workspace, '第2章《测试夹具第二章》.草稿.md')
const backupPath = join(outDir, 'draft-backup.md')
const MARKER_VIEW = '切视图之前写的这一句。'
const MARKER_CHAPTER = '切章节之前写的这一句。'

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const readIfAny = path => (existsSync(path) ? readFileSync(path, 'utf8') : null)

const result = { at: new Date().toISOString(), markers: [MARKER_VIEW, MARKER_CHAPTER] }
let lab

try {
  copyFileSync(firstDraft, backupPath)
  result.draftShaBefore = sha256(firstDraft)
  result.secondDraftExistedBefore = existsSync(secondDraft)

  lab = await launch({ port: 9463, outDir })
  const { session: s } = lab

  const openChapter = async (id) => {
    await s.click(`[data-novel-chapter="${id}"]`)
    await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
    await sleep(1600)
  }

  // ── set up: chapter 1, with the caret in the prose ──
  await openChapter('vol01-ch0001')
  result.opened = await s.ev(
    `document.querySelector('.novel-editor-bar')?.textContent?.trim().slice(0, 20) ?? null`)
  const at = await s.focusEditor()

  // ── ① type, then leave by switching view, inside the debounce ──
  await s.clickIntoEditor(at)
  await s.send('Input.insertText', { text: MARKER_VIEW })
  const typedForView = Date.now()
  await sleep(250)
  await lab.openView('map')
  result.viewSwitchGapMs = Date.now() - typedForView

  await sleep(1500)
  result.byView = {
    markerInFirstDraft: readIfAny(firstDraft)?.includes(MARKER_VIEW) ?? false,
    editorWasUnmounted: await s.ev(`document.querySelector('[data-novel-editor]') === null`),
  }
  await s.shot('a2-01-after-view-switch')

  // ── ② type again, then leave by switching chapter ──
  await lab.openView('editor')
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(1600)
  await s.clickIntoEditor(at)
  await s.send('Input.insertText', { text: MARKER_CHAPTER })
  const typedForChapter = Date.now()
  await sleep(250)
  // Time the click itself, not the settling that follows it: what matters is the
  // gap between the keystroke and leaving, against a 700ms debounce.
  const clickedChapter = Date.now()
  await s.click('[data-novel-chapter="vol01-ch0002"]')
  result.chapterSwitchGapMs = clickedChapter - typedForChapter
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(1600)

  await sleep(1500)
  result.byChapter = {
    markerInFirstDraft: readIfAny(firstDraft)?.includes(MARKER_CHAPTER) ?? false,
    // The work belongs to the chapter it was typed into: the next chapter's file
    // must not be carrying it, whether or not that file exists yet.
    markerInSecondDraft: readIfAny(secondDraft)?.includes(MARKER_CHAPTER) ?? false,
    secondDraftExists: existsSync(secondDraft),
    nowOn: await s.ev(`document.querySelector('.novel-editor-bar')?.textContent?.trim().slice(0, 20) ?? null`),
  }
  await s.shot('a2-02-after-chapter-switch')

  // ── ③ a reload comes back to the chapter last worked in ──
  await s.send('Page.reload', { ignoreCache: false })
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`, 25000)
  await sleep(2000)
  result.afterReload = await s.ev(`(() => ({
    view: document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view') ?? null,
    chapter: document.querySelector('[data-novel-chapter][aria-current="true"]')?.getAttribute('data-novel-chapter') ?? null,
    askToPick: document.body.innerText.includes('先在左栏选一章'),
    bar: document.querySelector('.novel-editor-bar')?.textContent?.trim().slice(0, 20) ?? null,
  }))()`)
  await s.shot('a2-03-after-reload')

  result.consoleErrorCount = s.errors.length

  const pass = result.byView.markerInFirstDraft
    && result.byView.editorWasUnmounted
    && result.byChapter.markerInFirstDraft
    && result.byChapter.markerInSecondDraft === false
    && result.afterReload.view === 'editor'
    && result.afterReload.chapter === 'vol01-ch0002'
    && result.afterReload.askToPick === false
    && result.consoleErrorCount === 0
  result.verdict = pass ? 'pass' : 'fail'
  console.log(JSON.stringify(result, null, 1))
  process.exitCode = pass ? 0 : 1
} catch (error) {
  result.verdict = 'error'
  result.error = error instanceof Error ? error.message : String(error)
  console.error(`probe-a2: ${result.error}`)
  process.exitCode = 1
} finally {
  lab?.close()
  copyFileSync(backupPath, firstDraft)
  if (!result.secondDraftExistedBefore) rmSync(secondDraft, { force: true })
  result.firstDraftRestoredSha = sha256(firstDraft)
  result.firstDraftRestored = result.firstDraftRestoredSha === result.draftShaBefore
  result.secondDraftCleaned = !existsSync(secondDraft) || result.secondDraftExistedBefore
  writeSummary(outDir, 'a2', result)
}
