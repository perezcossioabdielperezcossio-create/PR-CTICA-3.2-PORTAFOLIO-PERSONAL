import { defineConfig } from 'cypress'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { createApp } from './server/app.js'

export default defineConfig({
  e2e: {
    supportFile: false,
    async setupNodeEvents(on, config) {
      const directory = mkdtempSync(join(tmpdir(), 'gym-cypress-'))
      const database = join(directory, 'gym.sqlite')
      const { app, close } = createApp({
        database,
        adminKey: 'cypress-admin-key-only',
        assets: fileURLToPath(new URL('./dist/', import.meta.url))
      })
      const testDatabase = new DatabaseSync(database)
      const server = app.listen(0, '127.0.0.1')
      await once(server, 'listening')

      on('task', {
        resetMembers() {
          testDatabase.exec('DELETE FROM members')
          return null
        },
        findMember(email) {
          return testDatabase.prepare('SELECT name, email FROM members WHERE email = ?').get(email) ?? null
        },
        countMembers() {
          return testDatabase.prepare('SELECT COUNT(*) AS total FROM members').get().total
        }
      })

      on('after:run', async () => {
        await new Promise((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve())
          server.closeAllConnections()
        })
        testDatabase.close()
        close()
        rmSync(directory, { recursive: true, force: true })
      })

      config.baseUrl = `http://127.0.0.1:${server.address().port}`
      return config
    }
  }
})
