import { defineConfig } from 'tsdown'
import { createRequire } from 'node:module'

const packageId = '@novel-agent/novel-workbench'
const platformModules = new Set(['react', 'react/jsx-runtime'])

/**
 * graphology imports the `events` package, which a browser bundle resolves to a
 * Node built-in unless it is pointed at the npm shim. The client module system
 * seeds no built-ins, so the shim has to travel inside this bundle.
 */
const eventsShim = createRequire(import.meta.url).resolve('events/events.js')

/** Emit the same lazy-CJS client artifact shape consumed by DSH ClientModuleSystem. */
export default defineConfig({
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  alias: { events: eventsShim },
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
