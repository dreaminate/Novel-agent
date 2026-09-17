#!/usr/bin/env node
/**
 * I6.1a real-machine check: the story map lays the accepted cast out on cluster
 * discs, folds each cluster's loose ends behind its own `+N`, regroups when the
 * author switches axis, and keeps a character the author dragged.
 *
 * Every number is read from the live DOM. The discs live in an SVG overlay that
 * has to line up with sigma's own canvas to the pixel, so the probe measures both
 * boxes rather than trusting that they match.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/editor-2026-09-17')
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S {
  #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws) { this.#ws = ws; ws.addEventListener('message', e => { const m = JSON.parse(e.data)
    if (m.id === undefined) { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ')); return }
    const p = this.#p.get(m.id); if (!p) return; this.#p.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) }) }
  send(method, params = {}) { const id = ++this.#n; return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) }) }
  async ev(x) { const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result?.value }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(200) } return false }
  close() { this.#ws.close() } }

const DUMP = `(() => {
  const root = document.querySelector('[data-novel-story-map]')
  if (root === null) return null
  const stage = document.querySelector('[data-novel-story-map-canvas]')
  const overlay = document.querySelector('[data-novel-story-map-overlay]')
  const box = stage.getBoundingClientRect()
  const paint = overlay.getBoundingClientRect()
  const discs = Array.from(document.querySelectorAll('.nw-map-disc'))
  return {
    people: Number(root.getAttribute('data-novel-story-map-people')),
    clusters: Number(root.getAttribute('data-novel-story-map-clusters')),
    folded: Number(root.getAttribute('data-novel-story-map-folded')),
    axis: document.querySelector('[data-novel-story-map-axis]')?.getAttribute('data-novel-story-map-axis') ?? null,
    clusterLabels: Array.from(document.querySelectorAll('[data-novel-story-map-cluster]'))
      .map(node => node.getAttribute('data-novel-story-map-cluster')),
    bubbles: Array.from(document.querySelectorAll('[data-novel-story-map-bubble]')).map(node => ({
      cluster: node.getAttribute('data-novel-story-map-bubble'),
      label: node.querySelector('.nw-map-bubble')?.getAttribute('aria-label'),
      text: node.querySelector('.nw-map-bubble-text')?.textContent,
    })),
    stageBox: { w: Math.round(box.width), h: Math.round(box.height) },
    overlayBox: { w: Math.round(paint.width), h: Math.round(paint.height) },
    discs: discs.map(node => ({
      cx: Math.round(Number(node.getAttribute('cx'))),
      cy: Math.round(Number(node.getAttribute('cy'))),
      r: Math.round(Number(node.getAttribute('r'))),
    })),
    unpin: document.querySelector('[data-novel-story-map-unpin]')?.textContent?.trim() ?? null,
    meta: document.querySelector('.nw-map-meta')?.innerText.trim() ?? null,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'mapclusters-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9459', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9459/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-view="map"]') !== null`)
  await sleep(2500)
  await s.ev(`document.querySelector('[data-novel-view="map"]').click()`)
  await s.until(`document.querySelector('[data-novel-story-map-canvas] canvas') !== null`)
  await sleep(1500)

  summary.initial = await s.ev(DUMP)

  // ① the discs have to sit on the cast, not beside it: every disc centre must be
  // inside the overlay it is drawn in, and the overlay must cover the stage.
  summary.fits = summary.initial === null ? null : {
    overlayCoversStage: summary.initial.overlayBox.w === summary.initial.stageBox.w
      && summary.initial.overlayBox.h === summary.initial.stageBox.h,
    discsInside: summary.initial.discs.every(disc =>
      disc.cx >= 0 && disc.cx <= summary.initial.overlayBox.w
      && disc.cy >= 0 && disc.cy <= summary.initial.overlayBox.h),
  }

  // ② the `+N` must bring its own cluster back
  const first = summary.initial?.bubbles?.[0]?.cluster
  if (first !== undefined) {
    const before = summary.initial
    await s.ev(`document.querySelector('[data-novel-story-map-bubble=${JSON.stringify(first)}] .nw-map-bubble')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))`)
    await sleep(400)
    const after = await s.ev(DUMP)
    summary.expand = {
      cluster: first,
      foldedBefore: before.folded,
      foldedAfter: after.folded,
      bubbleGone: !after.bubbles.some(bubble => bubble.cluster === first),
      peopleUnchanged: after.people === before.people,
    }
  }

  // ③ switching the axis regroups (and closes what the old grouping had opened)
  await s.ev(`document.querySelector('[data-novel-story-map-axis-option="place"]').click()`)
  await sleep(500)
  summary.byPlace = await s.ev(DUMP)
  await s.ev(`document.querySelector('[data-novel-story-map-axis-option="faction"]').click()`)
  await sleep(500)

  // ④ the overlay must not swallow the gesture: a drag that misses every node
  // pans the camera, and the discs follow it exactly.
  const beforePan = await s.ev(DUMP)
  const box = await s.ev(`(() => { const r = document.querySelector('.nw-map-stage').getBoundingClientRect()
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } })()`)
  const centre = { x: box.x + beforePan.discs[0].cx, y: box.y + beforePan.discs[0].cy }
  const drag = async (from, dx, dy) => {
    await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + dx, y: from.y + dy, button: 'left', buttons: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: from.x + dx, y: from.y + dy, button: 'left', clickCount: 1 })
    await sleep(400)
  }
  await drag(centre, 70, 50)
  const afterPan = await s.ev(DUMP)
  summary.pan = {
    movedBy: { x: afterPan.discs[0].cx - beforePan.discs[0].cx, y: afterPan.discs[0].cy - beforePan.discs[0].cy },
    expected: { x: 70, y: 50 },
    unpinned: afterPan.unpin,
  }
  await drag({ x: centre.x + 70, y: centre.y + 50 }, -70, -50)

  // ⑤ a drag that starts on a character pins it. The members are not in the DOM —
  // sigma draws them on WebGL — so their screen ring is measured from the two
  // pieces of the overlay that are: the disc rim sits at ring + 52 graph units and
  // the `+N` centre at ring + 82, so the 30 units between them give the scale.
  const ring = await s.ev(`(() => {
    const disc = document.querySelector('.nw-map-disc')
    const bubble = document.querySelector('.nw-map-bubble')
    if (disc === null || bubble === null) return null
    const cx = Number(disc.getAttribute('cx')), cy = Number(disc.getAttribute('cy'))
    const r = Number(disc.getAttribute('r'))
    const away = Math.hypot(Number(bubble.getAttribute('cx')) - cx, Number(bubble.getAttribute('cy')) - cy)
    const scale = (away - r) / 30
    if (!(scale > 0)) return null
    return { cx, cy, radius: r - 52 * scale }
  })()`)
  if (ring === null) {
    summary.pin = { skipped: 'no +N bubble to measure the member ring from' }
  } else {
    const seats = [[0, -1], [1, 0], [0, 1], [-1, 0]]
    let pinned = null
    for (const [ux, uy] of seats) {
      const at = { x: box.x + ring.cx + ux * ring.radius, y: box.y + ring.cy + uy * ring.radius }
      await drag(at, 60, 40)
      const state = await s.ev(DUMP)
      if (state.unpin !== null) { pinned = { seat: [ux, uy], unpin: state.unpin }; break }
      // A miss pans the camera instead; put it back before trying the next seat.
      await drag({ x: at.x + 60, y: at.y + 40 }, -60, -40)
    }
    summary.pin = pinned ?? { missed: 'no drag started on a character' }
    await s.ev(`document.querySelector('[data-novel-story-map-unpin]')?.click()`)
    await sleep(300)
    summary.released = await s.ev(DUMP)
  }

  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'map-clusters.png'), Buffer.from(shot.data, 'base64'))
  })
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'map-clusters-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
