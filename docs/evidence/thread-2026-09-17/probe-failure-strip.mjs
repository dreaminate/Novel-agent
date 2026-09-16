#!/usr/bin/env node
/**
 * I2.2 check: does the failed-turn strip render in the real app, under the
 * transcript, and does it keep the resend affordance?
 *
 * Driving a real model failure would need a broken model, and the credential
 * seam is not ours to abuse. The connection fixture can fail the prompt RPC on
 * demand instead (`?fixture=&fixturePrompt=reject`), which is the same snapshot
 * error path the strip reads — `promptError` — with no model and no credentials.
 *
 * Usage: node probe-failure-strip.mjs [outDir]
 * Read-only against the Host: it drives a throwaway browser profile.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = process.argv[2] ?? join(tmpdir(), 'failure-strip')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const debugPort = 9447
const sleep = ms => new Promise(r => setTimeout(r, ms))

class Session {
  #ws; #next = 0; #pending = new Map()
  consoleErrors = []
  constructor(ws) {
    this.#ws = ws
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data)
      if (m.id !== undefined) {
        const p = this.#pending.get(m.id)
        if (p === undefined) return
        this.#pending.delete(m.id)
        if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`))
        else p.resolve(m.result)
        return
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
      await sleep(200)
    }
    return false
  }
  close() { this.#ws.close() }
}

/** The strip, and the transcript it must sit under. */
const STRIP = `(() => {
  const strip = document.querySelector('[data-novel-thread-notice]')
  const seat = document.querySelector('[data-novel-transcript-seat]')
  const retry = strip === null ? null : strip.querySelector('[data-novel-thread-retry]')
  const header = document.querySelector('[data-novel-thread-header]')
  return {
    strip: strip !== null,
    stripText: strip === null ? '' : (strip.innerText ?? '').replace(/\\n+/g, ' ').trim().slice(0, 200),
    retry: retry !== null,
    // The failure must not be duplicated back into the header.
    headerSaysFailed: header !== null && (header.innerText ?? '').includes('上次生成失败'),
    transcriptLines: seat === null ? -1 : seat.querySelectorAll('[data-novel-transcript-entry]').length
  }
})()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const fixtureUrl = `${new URL(hostUrl).origin}/?fixture=1&fixturePrompt=reject`
mkdirSync(outDir, { recursive: true })
const profileDir = mkdtempSync(join(tmpdir(), 'failure-strip-'))
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${String(debugPort)}`,
  `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

let session
const report = { fixtureUrl: new URL(fixtureUrl).pathname + '?fixture=1&fixturePrompt=reject' }
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
  await session.send('Page.navigate', { url: hostUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await session.send('Page.navigate', { url: fixtureUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)

  await session.evaluate(`(() => {
    const segment = document.querySelector('[data-novel-rail-segment="threads"]')
    if (segment !== null) segment.click() })()`)
  await session.until(`document.querySelector('[data-novel-thread]') !== null`)
  await session.evaluate(`(() => {
    const row = document.querySelector('[data-novel-thread]')
    if (row !== null) row.click() })()`)
  await session.until(`document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]') !== null`)
  await session.until(`(() => {
    const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
    if (el === null) return false
    const r = el.getBoundingClientRect()
    return r.width > 50 && r.height > 5 })()`, 20000)
  await sleep(1500)
  report.before = await session.evaluate(STRIP)

  const box = await session.evaluate(`(() => {
    const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
    if (el === null) return null
    const r = el.getBoundingClientRect()
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
  if (box === null) throw new Error('the composer never laid out')
  for (const type of ['mousePressed', 'mouseReleased']) {
    await session.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 })
  }
  await sleep(400)
  await session.send('Input.insertText', { text: '写一句开场。' })
  await sleep(400)
  report.typed = await session.evaluate(
    `(document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')?.innerText ?? '').slice(0, 80)`)
  report.sent = await session.evaluate(`(() => {
    const b = Array.from(document.querySelectorAll('[data-slot="conversation.composer"] button,[role=button]'))
      .find(n => /发送消息|发送/.test(n.getAttribute('aria-label') || ''))
    if (b === undefined) return false
    b.click(); return true })()`)

  report.stripAppeared = await session.until(`document.querySelector('[data-novel-thread-notice]') !== null`, 20000)
  report.after = await session.evaluate(STRIP)
  await session.send('Page.captureScreenshot', {}).then(r =>
    writeFileSync(join(outDir, 'failure-strip.png'), Buffer.from(r.data, 'base64')))
  report.consoleErrors = session.consoleErrors

  writeFileSync(join(outDir, 'failure-strip-summary.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error)
  try { writeFileSync(join(outDir, 'failure-strip-summary.json'), JSON.stringify(report, null, 2)) } catch { /* ignore */ }
  console.log(JSON.stringify(report, null, 2))
  process.exitCode = 1
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1500) }
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
