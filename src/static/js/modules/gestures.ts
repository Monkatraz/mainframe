/**
 * @file Gesture library, such as swipes and dragging actions.
 * @author Monkatraz
 */

import { evtlistener, rmEvtlistener } from '@modules/util'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'
const SWIPE_DIRECTIONS: SwipeDirection[] = ['up', 'down', 'left', 'right']

type SwipeEvent = [sig: SwipeDirection, dist: number]
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

export interface SwipeGestureOpts {
  condition: () => boolean
  do: () => void
  direction: SwipeDirection
  setTouchAction: boolean,
  immediate: boolean
  startThreshold: number
  endThreshold: number
  timeout: number
}
const SWIPE_GESTURE_DEFAULT_OPTS: SwipeGestureOpts = {
  condition: () => true,
  do: () => true,
  direction: 'up',
  setTouchAction: false,
  immediate: true,
  startThreshold: 10,
  endThreshold: 35,
  timeout: 250
}

export function swipeGesture(target: HTMLElement, inOpts: Partial<SwipeGestureOpts> = {}) {
  let opts: SwipeGestureOpts
  const update = (newOpts: Partial<SwipeGestureOpts>) => {
    opts = { ...SWIPE_GESTURE_DEFAULT_OPTS, ...newOpts }
    target.style.touchAction = opts.setTouchAction ? 'none' : ''
  }
  const destroy = () => {
    setState(false)
    target.removeEventListener('pointerdown', handler)
  }

  update(inOpts)
  const events = ['pointermove', 'pointerup', 'pointercancel']
  let ID = -1
  let start: Point
  let current: SwipeEvent
  let timeout: number | undefined = undefined

  const setState = (val: boolean) => {
    clearInterval(timeout)
    current = ['up', 0]
    timeout = undefined
    ID = -1
    if (val) evtlistener(document, events, handler, { passive: true })
    else rmEvtlistener(document, events, handler)
  }

  const eventFns: { [evtType: string]: (evt: PointerEvent) => void } = {
    'pointerdown': (evt) => {
      if (!opts.condition()) return
      setState(true)
      ID = evt.pointerId
      start = [evt.clientX, evt.clientY]
    },
    'pointermove': (evt) => {
      current = resolveSwipe(start, [evt.clientX, evt.clientY])
      if (!timeout && current[1] > opts.startThreshold) {
        setTimeout(() => { setState(false) }, opts.timeout)
      }
      if (opts.immediate && current[0] === opts.direction && current[1] > opts.endThreshold) {
        setState(false)
        opts.do()
      }
    },
    'pointerup': (evt) => {
      setState(false)
      if (current[0] === opts.direction && current[1] > opts.endThreshold) opts.do()
    },
    'pointercancel': (evt) => {
      setState(false)
    }
  }

  const handler = (evt: PointerEvent) => {
    if (ID !== -1 && ID !== evt.pointerId) return
    eventFns[evt.type](evt)
  }
  target.addEventListener('pointerdown', handler, { passive: true })

  return { update, destroy }
}