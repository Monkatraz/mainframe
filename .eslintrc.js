module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true
  },
  extends: ['standard', 'plugin:compat/recommended'],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'no-unused-vars': 0,
    'no-trailing-spaces': 0,
    'prefer-const': 0
  }
}
