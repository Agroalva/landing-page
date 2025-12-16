const { defineConfig } = require('eslint/config');

module.exports = defineConfig({
  root: true,
  ignores: ['dist/**'],
  languageOptions: {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
});
