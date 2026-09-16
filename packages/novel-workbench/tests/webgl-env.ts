/**
 * jsdom defines no WebGL runtime, while sigma's module scope reads those global
 * constructors as soon as it loads. Specs that import the client plugin (and so
 * the story-map module) only need the module graph to evaluate; the one spec
 * that actually exercises the map mocks sigma instead.
 */
globalThis.WebGL2RenderingContext ??= class WebGL2RenderingContextStub {} as never
globalThis.WebGLRenderingContext ??= class WebGLRenderingContextStub {} as never
