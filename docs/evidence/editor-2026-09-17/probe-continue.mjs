// Real-machine probe for the paragraph continuation (I4.2).
//
// Drives the shipped web UI in headless Chrome: opens 续写, writes two beats,
// asks for prose, checks that nothing reached the draft while it was only a
// suggestion, then adopts it and checks it became the author's text on disk.
//
// The generation is real and costs two model calls (one completed, one stopped).
//
// Run: node docs/evidence/editor-2026-09-17/probe-continue.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const out = join(root, 'docs/evidence/editor-2026-09-17')
const draftPath = '/private/tmp/nw-workspace/天机阁主/第1章《开篇章》.草稿.md'
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S { #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws){this.#ws=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data)
    if(m.id===undefined){ if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') this.errs.push(m.params.args.map(a=>a.value??a.description??'').join(' ')); if(m.method==='Runtime.exceptionThrown') this.errs.push('EXC '+ (m.params.exceptionDetails?.exception?.description??'')); return }
    const p=this.#p.get(m.id);if(!p)return;this.#p.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)})}
  send(method,params={}){const id=++this.#n;return new Promise((res,rej)=>{this.#p.set(id,{resolve:res,reject:rej});this.#ws.send(JSON.stringify({id,method,params}))})}
  async ev(x){const r=await this.send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result?.value}
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(250)}return false}
  close(){this.#ws.close()} }
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'continue-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9459',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { steps: [], ok: false }
const readDraft = () => { try { return readFileSync(draftPath, 'utf8') } catch { return null } }
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9459/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  // The continuation asks with the thread's own agent, so pick a live thread.
  await s.ev(`(() => { const seg = document.querySelector('[data-novel-rail-segment="threads"]'); if (seg) seg.click() })()`)
  await s.until(`document.querySelector('[data-novel-thread]') !== null`)
  const rows = await s.ev(`Array.from(document.querySelectorAll('[data-novel-thread]')).map(n => n.getAttribute('data-novel-thread'))`)
  let picked = null
  for (const row of (rows ?? []).slice(1, 6)) {
    await s.ev(`(() => { const n = document.querySelector('[data-novel-thread=${JSON.stringify(row)}]'); if (n) n.click() })()`)
    await sleep(1200)
    const emptied = await s.ev(`document.querySelector('[data-novel-conversation-column]')?.innerText.includes('这个线程还没有对话') ?? null`)
    if (emptied === false) { picked = row; break }
  }
  const chapter = await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n === null) return null; n.click(); return n.getAttribute('data-novel-chapter') ?? 'clicked' })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)
  result.steps.push({ step: 'open 写作', picked, chapter })

  // The draft at the start of the run is what "nothing was adopted yet" means.
  const draftBefore = readDraft()

  await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-continue]'); if (b) b.click() })()`)
  await sleep(600)
  result.steps.push({ step: 'open 续写', panel: await s.ev(`document.querySelector('[data-novel-continue]') !== null`) })

  const input = await s.ev(`(() => { const el = document.querySelector('[data-novel-continue-input]'); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 30), y: Math.round(r.y + 16) } })()`)
  if (input === null) throw new Error('the inspiration input never rendered')
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:input.x,y:input.y,button:'left',clickCount:1})
  await sleep(300)
  await s.send('Input.insertText',{text:'先写风声'})
  await s.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r'})
  await s.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13})
  await s.send('Input.insertText',{text:'再写脚步声'})
  await sleep(400)
  const beats = await s.ev(`document.querySelector('[data-novel-continue-input]')?.value ?? null`)
  result.steps.push({ step: 'wrote two beats', beats })

  await s.ev(`(() => { const b = document.querySelector('[data-novel-continue-generate]'); if (b) b.click() })()`)
  await sleep(400)
  result.steps.push({
    step: 'asked for prose',
    state: await s.ev(`document.querySelector('[data-novel-continue-state]')?.getAttribute('data-novel-continue-state') ?? null`),
    stoppable: await s.ev(`document.querySelector('[data-novel-continue-stop]') !== null`),
  })

  // A real generation on this route is slow; give it room.
  const ready = await s.until(`document.querySelector('[data-novel-continue-state]')?.getAttribute('data-novel-continue-state') === 'ready'`, 180000)
  const prose = await s.ev(`document.querySelector('[data-novel-continue-text]')?.textContent ?? null`)
  const draftDuring = readDraft()
  result.steps.push({
    step: 'prose came back',
    ready,
    prose,
    // Nothing is adopted yet, so the prose must not be in the draft file.
    draftUnchangedWhileWaiting: draftDuring === draftBefore,
    draftHasProse: prose === null || draftDuring === null ? null : draftDuring.includes(prose.trim()),
  })
  await s.send('Page.captureScreenshot',{}).then(async r => writeFileSync(join(out,'continue-prose.png'), Buffer.from(r.data,'base64'))).catch(()=>{})

  if (ready && prose !== null && prose.trim() !== '') {
    await s.ev(`(() => { const b = document.querySelector('[data-novel-continue-adopt]'); if (b) b.click() })()`)
    await sleep(2500)
    const doc = await s.ev(`document.querySelector('[data-novel-editor] .ProseMirror')?.innerText ?? null`)
    const draftAfter = readDraft()
    result.steps.push({
      step: 'adopted',
      docHasProse: doc === null ? null : doc.includes(prose.trim().split('\n')[0]),
      draftHasProse: draftAfter === null ? null : draftAfter.includes(prose.trim().split('\n')[0]),
      state: await s.ev(`document.querySelector('[data-novel-continue-state]')?.getAttribute('data-novel-continue-state') ?? null`),
    })
    result.ok = result.steps.at(-1).docHasProse === true && result.steps.at(-1).draftHasProse === true
      && result.steps.find(x => x.step === 'prose came back').draftUnchangedWhileWaiting === true
  }

  result.consoleErrors = s.errs
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(out,'continue-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
