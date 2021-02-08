/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */
// Imports
import { evtlistener, rmEvtlistener } from './util'

type GestureTypes = 'start' | 'move' | 'end' | 'cancel'

export interface Gesture {
  start: Point
  diff: Point
  diffAbs: Point
  direction: 'up' | 'down' | 'left' | 'right'
  dist: number
  type: 'start' | 'move' | 'end' | 'cancel'
}

const DIRECTIONS: Gesture['direction'][] = ['up', 'down', 'left', 'right']

function resolve([x1, y1]: Point, [x2, y2]: Point, type: Gesture['type']): Gesture {
  // on these vars: 0 is vertical, 1 is horizontal
  const diff: Point = [y1 - y2, x1 - x2]
  const diffAbs = diff.map(Math.abs) as Point
  const axis = diffAbs[1] > diffAbs[0] ? 1 : 0
  const dist = diffAbs[axis]
  const direction = DIRECTIONS[(axis * 2) + +(diff[axis] < 0)]
  //                                ^               ^  get direction via sign (+ = up|left, - = down|right)
  //                                ^ this is either 0 or 2, as axis is either 0 or 1
  return { start: [x1, y1], diff, diffAbs, direction, dist, type }
}

export function gestureObserve(target: HTMLElement, handler: (gesture: Gesture) => void) {
  let ID: number | null = null
  let start: Point | null = null
  const reset = () => {
    ID = null
    start = null
    rmEvtlistener(document, ['touchmove', 'touchend', 'touchcancel'], wrapper)
  }
  const wrapper = (evt: TouchEvent) => {
    let touch!: Touch
    // If we running a gesture and the ID of the pointer event doesn't match ours, ignore this event
    if (ID !== null) {
      for (const idx of Array.from(evt.changedTouches)) if (idx.identifier === ID) {
        touch = idx
        break
      }
      if (!touch) return
    }
    // Init. and start gesture recognition
    if (evt.type === 'touchstart') {
      evtlistener(document, ['touchmove', 'touchend', 'touchcancel'], wrapper, { passive: true })
      touch = evt.changedTouches[0]
      ID = touch.identifier
      start = [touch.clientX, touch.clientY]
    }
    // Gesture running
    if (ID !== null && start) {
      let type!: GestureTypes
      switch (evt.type) {
        case 'touchstart':  type = 'start';  break
        case 'touchmove':   type = 'move';   break
        case 'touchend':    type = 'end';    break
        case 'touchcancel': type = 'cancel'; break
      }
      const gesture = resolve(start, [touch.clientX, touch.clientY], type)
      handler(gesture)
      if (type === 'end' || type === 'cancel') reset()
    }
  }
  target.addEventListener('touchstart', wrapper, { passive: true })
  return () => target.removeEventListener('touchstart', wrapper)
}

export interface OnSwipeOpts {
  /** Can be used to enable and disable the swipe.
   *  Return true to enable recognition, return false to disable recognition. */
  condition?: () => boolean
  /** Function to call upon the user swiping. */
  callback: (target: HTMLElement, gesture: Gesture) => void
  /** Function that, if provided, is called on the every event and given the current swipe state. */
  eventCallback?: (target: HTMLElement, gesture: Gesture) => void
  /** Swipe direction to recognize. */
  direction: Gesture['direction']
  /** Minimum distance in pixels needed for a swipe to count. */
  threshold: number
  /** Minimum distance needed for the swipe recognition to be started.
   *  This is so a pointer can placed down, be still, and then finally swipe and still have it recognized. */
  minThreshold: number
  /** If true, the swipe will be recognized even if the user hasn't lifted their pointer yet. */
  immediate?: boolean
  /** Duration of time (in miliseconds) after movement has begun that a swipe will be recognized.
   *  Pass `0` or `false` to have no timeout. */
  timeout?: number | false
}

const ONSWIPE_DEFAULT_OPTS: OnSwipeOpts = {
  callback: () => null,
  direction: 'up',
  immediate: true,
  threshold: 35,
  minThreshold: 10,
  timeout: 250
}

/** Starts an event listener that will recognize swipes on the specified element.
 *  Works natively with Svelte elements, if used as an `use:onSwipe` action.
 *  For basic usage, provide `direction` and `callback` properties in the options object.
 *  @example `use:onSwipe={{ callback: callback, direction: 'up' }}` */
export function onSwipe(target: HTMLElement, opts: Partial<OnSwipeOpts>) {
  let timeout: number | undefined
  let started = false
  let cancelled = false
  const handler = (gesture: Gesture) => {

    if (gesture.type === 'start') {
      started = false
      cancelled = false
    }

    if (cancelled) return
    if (!started && opts.condition && !opts.condition()) return

    const cancel = () => {
      cancelled = true
      if (started) opts.eventCallback?.(target, { ...gesture, type: 'cancel' })
    }

    const { direction, dist, type } = gesture
    const sameDir = direction === opts.direction
    const valid = sameDir && dist > opts.threshold!
    const minValid = started || (sameDir && dist > opts.minThreshold!)

    if (!sameDir && dist > opts.minThreshold!) cancel()

    if (!cancelled) {
      if (minValid) {
        started = true
        opts.eventCallback?.(target, gesture)
      }
      // Execute callback if valid && immediate mode or if the gesture ended
      if (valid && ((type === 'move' && opts.immediate) || type === 'end')) opts.callback!(target, gesture)
      // Handle timeout
      else if (timeout && (type === 'end' || type === 'cancel')) clearTimeout(timeout)
      else if (minValid && opts.timeout && !timeout) setTimeout(cancel, opts.timeout)
    }
  }
  const update = (newOpts: Partial<OnSwipeOpts>) => {
    opts = { ...ONSWIPE_DEFAULT_OPTS, ...newOpts }
  }
  const destroy = gestureObserve(target, handler)

  return { update, destroy }
}
