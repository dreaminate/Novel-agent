// Read-only: find the thread that carries the refinement turn and print what the
// agent said it filed. The durable log is the honest record of the turn.
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const out = join(root, 'docs/evidence/editor-2026-09-17')
const sleep = ms => new Promise(r => setTimeout(r, ms))
const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const dir = mkdtempSync(join(tmpdir(), 'findrefine-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9467',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'], { stdio: 'ignore' })
let ws
const report = { threads: [] }
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9467/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  let id=0; const pend=new Map()
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); const q = pend.get(m.id); if (q) { pend.delete(m.id); q(m.result) } })
  const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method,params}))})
  const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});return r?.result?.value}
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.navigate', { url: hostUrl })
  for (let i=0;i<60 && !(await ev(`document.querySelector('[data-novel-workbench="frame"]') !== null`));i+=1) await sleep(400)
  await sleep(3000)
  await ev(`(() => { const seg = document.querySelector('[data-novel-rail-segment="threads"]'); if (seg) seg.click() })()`)
  await sleep(1500)
  const rows = await ev(`Array.from(document.querySelectorAll('[data-novel-thread]')).map(n => n.getAttribute('data-novel-thread'))`)
  for (const row of (rows ?? []).slice(0, 10)) {
    await ev(`(() => { const n = document.querySelector('[data-novel-thread=${JSON.stringify(row)}]'); if (n) n.click() })()`)
    await sleep(1500)
    const last = await ev(`(() => {
      const all = Array.from(document.querySelectorAll('[data-novel-transcript-entry="assistant"]'))
      const node = all.at(-1)
      return node === undefined ? null : (node.innerText ?? '') })()`)
    if (typeof last === 'string' && (last.includes('提案') || last.includes('提煉') || last.includes('提炼'))) {
      report.threads.push({ row, last })
    }
  }
  report.found = report.threads.length
  console.log(JSON.stringify(report, null, 2))
} catch (error) {
  report.error = String(error?.stack ?? error)
  console.log(JSON.stringify(report, null, 2))
} finally {
  writeFileSync(join(out, 'refine-turn.json'), `${JSON.stringify(report, null, 2)}\n`)
  try { ws?.close() } catch {}
  if (chrome.exitCode === null) { chrome.kill('SIGTERM'); await sleep(1200) }
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 3 }) } catch {}
}
