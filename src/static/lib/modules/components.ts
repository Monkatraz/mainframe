/**
 * @file AnimeJS wrapper for Svelte.
 * @author Monkatraz
 */

// -- Imports
// Tippy
import tippy, { Props as TippyProps } from 'tippy.js'
import { roundArrow as TippyRoundArrow } from 'tippy.js'
// Anime
import anime, { AnimeParams } from 'animejs'
import { animationFrame } from './util'


const DEFAULT_TIPPY_OPTS: Partial<TippyProps> = {
  ignoreAttributes: true,
  theme: 'mainframe',
  arrow: TippyRoundArrow,
  animation: 'scale',
  touch: ['hold', 600],
  duration: [50, 100],
  delay: [400, 50]
}

function parseTipOpts(elem: Element, opts: Partial<TippyProps> | string) {
  if (opts) {
    if (typeof opts === 'string')
      opts = { content: opts }
    else if (!opts.content) {
      if (elem.hasAttribute('aria-label'))
        opts.content = elem.getAttribute('aria-label')!
      else
        opts.content = '(unknown)'
    }
  } else {
    if (elem.hasAttribute('aria-label'))
      opts = { content: elem.getAttribute('aria-label')! }
    else
      opts = { content: '(unknown)' }
  }
  return opts
}

/** Creates a Tippy tooltip instance for the element. */
export function tip(elem: Element, opts: Partial<TippyProps> | string = '') {
  opts = parseTipOpts(elem, opts)
  const finalOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
  const tp = tippy(elem, finalOpts)
  return {
    update(opts: Partial<TippyProps> | string = '') {
      opts = parseTipOpts(elem, opts)
      const newOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
      tp.setProps(newOpts)
    },
    destroy() {
      tp.destroy()
    }
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