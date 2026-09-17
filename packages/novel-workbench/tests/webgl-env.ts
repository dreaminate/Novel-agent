/**
 * Browser globals jsdom does not define.
 *
 * jsdom has no WebGL runtime, while sigma's module scope reads those global
 * constructors as soon as it loads. Specs that import the client plugin (and so
 * the story-map module) only need the module graph to evaluate; the one spec
 * that actually exercises the map mocks sigma instead.
 *
 * jsdom also has no ResizeObserver, which the frame uses to measure the seat the
 * host gives it. The stub is enough for everything except learning a real width —
 * that is what the browser sweep and the narrow-window probe are for.
 */
globalThis.WebGL2RenderingContext ??= class WebGL2RenderingContextStub {} as never
globalThis.WebGLRenderingContext ??= class WebGLRenderingContextStub {} as never
globalThis.ResizeObserver ??= class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
} as never
// Pointer capture is how a column drag keeps receiving moves after the pointer
// leaves the handle. jsdom has neither method; the drag logic under test does
// not depend on what they do.
Element.prototype.setPointerCapture ??= function setPointerCapture(): void {}
Element.prototype.releasePointerCapture ??= function releasePointerCapture(): void {}
