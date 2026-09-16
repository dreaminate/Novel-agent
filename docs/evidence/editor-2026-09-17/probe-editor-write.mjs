import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
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
const dir = mkdtempSync(join(tmpdir(),'ed-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9453',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9453/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)
  // Pick a chapter, then land on 写作 (the tree's own click switches to 正文阅读).
  const chapter = await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n === null) return null; n.click(); return n.getAttribute('data-novel-chapter') ?? 'clicked' })()`)
  await sleep(1500)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)
  const seen = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor]'); return { chapter: ${JSON.stringify(chapter)}, editor: el !== null, status: document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null, count: document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? null } })()`)
  console.log('after opening 写作:', JSON.stringify(seen))
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 60), y: Math.round(r.y + 20) } })()`)
  if (box === null) throw new Error('the editor surface never rendered')
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(400)
  await s.send('Input.insertText',{text:'风起于青萍之末。'})
  await sleep(3000)
  console.log('after typing:', JSON.stringify(await s.ev(`(() => ({ status: document.querySelector('[data-novel-editor-status]')?.getAttribute('data-novel-editor-status') ?? null, count: document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? null }))()`)))
  console.log('errors:', s.errs.length, s.errs.slice(0,3))
} finally { try{s?.close()}catch{}; if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}; try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{} }
