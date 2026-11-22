const adminKey = 'cypress-admin-key-only'
const password = 'prueba-cypress-2026'
const email = 'socio@example.com'

describe('Área privada de socios', () => {
  beforeEach(() => {
    cy.task('resetMembers')
    cy.request('POST', '/api/members', { name: 'Ana Rojas', email })
  })

  it('indica que se reinicie si el servidor anterior devuelve 404 HTML', () => {
    cy.intercept('GET', '/api/account/admin/messages', {
      statusCode: 404, headers: { 'content-type': 'text/html' }, body: 'Not found'
    })
    cy.visit('/')
    cy.contains('button', 'Administración').click()
    cy.get('[name="key"]').type(adminKey)
    cy.contains('button', 'Abrir administración').click()
    cy.get('[role="alert"]').should('contain.text', 'El servidor anterior sigue activo.')
  })

  it('activa una cuenta, modifica el perfil, guarda asistencia, envía un mensaje y cancela', () => {
    cy.visit('/')
    cy.contains('button', 'Administración').click()
    cy.contains('label', 'Clave de administración').find('input').type(adminKey)
    cy.contains('button', 'Abrir administración').click()
    cy.contains('label', 'Correo del socio').find('input').type(email)
    cy.contains('button', 'Generar código').click()
    cy.contains('[role="status"]', /Código de un solo uso.*[a-f0-9]{48}/).invoke('text').then(text => {
      const code = text.match(/[a-f0-9]{48}$/)[0]
      cy.contains('button', 'Mi cuenta').click()
      cy.contains('button', 'Activar mi cuenta').click()
      cy.get('[name="email"]').type(email)
      cy.get('[name="code"]').type(code)
      cy.get('[name="password"]').type(password)
      cy.contains('button', /^Activar cuenta$/).click()
    })
    cy.contains('Cuenta activada.').should('be.visible')
    cy.get('[name="email"]').type(email)
    cy.get('[name="password"]').type(password)
    cy.contains('button', /^Entrar$/).click()

    cy.get('[name="name"]').clear().type('Ana Editada')
    cy.get('[name="phone"]').type('+591 70123456')
    cy.get('[name="email"]').clear().type('editada@example.com')
    cy.contains('button', 'Guardar datos').click()
    cy.contains('Datos actualizados.').should('be.visible')
    cy.task('findMember', 'editada@example.com').should('deep.equal', { name: 'Ana Editada', email: 'editada@example.com' })

    cy.contains('button', 'Registrar asistencia de hoy').click()
    cy.contains('Asistencia guardada.').should('be.visible')
    cy.contains('button', 'Registrar asistencia de hoy').click()
    cy.contains('Ya registraste tu asistencia de hoy.').should('be.visible')
    cy.get('[name="message"]').type('Consulta sobre horarios')
    cy.contains('button', 'Enviar mensaje').click()
    cy.contains('Mensaje enviado.').should('be.visible')

    cy.reload()
    cy.contains('button', 'Administración').click()
    cy.get('[name="key"]').type(adminKey)
    cy.contains('button', 'Abrir administración').click()
    cy.contains('Consulta sobre horarios').should('be.visible')

    cy.contains('button', 'Mi cuenta').click()
    cy.get('[name="phone"]').should('have.value', '+591 70123456')
    cy.get('time').should('have.length', 1)
    cy.contains('button', 'Cerrar sesión').click()
    cy.contains('h2', 'Iniciar sesión').should('be.visible')
    cy.get('[name="email"]').type('editada@example.com')
    cy.get('[name="password"]').type(password)
    cy.contains('button', /^Entrar$/).click()
    cy.contains('h2', 'Cancelar membresía').closest('form')
      .find('[name="password"]').type(password)
    cy.on('window:confirm', () => true)
    cy.contains('button', 'Eliminar mi membresía').click()
    cy.contains('Membresía eliminada.').should('be.visible')
    cy.task('countMembers').should('equal', 0)
    cy.request({ url: '/api/account/me', failOnStatusCode: false }).its('status').should('equal', 401)
  })
})
