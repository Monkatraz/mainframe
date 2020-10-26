/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */

import { evtlistener, rmEvtlistener } from '@modules/util'

// General Types
type Point = [x: number, y: number]
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type SwipeEvent = [sig: SwipeDirection, dist: number]

// Constants
const SWIPE_DIRECTIONS: SwipeDirection[] = ['up', 'down', 'left', 'right']

function resolveSwipe([x1, y1]: Point, [x2, y2]: Point): SwipeEvent {
  // index 0 is vertical diff, index 1 is horizontal diff
  const diff = [y1 - y2, x1 - x2]
  const diffAbs = diff.map(Math.abs)

  // 0 is vertical, 1 is horizontal
  const axis = diffAbs[1] > diffAbs[0] ? 1 : 0
  // 0 is up / left, 1 is down / right
  const dir = diff[axis] > 0 ? 0 : 1

  const swipeDir = SWIPE_DIRECTIONS[(axis * 2) + dir]
  //                      ^ this is either 0 or 2, as axis is either 0 or 1

  return [swipeDir, diffAbs[axis]]
}

// SwipeGesture handler

interface SwipeGestureOpts {
  condition: () => boolean
  useTouchEvents: boolean
  setTouchAction: boolean,
  immediate: boolean
  startThreshold: number
  endThreshold: number
  timeout: number
}

const SWIPE_GESTURE_DEFAULT_OPTS = {
  condition: () => true,
  useTouchEvents: true,
  setTouchAction: true,
  immediate: true,
  startThreshold: 10,
  endThreshold: 35,
  timeout: 250
}

// TODO: Allow for changing to touch events instead (due to 'touch-action')
export function SwipeGesture(
  target: HTMLElement,
  dir: SwipeDirection,
  fn: AnyFn,
  userOpts: Partial<SwipeGestureOpts> = {}
) {
  const opts = { ...SWIPE_GESTURE_DEFAULT_OPTS, ...userOpts } as SwipeGestureOpts
  const evtOpts = { passive: true }

  if (opts.setTouchAction) target.style.touchAction = 'none'

  const events = opts.useTouchEvents
    ? ['touchstart', 'touchmove', 'touchend', 'touchcancel']
    : ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']

  let ID: number
  let start: Point
  let current: SwipeEvent
  let timeout: number | undefined

  const setState = (val: boolean) => {
    if (val) {
      evtlistener(document, events.slice(1), handler, evtOpts)
      current = ['up', 0]
      timeout = undefined
    }
    else {
      rmEvtlistener(document, events.slice(1), handler)
      clearInterval(timeout)
    }
  }

  const eventFns: ((evt: PointerEvent | TouchEvent) => void)[] = [
    // Start
    (evt) => {
      if (!opts.condition()) return
      setState(true)
      if (evt instanceof PointerEvent) {
        ID = evt.pointerId
        start = [evt.clientX, evt.clientY]
      } else {
        const touch = evt.changedTouches[0]
        ID = touch.identifier
        start = [touch.clientX, touch.clientY]
      }
    },
    // Move
    (evt) => {
      if (evt instanceof PointerEvent) {
        if (evt.pointerId !== ID) return
        current = resolveSwipe(start, [evt.clientX, evt.clientY])
      } else {
        const touch = [...evt.changedTouches].find((val) => val.identifier === ID)
        if (!touch) return
        current = resolveSwipe(start, [touch.clientX, touch.clientY])
      }

      if (!timeout && current[1] > opts.startThreshold) {
        setTimeout(() => { setState(false) }, opts.timeout)
      }
      if (opts.immediate && current[0] === dir && current[1] > opts.endThreshold) {
        setState(false)
        fn()
      }
    },
    // Up
    (evt) => {
      setState(false)
      if (current[0] === dir && current[1] > opts.endThreshold) fn()
    },
    // Cancel
    (evt) => {
      setState(false)
    }
  ]

  const handler = (evt: PointerEvent | TouchEvent) => {
    const index = events.indexOf(evt.type)
    if (index !== -1) eventFns[index](evt)
  }

  target.addEventListener(events[0] as 'pointerdown', handler, evtOpts)

  const destroy = () => {
    setState(false)
    target.removeEventListener(events[0] as 'pointerdown', handler)
  }
  // TODO: update props func.
  return { handler, destroy }
}