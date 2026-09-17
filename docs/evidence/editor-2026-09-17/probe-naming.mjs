#!/usr/bin/env node
/**
 * I6.5a real-machine check: nothing Canon's vocabulary shows through to the
 * author — no raw aspect keys, no `0 人` placeholders, no nameless thread rows.
 *
 * The one thing this Canon cannot demonstrate is a relationship written with
 * names, because it records no character names at all (every character-state
 * delta carries `constitution` / `realm` / `persona` / … and never `name`). That
 * gap is reported rather than papered over: the front end now prefers a name and
 * has none to prefer.
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

/** Canon's own vocabulary, as keys an author must never be shown. */
const KEYS = ['constitution', 'realm', 'persona', 'mechanism', 'artifact', 'signature',
  'thread', 'status', 'faction', 'name', 'role', 'emotion', 'agenda', 'assets', 'leadership']

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'naming-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9473', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9473/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-view="cast"]') !== null`)
  await sleep(3000)

  // ① the cast board
  await s.ev(`document.querySelector('[data-novel-view="cast"]').click()`)
  await s.until(`document.querySelector('[data-novel-cast]') !== null`)
  await sleep(1200)
  summary.cast = await s.ev(`(() => {
    const board = document.querySelector('[data-novel-cast]')
    const text = board.innerText
    const keys = ${JSON.stringify(KEYS)}
    return {
      leaksKeys: keys.filter(key => new RegExp('(^|[^a-z-])' + key + '($|[^a-z-])').test(text)),
      zeroChips: Array.from(board.querySelectorAll('[data-novel-faction]'))
        .map(card => card.innerText).filter(text2 => text2.includes('0 人')),
      factionCards: Array.from(board.querySelectorAll('[data-novel-faction]'))
        .map(card => card.innerText.replace(/\\n/g, ' ')),
      relationLines: Array.from(board.querySelectorAll('[data-novel-relation]'))
        .map(row => row.innerText.replace(/\\n/g, ' ').slice(0, 60)),
      sample: text.replace(/\\n+/g, ' ').slice(0, 240) } })()`)

  // ② one 人物档案
  await s.ev(`document.querySelector('[data-novel-person] button')?.click()`)
  await s.until(`document.querySelector('[data-novel-person-file]') !== null`)
  await sleep(800)
  summary.drawer = await s.ev(`(() => {
    const drawer = document.querySelector('[data-novel-person-file]')
    const text = drawer.innerText
    const keys = ${JSON.stringify(KEYS)}
    return {
      leaksKeys: keys.filter(key => new RegExp('(^|[^a-z-])' + key + '($|[^a-z-])').test(text)),
      labels: Array.from(drawer.querySelectorAll('[data-novel-person-aspect]'))
        .map(node => node.querySelector('.field')?.textContent ?? '(no label)'),
      sample: text.replace(/\\n+/g, ' ').slice(0, 200) } })()`)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'naming-drawer.png'), Buffer.from(shot.data, 'base64'))
  })
  await s.ev(`document.querySelector('[data-novel-person-close]')?.click()`)
  await sleep(400)

  // ③ the rail's thread rows
  summary.threads = await s.ev(`(() => {
    const rows = Array.from(document.querySelectorAll('[data-novel-thread]'))
    return { count: rows.length,
      nameless: rows.filter(row => (row.textContent ?? '').trim() === '').length,
      named: rows.map(row => (row.textContent ?? '').trim().slice(0, 14)) } })()`)

  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'naming-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
