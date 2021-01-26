module.exports = {
  extends: ['stylelint-config-rational-order'],
  plugins: ['stylelint-plugin-stylus'],
  rules: {
    'property-no-unknown': null,
    'stylus/color-hex-case': 'upper',
    'stylus/indentation': [2, { ignore: ['value'] }],
    'stylus/media-feature-colon': 'always',
    'stylus/number-no-trailing-zeros': true,
    'stylus/number-leading-zero': 'always',
    'stylus/single-line-comment-double-slash-space-after': 'always',
    'stylus/declaration-colon': 'always',
    'stylus/pythonic': 'always',
    'stylus/selector-list-comma': 'always',
    'stylus/semicolon': 'never',
    'stylus/single-line-comment': 'always'
  }
}
