import React, { useEffect, useRef, useState } from 'react'

const dateLabel = new Intl.DateTimeFormat('es-BO', { dateStyle: 'full', timeZone: 'UTC' })

function localDay(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

export function AttendanceBoard({ member, message, onBack }) {
  const heading = useRef(null)
  const today = localDay(new Date())
  const [days, setDays] = useState(() => [localDay(new Date(member.registeredAt))])
  const [date, setDate] = useState(today)
  const [feedback, setFeedback] = useState({ message, error: false })

  useEffect(() => {
    heading.current.focus()
  }, [])

  function addDay(event) {
    event.preventDefault()
    if (days.includes(date)) {
      setFeedback({ message: 'Ese día ya está anotado.', error: true })
      return
    }
    setDays(current => [...current, date].sort().reverse())
    setFeedback({ message: 'Día agregado al tablero.', error: false })
  }

  return (
    <section className="project" aria-labelledby="board-title">
      <div className="description">
        <p className="eyebrow">Asistencia de prueba</p>
        <h1 id="board-title" ref={heading} tabIndex={-1}>Tablero de asistencia<span>.</span></h1>
        <p><strong>{member.name}</strong><br />{member.email}</p>
        <button type="button" className="back-button" onClick={onBack}>Registrar otro socio</button>
      </div>

      <div className="attendance-panel">
        <h2>Días ingresados ({days.length})</h2>
        <form className="attendance-form" onSubmit={addDay}>
          <label htmlFor="attendance-day">Fecha de asistencia</label>
          <input id="attendance-day" type="date" value={date} max={today}
            onChange={event => setDate(event.target.value)} required />
          <button type="submit">Agregar día</button>
        </form>
        <p className={feedback.error ? 'error' : 'success'} role={feedback.error ? 'alert' : 'status'}>
          {feedback.message}
        </p>
        <ul className="attendance-days">
          {days.map(day => (
            <li key={day}>
              <time dateTime={day}>{dateLabel.format(new Date(day))}</time>
            </li>
          ))}
        </ul>
        <p className="muted">Las asistencias de prueba duran hasta que cierres el tablero o recargues la página.</p>
      </div>
    </section>
  )
}
