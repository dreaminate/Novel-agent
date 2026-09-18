#!/usr/bin/env node
/**
 * Each rail view, opened and measured.
 *
 * The author says several things are badly wrong, not just the conversation
 * column. This walks the rail's views and reports, for each, whether the canvas
 * rendered something and whether anything in it failed to hit-test.
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
  close() { this.#ws.close() } }

const CANVAS = `(() => {
  const seat = document.querySelector('[data-novel-canvas-seat]')
  if (seat === null) return null
  const view = document.querySelector('[data-novel-canvas]')
  const r = seat.getBoundingClientRect()
  const controls = Array.from(seat.querySelectorAll('button, [role="button"], input, textarea, [contenteditable="true"]'))
  const bad = []
  for (const el of controls) {
    const b = el.getBoundingClientRect(); const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || b.width < 1 || b.height < 1) continue
    if (b.bottom <= 0 || b.top >= innerHeight) continue
    const top = document.elementFromPoint(Math.round(b.left + b.width / 2), Math.round(b.top + b.height / 2))
    const ok = top !== null && (top === el || el.contains(top) || top.contains(el))
    if (!ok) bad.push({ tag: el.tagName.toLowerCase(), cls: String(el.className||'').slice(0,30),
      label: (el.getAttribute('aria-label') ?? (el.textContent||'')).trim().slice(0,18),
      box: Math.round(b.width) + 'x' + Math.round(b.height), top: top === null ? 'null' : top.tagName.toLowerCase() + '.' + String(top.className||'').slice(0,24) })
  }
  return { view: view?.getAttribute('data-novel-canvas') ?? null, seatH: Math.round(r.height),
    controls: controls.length, unreachable: bad,
    text: (seat.textContent || '').trim().slice(0, 60) } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'views-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9491', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9491/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)

  const views = await s.ev(`(() => Array.from(document.querySelectorAll('[data-novel-view]')).map(el => ({ id: el.getAttribute('data-novel-view'), label: (el.textContent||'').trim(), disabled: el.disabled })))()`)
  summary.views = views
  for (const v of views) {
    await s.ev(`document.querySelector('[data-novel-view="${v.id}"]')?.click()`)
    await sleep(1400)
    summary[v.id] = await s.ev(CANVAS)
    await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
      writeFileSync(join(outDir, `view-${v.id}.png`), Buffer.from(shot.data, 'base64'))
    })
  }
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'views-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log('views:', JSON.stringify(summary.views))
for (const [k, v] of Object.entries(summary)) {
  if (k === 'views') continue
  console.log(`--- ${k}: view=${v?.view} seatH=${v?.seatH} controls=${v?.controls} unreachable=${v?.unreachable?.length ?? 'n/a'}`)
  for (const u of (v?.unreachable ?? [])) console.log(`    ${u.tag}.${u.cls} "${u.label}" ${u.box} centre->${u.top}`)
  console.log(`    text="${v?.text}"`)
}
