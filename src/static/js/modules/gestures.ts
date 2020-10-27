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
// TODO: Callback thingy for getting the current dist value
export function swipeGesture(target: HTMLElement, inOpts: Partial<SwipeGestureOpts> = {}) {
  let opts: SwipeGestureOpts
  const update = (newOpts: Partial<SwipeGestureOpts>) => {
    opts = { ...SWIPE_GESTURE_DEFAULT_OPTS, ...newOpts }
    target.style.touchAction = opts.setTouchAction ? 'none' : ''
  }
  const destroy = () => {
    disable()
    target.removeEventListener('pointerdown', handler)
  }

  update(inOpts)
  let ID = -1
  let start: Point
  let timeout: number | undefined = undefined

  const disable = () => {
    clearInterval(timeout)
    timeout = undefined
    ID = -1
    rmEvtlistener(document, ['pointermove', 'pointerup', 'pointercancel'], handler)
  }

  const handler = (evt: PointerEvent) => {
    if (ID !== -1 && ID !== evt.pointerId) return
    if (evt.type === 'pointerdown' && opts.condition()) {
      evtlistener(document, ['pointermove', 'pointerup', 'pointercancel'], handler, { passive: true })
      ID = evt.pointerId
      start = [evt.clientX, evt.clientY]
    }
    else if (evt.type !== 'pointerdown') {
      const current = resolveSwipe(start, [evt.clientX, evt.clientY])
      const swipeValid = current[0] === opts.direction && current[1] > opts.endThreshold
      if (evt.type === 'pointermove') {
        if (!timeout && current[1] > opts.startThreshold) { setTimeout(() => { disable() }, opts.timeout) }
        if (opts.immediate && swipeValid) { disable(), opts.do() }
      }
      else if (evt.type === 'pointerup' && swipeValid) opts.do()
      if (evt.type === 'pointercancel' || evt.type === 'pointerup') disable()
    }
  }
  target.addEventListener('pointerdown', handler, { passive: true })

  return { update, destroy }
}