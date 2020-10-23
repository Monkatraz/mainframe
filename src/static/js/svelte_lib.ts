/**
 * @file Library and loader for Svelte components.
 * @author Monkatraz
 */

// Imports
import { ENV } from '@modules/util'
import tippy, { Props as TippyProps, roundArrow as TippyRoundArrow } from 'tippy.js'
import { followCursor as TippyFollowCursor } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/dist/svg-arrow.css'
import 'tippy.js/animations/scale.css'
import anime, { AnimeInstance, AnimeParams } from 'animejs'

// --------
// LOADER
// --------

// Component Types
import type { SvelteComponent } from 'svelte'
type LoadComponent = [id: string, comp: typeof SvelteComponent, selector: string, props: PlainObject]
// Component Imports
import Page from '@components/Page.svelte'
// Components list
const componentsToLoad: LoadComponent[] = [
  ['Page', Page, '#page', { path: ENV.HOMEPAGE }],
]
// Exported components list
export const Components: { [id: string]: SvelteComponent } = {}

/** Renders each component in the `components` list. */
function renderComponents() {
  componentsToLoad.forEach(([id, comp, selector, props]) => {
    const component = new comp({
      target: document.querySelector(selector) as Element,
      props: props
    })
    if (id) Components[id] = component
  })
}

document.addEventListener('DOMContentLoaded', renderComponents, { once: true })

// --------
// TIPPY
// --------

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
export function usTip(elem: Element, opts: Partial<TippyProps> = {}) {
  opts = Object.assign({}, DEFAULT_TIPPY_OPTS, opts)
  const tp = tippy(elem, opts)
  return { destroy() { tp.destroy() } }
}

// --------
// ANIM
// --------

/** Creates a function that will play an animejs animation. Specifically for use with Svelte `use:fn`. */
export function usAnime(opts: AnimeParams) {
  return (elem: Element) => {
    anime({
      targets: elem,
      ...opts
    })
  }
}

const SAFE_ANIME_OPTS: AnimeParams = {
  delay: 0,
  autoplay: false,
  loop: false
}
// TODO: Function that returns 2 functions [in, out] and handles the state between the two
// TODO: Figure out animejs layering
/** Creates a transition function using animejs. Use like any other Svelte transition function.
 *  An issue with this particular type of animejs wrapper is that you cannot have multiple animejs animations playing.
 *  They will conflict and act unusually.
 */
export function tnAnime(opts: AnimeParams) {
  return (elem: Element, inlineOpts: AnimeParams) => {
    // Set up options
    const runtimeOpts = { targets: elem }
    const userOpts = Object.assign({}, opts, inlineOpts)
    const safeOpts = Object.assign({}, userOpts, SAFE_ANIME_OPTS, runtimeOpts)
    // Create anim object
    const anim = anime(safeOpts)
    // We'll have Svelte handle delay
    const delay = userOpts?.delay ? userOpts.delay : 0
    const duration = anim.duration

    return {
      delay: delay as number,
      duration: duration,
      easing: (t: number) => t, // no easing, animejs does that
      tick: (t: number) => anim.tick(t * duration)
    }
  }
}

/** Function for running an Anime animation on an event. */
export function evAnime(opts: AnimeParams) {
  return (event: Event) => {
    if (!event?.target) return
    // Set up options
    const runtimeOpts = { targets: event.target, autoplay: true }
    const safeOpts = Object.assign({}, opts, runtimeOpts)
    // Execute animation
    return anime(safeOpts)
  }
}