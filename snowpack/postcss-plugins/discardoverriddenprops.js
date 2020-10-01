/* 
Maksim Baranov
https://github.com/mcler/postcss-discard-overridden-props
MIT License

Copyright (c) 2018 mcler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var postcss = require('postcss');

var removedNumber = 0;
var prefixRegexp = /-(webkit|moz|o|ms|khtml)-/;

function ignoreProp(prop, value, ignoredProps) {
  return ignoredProps.indexOf(prop) >= 0
    || /-(webkit|moz|o|ms|khtml)-/.test(prop)
    || /-(webkit|moz|o|ms|khtml)-/.test(value);
}

function unprefixProp(prop) {
  return prop.replace(prefixRegexp, '');
}

function optimise (options, rule) {
  const LOG = options.log === true;
  const NO_DELETE = LOG && options.noDelete === true;
  const PROPS = (options.props && options.props.length) ? options.props : false;
  const IGNORE_PREFIX = options.ignorePrefix;

  // ignoring node types
  if (rule && rule.type === 'decl' || rule.type === 'comment') {
    return;
  }

  if (rule && rule.selector) {
    let decls = [];
    let result = [];
    let removes = [];
    let ignoredProps = [];

    for (let i in rule.nodes) {
      let node = rule.nodes[i];
      if (node.type === 'comment') {
        continue;
      } else if (node.type !== 'decl') { // optimise child rules
        optimise(options, node);
      } else if (node.prop) {
        if (IGNORE_PREFIX && ignoreProp(node.prop, node.value, ignoredProps)) { // ignoring prefixed values
          ignoredProps.push(node.prop);
          ignoredProps.push( unprefixProp(node.prop) );

          continue;
        } else if (PROPS && PROPS.indexOf(node.prop)) {
          continue;
        }

        decls.push({
          indexNode: i,
          // indexDecl: decls.length,
          remove: false,

          prop: node.prop,
          value: node.value,
          important: node.important
        });
      }
    }

    for (let i in decls) {
      let decl = decls[i];

      if (decl === undefined || ignoredProps.indexOf(decl.prop) >= 0) { // ignoring some props
        continue;
      }

      if (result[decl.prop] === undefined) {
        result[decl.prop] = decl;
      } else {
        let resultDecl = result[decl.prop];

        let removeIndex;
        if (resultDecl.important !== true || decl.important === true) { // was not important or overridden by important
          removeIndex = resultDecl.indexNode;
        } else { // not overridden
          decl.remove = true;
          removeIndex = decl.indexNode;
        }

        if (rule.nodes[removeIndex]) {
          removes.push(rule.nodes[removeIndex]);
        }
      }
    }

    if (LOG && removes.length) {
      console.log(rule.selector);
    }

    for (var i in removes) {
      let decl = removes[i];

      if (decl) {
        if (LOG) {
          console.log(
            ' - ',
            decl.prop,
            ': ',
            decl.value,
            decl.important ? ' !important': ''
          );
        }

        if (!NO_DELETE) {
          decl.remove();
          removedNumber++;
        }
      }
    }
  }
}

module.exports = postcss.plugin('postcss-discard-overridden-props', options => {
  options = options || {};

  return css => {
    css.walkRules(rule => optimise(options, rule));
    if (options.log) {
      console.log('postcss-discard-overridden-props has deleted:', removedNumber);
    }
  }
});
