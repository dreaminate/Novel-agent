#!/usr/bin/env node
/**
 * I1.1 RED probe: does the official approval renderer exist in the novel frame?
 * Reads the running Host, drives headless Chrome over CDP, and reports
 *   - which client modules the browser actually fetched (network),
 *   - whether the approval module executed,
 *   - the conversation surface / composer DOM the frame renders,
 *   - a DOM dump for the record.
 * Read-only: navigates, reads, screenshots. Writes nothing to the Host.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Repository root, derived from this file so the probe is not machine-bound. */
const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = process.argv[2] ?? join(tmpdir(), 'approval-red')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const debugPort = 9444
const sleep = ms => new Promise(r => setTimeout(r, ms))

class Session {
  #ws; #next = 0; #pending = new Map()
  requests = []
  consoleErrors = []
  constructor(ws) {
    this.#ws = ws
    ws.addEventListener('message', event => {
      const m = JSON.parse(event.data)
      if (m.id !== undefined) {
        const p = this.#pending.get(m.id)
        if (p === undefined) return
        this.#pending.delete(m.id)
        if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`))
        else p.resolve(m.result)
        return
      }
      if (m.method === 'Network.responseReceived') {
        const { url, status } = m.params.response
        if (!url.startsWith('data:')) this.requests.push({ url, status })
      }
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        this.consoleErrors.push(m.params.args.map(a => a.value ?? a.description ?? a.type).join(' '))
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.#next
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, method })
      this.#ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails !== undefined) throw new Error(`page threw: ${r.exceptionDetails.exception?.description}`)
    return r.result?.value
  }
  async until(expr, timeoutMs = 30000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      try { if (await this.evaluate(expr)) return true } catch { /* navigating */ }
      await sleep(150)
    }
    return false
  }
  close() { this.#ws.close() }
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
mkdirSync(outDir, { recursive: true })
const profileDir = mkdtempSync(join(tmpdir(), 'approval-red-'))
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${String(debugPort)}`,
  `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

let session
try {
  let socketUrl
  for (let i = 0; i < 100; i += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${String(debugPort)}/json/list`)).json()
      const page = targets.find(t => t.type === 'page')
      if (page?.webSocketDebuggerUrl !== undefined) { socketUrl = page.webSocketDebuggerUrl; break }
    } catch { /* starting */ }
    await sleep(200)
  }
  const ws = new WebSocket(socketUrl)
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', () => rej(new Error('CDP socket failed')), { once: true })
  })
  session = new Session(ws)
  await session.send('Page.enable')
  await session.send('Runtime.enable')
  await session.send('Network.enable')
  await session.send('Page.navigate', { url: hostUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  const probe = await session.evaluate(`(() => {
    const q = s => document.querySelector(s) !== null
    const all = Array.from(document.querySelectorAll('*'))
    const withAttr = prefix => all
      .flatMap(n => Array.from(n.attributes ?? []))
      .map(a => a.name + '=' + a.value)
      .filter(v => v.startsWith(prefix))
    return {
      frame: q('[data-novel-workbench="frame"]'),
      conversationSeat: all.filter(n => Array.from(n.attributes ?? []).some(a => /conversation/i.test(a.value))).length,
      mainRegionCount: document.querySelectorAll('main,[role=main]').length,
      composerNodes: document.querySelectorAll('[class*=composer],[data-composer]').length,
      approvalNodes: all.filter(n => /approval/i.test(n.className + ' ' + (n.getAttributeNames?.() ?? []).join(' '))).length,
      slotsAttrs: withAttr('data-slot').slice(0, 60),
      bodyTextSample: document.body.innerText.slice(0, 400)
    }
  })()`)
  writeFileSync(join(outDir, 'dom.html'), await session.evaluate('document.documentElement.outerHTML'))
  await session.send('Page.captureScreenshot', {}).then(r =>
    writeFileSync(join(outDir, 'frame.png'), Buffer.from(r.data, 'base64')))

  const fetched = session.requests.filter(r => /client\.js/.test(r.url))
  const approvalReqs = fetched.filter(r => /ui-approval/.test(r.url))
  const summary = {
    host: new URL(hostUrl).origin,
    clientModulesFetched: fetched.length,
    approvalModuleFetched: approvalReqs,
    probe,
    consoleErrors: session.consoleErrors,
  }
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1500) }
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
