#!/usr/bin/env node
/**
 * The editor, once a chapter is selected.
 *
 * The main canvas is the writing surface, so this picks a chapter from the rail
 * and checks whether an editor exists, takes focus, and accepts a keystroke.
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
    await sleep(500)
  }
  close() { this.#ws.close() } }

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'editor-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9494', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9494/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)
  // Close the conversation column so the canvas has the room.
  await s.ev(`document.querySelector('[data-novel-topbar-details]')?.click()`)
  await sleep(1200)

  summary.chapters = await s.ev(`(() => Array.from(document.querySelectorAll('[data-novel-chapter]')).map(el => ({
    id: el.getAttribute('data-novel-chapter'), status: el.getAttribute('data-novel-chapter-status'),
    label: (el.textContent || '').trim().slice(0, 20) })))()`)
  await s.ev(`document.querySelector('[data-novel-chapter]')?.click()`)
  await sleep(2500)

  summary.editor = await s.ev(`(() => {
    const canvas = document.querySelector('[data-novel-canvas-seat]')
    const pm = document.querySelector('.ProseMirror')
    const ce = Array.from(document.querySelectorAll('[contenteditable="true"]'))
    const out = { proseMirror: pm === null ? null : (() => { const r = pm.getBoundingClientRect()
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), len: pm.textContent.length, editable: pm.getAttribute('contenteditable') } })(),
      contentEditables: ce.length,
      canvasText: (canvas?.textContent || '').trim().slice(0, 80) }
    return out })()`)

  if (summary.editor?.proseMirror !== null && summary.editor?.proseMirror !== undefined) {
    const box = await s.ev(`(() => { const pm = document.querySelector('.ProseMirror'); const r = pm.getBoundingClientRect()
      return { x: Math.round(r.left + 40), y: Math.round(r.top + 20) } })()`)
    await s.click(box.x, box.y)
    summary.afterClick = await s.ev(`(() => { const el = document.activeElement; return el === null ? 'null' : el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,30) })()`)
    const before = await s.ev(`document.querySelector('.ProseMirror')?.textContent.length ?? null`)
    for (const ch of '测试') {
      await s.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch, unmodifiedText: ch })
      await s.send('Input.dispatchKeyEvent', { type: 'char', text: ch, key: ch, unmodifiedText: ch })
      await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch })
      await sleep(80)
    }
    await sleep(600)
    const after = await s.ev(`document.querySelector('.ProseMirror')?.textContent.length ?? null`)
    summary.typing = { before, after }
  }
  await s.send('Page.captureScreenshot', { format: 'png' }).then(r => { writeFileSync(join(outDir, 'editor-selected.png'), Buffer.from(r.data, 'base64')) })
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'editor-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
