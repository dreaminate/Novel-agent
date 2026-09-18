/**
 * Whether this machine can paint the story map at all.
 *
 * sigma.js draws on WebGL and does not fail politely where there is none: it reads
 * `blendFunc` off a null context and throws from deep inside its own module, which
 * takes the canvas down with it. Asking first turns that crash into a card the
 * author can act on.
 *
 * The probe is deliberately cheap and side-effecting-free — one throwaway canvas,
 * no renderer, nothing kept. It answers "no" both for a null context and for a
 * browser that throws on the call itself (older engines do that rather than
 * returning null), because from the author's seat those are the same machine.
 */
export function probeWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) !== null
  } catch {
    return false
  }
}
