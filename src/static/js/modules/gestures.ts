/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */

import { evtlistener, rmEvtlistener } from '@modules/util'

// General Types
type Point = [x: number, y: number]
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type SwipeEvent = [sig: SwipeDirection, dist: number]

function calcSwipe(start: Point, end: Point): SwipeEvent {
  const coord = [start, end]
  // index 0 is vertical diff, index 1 is horizontal diff
  const diff = [coord[0][1] - coord[1][1], coord[0][0] - coord[1][0]]
  const diffAbs = [Math.abs(diff[0]), Math.abs(diff[1])]

  // 0 is vertical, 1 is horizontal
  const axis = diffAbs[1] > diffAbs[0] ? 1 : 0
  // 0 is up / left, 1 is down / right
  const dir = diff[axis] > 0 ? 0 : 1

  const dirs = ['up', 'down', 'left', 'right']
  const swipeDir = dirs[(axis * 2) + dir] as SwipeDirection
  //                      ^ this is either 0 or 2, as axis is either 0 or 1

  return [swipeDir, diffAbs[axis]]
}

// SwipeGesture handler

interface SwipeGestureOpts {
  condition: () => boolean
  immediate: boolean
  startThreshold: number
  endThreshold: number
  timeout: number
}

const SWIPE_GESTURE_DEFAULT_OPTS = {
  condition: () => true,
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

  target.style.touchAction = 'none'

  const evtOpts = { passive: true }
  const events = ['pointermove', 'pointerup', 'pointercancel']

  let start: Point
  let ID: number
  let current: SwipeEvent
  let timeout: number
  let timedout: boolean | null

  const handler = ((evt: PointerEvent) => {
    // Return if it's a different pointer (except if it's new)
    if (evt.type !== 'pointerdown' && evt.pointerId !== ID) return
    if (!evt.isPrimary) return

    const cleanup = () => {
      rmEvtlistener(document, events, handler)
      clearInterval(timeout)
    }

    switch (evt.type) {
      case 'pointerdown': {
        if (!opts.condition()) return
        // Assign functions
        // Attach to document so that we don't have to pointer capture
        evtlistener(document, events, handler, evtOpts)
        // Starting vars
        start = [evt.clientX, evt.clientY]
        ID = evt.pointerId
        current = calcSwipe(start, start)
        timedout = null
        break
      }

      case 'pointermove': {
        current = calcSwipe(start, [evt.clientX, evt.clientY])

        if (timedout === null && current[1] > opts.startThreshold) {
          timedout = false
          timeout = setTimeout(() => {
            timedout = true
          }, opts.timeout)
        }

        if (opts.immediate && !timedout) {
          // Correct direction and greater than our threshold?
          if (current[0] === dir && current[1] > opts.endThreshold) {
            cleanup()
            fn()
          }
        }
        break
      }

      case 'pointerup': {
        cleanup()
        if (timedout) return

        // Correct direction and greater than our threshold?
        if (current[0] === dir && current[1] > opts.endThreshold) fn()
        break
      }

      case 'pointercancel': {
        cleanup()
        break
      }
    }
  })

  target.addEventListener('pointerdown', handler, evtOpts)

  const destroy = () => {
    rmEvtlistener(document, events, handler)
    clearInterval(timeout)
    target.removeEventListener('pointerdown', handler)
  }

  return { handler, destroy }
}