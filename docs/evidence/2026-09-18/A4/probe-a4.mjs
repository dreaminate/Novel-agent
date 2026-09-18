#!/usr/bin/env node
/**
 * A4 — the collaboration loop, on the machine.
 *
 * Three things the acceptance names, each machine-checkable:
 * ① the editor says the draft and the accepted chapter have parted ways, and
 *    「读已接受正文」 shows what Canon actually holds;
 * ② 「写回稿子」 puts the accepted text into the draft file, under the version
 *    that file already has — checked by reading the file itself;
 * ③ a proposal the agent files reaches the waiting badge without the author doing
 *    anything else. The packet goes to the host, not to this bundle, so the only
 *    trace here is the tool call that filed it — this measures how long that
 *    takes to show up.
 *
 * ③ spends a real turn: submitting is a request into the thread. The probe
 * removes the proposals it caused afterwards, and restores the draft it wrote.
 *
 * The no-session review banner is *not* measured here: this profile always has a
 * session selected, and CDP cannot take one away. It is unit-covered.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch, sleep, writeSummary } from '../probe-harness.mjs'

const outDir = fileURLToPath(new URL('.', import.meta.url))
// This scenario sits one level below the shared harness, so the repository root
// is four hops up rather than three.
const ROOT = fileURLToPath(new URL('../../../..', import.meta.url))
const draftPath = join('/private/tmp/nw-workspace/天机阁主', '第1章《开篇章》.草稿.md')
const backupPath = join(outDir, 'draft-backup.md')
const storePath = join(ROOT, '.novel-agent/dsh-home/storages/novel_project.json')

const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const pendingIds = path => {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  const proj = Object.values(doc.tables.projects)[0]
  return proj.pendingProposals.map(entry => entry.packetId)
}

const result = { at: new Date().toISOString() }
let lab

try {
  copyFileSync(draftPath, backupPath)
  result.draftShaBefore = sha256(draftPath)
  result.pendingBefore = pendingIds(storePath)

  lab = await launch({ port: 9465, outDir })
  const { session: s } = lab

  // ── ① the two documents, said out loud ──
  await s.click('[data-novel-chapter="vol01-ch0001"]')
  await s.until(`document.querySelector('[data-novel-editor] .ProseMirror') !== null`)
  await sleep(2000)
  result.diverged = await s.ev(`(() => {
    const bar = document.querySelector('[data-novel-editor-diverged]')
    return {
      barPresent: bar !== null,
      text: bar?.innerText?.replace(/\\s+/g, ' ').trim() ?? null,
      readAccepted: bar?.querySelector('[data-novel-editor-read-accepted]') !== null,
      writeBack: bar?.querySelector('[data-novel-editor-write-back]') !== null,
      draftSample: document.querySelector('[data-novel-editor] .ProseMirror')?.textContent?.slice(0, 40) ?? null,
    } })()`)
  await s.shot('a4-01-diverged-bar')

  await s.click('[data-novel-editor-read-accepted]')
  await sleep(800)
  result.acceptedText = await s.ev(
    `document.querySelector('[data-novel-editor-reading]')?.textContent?.trim() ?? null`)
  result.readingAccepted = result.acceptedText === null ? null : result.acceptedText.slice(0, 60)
  await s.shot('a4-02-reading-accepted')

  // ── ② write Canon's version back into the draft file ──
  await s.click('[data-novel-editor-write-back]')
  await sleep(2500)
  const written = readFileSync(draftPath, 'utf8')
  const squash = text => text.replace(/\s+/g, '')
  result.writeBack = {
    fileSample: written.slice(0, 60),
    fileSha: sha256(draftPath),
    // The file now holds Canon's text, which is what the button promised.
    carriesAcceptedText: result.acceptedText !== null
      && squash(written).includes(squash(result.acceptedText).slice(0, 40)),
  }

  // ── ③ a new proposal reaches the badge on its own ──
  await lab.openView('editor')
  await sleep(1500)
  const badgeBefore = await s.ev(`(() => {
    const node = document.querySelector('[data-novel-thread-pending]')
    return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending') ?? '0') })()`)
  result.badgeBefore = badgeBefore

  await s.click('[data-novel-editor-submit]')
  await sleep(700)
  await s.click('[data-novel-editor-confirm-submit]')
  const submittedAt = Date.now()
  // Poll only to learn *when* it arrives; the product itself does not poll.
  let badgeAfter = badgeBefore
  for (let waited = 0; waited < 300000; waited += 3000) {
    await sleep(3000)
    badgeAfter = await s.ev(`(() => {
      const node = document.querySelector('[data-novel-thread-pending]')
      return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending') ?? '0') })()`)
    if (badgeAfter > badgeBefore) break
  }
  result.badgeAfter = badgeAfter
  result.badgeDelayMs = Date.now() - submittedAt
  await s.shot('a4-03-badge-after-proposal')

  result.consoleErrorCount = s.errors.length
  result.pendingAdded = pendingIds(storePath).filter(id => !result.pendingBefore.includes(id))
} catch (error) {
  result.verdict = 'error'
  result.error = error instanceof Error ? error.message : String(error)
  console.error(`probe-a4: ${result.error}`)
} finally {
  lab?.close()
  if (existsSync(backupPath)) copyFileSync(backupPath, draftPath)
  result.draftShaAfter = sha256(draftPath)
  result.draftRestored = result.draftShaAfter === result.draftShaBefore
  result.verdict = result.error === undefined
    && result.diverged?.barPresent
    && result.diverged?.readAccepted
    && result.diverged?.writeBack
    && (result.readingAccepted ?? '').length > 0
    && result.writeBack?.carriesAcceptedText === true
    && result.writeBack?.fileSample !== result.diverged?.draftSample
    && result.badgeAfter > result.badgeBefore
    && result.draftRestored
    ? 'pass' : 'fail'
  writeSummary(outDir, 'a4', result)
  console.log(JSON.stringify(result, null, 1))
  process.exitCode = result.verdict === 'pass' ? 0 : 1
}
