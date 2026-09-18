#!/usr/bin/env node
/**
 * A sweep of the surfaces an author actually clicks.
 *
 * Two questions per control: is it big enough to hit, and does the point at its
 * centre actually belong to it (or is something stacked on top). Both are
 * measured, not eyeballed, and anything that fails is reported with its box.
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

/**
 * For every control that looks clickable, report sliver size and what the centre
 * point resolves to. A control whose centre resolves to something outside itself
 * cannot be clicked where the author sees it.
 */
const SWEEP = `(() => {
  const controls = Array.from(document.querySelectorAll('button, [role="button"], [role="separator"], input, textarea, [contenteditable="true"], a[href]'))
  const out = []
  for (const el of controls) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden') continue
    if (r.width < 1 || r.height < 1) continue
    if (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue
    const x = Math.round(r.left + r.width / 2)
    const y = Math.round(r.top + r.height / 2)
    const top = document.elementFromPoint(x, y)
    const ownsCentre = top !== null && (top === el || el.contains(top) || top.contains(el))
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 34),
      label: (el.getAttribute('aria-label') ?? el.getAttribute('title') ?? (el.textContent || '')).trim().slice(0, 20),
      w: Math.round(r.width), h: Math.round(r.height),
      pe: cs.pointerEvents,
      disabled: el.disabled === true,
      ownsCentre,
      topTag: top === null ? 'null' : top.tagName.toLowerCase(),
      topCls: top === null ? '' : String(top.className || '').slice(0, 30),
      sliver: r.width < 24 || r.height < 18,
    })
  }
  return out })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'sweep-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9489', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9489/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await sleep(2500)
  summary.body = await s.ev(SWEEP)
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(2500)
  summary.emptyThread = await s.ev(SWEEP)
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'sweep-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
for (const [state, list] of Object.entries(summary)) {
  const bad = (list ?? []).filter(c => !c.ownsCentre || c.sliver || c.disabled || c.pe === 'none')
  console.log(`=== ${state}: ${(list ?? []).length} controls, ${bad.length} suspect`)
  for (const c of bad) console.log(`  ${c.tag}.${c.cls} "${c.label}" ${c.w}x${c.h} pe=${c.pe} dis=${c.disabled} sliver=${c.sliver} centre->${c.topTag}.${c.topCls}`)
}
