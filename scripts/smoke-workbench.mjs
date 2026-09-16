#!/usr/bin/env node
/**
 * 小说模式前端的真机扫描：对着一个正在运行的 DSH Host，把小说模式自己渲染的
 * 每个画布走一遍，留下可复核的文本与截图，并把浏览器的报错一起收上来。
 *
 * 为什么不是 Playwright：这套扫描只需要「点一个选择器 → 等标记出现 → 取文本和
 * 截图」四件事，而仓库里既没有浏览器自动化依赖，也不该为它引入一个（要下载浏览器、
 * 要更新 THIRD_PARTY_NOTICES）。本机已有 Chrome，Node 24 自带 WebSocket，所以这里
 * 直接说 CDP，没有第三方依赖。
 *
 * 这个脚本只读：只导航、点击、读取和截图，不写 Canon、不动 Profile、不改工作区。
 *
 * 用法：
 *   scripts/dev-host.sh start                    # 先有一个带 token 的 Host
 *   node scripts/smoke-workbench.mjs             # 扫描并写 .novel-agent/run/sweep/
 *   node scripts/smoke-workbench.mjs --out /tmp/sweep --keep-open
 *
 * 参数：--out DIR  --url URL  --chrome PATH  --port N  --keep-open  --settle MS
 * 退出码：0 = 每个 ready 的视图都渲染出了自己的画布；1 = 有画布没出现或浏览器报错。
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
const flag = name => args.includes(name)
const value = (name, fallback) => {
  const at = args.indexOf(name)
  return at >= 0 && args[at + 1] !== undefined ? args[at + 1] : fallback
}

const outDir = value('--out', join(root, '.novel-agent/run/sweep'))
const chromePath = value('--chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
const debugPort = Number(value('--port', '9333'))
const settleMs = Number(value('--settle', '900'))
const keepOpen = flag('--keep-open')

/** The rail's own view segment: clicking each entry must land its canvas. */
const RAIL_VIEWS = [
  ['map', '故事地图'],
  ['clues', '伏笔与线索'],
  ['debts', '未收束债务'],
  ['cast', '人物与关系'],
  ['timeline', '时间线'],
  ['memory', '写作记忆'],
  ['contract', '本章合同'],
  ['simulation', '推演'],
  ['history', '版本历史'],
]

/**
 * Read the token URL dev-host.sh recorded. The Host answers 401 without it, so
 * the script refuses to guess an address instead of reporting a false failure.
 */
function readHostUrl() {
  const explicit = value('--url', undefined)
  if (explicit !== undefined) return explicit
  const devHome = process.env.NOVEL_AGENT_DEV_HOME ?? join(root, '.novel-agent')
  const file = join(devHome, 'run/host.url')
  let url
  try {
    url = readFileSync(file, 'utf8').trim()
  } catch {
    throw new Error(`no Host URL at ${file}; run scripts/dev-host.sh start first`)
  }
  if (url === '') throw new Error(`${file} is empty; run scripts/dev-host.sh start`)
  return url
}

/** Minimal CDP client over the page target's own socket. */
class Session {
  #ws
  #next = 0
  #pending = new Map()
  consoleErrors = []
  pageErrors = []
  failedRequests = []

  constructor(ws) {
    this.#ws = ws
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id !== undefined) {
        const pending = this.#pending.get(message.id)
        if (pending === undefined) return
        this.#pending.delete(message.id)
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`))
        else pending.resolve(message.result)
        return
      }
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        this.consoleErrors.push(text(message.params.args))
      }
      if (message.method === 'Runtime.exceptionThrown') {
        this.pageErrors.push(message.params.exceptionDetails?.exception?.description
          ?? message.params.exceptionDetails?.text ?? 'unknown exception')
      }
      if (message.method === 'Network.loadingFailed') {
        const { url, errorText } = message.params
        this.failedRequests.push(`${errorText} ${url ?? ''}`.trim())
      }
    })
  }

  send(method, params = {}) {
    const id = ++this.#next
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, method })
      this.#ws.send(JSON.stringify({ id, method, params }))
    })
  }

  /** Evaluate an expression and return its value (throws like the page would). */
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    if (result.exceptionDetails !== undefined) {
      throw new Error(`page threw: ${result.exceptionDetails.exception?.description ?? 'unknown'}`)
    }
    return result.result?.value
  }

  /** Poll an expression until it is truthy; returns false when the wait ran out. */
  async until(expression, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      try {
        if (await this.evaluate(expression)) return true
      } catch { /* the page may be mid-navigation */ }
      await sleep(150)
    }
    return false
  }

  close() {
    this.#ws.close()
  }
}

/** Console arguments arrive as remote objects; keep the readable ones. */
function text(items = []) {
  return items.map(item => item.value ?? item.description ?? item.type).join(' ')
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Stop headless Chrome and drop its throwaway profile. The profile removal is
 * best-effort: Chrome flushes into it while shutting down, and a busy temp
 * directory is not a scan failure.
 */
async function stopChrome(child, profileDir) {
  const exited = () => new Promise(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) resolve()
    else child.once('exit', resolve)
  })
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM')
    await Promise.race([exited(), sleep(5000)])
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await Promise.race([exited(), sleep(2000)])
  }
  try {
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  } catch { /* disposable temp directory */ }
}

/** Fetch a page target's socket URL, creating one when none exists. */
async function pageSocketUrl() {
  const base = `http://127.0.0.1:${String(debugPort)}`
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${base}/json/list`)
      const targets = await response.json()
      const page = targets.find(target => target.type === 'page')
      if (page?.webSocketDebuggerUrl !== undefined) return page.webSocketDebuggerUrl
    } catch { /* chrome is still starting */ }
    await sleep(200)
  }
  throw new Error(`Chrome never exposed a page target on ${base}`)
}

async function main() {
  const hostUrl = readHostUrl()
  mkdirSync(outDir, { recursive: true })
  const profileDir = mkdtempSync(join(tmpdir(), 'novel-sweep-'))
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${String(debugPort)}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    // sigma paints through WebGL; without a software rasterizer the story map
    // is a blank rectangle in headless mode.
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' })

  let session
  const report = { host: new URL(hostUrl).origin, screens: [], failures: [] }
  try {
    const socketUrl = await pageSocketUrl()
    const ws = new WebSocket(socketUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', () => { reject(new Error('CDP socket failed')) }, { once: true })
    })
    session = new Session(ws)
    await session.send('Page.enable')
    await session.send('Runtime.enable')
    await session.send('Log.enable')
    await session.send('Network.enable')
    await session.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
    })

    await session.send('Page.navigate', { url: hostUrl })
    if (!await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`, 30000)) {
      throw new Error('the novel-mode frame never rendered; is the novel profile installed and current?')
    }
    await session.until(`document.querySelector('[data-novel-rail="nav"]') !== null`)

    report.railSegments = await session.evaluate(
      `Array.from(document.querySelectorAll('[data-novel-rail-segment]')).map(node => node.getAttribute('data-novel-rail-segment'))`)
    report.viewEntries = await session.evaluate(
      `Array.from(document.querySelectorAll('[data-novel-view]')).map(node => node.getAttribute('data-novel-view'))`)

    for (const [id, label] of RAIL_VIEWS) {
      report.screens.push(await sweepView(session, id, label))
    }

    report.screens.push(await sweepAdvanced(session))
    report.screens.push(await sweepProposal(session))
    report.screens.push(await sweepThread(session))
    report.screens.push(await sweepChapterRead(session))
    report.screens.push(await sweepNight(session))
    report.screens.push(await sweepNarrow(session))
  } finally {
    report.failures = session === undefined
      ? []
      : {
          console: session.consoleErrors,
          page: session.pageErrors,
          requests: session.failedRequests,
        }
    writeFileSync(join(outDir, 'sweep.json'), `${JSON.stringify(report, null, 2)}\n`)
    session?.close()
    if (!keepOpen) await stopChrome(chrome, profileDir)
  }

  const rows = report.screens.map(screen => `${pad(screen.view, 11)} ${pad(screen.state, 22)} ${screen.head}`)
  console.log(`host: ${report.host}`)
  console.log(`rail segments: ${(report.railSegments ?? []).join(' / ')}`)
  console.log(`view entries (${String(report.viewEntries?.length ?? 0)}): ${(report.viewEntries ?? []).join(' ')}`)
  console.log(rows.join('\n'))
  console.log(`out: ${outDir}`)
  const failures = report.failures
  // A skip is a truthful record (no proposal, no accepted chapter), not a
  // failure; a surface that was reachable but never rendered is.
  const broken = report.screens.filter(screen => screen.state !== 'rendered'
    && !screen.state.startsWith('skipped-'))
  const noise = failures.console.length + failures.page.length + failures.requests.length
  if (noise > 0) {
    console.log(`browser failures: console ${String(failures.console.length)} · page ${String(failures.page.length)} · requests ${String(failures.requests.length)}`)
  }
  const skipped = report.screens.filter(screen => screen.state.startsWith('skipped-'))
  if (skipped.length > 0) {
    console.log(`skipped: ${skipped.map(screen => `${screen.view} (${screen.state})`).join(', ')}`)
  }
  process.exitCode = broken.length === 0 && noise === 0 ? 0 : 1
}

/** Click one rail view and record what its canvas renders. */
async function sweepView(session, id, label) {
  const clicked = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-view=${JSON.stringify(id)}]');
      if (node === null) return 'missing'; node.click(); return 'ok' })()`)
  if (clicked !== 'ok') return { view: id, label, state: 'entry-missing', head: '' }
  const painted = await session.until(
    `document.querySelector('[data-novel-canvas=${JSON.stringify(id)}]') !== null`)
  if (!painted) return { view: id, label, state: 'canvas-missing', head: '' }
  // The story map paints into a WebGL canvas after the DOM marker exists.
  if (id === 'map') await session.until(
    `document.querySelector('[data-novel-canvas="map"] canvas') !== null`)
  await sleep(settleMs)
  return await record(session, id, label)
}

/**
 * 进阶 is a flag on the rail, not a view entry: the toggle expands three rail
 * groups and switching to the surface itself is what an 进阶 item does.
 */
async function sweepAdvanced(session) {
  const toggled = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-advanced-toggle="true"]');
      if (node === null) return 'missing';
      if (node.getAttribute('aria-pressed') !== 'true') node.click(); return 'ok' })()`)
  if (toggled !== 'ok') return { view: 'advanced', label: '进阶', state: 'toggle-missing', head: '' }
  if (!await session.until(`document.querySelector('[data-novel-advanced-item]') !== null`)) {
    return { view: 'advanced', label: '进阶', state: 'no-advanced-group', head: '' }
  }
  const items = await session.evaluate(
    `Array.from(document.querySelectorAll('[data-novel-advanced-item]')).map(node => node.getAttribute('data-novel-advanced-item'))`)
  await session.evaluate(`document.querySelector('[data-novel-advanced-item]').click()`)
  const painted = await session.until(`document.querySelector('[data-novel-canvas="advanced"]') !== null`)
  if (!painted) return { view: 'advanced', label: '进阶', state: 'canvas-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'advanced', '进阶')
  screen.advancedItems = items
  return screen
}

/**
 * 正文阅读 needs an accepted chapter. A work with no accepted prose is a real
 * product state, so the script records it as skipped rather than failing.
 */
async function sweepChapterRead(session) {
  const chapter = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-chapter-status="accepted"]')
        ?? document.querySelector('[data-novel-chapter]')
      return node === null ? null : node.getAttribute('data-novel-chapter') })()`)
  if (chapter === null) return { view: 'read', label: '正文阅读', state: 'skipped-no-chapter', head: '' }
  await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-chapter-status="accepted"]')
        ?? document.querySelector('[data-novel-chapter]'); node.click() })()`)
  const painted = await session.until(`document.querySelector('[data-novel-canvas="read"]') !== null`)
  if (!painted) return { view: 'read', label: '正文阅读', state: 'canvas-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'read', '正文阅读')
  screen.chapter = chapter
  return screen
}

/**
 * 提案审阅 is reached from the waiting-proposal entry in the context column. A
 * work with nothing pending is a real state, so the script records it as
 * skipped instead of inventing a proposal (it never writes to Canon).
 */
async function sweepProposal(session) {
  const packet = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-proposal]')
      return node === null ? null : node.getAttribute('data-novel-proposal') })()`)
  if (packet === null) return { view: 'review', label: '提案审阅', state: 'skipped-no-proposal', head: '' }
  await session.evaluate(`document.querySelector('[data-novel-proposal]').click()`)
  const painted = await session.until(`document.querySelector('[data-novel-canvas="review"]') !== null`)
  if (!painted) return { view: 'review', label: '提案审阅', state: 'canvas-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'review', '提案审阅')
  screen.packetId = packet
  return screen
}

/**
 * 线程 hands the main column to the shipped conversation surface, so its marker
 * is the frame's own seat plus the novel strip above it — not a canvas.
 */
async function sweepThread(session) {
  const row = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-rail="nav"] [data-novel-thread]')
      return node === null ? null : node.getAttribute('data-novel-thread') })()`)
  if (row === null) return { view: 'thread', label: '线程对话流', state: 'skipped-no-thread', head: '' }
  await session.evaluate(`document.querySelector('[data-novel-rail="nav"] [data-novel-thread]').click()`)
  const shown = await session.until(
    `document.querySelector('[data-novel-conversation-seat="true"]:not([hidden])') !== null`)
  if (!shown) return { view: 'thread', label: '线程对话流', state: 'seat-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'thread', '线程对话流', '[data-novel-conversation-seat="true"]')
  screen.threadHeader = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-thread-header]')
      return node === null ? '' : node.innerText.trim().replace(/\\n+/g, ' · ') })()`)
  return screen
}

/** Pick one button of the topbar's theme group by its visible label. */
async function pressTheme(session, label) {
  return await session.evaluate(
    `(() => { const group = document.querySelector('[aria-label="主题"]')
      if (group === null) return 'no-group'
      const button = Array.from(group.querySelectorAll('button')).find(node => node.innerText.trim() === ${JSON.stringify(label)})
      if (button === undefined) return 'no-button'
      button.click(); return 'ok' })()`)
}

/**
 * 夜间关键屏: the theme modifier must repaint the frame itself, not just the
 * topbar's pressed state. The sweep restores 跟随系统 afterwards so the
 * surfaces captured after it are in the author's default theme.
 */
async function sweepNight(session) {
  if (await pressTheme(session, '夜间') !== 'ok') {
    return { view: 'night', label: '夜间关键屏', state: 'control-missing', head: '' }
  }
  const themed = await session.until(
    `document.querySelector('[data-novel-workbench="frame"][data-nw-theme="night"]') !== null`)
  if (!themed) return { view: 'night', label: '夜间关键屏', state: 'theme-not-applied', head: '' }
  await sleep(settleMs)
  const screen = await shot(session, 'night', '夜间关键屏')
  screen.frameBackground = await session.evaluate(
    `getComputedStyle(document.querySelector('[data-novel-workbench="frame"]')).backgroundColor`)
  await pressTheme(session, '跟随系统')
  return screen
}

/** 窄窗 1280: the frame's own minimum, asserted as "no horizontal scroll". */
async function sweepNarrow(session) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
  })
  await sleep(settleMs)
  const metrics = await session.evaluate(
    `(() => ({ viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      frameWidth: Math.round(document.querySelector('[data-novel-workbench="frame"]').getBoundingClientRect().width),
      railWidth: Math.round(document.querySelector('[data-novel-rail="nav"]')?.getBoundingClientRect().width ?? 0) }))()`)
  const screen = await shot(session, 'narrow', '窄窗 1280')
  screen.metrics = metrics
  screen.state = metrics.documentWidth > metrics.viewport ? 'overflows-viewport' : 'rendered'
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  })
  await sleep(settleMs)
  return screen
}

/** Screenshot-only capture: for surfaces whose value is the pixels, not the text. */
async function shot(session, id, label) {
  const shot = await session.send('Page.captureScreenshot', { format: 'png' })
  const file = join(outDir, `${id}.png`)
  writeFileSync(file, Buffer.from(shot.data, 'base64'))
  return { view: id, label, state: 'rendered', head: '', screenshot: file }
}

/** Capture one rendered surface: its head, its visible text and a screenshot. */
async function record(session, id, label, selector = `[data-novel-canvas=${JSON.stringify(id)}]`) {
  // `innerText`, not `textContent`: every canvas injects its own <style> block,
  // and textContent would fold that CSS into the record and the character count.
  const head = await session.evaluate(
    `(() => { const node = document.querySelector(${JSON.stringify(selector)})
      if (node === null) return ''
      const heading = node.querySelector('h1, h2, h3')
      return (heading ?? node).innerText.trim().split('\\n')[0] ?? '' })()`)
  const body = await session.evaluate(
    `(() => { const node = document.querySelector(${JSON.stringify(selector)})
      return node === null ? '' : node.innerText.trim() })()`)
  const shot = await session.send('Page.captureScreenshot', { format: 'png' })
  const file = join(outDir, `${id}.png`)
  writeFileSync(file, Buffer.from(shot.data, 'base64'))
  return { view: id, label, state: 'rendered', head, bodyChars: body.length, body: body.slice(0, 600), screenshot: file }
}

const pad = (value, width) => String(value).padEnd(width)

main().catch(error => {
  console.error(`smoke-workbench: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
