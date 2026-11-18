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
})
