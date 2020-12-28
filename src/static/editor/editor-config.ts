import { EditorState } from "@codemirror/next/state"
import { EditorView } from '@codemirror/next/view'
import type { Extension } from '@codemirror/next/state'
import { HighlightStyle, tags as t } from '@codemirror/next/highlight'

export { EditorState } from "@codemirror/next/state"
export { EditorView } from '@codemirror/next/view'

// Confinement Theme

const
  background = '#282C34',
  accent = '#4D78CC',
  selection = '#4B5365A6',
  text = '#ABB2BF',
  comment = '#5C6370',
  doc = '#687387',
  punct = '#727d9c',
  operator = '#56B6C2',
  keyword = '#C678DD',
  string = '#98C379',
  entity = '#98C379',
  type = '#E5C07B',
  ident = '#2D8EDF',
  func = '#61AFEF',
  constant = '#D19A66',
  property = '#E06C75',
  tag = '#E06C75',
  attr = '#FFCB6B',
  link = '#64a0ff',
  invalid = '#FF3214'

export const confinementTheme = EditorView.theme({
  $: {
    color: text,
    backgroundColor: background,
    '& ::selection': { backgroundColor: selection },
    caretColor: accent,
    '&$focused': { outline: 'none' },
    width: '100%'
  },

  $scroller: {
    fontFamily: 'var(--font-mono)',
    height: '100%',
    fontSize: '13px',
    position: 'relative',
    overflowX: 'auto',
    zIndex: 0
  },

  $content: {
    width: '100%',
    whiteSpace: 'pre-wrap',
    paddingBottom: '70vh',
    maxWidth: '45rem',
    lineHeight: '18px',
    overflowWrap: 'normal'
  },

  '$$focused $cursor': { borderLeftColor: accent },
  '$$focused $selectionBackground': { backgroundColor: selection },

  $panels: { backgroundColor: background, color: text },
  '$panels.top': { borderBottom: '2px solid black' },
  '$panels.bottom': { borderTop: '2px solid black' },

  $searchMatch: {
    backgroundColor: '#72a1ff59',
    outline: `1px solid ${accent}`
  },
  '$searchMatch.selected': {
    backgroundColor: '#6199ff2f'
  },

  $activeLine: { backgroundColor: '#2c313c' },
  $selectionMatch: { backgroundColor: '#aafe661a' },

  '$matchingBracket, $nonmatchingBracket': {
    backgroundColor: '#bad0f847',
    outline: '1px solid #515a6b'
  },

  $gutters: {
    backgroundColor: background,
    color: '#545868',
    border: 'none'
  },
  '$gutterElement.lineNumber': { color: 'inherit' },

  $foldPlaceholder: {
    backgroundColor: 'none',
    border: 'none',
    color: '#ddd'
  },

  $tooltip: {
    border: '1px solid #181a1f',
    backgroundColor: '#606862'
  },
  '$tooltip.autocomplete': {
    '& > ul > li[aria-selected]': { backgroundColor: background }
  }
}, { dark: true })


export const confinementHighlightStyle = HighlightStyle.define(
  {
    tag: [t.keyword, t.operatorKeyword, t.logicOperator, t.compareOperator],
    color: keyword
  },
  {
    tag: [t.deleted, t.propertyName, t.macroName],
    color: property
  },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.name), t.labelName],
    color: func
  },
  {
    tag: [t.name, t.standard(t.name)],
    color: ident
  },
  {
    tag: [t.processingInstruction, t.string, t.regexp, t.inserted, t.special(t.string)],
    color: string
  },
  {
    tag: [t.character, t.color, t.constant(t.name), t.number, t.bool, t.null],
    color: constant
  },
  {
    tag: [t.definition(t.name), t.separator, t.punctuation, t.bracket],
    color: punct
  },
  {
    tag: [t.typeName, t.escape, t.changed, t.annotation, t.self],
    color: type
  },
  {
    tag: [t.namespace, t.className],
    color: entity
  },
  {
    tag: [t.operator, t.modifier, t.definitionKeyword, t.derefOperator, t.typeOperator],
    color: operator
  },
  {
    tag: [t.meta, t.comment],
    color: comment
  },
  {
    tag: [t.docComment, t.docString],
    color: doc
  },
  {
    tag: [t.link, t.url],
    color: link,
    textDecoration: 'underline'
  },

  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.heading, fontWeight: 'bold', color: tag },
  { tag: [t.atom, t.special(t.variableName)], color: func },
  { tag: t.invalid, color: invalid },
)

export const confinement: Extension = [confinementTheme, confinementHighlightStyle]

// Extensions

import { keymap } from '@codemirror/next/view'
import { highlightSpecialChars, highlightActiveLine, drawSelection } from '@codemirror/next/view'
import { history, historyKeymap } from '@codemirror/next/history'
import { foldGutter, foldKeymap } from '@codemirror/next/fold'
import { indentOnInput } from '@codemirror/next/language'
import { lineNumbers } from '@codemirror/next/gutter'
import { defaultKeymap } from '@codemirror/next/commands'
import { bracketMatching } from '@codemirror/next/matchbrackets'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/next/closebrackets'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/next/search'
import { autocompletion, completionKeymap } from '@codemirror/next/autocomplete'
import { commentKeymap } from '@codemirror/next/comment'
import { rectangularSelection } from '@codemirror/next/rectangular-selection'
// Languages
import { languages } from '@codemirror/next/language-data'
import { markdown } from '@codemirror/next/lang-markdown'
// Local Extensions
import { redo } from '@codemirror/next/history'
import { indentMore, indentLess, copyLineDown } from '@codemirror/next/commands'

export async function getExtensions() {
  // TODO: remove when this isn't an issue anymore
  // certain legacy languages currently crash CodeMirror, so this filters those out
  const freezingLangs = ['Go', 'Lua']
  const langs = languages.filter(lang => !freezingLangs.includes(lang.name))
  return [
    lineNumbers(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    highlightSelectionMatches(),
    autocompletion(),
    rectangularSelection(),
    highlightActiveLine(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...commentKeymap,
      ...completionKeymap,
      ...[
        { key: 'Tab', run: indentMore, preventDefault: true },
        { key: 'Shift-Tab', run: indentLess, preventDefault: true },
        { key: 'Mod-Shift-z', run: redo, preventDefault: true },
        { key: 'Mod-d', run: copyLineDown, preventDefault: true }
      ]
    ]),
    markdown({ codeLanguages: langs, addKeymap: true }),
    confinement
  ]
}