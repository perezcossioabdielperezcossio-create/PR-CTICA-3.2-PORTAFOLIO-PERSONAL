import { createAccountStore } from './sqlite-accounts.js'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function toIsoDate(timestamp) {
  return new Date(timestamp.replace(' ', 'T') + 'Z').toISOString()
}

export function openSqliteMembers(database) {
  if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true })
  const db = new DatabaseSync(database)

  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    const insert = db.prepare('INSERT INTO members (name, email) VALUES (?, ?) ON CONFLICT(email) DO NOTHING RETURNING created_at')
    const selectAll = db.prepare('SELECT name, email, created_at FROM members ORDER BY created_at DESC, id DESC')
    const health = db.prepare('SELECT id FROM members LIMIT 1')

    return {
      accounts: createAccountStore(db),
      add({ name, email }) {
        const row = insert.get(name, email)
        return row ? toIsoDate(row.created_at) : null
      },
      list() {
        return selectAll.all().map(({ name, email, created_at }) => ({
          name, email, registeredAt: toIsoDate(created_at)
        }))
      },
      checkHealth() {
        health.get()
      },
      close() {
        db.close()
      }
    }
  } catch (error) {
    db.close()
    throw error
  }
}
