#!/usr/bin/env node
/**
 * What the conversation column's DOM actually contains.
 *
 * The frame hides the shipped transcript with `[data-slot="conversation.session"]`,
 * but hit-testing says shipped surfaces (`wSkVaW_scrollBody`, `uV2eYG_hero`) are
 * still on top across most of the column. So this dumps the real subtree: every
 * element with a `data-slot`, and the element path from the column down to the
 * first shipped class — to see which slot the shipped transcript actually lives
 * under.
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

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'domdump-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9483', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9483/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(1500)

  // Every data-slot in the page, with its box and whether it is display:none.
  summary.slots = await s.ev(`(() => Array.from(document.querySelectorAll('[data-slot]')).map(el => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return { slot: el.getAttribute('data-slot'), tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 36),
      display: cs.display, vis: cs.visibility,
      w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } }))()`)

  // Walk the conversation column: the element path to the deepest shipped node.
  summary.columnPath = await s.ev(`(() => {
    const col = document.querySelector('[data-novel-conversation-column]')
    if (col === null) return null
    const out = []
    const walk = (el, depth) => {
      if (depth > 8) return
      const r = el.getBoundingClientRect()
      out.push({ depth, tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 40),
        slot: el.getAttribute('data-slot'), display: getComputedStyle(el).display,
        w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) })
      for (const c of el.children) walk(c, depth + 1)
    }
    walk(col, 0)
    return out })()`)

  writeFileSync(join(outDir, 'dom-dump.json'), `${JSON.stringify(summary, null, 2)}\n`)
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
console.log('slots:')
for (const sl of summary.slots ?? []) console.log(`  ${sl.slot}  display=${sl.display} ${sl.w}x${sl.h}@${sl.top} ${sl.tag}.${sl.cls}`)
console.log('column path:')
for (const p of (summary.columnPath ?? []).slice(0, 80)) console.log(`  ${'  '.repeat(p.depth)}${p.tag}.${p.cls} slot=${p.slot} disp=${p.display} ${p.w}x${p.h}@${p.top}`)
