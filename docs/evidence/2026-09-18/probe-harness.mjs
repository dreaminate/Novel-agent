#!/usr/bin/env node
/**
 * Shared CDP harness for the 2026-09-18 novel-mode probes.
 *
 * A1 (canvas degradation), A2 (lost typing) and A3 (the submit chain) each drive
 * the same headless Chrome over the same protocol from the same seat. The session
 * class, the launch flags and the few helpers all live here so a scenario file
 * holds only what that scenario is about; the three used to carry three copies of
 * this, which is how each grew past 200 lines.
 *
 * Read-only against the product: it navigates, clicks, types and reads. Any file a
 * probe writes is the probe's to restore.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// This file sits one level above the scenarios that use it, so the repository
// root is three hops up, not four.
export const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** The URL the running dev host published, token and all. */
export function hostUrl() {
  return readFileSync(join(ROOT, '.novel-agent/run/host.url'), 'utf8').trim()
}

class Session {
  #ws; #n = 0; #pending = new Map(); #outDir
  errors = []

  constructor(ws, outDir) {
    this.#ws = ws
    this.#outDir = outDir
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id === undefined) {
        // Only what the page itself reported: an uncaught exception, or a
        // console.error. Both are what "the canvas died" looks like from outside.
        if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
          this.errors.push(message.params.args.map(a => a.value ?? a.description ?? '').join(' '))
        }
        if (message.method === 'Runtime.exceptionThrown') {
          this.errors.push('EXC ' + (message.params.exceptionDetails?.exception?.description ?? ''))
        }
        return
      }
      const pending = this.#pending.get(message.id)
      if (pending === undefined) return
      this.#pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  /**
   * One protocol call. Bounded on purpose: a CDP socket that has died without
   * saying so would otherwise leave the promise pending for ever, and a hung
   * probe is much harder to read than a failed one.
   */
  send(method, params = {}, timeoutMs = 30000) {
    const id = ++this.#n
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id)
        reject(new Error(`CDP ${method} did not answer within ${String(timeoutMs)}ms`))
      }, timeoutMs)
      this.#pending.set(id, {
        resolve: value => { clearTimeout(timer); resolve(value) },
        reject: error => { clearTimeout(timer); reject(error) },
      })
      this.#ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async ev(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description)
    return result.result?.value
  }

  async until(expression, ms = 20000) {
    const deadline = Date.now() + ms
    while (Date.now() < deadline) {
      try { if (await this.ev(expression)) return true } catch { /* mid-navigation */ }
      await sleep(150)
    }
    return false
  }

  /** Click one element, whether or not it is there. */
  async click(selector) {
    await this.ev(`document.querySelector(${JSON.stringify(selector)})?.click()`)
  }

  /** Put the caret in the editable surface and type, replacing what is selected. */
  async focusEditor(selector = '[data-novel-editor] .ProseMirror') {
    return await this.ev(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (el === null) return null
      el.focus()
      const rect = el.getBoundingClientRect()
      return { x: Math.round(rect.x + 60), y: Math.round(rect.y + 24) }
    })()`)
  }

  /** Click into the prose the way a mouse does, so the editor takes focus. */
  async clickIntoEditor(at) {
    if (at === null) throw new Error('no editable surface')
    for (const type of ['mousePressed', 'mouseReleased']) {
      await this.send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 })
    }
    await sleep(300)
  }

  /** Replace the whole document with `text`, so a probe submits its own words. */
  async replaceDocument(text) {
    await this.ev(`(() => {
      const el = document.querySelector('[data-novel-editor] .ProseMirror')
      if (el === null) return false
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const selection = window.getSelection()
      selection.removeAllRanges(); selection.addRange(range)
      return true
    })()`)
    await sleep(300)
    await this.send('Input.insertText', { text })
  }

  async shot(name) {
    const shot = await this.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(this.#outDir, `${name}.png`), Buffer.from(shot.data, 'base64'))
  }

  close() { this.#ws.close() }
}

/**
 * Start headless Chrome against a blank page and connect to it.
 *
 * `--disable-gpu` is deliberate: with no WebGL the story map takes its degraded
 * path, which is A1's acceptance environment. The rest is the sandbox Chrome
 * needs to run at all under this harness.
 */
export async function launch({ port, outDir, width = 1440, height = 900 }) {
  const profileDir = mkdtempSync(join(tmpdir(), `probe-${String(port)}-`))
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
    `--remote-debugging-port=${String(port)}`, '--remote-allow-origins=*',
    `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    `--window-size=${String(width)},${String(height)}`, 'about:blank',
  ], { stdio: 'ignore' })

  const stop = () => {
    chrome.kill()
    // Chrome is still flushing its profile when the probe ends, and removing a
    // directory out from under it is not worth failing a run over — so this is
    // best effort, with one retry that does not hold node open.
    const remove = () => {
      try { rmSync(profileDir, { recursive: true, force: true }) } catch { /* still writing */ }
    }
    remove()
    setTimeout(remove, 1000).unref()
  }

  // Everything past the spawn cleans up on the way out: a failure here that left
  // Chrome running would also leave node alive on the child's event loop, which
  // turns a one-line error into a probe that hangs for ever.
  try {
    let target
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        const list = await (await fetch(`http://127.0.0.1:${String(port)}/json/list`)).json()
        const page = list.find(entry => entry.type === 'page')
        if (page?.webSocketDebuggerUrl !== undefined) { target = page; break }
      } catch { /* the port is not up yet */ }
      await sleep(200)
    }
    if (target === undefined) throw new Error(`CDP port ${String(port)} never came up`)

    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true })
      ws.addEventListener('error', () => { reject(new Error('CDP websocket refused')) }, { once: true })
    })

    const session = new Session(ws, outDir)
    await session.send('Page.enable')
    await session.send('Runtime.enable')
    await session.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: false,
    })
    await session.send('Page.navigate', { url: hostUrl() })
    if (!await session.until(`document.querySelector('[data-novel-workbench="frame"]') !== null`)) {
      throw new Error('the workbench frame never rendered')
    }
    await sleep(2500)

    return {
      session,
      close: () => { session.close(); stop() },
      /** The rail's own entry for a canvas, clicked the way the author clicks it. */
      openView: async (view) => {
        await session.click(`[data-novel-view="${view}"]`)
        return await session.until(`document.querySelector('[data-novel-canvas="${view}"]') !== null`)
      },
    }
  } catch (error) {
    stop()
    throw error
  }
}

/** Write a probe's summary next to its screenshots. */
export function writeSummary(outDir, name, summary) {
  writeFileSync(join(outDir, `${name}-summary.json`), JSON.stringify(summary, null, 1))
}
