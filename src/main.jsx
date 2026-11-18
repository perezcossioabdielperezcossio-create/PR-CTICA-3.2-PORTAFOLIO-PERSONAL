import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function Registration() {
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      form.reset()
      setFeedback({ type: 'success', message: result.message })
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof TypeError ? 'No pudimos conectar. Inténtalo de nuevo.' : error.message
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-labelledby="form-title">
      <h3 id="form-title">Nuevo socio</h3>
      <p className="muted">Usa datos ficticios para probar la demo.</p>
      <fieldset disabled={pending}>
        <label htmlFor="name">Nombre completo</label>
        <input id="name" name="name" autoComplete="name" placeholder="Ej. Alex Rojas" required minLength={2} maxLength={100} />
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="alex@example.com" required maxLength={254} />
        <button>{pending ? 'Registrando…' : 'Registrar socio'}</button>
      </fieldset>
      {feedback && <p className={feedback.type} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
    </form>
  )
}

function App() {
  return (
    <>
      <header className="shell">
        <a className="brand" href="#inicio" aria-label="Inicio">AP<span>.</span></a>
        <nav aria-label="Principal">
          <a href="#proyecto">Proyecto</a>
          <a href="#tecnologias">Tecnologías</a>
        </nav>
      </header>
      <main className="shell" id="inicio">
        <section className="hero" aria-labelledby="profile-title">
          <p className="eyebrow">Portafolio personal</p>
          <h1 id="profile-title">Abdiel<br />Pérez Cossío<span>.</span></h1>
          <p className="intro">Desarrollo web y automatización de despliegues. Mi proyecto académico integra un registro de gimnasio con un flujo de pruebas y entrega continua.</p>
          <a className="jump" href="#proyecto">Probar el proyecto <span aria-hidden="true">↓</span></a>
        </section>
        <section className="project" id="proyecto" aria-labelledby="project-title">
          <div className="description">
            <p className="eyebrow">Proyecto académico</p>
            <h2 id="project-title">Registro de<br />gimnasio</h2>
            <p>Registra a un socio por nombre y correo. La aplicación valida los datos y guarda la inscripción en SQLite.</p>
          </div>
          <Registration />
        </section>
        <section className="tech" id="tecnologias">
          <h2>Tecnologías</h2>
          <dl>
            <div><dt>Interfaz</dt><dd>React · Vite</dd></div>
            <div><dt>Servidor y datos</dt><dd>Express · SQLite</dd></div>
            <div><dt>Pruebas</dt><dd>Node.js · Playwright</dd></div>
            <div><dt>Entrega</dt><dd>GitHub Actions · Docker · Terraform · Ansible</dd></div>
          </dl>
        </section>
      </main>
      <footer className="shell">Abdiel Pérez Cossío <span>·</span> Portafolio académico</footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
