#!/usr/bin/env node
/**
 * I3.2b real-machine check: the landing page is 写作, and 阅读 is the same
 * document in its reading state with the typography the settings sheet offers.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S { #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws) { this.#ws = ws; ws.addEventListener('message', e => { const m = JSON.parse(e.data)
    if (m.id === undefined) { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ')); if (m.method === 'Runtime.exceptionThrown') this.errs.push('EXC ' + (m.params.exceptionDetails?.exception?.description ?? '')); return }
    const p = this.#p.get(m.id); if (!p) return; this.#p.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) }) }
  send(method, params = {}) { const id = ++this.#n; return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) }) }
  async ev(x) { const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result?.value }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(200) } return false }
  close() { this.#ws.close() } }

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'edread-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9454', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9454/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(3000)
  // The landing page, before any navigation.
  console.log('landing canvas:', await s.ev(`document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null`))

  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n) n.click() })()`)
  await sleep(1500)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2000)
  // The old read view must be gone from the rail entirely.
  console.log('rail has read entry:', await s.ev(`document.querySelector('[data-novel-view="read"]') !== null`))
  console.log('editor modes offered:', await s.ev(`document.querySelectorAll('[data-novel-editor-mode]').length`))

  await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-mode="read"]'); if (b) b.click() })()`)
  await sleep(1200)
  console.log('reading state:', JSON.stringify(await s.ev(`(() => { const a = document.querySelector('[data-novel-editor-reading]'); if (a === null) return null; return { paragraphs: a.querySelectorAll('p').length, fontSize: a.style.fontSize, lineHeight: a.style.lineHeight, textIndent: a.style.textIndent, maxWidth: a.style.maxWidth } })()`)))
  console.log('errors:', s.errs.length, s.errs.slice(0, 2))
} finally { try { s?.close() } catch {}; if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) } try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {} }
