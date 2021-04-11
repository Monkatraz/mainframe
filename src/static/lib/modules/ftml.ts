import initFTML, * as Binding from '@vendor/ftml'
import { perfy } from './util'

// -- WASM MANAGEMENT

/** Indicates if the WASM binding is loaded. */
export let ready = false

/** Promise that resolves when the WASM binding has loaded. */
export const loading = init()

/** Module-global logging flag. */
let log = false

/** Actual output of the WASM instantiation. */
let wasm: Binding.InitOutput | null = null

/** Loads the WASM required for the FTML library. */
async function init() {
  wasm = await initFTML()
  ready = true
}

/** Sets whether or not logging is enabled. */
export function logging(state: boolean) {
  log = state
}

/** Maps useful JS output objects (like tokenization tokens) to the binding's actual outputs.
 *  This allows the awkward representation of certain objects to be hidden as an implementation detail. */
const ptrs = new WeakMap<any, any>()

// -- TYPES

export interface FTMLToken {
  slice: string
  span: { start: number, end: number }
  token: string
}

// TODO: placeholder values
export interface Parse {
  ast: unknown
  warnings: unknown[]
}

// -- UTIL

/** Asserts that the object provided is an instance of the given class. */
function assertClass<T extends Class>(instance: unknown, klass: T): asserts instance is InstanceType<T> {
  if (!instance || !(instance instanceof klass)) {
    throw new Error(`Expected an instance of ${klass.name}!`)
  }
}

/** Asserts that the binding object has a valid pointer. */
function assertNotMoved(obj: any) {
  if (!obj) throw new Error('Invalid object!')
  if (!obj.ptr) throw new Error('Object was already used! (obj.ptr === 0 or nullish)')
}

// -- LIBRARY

/** Returns the version of the FTML WASM library. */
export function version(): string {
  return Binding.version()
}

/** Returns a preprocessed string of wikitext. */
export function preprocess(str: string): string {
  if (!ready) throw new Error('FTML has not been instantiated yet!')
  return Binding.preprocess(str, log)
}

/** Tokenizes a string of wikitext into an {@link FTMLToken} array. */
export function tokenize(str: string): FTMLToken[] {
  if (!ready) throw new Error('FTML has not been instantiated yet!')

  const tokenized = Binding.tokenize(str, log)
  const tokens = tokenized.tokens()
  ptrs.set(tokens, tokenized)

  return tokens
}

/** Parses an {@link FTMLToken} array into an abstract syntax tree and warnings list.
 *
 *  You can provide a `string` instead - it will be tokenized automatically. */
export function parse(tokens: FTMLToken[] | string): Parse {
  if (!ready) throw new Error('FTML has not been instantiated yet!')
  if (typeof tokens === 'string') tokens = tokenize(tokens)

  const tokenized = ptrs.get(tokens)
  assertClass(tokenized, Binding.Tokenization)
  assertNotMoved(tokenized)

  const parsed = Binding.parse(tokenized, log)

  // TODO: syntaxTree and warnings don't have any meaningful properties rn
  const parsedTree = parsed.syntax_tree()
  const parsedWarnings = parsed.warnings()

  const ast: unknown = {}
  const warnings: unknown[] = []
  const parse = { ast, warnings }

  ptrs.set(ast, parsedTree)
  ptrs.set(warnings, parsedWarnings)
  ptrs.set(parse, parsed)

  return parse
}

const domParser = new DOMParser()

/** **DOES NOT WORK YET - RETURNS PLACEHOLDER**
 *
 *  Renders a {@link Parse} AST into an HTML {@link DocumentFragment}.
 *
 *  You can provide a `string` instead - it will be tokenized and parsed into an AST automatically. */
export function render(parsed: Parse | string, raw: true): string
export function render(parsed: Parse | string, raw?: false): DocumentFragment
export function render(parsed: Parse | string, raw?: boolean): DocumentFragment | string {
  if (!ready) throw new Error('FTML has not been instantiated yet!')
  if (typeof parsed === 'string') parsed = parse(parsed)

  const { ast } = parsed
  const syntaxTree = ptrs.get(ast)
  assertClass(syntaxTree, Binding.SyntaxTree)
  assertNotMoved(syntaxTree)

  // TODO: FTML can't render HTML yet - so this just returns a placeholder
  /** const output = Binding.render_html(syntaxTree, log) */
  const htmlString = '<i>Placeholder Output (FTML cannot render yet)</i>'

  if (raw) return htmlString

  // parse using xhtml so that the document is not "auto-corrected"
  const doc = domParser.parseFromString(htmlString, 'text/xml')
  const fragment = document.createDocumentFragment()
  fragment.appendChild(doc.documentElement)

  return fragment
}

/** Returns an object containing the results of every step of the FTML rendering pipeline.
 *  @see preprocess
 *  @see tokenize
 *  @see parse
 *  @see render */
export function detailedRender(str: string) {
  if (!ready) throw new Error('FTML has not been instantiated yet!')

  const measurePerf = perfy()

  const preprocessed = preprocess(str.repeat(100))
  const tokens = tokenize(preprocessed)
  const parsed = parse(tokens)
  const html = render(parsed)

  return {
    msTime: measurePerf(),
    preprocessed,
    tokens,
    ast: parsed.ast,
    warnings: parsed.warnings,
    html
  }
}

// -- LIBRARY UTIL

export function inspectTokens(tokens: FTMLToken[]) {
  let out = ''
  for (const { slice, span: { start, end }, token } of tokens) {
    const tokenStr = String(token.padEnd(16))
    const startStr = String(start).padStart(4, '0')
    const endStr = String(end).padStart(4, '0')
    const sliceStr = slice.slice(0, 40).replaceAll('\n', '\\n')
    out += `[${startStr} <-> ${endStr}]: ${tokenStr} => '${sliceStr}'\n`
  }
  return out
}
