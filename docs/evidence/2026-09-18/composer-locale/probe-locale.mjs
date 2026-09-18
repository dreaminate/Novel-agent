#!/usr/bin/env node
/**
 * Does the shipped composer speak Chinese to a Chinese browser?
 *
 * The walkthrough saw "Describe what you want to build..." on the composer and
 * S2 recorded that as the product shipping an untranslated input. It is not: the
 * placeholder is a locale key (`placeholder.hero`) with a complete zh dictionary
 * beside the en one, and the shipped locale runtime falls back to English only
 * for a browser that asks for no registered language — which headless Chrome,
 * carrying no Accept-Language, is.
 *
 * So this asks the question twice: once the way the walkthrough asked it, and
 * once the way the author's browser asks it. Read-only; nothing is written.
 *
 * 用法：node docs/evidence/2026-09-18/composer-locale/probe-locale.mjs
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../../..', import.meta.url))
const hostUrl = readFileSync(join(root, '.novel-agent/run/host.url'), 'utf8').trim()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'

const PLACEHOLDER = `(() => {
  const slot = document.querySelector('[data-slot="conversation.composer"]')
  const node = (slot ?? document).querySelector('textarea, [contenteditable], [data-placeholder]')
  if (node === null) return null
  return node.getAttribute('placeholder') ?? node.getAttribute('data-placeholder')
    ?? node.innerText?.slice(0, 60) ?? null
})()`

/** Open the host in a browser that reports `languages`, and read the composer. */
async function composerFor(port, languages) {
  const profileDir = mkdtempSync(join(tmpdir(), `locale-${String(port)}-`))
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer',
    `--remote-debugging-port=${String(port)}`, '--remote-allow-origins=*',
    `--user-data-dir=${profileDir}`, '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' })

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

    let id = 0
    const pending = new Map()
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      const waiting = message.id === undefined ? undefined : pending.get(message.id)
      if (waiting === undefined) return
      pending.delete(message.id)
      if (message.error !== undefined) waiting.reject(new Error(message.error.message))
      else waiting.resolve(message.result)
    })
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      id += 1
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

    await send('Page.enable')
    await send('Runtime.enable')
    if (languages !== undefined) {
      await send('Emulation.setUserAgentOverride', { userAgent: CHROME_UA, acceptLanguage: languages })
    }
    await send('Page.navigate', { url: hostUrl })
    await sleep(4000)
    const read = async expression => (await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    })).result?.value
    const answer = {
      askedFor: languages ?? '(nothing — what the walkthrough sends)',
      languages: await read('navigator.languages'),
      placeholder: await read(PLACEHOLDER),
    }
    ws.close()
    return answer
  } finally {
    chrome.kill()
    await sleep(400)
    try { rmSync(profileDir, { recursive: true, force: true }) } catch { /* still writing */ }
  }
}

const withoutLanguage = await composerFor(9468, undefined)
const asTheAuthor = await composerFor(9469, 'zh-CN,zh;q=0.9,en;q=0.8')
console.log(JSON.stringify({ withoutLanguage, asTheAuthor }, null, 1))

const placeholder = asTheAuthor.placeholder ?? ''
process.exitCode = placeholder.includes('描述') && !placeholder.includes('Describe what you want to build')
  ? 0
  : 1
