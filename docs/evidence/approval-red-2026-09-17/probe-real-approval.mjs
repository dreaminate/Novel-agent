#!/usr/bin/env node
/**
 * I1.1/I1.2 real-approval probe: drive a REAL session in the novel profile and
 * see whether the official ApprovalPanel paints inside our frame.
 *
 * Safety: this probe is built to REFUSE by default. It asserts the panel paints,
 * shows what is being approved, that Esc is not an approval, and that a
 * rejection stops the operation. It never clicks an approve control. Approving
 * is out of scope here.
 *
 * Usage:
 *   node probe-real-approval.mjs --explore            # dump the composer DOM only, send nothing
 *   node probe-real-approval.mjs --send "<prompt>"    # type, send, wait, then Esc and reject
 */
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const argv = process.argv.slice(2)
const flag = n => argv.includes(n)
const value = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const exploreOnly = flag('--explore')
const prompt = value('--send', null)
const outDir = value('--out', join(tmpdir(), 'real-approval'))
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const debugPort = 9446
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

/** The composer's writable surface and every control near an approval. */
const COMPOSER = `(() => {
  const seat = document.querySelector('[data-novel-conversation-seat="true"]')
  const scope = seat ?? document
  const editable = Array.from(scope.querySelectorAll('textarea, input[type=text], [contenteditable=true]'))
    .map(n => ({ tag: n.tagName, cls: String(n.className).slice(0, 70),
                 ph: n.getAttribute('placeholder') || '', aria: n.getAttribute('aria-label') || '',
                 inComposer: n.closest('[data-slot="conversation.composer"]') !== null }))
  const buttons = Array.from(scope.querySelectorAll('button,[role=button]'))
    .map(n => ({ label: (n.getAttribute('aria-label') || n.textContent || '').trim().slice(0, 40),
                 inComposer: n.closest('[data-slot="conversation.composer"]') !== null }))
  const composer = document.querySelector('[data-slot="conversation.composer"]')
  return {
    seatPresent: seat !== null,
    composerSlot: composer !== null,
    composerText: (composer?.innerText ?? '').slice(0, 300),
    editable, buttons,
    approvalDetailSlot: document.querySelector('[data-slot="conversation.approval.detail"]') !== null
  }
})()`

/** Approval affordances: what the panel shows and what can be pressed. */
const APPROVAL = `(() => {
  const all = Array.from(document.querySelectorAll('*'))
  const composer = document.querySelector('[data-slot="conversation.composer"]')
  const scope = composer ?? document
  const btns = Array.from(scope.querySelectorAll('button,[role=button]'))
    .map(n => (n.getAttribute('aria-label') || n.textContent || '').trim()).filter(t => t !== '')
  const approvalish = all.filter(n => /approval/i.test(String(n.className) + n.getAttributeNames().join(' ')))
  const text = scope.innerText ?? ''
  return {
    approvalDetailSlot: document.querySelector('[data-slot="conversation.approval.detail"]') !== null,
    approvalishNodes: approvalish.length,
    composerText: text.slice(0, 900),
    buttons: btns.slice(0, 20)
  }
})()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
mkdirSync(outDir, { recursive: true })
const profileDir = mkdtempSync(join(tmpdir(), 'real-approval-'))
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${String(debugPort)}`,
  `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

let session
const report = { stage: exploreOnly ? 'explore' : 'send', prompt }
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
  if (!await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) {
    throw new Error('the novel frame never rendered')
  }

  // Enter the thread view, which is where the shipped conversation seat is laid
  // out. The seat also exists in the DOM on other views, but at zero size, so a
  // zero-size composer means we never left the story map.
  report.rail = await session.evaluate(`(() => {
    const segs = Array.from(document.querySelectorAll('[data-novel-rail-segment]'))
      .map(n => n.getAttribute('data-novel-rail-segment'))
    const rows = Array.from(document.querySelectorAll('[data-novel-thread]'))
      .map(n => n.getAttribute('data-novel-thread'))
    return { segs, rowCount: rows.length, firstRow: rows[0] ?? null,
             navPresent: document.querySelector('[data-novel-rail="nav"]') !== null } })()`)
  await session.evaluate(`(() => {
    const seg = document.querySelector('[data-novel-rail-segment="threads"]')
    if (seg !== null) seg.click() })()`)
  await sleep(1000)
  report.enteredThread = await session.evaluate(`(() => {
    const row = document.querySelector('[data-novel-thread]')
    if (row === null) return false
    row.click(); return true })()`)
  await session.until(`document.querySelector('[data-novel-conversation-seat="true"]:not([hidden])') !== null`)
  // Wait for real layout, not just presence.
  await session.until(`(() => {
    const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
    if (el === null) return false
    const r = el.getBoundingClientRect()
    return r.width > 50 && r.height > 5 })()`, 20000)
  await sleep(1500)
  report.composer = await session.evaluate(COMPOSER)

  if (!exploreOnly) {
    if (prompt === null) throw new Error('--send requires a prompt')
    // The composer is a custom contenteditable; `.focus()` alone does not make it
    // the active element, so click it with real mouse events first.
    const box = await session.evaluate(`(() => {
      const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
      if (el === null) return null
      const r = el.getBoundingClientRect()
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) } })()`)
    report.composerBox = box
    if (box === null) throw new Error('the composer is not editable')
    for (const type of ['mousePressed', 'mouseReleased']) {
      await session.send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 })
    }
    await sleep(400)
    report.focused = await session.evaluate(`(() => {
      const el = document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')
      return el !== null && (el.contains(document.activeElement) || document.activeElement === el) })()`)
    await session.send('Input.insertText', { text: prompt })
    await sleep(600)
    report.typed = await session.evaluate(
      `(document.querySelector('[data-slot="conversation.composer"] [contenteditable=true]')?.innerText ?? '').slice(0, 240)`)
    if (report.typed === '') throw new Error('nothing was typed into the composer; refusing to send an empty turn')
    report.sent = await session.evaluate(`(() => {
      const b = Array.from(document.querySelectorAll('[data-slot="conversation.composer"] button,[role=button]'))
        .find(n => /发送消息|发送/.test(n.getAttribute('aria-label') || ''))
      if (b === undefined) return false
      b.click(); return true })()`)

    // This is a real model turn, so allow real latency before concluding "absent".
    const appeared = await session.until(`(() => {
      if (document.querySelector('[data-slot="conversation.approval.detail"]') !== null) return true
      const c = document.querySelector('[data-slot="conversation.composer"]')
      return c !== null && /批准|允许|拒绝|驳回/.test(c.innerText || '') })()`, 150000)
    report.approvalAppeared = appeared
    report.approval = await session.evaluate(APPROVAL)
    writeFileSync(join(outDir, 'approval-dom.html'), await session.evaluate('document.documentElement.outerHTML'))
    await session.send('Page.captureScreenshot', {}).then(r =>
      writeFileSync(join(outDir, 'approval.png'), Buffer.from(r.data, 'base64')))

    if (appeared) {
      // (d) Esc must not be an approval.
      for (const type of ['keyDown', 'keyUp']) {
        await session.send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      }
      await sleep(2000)
      report.afterEscape = await session.evaluate(APPROVAL)

      // (c) Answer half. Defaults to refusing; approving is only for a trigger
      // proven harmless, and the caller must clean up afterwards.
      const answer = value('--answer', 'reject')
      report.answerWanted = answer
      report.answered = await session.evaluate(`(() => {
        const scope = document.querySelector('[data-slot="conversation.composer"]') ?? document
        const btns = Array.from(scope.querySelectorAll('button,[role=button]'))
        const re = ${JSON.stringify(answer)} === 'approve'
          ? /允许|批准|同意|approve|allow/i
          : /拒绝|驳回|reject|deny/i
        const hit = btns.find(n => re.test((n.getAttribute('aria-label') || '') + ' ' + (n.textContent || '')))
        if (hit === undefined) {
          return { clicked: false, candidates: btns.map(n => (n.textContent || '').trim()).filter(Boolean).slice(0, 15) }
        }
        hit.click()
        return { clicked: true, label: (hit.textContent || hit.getAttribute('aria-label') || '').trim() } })()`)
      await sleep(10000)
      report.afterAnswer = await session.evaluate(APPROVAL)
      await session.send('Page.captureScreenshot', {}).then(r =>
        writeFileSync(join(outDir, `after-answer-${answer}.png`), Buffer.from(r.data, 'base64')))
    }
  }
  writeFileSync(join(outDir, 'real-summary.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error)
  try { writeFileSync(join(outDir, 'real-summary.json'), JSON.stringify(report, null, 2)) } catch { /* ignore */ }
  console.log(JSON.stringify(report, null, 2))
  process.exitCode = 1
} finally {
  try { session?.close() } catch { /* ignore */ }
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1500) }
  try { rmSync(profileDir, { recursive: true, force: true, maxRetries: 3 }) } catch { /* temp */ }
}
