#!/usr/bin/env node
/**
 * I6.4a real-machine check: the frame is usable from the keyboard alone.
 *
 * Tab order through the shell, a visible focus ring on what it lands on, and the
 * two modal surfaces taking focus, holding Tab inside themselves and handing
 * focus back. All of it is driven through real key events, because focus
 * navigation is the browser's, not ours.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/editor-2026-09-17')
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S {
  #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws) { this.#ws = ws; ws.addEventListener('message', e => { const m = JSON.parse(e.data)
    if (m.id === undefined) { if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ')); return }
    const p = this.#p.get(m.id); if (!p) return; this.#p.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) }) }
  send(method, params = {}) { const id = ++this.#n; return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) }) }
  async ev(x) { const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description); return r.result?.value }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(200) } return false }
  async key(key, code, vk, shift = false) {
    for (const type of ['rawKeyDown', 'keyUp']) {
      await this.send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, modifiers: shift ? 8 : 0 })
    }
    await sleep(60)
  }
  /** Enter needs the text Chrome would deliver, or a button never activates. */
  async enter() {
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r',
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13,
    })
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13,
    })
    await sleep(150)
  }
  close() { this.#ws.close() } }

/** A short, stable description of what has focus, plus the ring it is drawing. */
const ACTIVE = `(() => {
  const el = document.activeElement
  if (el === null || el === document.body) return { where: 'body', ring: null }
  const style = getComputedStyle(el)
  const attrs = ['data-novel-view', 'data-novel-chapter', 'data-novel-thread', 'data-novel-settings-open',
    'data-novel-topbar-details', 'data-novel-settings-close']
    .map(name => el.getAttribute(name) === null ? '' : name.replace('data-novel-', '') + '=' + el.getAttribute(name))
    .filter(Boolean).join(' ')
  return {
    where: [el.tagName.toLowerCase(), attrs || (el.className || '').toString().split(' ')[0],
      (el.textContent ?? '').trim().slice(0, 10)].filter(Boolean).join('|'),
    ring: style.outlineStyle === 'none' || style.outlineWidth === '0px'
      ? null : style.outlineWidth + ' ' + style.outlineColor,
    inDialog: el.closest('[data-novel-settings], [data-novel-person-file]') !== null,
    inFrame: el.closest('[data-novel-workbench="frame"]') !== null,
  } })()`

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'keyboard-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9465', `--user-data-dir=${dir}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' })
const summary = {}
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) { try { const t = await (await fetch('http://127.0.0.1:9465/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {} await sleep(200) }
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate', { url: hostUrl })
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(3000)

  // ① the order Tab walks the shell in, and the ring it draws. Chrome's
  // sequential-navigation starting point is wherever focus last was, so the walk
  // is anchored on the topbar's first control instead of being read from
  // mid-cycle and mistaken for an order that starts in the conversation.
  const anchored = await s.ev(`(() => { const b = document.querySelector('[data-novel-topbar] button')
    if (b === null) return false; b.focus(); return document.activeElement === b })()`)
  summary.anchoredOnTopbar = anchored
  const order = []
  for (let i = 0; i < 40; i += 1) {
    await s.key('Tab', 'Tab', 9)
    order.push(await s.ev(ACTIVE))
  }
  summary.tabOrder = order
  summary.ringOnEveryStop = order.every(stop => stop.ring !== null)
  summary.stops = order.map(stop => stop.where)
  summary.bodyStops = order.filter(stop => stop.where === 'body').length
  summary.stopsInsideFrame = order.filter(stop => stop.inFrame).length

  // ② the settings sheet: takes focus, holds Tab, gives focus back
  const openSheet = async () => {
    for (let i = 0; i < 20; i += 1) {
      const tried = await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]')
        if (b === null) return { found: false }
        b.focus()
        return { found: true, focused: document.activeElement === b,
          active: (document.activeElement?.textContent ?? '').trim().slice(0, 8) } })()`)
      if (tried.found !== true) { await sleep(300); continue }
      if (tried.focused !== true) {
        summary.openSheetTrouble = tried
        await sleep(300)
        continue
      }
      await s.enter()
      if (await s.until(`document.querySelector('[data-novel-settings]') !== null`, 3000)) return true
      await sleep(300)
    }
    return false
  }
  if (!await openSheet()) {
    summary.sheetOpenedAt = { where: 'settings button missing' }
  } else {
    await sleep(400)
    summary.sheetOpenedAt = await s.ev(ACTIVE)

    const inside = []
    for (let i = 0; i < 14; i += 1) {
      await s.key('Tab', 'Tab', 9)
      inside.push(await s.ev(ACTIVE))
    }
    summary.sheetTabStaysInside = inside.every(stop => stop.inDialog)

    await s.ev(`document.querySelector('[data-novel-settings-close]').focus()`)
    await s.enter()
    await s.until(`document.querySelector('[data-novel-settings]') === null`)
    await sleep(400)
    summary.focusAfterClose = await s.ev(ACTIVE)
  }
  summary.consoleErrors = s.errs
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
writeFileSync(join(outDir, 'keyboard-summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(summary, null, 2))
