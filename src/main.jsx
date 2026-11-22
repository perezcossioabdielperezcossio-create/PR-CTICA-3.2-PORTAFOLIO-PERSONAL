import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RegistrationForm } from './features/members/registration-form.jsx'
import { AttendanceBoard } from './features/members/attendance-board.jsx'
import { MembersBoard } from './features/members/members-board.jsx'
import { AdminArea, MemberArea } from './features/members/account-area.jsx'
import './styles.css'

function App() {
  const [accountArea, setAccountArea] = useState(null)
  const [showMembers, setShowMembers] = useState(false)
  const [registration, setRegistration] = useState(null)

  function goToRegistration() {
    setAccountArea(null)
    setShowMembers(false)
    setRegistration(null)
  }

  const backLabel = registration ? 'Volver a mi asistencia' : 'Volver al registro'

  return (
    <>
      <header className="shell">
        <a className="brand" href="#inicio" onClick={goToRegistration} aria-label="Inicio del registro">GYM<span>.</span></a>
        <nav className="account-nav" aria-label="Opciones del gimnasio">
          <button className="nav-button" type="button" onClick={() => setAccountArea('member')}>Mi cuenta</button>
          <button className="nav-button" type="button" onClick={() => setAccountArea('admin')}>Administración</button>
          <button className="nav-button" type="button" onClick={() => {
            setAccountArea(null)
            setShowMembers(accountArea ? true : !showMembers)
          }}>
            {showMembers && !accountArea ? backLabel : 'Ver socios registrados'}
          </button>
        </nav>
      </header>
      <main className="shell" id="inicio">
        {accountArea === 'member' && <MemberArea />}
        {accountArea === 'admin' && <AdminArea />}
        {!accountArea && showMembers && <MembersBoard />}
        {registration && (
          <div hidden={showMembers || Boolean(accountArea)}>
            <AttendanceBoard
              member={registration.member}
              message={registration.message}
              onBack={goToRegistration}
            />
          </div>
        )}
        {!accountArea && !showMembers && !registration && (
          <section className="project" aria-labelledby="project-title">
            <div className="description">
              <p className="eyebrow">Inscripción de socios</p>
              <h1 id="project-title">Registro de gimnasio<span>.</span></h1>
              <p>Completa el formulario para dar de alta a un nuevo socio. Cada correo se puede registrar una vez.</p>
            </div>
            <RegistrationForm onRegistered={setRegistration} />
          </section>
        )}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
