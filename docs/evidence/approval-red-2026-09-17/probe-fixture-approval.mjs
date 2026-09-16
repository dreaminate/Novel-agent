#!/usr/bin/env node
/**
 * I1.1 RED, part 2: with the connection fixture switched on by `?fixture=`, the
 * client receives a real pending `approval/request` waterfall. This probe asks
 * whether the official ApprovalPanel renders it *inside our frame*, and whether
 * it can be answered.
 *
 * Usage: node probe-fixture-approval.mjs [outDir] [--answer approve|reject]
 * Read-only against the Host: it only navigates a throwaway browser profile.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const argv = process.argv.slice(2)
const outDir = argv.find(a => !a.startsWith('--')) ?? join(tmpdir(), 'approval-fixture')
const answerAt = argv.indexOf('--answer')
const answer = answerAt >= 0 ? argv[answerAt + 1] : null
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const debugPort = 9445
const sleep = ms => new Promise(r => setTimeout(r, ms))

class Session {
  #ws; #next = 0; #pending = new Map()
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
  async until(expr, timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      try { if (await this.evaluate(expr)) return true } catch { /* navigating */ }
      await sleep(150)
    }
    return false
  }
  close() { this.#ws.close() }
}

/** Everything the page shows that could be an approval affordance. */
const DUMP = `(() => {
  const all = Array.from(document.querySelectorAll('*'))
  const label = n => (n.getAttribute('aria-label') || n.textContent || '').trim().slice(0, 60)
  const buttons = all.filter(n => n.tagName === 'BUTTON' || n.getAttribute('role') === 'button')
    .map(n => ({ tag: n.tagName, label: label(n), cls: String(n.className).slice(0, 80),
                 inComposer: n.closest('[data-slot="conversation.composer"]') !== null }))
  const text = document.body.innerText
  return {
    hasFrame: document.querySelector('[data-novel-workbench="frame"]') !== null,
    composerSlot: document.querySelector('[data-slot="conversation.composer"]') !== null,
    approvalDetailSlot: document.querySelector('[data-slot="conversation.approval.detail"]') !== null,
    mentionsFixtureApproval: text.includes('常驻审批') || text.includes('危险') || text.includes('dangerous_tool'),
    approvalishNodes: all.filter(n => /approval/i.test(String(n.className) + n.getAttributeNames().join(' '))).length,
    buttons: buttons.slice(0, 25),
    composerText: (document.querySelector('[data-slot="conversation.composer"]')?.innerText ?? '').slice(0, 400),
    bodyTail: text.slice(0, 700)
  }
})()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
// The token URL answers 303 to a bare `/`, which would drop the query, so the
// fixture switch has to be a second navigation once the auth cookie is set.
const fixtureUrl = `${new URL(hostUrl).origin}/?fixture=1`
mkdirSync(outDir, { recursive: true })
const profileDir = mkdtempSync(join(tmpdir(), 'approval-fixture-'))
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
  await session.send('Page.navigate', { url: hostUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await session.send('Page.navigate', { url: fixtureUrl })
  await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  // The fixture emits its pending approval right after `ready`.
  await sleep(3000)

  // Select the fixture session before the first emission is consumed: ui-approval
  // and ui-user-questions both scope to `sid("fx-alpha")`, and an unclaimed
  // waterfall invocation at stream-open time may never be re-delivered.
  await session.until(`document.querySelector('[data-novel-rail="nav"]') !== null`)
  await sleep(1500)
  const selected = await session.evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll('button, [role=button]'))
    const hit = nodes.find(n => /Fixture|历史会话|fx-/.test((n.textContent || '').trim()))
    if (hit === undefined) return null
    hit.click()
    return (hit.textContent || '').trim()
  })()`)
  await sleep(4000)

  const before = await session.evaluate(DUMP)
  writeFileSync(join(outDir, 'fixture-dom-before.html'), await session.evaluate('document.documentElement.outerHTML'))
  await session.send('Page.captureScreenshot', {}).then(r =>
    writeFileSync(join(outDir, 'fixture-before.png'), Buffer.from(r.data, 'base64')))

  const report = { fixtureUrl: new URL(fixtureUrl).pathname + '?fixture=1', selected, before, consoleErrors: session.consoleErrors }

  if (answer !== null) {
    // Esc first: it must NOT be an approval.
    await session.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await session.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await sleep(1200)
    report.afterEscape = await session.evaluate(DUMP)

    const clicked = await session.evaluate(`(() => {
      const want = ${JSON.stringify(answer)}
      const scope = document.querySelector('[data-slot="conversation.composer"]') ?? document
      const btns = Array.from(scope.querySelectorAll('button,[role=button]'))
      const hit = btns.find(b => {
        const t = ((b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '')).trim()
        return want === 'approve'
          ? /批准|允许|同意|approve|allow|once/i.test(t)
          : /拒绝|驳回|reject|deny/i.test(t)
      })
      if (hit === undefined) return { clicked: false, candidates: btns.map(b => (b.textContent||'').trim()).slice(0,15) }
      hit.click()
      return { clicked: true, label: (hit.textContent || hit.getAttribute('aria-label') || '').trim() }
    })()`)
    report.clicked = clicked
    await sleep(2500)
    report.afterAnswer = await session.evaluate(DUMP)
    await session.send('Page.captureScreenshot', {}).then(r =>
      writeFileSync(join(outDir, `fixture-after-${answer}.png`), Buffer.from(r.data, 'base64')))
  }

  writeFileSync(join(outDir, 'fixture-summary.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1500) }
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
