#!/usr/bin/env node
/**
 * I-P5b 真机验证探针 — 2026-09-19
 *
 * 验证设置面板对标 macOS System Settings：
 *   - 9 条设置同在一个分组容器里
 *   - 每一行是「标签在左、控件在右」的同一行，说明文字在标签下方
 *   - 行与行之间有分隔线，第一行没有
 *   - 面板用共享的卡片圆角
 *
 * 几何用真实 bounding box 验证，而不是只读 CSS —— CSS 只能证明写了这条规则，
 * 证明不了它真的排版成那样。
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
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-ip5b-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9468', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: 'I-P5b 设置面板 macOS 化真机验证', date: new Date().toISOString() }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9468/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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

  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]'); if (b) b.click() })()`)
  if (!await s.until(`document.querySelector('[data-novel-settings] .nv-setting-group') !== null`)) {
    throw new Error('the settings pane never rendered')
  }
  await sleep(400)

  findings.pane = await s.ev(`(() => {
    const sheet = document.querySelector('[data-novel-settings]')
    const groups = sheet.querySelectorAll('.nv-setting-group')
    const rows = Array.from(sheet.querySelectorAll('.nv-setting-group .setting'))
    const box = node => { const r = node.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
    const laidOut = rows.map(row => {
      const label = row.querySelector('.setting-label')
      const control = row.querySelector('.seg')
      const note = row.querySelector('.setting-note')
      if (label === null || control === null) return { label: null }
      return {
        label: label.textContent,
        labelBox: box(label),
        controlBox: box(control),
        noteText: note === null ? null : note.textContent,
        // 同一行：控件起点在标签右侧，且两者纵向重叠。
        controlRightOfLabel: box(control).x >= box(label).x + box(label).w - 1,
        sameRow: box(control).y < box(label).y + box(label).h && box(label).y < box(control).y + box(control).h,
        // 说明文字在标签下方，且不与控件重叠。
        noteUnderLabel: note === null ? null : box(note).y >= box(label).y + box(label).h - 1,
      }
    })
    return {
      groupCount: groups.length,
      rowCount: rows.length,
      rowsInsideGroup: groups[0] === undefined ? 0 : groups[0].querySelectorAll('.setting').length,
      paneRadius: getComputedStyle(groups[0]).borderRadius,
      paneBackground: getComputedStyle(groups[0]).backgroundColor,
      // 分隔线只出现在行与行之间。
      rowBorders: rows.map(row => getComputedStyle(row).borderTopWidth),
      rows: laidOut,
    } })()`)

  findings.allRowsAreMacOsRows = findings.pane.rows.every(row =>
    row.label !== null && row.controlRightOfLabel === true && row.sameRow === true && row.noteUnderLabel !== false)
  findings.screenshot = await s.shot('i-p5b-settings-pane')

  // 关掉，别把面板留在截图后的状态里。
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-close]'); if (b) b.click() })()`)
  await sleep(400)
  findings.closed = await s.ev(`document.querySelector('[data-novel-dialog]') === null`)

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5b-settings-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
