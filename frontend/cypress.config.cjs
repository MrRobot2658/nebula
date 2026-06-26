// CommonJS config: the project's package.json is `"type": "module"`, so a `.ts`
// config gets loaded as ESM and breaks Cypress's ts-node (CJS) transpile.
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  video: false,
  env: {
    apiBase: 'http://localhost:8000',
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
  },
})
