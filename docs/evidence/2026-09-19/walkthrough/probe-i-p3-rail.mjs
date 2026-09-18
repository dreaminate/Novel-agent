#!/usr/bin/env node
/**
 * I-P3 真机验证探针 — 2026-09-19
 * 验证 rail Things 3 化：分组标题 11px uppercase + 章节缩进 16px + 活动项高亮。
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
const chromeDir = mkdtempSync(join(tmpdir(),'wk-ip3-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--remote-debugging-port=9465','--remote-allow-origins=*',`--user-data-dir=${chromeDir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--accept-lang=zh-CN,zh;q=0.9','--window-size=1440,900','about:blank'],{stdio:'ignore'})

const findings = {}
let s
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9465/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  if (!url) throw new Error('CDP port never came up')
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await s.send('Page.navigate',{url:hostUrl})
  if (!await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) throw new Error('frame never rendered')
  await sleep(2500)

  const state = await s.ev(`(() => {
    const rail = document.querySelector('[data-novel-rail="nav"]');
    const grpHead = rail?.querySelector('.grp-head');
    const grpHeadStyle = grpHead ? getComputedStyle(grpHead) : null;
    const chItem = rail?.querySelector('.ch-item');
    const chItemStyle = chItem ? getComputedStyle(chItem) : null;
    const activeChapter = rail?.querySelector('[data-novel-chapter][aria-current="true"]');
    const activeStyle = activeChapter ? getComputedStyle(activeChapter) : null;
    return {
      railExists: rail !== null,
      grpHeadExists: grpHead !== null,
      grpHeadFontSize: grpHeadStyle?.fontSize ?? null,
      grpHeadTransform: grpHeadStyle?.textTransform ?? null,
      grpHeadLetterSpacing: grpHeadStyle?.letterSpacing ?? null,
      grpHeadText: grpHead?.textContent?.trim().slice(0, 30) ?? null,
      chItemExists: chItem !== null,
      chItemPaddingLeft: chItemStyle?.paddingLeft ?? null,
      activeChapterExists: activeChapter !== null,
      activeBackground: activeStyle?.backgroundColor ?? null,
    };
  })()`)
  findings.state = state
  findings.consoleErrors = s.errs.length
  await s.shot('i-p3-rail')
  findings.screenshot = 'i-p3-rail.png'
} catch (e) {
  findings.error = e.message
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(chromeDir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}

writeFileSync(join(outDir,'i-p3-rail-summary.json'), JSON.stringify({
  purpose: 'I-P3 rail Things 3 化真机验证',
  date: new Date().toISOString(),
  findings,
}, null, 2))
console.log('I-P3 rail probe done')
console.log('grp-head font-size:', findings.state?.grpHeadFontSize, 'transform:', findings.state?.grpHeadTransform)
console.log('ch-item padding-left:', findings.state?.chItemPaddingLeft)
console.log('active bg:', findings.state?.activeBackground)
console.log('errors:', findings.consoleErrors)
