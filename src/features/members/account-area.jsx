import React, { useEffect, useState } from 'react'

async function call(path, { method = 'GET', body, key } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (key) headers.Authorization = 'Bearer ' + key
  const response = await fetch('/api/account' + path, {
    method, headers, body: body && JSON.stringify(body)
  })
  const result = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() : null
  if (!response.ok) {
    const message = response.status === 404 && !result
      ? 'El servidor anterior sigue activo. Reinicia el gimnasio para habilitar las cuentas.'
      : result?.error ?? 'No se pudo completar la solicitud.'
    throw Object.assign(new Error(message), { status: response.status })
  }
  return result
}

function Form({ title, button, onSubmit, children }) {
  const [feedback, setFeedback] = useState(null)
  const [pending, setPending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setFeedback(null)
    try {
      const message = await onSubmit(Object.fromEntries(new FormData(form)), form)
      if (message) setFeedback({ message, error: false })
    } catch (error) {
      setFeedback({ message: error.message, error: true })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="account-form">
      <h2>{title}</h2>
      <fieldset disabled={pending}>
        {children}
        <button>{pending ? 'Procesando…' : button}</button>
      </fieldset>
      {feedback && <p className={feedback.error ? 'error' : 'success'} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    </form>
  )
}

export function MemberArea() {
  const [view, setView] = useState('loading')
  const [account, setAccount] = useState(null)
  const [message, setMessage] = useState('')

  async function load() {
    try {
      setAccount(await call('/me'))
      setView('profile')
    } catch (error) {
      setMessage(error.status === 401 ? '' : error.message)
      setView('login')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <section className="members-board">
      <div className="members-heading"><h1>Área de socios<span>.</span></h1></div>
      <div className="members-content">
        {message && <p role="status">{message}</p>}
        {view === 'loading' && <p role="status">Cargando…</p>}
        {view === 'login' && (
          <>
            <Form title="Iniciar sesión" button="Entrar" onSubmit={async body => {
              await call('/login', { method: 'POST', body })
              setMessage('')
              await load()
            }}>
              <label>Correo electrónico<input name="email" type="email" autoComplete="username" required /></label>
              <label>Contraseña<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
            </Form>
            <button type="button" onClick={() => { setMessage(''); setView('activate') }}>Activar mi cuenta</button>
          </>
        )}
        {view === 'activate' && (
          <>
            <Form title="Activar cuenta de socio" button="Activar cuenta" onSubmit={async body => {
              await call('/activate', { method: 'POST', body })
              setView('login')
              setMessage('Cuenta activada. Ya puedes iniciar sesión.')
            }}>
              <p>Solicita al administrador tu código de activación.</p>
              <label>Correo electrónico<input name="email" type="email" required /></label>
              <label>Código de activación<input name="code" autoComplete="one-time-code" minLength={48} maxLength={48} required /></label>
              <label>Nueva contraseña<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></label>
            </Form>
            <button type="button" onClick={() => setView('login')}>Volver al inicio de sesión</button>
          </>
        )}
        {view === 'profile' && (
          <div className="account-grid">
            <Form title="Mis datos" button="Guardar datos" onSubmit={async (body, form) => {
              const { profile } = await call('/me', { method: 'PUT', body })
              setAccount(current => ({ ...current, profile }))
              for (const field of ['name', 'email', 'phone']) form.elements.namedItem(field).value = profile[field]
              return 'Datos actualizados.'
            }}>
              <label>Nombre<input name="name" defaultValue={account.profile.name} minLength={2} maxLength={100} required /></label>
              <label>Correo<input name="email" type="email" defaultValue={account.profile.email} required /></label>
              <label>Teléfono<input name="phone" type="tel" defaultValue={account.profile.phone} maxLength={24} /></label>
            </Form>
            <Form title="Mis asistencias" button="Registrar asistencia de hoy" onSubmit={async () => {
              const { days } = await call('/me/attendance', { method: 'POST' })
              setAccount(current => ({ ...current, days }))
              return 'Asistencia guardada.'
            }}>
              {account.days.length ? <ul>{account.days.map(day => <li key={day}><time dateTime={day}>{day}</time></li>)}</ul>
                : <p>Aún no tienes asistencias registradas.</p>}
            </Form>
            <Form title="Mensaje al administrador" button="Enviar mensaje" onSubmit={async (body, form) => {
              await call('/me/messages', { method: 'POST', body })
              form.reset()
              return 'Mensaje enviado.'
            }}>
              <label>Mensaje<textarea name="message" maxLength={1000} rows={4} required /></label>
            </Form>
            <Form title="Cancelar membresía" button="Eliminar mi membresía" onSubmit={async body => {
              if (!window.confirm('¿Eliminar tu membresía de forma permanente?')) return
              await call('/me', { method: 'DELETE', body })
              setAccount(null)
              setView('login')
              setMessage('Membresía eliminada.')
            }}>
              <p>Se eliminarán tu cuenta, tus asistencias y tus mensajes.</p>
              <label>Confirma tu contraseña<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
            </Form>
            <Form title="Sesión" button="Cerrar sesión" onSubmit={async () => {
              await call('/logout', { method: 'POST' })
              setAccount(null)
              setView('login')
            }} />
          </div>
        )}
      </div>
    </section>
  )
}

export function AdminArea() {
  const [key, setKey] = useState('')
  const [messages, setMessages] = useState([])

  return (
    <section className="members-board">
      <div className="members-heading"><h1>Administración<span>.</span></h1></div>
      <div className="members-content account-grid">
        {!key ? <Form key="admin-login" title="Acceso de administrador" button="Abrir administración" onSubmit={async body => {
          const result = await call('/admin/messages', { key: body.key })
          setMessages(result.messages)
          setKey(body.key)
        }}>
          <label>Clave de administración<input name="key" type="password" required /></label>
        </Form> : (
          <>
            <Form key="admin-activation" title="Activar un socio" button="Generar código" onSubmit={async body => {
              const { code } = await call('/admin/activation', { method: 'POST', body, key })
              return 'Código de un solo uso (24 horas): ' + code
            }}>
              <label>Correo del socio<input name="email" type="email" required /></label>
            </Form>
            <Form title="Bandeja de mensajes" button="Actualizar bandeja" onSubmit={async () => {
              const result = await call('/admin/messages', { key })
              setMessages(result.messages)
            }}>
              {messages.length ? <ul>{messages.map(item => (
                <li key={item.id}><strong>{item.name}</strong> ({item.email})<p>{item.text}</p></li>
              ))}</ul> : <p>Sin mensajes.</p>}
            </Form>
            <button type="button" onClick={() => { setKey(''); setMessages([]) }}>Salir de administración</button>
          </>
        )}
      </div>
    </section>
  )
}
