// Real-machine probe for 边写边提炼 (I5.3).
//
// Turns the mode on in the settings sheet, writes past the throttle, and checks
// that refinement fires once — not per keystroke — then turns the mode back off
// and checks that it stops. The point is the *rate*: an inbox that grows with
// the writing, not with the edits.
//
// This runs one real agent turn (the single refinement the threshold earns).
//
// Run: node docs/evidence/editor-2026-09-17/probe-while-writing.mjs
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
const dir = mkdtempSync(join(tmpdir(),'whilew-'))
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9469',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--hide-scrollbars','--use-angle=swiftshader','--enable-unsafe-swiftshader','--window-size=1440,900','about:blank'],{stdio:'ignore'})
let s
const result = { steps: [], ok: false }
const inbox = async () => await s.ev(`(() => {
  const node = document.querySelector('[data-novel-thread-pending]')
  return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending')) })()`)
/**
 * The inbox control does NOT re-render while the page stays open — the first run
 * polled it for 420s and concluded nothing had been filed, when a fresh load
 * showed the count had gone up. The transcript does update live, so a refinement
 * turn is observed there instead, and the inbox is read at the end from a fresh
 * load (`probe-inbox.mjs`) rather than from this one.
 */
const toolLines = async () => await s.ev(`document.querySelectorAll('[data-novel-transcript-entry="tool"]').length`)
/** Put the caret in the editor and confirm it landed before typing into it. */
const focusEditor = async () => {
  const box = await s.ev(`(() => { const el = document.querySelector('[data-novel-editor] .ProseMirror'); if (el === null) return null
    el.focus(); const r = el.getBoundingClientRect(); return { x: Math.round(r.x + 80), y: Math.round(r.y + 24) } })()`)
  if (box === null) return false
  for (const type of ['mousePressed','mouseReleased']) await s.send('Input.dispatchMouseEvent',{type,x:box.x,y:box.y,button:'left',clickCount:1})
  await sleep(300)
  return await s.ev(`document.activeElement?.classList.contains('ProseMirror') ?? false`)
}
const chars = async () => await s.ev(`Number(document.querySelector('[data-novel-editor-count]')?.getAttribute('data-novel-editor-count') ?? -1)`)
const asked = async () => await s.ev(`document.querySelector('[data-novel-editor-refined]') !== null`)
/** One paragraph of prose, roughly `n` characters. */
const prose = (n) => '风从山口下来，吹得院里的竹影一层层压到墙上。他坐在门槛上不动，只把手里的旧信翻过来又翻回去。'.repeat(Math.ceil(n / 46)).slice(0, n)
try {
  let url
  for (let i=0;i<100;i+=1){try{const t=await(await fetch('http://127.0.0.1:9469/json/list')).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl!==undefined){url=p.webSocketDebuggerUrl;break}}catch{}await sleep(200)}
  const ws = new WebSocket(url)
  await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',()=>rej(new Error('ws')),{once:true})})
  s = new S(ws); await s.send('Page.enable'); await s.send('Runtime.enable')
  await s.send('Page.navigate',{url:hostUrl})
  await s.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)
  await sleep(2500)

  // Turn the mode on from the sheet — the control itself is part of this check.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]'); if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-settings]') !== null`)
  const controlPresent = await s.ev(`document.querySelector('[data-novel-settings-refine]') !== null`)
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-refine="while-writing"]'); if (b) b.click() })()`)
  await sleep(300)
  const pressed = await s.ev(`document.querySelector('[data-novel-settings-refine="while-writing"]')?.getAttribute('aria-pressed') ?? null`)
  await s.ev(`document.querySelector('[data-novel-settings-close]').click()`)
  await sleep(400)
  result.steps.push({ step: 'turned 边写边 on from the sheet', controlPresent, pressed })

  await s.ev(`(() => { const n = document.querySelector('[data-novel-chapter]') ?? document.querySelector('[data-novel-chapter-status]'); if (n) n.click() })()`)
  await sleep(1200)
  await s.ev(`(() => { const v = document.querySelector('[data-novel-view="editor"]'); if (v) v.click() })()`)
  await sleep(2500)

  const focused = await focusEditor()
  if (!focused) throw new Error('the editor never took the caret')

  const baseline = { inbox: await inbox(), chars: await chars(), tools: await toolLines() }
  result.steps.push({ step: 'baseline', focused, ...baseline })

  // Under the threshold: writing alone must not spend anything.
  await s.send('Input.insertText',{text:`${prose(700)}\n`})
  await sleep(6000)
  result.steps.push({ step: 'wrote under the threshold', chars: await chars(), inbox: await inbox(), asked: await asked() })

  // Past the threshold: exactly one refinement.
  await s.send('Input.insertText',{text:`${prose(900)}\n`})
  const fired = await s.until(`document.querySelector('[data-novel-editor-refined]') !== null`, 60000)
  // The turn is observed in the transcript, which does update live; the inbox
  // count is read afterwards from a fresh load.
  const filed = await s.until(`document.querySelectorAll('[data-novel-transcript-entry="tool"]').length > ${String(baseline.tools)}`, 420000)
  const afterFirst = { chars: await chars(), inbox: await inbox(), tools: await toolLines() }
  result.steps.push({ step: 'crossed the threshold', fired, filedTools: filed, afterFirst, toolsAdded: afterFirst.tools - baseline.tools })

  // Back to 提交时 — and then a long stretch must add nothing more.
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-open="true"]'); if (b) b.click() })()`)
  await s.until(`document.querySelector('[data-novel-settings]') !== null`)
  await s.ev(`(() => { const b = document.querySelector('[data-novel-settings-refine="on-submit"]'); if (b) b.click() })()`)
  await sleep(300)
  await s.ev(`document.querySelector('[data-novel-settings-close]').click()`)
  await sleep(400)
  const beforeOff = { inbox: await inbox(), chars: await chars() }
  // The sheet took the caret, so put it back and confirm it landed: the first
  // run typed into nothing and read "no change" as if the switch had worked.
  const again = await focusEditor()
  if (again) await s.send('Input.insertText',{text:`${prose(2000)}\n`})
  await sleep(12000)
  const afterOff = { inbox: await inbox(), chars: await chars(), asked: await s.ev(`document.querySelector('[data-novel-editor-refined]') !== null`) }
  result.steps.push({
    step: 'turned it off, then wrote a lot more',
    refocused: again,
    beforeOff,
    afterOff,
    wrote: afterOff.chars > beforeOff.chars,
  })

  result.ok = controlPresent && pressed === 'true' && fired && filed
    && afterFirst.tools > baseline.tools
    && afterOff.chars > beforeOff.chars
    && afterOff.inbox === beforeOff.inbox
    && afterOff.asked === false
  result.consoleErrors = s.errs
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  result.error = String(error?.stack ?? error)
  console.log(JSON.stringify(result, null, 2))
} finally {
  writeFileSync(join(out,'while-writing-summary.json'), `${JSON.stringify(result,null,2)}\n`)
  try{s?.close()}catch{}
  if(chrome.exitCode===null){chrome.kill('SIGTERM');await sleep(1200)}
  try{rmSync(dir,{recursive:true,force:true,maxRetries:3})}catch{}
}
