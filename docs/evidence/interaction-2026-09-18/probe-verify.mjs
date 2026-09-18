#!/usr/bin/env node
/**
 * The fix, verified against the running host.
 *
 * Before: on a thread with no lines the column was an 80px strip, then ~390px of
 * shipped scroll body that took no clicks, then the shipped welcome page.
 * After: the state is published on the column, the welcome page is gone, and the
 * frame's empty state has the column. A thread with lines must be untouched.
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
    await sleep(400)
  }
  close() { this.#ws.close() } }

const STATE = `(() => {
  const col = document.querySelector('[data-novel-conversation-column]')
  if (col === null) return null
  const seat = document.querySelector('[data-novel-transcript-seat]')
  const root = col.querySelector('[data-slot="conversation"] > *')
  const empty = document.querySelector('.novel-transcript-empty')
  const b = el => el === null ? null : (() => { const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), top: Math.round(r.top), w: Math.round(r.width), left: Math.round(r.left) } })()
  const r = col.getBoundingClientRect()
  // The same three points that used to land on the shipped scroll body.
  const strip = [0.15, 0.3, 0.5, 0.8].map(f => {
    const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height * f))
    return { f, tag: el === null ? 'null' : el.tagName.toLowerCase(), cls: el === null ? '' : String(el.className || '').slice(0, 30) } })
  return { threadState: col.getAttribute('data-novel-thread-state'), transcriptSeat: b(seat), shippedRoot: b(root),
    lines: document.querySelectorAll('[data-novel-transcript-entry]').length,
    emptyState: empty === null ? null : (() => { const c = getComputedStyle(empty)
      return { ...b(empty), size: c.fontSize, lh: c.lineHeight, align: c.textAlign, font: c.fontFamily.slice(0, 18) } })(),
    strip } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'verify-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9497', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9497/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)

  // A thread with lines: must be untouched.
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2000)
  await s.ev(`(() => { const rows = Array.from(document.querySelectorAll('[data-novel-thread]')); if (rows[3]) rows[3].click() })()`)
  await sleep(2500)
  summary.populated = await s.ev(STATE)

  // An empty thread: the case that was broken.
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(2500)
  summary.empty = await s.ev(STATE)
  const box = await s.ev(`(() => { const c = document.querySelector('[data-novel-conversation-column]'); const r = c.getBoundingClientRect()
    return { mid: { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.45) },
      composer: (() => { const el = document.querySelector('[class*="_input"][contenteditable="true"]'); const b = el.getBoundingClientRect()
        return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) } })() } })()`)
  await s.ev(`document.activeElement?.blur?.()`)
  await s.click(box.mid.x, box.mid.y)
  summary.clickMiddle = await s.ev(`(() => { const el = document.activeElement; return el === null ? 'null' : el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,30) })()`)
  await s.click(box.composer.x, box.composer.y)
  summary.clickComposer = await s.ev(`(() => { const el = document.activeElement; const c = el?.getAttribute('contenteditable'); return { tag: el?.tagName.toLowerCase(), cls: String(el?.className||'').slice(0,26), editable: c } })()`)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'verify-empty-fixed.png'), Buffer.from(r.data, 'base64')) })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'verify-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
for (const [k, v] of Object.entries(summary)) console.log(`${k}: ${JSON.stringify(v)}`)
