#!/usr/bin/env node
/**
 * The conversation chrome real-machine check: the shipped composer, hero and
 * header render inside our column, and they are drawn in the host theme's
 * variables — cool greys and a blue accent against this product's warm greys and
 * orange. The frame answers those variables with its own tokens, and this
 * measures whether the pixels actually changed.
 *
 * Night is the discriminating case: the host palette's base is a cool #151517,
 * this product's is a warm 48,48,46, so the composer's own background says which
 * one won.
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

/**
 * Where the composer's colours come from: the card it draws, the frame's own
 * tokens, and the variables the shipped surface reads. A `card` that matches the
 * frame's base rather than the host's is the whole point.
 */
const MEASURE = `(() => {
  const frame = document.querySelector('[data-novel-workbench="frame"]')
  const column = document.querySelector('[data-novel-conversation-column]')
  if (frame === null) return null
  const frameStyle = getComputedStyle(frame)
  const themed = frameStyle.getPropertyValue('--bg-000').trim()
  // The composer card is the big rounded box in the column; take the widest
  // element that is not the column itself.
  const inColumn = column === null ? [] : Array.from(column.querySelectorAll('*'))
  const card = inColumn
    .map(node => ({ node, r: node.getBoundingClientRect() }))
    .filter(entry => entry.r.width > 200 && entry.r.height > 60)
    .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0]
  return {
    theme: frame.getAttribute('data-nw-theme'),
    frameBase: frameStyle.getPropertyValue('--bg-base-computed') || themed,
    composedBase: frameStyle.getPropertyValue('--dsw-alias-bg-base').trim(),
    composedAccent: frameStyle.getPropertyValue('--dsw-alias-state-business-primary').trim(),
    composedFont: frameStyle.getPropertyValue('--dsw-font-family').trim(),
    columnBackground: column === null ? null : getComputedStyle(column).backgroundColor,
    card: card === undefined ? null : {
      cls: String(card.node.className).slice(0, 24),
      background: getComputedStyle(card.node).backgroundColor,
      color: getComputedStyle(card.node).color,
      border: getComputedStyle(card.node).borderTopColor,
      font: getComputedStyle(card.node).fontFamily.slice(0, 30),
    },
    hostBase: getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base').trim(),
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'chrome-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9481', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9481/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(1500)

  summary.day = await s.ev(MEASURE)

  // Night is where the two palettes cannot be confused: warm 48,48,46 against
  // the host's cool 21,21,23.
  await s.ev(`document.querySelector('[aria-label="主题"]').querySelectorAll('button')[2].click()`)
  await sleep(900)
  summary.night = await s.ev(MEASURE)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'conversation-night.png'), Buffer.from(shot.data, 'base64'))
  })

  await s.ev(`document.querySelector('[aria-label="主题"]').querySelectorAll('button')[0].click()`)
  await sleep(700)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'conversation-day.png'), Buffer.from(shot.data, 'base64'))
  })
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'conversation-chrome-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
