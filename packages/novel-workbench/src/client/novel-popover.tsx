/**
 * 浮层: the anchored menu surfaces open through this, the way modals open
 * through `NovelDialog`.
 *
 * The editor's `···` menu was a `<details>`, which is a disclosure — it opens,
 * and then it stays open until the author finds the summary again. Clicking the
 * page does not dismiss it, Escape does not dismiss it, and picking an action
 * leaves it hanging over the editor behind the panel that action just opened.
 * A menu needs dismissal; a disclosure does not have any.
 *
 * Radix's `Popover` (MIT) supplies the dismissal, the anchored positioning and
 * the `aria-haspopup` / `aria-expanded` wiring on the trigger. The look is the
 * frame's own, declared once here so every menu in the product is the same
 * object.
 */
import * as RadixPopover from '@radix-ui/react-popover'
import { createElement, type ComponentProps, type ReactNode } from 'react'

/** One look for every anchored menu. */
export const POPOVER_CSS = `
.nv-popover {
  z-index: 42;
  min-width: 160px;
  display: flex; flex-direction: column; gap: var(--s1);
  padding: var(--s2);
  background: hsl(var(--bg-000));
  border: 1px solid hsl(var(--border-100));
  border-radius: var(--r-card);
  box-shadow: var(--sh-2);
  animation: nv-popover-in var(--t-fast) cubic-bezier(.2, 0, 0, 1);
}
/*
 * Dismissed, the panel is hidden rather than destroyed, which is the one place
 * this differs from the dialog. The panel reports state — 「已交给 AI 起草提案」,
 * the refine outcome — and keeping it mounted means that state has one home
 * instead of being rebuilt on every open. Hiding it is what makes it invisible
 * to the tab order and the accessibility tree; Radix still owns the dismissal,
 * the focus and the aria-expanded on the trigger.
 */
.nv-popover[data-state="closed"] { display: none; }
/* A menu is a stack of full-width choices, not a row of buttons. */
.nv-popover .btn { width: 100%; text-align: left; }
@keyframes nv-popover-in { from { opacity: 0; transform: translateY(-4px); } }
`

/** Everything a menu surface hands the primitive. */
export interface NovelPopoverProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** The control that opens the menu; it carries the button, the primitive adds the aria. */
  readonly trigger: ReactNode
  /** What the menu is, for assistive tech. */
  readonly label: string
  readonly align?: 'start' | 'center' | 'end'
  /** The surface's own automation hooks, spread onto the menu. */
  readonly attrs?: Readonly<Record<string, string>>
  readonly children?: ReactNode
}

/** The anchored menu. Renders nothing but its trigger while closed. */
export function NovelPopover(props: NovelPopoverProps): ReactNode {
  return createElement(
    RadixPopover.Root,
    { open: props.open, onOpenChange: props.onOpenChange },
    createElement(RadixPopover.Trigger, { asChild: true, key: 'trigger' }, props.trigger),
    createElement(
      RadixPopover.Content,
      {
        key: 'menu',
        className: 'nv-popover',
        'data-novel-popover': 'true',
        'aria-label': props.label,
        side: 'bottom',
        align: props.align ?? 'end',
        sideOffset: 6,
        // The panel stays mounted while dismissed; see the closed rule in the
        // stylesheet for why, and what keeps it out of sight.
        forceMount: true,
        ...props.attrs,
      } as ComponentProps<typeof RadixPopover.Content>,
      props.children,
    ),
  )
}
