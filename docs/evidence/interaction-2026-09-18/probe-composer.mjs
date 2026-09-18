#!/usr/bin/env node
/**
 * The empty thread's composer region, element by element.
 *
 * On a thread with messages the column is all ours; on an empty thread the
 * shipped surface renders its hero welcome page and the column is mostly a
 * blank scroll body. The hero and the composer are the same seat, so this dumps
 * the composer subtree with every box, to see which node carries the hero
 * treatment and whether anything distinguishes hero from compact.
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

const DUMP = `(() => {
  const col = document.querySelector('[data-novel-conversation-column]')
  if (col === null) return null
  const out = []
  const walk = (el, depth) => {
    if (depth > 14) return
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (r.width === 0 && r.height === 0 && cs.display === 'contents') { }
    out.push({ depth, tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 46),
      slot: el.getAttribute('data-slot'), disp: cs.display,
      w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left),
      greedy: (el.className && String(el.className).includes('hero')) ? 'HERO' : '' })
    for (const c of el.children) walk(c, depth + 1)
  }
  walk(col, 0)
  return out })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'composer-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9487', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9487/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(2500)
  // A thread that already has messages: the composer's compact form.
  await s.ev(`(() => { const rows = Array.from(document.querySelectorAll('[data-novel-thread]')); if (rows[3]) rows[3].click() })()`)
  await sleep(3000)
  const dump = await s.ev(DUMP)
  writeFileSync(join(outDir, 'composer-dump-full.json'), `${JSON.stringify(dump, null, 2)}\n`)
  for (const d of (dump ?? [])) console.log(`${'  '.repeat(d.depth)}${d.tag}.${d.cls} slot=${d.slot} ${d.disp} ${d.w}x${d.h}@${d.top},${d.left} ${d.greedy}`)
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
