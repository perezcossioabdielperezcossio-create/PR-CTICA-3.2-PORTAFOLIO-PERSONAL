const adminKey = 'cypress-admin-key-only'
const password = 'prueba-cypress-2026'
const email = 'socio@example.com'

function request(method, path, body, key) {
  return cy.request({
    method,
    url: '/api/account' + path,
    ...(body && { body }),
    ...(key && { headers: { Authorization: 'Bearer ' + key } }),
    failOnStatusCode: false
  })
}

function issueCode() {
  return request('POST', '/admin/activation', { email }, adminKey).its('body.code')
}

function activate(code) {
  return request('POST', '/activate', { email, code, password })
}

function activateAndLogin() {
  issueCode().then(code => activate(code).its('status').should('equal', 204))
  request('POST', '/login', { email, password }).its('status').should('equal', 204)
}

describe('API de cuentas y SQLite', () => {
  beforeEach(() => {
    cy.task('resetMembers')
    cy.request('POST', '/api/members', { name: 'Ana Rojas', email })
  })

  it('protege el perfil y la bandeja sin credenciales', () => {
    request('GET', '/me').its('status').should('equal', 401)
    request('GET', '/admin/messages').its('status').should('equal', 401)
  })

  it('rechaza códigos inválidos o reutilizados y contraseñas incorrectas', () => {
    issueCode().then(code => {
      activate('0'.repeat(48)).its('status').should('equal', 400)
      activate(code).its('status').should('equal', 204)
      activate(code).its('status').should('equal', 400)
    })
    request('POST', '/login', { email, password: 'incorrecta' }).its('status').should('equal', 401)
  })

  it('permite la activación con el último código emitido y rechaza el anterior', () => {
    issueCode().then(oldCode => {
      issueCode().then(currentCode => {
        activate(oldCode).its('status').should('equal', 400)
        activate(currentCode).its('status').should('equal', 204)
      })
    })
  })

  it('impide cambiar el correo por el de otro socio y conserva los datos guardados', () => {
    cy.request('POST', '/api/members', { name: 'Otro socio', email: 'ocupado@example.com' })
    activateAndLogin()
    request('PUT', '/me', { name: 'Ana Editada', email: 'ocupado@example.com', phone: '+591 70123456' })
      .its('status').should('equal', 409)
    request('GET', '/me').its('body.profile').should('deep.equal', { name: 'Ana Rojas', email, phone: '' })
  })

  it('guarda la asistencia y entrega el mensaje solo al administrador autenticado', () => {
    activateAndLogin()
    request('POST', '/me/attendance').its('status').should('equal', 201)
    request('POST', '/me/attendance').its('status').should('equal', 409)
    request('GET', '/me').its('body.days').should('have.length', 1)
    request('POST', '/me/messages', { message: 'Consulta de prueba' }).its('status').should('equal', 201)
    request('GET', '/admin/messages').its('status').should('equal', 401)
    request('GET', '/admin/messages', undefined, adminKey).its('body.messages.0.text')
      .should('equal', 'Consulta de prueba')
  })

  it('exige contraseña para la baja y revoca el acceso al eliminar la membresía', () => {
    activateAndLogin()
    request('POST', '/me/messages', { message: 'Mensaje temporal' })
    request('DELETE', '/me', { password: 'incorrecta' }).its('status').should('equal', 403)
    cy.task('countMembers').should('equal', 1)
    request('DELETE', '/me', { password }).its('status').should('equal', 204)
    cy.task('countMembers').should('equal', 0)
    request('GET', '/me').its('status').should('equal', 401)
    request('GET', '/admin/messages', undefined, adminKey).its('body.messages').should('deep.equal', [])
  })
})
