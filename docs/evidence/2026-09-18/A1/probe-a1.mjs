#!/usr/bin/env node
/**
 * A1 — canvas error boundary + WebGL degradation.
 *
 * Three things, machine-checkable:
 * ① with no GPU the story map draws its degraded card (not a blank stage), with
 *    「去人物与关系」 and 「重试」 on it;
 * ② the canvases beside it are alive — one click reaches the cast board and it
 *    really draws people and relationships;
 * ③ nothing throws. F1's signature was an uncaught TypeError from sigma.
 *
 * Chrome runs with `--disable-gpu`, which is A1's acceptance environment. Nothing
 * is written: this probe only navigates, clicks, reads and screenshots.
 */
import { fileURLToPath } from 'node:url'
import { launch, sleep, writeSummary } from '../probe-harness.mjs'

const outDir = fileURLToPath(new URL('.', import.meta.url))
const result = { at: new Date().toISOString() }
let lab

const CARD = `(() => {
  const card = document.querySelector('[data-novel-story-map-degraded]')
  const root = document.querySelector('[data-novel-story-map]')
  const shell = document.querySelector('[data-novel-canvas="map"]')
  return {
    cardPresent: card !== null,
    cardRole: card?.getAttribute('role') ?? null,
    cardText: card?.innerText?.replace(/\\s+/g, ' ').trim().slice(0, 200) ?? null,
    toCastButton: card?.querySelector('[data-novel-story-map-degraded-cast]')?.innerText?.trim() ?? null,
    retryButton: card?.querySelector('[data-novel-story-map-degraded-retry]')?.innerText?.trim() ?? null,
    // A degraded map is still a drawn canvas with its own head, not an empty seat.
    shellHead: shell?.querySelector('h1')?.textContent?.trim() ?? null,
    people: root?.getAttribute('data-novel-story-map-people') ?? null,
    // sigma was never built, so there is no WebGL canvas to look at.
    webglCanvases: document.querySelectorAll('[data-novel-story-map-canvas] canvas').length,
  } })()`

const CAST = `(() => ({
  view: document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view') ?? null,
  shellHead: document.querySelector('[data-novel-canvas="cast"] h1')?.textContent?.trim() ?? null,
  boardPresent: document.querySelector('[data-novel-cast]') !== null,
  people: document.querySelectorAll('[data-novel-cast-people] [data-novel-person]').length,
  rels: document.querySelectorAll('[data-novel-cast-relations] [data-novel-relation]').length,
  factions: document.querySelectorAll('[data-novel-faction]').length,
}))()`

try {
  lab = await launch({ port: 9462, outDir })
  const { session: s } = lab

  // ── ① the road the author walks: 故事地图 with no GPU ──
  await lab.openView('map')
  await sleep(2000)
  result.degraded = await s.ev(CARD)
  await s.shot('a1-01-story-map-degraded')

  // ── ② the card's way out leads to a canvas that still works ──
  await s.click('[data-novel-story-map-degraded-cast]')
  await s.until(`document.querySelector('[data-novel-cast]') !== null`)
  await sleep(1500)
  result.afterDegraded = await s.ev(CAST)
  await s.shot('a1-02-cast-after-degraded')

  // ── ③ 重试 re-mounts the map; the machine still has no WebGL, so the card
  //    stays — but the workbench must not have lost anything on the way ──
  await lab.openView('map')
  await s.until(`document.querySelector('[data-novel-story-map-degraded]') !== null`)
  await sleep(800)
  await s.click('[data-novel-story-map-degraded-retry]')
  await sleep(2000)
  result.afterRetry = await s.ev(`(() => ({
    cardStillThere: document.querySelector('[data-novel-story-map-degraded]') !== null,
    webglCanvases: document.querySelectorAll('[data-novel-story-map-canvas] canvas').length,
    railAlive: document.querySelector('[data-novel-rail="nav"]') !== null,
    railItems: document.querySelectorAll('[data-novel-view]').length,
    boundaryCard: document.querySelector('[data-novel-canvas-crashed]') !== null,
    frameAlive: document.querySelector('[data-novel-workbench="frame"]') !== null,
  }))()`)
  await s.shot('a1-03-after-retry')

  result.consoleErrorCount = s.errors.length
  result.consoleErrors = s.errors.slice(0, 5)

  const pass = result.degraded.cardPresent
    && result.degraded.toCastButton !== null
    && result.degraded.retryButton !== null
    && result.degraded.webglCanvases === 0
    && result.afterDegraded.boardPresent
    && result.afterDegraded.people > 0
    && result.afterDegraded.shellHead === '人物与关系'
    && result.afterRetry.cardStillThere
    && result.afterRetry.railAlive
    && result.afterRetry.boundaryCard === false
    && result.consoleErrorCount === 0
  result.verdict = pass ? 'pass' : 'fail'
  console.log(JSON.stringify(result, null, 1))
  process.exitCode = pass ? 0 : 1
} catch (error) {
  result.verdict = 'error'
  result.error = error instanceof Error ? error.message : String(error)
  console.error(`probe-a1: ${result.error}`)
  process.exitCode = 1
} finally {
  lab?.close()
  writeSummary(outDir, 'a1', result)
}
