import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../..', import.meta.url))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const hostUrl = readFileSync(join(root,'.novel-agent/run/host.url'),'utf8').trim()
const dir = mkdtempSync(join(tmpdir(),'con-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9452',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let ws
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9452/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener("open",res,{once:true});ws.addEventListener("error",()=>rej(new Error("ws")),{once:true})})
  const pending = new Map(); let n = 0; const logs = []
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data)
    if (m.id !== undefined) { const p = pending.get(m.id); if (p) { pending.delete(m.id); if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result) } return }
    if (m.method === 'Runtime.consoleAPICalled' && /error|warning/.test(m.params.type)) logs.push(m.params.args.map(a=>a.value ?? a.description ?? a.type).join(' '))
    if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text ?? '?'))
  })
  const send = (method, params={}) => { const id = ++n; return new Promise((res,rej)=>{pending.set(id,{resolve:res,reject:rej});ws.send(JSON.stringify({id,method,params}))}) }
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.navigate',{url:hostUrl})
  await sleep(6000)
  const ok = await send('Runtime.evaluate',{expression:`document.querySelector('[data-novel-workbench="frame"]') !== null`,returnByValue:true})
  console.log('frame rendered:', ok.result.value)
  console.log('--- logs (' + logs.length + ') ---')
  for (const l of logs.slice(0,6)) console.log(l.split('\n')[0].slice(0,320))
} finally { try{ws?.close()}catch{}; if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}; try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{} }
