import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The approval surface belongs to DSH, not to this package.
 *
 * Phase 1 of the editor-first rework originally planned to build an approval
 * card here, on the belief that the only official approval UI came from
 * `ui-chat`, which this package's bundle patch disables. That belief was wrong.
 * The host ships `@deepseek-ai/dsh-client-ui-approval`; it is loaded, this patch
 * does not disable it, and it is the answerer on the `approval/request`
 * waterfall. A real approval was then driven end to end: the shipped panel
 * renders inside this frame, shows the target and the reason, approves, and
 * rejects.
 *
 * These assertions pin that ownership, so a later change cannot quietly grow a
 * second approval mechanism next to the working one.
 */
const packageRoot = fileURLToPath(new URL('..', import.meta.url))

/** Every TypeScript source file in this package. */
function sourceFiles(): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap(entry => {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) return walk(path)
      return /\.tsx?$/.test(entry) ? [path] : []
    })
  return walk(join(packageRoot, 'src'))
}

describe('approval ownership', () => {
  it('answers no approval waterfall of its own', () => {
    const offenders = sourceFiles()
      .filter(file => readFileSync(file, 'utf8').includes('approval/request'))
      .map(file => file.slice(packageRoot.length))

    expect(offenders).toEqual([])
  })

  it('declares no approval seat of its own', () => {
    const offenders = sourceFiles()
      .filter(file => readFileSync(file, 'utf8').includes('conversation.approval'))
      .map(file => file.slice(packageRoot.length))

    expect(offenders).toEqual([])
  })

  it('keeps the shipped approval bundle enabled', () => {
    const patch = readFileSync(join(packageRoot, 'cordis.patch.yml'), 'utf8')
    const disabled = [...patch.matchAll(/-\s*id:\s*(\S+)\s*\n\s*disabled:\s*true/g)]
      .map(match => match[1])

    expect(disabled).not.toContain('ui-approval')
  })
})
