#!/usr/bin/env node
/**
 * Real mouse clicks in the conversation column.
 *
 * "The conversation column cannot be interacted with by mouse" is a claim about
 * event delivery, so this dispatches actual CDP mouse events at named landmarks
 * and reports what took focus afterwards. It also lists any element that would
 * swallow a click (pointer-events: none on something visible, or an overlay
 * stacked above the column).
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/interaction-2026-09-18')
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S {
  #ws; #n = 0; #p = new Map()
  constructor(ws) { this.#ws = ws; ws.addEventListener('message', e => { const m = JSON.parse(e.data)
    if (m.id === undefined) return
    const p = this.#p.get(m.id); if (!p) return; this.#p.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) }) }
  send(method, params = {}) { const id = ++this.#n; return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) }) }
  async ev(x) { const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result?.value }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(200) } return false }
  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
    await sleep(350)
  }
  close() { this.#ws.close() } }

const describe = `(() => {
  const el = document.activeElement
  if (el === null) return 'null'
  const r = el.getBoundingClientRect()
  return el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 36)
    + ' [' + (el.getAttribute('contenteditable') ?? '-') + '] ' + Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top)
})()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'clicks-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9485', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = { clicks: [] }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9485/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(1500)

  const landmarks = await s.ev(`(() => {
    const col = document.querySelector('[data-novel-conversation-column]')
    const r = col.getBoundingClientRect()
    const pick = (sel) => { const el = document.querySelector(sel); if (el === null) return null
      const b = el.getBoundingClientRect(); return { sel, x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) } }
    return {
      empty: pick('.novel-transcript-empty'),
      header: pick('[data-novel-thread-header]'),
      columnCentre: { sel: 'column-centre', x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.3) },
      columnLower: { sel: 'column-lower-blank', x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.85) },
    } })()`)
  summary.landmarks = landmarks

  for (const key of ['empty', 'header', 'columnCentre', 'columnLower']) {
    const spot = landmarks[key]
    if (spot === null) { summary.clicks.push({ key, skipped: true }); continue }
    await s.ev(`document.activeElement?.blur?.()`)
    await sleep(150)
    await s.click(spot.x, spot.y)
    const active = await s.ev(describe)
    const hit = await s.ev(`(() => { const el = document.elementFromPoint(${spot.x}, ${spot.y}); return el === null ? 'null' : el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,36) })()`)
    summary.clicks.push({ key, ...spot, active, hit })
  }

  // Any visible element stacked over the column that would eat clicks.
  summary.overlays = await s.ev(`(() => {
    const col = document.querySelector('[data-novel-conversation-column]')
    if (col === null) return null
    const r = col.getBoundingClientRect()
    const out = []
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const b = el.getBoundingClientRect()
      if (b.width < 40 || b.height < 40) continue
      if (b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom) continue
      if (col.contains(el) || el.contains(col)) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      out.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 40),
        z: cs.zIndex, pos: cs.position, w: Math.round(b.width), h: Math.round(b.height),
        left: Math.round(b.left), top: Math.round(b.top) })
    }
    return out })()`)

  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'after-clicks.png'), Buffer.from(shot.data, 'base64'))
  })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'click-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
