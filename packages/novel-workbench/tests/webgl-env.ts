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
// ProseMirror measures the caret with `getClientRects` / `getBoundingClientRect`
// whenever a transaction moves the selection and scrolls it into view. jsdom has
// no layout and implements neither on the two targets ProseMirror probes: an
// element, and a Range when the caret sits inside a text node. Without them the
// call throws out of band and fails the whole run; with them ProseMirror simply
// measures zero, which is what a real browser reports for a detached node.
function noClientRects(): DOMRectList {
  return [] as unknown as DOMRectList
}
function zeroRect(): DOMRect {
  return {
    x: 0, y: 0, top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0,
    toJSON: () => ({}),
  } as unknown as DOMRect
}
Element.prototype.getClientRects ??= noClientRects
Range.prototype.getClientRects ??= noClientRects
Range.prototype.getBoundingClientRect ??= zeroRect
