/**
 * @file Exports Mainframe's various workers, such as the Markdown renderer.
 * @author Monkatraz
 */
// Imports
import { spawn, Transfer, Thread, Worker } from 'threads'
import type { ModuleThread } from 'threads'
import { sleep } from './util'
import DOMPurify from 'dompurify'
import morphdom from 'morphdom'

// -- MESSAGE TRANSFER & RESPONSE DECODING

interface TypedArray extends ArrayBuffer { buffer: ArrayBufferLike }
type TransferInput = string | ArrayBuffer | TypedArray

const decoder = new TextDecoder()
const encoder = new TextEncoder()
const transfer = (buffer: TransferInput) => {
  if (typeof buffer === 'string')    return Transfer(encoder.encode(buffer).buffer)
  if ('buffer' in buffer)            return Transfer(buffer.buffer)
  if (buffer instanceof ArrayBuffer) return Transfer(buffer)
  throw new TypeError('Expected a string, ArrayBuffer, or typed array!')
}
const decode = (buffer: ArrayBuffer) => decoder.decode(buffer)

// -- WORKER MODULE

interface WorkerModuleOpts {
  persist?: boolean
}

class WorkerModule {
  name: string
  persist = false
  url: URL
  worker!: ModuleThread

  constructor(name: string, url: string, opts?: WorkerModuleOpts) {
    this.name = name
    this.url = new URL(url, import.meta.url)
    if (opts) {
      if (opts.persist) this.persist = true
    }
  }

  private async _ready() {
    if (!this.worker)
      this.worker = await spawn<ModuleThread>(new Worker(this.url as any, {
        name: this.name,
        credentials: 'same-origin',
        type: 'classic'
      }))
  }

  private async _terminate() {
    if (this.worker) await Thread.terminate(this.worker)
  }

  private async _restart() {
    await this._terminate()
    await this._ready()
  }

  async invoke<T>(fn: () => Promise<T>) {
    await this._ready()
    const result = await Promise.race([fn(), sleep(10000)])
    if (result) {
      if (!this.persist) await this._terminate()
      return result
    } else {
      if (this.persist) await this._restart()
      else await this._terminate()
      throw new Error('Worker timed out!')
    }
  }
}

// -- WORKERS

export namespace Markdown {
  const module = new WorkerModule('md-renderer', '../workers/md-renderer.js', { persist: true })

  /** Safely renders (async) the given Markdown string into HTML.
   *  Passing `true` for the `pretty` parameter formats and indents the output HTML. */
  export async function render(raw: string, pretty = false) {
    const result = await module.invoke<ArrayBuffer>(() => module.worker.render(transfer(raw), pretty))
    return DOMPurify.sanitize(decode(result))
  }

  /** Safely renders a given Markdown string and then updates the given node with the resultant HTML.
   *  This is _much_ faster than updating the entire DOM node at once. */
  export async function morphNode(raw: string, node: Node) {
    const html = await render(raw)
    morphdom(node, `<div>${html}</div>`, {
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
  }
}

export namespace Prism {
  const module = new WorkerModule('prism', '../workers/md-renderer.js')

  /** Returns a syntax highlighted HTML string. */
  export async function highlight(code: string, lang: string) {
    const result = await module.invoke<ArrayBuffer>(() => module.worker.highlight(transfer(code), lang))
    return decode(result)
  }
}

// -- DOMPURIFY

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node instanceof HTMLAnchorElement) {

    // Makes '#' id links work correctly
    if (node.hash && node.hostname === location.hostname)
      node.setAttribute('href', location.origin + location.pathname + node.hash)

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
