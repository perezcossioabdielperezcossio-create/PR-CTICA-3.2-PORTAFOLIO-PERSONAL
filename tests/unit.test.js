import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateMember } from '../server/members.js'

test('normaliza el nombre y el correo', () => {
  assert.deepEqual(validateMember({ name: '  Ada   Pérez ', email: ' ADA@EXAMPLE.COM ' }), {
    name: 'Ada Pérez', email: 'ada@example.com'
  })
})

test('rechaza nombres vacíos, cortos y demasiado largos', () => {
  for (const name of ['', ' A ', 'a'.repeat(101), null]) {
    assert.match(validateMember({ name, email: 'a@example.com' }).error, /nombre/)
  }
})

test('rechaza correos que no tienen un dominio válido para el formulario', () => {
  for (const email of ['ada', 'ada@example', 'ada @example.com', null]) {
    assert.match(validateMember({ name: 'Ada', email }).error, /correo/)
  }
})
