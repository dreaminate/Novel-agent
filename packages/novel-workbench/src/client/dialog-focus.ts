/**
 * Focus handling for the modal surfaces the frame renders itself — the 设置 sheet
 * and the 人物档案 drawer.
 *
 * Both already declare `role="dialog" aria-modal="true"`, and that is a promise:
 * a dialog that does not take focus, does not hold Tab inside itself, and does
 * not hand focus back is one the keyboard cannot use. In the shipped host the
 * stakes are higher than usual, because Tab out of our overlay does not walk
 * into more of our own UI — it walks into whichever plugin is mounted behind us.
 *
 * One hook rather than two implementations, for the same reason there is one
 * frame: the second modal surface must not grow its own keyboard rules.
 */
import { useEffect, type RefObject } from 'react'

/**
 * What Tab can reach inside a dialog. Kept as a selector rather than a filter
 * over every element so the list matches what a browser would actually walk.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),'
  + ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(root: HTMLElement): readonly HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter(node => node.tabIndex >= 0)
}

/**
 * Move focus into `dialog` on mount, cycle Tab within it, and put focus back
 * where it was on unmount.
 *
 * `active` is the dialog's own open flag: both surfaces stay mounted and render
 * nothing while closed, so the effect has to re-run when the element appears
 * rather than only when the ref object is created.
 */
export function useDialogFocus(dialog: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const element = dialog.current
    if (!active || element === null) return
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null
    focusables(element)[0]?.focus()

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return
      const items = focusables(element)
      const first = items[0]
      const last = items[items.length - 1]
      if (first === undefined || last === undefined) return
      const active = document.activeElement
      const inside = active instanceof HTMLElement && element.contains(active)
      // Wrap at the ends, and catch focus that has escaped to the page behind:
      // both would otherwise hand the next Tab to something outside the dialog.
      const leaving = event.shiftKey ? active === first || !inside : active === last || !inside
      if (!leaving) return
      event.preventDefault()
      ;(event.shiftKey ? last : first).focus()
    }
    // On the document rather than the dialog: a trap attached to the element
    // cannot see a Tab that starts outside it, and "focus ended up outside" is
    // exactly the case that has to be caught.
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      // The author may have navigated somewhere that removed the opener while
      // the dialog was up, so only restore what is still in the document.
      if (restore !== null && document.contains(restore)) restore.focus()
    }
  }, [dialog, active])
}
