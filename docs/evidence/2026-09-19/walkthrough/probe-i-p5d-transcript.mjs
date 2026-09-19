#!/usr/bin/env node
/**
 * I-P5d 真机验证探针 — 2026-09-19
 *
 * 验证 transcript 对标 Linear 的对话线程：说话的人分得清、行距紧凑、作者自己的
 * 发言不再和模型的回答长得一样。
 *
 * 走查环境：连的是**用主 home 的整份副本**起的隔离 Host（副本里没有凭据、
 * 只读来源），所以这里有真实的多轮对话可看，而作者自己的会话一个字节都没被碰。
 *
 * 用法：node docs/evidence/2026-09-19/walkthrough/probe-i-p5d-transcript.mjs [--port 4782] [--home /tmp/nw-copy-run]
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

const arg = name => { const at = process.argv.indexOf(name); return at < 0 ? undefined : process.argv[at + 1] }
const port = arg('--port') ?? '4781'
const home = arg('--home') ?? join(root, '.novel-agent')

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

const hostUrl = readFileSync(join(home, 'run/host.url'), 'utf8').trim()
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-ip5d-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
  '--remote-debugging-port=9472', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: 'I-P5d transcript Linear 化真机验证', date: new Date().toISOString(), port }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9472/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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
  await sleep(3000)

  // The rail's thread list only materialises once its segment is selected.
  await s.ev(`(() => { const seg = document.querySelector('[data-novel-rail-segment="threads"]'); if (seg) seg.click() })()`)
  await s.until(`document.querySelector('[data-novel-thread]') !== null`, 8000)
  await sleep(500)
  const rows = await s.ev(`Array.from(document.querySelectorAll('[data-novel-thread]')).map(n => n.getAttribute('data-novel-thread'))`)
  findings.threads = rows.length

  // Walk to the thread with the most prose: a one-line thread says nothing about
  // how a long conversation reads.
  let best = null
  for (const row of rows.slice(0, 6)) {
    await s.ev(`(() => { const n = document.querySelector('[data-novel-thread=${JSON.stringify(row)}]'); if (n) n.click() })()`)
    await sleep(1200)
    const count = await s.ev(`(() => { const seat = document.querySelector('[data-novel-transcript-seat]'); return seat === null ? 0 : seat.querySelectorAll('[data-novel-transcript-entry]').length })()`)
    if (best === null || count > best.count) best = { row, count }
  }
  findings.opened = best
  if (best !== null) {
    await s.ev(`(() => { const n = document.querySelector('[data-novel-thread=${JSON.stringify(best.row)}]'); if (n) n.click() })()`)
    await sleep(2000)
  }

  findings.transcript = await s.ev(`(() => {
    const seat = document.querySelector('[data-novel-transcript-seat]')
    if (seat === null) return null
    const list = seat.querySelector('.novel-transcript')
    const lines = [...seat.querySelectorAll('.novel-transcript-line')]
    const box = node => { const r = node.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
    const gapOf = node => { const cs = getComputedStyle(node); return cs.marginBottom }
    const user = lines.find(l => l.classList.contains('is-user'))
    const assistant = lines.find(l => l.classList.contains('is-assistant'))
    const tool = lines.find(l => l.classList.contains('is-tool'))
    const styleOf = node => {
      if (node === undefined) return null
      const cs = getComputedStyle(node)
      const text = node.querySelector('.novel-transcript-text, .novel-transcript-tool')
      const ts = text === null ? cs : getComputedStyle(text)
      return { className: node.className, fontSize: ts.fontSize, lineHeight: ts.lineHeight,
        color: ts.color, fontFamily: ts.fontFamily.split(',')[0], box: box(node), marginBottom: gapOf(node) }
    }
    return {
      listPresent: list !== null,
      listGap: list === null ? null : getComputedStyle(list).rowGap || getComputedStyle(list).gap,
      listMaxWidth: list === null ? null : getComputedStyle(list).maxWidth,
      lines: lines.length,
      users: lines.filter(l => l.classList.contains('is-user')).length,
      assistants: lines.filter(l => l.classList.contains('is-assistant')).length,
      tools: lines.filter(l => l.classList.contains('is-tool')).length,
      user: styleOf(user),
      assistant: styleOf(assistant),
      tool: styleOf(tool),
      // 说话的人分得清吗：作者与模型的行是否有不同的视觉处理。
      userDistinctFromAssistant: user !== undefined && assistant !== undefined
        ? getComputedStyle(user).borderLeftWidth !== getComputedStyle(assistant).borderLeftWidth
          || getComputedStyle(user).backgroundColor !== getComputedStyle(assistant).backgroundColor
        : null,
      speakersLabelled: seat.querySelectorAll('[data-novel-transcript-speaker]').length,
      seatScrolls: getComputedStyle(seat).overflowY,
    } })()`)
  findings.screenshot = await s.shot('i-p5d-transcript')

  // The money shot: the author's own line, with the tool run that follows it.
  // A screenshot of the top of a long thread shows prose, which is not what
  // changed here.
  const scrolled = await s.ev(`(() => {
    const line = document.querySelector('.novel-transcript-line.is-user')
    if (line === null) return false
    // Its own top, not its centre: the 你 against the rule is at the top of the
    // line, and centring a tall message scrolls the mark off the screen.
    line.scrollIntoView({ block: 'start' })
    return true })()`)
  await sleep(600)
  findings.authorLineVisible = scrolled
  findings.authorShot = await s.shot('i-p5d-transcript-author')
  // The tool block right after it, which is the other half of the increment.
  const tools = await s.ev(`(() => {
    const block = document.querySelector('.novel-transcript-tools')
    if (block === null) return null
    block.scrollIntoView({ block: 'center' })
    const cs = getComputedStyle(block)
    return { gap: cs.rowGap || cs.gap, bordered: cs.borderLeftWidth, lines: block.children.length } })()`)
  await sleep(600)
  findings.toolBlock = tools
  findings.toolShot = tools === null ? null : await s.shot('i-p5d-transcript-tools')

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5d-transcript-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
