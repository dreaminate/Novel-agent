// Read-only: open the app, count the proposal inbox, and read the review canvas.
// No model calls — this only looks at what the refinement turn left behind.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const out = join(root, 'docs/evidence/editor-2026-09-17')
const sleep = ms => new Promise(r => setTimeout(r, ms))
const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'inbox-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9463',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'], { stdio: 'ignore' })
let ws
const report = {}
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9463/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  let id=0; const pend=new Map()
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data); const q=pend.get(m.id); if(q){pend.delete(m.id); q(m.result)}})
  const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method,params}))})
  const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});return r?.result?.value}
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.navigate', { url: hostUrl })
  for (let i=0;i<50 && !(await ev(`document.querySelector('[data-novel-workbench="frame"]') !== null`));i+=1) await sleep(400)
  await sleep(3000)

  // Pick the thread that carries the conversation, so its header reports.
  await ev(`(() => { const seg = document.querySelector('[data-novel-rail-segment="threads"]'); if (seg) seg.click() })()`)
  await sleep(1200)
  const rows = await ev(`Array.from(document.querySelectorAll('[data-novel-thread]')).map(n => n.getAttribute('data-novel-thread'))`)
  for (const row of (rows ?? []).slice(1, 6)) {
    await ev(`(() => { const n = document.querySelector('[data-novel-thread=${JSON.stringify(row)}]'); if (n) n.click() })()`)
    await sleep(1200)
    const emptied = await ev(`document.querySelector('[data-novel-conversation-column]')?.innerText.includes('这个线程还没有对话') ?? null`)
    if (emptied === false) { report.thread = row; break }
  }
  report.revision = await ev(`(() => { const bar = document.querySelector('[data-novel-topbar]') ?? document.body; const m = /R(\\d+)/.exec(bar.innerText ?? ''); return m === null ? null : Number(m[1]) })()`)
  report.threadHeader = await ev(`document.querySelector('[data-novel-thread-header]')?.innerText.replace(/\\n+/g, ' | ') ?? null`)

  // What the refinement turn actually said, in its own words.
  report.lastAssistant = await ev(`(() => {
    const lines = Array.from(document.querySelectorAll('[data-novel-transcript-entry="assistant"]'))
    const last = lines.at(-1)
    return last === undefined ? null : (last.innerText ?? '').replace(/\\n+/g, '\\n').slice(0, 1600) })()`)

  // The inbox opens from its own control in the conversation header, not from a
  // rail entry: 提案审阅 is a view the inbox can reach, not a listed screen.
  report.pendingControl = await ev(`document.querySelector('[data-novel-thread-pending]')?.getAttribute('data-novel-thread-pending') ?? null`)
  await ev(`(() => { const b = document.querySelector('[data-novel-thread-pending]'); if (b) b.click() })()`)
  await sleep(3000)
  report.canvas = await ev(`document.querySelector('[data-novel-canvas]')?.getAttribute('data-novel-canvas') ?? null`)
  report.reviewText = await ev(`(() => { const c = document.querySelector('[data-novel-canvas="review"]'); return c === null ? null : (c.innerText ?? '').trim().replace(/\\n{2,}/g, '\\n').slice(0, 2500) })()`)
  report.proposalRows = await ev(`document.querySelectorAll('[data-novel-proposal]').length`)
  await send('Page.captureScreenshot', {}).then(r => writeFileSync(join(out, 'refine-review.png'), Buffer.from(r.result.data, 'base64'))).catch(() => {})
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.error = String(error?.stack ?? error)
  console.log(JSON.stringify(report, null, 2))
} finally {
  writeFileSync(join(out, 'refine-inbox.json'), `${JSON.stringify(report, null, 2)}\n`)
  try { ws?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
