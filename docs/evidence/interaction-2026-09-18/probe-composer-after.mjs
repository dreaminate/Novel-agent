#!/usr/bin/env node
/**
 * Is the composer still usable on an empty thread, after the fix?
 *
 * The column fix changes the shipped surface's own flex and hides part of it, so
 * the composer is the thing most likely to have been broken by it. This finds
 * the composer input by its own attributes, clicks it for real, and types.
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
  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none', buttons: 0 })
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
    await sleep(450)
  }
  close() { this.#ws.close() } }

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'composer2-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9498', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9498/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(2500)

  summary.input = await s.ev(`(() => {
    const el = document.querySelector('[class*="_input"][contenteditable="true"]')
    if (el === null) return null
    const r = el.getBoundingClientRect(); const c = getComputedStyle(el)
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom),
      x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
      visibility: c.visibility, display: c.display, opacity: c.opacity, pe: c.pointerEvents,
      hit: (() => { const t = document.elementFromPoint(Math.round(r.left + r.width/2), Math.round(r.top + r.height/2))
        return t === null ? 'null' : t.tagName.toLowerCase() + '.' + String(t.className||'').slice(0,26) })() } })()`)

  if (summary.input !== null) {
    await s.ev(`document.activeElement?.blur?.()`)
    await s.click(summary.input.x, summary.input.y)
    summary.active = await s.ev(`(() => { const el = document.activeElement; return el === null ? 'null' : el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,30) + ' ce=' + (el.getAttribute('contenteditable') ?? '-') })()`)
    for (const ch of '测试') {
      await s.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch, unmodifiedText: ch })
      await s.send('Input.dispatchKeyEvent', { type: 'char', text: ch, key: ch, unmodifiedText: ch })
      await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch })
      await sleep(80)
    }
    await sleep(600)
    summary.typed = await s.ev(`(() => { const el = document.querySelector('[class*="_input"][contenteditable="true"]'); return el === null ? null : (el.textContent || '').slice(0, 30) })()`)
    summary.sendEnabled = await s.ev(`(() => { const b = document.querySelector('[class*="_primary"]'); return b === null ? null : b.disabled === false })()`)
  }
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'verify-composer-empty.png'), Buffer.from(r.data, 'base64')) })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
console.log(JSON.stringify(summary, null, 2))
