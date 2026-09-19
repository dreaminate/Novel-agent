#!/usr/bin/env node
/**
 * I-P5c / I-P5e / I-P5f / I-P5g + I-P6 真机验证探针 — 2026-09-19
 *
 * 一次跑完：
 *   - landing（Heptabase）：入口是网格里的卡片，规划入口也是同一张卡片
 *   - cast（Notion）：每张卡的事实是键值对齐的属性行
 *   - memory（Obsidian 反向链接）：一行一条、按新到旧、来源与版本是 chip
 *   - advanced（VSCode settings.json）：原始投影在等宽代码面上，按边界折行
 *   - I-P6：亮色与暗色的整页截图
 *
 * 走查环境：--disable-gpu（这几个面都不涉及 WebGL）。
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
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-rest-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9471', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: 'I-P5c/e/f/g + I-P6 真机验证', date: new Date().toISOString() }
let s
const goTo = async view => {
  await s.ev(`(() => { const b = document.querySelector('[data-novel-view="${view}"]'); if (b) b.click() })()`)
  await sleep(900)
}

try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9471/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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

  // ── I-P5c landing ────────────────────────────────────────────────────────
  await goTo('editor')
  findings.landing = await s.ev(`(() => {
    const landing = document.querySelector('[data-novel-landing]')
    if (landing === null) return { present: false }
    const grid = landing.querySelector('.nw-landing-cards')
    const cells = grid === null ? [] : [...grid.children]
    const gs = grid === null ? null : getComputedStyle(grid)
    return {
      present: true,
      gridDisplay: gs === null ? null : gs.display,
      columns: gs === null ? null : gs.gridTemplateColumns,
      cells: cells.length,
      cards: landing.querySelectorAll('.nw-landing-card').length,
      planIsACard: landing.querySelector('[data-novel-landing-plan]')?.className.includes('nw-landing-card') ?? null,
      text: landing.innerText.replace(/\\n+/g, ' ').slice(0, 90),
    } })()`)
  findings.landingScreenshot = await s.shot('i-p5c-landing')

  // ── I-P5e cast ───────────────────────────────────────────────────────────
  await goTo('cast')
  await s.until(`document.querySelector('[data-novel-cast-people] .card') !== null`, 8000)
  await sleep(400)
  findings.cast = await s.ev(`(() => {
    const card = document.querySelector('[data-novel-cast-people] .card')
    if (card === null) return { present: false }
    const rows = [...card.querySelectorAll('.nw-cast-field')]
    const keyBoxes = rows.map(r => { const k = r.querySelector('.nw-cast-key'); const v = r.querySelector('.nw-cast-value')
      return k === null || v === null ? null : { key: k.innerText, value: v.innerText.slice(0, 20),
        keyLeft: Math.round(k.getBoundingClientRect().left), valueLeft: Math.round(v.getBoundingClientRect().left) } })
    // 键在同一列：所有 value 的左边缘彼此对齐，且都排在 key 右边。
    const valueEdges = [...new Set(keyBoxes.filter(Boolean).map(b => b.valueLeft))]
    return { present: true, rows: keyBoxes,
      valuesShareOneColumn: valueEdges.length === 1,
      valuesRightOfKeys: keyBoxes.filter(Boolean).every(b => b.valueLeft > b.keyLeft) } })()`)
  findings.castScreenshot = await s.shot('i-p5e-cast')

  // ── I-P5f memory ─────────────────────────────────────────────────────────
  await goTo('memory')
  await sleep(600)
  findings.memory = await s.ev(`(() => {
    const list = document.querySelector('.nw-memory-list')
    const rows = [...document.querySelectorAll('[data-novel-memory-row]')]
    const rev = rows.map(r => { const chip = [...r.querySelectorAll('.chip')].map(c => c.innerText).find(t => /^R\\d+/.test(t))
      return chip === undefined ? null : Number(chip.replace(/[^0-9]/g, '')) })
    return {
      listPresent: list !== null,
      rows: rows.length,
      revisions: rev,
      newestFirst: rev.every((n, i) => i === 0 || (rev[i - 1] ?? 0) >= (n ?? 0)),
      bandGone: document.querySelector('.mem-band') === null,
      firstRowChips: rows[0] === undefined ? [] : [...rows[0].querySelectorAll('.chip')].map(c => c.innerText),
    } })()`)
  findings.memoryScreenshot = await s.shot('i-p5f-memory')

  // ── I-P5g advanced ───────────────────────────────────────────────────────
  await s.ev(`(() => { const b = document.querySelector('[data-novel-advanced-toggle="true"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click() })()`)
  await s.until(`document.querySelector('[data-novel-advanced-item]') !== null`, 8000)
  await s.ev(`(() => { const b = document.querySelector('[data-novel-advanced-item]'); if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-advanced]') !== null`, 8000)
  await sleep(500)
  await s.ev(`(() => { const d = document.querySelector('[data-novel-advanced-canon]'); if (d) d.open = true })()`)
  await sleep(300)
  findings.advanced = await s.ev(`(() => {
    const block = document.querySelector('[data-novel-advanced-canon] .nw-mono')
    if (block === null) return { present: false }
    const cs = getComputedStyle(block)
    const mono = getComputedStyle(document.querySelector('[data-novel-advanced] .nw-mono') ?? block)
    return {
      present: true,
      isCodeSurface: block.className.includes('nw-code'),
      background: cs.backgroundColor,
      radius: cs.borderRadius,
      maxHeight: cs.maxHeight,
      overflow: cs.overflowY,
      wordBreak: cs.wordBreak,
      fontFamily: mono.fontFamily,
      sample: block.innerText.slice(0, 60),
    } })()`)
  findings.advancedScreenshot = await s.shot('i-p5g-advanced')

  // ── I-P6: day and night, whole page ──────────────────────────────────────
  // 进阶 off first: the whole-page shot is meant to be the frame as an author
  // meets it, not with the diagnostic rail still expanded by this probe.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-advanced-toggle="true"]'); if (b && b.getAttribute('aria-pressed') === 'true') b.click() })()`)
  await goTo('editor')
  findings.dayScreenshot = await s.shot('i-p6-whole-day')
  const themeText = `(() => document.querySelector('[data-novel-topbar-theme]')?.innerText.trim() ?? '')()`
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '夜间') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(250)
  }
  await sleep(500)
  findings.nightFrame = await s.ev(`document.querySelector('[data-novel-workbench="frame"]')?.getAttribute('data-nw-theme') ?? null`)
  findings.nightScreenshot = await s.shot('i-p6-whole-night')
  for (let i = 0; i < 4; i += 1) {
    if (await s.ev(themeText) === '跟随系统') break
    await s.ev(`(() => document.querySelector('[data-novel-topbar-theme]')?.click())()`)
    await sleep(250)
  }

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5-rest-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
