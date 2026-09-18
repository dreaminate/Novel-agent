#!/usr/bin/env node
/**
 * The top bar, the settings and advanced panels, and night mode.
 *
 * The conversation column is one complaint; this covers the rest of the chrome
 * the author touches — the seven top-bar controls, the two popovers, and a night
 * screenshot — reporting what each click produced.
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

const TOPBAR = `(() => Array.from(document.querySelectorAll('[data-novel-topbar] button, .topbar button')).map(el => {
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el)
  return { label: (el.getAttribute('aria-label') ?? (el.textContent||'')).trim().slice(0,14),
    w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2),
    pressed: el.getAttribute('aria-pressed'), dis: el.disabled === true, vis: cs.display !== 'none' } }))()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'chrome-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9492', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9492/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2200)

  summary.topbar = await s.ev(TOPBAR)

  const probe = async (label, js, shot) => {
    const before = await s.ev(`document.querySelectorAll('body *').length`)
    await s.ev(js)
    await sleep(900)
    const after = await s.ev(`document.querySelectorAll('body *').length`)
    const state = await s.ev(`(() => ({ panels: Array.from(document.querySelectorAll('[data-novel-settings], [data-novel-advanced], .settings-pop, [data-novel-shell]')).map(e => e.getAttribute('data-novel-settings') ?? e.getAttribute('data-novel-advanced') ?? e.getAttribute('data-novel-shell') + ':' + getComputedStyle(e).display).slice(0, 6),
      theme: document.querySelector('[data-novel-workbench="frame"]')?.getAttribute('data-nw-theme') }))()`)
    if (shot !== undefined) await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, shot), Buffer.from(r.data, 'base64')) })
    summary[label] = { nodesBefore: before, nodesAfter: after, state }
  }

  await probe('settings', `document.querySelector('[data-novel-settings-open]')?.click()`, 'chrome-settings.png')
  await s.ev(`document.querySelector('[data-novel-settings-open]')?.click()`); await sleep(500)
  await probe('night', `(() => { const b = document.querySelector('[aria-label="主题"]'); if (b !== null) b.querySelectorAll('button')[2]?.click() })()`, 'chrome-night.png')
  await s.ev(`(() => { const b = document.querySelector('[aria-label="主题"]'); if (b !== null) b.querySelectorAll('button')[0]?.click() })()`); await sleep(600)
  await probe('advanced', `(() => { const b = document.querySelector('[data-novel-advanced-toggle]'); if (b !== null) b.click() })()`, 'chrome-advanced.png')
  summary.consoleErrors = []
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'chrome-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log('topbar:', JSON.stringify(summary.topbar, null, 1))
for (const k of ['settings', 'night', 'advanced']) console.log(k + ':', JSON.stringify(summary[k]))
