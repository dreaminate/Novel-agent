#!/usr/bin/env node
/**
 * A3 — the submit chain.
 *
 * Four things, machine-checkable:
 * ① the confirm card and the continue panel are never open together;
 * ② after submitting, the editor shows 「去收件箱」 rather than losing the action;
 * ③ writing again brings 「提交本章」 back — submitting is repeatable;
 * ④ the submission does not move Canon. Only an accepted packet does.
 *
 * This probe really submits: `session.prompt(..., 'queue')` returns as soon as the
 * request is queued, so the submitted state appears at once, but a real turn then
 * runs in the thread — the same thing I3.3/I4.x did to prove this boundary.
 *
 * It writes into the author's draft and restores it byte for byte; before
 * submitting it replaces the chapter's text with its own sentence, so the request
 * does not carry whatever test residue was already sitting in the file.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, sleep, writeSummary } from '../probe-harness.mjs'

const outDir = fileURLToPath(new URL('.', import.meta.url))
const workspace = '/private/tmp/nw-workspace/天机阁主'
const draftPath = join(workspace, '第1章《开篇章》.草稿.md')
const secondDraftPath = join(workspace, '第2章《测试夹具第二章》.草稿.md')
const backupPath = join(outDir, 'draft-backup.md')
const MARKER = '提交探针写下的这一句。'

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')

/** Everything the row of buttons says about submitting, from its markers alone. */
const EDITOR_STATE = `(() => ({
  submit: document.querySelector('[data-novel-editor-submit]') !== null,
  inbox: document.querySelector('[data-novel-editor-inbox]') !== null,
  submitted: document.querySelector('[data-novel-editor-submitted]') !== null,
  confirm: document.querySelector('[data-novel-editor-confirm]') !== null,
  continuePanel: document.querySelector('[data-novel-continue]') !== null,
}))()`

const result = { at: new Date().toISOString(), marker: MARKER }
let lab

try {
  copyFileSync(draftPath, backupPath)
  result.draftShaBefore = sha256(draftPath)
  result.secondDraftExistedBefore = existsSync(secondDraftPath)

  lab = await launch({ port: 9464, outDir })
  const { session: s } = lab

  await s.click('[data-novel-chapter]')
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(1800)

  const at = await s.focusEditor()
  await s.clickIntoEditor(at)
  await s.replaceDocument(MARKER)
  await sleep(1500)
  result.submittedText = await s.ev(`document.querySelector('[data-novel-editor] .ProseMirror')?.textContent ?? null`)
  await s.shot('a3-01-continue-panel')

  // ── ① open the continue panel, then reach for submit ──
  await s.click('[data-novel-editor-continue]')
  await sleep(700)
  result.continueOpen = await s.ev(EDITOR_STATE)

  await s.click('[data-novel-editor-submit]')
  await sleep(700)
  result.confirmOpen = await s.ev(EDITOR_STATE)
  await s.shot('a3-02-confirm-exclusive')

  // ── ② submit for real ──
  const confirmedAt = Date.now()
  await s.click('[data-novel-editor-confirm-submit]')
  const landed = await s.until(`document.querySelector('[data-novel-editor-inbox]') !== null`, 30000)
  result.sentAfterMs = Date.now() - confirmedAt
  result.sent = landed ? await s.ev(EDITOR_STATE) : null
  result.sentLabel = await s.ev(`document.querySelector('[data-novel-editor-submitted]')?.textContent?.trim() ?? null`)
  result.inboxLabel = await s.ev(`document.querySelector('[data-novel-editor-inbox]')?.textContent?.trim() ?? null`)
  await s.shot('a3-03-sent')

  // ── ③ keep writing: what is held is no longer what was submitted ──
  await s.clickIntoEditor({ x: at.x, y: at.y })
  await s.send('Input.insertText', { text: '又写了一句。' })
  await sleep(1200)
  result.wroteAgain = await s.ev(EDITOR_STATE)
  await s.shot('a3-04-submit-back')

  // ── ④ the submitted state belongs to the chapter it was submitted from ──
  await s.click('[data-novel-chapter="vol01-ch0002"]')
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(1600)
  result.afterChapterSwitch = await s.ev(EDITOR_STATE)
  result.afterChapterSwitch.bar = await s.ev(
    `document.querySelector('.novel-editor-bar')?.textContent?.trim().slice(0, 20) ?? null`)
  await s.shot('a3-04b-next-chapter')

  // …and this chapter can be submitted on its own terms, which it could not if
  // the last chapter's "sent" had followed the author here.
  const atSecond = await s.focusEditor()
  await s.clickIntoEditor(atSecond)
  await s.send('Input.insertText', { text: '第二章的一句话。' })
  await sleep(1200)
  result.nextChapterCanSubmit = (await s.ev(EDITOR_STATE)).submit

  // ── ⑤ Canon did not move ──
  await lab.openView('history')
  await sleep(1500)
  result.historyHead = await s.ev(
    `document.querySelector('[data-novel-canvas="history"]')?.innerText?.split('\\n').slice(0, 4).join(' · ') ?? null`)
  await s.shot('a3-05-history')

  result.consoleErrorCount = s.errors.length

  const pass = result.continueOpen.continuePanel
    && result.confirmOpen.confirm
    && !result.confirmOpen.continuePanel
    && result.sent !== null
    && result.sent.submitted
    && result.inboxLabel !== null
    && !result.wroteAgain.inbox
    && !result.wroteAgain.submitted
    && result.wroteAgain.submit
    && !result.afterChapterSwitch.inbox
    && !result.afterChapterSwitch.submitted
    && !result.afterChapterSwitch.confirm
    && result.nextChapterCanSubmit === true
    && result.consoleErrorCount === 0
  result.verdict = pass ? 'pass' : 'fail'
  console.log(JSON.stringify(result, null, 1))
  process.exitCode = pass ? 0 : 1
} catch (error) {
  result.verdict = 'error'
  result.error = error instanceof Error ? error.message : String(error)
  console.error(`probe-a3: ${result.error}`)
  process.exitCode = 1
} finally {
  lab?.close()
  copyFileSync(backupPath, draftPath)
  if (!result.secondDraftExistedBefore) rmSync(secondDraftPath, { force: true })
  result.draftShaAfter = sha256(draftPath)
  result.draftRestored = result.draftShaAfter === result.draftShaBefore
  writeSummary(outDir, 'a3', result)
}
