const eslintSveltePreprocess = require('./dev/eslint-svelte-preprocess')

function useDefault (type, rules) {
  return Object.assign({}, ...rules.map(rule => ({ [rule]: type })))
}

const rules = {

  code: {
    ...useDefault('error', [
      'eqeqeq',
      'dot-notation',
      'yoda',
      'prefer-rest-params',
      'prefer-spread',
      'sort-imports',
      'symbol-description',
      'template-curly-spacing',
      'prefer-numeric-literals',
      'no-useless-rename',
      'no-useless-computed-key',
      'no-useless-constructor',
      'no-useless-concat',
      'no-undef-init',
      'no-throw-literal',
      'default-case-last',
      'default-param-last',
      'require-await',
      'wrap-iife'
    ]),
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': true,
      'allowSeparatedGroups': true
    }],
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }]
  },

  restrict: {
    ...useDefault('error', [
      'no-alert',
      'no-caller',
      'no-eval',
      'no-implied-eval',
      'no-var',
      'no-script-url',
    ])
  },

  style: {
    ...useDefault('error', [
      'block-spacing',
      'comma-dangle',
      'comma-style',
      'computed-property-spacing',
      'func-call-spacing',
      'keyword-spacing',
      'new-parens',
      'no-lonely-if',
      'no-trailing-spaces',
      'no-unneeded-ternary',
      'no-whitespace-before-property',
      'operator-assignment',
      'prefer-exponentiation-operator',
      'space-before-blocks',
      'space-in-parens',
      'space-unary-ops',
      'spaced-comment',
      'switch-colon-spacing',
      'template-tag-spacing',
      'arrow-body-style',
      'arrow-spacing'
    ]),
    'indent': ['error', 2, { SwitchCase: 1 }],
    'key-spacing': ['error', { mode: 'minimum' }],
    'object-curly-spacing': ['error', 'always'],
    'quote-props': ['error', 'consistent-as-needed'],
    'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'semi': ['error', 'never'],
    'space-before-function-paren': ['error', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
    'space-infix-ops': ['error', { 'int32Hint': true }],
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }]
  },

  typescript: {
    ...useDefault('off', [
      // loosening type checking
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-types',

      // loosening unsafe - mainly due to inconsistencies between the typescript compiler and eslint
      '@typescript-eslint/no-unsafe-member-access',
      '@typescript-eslint/no-unsafe-assignment',
      '@typescript-eslint/no-unsafe-call',
      '@typescript-eslint/no-unsafe-return',

      '@typescript-eslint/no-non-null-assertion',
      '@typescript-eslint/explicit-module-boundary-types',
      '@typescript-eslint/no-unused-vars',
      '@typescript-eslint/no-namespace',
      '@typescript-eslint/restrict-plus-operands'
    ])
  }
}

const mainRules = { ...rules.code, ...rules.restrict, ...rules.style, ...rules.typescript }

const tsConfig = {
  env: { browser: true, es2021: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    createDefaultProgram: true,
    project: 'tsconfig.json'
  },
  extends: [
    "eslint:recommended",
    "plugin:compat/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  rules: mainRules,
}

module.exports = {
  ignorePatterns: ['**/node_modules/**', './build/**'],
  env: { browser: true, es2021: true },
  overrides: [
    // JavaScript (Node)
    {
      files: ['*.js'],
      extends: ['eslint:recommended'],
      env: { es2021: true, node: true },
      rules: {
        'no-unused-vars': 'off'
      }
    },
    // TypeScript (Browser)
    {
      files: ['*.ts', '*.tsx'],
      plugins: ['@typescript-eslint'],
      ...tsConfig
    },
    // Svelte + TypeScript (Browser)
    {
      files: ['*.svelte'],
      plugins: ['svelte3', '@typescript-eslint'],
      processor: 'svelte3/svelte3',
      ...tsConfig,
      settings: {
        'svelte3/preprocess': eslintSveltePreprocess(),
        'svelte3/ignore-styles': () => true,
      }
    }
  ]
}
