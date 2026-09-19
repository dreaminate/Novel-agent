#!/usr/bin/env node
/**
 * 草稿卫生验证探针 — 2026-09-19
 *
 * 历次真机探针把「测测试试夜里风大…」打进了作者的第 1 章草稿文件，作者每次打开这一章
 * 都会先看到一串测试残留。清理后要证明两件事：这一章以空白打开，且残留不再出现在
 * 编辑器里。
 *
 * 走查环境：--disable-gpu 足够（编辑器不涉及 WebGL）。
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
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-hygiene-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9469', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: '草稿残留清理后的真机验证', date: new Date().toISOString() }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9469/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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

  // Open the chapter the residue lived in, then go to the writing surface.
  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]'); if (n) n.click() })()`)
  await s.until(`document.querySelector('[data-novel-editor]') !== null`, 10000)
  await sleep(1200)

  findings.editor = await s.ev(`(() => {
    const root = document.querySelector('[data-novel-editor]')
    const count = root?.querySelector('[data-novel-editor-count]')
    const surface = root?.querySelector('.novel-editor-surface .ProseMirror')
    const text = surface?.innerText ?? ''
    return {
      chapter: root?.querySelector('.novel-editor-chapter')?.textContent ?? null,
      chars: count?.getAttribute('data-novel-editor-count') ?? null,
      surfaceText: text.trim().slice(0, 120),
      hasResidue: /测测试试/.test(text),
      checkpoints: ['测测试试', '夜里风大'].filter(needle => text.includes(needle)),
    } })()`)
  findings.openedBlank = findings.editor !== null && findings.editor.chars === '0'
    && findings.editor.surfaceText === '' && findings.editor.hasResidue === false
  findings.screenshot = await s.shot('i-p5-draft-blank')

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5-draft-hygiene-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
