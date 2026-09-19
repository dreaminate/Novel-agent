#!/usr/bin/env node
/**
 * 人物措辞真机验证探针 — 2026-09-19
 *
 * 这一部作品的人物在 Canon 里一个 name 方面都没有，界面于是只能显示实体 id：
 * 卡片标题是 `guchen`，抽屉标题也是 `guchen`。slug 出现在名字的位置上并不中性，
 * 它读起来像工具认为那就是作者对这个人的称呼。
 *
 * 验证的是：人物卡与人物档案都说「未命名人物」，并把 id 留在旁边（所以七个人
 * 仍然是七张分得清的卡），地图上「选中人物」的读数也一样；地图节点标签保持 id，
 * 因为图上标签的职责是把节点彼此区分开。
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
  /** A real pointer press at a selector's centre — the map selects on a real click. */
  async clickAt(selector) {
    const box = await this.ev(`(() => { const n = document.querySelector(${JSON.stringify(selector)})
      if (n === null) return null
      const r = n.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } })()`)
    if (box === null || box.w === 0) return false
    const base = { x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1 }
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: base.x, y: base.y })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' })
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' })
    return true
  }
  close() { this.#ws.close() }
}

const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const chromeDir = mkdtempSync(join(tmpdir(), 'wk-naming-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  // The map needs a real WebGL context to draw its nodes at all; software
  // rasterisation gives it one without a GPU. Without this the map correctly
  // shows its degraded card and there is no node to select.
  '--headless', '--no-sandbox', '--disable-software-rasterizer',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--remote-debugging-port=9470', '--remote-allow-origins=*', `--user-data-dir=${chromeDir}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
  '--accept-lang=zh-CN,zh;q=0.9', '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' })

const findings = { purpose: '人物措辞（未命名人物 + 副显 id）真机验证', date: new Date().toISOString() }
let s
try {
  let url
  for (let i = 0; i < 100; i += 1) {
    try { const t = await (await fetch('http://127.0.0.1:9470/json/list')).json(); const p = t.find(x => x.type === 'page'); if (p?.webSocketDebuggerUrl !== undefined) { url = p.webSocketDebuggerUrl; break } } catch {}
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

  await s.ev(`(() => { const b = document.querySelector('[data-novel-view="cast"]'); if (b) b.click() })()`)
  if (!await s.until(`document.querySelector('[data-novel-cast-people] .card') !== null`, 10000)) throw new Error('cast board never painted')
  await sleep(500)

  findings.cast = await s.ev(`(() => {
    const cards = Array.from(document.querySelectorAll('[data-novel-cast-people] .card'))
    return cards.map(card => ({
      id: card.getAttribute('data-novel-person'),
      unnamed: card.innerText.includes('未命名人物'),
      keepsId: card.innerText.includes(card.getAttribute('data-novel-person') ?? ''),
      head: card.innerText.split('\\n')[0].slice(0, 40),
    })) })()`)
  findings.castAllUnnamedWithId = findings.cast.length > 0
    && findings.cast.every(card => card.unnamed === true && card.keepsId === true)
  findings.castScreenshot = await s.shot('i-p5-naming-cast')

  // Open the first card's 人物档案.
  await s.ev(`(() => {
    const card = document.querySelector('[data-novel-cast-people] .card')
    const b = card === null ? undefined : [...card.querySelectorAll('button')].find(x => x.textContent.includes('看档案'))
    if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-person-file]') !== null`, 6000)
  await sleep(400)
  findings.drawer = await s.ev(`(() => {
    const d = document.querySelector('[data-novel-person-file]')
    if (d === null) return null
    const id = d.getAttribute('data-novel-person-file')
    const text = d.innerText
    return { id, title: text.split('\\n')[0].slice(0, 30), unnamed: text.includes('未命名人物'), keepsId: text.includes(id) } })()`)
  findings.drawerSaysUnnamedAndKeepsId = findings.drawer !== null
    && findings.drawer.unnamed === true && findings.drawer.keepsId === true
  findings.drawerScreenshot = await s.shot('i-p5-naming-drawer')
  await s.ev(`(() => { const b = document.querySelector('[data-novel-person-close]'); if (b) b.click() })()`)
  await sleep(400)

  // …and the map, where the node labels stay ids but the readout does not.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-view="map"]'); if (b) b.click() })()`)
  const mapUp = await s.until(`document.querySelector('[data-novel-story-map-node]') !== null`, 10000)
  await sleep(600)
  findings.map = await s.ev(`(() => {
    const nodes = Array.from(document.querySelectorAll('[data-novel-story-map-node]'))
    return { nodeCount: nodes.length,
      nodeLabelsAreIds: nodes.every(n => n.getAttribute('aria-label') === n.getAttribute('data-novel-story-map-node')) } })()`)
  findings.mapUp = mapUp
  // Select a node: the readout is where a person is named out loud, and it is
  // the one part of the map that took the 未命名人物 wording.
  await s.clickAt('[data-novel-story-map-node]')
  await s.until(`document.querySelector('[data-novel-story-map-selection]') !== null`, 4000)
  await sleep(400)
  findings.mapSelection = await s.ev(`(() => {
    const box = document.querySelector('[data-novel-story-map-selection]')
    if (box === null) return null
    const id = box.getAttribute('data-novel-story-map-selection')
    return { id, text: box.innerText.replace(/\\n+/g, ' ').slice(0, 60),
      unnamed: box.innerText.includes('未命名人物'), keepsId: box.innerText.includes(id) } })()`)
  findings.mapReadoutSaysUnnamedAndKeepsId = findings.mapSelection !== null
    && findings.mapSelection.unnamed === true && findings.mapSelection.keepsId === true
  findings.mapScreenshot = await s.shot('i-p5-naming-map')

  findings.consoleErrors = s.errs.length
  findings.consoleErrorSamples = s.errs.slice(0, 5)
} catch (failure) {
  findings.error = String(failure && failure.stack ? failure.stack : failure)
} finally {
  try { s?.close() } catch {}
  chrome.kill()
}

writeFileSync(join(outDir, 'i-p5-naming-summary.json'), JSON.stringify(findings, null, 2) + '\n')
console.log(JSON.stringify(findings, null, 2))
