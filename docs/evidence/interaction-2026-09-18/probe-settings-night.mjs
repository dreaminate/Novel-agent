#!/usr/bin/env node
/**
 * The settings sheet in night mode: which token it actually resolves.
 *
 * The screenshot shows a white sheet on a night frame. The rule is written in
 * `--bg-000`, which should follow the theme, so this reads the computed value
 * and the token on both the frame and the sheet's ancestors.
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

const MEASURE = `(() => {
  const frame = document.querySelector('[data-novel-workbench="frame"]')
  const layer = document.querySelector('[data-novel-settings]')
  const sheet = document.querySelector('[data-novel-settings] .sheet')
  const g = (el, p) => el === null ? null : getComputedStyle(el).getPropertyValue(p).trim()
  return {
    frameTheme: frame?.getAttribute('data-nw-theme') ?? null,
    frameBg000: g(frame, '--bg-000'),
    frameBg100: g(frame, '--bg-100'),
    layerParentIsFrame: layer === null ? null : frame !== null && frame.contains(layer),
    layerBg: layer === null ? null : getComputedStyle(layer).backgroundColor,
    sheetBg: sheet === null ? null : getComputedStyle(sheet).backgroundColor,
    sheetColor: sheet === null ? null : getComputedStyle(sheet).color,
    sheetTokenBg000: g(sheet, '--bg-000'),
    // What is actually painted at the sheet's centre, and in what colour.
    sheetCentre: sheet === null ? null : (() => {
      const r = sheet.getBoundingClientRect()
      const x = Math.round(r.left + r.width / 2); const y = Math.round(r.top + 40)
      const top = document.elementFromPoint(x, y)
      const chain = []
      let el = top
      while (el !== null && chain.length < 6) { chain.push(el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 26) + '=' + getComputedStyle(el).backgroundColor); el = el.parentElement }
      return { x, y, top: top === null ? 'null' : chain } })(),
    sheetRect: sheet === null ? null : (() => { const r = sheet.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) } })(),
    bodyBg000: g(document.body, '--bg-000'),
    workbenchStyleSheets: Array.from(document.querySelectorAll('style')).length,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'night-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9493', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9493/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2000)
  summary.day = await s.ev(`(() => { document.querySelector('[data-novel-settings-open]')?.click(); return true })()`)
  await sleep(800)
  summary.day = await s.ev(MEASURE)
  // Switch to night while the sheet stays open — the order the screenshot used.
  await s.ev(`(() => { const b = document.querySelector('[aria-label="主题"]'); b?.querySelectorAll('button')[2]?.click() })()`)
  await sleep(1000)
  summary.nightWhileOpen = await s.ev(MEASURE)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'settings-night-while-open.png'), Buffer.from(r.data, 'base64')) })
  // Then close and reopen it.
  await s.ev(`document.querySelector('[data-novel-settings-open]')?.click()`)
  await sleep(500)
  await s.ev(`document.querySelector('[data-novel-settings-open]')?.click()`)
  await sleep(900)
  summary.nightReopened = await s.ev(MEASURE)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'settings-night-measured.png'), Buffer.from(r.data, 'base64')) })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'settings-night-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
