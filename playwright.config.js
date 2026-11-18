import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: {
    command: 'node server/index.js',
    url: 'http://127.0.0.1:4173/api/health',
    env: { PORT: '4173', DB_PATH: ':memory:' }
  }
})
