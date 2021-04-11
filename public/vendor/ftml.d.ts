/* tslint:disable */
/* eslint-disable */
/**
* @param {string} text
* @param {boolean} should_log
* @returns {string}
*/
export function preprocess(text: string, should_log: boolean): string;
/**
* @param {SyntaxTree} syntax_tree
* @param {boolean} should_log
* @returns {HtmlOutput}
*/
export function render_html(syntax_tree: SyntaxTree, should_log: boolean): HtmlOutput;
/**
* @param {Tokenization} tokens
* @param {boolean} should_log
* @returns {ParseOutcome}
*/
export function parse(tokens: Tokenization, should_log: boolean): ParseOutcome;
/**
* @param {string} text
* @param {boolean} should_log
* @returns {Tokenization}
*/
export function tokenize(text: string, should_log: boolean): Tokenization;
/**
* @returns {string}
*/
export function version(): string;


export interface IHtmlOutput {
    html: string;
    style: string;
    meta: IHtmlMeta[];
}

export interface IHtmlMeta {
    tag_type: string;
    name: string;
    value: string;
}





export interface IElement {
    element: string;
    data?: any;
}

export interface ISyntaxTree {
    elements: IElement[];
    styles: string[];
}

export interface IParseWarning {
    token: string;
    rule: string;
    span: {
        start: number;
        end: number;
    };
    kind: string;
}





export interface IToken {
    token: string;
    slice: string;
    span: {
        start: number;
        end: number;
    };
}



/**
*/
export class HtmlOutput {
  free(): void;
/**
* @returns {string}
*/
  html(): string;
/**
* @returns {string}
*/
  style(): string;
/**
* @returns {IHtmlMeta[]}
*/
  html_meta(): IHtmlMeta[];
}
/**
*/
export class ParseOutcome {
  free(): void;
/**
* @returns {SyntaxTree}
*/
  syntax_tree(): SyntaxTree;
/**
* @returns {IParseWarning[]}
*/
  warnings(): IParseWarning[];
}
/**
*/
export class SyntaxTree {
  free(): void;
/**
* @returns {ISyntaxTree}
*/
  get(): ISyntaxTree;
}
/**
*/
export class Tokenization {
  free(): void;
/**
* @returns {string}
*/
  text(): string;
/**
* @returns {IToken[]}
*/
  tokens(): IToken[];
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly preprocess: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_htmloutput_free: (a: number) => void;
  readonly htmloutput_html: (a: number, b: number) => void;
  readonly htmloutput_style: (a: number, b: number) => void;
  readonly htmloutput_html_meta: (a: number) => number;
  readonly render_html: (a: number, b: number) => number;
  readonly __wbg_parseoutcome_free: (a: number) => void;
  readonly parseoutcome_syntax_tree: (a: number) => number;
  readonly parseoutcome_warnings: (a: number) => number;
  readonly __wbg_syntaxtree_free: (a: number) => void;
  readonly syntaxtree_get: (a: number) => number;
  readonly parse: (a: number, b: number) => number;
  readonly tokenization_text: (a: number, b: number) => void;
  readonly tokenization_tokens: (a: number) => number;
  readonly tokenize: (a: number, b: number, c: number) => number;
  readonly version: (a: number) => void;
  readonly __wbg_tokenization_free: (a: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
