const findLastIndex = (arr, test) =>
  arr.length - 1 - arr.slice().reverse().findIndex(test)
const indentMultiline = (lines, indent, indentString) => {
  let str = lines[0]
  lines.shift()
  if (lines.length > 0) {
    indent = indent + ' '.repeat([...(indentString || '')].length)
    str = str + '\n' + lines.map((line) => indent + line).join('\n')
  }
  return str
}

module.exports = { findLastIndex, indentMultiline }
