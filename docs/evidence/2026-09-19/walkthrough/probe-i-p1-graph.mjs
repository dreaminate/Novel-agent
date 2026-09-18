#!/usr/bin/env node
/**
 * I-P1 真机验证探针 — 2026-09-19
 *
 * 验证 forceatlas2 回归 + Obsidian 视觉化的实际渲染。
 *
 * handoff §5.3: 图谱 Obsidian 化验证需要不带 --disable-gpu 跑一次真机 WebGL。
 * 本探针先尝试不带 --disable-gpu（真机 WebGL），如果 WebGL 不可用则带 --disable-gpu
 * + swiftshader 跑（验证降级卡 + forceatlas2 布局逻辑）。
 *
 * 用法：node docs/evidence/2026-09-19/walkthrough/probe-i-p1-graph.mjs
 * 产物：docs/evidence/2026-09-19/walkthrough/i-p1-graph-*.png + summary.json
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/2026-09-19/walkthrough')
mkdirSync(outDir, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))

class S {
  #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws){this.#ws=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data)
    if(m.id===undefined){ if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') this.errs.push(m.params.args.map(a=>a.value??a.description??'').join(' ')); if(m.method==='Runtime.exceptionThrown') this.errs.push('EXC '+(m.params.exceptionDetails?.exception?.description??'')); return }
    const p=this.#p.get(m.id);if(!p)return;this.#p.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)})}
  send(method,params={}){const id=++this.#n;return new Promise((res,rej)=>{this.#p.set(id,{resolve:res,reject:rej});this.#ws.send(JSON.stringify({id,method,params}))})}
  async ev(x){const r=await this.send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result?.value}
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(200)}return false}
  async shot(name){const r=await this.send('Page.captureScreenshot',{format:'png'});writeFileSync(join(outDir,name+'.png'),Buffer.from(r.data,'base64'));return name}
  close(){this.#ws.close()}
}

const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()

async function runProbe(useGpu, label) {
  const chromeDir = mkdtempSync(join(tmpdir(),`wk-ip1-${label}-`))
  const flags = ['--headless','--no-sandbox','--remote-debugging-port=9463','--remote-allow-origins=*',
    `--user-data-dir=${chromeDir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars',
    '--accept-lang=zh-CN,zh;q=0.9','--window-size=1440,900','about:blank']
  if (!useGpu) {
    flags.splice(2, 0, '--disable-gpu', '--disable-software-rasterizer', '--use-angle=swiftshader', '--enable-unsafe-swiftshader')
  }
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', flags, {stdio:'ignore'})
  const findings = {}
  let s
  try {
    let url
    for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9463/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
    if (!url) throw new Error('CDP port never came up')
    const ws = new WebSocket(url)
    await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
    s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
    await s.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
    await s.send('Page.navigate',{url:hostUrl})
    if (!await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) throw new Error('frame never rendered')
    await sleep(2500)

    // Go to story map
    await s.ev(`(() => { const v = document.querySelector('[data-novel-view="map"]'); if (v) v.click() })()`)
    await sleep(3000)

    const state = await s.ev(`(() => {
      const head = document.querySelector('.main-head h1')?.textContent ?? null;
      const sub = document.querySelector('.main-head .sub')?.textContent ?? null;
      const mapEl = document.querySelector('[data-novel-story-map]');
      const degraded = document.querySelector('[data-novel-story-map-degraded]');
      const canvas = document.querySelector('[data-novel-story-map-canvas]');
      const overlay = document.querySelector('[data-novel-story-map-overlay]');
      const people = mapEl?.getAttribute('data-novel-story-map-people') ?? null;
      const meta = document.querySelector('.nw-map-meta')?.textContent ?? null;
      const swatches = Array.from(document.querySelectorAll('.nw-map-swatch')).length;
      // Check if sigma actually rendered (canvas has content)
      const canvasRect = canvas?.getBoundingClientRect();
      const hasCanvas = canvas !== null;
      return { head, sub, mapExists: mapEl !== null, degradedExists: degraded !== null, hasCanvas, people, meta, swatches, canvasW: canvasRect?.width ?? 0 };
    })()`)

    findings.state = state
    findings.consoleErrors = s.errs.length
    findings.consoleErrorSamples = s.errs.slice(0, 3)
    await s.shot(`i-p1-graph-${label}`)
    findings.screenshot = `i-p1-graph-${label}.png`
  } catch (e) {
    findings.error = e.message
  } finally {
    try { s?.close() } catch {}
    if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
    try { rmSync(chromeDir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  }
  return findings
}

const results = {}
// Try without --disable-gpu first (real WebGL)
results.withGpu = await runProbe(true, 'with-gpu')
// Then with --disable-gpu (degraded card verification)
results.withoutGpu = await runProbe(false, 'no-gpu')

writeFileSync(join(outDir,'i-p1-graph-summary.json'), JSON.stringify({
  purpose: 'I-P1 forceatlas2 回归 + Obsidian 视觉化真机验证',
  date: new Date().toISOString(),
  results,
}, null, 2))

console.log('I-P1 graph probe done')
console.log('with-gpu:', results.withGpu.state?.head ?? results.withGpu.error)
console.log('no-gpu:', results.withoutGpu.state?.head ?? results.withoutGpu.error)
console.log('output:', outDir)
