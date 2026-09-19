// @vitest-environment node
// I-P6: one token sheet, and every surface drawn from it.
//
// A12 asks for a single source of colour, type and spacing. The colour half is
// checkable without rendering anything: read the components and look for a
// colour that was written as a value instead of read as a token.
//
// The token sheet itself is `workbench-css.ts` — it is where the values are
// supposed to be — so it is not a file this checks. The map is the one
// documented exception, and it is named here rather than excused in prose:
// its palette encodes what a faction *is*, and Canon has no token for that.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const clientDir = fileURLToPath(new URL('../src/client', import.meta.url))

/** A colour written as a value: hex, rgb()/rgba(), or an hsl() with numbers. */
const LITERAL_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([0-9]|\bhsl\([0-9]/gu

/**
 * The map draws Canon's factions, and a faction's colour belongs to the
 * faction. Recorded in `docs/evidence/2026-09-19/benchmarks/obsidian-graph-params.json`.
 */
const ALLOWED = new Set(['StoryMapView.tsx'])

/** Comments talk about colour constantly — the detour this file records is one. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//gu, '').replace(/\/\/[^\n]*/gu, '')
}

const components = readdirSync(clientDir)
  .filter(name => name.endsWith('.tsx'))

describe('novel-mode colour, from one source (I-P6)', () => {
  it('finds components to check at all', () => {
    // A guard on the guard: a bad path would make the assertion below vacuous.
    expect(components.length).toBeGreaterThan(10)
  })

  it('writes colours as tokens, everywhere but the one named exception', () => {
    const offenders: string[] = []
    for (const name of components) {
      if (ALLOWED.has(name)) continue
      const source = withoutComments(readFileSync(join(clientDir, name), 'utf8'))
      for (const match of source.matchAll(LITERAL_COLOUR)) {
        offenders.push(`${name}: ${match[0]}`)
      }
    }
    expect(offenders).toStrictEqual([])
  })

  it('is the only place a colour value is written down', () => {
    const sheet = readFileSync(join(clientDir, 'workbench-css.ts'), 'utf8')
    // The token sheet defines the four background steps, the text steps and the
    // accent; every surface reads those names rather than a value.
    for (const token of ['--bg-000', '--bg-100', '--bg-200', '--bg-300',
      '--text-000', '--text-100', '--text-200', '--border-100', '--border-200',
      '--accent-brand', '--accent-text', '--ok', '--warn', '--err']) {
      expect(sheet).toContain(`${token}:`)
    }
    // And a night theme that redefines the same names rather than a second set.
    expect(sheet).toMatch(/data-nw-theme="night"/u)
  })

  it('keeps type and spacing on the same footing as colour', () => {
    const sheet = readFileSync(join(clientDir, 'workbench-css.ts'), 'utf8')
    for (const token of ['--font-ui', '--font-serif', '--font-mono',
      '--fs-12', '--fs-13', '--fs-14', '--fs-16',
      '--s1', '--s2', '--s3', '--s4', '--s5', '--s6',
      '--r-card', '--r-ctl', '--r-key',
      '--sh-1', '--sh-2', '--sh-3', '--t-fast', '--t-base']) {
      expect(sheet).toContain(`${token}:`)
    }
  })
})
