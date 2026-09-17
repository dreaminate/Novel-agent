#!/usr/bin/env node
/**
 * I6.3 real-machine check: at 1280 the prototype's own narrow rules apply to our
 * frame — an icon rail, a conversation column that floats instead of taking a
 * track — and at 1440 they do not.
 *
 * Measurements, not impressions: the rail's real width, whether anything spills
 * out of it (a chapter row keeps its title text in 58px unless it is told not
 * to), whether the conversation column overlaps the canvas, and whether the page
 * overflows its viewport.
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

const MEASURE = `(() => {
  const frame = document.querySelector('[data-novel-workbench="frame"]')
  if (frame === null) return null
  const box = node => { if (node === null) return null; const r = node.getBoundingClientRect()
    return { x: Math.round(r.x), w: Math.round(r.width), top: Math.round(r.top), bottom: Math.round(r.bottom) } }
  const rail = document.querySelector('[data-novel-rail="nav"]')
  const main = document.querySelector('[data-novel-shell="main"]')
  const side = document.querySelector('[data-novel-conversation-column]')
  const railBox = box(rail)
  // An item that keeps text wider than the rail draws over the canvas: the rail
  // is the only thing that is allowed to decide how wide its rows are.
  const spill = rail === null ? [] : Array.from(rail.querySelectorAll('.item'))
    .filter(item => item.scrollWidth > railBox.w + 1)
    .map(item => (item.textContent ?? '').trim().slice(0, 12))
  const rows = getComputedStyle(frame).gridTemplateRows
  return {
    narrow: frame.getAttribute('data-narrow'),
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    rail: railBox,
    railLabelsHidden: rail === null ? null
      : Array.from(rail.querySelectorAll('.lbl')).every(node => getComputedStyle(node).display === 'none'),
    railItems: rail === null ? 0 : rail.querySelectorAll('.item').length,
    railItemsWithoutName: rail === null ? [] : Array.from(rail.querySelectorAll('.item'))
      .filter(item => (item.getAttribute('title') ?? '').trim() === ''
        && (item.getAttribute('aria-label') ?? '').trim() === ''
        && (item.textContent ?? '').trim() === '')
      .map(item => item.outerHTML.slice(0, 160)),
    spill,
    main: box(main),
    side: box(side),
    sideClasses: side === null ? null : side.className,
    sideOverlapsMain: side !== null && main !== null && side.getBoundingClientRect().x < main.getBoundingClientRect().right,
    gridRows: rows,
    composerRowFilled: document.querySelector('.composer, [data-novel-composer]') !== null,
    frameHeight: Math.round(frame.getBoundingClientRect().height),
    // Which grid areas the frame's own children land in: the prototype's grid
    // still declares a composer row, and nothing fills it any more.
    areas: Array.from(frame.children).map(node => {
      const style = getComputedStyle(node)
      const r = node.getBoundingClientRect()
      return { cls: String(node.className).slice(0, 24), area: style.gridArea,
        top: Math.round(r.top), bottom: Math.round(r.bottom) }
    }),
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'narrow-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9463', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9463/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(3000)
  // Open a thread so there is a conversation column to fold out of the way.
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(900)
  summary.wide = await s.ev(MEASURE)

  await s.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(1200)
  summary.narrow = await s.ev(MEASURE)
  await s.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(join(outDir, 'narrow-window.png'), Buffer.from(shot.data, 'base64'))
  })

  // The author closes the conversation: the canvas gets the whole page back.
  await s.ev(`document.querySelector('[data-novel-topbar-details]').click()`)
  await sleep(800)
  summary.narrowClosed = await s.ev(MEASURE)

  // Back to a wide window: three columns again.
  await s.ev(`document.querySelector('[data-novel-topbar-details]').click()`)
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await sleep(1200)
  summary.wideAgain = await s.ev(MEASURE)
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'narrow-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
