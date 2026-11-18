import express from 'express'

export function createHttpApp({ registerMember, checkHealth, assets }) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '8kb' }))

  app.get('/api/health', (_req, res) => {
    checkHealth()
    res.json({ status: 'ok' })
  })

  app.post('/api/members', (req, res) => {
    const result = registerMember(req.body)
    if (result.status === 'invalid') return res.status(400).json({ error: result.error })
    if (result.status === 'duplicate') return res.status(409).json({ error: 'Este correo ya está registrado.' })
    res.status(201).json({ message: 'Socio registrado correctamente.' })
  })

  if (assets) app.use(express.static(assets))

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' })
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' })
    console.error(error)
    res.status(500).json({ error: 'Ocurrió un error interno.' })
  })

  return app
}
