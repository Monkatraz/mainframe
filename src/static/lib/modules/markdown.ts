/**
 * @file Exports the Markdown rendering library for Mainframe.
 * @author Monkatraz
 */
// Imports
import { spawn, Transfer, Thread, Worker } from 'threads'
import type { ModuleThread, TransferDescriptor } from 'threads'
import { createLock, sleep } from './util'
import DOMPurify from 'dompurify'
import morphdom from 'morphdom'

// -- RENDER WORKER

interface MarkdownWorker {
  /** Renders the given encoded string and returns an HTML buffer. */
  render: (buffer: TransferDescriptor<ArrayBuffer>) => Promise<ArrayBuffer>

  /** Highlights (using Prism) the given encoded raw source and returns an HTML buffer. */
  highlight: (buffer: TransferDescriptor<ArrayBuffer>, lang: string) => Promise<ArrayBuffer>

  // required due to a type bug
  [key: string]: any
}

const WORKER_URL = new URL('../workers/md-renderer.js', import.meta.url) as any
const WORKER_SETTINGS: WorkerOptions = {
  name: 'md-renderer',
  credentials: 'same-origin',
  type: 'classic'
}

let renderWorker: ModuleThread<MarkdownWorker>

/** Restarts the Markdown renderer. Used if the worker times out during a render call. */
async function restartRenderWorker() {
  if (renderWorker) await Thread.terminate(renderWorker)
  renderWorker = await spawn<MarkdownWorker>(new Worker(WORKER_URL, WORKER_SETTINGS))
}

const starting = restartRenderWorker()

const RENDER_TIMEOUT = 10000

interface TypedArray extends ArrayBuffer { buffer: ArrayBufferLike }
export type RawMarkdown = string | ArrayBuffer | TypedArray

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const transfer = (buffer: RawMarkdown) => {
  if (typeof buffer === 'string')    return Transfer(encoder.encode(buffer).buffer)
  if ('buffer' in buffer)            return Transfer(buffer.buffer)
  if (buffer instanceof ArrayBuffer) return Transfer(buffer)
  throw new TypeError('Expected a string, ArrayBuffer, or Uint8Array!')
}
const decode = (buffer: ArrayBuffer) => decoder.decode(buffer)

/** Safely renders (async) the given Markdown string.
 *  Calling this function multiple times is safe - it will render one request at a time.
 *
 *  The render occurs in a web worker due to performance considerations. */
export const renderMarkdown = createLock(async (raw: string) => {
  if (!renderWorker) await starting
  const buffer = await Promise.race([renderWorker.render(transfer(raw)), sleep(RENDER_TIMEOUT)])
  if (!buffer) {
    await restartRenderWorker()
    throw new Error('Render timed out.')
  }
  return DOMPurify.sanitize(decode(buffer))
})

/** Safely renders a given Markdown string and then updates the given node with the resultant HTML.
 *  This is _much_ faster than updating the entire DOM node at once.
 *
 *  Like `renderMarkdown`, the rendering process itself occurs within a web-worker for higher performance.
 *  Also, again like `renderMarkdown`, this function can safely be called multiple times.
 *  It will only render one request at a time. */
export const morphMarkdown = createLock(async (raw: string, node: Node): Promise<void> => {
  morphdom(node, `<div>${await renderMarkdown(raw)}</div>`, {
    childrenOnly: true,
    onBeforeNodeAdded: function (toEl) {
      // Don't sanitize if it's just a raw text node
      if (toEl.nodeType !== 3) DOMPurify.sanitize(toEl, { IN_PLACE: true })
      return toEl
    },
    onBeforeElUpdated: function (fromEl, toEl) {
      if (fromEl.isEqualNode(toEl)) return false
      DOMPurify.sanitize(toEl, { IN_PLACE: true })
      return true
    }
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
