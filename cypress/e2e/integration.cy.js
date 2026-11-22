import { seedMembers } from '../support/seed-members.js'

function register(name, email) {
  return cy.request({
    method: 'POST',
    url: '/api/members',
    body: { name, email },
    failOnStatusCode: false
  })
}

describe('API de socios y SQLite', () => {
  beforeEach(() => {
    cy.task('resetMembers')
  })

  it('registra y persiste un socio normalizado', () => {
    register('  Ada Pérez  ', 'ADA@example.com').its('status').should('equal', 201)
    cy.task('findMember', 'ada@example.com')
      .should('deep.equal', { name: 'Ada Pérez', email: 'ada@example.com' })
  })

  it('responde 409 al registrar un correo duplicado', () => {
    register('Ada Pérez', 'duplicado@example.com').its('status').should('equal', 201)
    register('Otra socia', 'DUPLICADO@example.com').its('status').should('equal', 409)
  })

  it('responde 400 y evita escribir datos inválidos', () => {
    cy.task('countMembers').then(total => {
      register('Ada Pérez', 'incorrecto').its('status').should('equal', 400)
      cy.task('countMembers').should('equal', total)
    })
  })

  it('devuelve una lista vacía cuando SQLite no tiene socios', () => {
    cy.request('/api/members').then(({ status, body, headers }) => {
      expect(status).to.equal(200)
      expect(body).to.deep.equal({ members: [] })
      expect(headers['cache-control']).to.equal('no-store')
    })
  })

  it('lista las altas guardadas en orden y con su fecha', () => {
    register('Primera socia', 'primera@example.com').its('status').should('equal', 201)
    register('Segundo socio', 'segundo@example.com').then(({ status, body }) => {
      expect(status).to.equal(201)
      cy.request('/api/members').its('body.members').should(members => {
        expect(members.map(member => member.email)).to.deep.equal([
          'segundo@example.com', 'primera@example.com'
        ])
        expect(members[0]).to.deep.equal(body.member)
        expect(new Date(members[0].registeredAt).toISOString()).to.equal(body.member.registeredAt)
      })
    })
  })

  it('devuelve 400 cuando el cuerpo JSON está incompleto', () => {
    cy.request({
      method: 'POST',
      url: '/api/members',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":',
      failOnStatusCode: false
    }).then(({ status, body }) => {
      expect(status).to.equal(400)
      expect(body.error).to.equal('JSON inválido.')
    })
    cy.task('countMembers').should('equal', 0)
  })

  it('busca por una parte del nombre y omite tildes, mayúsculas y espacios externos', () => {
    register('María Pérez', 'maria@example.com')
    register('Ana Rojas', 'ana@example.net')
    cy.request({ url: '/api/members', qs: { q: '  PEREZ  ' } })
      .its('body.members').should(members => {
        expect(members.map(member => member.email)).to.deep.equal(['maria@example.com'])
      })
  })

  it('busca por correo y devuelve una lista vacía si no encuentra coincidencias', () => {
    register('Ana Rojas', 'ana@example.net')
    register('Beto Rojas', 'beto@example.com')
    cy.request({ url: '/api/members', qs: { q: 'EXAMPLE.NET' } })
      .its('body.members').should(members => {
        expect(members.map(member => member.email)).to.deep.equal(['ana@example.net'])
      })
    cy.request({ url: '/api/members', qs: { q: '%' } })
      .its('body.members').should('deep.equal', [])
  })

  it('rechaza filtros repetidos o demasiado largos', () => {
    cy.request({ url: '/api/members?q=ana&q=beto', failOnStatusCode: false })
      .its('status').should('equal', 400)
    cy.request({ url: '/api/members', qs: { q: 'a'.repeat(255) }, failOnStatusCode: false })
      .its('status').should('equal', 400)
  })

  it('guarda y lista los 20 socios del fixture sin alterar sus datos', () => {
    seedMembers().then(expected => {
      cy.task('countMembers').should('equal', expected.length)
      cy.request('/api/members').its('body.members').should(members => {
        expect(expected).to.have.length(20)
        expect(members.map(({ name, email }) => ({ name, email }))).to.deep.equal([...expected].reverse())
      })
    })
  })
})
