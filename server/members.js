export function validateMember(input) {
  const name = typeof input?.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : ''
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : ''

  if (name.length < 2 || name.length > 100) {
    return { error: 'Escribe un nombre de entre 2 y 100 caracteres.' }
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Escribe un correo electrónico válido.' }
  }
  return { name, email }
}
