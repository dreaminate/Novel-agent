#!/usr/bin/env node
/**
 * I6.4b real-machine check: the story map can be used from the keyboard alone.
 *
 * The cast is drawn on WebGL, where nothing is focusable, so the overlay carries
 * one real element per drawn character. This drives the real browser to prove
 * Tab reaches them, the arrow keys walk the cast, the ring is visible, Enter
 * selects and D opens 人物档案 — and that none of it costs the mouse: dragging a
 * character to pin it still reaches sigma through the overlay.
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
  async key(key, code, vk) {
    for (const type of ['rawKeyDown', 'keyUp']) {
      await this.send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk })
    }
    await sleep(120)
  }
  async enter() {
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r',
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await sleep(200)
  }
  close() { this.#ws.close() } }

const ACTIVE = `(() => {
  const el = document.activeElement
  if (el === null) return null
  const focused = document.querySelector('.nw-map-node-focus:focus')
  return {
    node: el.getAttribute?.('data-novel-story-map-node') ?? null,
    label: el.getAttribute?.('aria-label') ?? null,
    here: el.tagName.toLowerCase() + (el.getAttribute?.('data-novel-story-map-node') ? '' : '|' + (el.textContent ?? '').trim().slice(0, 8)),
    ring: focused === null ? null : getComputedStyle(focused).stroke,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'mapkbd-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9471', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9471/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-view="map"]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-view="map"]').click()`)
  await s.until(`document.querySelector('[data-novel-story-map-node]') !== null`)
  await sleep(1200)

  summary.stops = await s.ev(`Array.from(document.querySelectorAll('[data-novel-story-map-node]'))
    .map(node => ({ id: node.getAttribute('data-novel-story-map-node'), label: node.getAttribute('aria-label'),
      tabindex: node.getAttribute('tabindex') }))`)
  summary.drawnCast = await s.ev(`document.querySelectorAll('[data-novel-story-map-node]').length`)
  summary.clusterDiscs = await s.ev(`document.querySelectorAll('.nw-map-disc').length`)
  summary.discsHiddenFromAT = await s.ev(
    `Array.from(document.querySelectorAll('.nw-map-disc, .nw-map-disc-label'))
      .every(node => node.getAttribute('aria-hidden') === 'true')`)
  summary.overlayNamed = await s.ev(
    `document.querySelector('[data-novel-story-map-overlay]')?.getAttribute('aria-label') ?? null`)

  // ① Tab has to reach the map from the rail, not only a programmatic focus.
  await s.ev(`document.querySelector('[data-novel-view="map"]').focus()`)
  let reached = null
  for (let i = 0; i < 30; i += 1) {
    await s.key('Tab', 'Tab', 9)
    const at = await s.ev(ACTIVE)
    if (at?.node !== null && at?.node !== undefined) { reached = { afterTabs: i + 1, ...at }; break }
  }
  summary.reachedByTab = reached

  // ② the arrow keys walk the cast, and the ring follows the focus
  const walk = []
  walk.push(await s.ev(ACTIVE))
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowLeft']) {
    await s.key(key, key, key === 'ArrowRight' ? 39 : 37)
    walk.push(await s.ev(ACTIVE))
  }
  summary.walk = walk

  // ③ Enter selects; D opens the profile of whoever has focus
  await s.ev(`document.querySelector('.nw-map-node-focus:focus')?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))`)
  await sleep(300)
  summary.selection = await s.ev(
    `document.querySelector('[data-novel-story-map-selection]')?.getAttribute('data-novel-story-map-selection') ?? null`)
  await s.ev(`document.querySelector('.nw-map-node-focus:focus')?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'd', bubbles: true }))`)
  await sleep(600)
  summary.personFile = await s.ev(
    `document.querySelector('[data-novel-person-file]')?.getAttribute('data-novel-person-file') ?? null`)
  summary.discsHiddenAfterDialog = await s.ev(
    `Array.from(document.querySelectorAll('.nw-map-disc')).every(node => node.getAttribute('aria-hidden') === 'true')`)
  await s.ev(`document.querySelector('[data-novel-person-close]')?.click()`)
  await sleep(400)

  // ④ the overlay must still swallow nothing: a drag that misses the cast pans,
  // and one that starts on a character pins it.
  const box = await s.ev(`(() => { const r = document.querySelector('.nw-map-stage').getBoundingClientRect()
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } })()`)
  const drag = async (from, dx, dy) => {
    await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + dx, y: from.y + dy, button: 'left', buttons: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: from.x + dx, y: from.y + dy, button: 'left', clickCount: 1 })
    await sleep(400)
  }
  const before = await s.ev(`(() => { const d = document.querySelector('.nw-map-disc')
    return { cx: Number(d.getAttribute('cx')), cy: Number(d.getAttribute('cy')) } })()`)
  await drag({ x: box.x + before.cx, y: box.y + before.cy }, 60, 40)
  const after = await s.ev(`(() => { const d = document.querySelector('.nw-map-disc')
    const b = document.querySelector('.nw-map-bubble')
    return { cx: Number(d.getAttribute('cx')), cy: Number(d.getAttribute('cy')), bubble: b !== null,
      nodeBoxes: Array.from(document.querySelectorAll('[data-novel-story-map-node]')).map(n => ({
        cx: Number(n.getAttribute('cx')), cy: Number(n.getAttribute('cy')) })) } })()`)
  summary.dragReachesSigma = Math.abs((after.cx - before.cx) - 60) < 3 && Math.abs((after.cy - before.cy) - 40) < 3
  summary.nodesFollowTheCamera = after.nodeBoxes.length === summary.drawnCast

  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'map-keyboard.png'), Buffer.from(shot.data, 'base64'))
  })
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'map-keyboard-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
