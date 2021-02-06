/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */
// Imports
import { evtlistener, rmEvtlistener } from './util'

/** Represents the valid swipe directions. */
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'
const SWIPE_DIRECTIONS: SwipeDirection[] = ['up', 'down', 'left', 'right']

/** Represents a _potential_ swipe, using a direction and (px) distance. */
type SwipeEvent = [dir: SwipeDirection, dist: number, diff: Point]
function resolveSwipe([x1, y1]: Point, [x2, y2]: Point): SwipeEvent {
  // on these vars: 0 is vertical, 1 is horizontal
  const diff: Point = [y1 - y2, x1 - x2]
  const diffAbs = diff.map(Math.abs)
  const axis = diffAbs[1] > diffAbs[0] ? 1 : 0
  const dir = SWIPE_DIRECTIONS[(axis * 2) + +(diff[axis] < 0)]
  //                                ^               ^  get direction via sign (+ = up|left, - = down|right)
  //                                ^ this is either 0 or 2, as axis is either 0 or 1
  return [dir, diffAbs[axis], diff]
}

export interface onSwipeOpts {
  /** Can be used to enable and disable the swipe.
   *  Return true to enable recognition, return false to disable recognition. */
  condition?: () => boolean
  /** Function to call upon the user swiping. */
  callback: () => void
  /** Function that, if provided, is called on the 'pointermove' event and given the current swipe state. */
  onMoveCallback?: (current: SwipeEvent) => void
  /** Swipe direction to recognize. */
  direction: SwipeDirection
  /** Minimum distance in pixels needed for a swipe to count. */
  threshold: number
  /** If true, the swipe will be recognized even if the user hasn't lifted their pointer yet. */
  immediate?: boolean
  /** If true, the CSS `touch-action` property will be set to none for you. */
  setTouchAction?: boolean,
  /** Duration of time (in miliseconds) after movement has begun that a swipe will be recognized.
   *  Pass `0` or `false` to have no timeout. */
  timeout?: number | false
  /** Minimum distance needed for the timeout to be started.
   *  This is so a pointer can placed down, be still, and then finally swipe and still have it recognized. */
  timeoutThreshold: number
}
const ONSWIPE_DEFAULT_OPTS: onSwipeOpts = {
  callback: () => null,
  direction: 'up',
  immediate: true,
  timeoutThreshold: 10,
  threshold: 35,
  timeout: 250
}
/** Starts an event listener that will recognize swipes on the specified element.
 *  Works natively with Svelte elements, if used as an `use:onSwipe` action.
 *  For basic usage, provide `direction` and `callback` properties in the options object.
 *  @example `use:onSwipe={{ callback: callback, direction: 'up' }}` */
export function onSwipe(target: HTMLElement, inOpts: Partial<onSwipeOpts> = {}) {
  let opts: onSwipeOpts
  /** Updates the currently set options for the swipe recognizer. */
  const update = (newOpts: Partial<onSwipeOpts>) => {
    opts = { ...ONSWIPE_DEFAULT_OPTS, ...newOpts }
    target.style.touchAction = opts.setTouchAction ? 'none' : ''
  }
  /** Destroys the swipe listeners and ends swipe recognition. */
  const destroy = () => {
    disable()
    target.removeEventListener('pointerdown', handler)
  }

  // Set our initial options
  update(inOpts)
  // BTW we also listen to the 'pointerdown' event
  const events = ['pointermove', 'pointerup', 'pointercancel']
  // State variables
  let ID = -1 // If -1 we do not have a pointer event chain running (we are waiting to see a gesture)
  let start: Point
  let timeout: number | undefined

  /** Disables the event listeners and resets the state. */
  const disable = () => {
    clearInterval(timeout)
    timeout = undefined
    ID = -1
    rmEvtlistener(document, events, handler)
  }

  /** Handler function for the assigned pointer events. */
  const handler = (evt: PointerEvent) => {
    // If we running a gesture and the ID of the pointer event doesn't match ours, ignore this event
    if (ID !== -1 && ID !== evt.pointerId) return

    // Init. and start gesture recognition
    if (evt.type === 'pointerdown') {
      if (opts.condition && !opts.condition()) return
      evtlistener(document, events, handler, { passive: true })
      ID = evt.pointerId
      start = [evt.clientX, evt.clientY]
    }
    // Gesture already running
    else {
      const current = resolveSwipe(start, [evt.clientX, evt.clientY])
      const swipeValid = current[0] === opts.direction && current[1] > opts.threshold
      // Execute callback if valid && immediate mode or if the gesture ended with 'pointerup'
      if (swipeValid && (
        (evt.type === 'pointermove' && opts.immediate) || evt.type === 'pointerup')) { disable(); opts.callback() }
      // Cancel gesture if invalid && gesture ended/cancelled
      else if (evt.type === 'pointerup' || evt.type === 'pointercancel') disable()
      // The gesture has not been ended and is still running
      else {
        if (opts.onMoveCallback) opts.onMoveCallback(current)
        // Start the recognition timeout if we have moved the pointer enough and it hasn't already been started
        if (opts.timeout && !timeout && current[1] > opts.timeoutThreshold) { setTimeout(disable, opts.timeout) }
      }
    }
  }

  // Ready now, so we can listen for pointer events
  target.addEventListener('pointerdown', handler, { passive: true })

  // Returning the `update()` and `destroy()` functions like this makes this function work very well with Svelte
  // For Svelte elements, do: `use:onSwipe={{ callback: callback, direction: 'up' }}`
  return { update, destroy }
}
