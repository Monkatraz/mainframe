/**
 * @file Exports the Markdown rendering library for Mainframe.
 * @author Monkatraz
 */
// Imports
import { createLock } from '@modules/util'
import DOMPurify from 'dompurify'
import "@vendor/prism.js"

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

const RENDER_TIMEOUT = 10000
/** Safely renders (async) the given Markdown string.
 *  The render occurs in a web worker for performance reasons.
 *  Calling this function multiple times is safe - it will render one request at a time.
 */
export const renderMarkdown = createLock((raw: string): Promise<string> => {
  console.time('md-render-perf')
  return new Promise((resolve, reject) => {
    // Timeout reject scenario
    const rejectTimer = setTimeout(() => {
      reject(new Error('Render timed out.'))
      restartRenderWorker()
    }, RENDER_TIMEOUT)
    // Set the worker to resolve the promise
    renderWorker.onmessage = (evt) => {
      // clear the timer so we don't pointlessly restart the worker
      clearTimeout(rejectTimer)
      // if the evt.data isn't a string its almost certainly an error object
      if (typeof evt.data !== 'string') reject(evt.data)
      // unfortunately DOMPurify requires a reference to Window and Window.document
      // so we have to purify here, I would've liked to have done it in the worker
      resolve(DOMPurify.sanitize(evt.data as string))
      console.timeEnd('md-render-perf')
    }
    // everything's ready, send message to worker
    renderWorker.postMessage(raw)
  })
})

// -- DOMPURIFY

DOMPurify.addHook('afterSanitizeAttributes', (node) => {

  // makes external links open with no referrer and in another tab
  if (node instanceof HTMLAnchorElement) {
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

  // makes all imgs crossorigin
  if (node instanceof HTMLImageElement) node.setAttribute('crossorigin', '')
})

// -- PRISM

export const Prism = window.Prism
Prism.manual = true
// Divert languages to CDN instead of storing them ourselves
Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/components/'
