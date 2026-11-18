import { test, expect } from '@playwright/test'

async function register(page, name, email) {
  await page.getByLabel('Nombre completo').fill(name)
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByRole('button', { name: 'Registrar socio' }).click()
}

test('el portafolio lleva al proyecto y permite registrar un socio', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Abdiel.*Pérez Cossío/s)
  await page.getByRole('link', { name: 'Probar el proyecto' }).click()
  await expect(page).toHaveURL(/#proyecto$/)
  await register(page, 'Ana Rojas', 'ana@example.com')
  await expect(page.getByRole('status')).toHaveText('Socio registrado correctamente.')
  await expect(page.getByLabel('Nombre completo')).toHaveValue('')
})

test('el registro muestra el error al repetir un correo', async ({ page }) => {
  await page.goto('/')
  await register(page, 'Beto Rojas', 'beto@example.com')
  await expect(page.getByRole('status')).toBeVisible()
  await register(page, 'Otra persona', 'BETO@example.com')
  await expect(page.getByRole('alert')).toHaveText('Este correo ya está registrado.')
})

test('el formulario informa un nombre inválido rechazado por el servidor', async ({ page }) => {
  await page.goto('/')
  await register(page, ' a ', 'carla@example.com')
  await expect(page.getByRole('alert')).toHaveText('Escribe un nombre de entre 2 y 100 caracteres.')
})
