import { EditorView } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { HighlightStyle, tags as t } from '@codemirror/highlight'
import monarchMarkdown from './monarch-markdown'

// Confinement Theme

const
  background = 'var(--colcode-background)',
  border = 'var(--colcode-border)',
  accent = 'var(--colcode-accent)',
  selection = 'var(--colcode-selection)',
  text = 'var(--colcode-content)',
  comment = 'var(--colcode-comment)',
  doc = 'var(--colcode-commentdoc)',
  punct = 'var(--colcode-punct)',
  operator = 'var(--colcode-operator)',
  keyword = 'var(--colcode-keyword)',
  logical = 'var(--colcode-logical)',
  string = 'var(--colcode-string)',
  entity = 'var(--colcode-entity)',
  type = 'var(--colcode-type)',
  ident = 'var(--colcode-ident)',
  func = 'var(--colcode-function)',
  constant = 'var(--colcode-constant)',
  property = 'var(--colcode-property)',
  tag = 'var(--colcode-tag)',
  classes = 'var(--colcode-class)',
  attr = 'var(--colcode-attribute)',
  link = 'var(--colcode-link)',
  invalid = 'var(--colcode-invalid)',
  inserted = 'var(--colcode-inserted)',
  changed = 'var(--colcode-changed)',
  important = 'var(--colcode-important)',
  highlight = 'var(--colcode-highlight)',
  note = 'var(--colcode-note)',
  special = 'var(--colcode-special)'

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
    fontWeigth: '400',
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

  '$$focused $cursor': {
    borderLeftColor: accent,
    transition: 'left 0.1s ease-out, top 0.1s ease-out'
  },
  '$$focused $selectionBackground': {
    backgroundColor: selection
  },
  '$line': {
    '& ::selection': { color: 'inherit !important' },
    '&::selection': { color: 'inherit !important' }
  },

  '$$focused $cursorLayer': {
    animation: 'cubic-bezier(0.95, 0, 0.05, 1) cm-blink 1.2s infinite'
  },

  '@keyframes cm-blink': { '0%': {}, '50%': { opacity: '0' }, '100%': {} },
  '@keyframes cm-blink2': { '0%': {}, '50%': { opacity: '0' }, '100%': {} },

  $panels: { backgroundColor: background, color: text },
  '$panels.top': { borderBottom: `2px solid ${border}` },
  '$panels.bottom': { borderTop: `2px solid ${border}` },

  $searchMatch: {
    backgroundColor: '#72a1ff59',
    outline: `1px solid ${accent}`
  },
  '$searchMatch.selected': {
    backgroundColor: '#6199ff2f'
  },

  $activeLine: {
    background: background,
    filter: 'brightness(102.5%)'
  },
  $selectionMatch: { backgroundColor: '#aafe661a' },

  '$matchingBracket, $nonmatchingBracket': {
    backgroundColor: '#bad0f847',
    outline: '1px solid #515a6b'
  },

  $gutters: {
    backgroundColor: background,
    color: comment,
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
  // Keywords + Operators
  {
    tag: [t.keyword],
    color: keyword
  },
  {
    tag: [t.controlOperator, t.logicOperator, t.compareOperator],
    color: logical
  },
  {
    tag: [t.regexp, t.operator],
    color: operator
  },
  // Names and Types
  {
    tag: [t.name],
    color: ident
  },
  {
    tag: [t.propertyName],
    color: property
  },
  {
    tag: [t.className],
    color: classes
  },
  {
    tag: [t.typeName, t.escape, t.standard(t.name)],
    color: type
  },
  {
    tag: [t.namespace],
    color: entity
  },
  // Functions
  {
    tag: [t.function(t.name), t.function(t.propertyName), t.macroName],
    color: func
  },
  {
    tag: [t.atom, t.annotation, t.special(t.name), t.special(t.string)],
    color: func
  },
  // Literals
  {
    tag: [t.labelName, t.monospace, t.string],
    color: string
  },
  {
    tag: [t.constant(t.name), t.local(t.name), t.literal, t.unit],
    color: constant
  },
  // Changes
  {
    tag: [t.deleted, t.invalid],
    color: invalid
  },
  {
    tag: [t.inserted],
    color: inserted
  },
  {
    tag: [t.changed],
    color: changed
  },
  // Punctuation, Comments
  {
    tag: [t.punctuation],
    color: punct
  },
  {
    tag: [t.meta, t.comment],
    color: comment
  },
  {
    tag: [t.docComment, t.docString],
    color: doc
  },
  // Misc.
  {
    tag: [t.self],
    color: special
  },
  // Markup
  {
    tag: [t.link],
    color: link,
  },
  {
    tag: t.url,
    color: link,
    textDecoration: 'underline'
  },
  { tag: t.strong, fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.heading, fontWeight: 'bold', color: tag },
  {
    tag: t.contentSeparator,
    fontWeight: 'bold', color: tag,
    display: 'inline-block', width: 'calc(100% - 1rem)',
    boxShadow: `inset 0 0.125rem 0 ${border}`
  },
  // markdown extended
  { tag: mt.superscript, position: 'relative', top: '-0.25em', fontSize: '90%' },
  { tag: mt.subscript, position: 'relative', top: '0.25em', fontSize: '90%' },
  { tag: mt.underline, textDecoration: 'underline' },
  { tag: mt.strikethrough, textDecoration: 'line-through' },
  { tag: mt.mark, background: important, color: 'black' },
  // critical markup
  { tag: mt.criticHighlight, color: highlight },
  { tag: mt.criticComment, color: note },
)

export const confinement: Extension = [confinementTheme, confinementHighlightStyle]