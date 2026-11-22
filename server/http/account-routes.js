import { Router } from 'express'
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { validateMember } from '../domain/member.js'

const deriveKey = promisify(scrypt)
const cookie = 'gym_session'
const sessionDuration = 8 * 60 * 60 * 1000
const attendanceDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/La_Paz' })

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await deriveKey(password, salt, 64)
  return `${salt}:${key.toString('hex')}`
}

async function verifyPassword(password, hash) {
  const [salt, expected] = (hash ?? 'dummy:' + '0'.repeat(128)).split(':')
  const actual = await deriveKey(password, salt, 64)
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && Boolean(hash)
}

function tokenFrom(req) {
  return req.headers.cookie?.match(/(?:^|;\s*)gym_session=([a-f0-9]{64})(?:;|$)/)?.[1]
}

function cookieOptions(req) {
  return { httpOnly: true, sameSite: 'strict', secure: req.secure }
}

export function createAccountRoutes(accounts, adminKey) {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  router.post('/activate', async (req, res) => {
    const { email, code, password } = req.body ?? {}
    if (typeof email !== 'string' || typeof code !== 'string' || !/^[a-f0-9]{48}$/.test(code)
      || typeof password !== 'string' || password.length < 10 || password.length > 128) {
      return res.status(400).json({ error: 'Ingresa correo, código y una contraseña de 10 a 128 caracteres.' })
    }
    const member = accounts.find(email.trim().toLowerCase())
    if (!member || member.password || !accounts.activate(member.id, digest(code), await hashPassword(password))) {
      return res.status(400).json({ error: 'Código inválido, vencido o ya utilizado.' })
    }
    res.sendStatus(204)
  })

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ error: 'Ingresa correo y contraseña.' })
    }
    const member = accounts.find(email.trim().toLowerCase())
    if (!await verifyPassword(password, member?.password)) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' })
    }
    const oldToken = tokenFrom(req)
    if (oldToken) accounts.revokeSession(digest(oldToken))
    const token = randomBytes(32).toString('hex')
    accounts.startSession(member.id, digest(token), Date.now() + sessionDuration)
    res.cookie(cookie, token, { ...cookieOptions(req), maxAge: sessionDuration }).sendStatus(204)
  })

  router.post('/logout', (req, res) => {
    const token = tokenFrom(req)
    if (token) accounts.revokeSession(digest(token))
    res.clearCookie(cookie, cookieOptions(req)).sendStatus(204)
  })

  router.use('/admin', (req, res, next) => {
    const authorization = req.get('Authorization') ?? ''
    if (!adminKey) {
      return res.status(503).json({ error: 'Configura GYM_ADMIN_KEY en la terminal y reinicia el servidor.' })
    }
    if (!timingSafeEqual(Buffer.from(digest(authorization)), Buffer.from(digest('Bearer ' + adminKey)))) {
      return res.status(401).json({ error: 'Clave de administración incorrecta.' })
    }
    next()
  })

  router.get('/admin/messages', (_req, res) => res.json({ messages: accounts.inbox() }))
  router.post('/admin/activation', (req, res) => {
    const { email } = req.body ?? {}
    const member = typeof email === 'string' && accounts.find(email.trim().toLowerCase())
    if (!member) return res.status(404).json({ error: 'No existe un socio con ese correo.' })
    if (member.password) return res.status(409).json({ error: 'El socio ya activó su cuenta.' })
    const code = randomBytes(24).toString('hex')
    accounts.issueCode(member.id, digest(code), Date.now() + 24 * 60 * 60 * 1000)
    res.status(201).json({ code })
  })

  router.use('/me', (req, res, next) => {
    const token = tokenFrom(req)
    const session = token && accounts.session(digest(token))
    if (!session) return res.status(401).json({ error: 'Inicia sesión para continuar.' })
    req.memberId = session.id
    next()
  })

  router.get('/me', (req, res) => {
    res.json({ profile: accounts.profile(req.memberId), days: accounts.days(req.memberId) })
  })

  router.put('/me', (req, res) => {
    const member = validateMember(req.body)
    if (member.error) return res.status(400).json({ error: member.error })
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
    const digitCount = phone.replace(/\D/g, '').length
    if (phone && (!/^\+?[\d ()-]{7,24}$/.test(phone) || digitCount < 7 || digitCount > 15)) {
      return res.status(400).json({ error: 'Ingresa un teléfono válido.' })
    }
    if (!accounts.updateProfile(req.memberId, { ...member, phone })) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' })
    }
    res.json({ profile: accounts.profile(req.memberId) })
  })

  router.post('/me/attendance', (req, res) => {
    if (!accounts.markDay(req.memberId, attendanceDate.format(new Date()))) {
      return res.status(409).json({ error: 'Ya registraste tu asistencia de hoy.' })
    }
    res.status(201).json({ days: accounts.days(req.memberId) })
  })

  router.post('/me/messages', (req, res) => {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message || message.length > 1000) {
      return res.status(400).json({ error: 'El mensaje debe tener entre 1 y 1000 caracteres.' })
    }
    accounts.send(req.memberId, message)
    res.sendStatus(201)
  })

  router.delete('/me', async (req, res) => {
    const { password } = req.body ?? {}
    const member = accounts.find(accounts.profile(req.memberId).email)
    if (typeof password !== 'string' || password.length > 128 || !await verifyPassword(password, member.password)) {
      return res.status(403).json({ error: 'Confirma tu contraseña para cancelar la membresía.' })
    }
    accounts.remove(req.memberId)
    res.clearCookie(cookie, cookieOptions(req)).sendStatus(204)
  })

  return router
}
