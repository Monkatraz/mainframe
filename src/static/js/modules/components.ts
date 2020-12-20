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
  autoplay: false,
  loop: false
}
/** Creates a transition function using animejs.
 *  Use with `in:fn` and `out:fn`, as this function can't tell direction.
*/
export function tnAnime(elem: Element, opts: AnimeParams) {
  const safeOpts = { ...opts, ...TNANIME_FORCED_OPTS, targets: elem }

  const anim = anime(safeOpts)
  const delay = opts?.delay ?? 0
  const duration = anim.duration

  return () => {
    anim.play()
    return {
      delay,
      duration
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