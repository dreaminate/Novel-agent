#!/usr/bin/env node
/**
 * I3.5 real-machine check: with the profile's own thread count, the navigation
 * segment is still on the first screen and the thread list is folded.
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
    if (m.id === undefined) { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ')); return }
    const p = this.#p.get(m.id); if (!p) return; this.#p.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) }) }
  send(method, params = {}) { const id = ++this.#n; return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) }) }
  async ev(x) { const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result?.value }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(200) } return false }
  close() { this.#ws.close() } }

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'rail-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9457', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9457/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-rail="nav"]') !== null`)
  await sleep(3000)

  console.log(JSON.stringify(await s.ev(`(() => {
    const nav = document.querySelector('[data-novel-rail="nav"]')
    const views = document.querySelector('[data-novel-rail-segment="views"]')
    const threads = document.querySelectorAll('[data-novel-thread]').length
    const toggle = document.querySelector('[data-novel-threads-toggle]')
    const navRect = nav.getBoundingClientRect()
    const viewsRect = views.getBoundingClientRect()
    return {
      order: Array.from(document.querySelectorAll('[data-novel-rail-segment]')).map(n => n.getAttribute('data-novel-rail-segment')).slice(0, 3),
      threadsShown: threads,
      toggle: toggle === null ? null : toggle.innerText.trim(),
      viewsTop: Math.round(viewsRect.top),
      navBottom: Math.round(navRect.bottom),
      viewsOnFirstScreen: viewsRect.top >= navRect.top && viewsRect.bottom <= navRect.bottom,
      acceptedRevision: document.querySelector('[data-novel-rail-segment="works"] .grp-head')?.innerText.trim(),
    }
  })()`), null, 2))
  console.log('errors:', s.errs.length)
} finally { try { s?.close() } catch {}; if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) } try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {} }
