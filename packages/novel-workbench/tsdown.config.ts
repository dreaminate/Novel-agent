import { defineConfig } from 'tsdown'
import { createRequire } from 'node:module'

const packageId = '@novel-agent/novel-workbench'

/**
 * Modules the DSH client module system already provides, so they must stay
 * external. `react-dom` and `react-dom/client` belong here too: the official
 * `dsh-client-ui-renderer` bundle requires all four by bare specifier, which
 * only works if the loader's module table supplies them. Omitting them was
 * harmless until the editor stack arrived, because nothing else in this bundle
 * imported react-dom — `@tiptap/react` does, and it silently duplicated React
 * DOM and its scheduler into `lib/client.js`.
 */
const platformModules = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
])

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
  /**
   * `@tiptap/react` reaches `use-sync-external-store`, whose ESM shim branches on
   * `process.env.NODE_ENV` at module scope. The client module system seeds no
   * Node globals, so leaving it unresolved makes the whole bundle throw
   * `process is not defined` at import — every surface disappears, not just the
   * editor. Substituting the constant is the ordinary browser-bundle answer and
   * also drops the development branches.
   */
  define: { 'process.env.NODE_ENV': '"production"' },
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
