// Real-machine probe for the sentence continuation (I4.1b).
//
// Drives the shipped web UI in headless Chrome: types a sentence into 写作,
// waits for the grey decoration to appear, checks that a decoration is NOT
// document text, then presses Tab and checks the text became the author's.
//
// The model call this triggers is real and costs one small request.
//
// Run: node docs/evidence/editor-2026-09-17/probe-completion.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S { #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws){this.#ws=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data)
    if(m.id===undefined){ if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') this.errs.push(m.params.args.map(a=>a.value??a.description??'').join(' ')); if(m.method==='Runtime.exceptionThrown') this.errs.push('EXC '+ (m.params.exceptionDetails?.exception?.description??'')); return }
    const p=this.#p.get(m.id);if(!p)return;this.#p.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)})}
  send(method,params={}){const id=++this.#n;return new Promise((res,rej)=>{this.#p.set(id,{resolve:res,reject:rej});this.#ws.send(JSON.stringify({id,method,params}))})}
  async ev(x){const r=await this.send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result?.value}
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(200)}return false}
  close(){this.#ws.close()} }
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'completion-'))
const out = join(root,'docs/evidence/editor-2026-09-17')
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9455',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { steps: [], ok: false }
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9455/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  // A fresh page load lands on an empty thread. Pick one that already carries a
  // conversation: the continuation asks with the thread's own agent, and a thread
  // that has never sent a message has no live agent behind it to ask with.
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
  result.steps.push({ step: 'picked a thread with a conversation', rows: rows?.length ?? 0, picked })
  await sleep(800)

  const chapter = await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n === null) return null; n.click(); return n.getAttribute('data-novel-chapter') ?? 'clicked' })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)
  result.steps.push({ step: 'open 写作', chapter })

  // The draft file does not exist, so the editor opens blank and this sentence
  // is the whole tail.
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 60), y: Math.round(r.y + 20) } })()`)
  if (box === null) throw new Error('the editor surface never rendered')
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(300)
  const blank = await s.ev(`document.querySelector('[data-novel-editor] .ProseMirror')?.innerText ?? null`)
  result.steps.push({ step: 'opened blank', blank })
  await s.send('Input.insertText',{text:'夜里风大，'})
  await sleep(1200)

  const typed = await s.ev(`(() => ({ doc: document.querySelector('[data-novel-editor] .ProseMirror')?.innerText ?? '', status: document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null }))()`)
  result.steps.push({ step: 'typed', ...typed, ok: typed.doc.includes('夜里风大') })

  // The model call is real and its answer is not guaranteed: a route that fails
  // or returns nothing produces silence by design. So give the pause a few
  // chances — re-arming it with a real edit — and record which attempt answered.
  // A path that is broken never answers; a flaky model eventually does.
  const attempts = []
  let appeared = false
  let ghost = null
  for (let attempt = 1; attempt <= 4 && !appeared; attempt += 1) {
    appeared = await s.until(`document.querySelector('[data-novel-ghost]') !== null`, 40000)
    // `innerText` of `.ProseMirror` includes the widget, because a widget IS a DOM
    // node — so it cannot answer "is this the author's text?". Strip the ghost from
    // a clone first, and compare against what is left.
    ghost = appeared
      ? await s.ev(`(() => {
          const g = document.querySelector('[data-novel-ghost]');
          if (g === null) return null;
          const host = document.querySelector('[data-novel-editor] .ProseMirror');
          const clone = host === null ? null : host.cloneNode(true);
          clone?.querySelectorAll('[data-novel-ghost]').forEach(n => n.remove());
          return {
            text: g.textContent,
            ariaHidden: g.getAttribute('aria-hidden'),
            documentTextWithoutGhost: clone === null ? null : clone.innerText,
          };
        })()`)
      : null
    attempts.push({ attempt, appeared, ghost })
    if (appeared) break
    // Re-arm the pause with a real transaction, then take it back: the tail the
    // next request sees is the same sentence.
    await s.send('Input.insertText', { text: ' ' })
    await sleep(150)
    for (const type of ['keyDown','keyUp']) await s.send('Input.dispatchKeyEvent',{type,key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8,nativeVirtualKeyCode:8})
    await sleep(150)
  }
  const isDocumentText = ghost === null || ghost.documentTextWithoutGhost === null
    ? null
    : ghost.documentTextWithoutGhost.includes(ghost.text)
  result.steps.push({ step: 'grey text after the pause', appeared, attempts, ghost, isDocumentText })
  await s.send('Page.captureScreenshot',{}).then(async r => writeFileSync(join(out,'completion-ghost.png'), Buffer.from(r.data,'base64'))).catch(()=>{})

  if (appeared && ghost !== null) {
    // Tab accepts.
    for (const type of ['keyDown','keyUp']) await s.send('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9})
    await sleep(1500)
    const after = await s.ev(`(() => ({ ghost: document.querySelector('[data-novel-ghost]') !== null, doc: document.querySelector('[data-novel-editor] .ProseMirror')?.innerText ?? '', status: document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null }))()`)
    result.steps.push({ step: 'after Tab', ...after, inserted: after.doc.includes(ghost.text.trim()) })
    result.ok = after.ghost === false && after.doc.includes(ghost.text.trim()) && isDocumentText === false
  }

  result.consoleErrors = s.errs
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(out,'completion-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
