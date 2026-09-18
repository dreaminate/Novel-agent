#!/usr/bin/env node
/**
 * The conversation column on a thread that actually has lines.
 *
 * The empty thread shows our placeholder, a stretch of blank, then the shipped
 * hero — three things stacked. This checks whether the same stacking happens once
 * the thread has messages, by selecting threads from the rail and reporting what
 * the column contains each time.
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

const REPORT = `(() => {
  const col = document.querySelector('[data-novel-conversation-column]')
  if (col === null) return null
  const r = col.getBoundingClientRect()
  const tr = document.querySelector('[data-novel-transcript-seat]')
  const lines = document.querySelectorAll('[data-novel-transcript-entry]')
  // What is on top at each tenth of the column's height.
  const strip = []
  for (let k = 0; k <= 10; k += 1) {
    const x = Math.round(r.left + r.width / 2)
    const y = Math.round(r.top + (r.height * k) / 10)
    if (y >= innerHeight) continue
    const el = document.elementFromPoint(x, y)
    const w = el?.closest?.('[class]')
    strip.push({ k, y, tag: el === null ? 'null' : el.tagName.toLowerCase(),
      cls: el === null ? '' : String(el.className || '').slice(0, 34),
      near: w === null || w === undefined ? '' : String(w.className || '').slice(0, 30) })
  }
  return {
    transcriptSeat: tr === null ? null : { h: Math.round(tr.getBoundingClientRect().height), top: Math.round(tr.getBoundingClientRect().top) },
    lineCount: lines.length,
    sessionSlotChildren: document.querySelector('[data-slot="conversation.session"]')?.children.length ?? null,
    columnBoxes: Array.from(col.children).map(c => { const b = c.getBoundingClientRect()
      return { cls: String(c.className || '').slice(0, 30), h: Math.round(b.height), top: Math.round(b.top), disp: getComputedStyle(c).display } }),
    hero: document.querySelector('[class*="_hero"]') === null ? null : (() => {
      const h = document.querySelector('[class*="_hero"]'); const b = h.getBoundingClientRect()
      return { cls: String(h.className).slice(0, 40), h: Math.round(b.height), top: Math.round(b.top) } })(),
    strip,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'state-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9486', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9486/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(1500)

  // The rail's thread rows.
  summary.threads = await s.ev(`(() => Array.from(document.querySelectorAll('[data-novel-thread]'))
    .map(el => (el.textContent || '').trim().slice(0, 26)))()`)

  summary.empty = await s.ev(REPORT)

  // Pick a populated thread row and report the column again.
  const picked = await s.ev(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-novel-thread]'))
    if (rows.length < 4) return null
    const target = rows[3]
    const label = (target.textContent || '').trim().slice(0, 24)
    target.click()
    return label })()`)
  summary.pickedRow = picked
  await sleep(2500)
  summary.afterPick = await s.ev(REPORT)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'thread-picked.png'), Buffer.from(shot.data, 'base64'))
  })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'thread-state-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
