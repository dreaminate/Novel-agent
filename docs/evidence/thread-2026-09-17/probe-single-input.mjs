#!/usr/bin/env node
/** One-off: what does the thread view actually show today? */
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
  async until(expr, ms = 25000) {
    const end = Date.now() + ms
    while (Date.now() < end) {
      try { if (await this.evaluate(expr)) return true } catch { /* nav */ }
      await sleep(200)
    }
    return false
  }
  close() { this.#ws.close() }
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'thread-look-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--remote-debugging-port=9448', `--user-data-dir=${dir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

let session
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try {
      const t = await (await fetch('http://127.0.0.1:9448/json/list')).json()
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
  await sleep(4500)

  const report = await session.evaluate(`(() => {
    const look = sel => {
      const el = document.querySelector(sel)
      if (el === null) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), display: cs.display }
    }
    const slots = Array.from(document.querySelectorAll('[data-slot]')).map(n => n.getAttribute('data-slot'))
    return {
      ourBar: look('[data-novel-composer-row]'),
      ourInput: look('[data-novel-composer-input]'),
      officialComposerSlot: look('[data-slot="conversation.composer"]'),
      officialBar: look('[data-slot="conversation.composer.bar"]'),
      officialSeat: look('[data-novel-conversation-seat="true"]'),
      officialSession: look('[data-slot="conversation.session"]'),
      contentEditables: document.querySelectorAll('[contenteditable=true]').length,
      textareas: document.querySelectorAll('textarea').length,
      conversationSlots: slots.filter(s => s.startsWith('conversation'))
    }
  })()`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
