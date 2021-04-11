import { expose } from 'threads/worker'
import { transfer, decode } from './_worker_lib'
import initFTML, * as Binding from '@vendor/ftml'

/** Indicates if the WASM binding is loaded. */
let ready = false

/** Promise that resolves when the WASM binding has loaded. */
const loading = init()

/** Module-global logging flag. */
let log = false

/** Actual output of the WASM instantiation. */
let wasm: Binding.InitOutput | null = null

/** Loads the WASM required for the FTML library. */
async function init() {
  wasm = await initFTML()
  ready = true
}

expose({

  logging(state: boolean) {
    log = state
  },

  async version() {
    await loading
    return Binding.version()
  },

  async preprocess(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)
    return transfer(Binding.preprocess(str, log))
  },

  async tokenize(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)
    return Binding.tokenize(str, log).tokens()
  },

  async parse(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)
    const tokenized = Binding.tokenize(str, log)
    const parsed = Binding.parse(tokenized, log)
    const ast = parsed.syntax_tree()
    const warnings = parsed.warnings()
    return { ast, warnings }
  },

  async render(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)
    const tokenized = Binding.tokenize(str, log)
    const parsed = Binding.parse(tokenized, log)
    const ast = parsed.syntax_tree()
    try { const rendered = Binding.render_html(ast, log) } catch {}
    return transfer('<i>Placeholder Output (FTML cannot render yet)</i>')
  },

  async detailedRender(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)

    const tokenized = Binding.tokenize(str, log)
    const tokens = tokenized.tokens()

    const parsed = Binding.parse(tokenized, log)
    const ast = parsed.syntax_tree()
    const warnings = parsed.warnings()

    try { const rendered = Binding.render_html(ast, log) } catch {}
    const html = '<i>Placeholder Output (FTML cannot render yet)</i>'

    return { tokens, ast, warnings, html }
  },

  async inspectTokens(raw: ArrayBuffer) {
    await loading
    const str = decode(raw)

    const tokenized = Binding.tokenize(str, log)
    const tokens = tokenized.tokens()

    let out = ''
    for (const { slice, span: { start, end }, token } of tokens) {
      const tokenStr = String(token.padEnd(16))
      const startStr = String(start).padStart(4, '0')
      const endStr = String(end).padStart(4, '0')
      const sliceStr = slice.slice(0, 40).replaceAll('\n', '\\n')
      out += `[${startStr} <-> ${endStr}]: ${tokenStr} => '${sliceStr}'\n`
    }

    return transfer(out)
  }
})
