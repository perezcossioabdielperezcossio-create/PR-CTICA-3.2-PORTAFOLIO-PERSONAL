import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const host = process.argv.includes('--local') ? '127.0.0.1' : '0.0.0.0'
const { app, close } = createApp({
  database: process.env.DB_PATH ?? 'data/gym.sqlite',
  assets: fileURLToPath(new URL('../dist/', import.meta.url))
})
const server = app.listen(port, host, error => {
  if (error) {
    close()
    console.error(error.code === 'EADDRINUSE' ? `El puerto ${port} ya está ocupado.` : error.message)
    process.exitCode = 1
    return
  }
  console.log(`Aplicación disponible en http://localhost:${port}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => close()))
}
