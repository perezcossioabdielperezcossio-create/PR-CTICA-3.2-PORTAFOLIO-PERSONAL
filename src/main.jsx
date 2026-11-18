import React from 'react'
import { createRoot } from 'react-dom/client'
import { RegistrationForm } from './features/members/registration-form.jsx'
import './styles.css'

function App() {
  return (
    <>
      <header className="shell">
        <a className="brand" href="#inicio" aria-label="Inicio del registro">GYM<span>.</span></a>
      </header>
      <main className="shell" id="inicio">
        <section className="project" aria-labelledby="project-title">
          <div className="description">
            <p className="eyebrow">Inscripción de socios</p>
            <h1 id="project-title">Registro de gimnasio<span>.</span></h1>
            <p>Completa el formulario para dar de alta a un nuevo socio. Cada correo se puede registrar una vez.</p>
          </div>
          <RegistrationForm />
        </section>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
