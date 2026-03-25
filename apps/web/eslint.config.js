const { defineConfig } = require("eslint/config")
const tsParser = require("@typescript-eslint/parser")

module.exports = defineConfig([
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
])
