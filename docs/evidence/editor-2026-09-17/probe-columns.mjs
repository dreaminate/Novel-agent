#!/usr/bin/env node
/**
 * Column resize real-machine check: the boundaries between the frame's columns
 * can be dragged, the manuscript keeps its floor, and a width the author dragged
 * is a preference — the frame closes a column when it has to without forgetting
 * what the author chose.
 *
 * Driven with real mouse and key events, because the drag is the browser's.
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
  close() { this.#ws.close() } }

const MEASURE = `(() => {
  const frame = document.querySelector('[data-novel-workbench="frame"]')
  const box = sel => { const node = document.querySelector(sel); if (node === null) return null
    const r = node.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.x) } }
  const handle = sel => { const node = document.querySelector(sel); if (node === null) return null
    const r = node.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } }
  return {
    viewport: window.innerWidth,
    rail: box('[data-novel-rail="nav"]'),
    canvas: box('[data-novel-shell="main"]'),
    side: box('[data-novel-conversation-column]'),
    railTrack: frame.style.getPropertyValue('--nw-rail'),
    sideTrack: frame.style.getPropertyValue('--nw-side'),
    railHandle: handle('[data-novel-column-handle="rail"]'),
    sideHandle: handle('[data-novel-column-handle="conversation"]'),
    documentWidth: document.documentElement.scrollWidth,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'columns-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9477', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9477/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-column-handle]') !== null`)
  await sleep(3500)
  // A session has to be open for the conversation column to be there at all.
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(1200)

  const drag = async (from, dx) => {
    await s.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from.x, y: from.y, button: 'left', clickCount: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + dx / 2, y: from.y, button: 'left', buttons: 1 })
    await sleep(100)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + dx, y: from.y, button: 'left', buttons: 1 })
    await sleep(120)
    await s.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: from.x + dx, y: from.y, button: 'left', clickCount: 1 })
    await sleep(400)
  }

  summary.wide = await s.ev(MEASURE)

  // ① drag the rail wider
  await drag(summary.wide.railHandle, 60)
  summary.afterRailDrag = await s.ev(MEASURE)

  // ② drag the conversation column wider (boundary moves left)
  await drag(summary.afterRailDrag.sideHandle, -60)
  summary.afterSideDrag = await s.ev(MEASURE)

  // ③ drag past the ceiling: it has to stop at the clamp, not run away
  await drag(summary.afterSideDrag.railHandle, 400)
  summary.afterOverDrag = await s.ev(MEASURE)

  // ④ a window that cannot hold both: the conversation column closes, and the
  // manuscript keeps its floor
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(1200)
  summary.narrow = await s.ev(MEASURE)

  // ⑤ and it comes back with the width the author dragged, not the default
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(1200)
  summary.wideAgain = await s.ev(MEASURE)

  // ⑥ the keyboard can resize too. The rail is at its ceiling after step ③, so
  // it goes back to mid-range first — otherwise ArrowRight is a no-op and the
  // step proves nothing.
  await drag(summary.wideAgain.railHandle, -120)
  summary.beforeArrow = await s.ev(MEASURE)
  await s.ev(`document.querySelector('[data-novel-column-handle="rail"]').focus()`)
  await s.key('ArrowRight', 'ArrowRight', 39)
  summary.afterArrow = await s.ev(MEASURE)

  // ⑦ a reload keeps what the author dragged
  await s.send('Page.reload', { ignoreCache: false })
  await s.until(`document.querySelector('[data-novel-column-handle]') !== null`)
  await sleep(2500)
  summary.afterReload = await s.ev(MEASURE)

  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'column-drag.png'), Buffer.from(shot.data, 'base64'))
  })
  // Leave the author's own widths alone.
  await s.ev(`localStorage.removeItem('novel-workbench/prefs')`)
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'columns-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
