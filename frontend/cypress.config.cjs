// CommonJS config: the project's package.json is `"type": "module"`, so a `.ts`
// config gets loaded as ESM and breaks Cypress's ts-node (CJS) transpile.
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  video: false,
  // Retry in run mode: a few specs touch external-latency paths (DeepSeek, async
  // worker on a cold backend). A genuinely broken test still fails all attempts.
  retries: { runMode: 2, openMode: 0 },
  env: {
    apiBase: 'http://localhost:8000',
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
  },
})
