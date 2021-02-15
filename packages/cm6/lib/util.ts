import { Input, stringInput, Tree } from 'lezer-tree'

// credit to: https://discuss.codemirror.net/u/grayen/summary
export function printTree(tree: Tree, input: Input | string, from = 0, to = input.length): string {
  if (typeof input === 'string') input = stringInput(input)
  let out = ''
  const c = tree.cursor()
  const childPrefixes: string[] = []
  for (;;) {
    const { type } = c
    const cfrom = c.from
    const cto = c.to
    let leave = false
    if (cfrom <= to && cto >= from) {
      if (!type.isAnonymous) {
        leave = true
        if (!type.isTop) {
          out += '\n' + childPrefixes.join('')
          if (c.nextSibling() && c.prevSibling()) {
            out += '├─ '
            childPrefixes.push('│  ')
          } else {
            out += '└─ '
            childPrefixes.push('   ')
          }
        }
        out += type.name
      }
      const isLeaf = !c.firstChild()
      if (!type.isAnonymous) {
        const hasRange = cfrom !== cto
        out += ` ${hasRange ? `[${cfrom}..${cto}]` : cfrom}`
        if (isLeaf && hasRange) {
          const str = input.read(cfrom, cto).trim().replaceAll('\n', '\\n')
          out += `: '${str.length > 30 ? str.slice(0, 27) + '...' : str}'`
        }
      }
      if (!isLeaf || type.isTop) continue
    }
    for (;;) {
      if (leave) childPrefixes.pop()
      leave = c.type.isAnonymous
      if (c.nextSibling()) break
      if (!c.parent()) return out
      leave = true
    }
  }
}
