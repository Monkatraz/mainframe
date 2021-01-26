/**
 * @file Library used by Svelte components.
 * @author Monkatraz
 */

// -- Imports
// Tippy and Popper
import tippy, { Props as TippyProps } from 'tippy.js'
import { roundArrow as TippyRoundArrow } from 'tippy.js'
import * as Popper from '@popperjs/core'
// Anime
import anime, { AnimeParams } from 'animejs'
import { animationFrame } from './util'
import { writable } from 'svelte/store'

interface Toast {
  type: 'success' | 'danger' | 'warning' | 'info'
  message: string
  remove: () => void
}

/** A stored `Set` containing the currently visible toasts. */
export const toasts = writable<Set<Toast>>(new Set())

/** Displays a 'toast' notification to the user. Provide a `time` of `0` to prevent the notification
 *  from automatically closing. */
export function toast(type: 'success' | 'danger' | 'warning' | 'info', message: string, time = 5000) {
  const remove = () => { toasts.update((cur) => { cur.delete(toastData); return cur }) }
  const toastData = { type, message, remove }
  toasts.update(cur => cur.add(toastData))
  // delete message after timeout
  if (time) setTimeout(remove, time)
}

/** A Svelte use action that will 'portal' to the given target and append the element to that target.
 *  The target can either be a direct reference to the element, or a query selector string. */
export function portal(elem: Element, target: string | Element) {

  const update = (target: string | Element) => {
    let targetElem: Element | null

    if (typeof target === 'string')
      targetElem = document.querySelector(target)
    else targetElem = target

    if (targetElem) targetElem.appendChild(elem)
    else throw new Error('Invalid portal target!')
  }

  update(target)

  return {
    update,
    destroy() { if (elem.parentElement) elem.parentElement.removeChild(elem) }
  }
}

type PlacementOpts = { when?: boolean, pos: Popper.Placement, against: Element }

export function placement(elem: Element, opts: PlacementOpts) {
  let instance: Popper.Instance | undefined

  const update = ({ when = true, pos, against }: PlacementOpts) => {
    if (!when && instance) {
      instance.destroy()
      instance = undefined
    }
    else if (when && !instance && against)
      instance = Popper.createPopper(against, elem as HTMLElement, { placement: pos })
  }

  update(opts)

  return {
    update,
    destroy() {
      if (instance) instance.destroy()
    }
  }
}

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
    if (typeof opts === 'string') opts = { content: opts }
    else if (!opts.content) opts.content = elem.getAttribute('aria-label') ?? ''
  }
  else opts = { content: elem.getAttribute('aria-label') ?? '' }
  return opts
}

/** Creates a Tippy tooltip instance for the element. */
export function tip(elem: Element, opts: Partial<TippyProps> | string = '') {
  opts = parseTipOpts(elem, opts)
  const finalOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
  const tp = tippy(elem, finalOpts)
  const setState = (content: unknown) => {
    if (!content) tp.disable()
    else tp.enable()
  }
  setState(finalOpts.content)
  return {
    update(opts: Partial<TippyProps> | string = '') {
      opts = parseTipOpts(elem, opts)
      const newOpts = { ...DEFAULT_TIPPY_OPTS, ...opts }
      tp.setProps(newOpts)
      setState(newOpts.content)
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
    const anim = anime(safeOpts)
    // makes sure that the animation doesn't conflict on top of other ones
    void (async () => {
      await animationFrame()
      anime.remove(elem)
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
