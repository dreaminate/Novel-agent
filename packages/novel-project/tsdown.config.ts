import { defineConfig } from 'tsdown'

const packageId = '@novel-agent/novel-project'
const platformModules = new Set(['react', 'react/jsx-runtime'])

/** Emit the same lazy-CJS client artifact shape consumed by DSH ClientModuleSystem. */
export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2023',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: id => platformModules.has(id),
    alwaysBundle: id => !platformModules.has(id),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(packageId)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
