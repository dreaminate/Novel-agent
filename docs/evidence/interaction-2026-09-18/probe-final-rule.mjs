#!/usr/bin/env node
/**
 * The final rule, scoped by our own attribute instead of `:has()`.
 *
 * The frame already knows whether the thread has lines, so it can say so on the
 * column — the same way it publishes `data-narrow`. This checks that the rule,
 * scoped to that attribute, produces the good layout on an empty thread, and
 * that a thread with lines is untouched when the attribute is absent.
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

const RULE = `
[data-novel-workbench="frame"] [data-novel-conversation-column][data-novel-thread-state="empty"] [data-slot="conversation"] > * {
  flex: 0 0 auto; height: auto; min-height: 0;
}
[data-novel-workbench="frame"] [data-novel-conversation-column][data-novel-thread-state="empty"] [class*="_composerHero"] > *:not([data-slot="conversation.composer.bar"]) {
  display: none;
}`

const STATE = `(() => {
  const col = document.querySelector('[data-novel-conversation-column]')
  if (col === null) return null
  const seat = document.querySelector('[data-novel-transcript-seat]')
  const root = col.querySelector('[data-slot="conversation"] > *')
  const hero = col.querySelector('[class*="_composerHero"]')
  const empty = document.querySelector('.novel-transcript-empty')
  const b = el => el === null ? null : (() => { const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), top: Math.round(r.top), w: Math.round(r.width) } })()
  return {
    transcriptSeat: b(seat), shippedRoot: b(root), hero: b(hero),
    lines: document.querySelectorAll('[data-novel-transcript-entry]').length,
    emptyState: empty === null ? null : (() => { const r = empty.getBoundingClientRect(); const c = getComputedStyle(empty)
      return { w: Math.round(r.width), left: Math.round(r.left), size: c.fontSize, align: c.textAlign, lh: c.lineHeight } })(),
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'final-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9496', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9496/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)

  // Populated thread first, with the rule present but the attribute absent.
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2000)
  await s.ev(`(() => { const rows = Array.from(document.querySelectorAll('[data-novel-thread]')); if (rows[3]) rows[3].click() })()`)
  await sleep(2500)
  summary.populatedBeforeRule = await s.ev(STATE)
  await s.ev(`(() => { const t = document.createElement('style'); t.id = 'nw-final'; t.textContent = ${JSON.stringify(RULE)}; document.head.appendChild(t); return true })()`)
  await sleep(800)
  summary.populatedWithRule = await s.ev(STATE)

  // Now an empty thread, and the frame publishing the attribute as it will.
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(2500)
  summary.emptyWithoutAttribute = await s.ev(STATE)
  await s.ev(`(() => { document.querySelector('[data-novel-conversation-column]')?.setAttribute('data-novel-thread-state', 'empty'); return true })()`)
  await sleep(800)
  summary.emptyWithAttribute = await s.ev(STATE)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'final-rule-empty.png'), Buffer.from(r.data, 'base64')) })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'final-rule-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
for (const [k, v] of Object.entries(summary)) console.log(`${k}: ${JSON.stringify(v)}`)
