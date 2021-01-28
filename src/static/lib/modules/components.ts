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
import { hash, animationFrame } from './util'
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

/** Simple utility function for generating an ID, with the intended usage being HTML element IDs.*/
export function createID(prefix = '') {
  const suffix = hash(Math.random() * 100 + prefix)
  return prefix + '-' + suffix
}

type PlacementOpts = { when?: boolean, pos: Popper.Placement, against: Element }

/** Svelte use function that uses Popper to place the element relative to another element. */
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
    destroy() { if (instance) instance.destroy() }
  }
}

export interface KeyHandler {
  key: string
  preventDefault?: boolean
  do?: AnyFn
}

/** Utility Svelte use function to handle key press events for the element. */
export function keyHandle(elem: Element, handlers: KeyHandler[]) {
  const handler = (evt: KeyboardEvent) => {
    handlers.forEach((handler) => {
      if (evt.key === handler.key) {
        if (handler.preventDefault) evt.preventDefault()
        if (handler.do) handler.do()
      }
    })
  }
  elem.addEventListener('keydown', handler as any)
  return {
    update(newHandlers: KeyHandler[]) { handlers = newHandlers },
    destroy() { elem.removeEventListener('keydown', handler as any) }
  }
}

// https://zellwk.com/blog/keyboard-focusable-elements/
/** Returns a list of elements that can be reasonably expected
 *  as programatically focusable directly under the given element. */
export function getFoci(elem: Element) {
  return Array.from(elem.querySelectorAll<HTMLElement>(
    'a, button, input, textarea, select, details, [tabindex]'))
    .filter(el => !el.hasAttribute('disabled'))
    .filter(el => el.getAttribute('tabindex') !== '-1')
}

/** Svelte use function for automatically handling directional key focus movement.
 *  All elements underneath this one that are focusable with a non-negative tabindex will be
 *  cycled through with the arrow keys.
 *  The `dir` parameter determines which pair of arrow keys will be used. */
export function focusGroup(elem: Element, dir: 'vertical' | 'horizontal') {

  const keys = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home']

  const handler = (evt: KeyboardEvent) => {

    if (!keys.includes(evt.key)) return

    const focus = document.activeElement as HTMLElement
    if (!focus) return

    const foci = getFoci(elem)
    if (!foci.length) return

    // maps every element to its index
    const fociMap = new Map<HTMLElement, number>()
    foci.map((el, i) => fociMap.set(el, i))

    const didArrow =
      (dir === 'vertical' && (evt.key === 'ArrowUp' || evt.key === 'ArrowDown')) ||
      (dir === 'horizontal' && (evt.key === 'ArrowLeft' || evt.key === 'ArrowRight'))

    const arrowDir = evt.key === 'ArrowUp' || evt.key === 'ArrowLeft' ? -1 : 1

    // modulo of next position (even -1) and array length causes the value to "wrap"
    // JS handles negative modulo weirdly so we don't use the operator directly
    const len = foci.length
    if (didArrow && fociMap.has(focus))
      foci[(((fociMap.get(focus)! + arrowDir) % len) + len) % len].focus()
    else if (evt.key === 'Home') foci[0].focus()
    else if (evt.key === 'End') foci[len - 1].focus()
    else return

    // if we passed a key check we can be here
    evt.preventDefault()
  }

  // typescript doesn't handle keydown correctly for some reason?
  elem.addEventListener('keydown', handler as any)

  return {
    update(newDir: 'vertical' | 'horizontal') { dir = newDir },
    destroy() { elem.removeEventListener('keydown', handler as any) }
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
    destroy() { tp.destroy() }
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
