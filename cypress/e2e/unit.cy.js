import { validateMember } from '../../server/domain/member.js'

describe('Validación de socios', () => {
  it('normaliza el nombre y el correo', () => {
    expect(validateMember({ name: '  Ada   Pérez ', email: ' ADA@EXAMPLE.COM ' }))
      .to.deep.equal({ name: 'Ada Pérez', email: 'ada@example.com' })
  })

  it('rechaza nombres vacíos, cortos y demasiado largos', () => {
    for (const name of ['', ' A ', 'a'.repeat(101), null]) {
      expect(validateMember({ name, email: 'ada@example.com' }).error).to.match(/nombre/)
    }
  })

  it('rechaza correos inválidos', () => {
    for (const email of ['ada', 'ada@example', 'ada @example.com', null]) {
      expect(validateMember({ name: 'Ada', email }).error).to.match(/correo/)
    }
  })
})
