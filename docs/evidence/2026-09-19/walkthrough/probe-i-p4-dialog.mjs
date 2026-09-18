#!/usr/bin/env node
/**
 * I-P4 真机验证探针 — 2026-09-19
 *
 * 验证对话框与浮层走同一个 primitive（@radix-ui/react-dialog / react-popover）：
 *   - 设置 sheet 与 人物档案 drawer 都是 [data-novel-dialog]，形状不同、外观同源
 *   - 模态打开时背后的页面被 aria-hidden（旧实现只有 aria-modal 一句话，没有兑现）
 *   - Escape 关闭、点遮罩关闭（旧实现手写的两处行为，现在由 primitive 提供）
 *   - 编辑器溢出菜单是锚定浮层，点别处会关（<details> 从不关）
 *
 * 走查环境：--disable-gpu 足以验证对话框（不涉及 WebGL）。
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/2026-09-19/walkthrough')
mkdirSync(outDir, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))

class S {
  #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws) {
    this.#ws = ws
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data)
      if (m.id === undefined) {
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') this.errs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '))
        if (m.method === 'Runtime.exceptionThrown') this.errs.push('EXC ' + (m.params.exceptionDetails?.exception?.description ?? ''))
        return
      }
      const p = this.#p.get(m.id); if (!p) return
      this.#p.delete(m.id)
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result)
    })
  }
  send(method, params = {}) {
    const id = ++this.#n
    return new Promise((res, rej) => { this.#p.set(id, { resolve: res, reject: rej }); this.#ws.send(JSON.stringify({ id, method, params })) })
  }
  async ev(x) {
    const r = await this.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description)
    return r.result?.value
  }
  async until(x, ms = 20000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await this.ev(x)) return true } catch {} await sleep(150) } return false }
  async shot(name) { const r = await this.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(outDir, name + '.png'), Buffer.from(r.data, 'base64')); return name }
  /** A real pointer press at the element's centre: the primitive dismisses on pointerdown. */
  async clickAt(selector) {
    const box = await this.ev(`(() => { const n = document.querySelector(${JSON.stringify(selector)})
      if (n === null) return null
      const r = n.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } })()`)
    if (box === null || box.w === 0) return false
    const base = { x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: base.x, y: base.y })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' })
    return true
  }
  /** A real pointer press at a viewport point — for the scrim, whose centre is the panel. */
  async clickPoint(x, y) {
    const base = { x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: base.x, y: base.y })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' })
  }
  async pressEscape() {
    const key = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', ...key })
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key })
  }
  close() { this.#ws.close() }
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-ip4-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9466', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: 'I-P4 对话框 primitive 真机验证', date: new Date().toISOString() }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9466/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
    await sleep(200)
  }
  if (!url) throw new Error('CDP port never came up')
  const ws = new WebSocket(url)
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', () => rej(new Error('ws')), { once: true }) })
  s = new S(ws)
  await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await s.send('Page.navigate', { url: hostUrl })
  if (!await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) throw new Error('frame never rendered')
  await sleep(2500)

  /** Everything the sheet and the drawer are supposed to agree on. */
  const panel = shape => `(() => {
    const d = document.querySelector('[data-novel-dialog=' + JSON.stringify(${JSON.stringify(shape)}) + ']')
    if (d === null) return null
    const cs = getComputedStyle(d)
    const labelled = document.getElementById(d.getAttribute('aria-labelledby') ?? '')
    return {
      shape: d.getAttribute('data-novel-dialog'),
      role: d.getAttribute('role'),
      state: d.getAttribute('data-state'),
      title: labelled === null ? null : labelled.textContent,
      className: d.className,
      radius: cs.borderRadius,
      shadow: cs.boxShadow === 'none' ? 'none' : 'set',
      hasClose: d.querySelector('[data-novel-dialog-close]') !== null,
      overlay: document.querySelector('[data-novel-dialog-overlay]') !== null,
    } })()`

  // ── 1. 设置 sheet ─────────────────────────────────────────────────────────
  const opened = await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]')
    if (b === null) return false; b.click(); return true })()`)
  await s.until(`document.querySelector('[data-novel-dialog="sheet"]') !== null`)
  await sleep(300)
  findings.settings = {
    opened,
    panel: await s.ev(panel('sheet')),
    // The promise `aria-modal` used to make without keeping: the page behind is
    // out of the accessibility tree for as long as the panel is up.
    backgroundHidden: await s.ev(`(() => {
      const rail = document.querySelector('[data-novel-shell="left"], .rail')
      const main = document.querySelector('[data-novel-canvas-seat]')
      const hidden = node => node === null ? null : (node.closest('[aria-hidden="true"]') !== null)
      return { rail: hidden(rail), canvas: hidden(main) } })()`),
    screenshot: await s.shot('i-p4-settings-sheet'),
  }

  // ── 2. Escape 关闭 ────────────────────────────────────────────────────────
  await s.pressEscape()
  findings.settings.escapeCloses = await s.until(`document.querySelector('[data-novel-dialog]') === null`, 4000)
  findings.settings.backgroundRestored = await s.ev(`(() => {
    const rail = document.querySelector('.rail')
    return rail === null ? null : rail.closest('[aria-hidden="true"]') === null })()`)

  // ── 3. 点遮罩关闭 ─────────────────────────────────────────────────────────
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]'); if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-dialog-overlay]') !== null`)
  await sleep(250)
  // The scrim's own centre is under the panel — hammer the page beside it, which
  // is exactly the gesture "click the dimmed page around it" describes.
  await s.clickPoint(40, 860)
  findings.settings.scrimCloses = await s.until(`document.querySelector('[data-novel-dialog]') === null`, 4000)
  // Never let a failure here strand the sheet over the steps that follow.
  if (findings.settings.scrimCloses !== true) { await s.pressEscape(); await s.until(`document.querySelector('[data-novel-dialog]') === null`, 4000) }

  // The rail's chapter row is what opens a chapter — 写作 is the landing card
  // until one is chosen, and the canvas views read the chapter's outline.
  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]'); if (n) n.click() })()`)
  await sleep(1200)

  // ── 4. 人物档案 drawer ────────────────────────────────────────────────────
  await s.ev(`(() => { const b = document.querySelector('[data-novel-view="cast"]'); if (b) b.click() })()`)
  const castUp = await s.until(`document.querySelector('[data-novel-cast-people]') !== null`, 8000)
  await sleep(500)
  const openedFile = await s.ev(`(() => {
    const card = document.querySelector('[data-novel-cast-people] .card')
    if (card === null) return false
    const b = [...card.querySelectorAll('button')].find(x => x.textContent.includes('看档案'))
    if (b === undefined) return false
    b.click(); return true })()`)
  await s.until(`document.querySelector('[data-novel-dialog="drawer"]') !== null`)
  await sleep(300)
  findings.drawer = {
    castUp,
    openedFile,
    panel: await s.ev(panel('drawer')),
    backgroundHidden: await s.ev(`(() => {
      const main = document.querySelector('.main')
      return main === null ? null : main.closest('[aria-hidden="true"]') !== null })()`),
    screenshot: await s.shot('i-p4-person-drawer'),
  }
  await s.pressEscape()
  findings.drawer.escapeCloses = await s.until(`document.querySelector('[data-novel-dialog]') === null`, 4000)

  // ── 5. 编辑器溢出菜单 ─────────────────────────────────────────────────────
  await s.ev(`(() => { const b = document.querySelector('[data-novel-view="editor"]'); if (b) b.click() })()`)
  const editorUp = await s.until(`document.querySelector('[data-novel-editor-overflow-trigger]') !== null`, 12000)
  await sleep(600)
  await s.clickAt('[data-novel-editor-overflow-trigger]')
  const menuOpened = await s.until(`(() => {
    const m = document.querySelector('[data-novel-editor-overflow]')
    return m !== null && m.getAttribute('data-state') === 'open' })()`, 4000)
  await sleep(300)
  findings.menu = {
    editorUp,
    menuOpened,
    triggerAria: await s.ev(`(() => { const t = document.querySelector('[data-novel-editor-overflow-trigger]')
      return t === null ? null : { haspopup: t.getAttribute('aria-haspopup'), expanded: t.getAttribute('aria-expanded') } })()`),
    screenshot: menuOpened ? await s.shot('i-p4-editor-menu') : null,
  }
  // The complaint about the old <details>: clicking the page never closed it.
  // Aim at the writing surface, below and left of the menu.
  await s.clickPoint(620, 620)
  findings.menu.outsideClickCloses = await s.until(`(() => {
    const m = document.querySelector('[data-novel-editor-overflow]')
    return m !== null && m.getAttribute('data-state') === 'closed' })()`, 4000)

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p4-dialog-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
