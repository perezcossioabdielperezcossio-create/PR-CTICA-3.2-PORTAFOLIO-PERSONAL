import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { validateMember } from './members.js'

export function createApp({ database = ':memory:', assets } = {}) {
  if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true })
  const db = new DatabaseSync(database)
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
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '8kb' }))

  app.get('/api/health', (_req, res) => {
    health.get()
    res.json({ status: 'ok' })
  })

  app.post('/api/members', (req, res) => {
    const member = validateMember(req.body)
    if (member.error) return res.status(400).json({ error: member.error })
    const result = insert.run(member.name, member.email)
    if (!result.changes) return res.status(409).json({ error: 'Este correo ya está registrado.' })
    res.status(201).json({ message: 'Socio registrado correctamente.' })
  })

  if (assets) app.use(express.static(assets))
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' })
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' })
    console.error(err)
    res.status(500).json({ error: 'Ocurrió un error interno.' })
  })
  return { app, close: () => db.close() }
}
