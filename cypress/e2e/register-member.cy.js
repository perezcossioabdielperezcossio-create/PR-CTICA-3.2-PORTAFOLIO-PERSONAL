import { createRegisterMember } from '../../server/application/register-member.js'

describe('Caso de uso de registro', () => {
  const registeredAt = '2026-01-15T12:00:00.000Z'

  it('envía los datos normalizados al repositorio y devuelve la fecha guardada', () => {
    const add = cy.stub().returns(registeredAt)
    const register = createRegisterMember({ add })
    const member = { name: 'Ana Rojas', email: 'ana@example.com' }

    expect(register({ name: ' Ana  Rojas ', email: 'ANA@example.com' }))
      .to.deep.equal({ status: 'registered', member: { ...member, registeredAt } })
    expect(add).to.have.been.calledOnceWithExactly(member)
  })

  it('rechaza los datos inválidos sin llamar al repositorio', () => {
    const add = cy.stub()
    const register = createRegisterMember({ add })

    expect(register({ name: 'Ana Rojas', email: 'inválido' }).status).to.equal('invalid')
    expect(add).not.to.have.been.called
  })

  it('devuelve el estado duplicado cuando el repositorio no acepta el alta', () => {
    const add = cy.stub().returns(null)
    const register = createRegisterMember({ add })

    expect(register({ name: 'Ana Rojas', email: 'ana@example.com' }))
      .to.deep.equal({ status: 'duplicate' })
    expect(add).to.have.been.calledOnce
  })
})
