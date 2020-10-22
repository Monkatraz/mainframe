/**
 * @file Library for Svelte components, such as `use` actions and the like.
 * @author Monkatraz
 */

// Imports
import tippy, { Props as TippyProps, roundArrow as TippyRoundArrow } from 'tippy.js'
import { followCursor as TippyFollowCursor } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/svg-arrow.css'
import 'tippy.js/animations/scale.css'

const DEFAULT_TIPPY_OPTS: Partial<TippyProps> = {
  ignoreAttributes: true,
  theme: 'mainframe',
  arrow: TippyRoundArrow,
  animation: 'scale',
  inertia: true,
  touch: ['hold', 200],
  duration: 75,
  followCursor: 'horizontal',
  plugins: [TippyFollowCursor]
}
/** Creates a tippy.js instance for the element. */
export function uTip(elem: Element, opts: Partial<TippyProps> = {}) {
  opts = Object.assign(opts, DEFAULT_TIPPY_OPTS)
  const tp = tippy(elem, opts)
  return { destroy() { tp.destroy() } }
}