export async function registerMember(member) {
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error)
  if (result.member) return result

  // Older servers confirm the registration without returning the member.
  return {
    ...result,
    member: {
      name: member.name.trim().replace(/\s+/g, ' '),
      email: member.email.trim().toLowerCase(),
      registeredAt: new Date().toISOString()
    }
  }
}

export async function listMembers(query, signal) {
  const url = query ? '/api/members?' + new URLSearchParams({ q: query }) : '/api/members'
  const response = await fetch(url, { signal })
  if (response.status === 404) throw new Error('Reinicia el servidor con npm start para habilitar el tablero.')
  if (!response.ok) throw new Error('No se pudo cargar la lista de socios.')
  return (await response.json()).members
}
