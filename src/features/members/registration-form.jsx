import React, { useState } from 'react'
import { registerMember } from './members-api.js'

export function RegistrationForm({ onRegistered }) {
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setErrorMessage(null)
    try {
      const result = await registerMember(Object.fromEntries(new FormData(form)))
      onRegistered(result)
    } catch (error) {
      setErrorMessage(error instanceof TypeError ? 'No pudimos conectar. Inténtalo de nuevo.' : error.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="form-title">
      <h2 id="form-title">Nuevo socio</h2>
      <p className="muted">Usa datos ficticios para probar la demo.</p>
      <fieldset disabled={pending}>
        <label htmlFor="name">Nombre completo</label>
        <input id="name" name="name" autoComplete="name" placeholder="Ej. Alex Rojas" required minLength={2} maxLength={100} />
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="alex@example.com" required maxLength={254} />
        <button>{pending ? 'Registrando…' : 'Registrar socio'}</button>
      </fieldset>
      {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
    </form>
  )
}
