/* https://gist.github.com/gustavopch/134513fa7c1f30050e968b5570c26994 */
const esTree = require('@typescript-eslint/typescript-estree')
const sveltePreprocess = require('svelte-preprocess')
const svelteCompiler = require('svelte/compiler')
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require('worker_threads')

const mainThread = () => {
  const isRunningWithinCli = process.env.npm_lifecycle_event === 'eslint'

  const isDoneBuffer = new SharedArrayBuffer(4)
  const isDoneView = new Int32Array(isDoneBuffer)
  const dataBuffer = new SharedArrayBuffer(50 * 1024 * 1024)
  const dataView = new Uint8Array(dataBuffer)
  const dataLengthBuffer = new SharedArrayBuffer(4)
  const dataLengthView = new Uint32Array(dataLengthBuffer)

  const worker = new Worker(__filename, {
    workerData: [isDoneView, dataView, dataLengthView],
  })

  let timeout
  let lastResult

  return autoPreprocessConfig => {
    return (src, filename) => {
      console.log(`Main: Asking worker to preprocess ${filename}`)
      worker.postMessage({
        src,
        filename,
        autoPreprocessConfig,
      })

      console.log('Main: Locking thread to wait for worker')
      const waitResult = Atomics.wait(isDoneView, 0, 0, 5000)
      Atomics.store(isDoneView, 0, 0)
      console.log(`Main: Unlocked: ${waitResult}`)

      const textDecoder = new TextDecoder()
      const decoded = textDecoder.decode(dataView.subarray(0, dataLengthView[0])) // prettier-ignore

      try {
        const result = JSON.parse(decoded)
        console.log('Main: Finished')
        lastResult = result
        return result
      } catch (error) {
        console.log('Main: No result obtained; finished with last result')
        return lastResult
      } finally {
        if (isRunningWithinCli) {
          clearTimeout(timeout)
          timeout = setTimeout(() => {
            console.log('Main: Forcing exit')
            process.exit(0)
          }, 1000)
        }
      }
    }
  }
}

const workerThread = () => {
  parentPort.on('message', async ({ src, filename, autoPreprocessConfig }) => {
    console.log(`Worker: Preprocessing ${filename}`)

    const result = await preprocess({
      src,
      filename,
      autoPreprocessConfig,
    }).catch(error => {
      console.log('Worker: Failed to preprocess:', error)
      return null
    })

    const [isDoneView, dataView, dataLengthView] = workerData
    const textEncoder = new TextEncoder()
    const encodedResult = textEncoder.encode(result ? JSON.stringify(result) : '') // prettier-ignore
    dataView.set(encodedResult, 0)
    dataLengthView[0] = encodedResult.length
    Atomics.store(isDoneView, 0, 1)
    Atomics.notify(isDoneView, 0)
  })
}

const preprocess = async ({ src, filename, autoPreprocessConfig }) => {
  let instance
  let markup
  let module
  let style

  const result = await svelteCompiler.preprocess(
    src,
    [
      {
        markup: ({ content }) => {
          markup = {
            original: content,
          }
        },
        script: ({ content, attributes }) => {
          if (
            attributes.lang === 'ts' ||
            attributes.lang === 'typescript' ||
            attributes.type === 'text/typescript'
          ) {
            const ast = esTree.parse(content, { loc: true })

            const obj = {
              ast,
              original: content,
              ext: 'ts',
            }

            if (attributes.context) {
              module = obj
            } else {
              instance = obj
            }
          }
        },
        style: ({ content }) => {
          style = {
            original: content,
          }
        },
      },
      sveltePreprocess(autoPreprocessConfig),
      {
        markup: ({ content }) => {
          if (markup) {
            markup.result = content
            markup.diff = markup.original.length - content.length
          }
        },
        script: ({ content, attributes }) => {
          const obj = attributes.context ? module : instance

          if (obj) {
            obj.result = content
            obj.diff = obj.original.length - content.length
          }
        },
        style: ({ content }) => {
          if (style) {
            style.result = content
            style.diff = style.original.length - content.length
          }
        },
      },
    ],
    { filename: filename || 'unknown' },
  )

  return {
    ...result,
    instance,
    markup,
    module,
    style,
  }
}

if (isMainThread) {
  module.exports = mainThread()
} else {
  workerThread()
}