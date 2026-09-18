#!/usr/bin/env node
/**
 * The narrow window: the conversation becomes a floating column.
 *
 * The author's window may be narrower than the 1440 used so far, where the frame
 * turns the conversation into an overlay. This runs the same empty-thread
 * measurements at 1024 and 900 wide.
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

const STATE = `(() => {
  const frame = document.querySelector('[data-novel-workbench="frame"]')
  const col = document.querySelector('[data-novel-conversation-column]')
  const seat = document.querySelector('[data-novel-transcript-seat]')
  const cs = el => el === null ? null : (() => { const c = getComputedStyle(el); return { disp: c.display, pos: c.position, z: c.zIndex, w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height), top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom), left: Math.round(el.getBoundingClientRect().left) } })()
  return { narrow: frame?.getAttribute('data-narrow'), innerW: innerWidth, innerH: innerHeight,
    column: cs(col), transcriptSeat: cs(seat) } })()`

const dir0 = mkdtempSync(join(tmpdir(), 'narrow-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9495', `--user-data-dir=${dir0}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9495/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrlOf() })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  for (const [w, h] of [[1024, 760], [900, 700]]) {
    await s.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false })
    await sleep(1200)
    await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
    await sleep(2200)
    summary[`${w}x${h}`] = await s.ev(STATE)
    // Now the topbar's 对话 button — the way back the frame's comment promises.
    await s.ev(`document.querySelector('[data-novel-topbar-details]')?.click()`)
    await sleep(1500)
    summary[`${w}x${h}-afterDetails`] = await s.ev(STATE)
    await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, `narrow-${w}-after-details.png`), Buffer.from(r.data, 'base64')) })
  }
  await s.send('Emulation.clearDeviceMetricsOverride')
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir0, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'narrow-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))

function hostUrlOf() { return readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim() }
