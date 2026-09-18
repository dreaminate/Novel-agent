#!/usr/bin/env node
/**
 * Can the author type.
 *
 * Buttons all hit-test fine, so "cannot interact" is about typing: this clicks
 * the composer's input area and the editor, types, and reports what took focus
 * and what the text actually became.
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
    await sleep(400)
  }
  async type(text) {
    for (const ch of text) {
      await this.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, key: ch, unmodifiedText: ch })
      await this.send('Input.dispatchKeyEvent', { type: 'char', text: ch, key: ch, unmodifiedText: ch })
      await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch })
      await sleep(40)
    }
    await sleep(400)
  }
  close() { this.#ws.close() } }

const ACTIVE = `(() => { const el = document.activeElement; if (el === null) return 'null'
  const r = el.getBoundingClientRect()
  return el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,32) + ' ce=' + (el.getAttribute('contenteditable') ?? '-')
    + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top) })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'typing-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9490', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9490/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  await sleep(3000)

  // Empty thread: the hero composer.
  await s.ev(`document.querySelector('[data-novel-new-thread]')?.click()`)
  await sleep(2500)
  const composer = await s.ev(`(() => { const el = document.querySelector('[class*="_scroll"]'); if (el === null) return null
    const r = el.getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), w: Math.round(r.width), h: Math.round(r.height) } })()`)
  summary.composerBox = composer
  if (composer !== null) {
    await s.click(composer.x, composer.y)
    summary.afterComposerClick = await s.ev(ACTIVE)
    await s.type('x')
    summary.composerText = await s.ev(`(() => { const el = document.querySelector('[class*="_scroll"]'); return el === null ? null : (el.textContent || '').trim().slice(0, 40) })()`)
  }

  // The editor on the main canvas.
  await s.ev(`document.activeElement?.blur?.()`)
  const editor = await s.ev(`(() => { const el = document.querySelector('.ProseMirror, [contenteditable="true"]'); if (el === null) return null
    const r = el.getBoundingClientRect(); return { sel: el.className, x: Math.round(r.left + r.width/2), y: Math.round(r.top + 40), w: Math.round(r.width), h: Math.round(r.height) } })()`)
  summary.editorBox = editor
  if (editor !== null) {
    await s.click(editor.x, editor.y)
    summary.afterEditorClick = await s.ev(ACTIVE)
    const before = await s.ev(`(() => { const el = document.querySelector('.ProseMirror'); return el === null ? null : el.textContent.length })()`)
    await s.type('z')
    const after = await s.ev(`(() => { const el = document.querySelector('.ProseMirror'); return el === null ? null : el.textContent.length })()`)
    summary.editorLength = { before, after }
  }
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'typing-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
