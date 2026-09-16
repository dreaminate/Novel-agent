/**
 * Installs the ported prototype stylesheet while the frame is mounted.
 *
 * The frame markup keeps the prototype's class names, so the stylesheet has to
 * be present exactly once and must disappear with the bundle. Both the token
 * sheet and the host's own theme variables reach the frame through this tag and
 * through the `data-nw-theme` attribute the frame sets.
 */
import { createElement, useEffect, type ReactNode } from 'react'
import { WORKBENCH_CSS } from './workbench-css.js'

/** The stylesheet tag the frame owns; removed when the bundle unloads. */
export function WorkbenchStyleSheet(): ReactNode {
  useEffect(() => () => {
    document.querySelector('style[data-novel-workbench="css"]')?.remove()
  }, [])
  return createElement('style', { 'data-novel-workbench': 'css' }, WORKBENCH_CSS)
}
