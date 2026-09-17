// Real-machine probe for submit-time refinement (I5.2).
//
// Writes a short chapter by hand, submits it, and watches the proposal inbox:
// the chapter arrives as its own proposal, and refinement adds setting deltas
// on top. Canon must not move — that is the whole boundary this path exists to
// keep.
//
// This runs two real agent turns (the submission and the refinement).
//
// Run: node docs/evidence/editor-2026-09-17/probe-refine.mjs
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
  async until(x,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{if(await this.ev(x))return true}catch{}await sleep(400)}return false}
  close(){this.#ws.close()} }
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'refine-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9461',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { steps: [], ok: false }
/** The topbar carries the accepted revision; refinement must not move it. */
const revision = () => s.ev(`(() => {
  const bar = document.querySelector('[data-novel-topbar]') ?? document.body
  const match = /R(\\d+)/.exec(bar.innerText ?? '')
  return match === null ? null : Number(match[1]) })()`)
/** The inbox count, read from its own control rather than parsed out of text. */
const inbox = async () => await s.ev(`(() => {
  const node = document.querySelector('[data-novel-thread-pending]')
  return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending')) })()`)
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9461/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

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
  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n) n.click() })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)

  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 60), y: Math.round(r.y + 20) } })()`)
  if (box === null) throw new Error('the editor surface never rendered')
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(300)
  await s.send('Input.insertText',{text:'夜里风大，吹得窗纸哗哗作响。他站在门口，没有推门。'})
  await sleep(3000)

  const before = { revision: await revision(), inbox: await inbox() }
  result.steps.push({ step: 'wrote a paragraph', picked, draftChars: await s.ev(`document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? null`), before })

  await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-submit]'); if (b) b.click() })()`)
  await sleep(600)
  await s.ev(`(() => { const b = document.querySelector('[data-novel-editor-confirm-submit]'); if (b) b.click() })()`)

  // The chapter proposal first, then whatever refinement adds. Both are agent
  // turns, so this waits rather than sleeps a fixed amount.
  //
  // Note from the first run: this predicate used to parse 待审提案 out of the
  // header's text, and a run against it stalled past every deadline — the count
  // it was reading came from a node that updates late, so it never went green.
  // Read the control's own attribute instead. The first run's turn still
  // happened and is recorded honestly in refine-turn.json and refine-inbox.json;
  // this form is what a re-run should use.
  const moreThan = (baseline) => `(() => {
    const node = document.querySelector('[data-novel-thread-pending]')
    return (node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending'))) > ${String(baseline)} })()`
  const chapterArrived = await s.until(moreThan(before.inbox ?? 0), 300000)
  const afterChapter = { revision: await revision(), inbox: await inbox() }
  result.steps.push({ step: 'chapter proposal arrived', chapterArrived, afterChapter })

  // Refinement asks the organizer for setting deltas; on this route it is slow.
  const refined = await s.until(moreThan(afterChapter.inbox ?? 0), 420000)
  const afterRefine = { revision: await revision(), inbox: await inbox() }
  result.steps.push({ step: 'refinement proposals arrived', refined, afterRefine })
  await s.send('Page.captureScreenshot',{}).then(async r => writeFileSync(join(out,'refine-inbox.png'), Buffer.from(r.data,'base64'))).catch(()=>{})

  // What the inbox actually holds, in its own words. 提案审阅 is reached from the
  // inbox control, not from a rail entry.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-thread-pending]'); if (b) b.click() })()`)
  await sleep(2500)
  const review = await s.ev(`(() => { const c = document.querySelector('[data-novel-canvas="review"]'); return c === null ? null : (c.innerText ?? '').trim().replace(/\\n+/g, ' | ').slice(0, 700) })()`)
  result.steps.push({ step: 'inbox contents', review })
  await s.send('Page.captureScreenshot',{}).then(async r => writeFileSync(join(out,'refine-review.png'), Buffer.from(r.data,'base64'))).catch(()=>{})

  result.ok = chapterArrived && refined
    && before.revision === afterRefine.revision
  result.consoleErrors = s.errs
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(out,'refine-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
