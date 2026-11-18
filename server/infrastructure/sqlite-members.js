import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

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
    const insert = db.prepare('INSERT INTO members (name, email) VALUES (?, ?) ON CONFLICT(email) DO NOTHING')
    const health = db.prepare('SELECT id FROM members LIMIT 1')

    return {
      add({ name, email }) {
        return insert.run(name, email).changes > 0
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
