// Focused re-check of the part the first run failed to measure: with 提炼时机
// back on 提交时, a long stretch of writing must trigger nothing.
//
// Costs nothing when it passes — the whole point is that no refinement runs.
//
// Run: node docs/evidence/editor-2026-09-17/probe-refine-off.mjs
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const out = join(root, 'docs/evidence/editor-2026-09-17')
const sleep = ms => new Promise(r => setTimeout(r, ms))
class S { #ws; #n = 0; #p = new Map(); errs = []
  constructor(ws){this.#ws=ws;ws.addEventListener('message',e=>{const m=JSON.parse(e.data)
    if(m.id===undefined){ if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error') this.errs.push(m.params.args.map(a=>a.value??a.description??'').join(' ')); if(m.method==='Runtime.exceptionThrown') this.errs.push('EXC '+ (m.params.exceptionDetails?.exception?.description??'')); return }
    const p=this.#p.get(m.id);if(!p)return;this.#p.delete(m.id);if(m.error)p.reject(new Error(m.error.message));else p.resolve(m.result)})}
  send(method,params={}){const id=++this.#n;return new Promise((res,rej)=>{this.#p.set(id,{resolve:res,reject:rej});this.#ws.send(JSON.stringify({id,method,params}))})}
  async ev(x){const r=await this.send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description);return r.result?.value}
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(500)}return false}
  close(){this.#ws.close()} }
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'refineoff-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9471',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { steps: [], ok: false }
const inbox = async () => await s.ev(`(() => {
  const node = document.querySelector('[data-novel-thread-pending]')
  return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending')) })()`)
const chars = async () => await s.ev(`Number(document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? -1)`)
/** Put the caret in the editor and confirm it landed before typing into it. */
const focusEditor = async () => {
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null
    el.focus(); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 80), y: Math.round(r.y + 24) } })()`)
  if (box === null) return false
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(300)
  return await s.ev(`document.activeElement?.classList.contains('ProseMirror') ?? false`)
}
const prose = (n) => '风从山口下来，吹得院里的竹影一层层压到墙上。他坐在门槛上不动，只把手里的旧信翻过来又翻回去。'.repeat(Math.ceil(n / 46)).slice(0, n)
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9471/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  // The mode is session state and a fresh page starts at the default; set it
  // explicitly anyway, so this checks the control in this direction too.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]'); if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-settings]') !== null`)
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-refine="on-submit"]'); if (b) b.click() })()`)
  await sleep(300)
  const pressed = await s.ev(`document.querySelector('[data-novel-settings-refine="on-submit"]')?.getAttribute('aria-pressed') ?? null`)
  await s.ev(`document.querySelector('[data-novel-settings-close]').click()`)
  await sleep(500)
  result.steps.push({ step: 'mode set back to 提交时', pressed })

  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n) n.click() })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)

  const focused = await focusEditor()
  const before = { inbox: await inbox(), chars: await chars() }
  await s.send('Input.insertText',{text:`${prose(2600)}\n`})
  await sleep(15000)
  const after = {
    inbox: await inbox(),
    chars: await chars(),
    asked: await s.ev(`document.querySelector('[data-novel-editor-refined]') !== null`),
  }
  result.steps.push({ step: 'wrote 2600 more characters with the mode off', focused, before, after })

  // The measurement only means something if the writing actually landed.
  result.ok = focused && after.chars > before.chars && after.asked === false && after.inbox === before.inbox
  result.wrote = after.chars > before.chars
  result.consoleErrors = s.errs
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(out,'refine-off-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
