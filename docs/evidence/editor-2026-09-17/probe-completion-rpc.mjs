// Does the client actually ask? Zero model cost: watches the RPC transport while
// the author pauses in 写作, and reports whether a `completeSentence` call leaves
// the browser at all. Separates "the client never asked" from "the model answered
// nothing", which the silent-by-design seam cannot tell apart from the outside.
//
// Run: node docs/evidence/editor-2026-09-17/probe-completion-rpc.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S { #ws; #n = 0; #p = new Map(); frames = []; reqs = []; sent = new Map(); marks = new Map()
  constructor(ws){this.#ws=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data)
    if(m.method==='Network.webSocketFrameSent') this.frames.push(m.params?.response?.payloadData ?? '')
    if(m.method==='Network.requestWillBeSent'){ this.reqs.push(`${m.params.request.method} ${m.params.request.url}`); this.sent.set(m.params.request.url, m.params.requestId); this.marks.set(`req:${m.params.requestId}`, m.params.timestamp) }
    if(m.method==='Network.loadingFinished' || m.method==='Network.loadingFailed'){
      const k = `req:${m.params.requestId}`
      if (this.marks.has(k)) this.marks.set(`dur:${m.params.requestId}`, m.params.timestamp - this.marks.get(k))
      if (m.method === 'Network.loadingFailed') this.marks.set(`failed:${m.params.requestId}`, m.params.errorText)
    }
    if(m.id===undefined) return
    const p=this.#p.get(m.id);if(!p)return;this.#p.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)})}
  send(method,params={}){const id=++this.#n;return new Promise((res,rej)=>{this.#p.set(id,{resolve:res,reject:rej});this.#ws.send(JSON.stringify({id,method,params}))})}
  async ev(x){const r=await this.send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result?.value}
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(200)}return false}
  close(){this.#ws.close()} }
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'completion-rpc-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9457',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { ok: false }
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9457/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws)
  await s.send('Page.enable'); await s.send('Runtime.enable'); await s.send('Network.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  const chapter = await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n === null) return null; n.click(); return n.getAttribute('data-novel-chapter') ?? 'clicked' })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 60), y: Math.round(r.y + 20) } })()`)
  if (box === null) throw new Error('the editor surface never rendered')
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(300)

  // Everything before this point is page load; watch only the pause that follows.
  s.frames.length = 0
  s.reqs.length = 0
  await s.send('Input.insertText',{text:'夜里风大，'})
  await sleep(12000)

  const asked = s.frames.filter(f => f.includes('completeSentence'))
  const askedOverHttp = s.reqs.filter(r => r.includes('completeSentence'))
  // What the host actually answered: `{ok:true, value:''}` means the seam decided
  // to stay silent; `{ok:false, ...}` would mean the Remote itself failed.
  let answer = null
  const requestId = s.sent.get('http://127.0.0.1:4780/api/novelProject/completeSentence')
  if (requestId !== undefined) {
    try {
      const body = await s.send('Network.getResponseBody', { requestId })
      answer = (body.body ?? '').slice(0, 600)
    } catch (error) {
      answer = `unreadable: ${String(error)}`
    }
  }
  result.steps = {
    chapter,
    framesSent: s.frames.length,
    httpRequests: s.reqs.length,
    framesMentioningCompleteSentence: asked.length,
    httpMentioningCompleteSentence: askedOverHttp.length,
    frameSample: asked[0]?.slice(0, 400) ?? null,
    httpSample: s.reqs.slice(-6),
    answer,
    // Milliseconds the host took. A no-model-route return is immediate; a real
    // call that failed or answered nothing takes the provider's round trip.
    roundTripMs: requestId === undefined ? null : Math.round((s.marks.get(`dur:${requestId}`) ?? 0) * 1000),
    loadingFailed: requestId === undefined ? null : (s.marks.get(`failed:${requestId}`) ?? null),
  }
  result.ok = asked.length + askedOverHttp.length > 0
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(root,'docs/evidence/editor-2026-09-17/completion-rpc-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
