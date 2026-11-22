import React, { useEffect, useRef, useState } from 'react'
import { listMembers } from './members-api.js'

const dateLabel = new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' })

export function MembersBoard() {
  const heading = useRef(null)
  const [search, setSearch] = useState({ query: '' })
  const [draft, setDraft] = useState('')
  const [members, setMembers] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    heading.current.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    listMembers(search.query, controller.signal).then(
      result => { if (!controller.signal.aborted) setMembers(result) },
      failure => { if (!controller.signal.aborted) setError(failure.message) }
    )
    return () => controller.abort()
  }, [search])

  function load(query) {
    setError(null)
    setMembers(null)
    setSearch({ query })
  }

  function submitSearch(event) {
    event.preventDefault()
    load(draft.trim())
  }

  function clearSearch() {
    setDraft('')
    load('')
  }

  return (
    <section className="members-board" aria-labelledby="members-title">
      <div className="members-heading">
        <h1 id="members-title" ref={heading} tabIndex={-1}>Socios registrados<span>.</span></h1>
        {members && <p role="status">{search.query ? 'Resultados' : 'Total de socios'}: <strong>{members.length}</strong></p>}
      </div>
      <div className="members-content">
        <form className="members-search" onSubmit={submitSearch} role="search" aria-label="Buscar socios">
          <label htmlFor="member-search">Nombre o correo</label>
          <div className="members-search-fields">
            <input id="member-search" type="search" value={draft} maxLength={254}
              onChange={event => setDraft(event.target.value)} />
            <button type="submit">Buscar</button>
            {(draft || search.query) && <button type="button" onClick={clearSearch}>Limpiar</button>}
          </div>
        </form>
        {error ? (
          <>
            <p className="error" role="alert">{error}</p>
            <button type="button" onClick={() => load(search.query)}>Reintentar</button>
          </>
        ) : members === null ? (
          <p role="status">Cargando socios…</p>
        ) : members.length === 0 ? (
          <p>{search.query ? 'No hay socios que coincidan con la búsqueda.' : 'Todavía no hay socios registrados.'}</p>
        ) : (
          <div className="members-table">
            <table aria-labelledby="members-title">
              <thead>
                <tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Fecha de alta</th></tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.email}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td><time dateTime={member.registeredAt}>{dateLabel.format(new Date(member.registeredAt))}</time></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
