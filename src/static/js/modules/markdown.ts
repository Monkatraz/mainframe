/**
 * @file Exports the Markdown rendering library for Mainframe.
 * @author Monkatraz
 */
// Imports
import { createLock } from '@modules/util'
import DOMPurify from 'dompurify'
import morphdom from 'morphdom'

// -- RENDER WORKER

let renderWorker: Worker
/** Effectively restarts the Markdown renderer.
 *  It does this by terminating the previous instance and creating a new one. */
function restartRenderWorker() {
  if (renderWorker) renderWorker.terminate()
  renderWorker = new Worker(new URL('../workers/md-renderer.js', import.meta.url), {
    name: 'md-renderer',
    credentials: 'same-origin',
    type: import.meta.env.MODE === 'development' ? "module" : "classic"
  })
}
// init. worker on first load
restartRenderWorker()

export interface RenderMarkdownResult {
  html: string
  perf: {
    sanitize: number
    parse: number
    cacheSize: number
  }
}

const RENDER_TIMEOUT = 10000
/** Safely renders (async) the given Markdown string.
 *  Calling this function multiple times is safe - it will render one request at a time.
 *
 *  The render occurs in a web worker due to performance considerations.
 */
export const renderMarkdown = createLock((raw: string): Promise<RenderMarkdownResult> => {
  return new Promise((resolve, reject) => {
    const perfTotal = performance.now()
    // Timeout reject scenario
    const rejectTimer = setTimeout(() => {
      reject(new Error('Render timed out.'))
      restartRenderWorker()
    }, RENDER_TIMEOUT)
    // Set the worker to resolve the promise
    renderWorker.onmessage = (evt) => {
      // clear the timer so we don't pointlessly restart the worker
      clearTimeout(rejectTimer)
      // if the evt.data is a string it is a casted error
      if (typeof evt.data === 'string') reject(evt.data)
      // unfortunately DOMPurify requires a reference to Window and Window.document
      // so we have to purify here, I would've liked to have done it in the worker
      resolve({
        html: DOMPurify.sanitize(evt.data.html as string),
        perf: {
          sanitize: performance.now() - perfTotal,
          parse: evt.data.perf,
          cacheSize: evt.data.cacheSize
        }
      })
    }
    // everything's ready, send message to worker
    renderWorker.postMessage(raw)
  })
})

/** Safely renders a given Markdown string and then updates the given node with the resultant HTML.
 *  This is _much_ faster than updating the entire DOM node at once.
 *
 *  Like `renderMarkdown`, the rendering process itself occurs within a web-worker for higher performance.
 *  Also, again like `renderMarkdown`, this function can safely be called multiple times. 
 *  It will only render one request at a time.
 */
export const morphMarkdown = createLock((raw: string, node: Node) => {
  return new Promise((resolve, reject) => {
    // Timeout reject scenario
    const rejectTimer = setTimeout(() => {
      reject(new Error('Render timed out.'))
      restartRenderWorker()
    }, RENDER_TIMEOUT)

    renderWorker.onmessage = (evt) => {
      clearTimeout(rejectTimer)
      // if the evt.data is a string it is a casted error
      if (typeof evt.data === 'string') reject(evt.data)

      morphdom(node, '<div>' + evt.data.html + '</div>', {
        childrenOnly: true,
        onBeforeNodeAdded: function (toEl) {
          // Don't sanitize if it's just a raw text node
          if (toEl.nodeType === 3) return toEl
          return DOMPurify.sanitize(toEl, { IN_PLACE: true }) as unknown as Node
        },
        onBeforeElUpdated: function (fromEl, toEl) {
          if (fromEl.isEqualNode(toEl)) return false
          DOMPurify.sanitize(toEl, { IN_PLACE: true })
          return true
        }
      })

      resolve({
        perf: evt.data.perf,
        cacheSize: evt.data.cacheSize
      })
    }
    // everything's ready, send message to worker
    renderWorker.postMessage(raw)
  })
})

// -- DOMPURIFY

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLAnchorElement) {
    // Makes '#' id links work correctly
    if (node.hash) node.setAttribute('href', location.origin + location.pathname + node.hash)
    // makes external links open with no referrer and in another tab
    if (!node.hostname || node.hostname !== location.hostname) {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noreferrer noopener')
    }
    return
  }
  // changes resource http links to https (not perfect, but it's just a simple measure)
  // this won't affect anchor links as we returned above when we find those
  for (const attr of ['src', 'href', 'action', 'xlink:href']) if (node.hasAttribute(attr))
    node.setAttribute(attr, (node.getAttribute(attr) ?? '').replace(/http:/, 'https:'))

  if (node instanceof HTMLImageElement) {
    node.setAttribute('crossorigin', '')
    node.setAttribute('loading', 'lazy')
  }
})