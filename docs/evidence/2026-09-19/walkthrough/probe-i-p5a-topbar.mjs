#!/usr/bin/env node
/**
 * I-P5a 真机验证探针 — 2026-09-19
 *
 * 验证 topbar 对标 Linear：
 *   - 主题从三个常驻按钮变成**一个**循环控件，按钮文字就是当前模式
 *   - 循环 跟随系统 → 日间 → 夜间 → 跟随系统，并且每次按下 frame 真的换肤
 *   - 顶栏只有一处强调：版本徽标不再是 accent 色
 *   - 单行不换行；状态行是次要色小字号
 *
 * 走查环境：--disable-gpu 足够（顶栏不涉及 WebGL）。
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
  close() { this.#ws.close() }
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-ip5a-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9467', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: 'I-P5a topbar Linear 化真机验证', date: new Date().toISOString() }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9467/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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

  const themeText = `(() => document.querySelector('[data-novel-topbar-theme]')?.innerText.trim() ?? '')()`
  const frameTheme = `document.querySelector('[data-novel-workbench="frame"]')?.getAttribute('data-nw-theme') ?? ''`

  /** Put the topbar's theme control back to 跟随系统 whatever state the last run left it in. */
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '跟随系统') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(200)
  }

  findings.bar = await s.ev(`(() => {
    const right = document.querySelector('.topbar .right')
    const badge = document.querySelector('.topbar .vbadge')
    const ctx = document.querySelector('.topbar .ctx')
    const bar = document.querySelector('.topbar')
    const cs = node => node === null ? null : getComputedStyle(node)
    const buttons = right === null ? [] : Array.from(right.querySelectorAll('button'))
    return {
      controls: buttons.map(b => b.innerText.trim()),
      segmentedGroups: right === null ? 0 : right.querySelectorAll('.seg').length,
      badges: document.querySelectorAll('.topbar .vbadge').length,
      // One loud thing: the revision chip must not wear the accent.
      badgeStyle: badge === null ? null : { color: cs(badge).color, background: cs(badge).backgroundColor, border: cs(badge).borderTopColor },
      rowStyle: bar === null ? null : { display: cs(bar).display, wrap: cs(bar).flexWrap, height: cs(bar).height },
      ctxStyle: ctx === null ? null : { fontSize: cs(ctx).fontSize, color: cs(ctx).color },
      settingsEmphasis: (() => {
        const open = document.querySelector('[data-novel-settings-open="true"]')
        return open === null ? null : { color: cs(open).color, background: cs(open).backgroundColor }
      })(),
    } })()`)

  // The cycle, with the frame's own attribute read at each step — a control that
  // changes its label without repainting the frame is the failure this catches.
  const steps = []
  for (let press = 0; press < 4; press += 1) {
    steps.push({ label: await s.ev(themeText), frame: await s.ev(frameTheme) })
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(300)
  }
  findings.cycle = steps
  findings.cycleReturnsToStart = steps[0].label === steps[3].label && steps[0].frame === steps[3].frame

  // Screenshots: the bar in the author's default theme, and at night.
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '跟随系统') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(200)
  }
  await sleep(300)
  findings.day = { theme: await s.ev(frameTheme), screenshot: await s.shot('i-p5a-topbar-day') }
  // Two presses from 跟随系统 reach 夜间 — the cycle has three states, so one
  // press lands on 日间.
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '夜间') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(250)
  }
  await sleep(300)
  findings.night = { theme: await s.ev(frameTheme), screenshot: await s.shot('i-p5a-topbar-night') }
  // Back to the author's default so the frame is not left repainted.
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '跟随系统') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(200)
  }

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5a-topbar-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
