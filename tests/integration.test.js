import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'
import { createApp } from '../server/app.js'

let server
let closeDatabase
let directory
let database

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'gym-test-'))
  database = join(directory, 'gym.sqlite')
  const { app, close } = createApp({ database })
  closeDatabase = close
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
})

afterEach(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  closeDatabase()
  await rm(directory, { recursive: true, force: true })
})

function register(body) {
  return fetch(`http://127.0.0.1:${server.address().port}/api/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

test('registra y persiste un socio normalizado en SQLite', async () => {
  const result = await register({ name: '  Ada Pérez  ', email: 'ADA@example.com' })
  assert.equal(result.status, 201)
  const persisted = new DatabaseSync(database, { readOnly: true })
  try {
    const row = persisted.prepare('SELECT name, email FROM members').get()
    assert.deepEqual({ ...row }, { name: 'Ada Pérez', email: 'ada@example.com' })
  } finally {
    persisted.close()
  }
})

test('devuelve 409 al registrar el mismo correo', async () => {
  assert.equal((await register({ name: 'Ada', email: 'ada@example.com' })).status, 201)
  assert.equal((await register({ name: 'Otra socia', email: 'ADA@example.com' })).status, 409)
})

test('devuelve 400 ante datos inválidos sin crear un socio', async () => {
  assert.equal((await register({ name: 'Ada', email: 'incorrecto' })).status, 400)
  const persisted = new DatabaseSync(database, { readOnly: true })
  try {
    assert.equal(persisted.prepare('SELECT count(*) AS total FROM members').get().total, 0)
  } finally {
    persisted.close()
  }
})
