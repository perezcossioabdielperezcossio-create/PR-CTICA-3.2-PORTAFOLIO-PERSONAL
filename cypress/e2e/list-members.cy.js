import { createListMembers } from '../../server/application/list-members.js'

describe('Búsqueda de socios', () => {
  const members = [
    { name: 'María Pérez', email: 'maria@example.com' },
    { name: 'Ana Rojas', email: 'ana@example.net' }
  ]
  const list = createListMembers({ list: () => members })

  it('devuelve el listado completo si el filtro está vacío', () => {
    expect(list('  ')).to.deep.equal(members)
  })

  it('busca nombres sin distinguir mayúsculas ni tildes', () => {
    expect(list(' PEREZ ')).to.deep.equal([members[0]])
  })

  it('compara el correo y trata el símbolo de porcentaje como texto', () => {
    expect(list('EXAMPLE.NET')).to.deep.equal([members[1]])
    expect(list('%')).to.deep.equal([])
  })
})
