#!/usr/bin/env node
/** One-off: does typing `/` and `@` in the shipped composer open a candidate menu? */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))

class Session {
  #ws; #next = 0; #pending = new Map()
  constructor(ws) {
    this.#ws = ws
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data)
      if (m.id === undefined) return
      const p = this.#pending.get(m.id)
      if (p === undefined) return
      this.#pending.delete(m.id)
      if (m.error) p.reject(new Error(m.error.message))
      else p.resolve(m.result)
    })
  }
  send(method, params = {}) {
    const id = ++this.#next
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails !== undefined) throw new Error(r.exceptionDetails.exception?.description)
    return r.result?.value
  }
  async until(expr, ms = 20000) {
    const end = Date.now() + ms
    while (Date.now() < end) {
      try { if (await this.evaluate(expr)) return true } catch { /* nav */ }
      await sleep(200)
    }
    return false
  }
  close() { this.#ws.close() }
}

/** Anything resembling a candidate menu near the composer. */
const MENU = `(() => {
  const overlay = document.querySelector('[data-slot="conversation.input.overlay"]')
  const scope = overlay ?? document
  const text = (scope.innerText ?? '').trim().replace(/\\n+/g, ' | ')
  const rows = scope.querySelectorAll('[role=option],[role=menuitem],[data-index]').length
  const listbox = scope.querySelector('[role=listbox],[role=menu]') !== null
  return { hasOverlay: overlay !== null, listbox, rows, text: text.slice(0, 300) }
})()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'trigger-look-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9449', `--user-data-dir=${dir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

let session
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try {
      const t = await (await fetch('http://127.0.0.1:9449/json/list')).json()
      const page = t.find(x => x.type === 'page')
      if (page?.webSocketDebuggerUrl !== undefined) { url = page.webSocketDebuggerUrl; break }
    } catch { /* starting */ }
    await sleep(200)
  }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', () => rej(new Error('ws failed')), { once: true })
  })
  session = new Session(ws)
  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Page.navigate', { url: hostUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await session.evaluate(`(() => { const s = document.querySelector('[data-novel-rail-segment="threads"]'); if (s) s.click() })()`)
  await session.until(`document.querySelector('[data-novel-thread]') !== null`)
  await session.evaluate(`(() => { const r = document.querySelector('[data-novel-thread]'); if (r) r.click() })()`)
  await session.until(`(() => {
    const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
    if (el === null) return false
    const r = el.getBoundingClientRect()
    return r.width > 50 && r.height > 5 })()`, 20000)
  await sleep(1500)

  const box = await session.evaluate(`(() => {
    const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
    if (el === null) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
  for (const type of ['mousePressed', 'mouseReleased']) {
    await session.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 })
  }
  await sleep(400)

  const out = {}
  await session.send('Input.insertText', { text: '/' })
  await sleep(1800)
  out.slash = await session.evaluate(MENU)

  // Clear, then try the reference trigger.
  await session.evaluate(`(() => { const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]'); el?.focus() })()`)
  for (const key of ['a', 'Backspace']) {
    await session.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key === 'a' ? 'KeyA' : 'Backspace', windowsVirtualKeyCode: key === 'a' ? 65 : 8, modifiers: key === 'a' ? 4 : 0 })
    await session.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key === 'a' ? 'KeyA' : 'Backspace', windowsVirtualKeyCode: key === 'a' ? 65 : 8, modifiers: key === 'a' ? 4 : 0 })
  }
  await sleep(300)
  await session.send('Input.insertText', { text: '@' })
  await sleep(1800)
  out.at = await session.evaluate(MENU)

  console.log(JSON.stringify(out, null, 2))
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
