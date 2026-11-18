import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const { app, close } = createApp({
  database: process.env.DB_PATH ?? 'data/gym.sqlite',
  assets: fileURLToPath(new URL('../dist/', import.meta.url))
})
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Aplicación disponible en http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => close()))
}
