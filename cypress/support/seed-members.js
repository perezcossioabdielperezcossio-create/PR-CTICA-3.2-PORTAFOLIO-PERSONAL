export function seedMembers() {
  return cy.fixture('members.json').then(members =>
    cy.wrap(members).each(member => {
      cy.request('POST', '/api/members', member).its('status').should('equal', 201)
    })
  )
}
