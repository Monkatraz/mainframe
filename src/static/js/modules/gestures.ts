/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */

import { evtlistener, rmEvtlistener } from '@modules/util'

// General Types
type SwipeDirection = 'up' | 'down' | 'left' | 'right'
type Point = [x: number, y: number]

// SwipeEvent calculation class (doesn't do any event processing, just does the math)
class SwipeEvent {
  public coord: [start: Point, end: Point]
  public state!: [sig: SwipeDirection, dist: number]

  constructor (start: Point, end: Point) {
    this.coord = [start, end]
    this.update(end)
  }

  public update(end: Point) {
    this.coord = [this.coord[0], end]

    // index 0 is vertical diff, index 1 is horizontal diff
    const diff = [
      this.coord[0][1] - this.coord[1][1],
      this.coord[0][0] - this.coord[1][0]
    ]
    const diffAbs = [
      Math.abs(diff[0]),
      Math.abs(diff[1])
    ]

    // 0 is vertical, 1 is horizontal
    let axis = 0
    if (diffAbs[1] > diffAbs[0]) axis = 1

    // 0 is up / left, 1 is down / right
    const dir = diff[axis] > 0 ? 0 : 1

    const dirs = ['up', 'down', 'left', 'right']
    const swipeDir = dirs[(axis * 2) + dir] as SwipeDirection
    //                      ^ this is either 0 or 2, as axis is either 0 or 1

    this.state = [swipeDir, diffAbs[axis]]
    return this.state
  }
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
// TODO: Destructor mechanism
// TODO: Allow for changing to touch events instead (due to 'touch-action')
export function addSwipeGesture(
  target: HTMLElement,
  dir: SwipeDirection,
  fn: AnyFn,
  opts: Partial<SwipeGestureOpts> = {}
) {
  const finalOpts = { ...SWIPE_GESTURE_DEFAULT_OPTS, ...opts } as SwipeGestureOpts

  target.style.touchAction = 'none'

  const evtOpts = { passive: true }
  let ID: number
  let swipe: SwipeEvent
  let timeout: number
  let timedout: boolean | null

  const handler = ((evt: PointerEvent) => {
    // Return if it's a different pointer (except if it's new)
    if (evt.type !== 'pointerdown' && evt.pointerId !== ID) return
    if (!evt.isPrimary) return

    const cleanup = () => {
      rmEvtlistener(document, ['pointermove', 'pointerup', 'pointercancel'], handler)
      clearInterval(timeout)
    }

    switch (evt.type) {
      case 'pointerdown': {
        if (!finalOpts.condition()) return
        // Assign functions
        // Attach to document so that we don't have to pointer capture
        evtlistener(document, ['pointermove', 'pointerup', 'pointercancel'], handler, evtOpts)
        // Starting vars
        ID = evt.pointerId
        swipe = new SwipeEvent([evt.clientX, evt.clientY], [evt.clientX, evt.clientY])
        timedout = null
        break
      }

      case 'pointermove': {
        const curPoint: Point = [evt.clientX, evt.clientY]
        const state = swipe.update(curPoint)

        if (timedout === null && state[1] > finalOpts.startThreshold) {
          timedout = false
          timeout = setTimeout(() => {
            timedout = true
          }, finalOpts.timeout)
        }

        if (finalOpts.immediate && !timedout) {
          // Correct direction and greater than our threshold?
          if (state[0] === dir && state[1] > finalOpts.endThreshold) {
            cleanup()
            fn()
          }
        }
        break
      }

      case 'pointerup': {
        cleanup()
        if (timedout) return

        const state = swipe.state
        // Correct direction and greater than our threshold?
        if (state[0] === dir && state[1] > finalOpts.endThreshold) fn()
        break
      }

      case 'pointercancel': {
        cleanup()
        break
      }
    }
  })

  target.addEventListener('pointerdown', handler, evtOpts)
}