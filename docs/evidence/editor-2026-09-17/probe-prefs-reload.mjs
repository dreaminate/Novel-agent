#!/usr/bin/env node
/**
 * I6.2 real-machine check: the author's choices come back after a reload.
 *
 * Unit tests prove the store writes and re-reads a validated slice; only a real
 * page proves the frame can reach `localStorage` at all (the workbench runs
 * inside the Host's page, which can refuse storage), that the choices are on
 * screen after a reload, and that nothing session-shaped lands in the store.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/editor-2026-09-17')
const KEY = 'novel-workbench/prefs'
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

/** What the author would see, plus what the browser is holding for them. */
const OBSERVE = `(() => {
  const pressed = label => {
    const group = document.querySelector('[aria-label="' + label + '"]')
    if (group === null) return null
    const on = Array.from(group.querySelectorAll('button')).find(b => b.getAttribute('aria-pressed') === 'true')
    return on === null ? null : on.textContent.trim()
  }
  const byText = text => Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.trim() === text) ?? null
  return {
    view: document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null,
    theme: pressed('主题'),
    sidebarCollapsed: byText('左栏')?.getAttribute('aria-pressed') ?? null,
    detailsCollapsed: document.querySelector('[data-novel-topbar-details]')?.getAttribute('aria-pressed') ?? null,
    stored: localStorage.getItem(${JSON.stringify(KEY)}),
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'prefs-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9461', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9461/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-canvas]') !== null`)
  await sleep(2500)
  /** The reading size is only on screen inside the sheet, so open it to look. */
  const readSize = async () => {
    await s.ev(`document.querySelector('[data-novel-settings-open="true"]')?.click()`)
    await s.until(`document.querySelector('[data-novel-settings]') !== null`, 5000)
    const size = await s.ev(
      `document.querySelector('[data-novel-settings-size][aria-pressed="true"]')?.getAttribute('data-novel-settings-size') ?? null`)
    await s.ev(`document.querySelector('[data-novel-settings-close]')?.click()`)
    await sleep(250)
    return size
  }
  summary.fresh = { ...(await s.ev(OBSERVE)), readingSize: await readSize() }

  // The author makes four choices: a canvas, a theme, a reading size and the
  // two columns.
  await s.ev(`document.querySelector('[data-novel-view="map"]').click()`)
  await sleep(400)
  await s.ev(`document.querySelector('[aria-label="主题"]').querySelectorAll('button')[2].click()`)
  await sleep(300)
  await s.ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === '左栏'); b.click() })()`)
  await s.ev(`document.querySelector('[data-novel-topbar-details]').click()`)
  await sleep(300)
  await s.ev(`document.querySelector('[data-novel-settings-open="true"]').click()`)
  await s.until(`document.querySelector('[data-novel-settings-size="16"]') !== null`)
  await s.ev(`document.querySelector('[data-novel-settings-size="16"]').click()`)
  await s.ev(`document.querySelector('[data-novel-settings-close]').click()`)
  await sleep(400)
  summary.chosen = { ...(await s.ev(OBSERVE)), readingSize: await readSize() }

  // A reload is the whole point: the page throws away everything in memory.
  await s.send('Page.reload', { ignoreCache: false })
  await s.until(`document.querySelector('[data-novel-canvas]') !== null`)
  await sleep(2500)
  summary.afterReload = { ...(await s.ev(OBSERVE)), readingSize: await readSize() }

  summary.roundTrip = {
    view: summary.afterReload.view === summary.chosen.view && summary.chosen.view === 'map',
    theme: summary.afterReload.theme === summary.chosen.theme && summary.chosen.theme === '夜间',
    sidebar: summary.afterReload.sidebarCollapsed === 'true',
    details: summary.afterReload.detailsCollapsed === 'true',
    readingSize: summary.afterReload.readingSize === '16' && summary.chosen.readingSize === '16',
  }
  summary.leaksSessionState = /"transcript"|"lastSubmission"|"sessionId"|"personFileId"/.test(summary.afterReload.stored ?? '')

  // Leave the dev host as it was found: an author's real choices are not this
  // probe's to keep.
  await s.ev(`localStorage.removeItem(${JSON.stringify(KEY)})`)
  await s.send('Page.reload', { ignoreCache: false })
  await s.until(`document.querySelector('[data-novel-canvas]') !== null`)
  await sleep(2000)
  summary.restored = { ...(await s.ev(OBSERVE)), readingSize: await readSize() }
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'prefs-reload-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
