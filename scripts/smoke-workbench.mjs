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
  ['editor', '写作'],
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

/** Must match `WORKBENCH_PREFS_KEY`: where the frame keeps the author's choices. */
const PREFS_KEY = 'novel-workbench/prefs'

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
    // The author's browser asks for Chinese, and the shipped locale runtime
    // resolves to English for one that asks for nothing. Without this the sweep
    // measures a browser the author does not have — which is how the official
    // composer came to look untranslated when it never was. See
    // docs/evidence/2026-09-18/composer-locale/findings.md.
    '--accept-lang=zh-CN,zh;q=0.9',
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
    report.screens.push(await sweepSettings(session))
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
  const thread = report.screens.find(screen => screen.view === 'thread')
  if (thread?.transcript !== undefined && thread.transcript !== null) {
    console.log(`thread transcript: ${thread.transcript.empty
      ? 'empty-state'
      : `${String(thread.transcript.entries)} entries (${String(thread.transcript.tools ?? 0)} tool lines)${thread.transcript.streaming ? ' (streaming)' : ''}`}`)
    if (typeof thread.transcript.sample === 'string' && thread.transcript.sample !== '') {
      console.log(`thread sample: ${thread.transcript.sample}`)
    }
  }
  const story = report.screens.find(screen => screen.view === 'map')
  if (story?.map !== undefined && story.map !== null) {
    // What a force layout has to report about itself: how many characters, how
    // many canvases, and how much of the stage the cast spans.
    console.log(`story map: ${String(story.map.people)} 人物 · canvas ${String(story.map.canvases)}`
      + ` · spread ${String(story.map.spread)}`)
    if (story.mapNodes !== undefined) {
      console.log(`story map keyboard: ${String(story.mapNodes.count)} stops`
        + ` (${String(story.mapNodes.inTabOrder)} in the tab order, ${String(story.mapNodes.named)} named)`)
    }
  }
  const kept = report.screens.find(screen => screen.view === 'settings')
  if (kept?.stored !== undefined && kept.stored !== null) {
    console.log(`choices kept for the next load: view ${String(kept.stored.view)}`
      + ` · theme ${String(kept.stored.theme)}`
      + ` · columns ${String(kept.stored.panels?.sidebar)}/${String(kept.stored.panels?.details)}`)
  }
  const narrow = report.screens.find(screen => screen.view === 'narrow')
  if (narrow?.metrics !== undefined) {
    const m = narrow.metrics
    console.log(`narrow 1280: data-narrow ${String(m.narrow)} · rail ${String(m.railWidth)}px`
      + ` · labels hidden ${String(m.railLabelsHidden)}`
      + ` · column floats ${String(m.columnFloatsOverCanvas)}`
      + ` · canvas reaches floor ${String(m.canvasReachesFloor)}`
      + ` (main ${String(m.mainBottom)} vs frame ${String(m.frameBottom)}`
      + `, ${String(m.mainCount)} main seats, sane ${String(m.mainLooksRight)})`
      + ` · scrollY ${String(m.scrollY)} of ${String(m.scrollHeight)}`)
  }
  const cast = report.screens.find(screen => screen.view === 'cast')
  if (cast?.cast !== undefined && cast.cast !== null) {
    console.log(`cast board: canon keys leaked ${String(cast.cast.leaks.length)}`
      + ` · zero chips ${String(cast.cast.zeroChips)}`)
  }
  const authorCopy = authorCopyLeaks(report.screens)
  console.log(`author copy: ${authorCopy.leaks.length === 0
    ? 'no plumbing words on our lines'
    : authorCopy.leaks.join(' / ')} · composer ${JSON.stringify(authorCopy.composer.slice(0, 48))}`)
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
  process.exitCode = broken.length === 0 && noise === 0 && authorCopy.leaks.length === 0 ? 0 : 1
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
  const screen = await record(session, id, label)
  if (id === 'map') await sweepMap(session, screen)
  if (id === 'cast') await sweepCast(session, screen)
  return screen
}

/** Canon's own words, which must never reach the author's screen. */
const CANON_KEYS = ['constitution', 'realm', 'persona', 'mechanism', 'artifact', 'signature',
  'thread', 'status', 'faction', 'name', 'role', 'emotion', 'agenda', 'assets', 'leadership']

/**
 * The cast board has to speak the author's language. Canon keys it, the model
 * chose them, and they are not words anyone reads a character sheet in.
 */
async function sweepCast(session, screen) {
  screen.cast = await session.evaluate(`(() => {
    const board = document.querySelector('[data-novel-cast]')
    if (board === null) return null
    const text = board.innerText
    const keys = ${JSON.stringify(CANON_KEYS)}
    return {
      leaks: keys.filter(key => new RegExp('(^|[^a-z-])' + key + '($|[^a-z-])').test(text)),
      zeroChips: Array.from(board.querySelectorAll('[data-novel-faction]'))
        .filter(card => card.innerText.includes('0 人')).length,
    } })()`)
  if (screen.cast === null) {
    screen.state = 'cast-missing-board'
    return
  }
  // A zero is not information; "no accepted members yet" is.
  if (screen.cast.zeroChips > 0) screen.state = 'cast-prints-a-zero'
  else if (screen.cast.leaks.length > 0) screen.state = 'cast-prints-canon-keys'
}

/**
 * The story map as it is drawn now (I-P1): one node per accepted character,
 * laid out by forceatlas2, with the keyboard's copy of the cast in the SVG
 * overlay above the canvas.
 *
 * The map used to scale the cast into cluster discs, folding the loose ends of
 * each behind a `+N`, with an axis to regroup them. That view is gone, and this
 * check kept reading its attributes — `data-novel-story-map-clusters` and
 * `-axis` stopped being published, so every sweep reported "the ring layout
 * never ran" for a map that had replaced the ring layout deliberately. What is
 * worth asserting about a force layout is that it ran: the nodes are spread,
 * not stacked, and they stay inside the overlay they are drawn on.
 */
async function sweepMap(session, screen) {
  const read = async () => await session.evaluate(`(() => {
    const root = document.querySelector('[data-novel-story-map]')
    if (root === null) return null
    const stage = document.querySelector('[data-novel-story-map-canvas]')
    const overlay = document.querySelector('[data-novel-story-map-overlay]')
    const box = stage === null ? null : stage.getBoundingClientRect()
    const paint = overlay === null ? null : overlay.getBoundingClientRect()
    // The overlay's focus stops are the only per-character geometry published,
    // and they are positioned on the nodes the layout placed. Their *centres*
    // are the node positions; the bounding box also carries the node's radius,
    // which would read a node sitting near an edge as off the stage.
    const stops = Array.from(document.querySelectorAll('[data-novel-story-map-node]'))
      .map(node => {
        const r = node.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
    return {
      people: Number(root.getAttribute('data-novel-story-map-people') ?? '0'),
      canvases: document.querySelectorAll('[data-novel-story-map-canvas] canvas').length,
      degraded: document.querySelector('[data-novel-story-map-degraded]') !== null,
      canvasHost: stage !== null,
      overlayCoversStage: box !== null && paint !== null
        && Math.abs(paint.width - box.width) < 2 && Math.abs(paint.height - box.height) < 2,
      stops,
      stopsInsideOverlay: paint === null || stops.length === 0 ? null
        : stops.every(stop => stop.x >= paint.left - 1 && stop.x <= paint.right + 1
          && stop.y >= paint.top - 1 && stop.y <= paint.bottom + 1),
      // How much of the stage the cast actually spans, as a fraction of its
      // longest side. A simulation that ran spreads it; one that fell over
      // stacks every node on a single point.
      spread: paint === null || stops.length < 2 ? null
        : (() => {
            const xs = stops.map(stop => stop.x)
            const ys = stops.map(stop => stop.y)
            const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
            return Math.round(span / Math.max(1, Math.max(paint.width, paint.height)) * 100) / 100
          })(),
    } })()`)
  const before = await read()
  if (before === null) {
    screen.state = 'map-missing-root'
    return
  }
  screen.map = before
  // The keyboard's copy of the cast: the WebGL nodes are not focusable, so the
  // overlay has to carry one real element per drawn character — and exactly one
  // of them may sit in the tab order, or a long cast becomes a tab marathon.
  screen.mapNodes = await session.evaluate(`(() => {
    const nodes = Array.from(document.querySelectorAll('[data-novel-story-map-node]'))
    return { count: nodes.length,
      inTabOrder: nodes.filter(node => node.getAttribute('tabindex') === '0').length,
      named: nodes.filter(node => (node.getAttribute('aria-label') ?? '') !== '').length } })()`)
  // Everyone drawn has to be reachable, and exactly one of them may sit in the
  // tab order, or a long cast becomes a tab marathon.
  if (screen.mapNodes.count !== before.people) screen.state = 'map-keyboard-cast-mismatch'
  else if (screen.mapNodes.inTabOrder > 1) screen.state = 'map-keyboard-tab-marathon'
  else if (screen.mapNodes.named !== screen.mapNodes.count) screen.state = 'map-keyboard-unnamed'
  // The stops are positioned in the overlay's own pixel space, so an overlay
  // that does not cover the stage puts every one of them out of sight.
  if (!before.overlayCoversStage) screen.state = 'map-overlay-misplaced'
  if (before.stopsInsideOverlay === false) screen.state = 'map-stops-off-overlay'
  // The layout ran if the cast is spread across the stage; a collapsed
  // simulation stacks every node on one point.
  if (before.people > 1 && before.spread !== null && before.spread < 0.15) {
    screen.state = 'map-layout-degenerate'
  }
  // A1: this sweep runs on a GPU, so the map is expected to paint. A degraded card
  // here means the probe said "no" to a machine that can — a regression, not the
  // feature. The card is the right answer only under the walkthrough's --disable-gpu.
  if (before.degraded) screen.state = 'map-degraded-on-good-gpu'
  else if (before.people > 0 && !before.canvasHost) screen.state = 'map-no-canvas-host'
  // The fold-and-axis interaction this sweep used to drive is gone with the
  // discs it belonged to. Pinning and hovering are exercised by the map's own
  // spec and by the I-P1 probe, which can reach the pointer; the sweep's job
  // here is the coarse one — the map renders, spread, with a reachable cast.
  await sleep(200)
  await session.send('Page.captureScreenshot', { format: 'png' }).then(shot => {
    writeFileSync(screen.screenshot, Buffer.from(shot.data, 'base64'))
  })
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
  if (chapter === null) return { view: 'chapter', label: '章节 → 写作', state: 'skipped-no-chapter', head: '' }
  await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-chapter-status="accepted"]')
        ?? document.querySelector('[data-novel-chapter]'); node.click() })()`)
  // 正文阅读 was a canvas of its own and is the editor's reading state now, so a
  // chapter click has to land on 写作. The reading state itself is checked by
  // its own assertions rather than by a screen that no longer exists.
  const painted = await session.until(`document.querySelector('[data-novel-canvas="editor"]') !== null`)
  if (!painted) return { view: 'chapter', label: '章节 → 写作', state: 'editor-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'chapter', '章节 → 写作')
  screen.chapter = chapter
  screen.modes = await session.evaluate(`document.querySelectorAll('[data-novel-editor-mode]').length`)
  return screen
}

/**
 * 提案审阅 is reached from the waiting-proposal badge in the thread header, which
 * is also the only place that says how many are waiting. A work with nothing
 * pending is a real state, so the script records it as skipped instead of
 * inventing a proposal (it never writes to Canon).
 *
 * The selector here used to name `[data-novel-proposal]`, which the product has
 * never rendered — so this screen reported "nothing pending" on every run,
 * including the runs where something was waiting.
 */
async function sweepProposal(session) {
  // The badge lives in the conversation column, so the column has to be open
  // before the question "is anything waiting?" can be asked at all.
  if (await session.evaluate(`document.querySelector('[data-novel-thread-pending]') === null`)) {
    await session.evaluate(
      `(() => { const toggle = document.querySelector('[data-novel-topbar-details]')
        if (toggle !== null) toggle.click() })()`)
    await sleep(600)
  }
  const pending = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-thread-pending]')
      return node === null ? 0 : Number(node.getAttribute('data-novel-thread-pending') ?? '0') })()`)
  if (!Number.isFinite(pending) || pending <= 0) {
    return { view: 'review', label: '提案审阅', state: 'skipped-no-proposal', head: '' }
  }
  await session.evaluate(`document.querySelector('[data-novel-thread-pending]').click()`)
  const painted = await session.until(`document.querySelector('[data-novel-canvas="review"]') !== null`)
  if (!painted) return { view: 'review', label: '提案审阅', state: 'canvas-missing', head: '' }
  await sleep(settleMs)
  const screen = await record(session, 'review', '提案审阅')
  screen.pending = pending
  return screen
}

/**
 * 线程 hands the main column to the shipped conversation surface, so its marker
 * is the frame's own seat plus the novel strip above it — not a canvas.
 */
async function sweepThread(session) {
  // The rail's thread list only materialises once its segment is selected.
  await session.evaluate(`(() => {
    const segment = document.querySelector('[data-novel-rail-segment="threads"]')
    if (segment !== null) segment.click() })()`)
  await session.until(`document.querySelector('[data-novel-thread]') !== null`)
  const rows = await session.evaluate(
    `Array.from(document.querySelectorAll('[data-novel-thread]')).map(node => node.getAttribute('data-novel-thread'))`)
  if (rows.length === 0) return { view: 'thread', label: '对话列', state: 'skipped-no-thread', head: '' }

  // Walk the list until a thread actually carries prose. The first row is often
  // a brand-new thread, and the point of this screen is to see the frame set real
  // messages, not its empty state.
  let transcript = null
  for (const row of rows.slice(0, 8)) {
    await session.evaluate(`(() => {
      const node = document.querySelector('[data-novel-thread=${JSON.stringify(row)}]')
      if (node !== null) node.click() })()`)
    if (!await session.until(
      `document.querySelector('[data-novel-conversation-seat="true"]:not([hidden])') !== null`)) continue
    await sleep(settleMs)
    transcript = await session.evaluate(
      `(() => { const seat = document.querySelector('[data-novel-transcript-seat]')
        if (seat === null) return null
        const text = seat.innerText ?? ''
        // The transcript must speak the author's language: a tool's own name
        // reaching a *tool line* is the regression this screen exists to catch.
        // Scoped to tool lines on purpose — the author may legitimately type an
        // identifier into their own message, and that is not our rendering.
        // The phrase is ours and must stay in the author's language. The detail
        // is excluded because it can be the model's own sentence, which may name
        // a tool — that is the model talking, not our rendering.
        const toolText = Array.from(
          seat.querySelectorAll('[data-novel-transcript-entry="tool"] [data-novel-transcript-tool-phrase]'),
        ).map(node => node.innerText ?? '').join('\\n')
        const leaks = ['propose_novel_result_packet','retrieve_novel_context','rebuild_novel_index',
          'simulate_novel_story_world','simulate_novel_reader_response','todo_write','subagent_fork',
          'web_search','web_fetch','read_image','propose_novel_import','publish_novel_manuscript']
          .filter(name => toolText.includes(name))
        return {
          entries: seat.querySelectorAll('[data-novel-transcript-entry]').length,
          tools: seat.querySelectorAll('[data-novel-transcript-entry="tool"]').length,
          empty: seat.querySelector('[data-novel-transcript="empty"]') !== null,
          streaming: seat.querySelector('[data-novel-transcript-streaming="true"]') !== null,
          // A conversation taller than its column has to be scrollable *there*:
          // with the frame clipping instead, the author cannot read past the fold.
          overflowY: getComputedStyle(seat).overflowY,
          scrolls: seat.scrollHeight <= seat.clientHeight
            || ['auto', 'scroll'].includes(getComputedStyle(seat).overflowY),
          leaks,
          sample: text.trim().replace(/\\n+/g, ' ').slice(0, 160)
        } })()`)
    if (transcript !== null && transcript.entries > 0) break
  }
  if (transcript === null) return { view: 'thread', label: '对话列', state: 'transcript-seat-missing', head: '' }

  // 线程 is the right-hand column now, not a view: the seat renders inside it and
  // the column is what collapses to give the editor the full width.
  const screen = await record(session, 'thread', '对话列', '[data-novel-conversation-column]')
  screen.isColumn = await session.evaluate(`document.querySelector('[data-novel-conversation-column]') !== null`)
  if (!screen.isColumn) screen.state = 'conversation-column-missing'
  screen.transcript = transcript
  // An empty transcript across every reachable thread is the failure this screen
  // exists to catch: the frame renders, but it is not rendering the conversation.
  if (transcript.entries === 0) screen.state = 'transcript-empty'
  if (Array.isArray(transcript.leaks) && transcript.leaks.length > 0) {
    screen.state = 'transcript-leaks-tool-names'
  }
  // A conversation taller than its column that cannot scroll is one the author
  // cannot finish reading.
  if (transcript.scrolls === false) screen.state = 'transcript-clipped'
  // 工具活动 has to do something, and the only honest way to know is to use it
  // where the transcript is: turn it off, count the tool lines again, put it
  // back. Skipped when there is no tool activity to hide — this is a check on
  // the switch, not on whether the model happened to call a tool.
  if (transcript.tools > 0) {
    const openSheet = async () => {
      await session.evaluate(`(() => {
        const node = document.querySelector('[data-novel-settings-open="true"]')
        if (node !== null) node.click() })()`)
      return await session.until(`document.querySelector('[data-novel-settings]') !== null`)
    }
    const closeSheet = async () => {
      await session.evaluate(`document.querySelector('[data-novel-settings-close]').click()`)
      await sleep(250)
    }
    if (await openSheet()) {
      await session.evaluate(`(() => {
        const button = document.querySelector('[data-novel-settings-activity="false"]')
        if (button !== null) button.click() })()`)
      await sleep(250)
      await closeSheet()
      const hidden = await session.evaluate(
        `(() => { const seat = document.querySelector('[data-novel-transcript-seat]')
          if (seat === null) return null
          return {
            tools: seat.querySelectorAll('[data-novel-transcript-entry="tool"]').length,
            entries: seat.querySelectorAll('[data-novel-transcript-entry]').length } })()`)
      screen.toolActivity = hidden
      if (screen.state === 'rendered') {
        if (hidden === null || hidden.tools !== 0) screen.state = 'tool-activity-switch-ignored'
        // Hiding the work must not hide the author's own conversation with it.
        else if (hidden.entries === 0) screen.state = 'tool-activity-hid-everything'
      }
      // Back to the default, so the rest of the sweep sees the frame as shipped.
      if (await openSheet()) {
        await session.evaluate(`(() => {
          const button = document.querySelector('[data-novel-settings-activity="true"]')
          if (button !== null) button.click() })()`)
        await sleep(250)
        await closeSheet()
      }
    }
  }
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
    `(() => { const frame = document.querySelector('[data-novel-workbench="frame"]')
      const rect = frame.getBoundingClientRect()
      const rail = document.querySelector('[data-novel-rail="nav"]')
      const labels = rail === null ? [] : Array.from(rail.querySelectorAll('.lbl'))
      const side = document.querySelector('[data-novel-conversation-column]')
      const main = document.querySelector('[data-novel-shell="main"]')
      return { viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        scrollY: Math.round(window.scrollY),
        scrollHeight: document.documentElement.scrollHeight,
        frameWidth: Math.round(rect.width),
        frameHeight: Math.round(rect.height),
        frameBottom: Math.round(rect.bottom),
        narrow: frame.getAttribute('data-narrow'),
        railWidth: Math.round(rail?.getBoundingClientRect().width ?? 0),
        railLabelsHidden: labels.length > 0 && labels.every(node => getComputedStyle(node).display === 'none'),
        // Both in viewport coordinates, so the difference survives a scroll.
        mainBottom: main === null ? null : Math.round(main.getBoundingClientRect().bottom),
        mainCount: document.querySelectorAll('[data-novel-shell="main"]').length,
        mainLooksRight: main !== null && main.tagName === 'MAIN' && frame.contains(main),
        canvasReachesFloor: main !== null
          && Math.abs(main.getBoundingClientRect().bottom - rect.bottom) < 2,
        columnPresent: side !== null,
        columnFloatsOverCanvas: side !== null && main !== null
          && side.getBoundingClientRect().x < main.getBoundingClientRect().right } })()`)
  const screen = await shot(session, 'narrow', '窄窗 1280')
  screen.metrics = metrics
  if (metrics.documentWidth > metrics.viewport) screen.state = 'overflows-viewport'
  // The narrow rules are the prototype's; they only help if something switches
  // them on for this frame.
  else if (metrics.narrow !== '1') screen.state = 'narrow-not-applied'
  else if (!metrics.railLabelsHidden || metrics.railWidth > 100) screen.state = 'narrow-rail-not-folded'
  // With a conversation open, the column has to float over the canvas instead of
  // taking a track back from it.
  else if (metrics.columnPresent && !metrics.columnFloatsOverCanvas) {
    screen.state = 'narrow-column-takes-a-track'
  }
  // The frame no longer reserves the prototype's composer row: the canvas has to
  // reach the bottom of the seat rather than stop above it.
  else if (!metrics.canvasReachesFloor) screen.state = 'dead-row-under-canvas'
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

/**
 * 设置 is a sheet over the frame. It must offer only choices the frame applies —
 * and that rule has to be read forwards, not as "hide anything awkward". The
 * tool-activity switch is offered because the frame renders the thread itself
 * now, so its *absence* is the failure here; whether it is honored is checked
 * where the transcript is, in `sweepThread`.
 */
async function sweepSettings(session) {
  const opened = await session.evaluate(
    `(() => { const node = document.querySelector('[data-novel-settings-open="true"]')
      if (node === null) return 'missing'; node.click(); return 'ok' })()`)
  if (opened !== 'ok') return { view: 'settings', label: '设置', state: 'control-missing', head: '' }
  if (!await session.until(`document.querySelector('[data-novel-settings]') !== null`)) {
    return { view: 'settings', label: '设置', state: 'sheet-missing', head: '' }
  }
  await sleep(settleMs)
  const screen = await record(session, 'settings', '设置', '[data-novel-settings]')
  const offerable = await session.evaluate(
    `document.querySelector('[data-novel-settings-activity]') !== null`)
  if (!offerable) screen.state = 'missing-expected-control'
  // The choices this run has been making belong to the next page load, so the
  // sweep checks they actually landed where that load will look for them.
  screen.stored = await session.evaluate(
    `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)}) ?? 'null') }
      catch { return null } })()`)
  if (screen.stored === null || typeof screen.stored.view !== 'string') {
    screen.state = 'prefs-not-stored'
  }
  await session.evaluate(`document.querySelector('[data-novel-settings-close]').click()`)
  await sleep(200)
  return screen
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
  // The line under the title is entirely ours — the canvases below carry the
  // author's own prose and the model's, so a word found in them proves nothing.
  const sub = await session.evaluate(
    `(() => { const node = document.querySelector(${JSON.stringify(selector)} + ' .main-head .sub')
      return node === null ? '' : node.innerText.trim() })()`)
  // The composer is the shipped conversation surface, so its words come from the
  // shipped locale dictionaries — read here, while the page is alive, and judged
  // with the rest of the author copy once the sweep is over.
  const composer = await session.evaluate(
    `(() => { const slot = document.querySelector('[data-slot="conversation.composer"]')
      const node = (slot ?? document).querySelector('[placeholder], [data-placeholder]')
      return node === null ? '' : (node.getAttribute('placeholder') ?? node.getAttribute('data-placeholder') ?? '') })()`)
  const shot = await session.send('Page.captureScreenshot', { format: 'png' })
  const file = join(outDir, `${id}.png`)
  writeFileSync(file, Buffer.from(shot.data, 'base64'))
  return { view: id, label, state: 'rendered', head, sub, composer, bodyChars: body.length, body: body.slice(0, 600), screenshot: file }
}

/**
 * Words that belong to the plumbing, not to the author.
 *
 * Looked for on the lines this product writes — the canvas title, the line under
 * it, and the composer's own placeholder — because the canvases below them carry
 * the author's prose and the model's, and a word found there is somebody else
 * talking. 进阶面 is excluded outright: the brief puts the machine room outside
 * the author's surface.
 */
const AUTHOR_LEAKS = ['Canon', 'workdir', 'Describe what you want to build']

function authorCopyLeaks(screens) {
  const leaks = []
  let composer = ''
  for (const screen of screens) {
    if (screen.view === 'advanced') continue
    if (typeof screen.composer === 'string' && screen.composer !== '') composer = screen.composer
    for (const word of AUTHOR_LEAKS) {
      if (`${screen.head ?? ''}\n${screen.sub ?? ''}`.includes(word)) {
        leaks.push(`${screen.view} 标题:${word}`)
      }
    }
  }
  for (const word of AUTHOR_LEAKS) {
    if (composer.includes(word)) leaks.push(`composer:${word}`)
  }
  return { leaks, composer }
}

const pad = (value, width) => String(value).padEnd(width)

main().catch(error => {
  console.error(`smoke-workbench: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
