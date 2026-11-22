import { seedMembers } from '../support/seed-members.js'

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

  it('da de alta a un socio y abre el tablero con sus datos', () => {
    cy.get('h1').should('have.text', 'Registro de gimnasio.')
    register('Ana Rojas', 'ana@example.com')
    cy.get('[role="status"]').should('have.text', 'Socio registrado correctamente.')
    cy.get('h1').should('have.text', 'Tablero de asistencia.')
    cy.contains('strong', 'Ana Rojas')
    cy.contains('ana@example.com')
    cy.get('.attendance-days li').should('have.length', 1)

    cy.get('#attendance-day').clear().type('2020-01-15')
    cy.contains('button', 'Agregar día').click()
    cy.get('.attendance-days li').should('have.length', 2)
    cy.get('time[datetime="2020-01-15"]').should('be.visible')

    cy.contains('button', 'Agregar día').click()
    cy.get('[role="alert"]').should('have.text', 'Ese día ya está anotado.')
    cy.get('.attendance-days li').should('have.length', 2)
  })

  it('abre el tablero si el servidor anterior solo confirma el alta', () => {
    cy.intercept('POST', '/api/members', {
      statusCode: 201,
      body: { message: 'Socio registrado correctamente.' }
    })
    register('Luisa Rojas', 'LUISA@example.com')
    cy.get('h1').should('have.text', 'Tablero de asistencia.')
    cy.contains('strong', 'Luisa Rojas')
    cy.contains('luisa@example.com')
    cy.get('.attendance-days li').should('have.length', 1)
  })

  it('muestra el error de correo duplicado', () => {
    register('Beto Rojas', 'beto@example.com')
    cy.get('[role="status"]').should('be.visible')
    cy.contains('button', 'Registrar otro socio').click()
    cy.get('#name').should('have.value', '')
    cy.get('#email').should('have.value', '')
    register('Otra persona', 'BETO@example.com')
    cy.get('[role="alert"]').should('have.text', 'Este correo ya está registrado.')
  })

  it('muestra los socios que se han guardado, del más reciente al más antiguo', () => {
    cy.contains('button', 'Ver socios registrados').click()
    cy.contains('Todavía no hay socios registrados.').should('be.visible')
    cy.contains('button', 'Volver al registro').click()

    register('Ana Rojas', 'ana@example.com')
    cy.contains('button', 'Registrar otro socio').click()
    register('Beto Rojas', 'beto@example.com')
    cy.contains('button', 'Ver socios registrados').click()

    cy.get('.members-board [role="status"]').should('have.text', 'Total de socios: 2')
    cy.get('tbody tr').should('have.length', 2)
    cy.get('tbody tr').first().should('contain.text', 'Beto Rojas').and('contain.text', 'beto@example.com')
    cy.get('tbody tr').last().should('contain.text', 'Ana Rojas').and('contain.text', 'ana@example.com')
    cy.get('tbody time').should('have.length', 2)
  })

  it('muestra el mensaje de validación de nombre', () => {
    register(' a ', 'carla@example.com')
    cy.get('[role="alert"]').should('have.text', 'Escribe un nombre de entre 2 y 100 caracteres.')
  })

  it('permite reintentar la lista cuando falla la primera solicitud', () => {
    cy.intercept({ method: 'GET', url: '/api/members', times: 1 }, { statusCode: 503 })
    cy.contains('button', 'Ver socios registrados').click()
    cy.get('[role="alert"]').should('have.text', 'No se pudo cargar la lista de socios.')

    cy.contains('button', 'Reintentar').click()
    cy.contains('Todavía no hay socios registrados.').should('be.visible')
    cy.get('[role="alert"]').should('not.exist')
  })

  it('conserva las fechas de prueba al volver desde la lista general', () => {
    register('Ana Rojas', 'ana@example.com')
    cy.get('#attendance-day').clear().type('2020-01-15')
    cy.contains('button', 'Agregar día').click()

    cy.contains('button', 'Ver socios registrados').click()
    cy.contains('button', 'Volver a mi asistencia').click()
    cy.get('time[datetime="2020-01-15"]').should('be.visible')
    cy.get('.attendance-days li').should('have.length', 2)
  })

  it('filtra el tablero por nombre y regresa a los 20 socios al limpiar', () => {
    seedMembers()
    cy.contains('button', 'Ver socios registrados').click()
    cy.get('#member-search').type('PEREZ')
    cy.contains('button', /^Buscar$/).click()
    cy.get('.members-board [role="status"]').should('have.text', 'Resultados: 1')
    cy.get('tbody tr').should('have.length', 1).and('contain.text', 'maria.perez@example.com')

    cy.get('#member-search').clear().type('sin coincidencias')
    cy.contains('button', /^Buscar$/).click()
    cy.contains('No hay socios que coincidan con la búsqueda.').should('be.visible')

    cy.contains('button', 'Limpiar').click()
    cy.get('#member-search').should('have.value', '')
    cy.get('.members-board [role="status"]').should('have.text', 'Total de socios: 20')
    cy.get('tbody tr').should('have.length', 20)
  })
})
