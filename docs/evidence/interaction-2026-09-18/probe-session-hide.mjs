#!/usr/bin/env node
/**
 * Why `[data-slot="conversation.session"] { display: none }` does not hide the
 * shipped conversation.
 *
 * The column dump shows the element computing to `display: contents` — the
 * framework's own value — even though the frame declares `none` for it. So this
 * reports: the element's inline style, every CSS rule that matches it (selector,
 * origin, specificity), and its rendered children.
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

const REPORT = `(() => {
  const el = document.querySelector('[data-slot="conversation.session"]')
  if (el === null) return null
  const cs = getComputedStyle(el)
  // Every rule in every stylesheet whose selector text mentions this slot.
  const rules = []
  for (const sheet of Array.from(document.styleSheets)) {
    let list
    try { list = Array.from(sheet.cssRules) } catch { continue }
    const walk = (rs, href) => { for (const r of rs) {
      if (r.cssRules !== undefined) { walk(Array.from(r.cssRules), href); continue }
      const sel = r.selectorText
      if (sel === undefined) continue
      if (!sel.includes('conversation.session') && !sel.includes('data-slot')) continue
      let matches = false
      try { matches = el.matches(sel) } catch {}
      rules.push({ href, sel: sel.slice(0, 120), display: r.style?.display ?? '', matches })
    } }
    walk(list, sheet.href ?? (sheet.ownerNode?.id ?? 'inline'))
  }
  return {
    inlineStyle: el.getAttribute('style'),
    inlineDisplay: el.style.display,
    computedDisplay: cs.display,
    childCount: el.children.length,
    children: Array.from(el.children).slice(0, 12).map(c => {
      const r = c.getBoundingClientRect()
      return { tag: c.tagName.toLowerCase(), cls: String(c.className || '').slice(0, 40),
        display: getComputedStyle(c).display, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }
    }),
    rulesMatching: rules.filter(r => r.matches),
    rulesMentioning: rules.filter(r => !r.matches).slice(0, 12),
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'css-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9484', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9484/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-thread]')?.click()`)
  await s.until(`document.querySelector('[data-novel-conversation-column]') !== null`)
  await sleep(1500)
  const report = await s.ev(REPORT)
  writeFileSync(join(outDir, 'session-hide-report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
