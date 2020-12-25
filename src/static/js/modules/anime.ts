/**
 * @file AnimeJS wrapper for Svelte.
 * @author Monkatraz
 */

// Imports
import anime, { AnimeParams } from 'animejs'
import { animationFrame } from './util'

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
  return () => {
    const anim = anime(safeOpts);
    // makes sure that the animation doesn't conflict on top of other ones
    (async () => {
      await animationFrame()
      anime.remove(elem)
      await animationFrame()
      requestAnimationFrame(anim.play)
    })()
    return {
      delay: anim.delay,
      duration: anim.duration
    }
  }
}

/** Function for running an Anime animation on an event. */
export function evAnime(opts: AnimeParams) {
  return (event: Event) => {
    if (!event?.target) return
    const safeOpts = { ...opts, targets: event.target, autoplay: true }
    return anime(safeOpts)
  }
}