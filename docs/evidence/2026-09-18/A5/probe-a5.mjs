#!/usr/bin/env node
/**
 * A5 — the way into writing.
 *
 * ① With no chapter open, 写作 offers the work's chapters to open, in the
 *    author's words and with no engineering nouns on the screen.
 * ② Picking one opens it.
 * ③ On this workspace the planning offer is correctly *absent*: its one chapter is
 *    待审, so the author has something to write and offering to plan ahead would
 *    be noise. The offer's card itself is covered by the landing spec — an empty
 *    work is the state it needs, and this machine has only this one work.
 *
 * The plan request is never sent: that would spend an agent turn to prove what
 * the request text already says, and `planChapterRequest` is unit-covered.
 *
 * The banner on 提案审阅 without a thread, and the 「开一条线程」 hint in the
 * editor, are also unit-only: both need a state this profile cannot be put into
 * over CDP — always a session, and no UI that unselects a chapter.
 */
import { fileURLToPath } from 'node:url'
import { launch, sleep, writeSummary } from '../probe-harness.mjs'

const outDir = fileURLToPath(new URL('.', import.meta.url))
const result = { at: new Date().toISOString() }
let lab

try {
  lab = await launch({ port: 9467, outDir })
  const { session: s } = lab

  // A fresh profile has no remembered chapter, so 写作 opens on the way in.
  await lab.openView('editor')
  await sleep(2200)
  result.landing = await s.ev(`(() => {
    const card = document.querySelector('[data-novel-landing]')
    const entries = Array.from(document.querySelectorAll('[data-novel-landing-chapter]'))
    const plan = document.querySelector('[data-novel-landing-plan]')
    return {
      present: card !== null,
      text: card?.innerText?.replace(/\\s+/g, ' ').trim().slice(0, 160) ?? null,
      chapters: entries.map(node => node.getAttribute('data-novel-landing-chapter')),
      firstChapterLabel: entries[0]?.innerText?.replace(/\\s+/g, ' ').trim() ?? null,
      planLabel: plan?.textContent?.trim() ?? null,
      // The screen the author lands on must not talk to them about the plumbing.
      leaks: ['Canon', 'workdir', 'R5', 'expectedRevision'].filter(word =>
        (card?.innerText ?? '').includes(word)),
      editorOpen: document.querySelector('[data-novel-editor]') !== null,
    } })()`)
  await s.shot('a5-01-landing')

  // ── the planning offer is absent here, and that is the correct answer: this
  //    work has a chapter waiting on the author, so there is nothing to plan ──
  result.planOffer = await s.ev(`(() => {
    const button = document.querySelector('[data-novel-landing-plan]')
    const statuses = Array.from(document.querySelectorAll('[data-novel-landing-chapter]'))
      .map(node => node.innerText.replace(/\\s+/g, ' ').trim())
    return { offered: button !== null, chapters: statuses }
  })()`)

  // ── ② picking a chapter really opens it ──
  const first = result.landing.chapters[0]
  await s.click(`[data-novel-landing-chapter="${String(first)}"]`)
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(1800)
  result.opened = await s.ev(`(() => ({
    editorOpen: document.querySelector('[data-novel-editor]') !== null,
    bar: document.querySelector('.novel-editor-bar')?.textContent?.trim().slice(0, 20) ?? null,
    landingGone: document.querySelector('[data-novel-landing]') === null,
  }))()`)
  await s.shot('a5-03-opened')

  result.consoleErrorCount = s.errors.length

  const pass = result.landing.present
    && result.landing.leaks.length === 0
    && result.landing.chapters.length > 0
    && result.planOffer.offered === false
    && result.opened.editorOpen
    && result.opened.landingGone
    && result.consoleErrorCount === 0
  result.verdict = pass ? 'pass' : 'fail'
  console.log(JSON.stringify(result, null, 1))
  process.exitCode = pass ? 0 : 1
} catch (error) {
  result.verdict = 'error'
  result.error = error instanceof Error ? error.message : String(error)
  console.error(`probe-a5: ${result.error}`)
  process.exitCode = 1
} finally {
  lab?.close()
  writeSummary(outDir, 'a5', result)
}
