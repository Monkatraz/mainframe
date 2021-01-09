import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { HighlightStyle, tags as t } from '@codemirror/highlight'
import monarchMarkdown from './monarch-markdown'

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
    width: 'auto',
    height: '100%'
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
    background: doc,
    border: 'none',
    padding: '0 0.5rem',
    margin: '0 0.25rem',
    color: 'white'
  },

  $tooltip: {
    border: '1px solid #181a1f',
    backgroundColor: '#606862'
  },
  '$tooltip.autocomplete': {
    '& > ul > li[aria-selected]': { backgroundColor: background }
  }
}, { dark: true })

const mt = monarchMarkdown.tags

export const confinementHighlightStyle = HighlightStyle.define(
  {
    tag: [t.keyword, t.operatorKeyword, t.logicOperator, t.compareOperator],
    color: keyword
  },
  {
    tag: [t.deleted, t.propertyName, t.macroName,],
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
    tag: [t.processingInstruction, t.monospace, t.string, t.regexp, t.inserted, t.special(t.string)],
    color: string
  },
  {
    tag: [t.character, t.unit, t.color, t.constant(t.name), t.number, t.bool, t.null],
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
  },
  {
    tag: t.url,
    color: link,
    textDecoration: 'underline'
  },
  {
    tag: [t.atom, t.special(t.variableName)],
    color: func
  },
  {
    tag: t.invalid,
    color: invalid
  },
  // markdown
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.heading, fontWeight: 'bold', color: tag },
  {
    tag: t.contentSeparator,
    fontWeight: 'bold', color: tag,
    display: 'inline-block', width: 'calc(100% - 1rem)',
    boxShadow: '0 -0.125rem 0 #333842'
  },
  // markdown extended
  { tag: mt.superscript, position: 'relative', top: '-0.25em', fontSize: '90%' },
  { tag: mt.subscript, position: 'relative', top: '0.25em', fontSize: '90%' },
  { tag: mt.underline, textDecoration: 'underline' },
  { tag: mt.strikethrough, textDecoration: 'line-through' },
  { tag: mt.mark, background: '#FFCB6BEE', color: 'black' },
  // critical markup
  { tag: mt.criticAddition, color: '#54D169' },
  { tag: mt.criticDeletion, color: '#E04B36' },
  { tag: mt.criticSub, color: '#FF9614' },
  { tag: mt.criticHighlight, color: '#C878C8' },
  { tag: mt.criticComment, color: '#5694D6' },
)

export const confinement: Extension = [confinementTheme, confinementHighlightStyle]