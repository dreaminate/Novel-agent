#!/usr/bin/env node
/**
 * Experiments on the empty thread: which rule makes the column behave like the
 * populated one.
 *
 * The difference between the two states is measured: populated has a 0-height
 * shipped scroll body and a 140px compact composer, empty has a 648px scroll
 * body and a 312px hero composer. This injects candidate rules one at a time and
 * reports the column afterwards, so the fix is chosen from pixels rather than
 * from reading shipped CSS.
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

/** The layout facts that matter: who is tall, and where the composer sits. */
const STATE = `(() => {
  const col = document.querySelector('[data-novel-conversation-column]')
  if (col === null) return null
  const side = col
  const root = col.querySelector('[data-slot="conversation"] > *')
  const seat = document.querySelector('[data-novel-transcript-seat]')
  const body = root?.querySelector('[class*="_body"]')
  const scroll = root?.querySelector('[class*="_scrollBody"]')
  const composerSeat = root?.querySelector('[class*="_composerSeat"]')
  const stack = root?.querySelector('[class*="_composerStack"]')
  const box = el => el === null || el === undefined ? null : (() => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el)
    return { h: Math.round(r.height), top: Math.round(r.top), flex: cs.flex, cls: String(el.className||'').slice(0,44), disp: cs.display } })()
  const empty = document.querySelector('.novel-transcript-empty')
  return {
    emptyState: empty === null ? null : (() => { const r = empty.getBoundingClientRect(); const cs = getComputedStyle(empty)
      return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right),
        overflow: r.right > col.getBoundingClientRect().right, size: cs.fontSize, lh: cs.lineHeight, align: cs.textAlign } })(),
    sideFlex: { disp: getComputedStyle(side).display, dir: getComputedStyle(side).flexDirection, h: Math.round(side.getBoundingClientRect().height) },
    root: box(root), body: box(body), scroll: box(scroll),
    composerSeat: box(composerSeat), stack: box(stack), transcriptSeat: box(seat),
    sideChildren: Array.from(side.children).map(c => box(c)),
  } })()`

/** Each candidate is a full stylesheet the probe swaps in. */
const CANDIDATES = {
  none: '',
  // Hide every direct child of the hero composer stack except the composer bar
  // itself, and stop the shipped root from claiming the column height.
  heroGone: `
    [data-novel-workbench="frame"] .side:has([class*="_composerHero"]) [data-slot="conversation"] > * {
      flex: 0 0 auto !important; height: auto !important; min-height: 0 !important; }
    [data-novel-workbench="frame"] [class*="_composerHero"] > *:not([data-slot="conversation.composer.bar"]) {
      display: none !important; }`,
  // The same, plus a reading-sized empty state that does not run to the edges.
  heroGoneAndEmpty: `
    [data-novel-workbench="frame"] .side:has([class*="_composerHero"]) [data-slot="conversation"] > * {
      flex: 0 0 auto !important; height: auto !important; min-height: 0 !important; }
    [data-novel-workbench="frame"] [class*="_composerHero"] > *:not([data-slot="conversation.composer.bar"]) {
      display: none !important; }
    [data-novel-workbench="frame"] .novel-transcript { padding: 24px 20px 8px !important; }
    [data-novel-workbench="frame"] .novel-transcript-empty {
      margin: auto 0 !important; text-align: center !important;
      font-family: var(--font-ui) !important; font-size: 13px !important;
      line-height: 1.7 !important; color: hsl(var(--text-200)) !important; }
    [data-novel-workbench="frame"] [data-novel-transcript-seat]:has(.novel-transcript-empty) { display: flex !important; }`,
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'experiment-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9488', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = { results: {} }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9488/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  // Open a thread (any), then create a fresh empty one via the rail.
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2000)
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(3000)

  for (const [name, css] of Object.entries(CANDIDATES)) {
    await s.ev(`(() => {
      let tag = document.getElementById('probe-experiment')
      if (tag === null) { tag = document.createElement('style'); tag.id = 'probe-experiment'; document.head.appendChild(tag) }
      tag.textContent = ${JSON.stringify(css)};
      return true })()`)
    await sleep(600)
    summary.results[name] = await s.ev(STATE)
    await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
      writeFileSync(join(outDir, `experiment-${name}.png`), Buffer.from(shot.data, 'base64'))
    })
  }
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'experiment-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
for (const [name, r] of Object.entries(summary.results)) {
  console.log(`--- ${name}`)
  if (r === null) { console.log('  null'); continue }
  console.log(`  emptyState=${JSON.stringify(r.emptyState)}`)
  console.log(`  transcriptSeat=${JSON.stringify(r.transcriptSeat)}`)
  console.log(`  root=${JSON.stringify(r.root)}`)
  console.log(`  scroll=${JSON.stringify(r.scroll)}`)
  console.log(`  composerSeat=${JSON.stringify(r.composerSeat)}`)
}
