function register(name, email) {
  cy.get('#name').clear().type(name)
  cy.get('#email').clear().type(email)
  cy.contains('button', 'Registrar socio').click()
}

describe('Registro de gimnasio', () => {
  beforeEach(() => {
    cy.task('resetMembers')
    cy.visit('/')
  })

  it('da de alta a un socio desde el formulario y limpia los campos', () => {
    cy.get('h1').should('have.text', 'Registro de gimnasio.')
    register('Ana Rojas', 'ana@example.com')
    cy.get('[role="status"]').should('have.text', 'Socio registrado correctamente.')
    cy.get('#name').should('have.value', '')
    cy.get('#email').should('have.value', '')
  })

  it('muestra el error de correo duplicado', () => {
    register('Beto Rojas', 'beto@example.com')
    cy.get('[role="status"]').should('be.visible')
    register('Otra persona', 'BETO@example.com')
    cy.get('[role="alert"]').should('have.text', 'Este correo ya está registrado.')
  })

  it('muestra el mensaje de validación de nombre', () => {
    register(' a ', 'carla@example.com')
    cy.get('[role="alert"]').should('have.text', 'Escribe un nombre de entre 2 y 100 caracteres.')
  })
})
