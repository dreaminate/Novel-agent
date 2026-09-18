#!/usr/bin/env node
/**
 * A1 + A3 复跑探针 — 2026-09-19
 *
 * Phase 2 开工闸门 §3.3 第 3 条要求：走查探针复跑 A1（崩溃隔离）+ A3（新手闭环），
 * 截图证明落地引导卡已落地、WebGL 降级卡生效、其余画布不被污染。
 *
 * 这是 probe-walkthrough.mjs 的最小子集：只跑 step 1（landing）+ step 7（story-map）
 * + step 8（cast）+ console 报错。**不打字、不提交、不动草稿文件**——避免触发
 * I-W5 的草稿残留问题（该问题由 I-W5 单独处理，需 D5 授权）。
 *
 * 沙箱 Chrome 三个必需 flag（handoff §5.3）：--no-sandbox --disable-gpu
 * --remote-allow-origins=*。`--disable-gpu` 让 WebGL 不可用，这正是 I-W1 降级卡
 * 的验收环境。
 *
 * 用法：node docs/evidence/2026-09-19/walkthrough/probe-a1-a3.mjs
 * 产物：docs/evidence/2026-09-19/walkthrough/walkthrough-summary.json + *.png
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
const chromeDir = mkdtempSync(join(tmpdir(),'wk-a1a3-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--remote-debugging-port=9462','--remote-allow-origins=*',`--user-data-dir=${chromeDir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--accept-lang=zh-CN,zh;q=0.9','--window-size=1440,900','about:blank'],{stdio:'ignore'})

const findings = []
const note = (k,v) => findings.push({step:k, ...v})

let s
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9462/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  if (!url) throw new Error('CDP port never came up')
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await s.send('Page.navigate',{url:hostUrl})
  if (!await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) throw new Error('frame never rendered')
  await sleep(2500)

  // ── 1. 落地页：A3 新手闭环——引导卡是否落地 ──
  const landing = await s.ev(`(() => {
    const view = document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view') ?? null;
    const canvas = document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null;
    // A3 关键：NovelLanding 引导卡是否渲染
    const landingCard = document.querySelector('[data-novel-landing]');
    const landingChapters = landingCard ? Array.from(landingCard.querySelectorAll('[data-novel-landing-chapter]')).map(c => ({
      id: c.getAttribute('data-novel-landing-chapter'),
      text: c.textContent?.trim().slice(0,40) ?? ''
    })) : [];
    const landingPlan = landingCard?.querySelector('[data-novel-landing-plan]')?.textContent?.trim() ?? null;
    const mainHead = document.querySelector('.main-head h1')?.textContent ?? null;
    const mainSub = document.querySelector('.main-head .sub')?.textContent ?? null;
    // A2 残留检查：副标题不应含 workdir/Canon
    const subHasWorkdir = mainSub !== null && /workdir/i.test(mainSub);
    const subHasCanon = mainSub !== null && /Canon/i.test(mainSub);
    return { view, canvas, landingCardExists: landingCard !== null, landingChapters, landingPlan, mainHead, mainSub, subHasWorkdir, subHasCanon };
  })()`)
  note('1-landing-a3', landing)
  await s.shot('01-landing-a3')

  // ── 2. 故事地图：A1 崩溃隔离——WebGL 降级卡是否生效 ──
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="map"]'); if (v) v.click() })()`)
  await sleep(2500)
  const mapState = await s.ev(`(() => {
    const head = document.querySelector('.main-head h1')?.textContent ?? null;
    const sub = document.querySelector('.main-head .sub')?.textContent ?? null;
    // A1 关键：降级卡是否渲染（--disable-gpu 下 WebGL 不可用）
    const degraded = document.querySelector('[data-novel-story-map-degraded]');
    const degradedText = degraded?.textContent?.trim().replace(/\\s+/g,' ').slice(0,200) ?? null;
    const degradedCastBtn = degraded?.querySelector('[data-novel-story-map-degraded-cast]')?.textContent?.trim() ?? null;
    const degradedRetryBtn = degraded?.querySelector('[data-novel-story-map-degraded-retry]')?.textContent?.trim() ?? null;
    // 崩溃卡（CanvasBoundary 兜底）是否渲染——降级卡是预防，崩溃卡是兜底
    const crashed = document.querySelector('[data-novel-canvas-crashed]');
    const crashedText = crashed?.textContent?.trim().slice(0,100) ?? null;
    return { head, sub, degradedCardExists: degraded !== null, degradedText, degradedCastBtn, degradedRetryBtn, crashedCardExists: crashed !== null, crashedText };
  })()`)
  note('2-story-map-a1', mapState)
  await s.shot('02-story-map-a1')

  // ── 3. 人物与关系：A1 崩溃隔离——其余画布不被污染 ──
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="cast"]'); if (v) v.click() })()`)
  await sleep(2500)
  const castState = await s.ev(`(() => {
    const head = document.querySelector('.main-head h1')?.textContent ?? null;
    const canvasView = document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null;
    // A1 关键：cast 画布不应被 story-map 的崩溃污染
    const crashed = document.querySelector('[data-novel-canvas-crashed]');
    const castCanvas = document.querySelector('[data-novel-canvas="cast"]');
    const cards = Array.from(document.querySelectorAll('.char-card')).length;
    return { head, canvasView, crashedCardExists: crashed !== null, castCanvasExists: castCanvas !== null, charCardCount: cards };
  })()`)
  note('3-cast-a1', castState)
  await s.shot('03-cast-a1')

  // ── 4. 切回 story-map 验证 CanvasBoundary key={view} 重置 ──
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="map"]'); if (v) v.click() })()`)
  await sleep(1500)
  const mapAgain = await s.ev(`(() => {
    const canvasView = document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null;
    const degraded = document.querySelector('[data-novel-story-map-degraded]');
    const crashed = document.querySelector('[data-novel-canvas-crashed]');
    return { canvasView, degradedCardExists: degraded !== null, crashedCardExists: crashed !== null };
  })()`)
  note('4-map-again', mapAgain)
  await s.shot('04-map-again')

  // ── 5. console 报错 ──
  note('5-console', { errorCount: s.errs.length, errors: s.errs.slice(0,5) })

  writeFileSync(join(outDir,'walkthrough-summary.json'), JSON.stringify({ findings, generatedAt: new Date().toISOString(), purpose: 'A1+A3 复跑验证 (Phase 2 开工闸门 §3.3 第 3 条)' }, null, 2))
  console.log('a1+a3 walkthrough done:', findings.length, 'steps, errors:', s.errs.length)
  console.log('output:', outDir)
} catch (e) {
  console.error('WALKTHROUGH FAILED:', e.message)
  writeFileSync(join(outDir,'walkthrough-error.json'), JSON.stringify({ error: e.message, stack: e.stack, findings }, null, 2))
  process.exit(1)
} finally {
  try { s?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(chromeDir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
