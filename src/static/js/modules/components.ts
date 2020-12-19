/**
 * @file Library for Svelte components.
 * @author Monkatraz
 */

// Imports
import anime, { AnimeParams } from 'animejs'

/** Runs the provided function as soon as the attached element is created. */
export function load(elem: Element, fn: (arg: Element) => void) {
  fn(elem)
}

// -------
//  ANIME

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