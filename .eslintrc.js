function useDefault(type, rules) {
  return Object.assign({}, ...rules.map(rule => ({ [rule]: type })))
}

function prefixKeys(prefix, obj) {
  const mappedObj = {}
  for (const key in obj) {
    mappedObj[prefix + key] = obj[key]
  }
  return mappedObj
}

const rules = {

  code: {
    ...useDefault('error', [
      'eqeqeq',
      'yoda',
      'prefer-rest-params',
      'prefer-spread',
      'symbol-description',
      'template-curly-spacing',
      'prefer-numeric-literals',
      'no-useless-rename',
      'no-useless-computed-key',
      'no-useless-concat',
      '@typescript-eslint/no-useless-constructor',
      'no-undef-init',
      'no-throw-literal',
      'default-case-last',
      'wrap-iife'
    ]),
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true,
      ignoreMemberSort: true,
      allowSeparatedGroups: true
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
      'no-script-url'
    ])
  },

  style: {
    ...useDefault('warn', [
      'block-spacing',
      'comma-style',
      'computed-property-spacing',
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
      'template-curly-spacing',
      'arrow-body-style',
      'arrow-spacing'
    ]),
    ...prefixKeys('@typescript-eslint/', {
      ...useDefault('warn', [
        'comma-dangle',
        'func-call-spacing'
      ]),
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['warn', 'never'],
      'space-infix-ops': ['warn', { int32Hint: true }],
      'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never', asyncArrow: 'always' }]
    }),
    'object-curly-spacing': ['warn', 'always'],
    // 'indent': ['warn', 2, { SwitchCase: 1 }],
    'key-spacing': ['warn', { mode: 'minimum' }],
    'quote-props': ['warn', 'consistent-as-needed'],
    'arrow-parens': ['warn', 'as-needed', { requireForBlockBody: true }]
  },

  typescript: {
    ...prefixKeys('@typescript-eslint/', {
      // code
      ...useDefault('error', [
        'ban-types',
        'no-invalid-void-type',
        'no-misused-new',
        'no-non-null-asserted-optional-chain',
        'no-require-imports',
        'no-this-alias',
        'no-extra-non-null-assertion',
        'no-unnecessary-type-constraint',
        'prefer-as-const',
        'prefer-enum-initializers',
        'prefer-for-of',
        'prefer-namespace-keyword',
        'prefer-optional-chain',
        'prefer-regexp-exec',
        'no-inferrable-types'
      ]),
      'triple-slash-reference': ['error', { types: 'prefer-import' }],
      // style
      ...useDefault('warn', [
        'adjacent-overload-signatures',
        'array-type',
        'consistent-indexed-object-style',
        'no-confusing-non-null-assertion',
        'type-annotation-spacing'
      ]),
      'class-literal-property-style': ['warn', 'fields']
    })
  },

  typechecked: {
    // code
    ...useDefault('error', [
      'no-misused-promises',
      'no-floating-promises',
      'require-await',
      'no-unnecessary-boolean-literal-compare',
      'no-unnecessary-condition',
      'no-unnecessary-type-assertion',
      'no-confusing-void-expression',
      'no-unnecessary-qualifier',
      'no-unnecessary-type-arguments',
      'non-nullable-type-assertion-style',
      'prefer-includes',
      'prefer-nullish-coalescing'
    ]),
    // style
    ...useDefault('warn', [
      'dot-notation'
    ])
  }
}

const baseRules = { ...rules.code, ...rules.restrict, ...rules.style }
const typeRules = { ...rules.typescript, ...rules.typeChecked }

module.exports = {
  ignorePatterns: ['**/node_modules/**'],
  plugins: ['svelte3', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    extraFileExtensions: ['.svelte']
  },
  overrides: [
    // JavaScript (Node)
    {
      files: ['*.js'],
      env: { node: true, es2021: true },
      parserOptions: { createDefaultProgram: true },
      rules: baseRules
    },
    // TypeScript (Browser)
    {
      files: ['*.ts', '*.tsx'],
      env: { browser: true, es2021: true },
      rules: { ...baseRules, ...typeRules }
    },
    // Svelte + TypeScript (Browser)
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
      env: { browser: true, es2021: true },
      rules: { ...baseRules, ...typeRules },
      settings: {
        'svelte3/typescript': require('typescript'),
        'svelte3/ignore-styles': () => true
      }
    }
  ]
}
