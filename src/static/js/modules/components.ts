/**
 * @file Library for Svelte components.
 * @author Monkatraz
 */

// Imports
import { ENV } from '@modules/util'
import {
  Props as TippyProps,
  roundArrow as TippyRoundArrow,
  sticky as TippySticky,
  followCursor as TippyFollowCursor
} from 'tippy.js'
import tippy from 'tippy.js'
// TODO: Uncomment when Snowpack fixes dev proxy css bug
//import 'tippy.js/dist/tippy.css'
//import 'tippy.js/dist/svg-arrow.css'
//import 'tippy.js/animations/scale.css'
import anime, { AnimeParams } from 'animejs'

// --------
// TIPPY
// --------

const DEFAULT_TIPPY_OPTS: Partial<TippyProps> = {
  ignoreAttributes: true,
  theme: 'mainframe',
  arrow: TippyRoundArrow,
  animation: 'scale',
  touch: ['hold', 600],
  duration: [50, 100],
  delay: [400, 50],
  followCursor: 'horizontal',
  plugins: [TippyFollowCursor, TippySticky]
}
/** Creates a tippy.js instance for the element. */
export function usTip(elem: Element, opts: Partial<TippyProps> = {}) {
  const finalOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
  const tp = tippy(elem, finalOpts)
  return {
    update(opts: Partial<TippyProps>) {
      const newOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
      tp.setProps(newOpts)
    },
    destroy() {
      tp.destroy()
    }
  }
}

// --------
// ANIM
// --------

// TODO: Figure out animejs layering

export function elAnime(elem: Element, opts: AnimeParams) {
  return () => {
    anime({
      targets: elem,
      ...opts
    })
  }
}

/** Creates a function that will play an animejs animation. Specifically for use with Svelte `use:fn`. */
export function usAnime(opts: AnimeParams) {
  return (elem: Element) => {
    anime({
      targets: elem,
      ...opts
    })
  }
}

const TNANIME_FORCED_OPTS: AnimeParams = {
  delay: 0,
  autoplay: false,
  loop: false
}
/** Creates a transition function using animejs. Use like any other Svelte transition function.
 *  An issue with this particular type of animejs wrapper is that you cannot have multiple animejs animations playing.
 *  They will conflict and act unusually.
 */
export function tnAnime(opts: AnimeParams) {
  return (elem: Element, inlineOpts: AnimeParams) => {
    // Set up options
    const userOpts = { ...opts, ...inlineOpts }
    const safeOpts = { ...userOpts, ...TNANIME_FORCED_OPTS, targets: elem }
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
    const safeOpts = { ...opts, targets: event.target, autoplay: true }
    // Execute animation
    return anime(safeOpts)
  }
}