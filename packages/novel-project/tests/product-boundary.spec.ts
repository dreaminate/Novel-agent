import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceRoot = join(import.meta.dirname, '..', '..', '..')

describe('novel-agent product boundary', () => {
  it('uses the Host ToolRuntime peer instead of installing another scheduler module', () => {
    for (const name of ['novel-project', 'novel-review', 'novel-memory', 'novel-writing']) {
      const manifest = JSON.parse(readFileSync(join(workspaceRoot, 'packages', name, 'package.json'), 'utf8'))
      expect(manifest.dependencies, name).not.toHaveProperty('@deepseek-ai/dsh-tools')
      expect(manifest.peerDependencies?.['@deepseek-ai/dsh-tools'], name).toBe('0.1.2-rc.1')
      expect(manifest.devDependencies?.['@deepseek-ai/dsh-tools'], name).toBe('0.1.2-rc.1')
    }
  })

  it('ships domain plugins with the necessary frontend and leaves generic surfaces external', () => {
    const rootManifest = JSON.parse(
      readFileSync(join(workspaceRoot, 'package.json'), 'utf8'),
    ) as {
      readonly scripts?: Readonly<Record<string, string>>
      readonly devDependencies?: Readonly<Record<string, string>>
    }
    const rootTsconfig = JSON.parse(
      readFileSync(join(workspaceRoot, 'tsconfig.json'), 'utf8'),
    ) as { readonly references?: readonly { readonly path?: string }[] }
    const workspace = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8')
    const novelProjectManifest = JSON.parse(
      readFileSync(join(workspaceRoot, 'packages', 'novel-project', 'package.json'), 'utf8'),
    ) as { readonly dependencies?: Readonly<Record<string, string>> }

    expect(rootManifest.scripts?.['test:focused'])
      .toBe('vitest run packages/novel-project/tests')
    expect(rootTsconfig.references).toEqual([
      { path: './packages/novel-project' },
      { path: './packages/novel-planning' },
      { path: './packages/novel-writing' },
      { path: './packages/novel-memory' },
      { path: './packages/novel-review' },
      { path: './packages/novel-workbench' },
    ])
    expect(workspace).toContain('  - packages/novel-project')
    expect(workspace).toContain('  - packages/novel-planning')
    expect(workspace).toContain('  - packages/novel-writing')
    expect(workspace).toContain('  - packages/novel-memory')
    expect(workspace).toContain('  - packages/novel-review')
    expect(workspace).toContain('  - packages/novel-workbench')
    expect(workspace).not.toContain('  - packages/*')
    expect(workspace).not.toContain('node-pty')
    expect(rootManifest.devDependencies).not.toHaveProperty('@playwright/test')

    const vitestConfig = readFileSync(join(workspaceRoot, 'vitest.config.ts'), 'utf8')
    expect(vitestConfig).not.toContain('@deepseek-ai/dsh-client-web')
    expect(vitestConfig).not.toContain('@deepseek-ai/dsh-client-ui-primitives')

    expect(existsSync(join(workspaceRoot, 'packages', 'novel-web-tabs', 'package.json')))
      .toBe(false)
    expect(existsSync(join(workspaceRoot, 'packages', 'novel-tui-extension', 'package.json')))
      .toBe(false)

    // The novel-mode front end owns the root slot and disables the shipped
    // frame; those two facts are the whole reason the package exists.
    const workbenchPatch = readFileSync(
      join(workspaceRoot, 'packages', 'novel-workbench', 'cordis.patch.yml'),
      'utf8',
    )
    expect(workbenchPatch).toContain('- id: ui-layout')
    expect(workbenchPatch).toContain('disabled: true')
    const workbenchClient = readFileSync(
      join(workspaceRoot, 'packages', 'novel-workbench', 'src', 'client', 'index.tsx'),
      'utf8',
    )
    expect(workbenchClient).toContain("name: 'root'")
    expect(workbenchClient).toContain("'shell.overlay'")

    expect(novelProjectManifest.dependencies).not.toHaveProperty('dsh-better-sidebar')
    expect(novelProjectManifest.dependencies).not.toHaveProperty('@xmoon76/dsh-pi-tui')
  })

  it('does not retain retired generic implementation packages in the checkout', () => {
    for (const packageName of [
      'client-ui-tasks',
      'desktop-asset-origin',
      'desktop-carrier',
      'desktop-ipc-transport',
      'desktop-profile',
      'desktop-terminal-runtime',
      'desktop-workbench',
    ]) {
      expect(existsSync(join(workspaceRoot, 'packages', packageName)), packageName).toBe(false)
    }
  })

  it('documents Better Sidebar and Pi TUI as external downloads, not local adapters', () => {
    const currentArchitectureFiles = [
      'README.md',
      join('tasks', 'plan.md'),
      join('tasks', 'todo.md'),
      join('docs', 'architecture.md'),
      join('docs', 'claude-desktop-parity-matrix.md'),
    ]

    for (const file of currentArchitectureFiles) {
      const text = readFileSync(join(workspaceRoot, file), 'utf8')
      expect(text, file).not.toContain('@novel-agent/novel-web-tabs')
      expect(text, file).not.toContain('novel-tui-extension')
    }

    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8')
    expect(readme).toContain('dsh-better-sidebar@0.16.1')
    expect(readme).toContain('--allow-build=node-pty')
    expect(readme).toContain('@xmoon76/dsh-pi-tui@0.3.4')
    expect(readme).toMatch(
      /dsh plugin --profile \S+ add dsh-git-worktree@0\.6\.0/,
    )
    expect(readme).toContain('packages\\novel-project')
  })

  it('leaves official state-provider mounting to the selected DSH profile', () => {
    const manifest = JSON.parse(
      readFileSync(join(workspaceRoot, 'packages', 'novel-project', 'package.json'), 'utf8'),
    ) as { readonly dependencies?: Readonly<Record<string, string>> }
    const bundlePatch = readFileSync(
      join(workspaceRoot, 'packages', 'novel-project', 'cordis.patch.yml'),
      'utf8',
    )

    for (const packageName of [
      '@deepseek-ai/dsh-storage',
      '@deepseek-ai/dsh-storage-json',
      '@deepseek-ai/dsh-storage-domain',
      '@deepseek-ai/dsh-workspace',
    ]) {
      expect(manifest.dependencies?.[packageName], packageName).toBe('0.1.2-rc.1')
      expect(bundlePatch, packageName).not.toContain(`name: '${packageName}'`)
    }

    expect(bundlePatch).not.toContain('@deepseek-ai/dsh-web-app')
    expect(bundlePatch).not.toContain('dsh-better-sidebar')
    expect(bundlePatch).not.toContain('@xmoon76/dsh-pi-tui')
    expect(bundlePatch.match(/^[ \t]*- id:/gm)).toEqual(['    - id:'])
    expect(bundlePatch).toContain("name: '@novel-agent/novel-project'")

    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8')
    expect(readme).toContain('DSH_HOME\\profiles\\pi-tui\\cordis.patch.yml')
    expect(readme).toContain("name: '@deepseek-ai/dsh-storage-domain'")
    expect(readme).toContain("name: '@deepseek-ai/dsh-workspace'")
  })

  it('keeps the Host aggregate required by DSH Typert generation', () => {
    const hostConfigPath = join(workspaceRoot, 'tsconfig.host.json')
    expect(existsSync(hostConfigPath)).toBe(true)

    const hostConfig = JSON.parse(readFileSync(hostConfigPath, 'utf8')) as {
      readonly references?: readonly { readonly path?: string }[]
    }
    expect(hostConfig.references).toEqual([
      { path: './packages/novel-project/tsconfig.typert.json' },
    ])
  })

  it('keeps every generated Typert invocation on the single novelProject service namespace', async () => {
    interface Descriptor {
      readonly id: string
      readonly service: string
      readonly namespace: string
      readonly method: string
      readonly parameters: readonly { readonly name: string; readonly wire: string }[]
      readonly result: { readonly typeSymbol: string }
    }
    const { TYPERT } = await import('@novel-agent/novel-project/typert') as unknown as {
      readonly TYPERT: {
        readonly package: string
        readonly face: string
        readonly invocations: readonly Descriptor[]
      }
    }
    const { default: novelProjectRemote } = await import('@novel-agent/novel-project/remote') as unknown as {
      readonly default: {
        readonly package: string
        readonly descriptors: readonly Descriptor[]
      }
    }

    expect(TYPERT.package).toBe('@novel-agent/novel-project')
    expect(TYPERT.face).toBe('host')
    expect(novelProjectRemote.package).toBe('@novel-agent/novel-project')
    // 19 since `continueWriting` joined the boundary: the editor's paragraph
    // continuation (the author's beats in, prose out) is asked with the agent's
    // own model route, and there is no llm Remote a client plugin can reach, so
    // it rides this same namespace rather than a second transport. 18 before it,
    // when `completeSentence` joined for the same reason; 17 when
    // `readChapterFile`/`writeChapterFile` joined, because the editor's draft
    // files have no fs Remote a client plugin can reach either; 15 before them,
    // when `chapterControlPack` joined for the 本章合同 canvas.
    expect(TYPERT.invocations).toHaveLength(19)
    for (const invocation of TYPERT.invocations) {
      expect(invocation.service).toBe('novelProject')
      expect(invocation.namespace).toBe(invocation.service)
      expect(invocation.id).toBe(`@novel-agent/novel-project#${invocation.namespace}/${invocation.method}`)
    }
    const shape = (descriptor: Descriptor) => ({
      id: descriptor.id,
      service: descriptor.service,
      namespace: descriptor.namespace,
      method: descriptor.method,
      parameters: descriptor.parameters.map(parameter => [parameter.name, parameter.wire]),
      result: descriptor.result.typeSymbol,
    })
    expect(novelProjectRemote.descriptors.map(shape)).toEqual(TYPERT.invocations.map(shape))
  })
})
