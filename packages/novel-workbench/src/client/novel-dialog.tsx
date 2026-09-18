/**
 * 对话框: the one modal primitive every surface in the frame opens through.
 *
 * Before this, each surface carried its own answer to the same four questions —
 * does it take focus, does Tab stay inside, does Escape close it, does the page
 * behind it go quiet — and they did not all answer alike. The last one was wrong
 * everywhere: `aria-modal="true"` is a promise that the rest of the page is
 * inert, and nothing was making it true, so a screen reader went on reading the
 * rail and the transcript underneath the sheet.
 *
 * The behaviour is Radix's `Dialog` (MIT): focus scope, Escape, outside-pointer
 * dismissal, scroll lock and the `aria-hidden` on everything else. The look is
 * this product's own — the workbench has its own token sheet and no Tailwind, so
 * shadcn/ui's component source, which is Tailwind classes over those same Radix
 * primitives, would have brought a second styling system to be translated back
 * into ours. Taking the primitive and writing the arrangement is the same
 * decision without the translation layer.
 *
 * Where it renders: in place, not through a portal. The overlay seat already
 * sits above the three columns and the frame's own tokens hang off an ancestor
 * of it, so a portal would move the panel without moving it relative to anything
 * the author sees — and would take the surface out of the subtree every
 * selector in the specs and the smoke already walks. Radix behaves the same
 * either way; `aria-hidden` is applied to whatever is outside the panel.
 */
import * as RadixDialog from '@radix-ui/react-dialog'
import { createElement, useRef, type ComponentProps, type ElementType, type ReactNode } from 'react'

/**
 * One look for every arrangement. The panel, its scrim and its two states are
 * declared once so the sheet and the drawer cannot drift: only where the panel
 * sits and which edge it is anchored to differ between them.
 */
export const DIALOG_CSS = `
.nv-dialog-scrim {
  position: absolute; inset: 0; z-index: 40;
  background: hsl(var(--text-000) / .18);
}
.nv-dialog-content {
  position: absolute; z-index: 41;
  background: hsl(var(--bg-000));
  border: 1px solid hsl(var(--border-100));
  border-radius: var(--r-card);
  box-shadow: var(--sh-3);
  padding: var(--s5);
  animation: nv-dialog-in var(--t-base) cubic-bezier(.2, 0, 0, 1);
}
.nv-dialog-content[data-state="closed"] { animation: nv-dialog-out var(--t-fast) ease-in forwards; }
/* Both arrangements leave the same way they arrived, from the same curve. */
.nv-dialog-content[data-novel-dialog="sheet"] {
  top: 84px; left: 0; right: 0; margin: 0 auto;
  width: min(520px, calc(100% - 48px));
  max-height: calc(100% - 120px); overflow-y: auto;
}
.nv-dialog-content[data-novel-dialog="drawer"] {
  top: 0; right: 0; bottom: 0; left: auto;
  width: min(420px, 100%);
  border-radius: 0; border-top: 0; border-right: 0; border-bottom: 0;
  overflow-y: auto;
  animation-name: nv-drawer-in;
}
.nv-dialog-content[data-novel-dialog="drawer"][data-state="closed"] { animation-name: nv-dialog-out; }
.nv-dialog-head {
  display: flex; align-items: center; gap: var(--s2);
  margin-bottom: var(--s4);
}
.nv-dialog-title { margin: 0; font-size: var(--fs-16); letter-spacing: 0; }
.nv-dialog-head .btn { margin-left: auto; }
@keyframes nv-dialog-in { from { opacity: 0; transform: translateY(6px); } }
@keyframes nv-drawer-in { from { opacity: .6; transform: translateX(16px); } }
@keyframes nv-dialog-out { to { opacity: 0; transform: translateY(6px); } }
`

/** Everything a dialog surface hands the primitive. */
export interface NovelDialogProps {
  readonly open: boolean
  /** Called for every dismissal the primitive owns: Escape, the scrim, the close button. */
  readonly onClose: () => void
  /** What the surface is, for assistive tech. */
  readonly label: string
  /** The heading the author reads; also the dialog's accessible name. */
  readonly title: ReactNode
  /** Where the panel sits. Sheet centers near the top, drawer slides in from the right. */
  readonly shape: 'sheet' | 'drawer'
  readonly closeLabel?: string
  /** Anything shown beside the title — a faction chip, a status. */
  readonly badge?: ReactNode
  /**
   * The surface's own automation hooks, spread onto the panel — the selectors
   * the specs and the smoke script already reach for. The caller owns them; the
   * primitive only promises they land on the element that is the dialog.
   */
  readonly surfaceAttrs?: Readonly<Record<string, string>>
  /** The same, for the close button. */
  readonly closeAttrs?: Readonly<Record<string, string>>
  readonly children?: ReactNode
}

/**
 * Radix's prop types admit no `data-*`, but the surfaces' automation hooks are
 * deliberately data attributes. The cast is the seam between the two.
 */
type RadixProps<T extends ElementType> = ComponentProps<T>

/** The modal. Renders nothing while closed, the way its callers already relied on. */
export function NovelDialog(props: NovelDialogProps): ReactNode {
  /**
   * Who opened this, so the keyboard comes back to them.
   *
   * Radix restores focus to its own `Trigger`, and none of these surfaces has
   * one: the author opens the sheet from the topbar and the drawer from a map
   * node, both outside the dialog. So the opener is read here, during the render
   * that turns `open` on — before the commit that moves focus into the panel —
   * and handed back on the way out. Reading it in an effect would be too late;
   * by then the panel already holds focus.
   */
  const opener = useRef<HTMLElement | null>(null)
  // Starts false rather than at `props.open`, so a surface that mounts already
  // open — a spec that renders the sheet straight into its open state — still
  // reads who had the keyboard.
  const wasOpen = useRef(false)
  if (props.open && !wasOpen.current) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }
  wasOpen.current = props.open

  return createElement(
    RadixDialog.Root,
    {
      open: props.open,
      onOpenChange: (next: boolean) => { if (!next) props.onClose() },
    },
    createElement(
      RadixDialog.Overlay,
      {
        key: 'scrim',
        className: 'nv-dialog-scrim',
        'data-novel-dialog-overlay': 'true',
      } as RadixProps<typeof RadixDialog.Overlay>,
    ),
    createElement(
      RadixDialog.Content,
      {
        key: 'panel',
        className: 'nv-dialog-content',
        'data-novel-dialog': props.shape,
        'aria-label': props.label,
        // The heading names the dialog; the body is prose the author reads, not
        // a description of the dialog, so there is nothing to point at.
        'aria-describedby': undefined,
        // Radix would put focus back on a trigger it never had, which leaves it
        // on the body — the same lost keyboard the hand-rolled trap was written
        // to avoid. Claim the event and return it to the opener instead.
        onCloseAutoFocus: (event: Event) => {
          event.preventDefault()
          const element = opener.current
          if (element !== null && document.contains(element)) element.focus()
        },
        ...props.surfaceAttrs,
      } as RadixProps<typeof RadixDialog.Content>,
      createElement(
        'div',
        { className: 'nv-dialog-head', key: 'head' },
        createElement(RadixDialog.Title, { className: 'nv-dialog-title' }, props.title),
        props.badge ?? null,
        createElement(
          RadixDialog.Close,
          {
            className: 'btn sm',
            'data-novel-dialog-close': 'true',
            ...props.closeAttrs,
          } as RadixProps<typeof RadixDialog.Close>,
          props.closeLabel ?? '完成',
        ),
      ),
      props.children,
    ),
  )
}
