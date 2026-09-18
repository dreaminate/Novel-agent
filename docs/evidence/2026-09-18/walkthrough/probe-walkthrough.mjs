#!/usr/bin/env node
/**
 * 作者走查探针 — 2026-09-18
 *
 * 不是功能验证（smoke-workbench.mjs 已做过），而是以人类作者视角实际走一遍，
 * 截图每一步，记录可观察的体验摩擦点：落地页空荡、编辑器头部密度、人物 id 显示、
 * 运行期上下文噪音、续写面板唤起方式、设置面板内容、夜间/窄窗。
 *
 * 不花模型额度（不跑句级补全/段级续写/提交本章——那些已有 I4.1b/I4.2/I3.3 真机证据）。
 * 只读：只导航、点击、取文本、截图，不写 Canon、不动 profile。
 *
 * 用法：node docs/evidence/2026-09-18/walkthrough/probe-walkthrough.mjs
 * 产物：docs/evidence/2026-09-18/walkthrough/walkthrough-summary.json + *.png
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const outDir = join(root, 'docs/evidence/2026-09-18/walkthrough')
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
const chromeDir = mkdtempSync(join(tmpdir(),'wk-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless','--no-sandbox','--disable-gpu','--disable-software-rasterizer','--remote-debugging-port=9461','--remote-allow-origins=*',`--user-data-dir=${chromeDir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--accept-lang=zh-CN,zh;q=0.9','--window-size=1440,900','about:blank'],{stdio:'ignore'})

const findings = []
const note = (k,v) => findings.push({step:k, ...v})

let s
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9461/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  if (!url) throw new Error('CDP port never came up')
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await s.send('Page.navigate',{url:hostUrl})
  if (!await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) throw new Error('frame never rendered')
  await sleep(2500)

  // ── 1. 落地页：作者打开应用第一眼看到什么 ──
  const landing = await s.ev(`(() => {
    const view = document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view') ?? null;
    const canvas = document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null;
    const editor = document.querySelector('[data-novel-editor]');
    const editorEmpty = editor?.querySelector('.nw-note');
    const welcome = document.querySelector('[data-novel-welcome]');
    const chapterSelected = document.querySelector('[data-novel-chapter][aria-current="true"]');
    const mainHead = document.querySelector('.main-head h1')?.textContent ?? null;
    const mainSub = document.querySelector('.main-head .sub')?.textContent ?? null;
    return { view, canvas, editorExists: editor !== null, editorEmptyText: editorEmpty?.textContent ?? null, welcomeExists: welcome !== null, chapterSelected: chapterSelected !== null, mainHead, mainSub };
  })()`)
  note('1-landing', landing)
  await s.shot('01-landing')

  // ── 2. 选第一章进编辑器：作者要走几步 ──
  const firstChapter = await s.ev(`(() => {
    const n = document.querySelector('[data-novel-chapter]');
    if (n === null) return null;
    const before = document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view');
    n.click();
    return { id: n.getAttribute('data-novel-chapter'), title: n.getAttribute('title'), viewBefore: before };
  })()`)
  await sleep(1500)
  const afterChapter = await s.ev(`(() => {
    const view = document.querySelector('[data-novel-view][aria-current="true"]')?.getAttribute('data-novel-view') ?? null;
    const editorHead = document.querySelector('[data-novel-editor] .novel-editor-bar');
    const barChildren = editorHead ? Array.from(editorHead.children).map(c => c.textContent?.trim().slice(0,30) ?? c.className) : [];
    const status = document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null;
    const count = document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? null;
    return { view, barChildrenCount: barChildren.length, barChildren, status, count };
  })()`)
  note('2-select-chapter', { firstChapter, afterChapter })
  await s.shot('02-editor-after-chapter')

  // ── 3. 编辑器头部 bar 密度：一行挤了多少东西 ──
  const barDensity = await s.ev(`(() => {
    const bar = document.querySelector('.novel-editor-bar');
    if (!bar) return null;
    const items = Array.from(bar.querySelectorAll('span, button')).map(el => ({
      tag: el.tagName.toLowerCase(),
      text: el.textContent?.trim().slice(0,20) ?? '',
      cls: el.className,
      dataAttrs: Array.from(el.attributes).filter(a => a.name.startsWith('data-novel')).map(a => a.name+'='+a.value).join(',')
    }));
    const barRect = bar.getBoundingClientRect();
    return { itemCount: items.length, items, barWidth: Math.round(barRect.width), overflow: bar.scrollWidth > bar.clientWidth };
  })()`)
  note('3-editor-bar-density', barDensity)
  await s.shot('03-editor-bar')

  // ── 4. 实际打字：写作手感（只看状态反馈，不花模型） ──
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 60), y: Math.round(r.y + 20) } })()`)
  if (box) {
    for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
    await sleep(400)
    await s.send('Input.insertText',{text:'夜里风大，吹得窗纸哗哗作响。'})
    await sleep(2000)
    const afterType = await s.ev(`(() => {
      const status = document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null;
      const count = document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? null;
      const text = document.querySelector('[data-novel-editor] .ProseMirror')?.textContent ?? '';
      return { status, count, textLen: text.length, textSample: text.slice(0,40) };
    })()`)
    note('4-typing', afterType)
    await s.shot('04-typing')
  }

  // ── 5. 续写面板：要主动唤起，不是常驻 ──
  const continueBtn = await s.ev(`(() => {
    const b = document.querySelector('[data-novel-editor-continue]');
    if (!b) return null;
    const rect = b.getBoundingClientRect();
    b.click();
    return { exists: true, label: b.textContent?.trim(), position: { x: Math.round(rect.x), y: Math.round(rect.y) } };
  })()`)
  await sleep(800)
  const continuePanel = await s.ev(`(() => {
    const p = document.querySelector('[data-novel-continue]');
    if (!p) return null;
    const head = p.querySelector('.novel-continue-head')?.textContent?.trim() ?? null;
    const placeholder = p.querySelector('[data-novel-continue-input]')?.getAttribute('placeholder') ?? null;
    const actions = Array.from(p.querySelectorAll('button')).map(b => b.textContent?.trim());
    return { exists: true, head, placeholder, actions };
  })()`)
  note('5-continue-panel', { continueBtn, continuePanel })
  await s.shot('05-continue-panel')

  // ── 6. 提交确认卡：文案是否作者能懂 ──
  const submitBtn = await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-submit]'); if (!b) return null; b.click(); return b.textContent?.trim() })()`)
  await sleep(800)
  const confirmCard = await s.ev(`(() => {
    const c = document.querySelector('[data-novel-editor-confirm]');
    if (!c) return null;
    return { text: c.textContent?.trim().replace(/\\s+/g,' ').slice(0,200) };
  })()`)
  note('6-submit-confirm', { submitBtn, confirmCard })
  await s.shot('06-submit-confirm')
  // 关掉确认卡
  await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-confirm-cancel]'); if (b) b.click() })()`)
  await sleep(400)

  // ── 7. 故事地图：人物 id 显示问题 ──
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="map"]'); if (v) v.click() })()`)
  await sleep(2500)
  const mapState = await s.ev(`(() => {
    const head = document.querySelector('.main-head h1')?.textContent ?? null;
    const sub = document.querySelector('.main-head .sub')?.textContent ?? null;
    // sigma 节点标签
    const labels = Array.from(document.querySelectorAll('.n-label')).map(el => el.textContent?.trim()).filter(Boolean);
    // 折叠气泡
    const folded = document.querySelector('[data-novel-story-map-folded]')?.getAttribute('aria-label') ?? document.querySelector('[data-novel-story-map-folded]')?.getAttribute('title') ?? null;
    return { head, sub, nodeLabels: labels, nodeLabelCount: labels.length, foldedChip: folded };
  })()`)
  note('7-story-map', mapState)
  await s.shot('07-story-map')

  // ── 8. 人物与关系：id 与"0 人"问题 ──
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="cast"]'); if (v) v.click() })()`)
  await sleep(2500)
  const castState = await s.ev(`(() => {
    const cards = Array.from(document.querySelectorAll('.char-card')).map(c => ({
      seal: c.querySelector('.seal')?.textContent?.trim() ?? null,
      text: c.textContent?.trim().replace(/\\s+/g,' ').slice(0,80) ?? ''
    }));
    const rels = Array.from(document.querySelectorAll('.rel-line')).map(r => r.querySelector('.pair')?.textContent?.trim() ?? r.textContent?.trim().slice(0,40));
    const zeroChips = Array.from(document.querySelectorAll('*')).filter(el => el.children.length === 0 && /0 人/.test(el.textContent ?? '')).map(el => el.textContent.trim());
    return { cardCount: cards.length, cards: cards.slice(0,3), relCount: rels.length, rels: rels.slice(0,3), zeroChips };
  })()`)
  note('8-cast', castState)
  await s.shot('08-cast')

  // ── 9. 对话列：运行期上下文噪音 ──
  // 先开对话列
  await s.ev(`(() => { const b = document.querySelector('[data-novel-topbar-details]'); if (b) b.click() })()`)
  await sleep(800)
  const transcriptNoise = await s.ev(`(() => {
    const lines = Array.from(document.querySelectorAll('[data-novel-transcript-entry]')).map(el => ({
      kind: el.getAttribute('data-novel-transcript-entry'),
      text: el.textContent?.trim().slice(0,80) ?? ''
    }));
    const noise = lines.filter(l => /Current runtime context|supersedes|snapshot/i.test(l.text));
    return { lineCount: lines.length, lines: lines.slice(0,5), noiseCount: noise.length, noiseSample: noise.slice(0,2) };
  })()`)
  note('9-transcript-noise', transcriptNoise)
  await s.shot('09-transcript')

  // ── 10. 设置面板 ──
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open]'); if (b) b.click() })()`)
  await sleep(1000)
  const settingsState = await s.ev(`(() => {
    const sheet = document.querySelector('[data-novel-settings]');
    if (!sheet) return null;
    const labels = Array.from(sheet.querySelectorAll('.setting-label')).map(el => el.textContent?.trim());
    const notes = Array.from(sheet.querySelectorAll('.setting-note')).map(el => el.textContent?.trim().slice(0,60));
    return { exists: true, settingLabels: labels, settingNotes: notes };
  })()`)
  note('10-settings', settingsState)
  await s.shot('10-settings')
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-close]'); if (b) b.click() })()`)
  await sleep(400)

  // ── 11. 夜间主题 ──
  await s.ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '夜间'); if (b) b.click() })()`)
  await sleep(1500)
  const nightBg = await s.ev(`(() => { const f = document.querySelector('[data-novel-workbench="frame"]'); const rs = getComputedStyle(f); return { bg: rs.backgroundColor, theme: f.getAttribute('data-nw-theme') } })()`)
  note('11-night', nightBg)
  await s.shot('11-night')
  // 切回
  await s.ev(`(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === '跟随系统'); if (b) b.click() })()`)
  await sleep(800)

  // ── 12. 窄窗 1280 ──
  await s.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false})
  await sleep(1500)
  const narrow = await s.ev(`(() => {
    const f = document.querySelector('[data-novel-workbench="frame"]');
    const rail = document.querySelector('.rail');
    const items = Array.from(document.querySelectorAll('.rail .item'));
    const noLabel = items.filter(it => (it.querySelector('.lbl')?.textContent?.trim() ?? '') === '' && !it.getAttribute('title') && !it.getAttribute('aria-label'));
    return { dataNarrow: f?.getAttribute('data-narrow'), railWidth: rail ? Math.round(rail.getBoundingClientRect().width) : null, itemCount: items.length, noLabelCount: noLabel.length };
  })()`)
  note('12-narrow-1280', narrow)
  await s.shot('12-narrow-1280')

  // 还原宽窗
  await s.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
  await sleep(800)

  // ── 13. console 报错 ──
  note('13-console', { errorCount: s.errs.length, errors: s.errs.slice(0,3) })

  writeFileSync(join(outDir,'walkthrough-summary.json'), JSON.stringify({ findings, generatedAt: new Date().toISOString() }, null, 2))
  console.log('walkthrough done:', findings.length, 'steps, errors:', s.errs.length)
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
