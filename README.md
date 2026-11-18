# Registro de socios de gimnasio

Aplicación de inscripción de socios por nombre y correo. La interfaz usa React y Vite, Express valida las solicitudes y SQLite guarda los registros. Cada correo se puede registrar una sola vez.

## Ejecutar en local

Con Node.js 24 o superior instalado:

```sh
npm ci
npm run build
npm start
```

Abre [localhost:3000](http://localhost:3000). La aplicación guarda los registros en `data/gym.sqlite`. Usa datos ficticios para probarla.

## Estructura del proyecto

- `src/features/members/` contiene el formulario React y el cliente de la API.
- `server/domain/` contiene las reglas de validación del socio.
- `server/application/` contiene el caso de uso que coordina el alta mediante un repositorio recibido como dependencia.
- `server/http/` adapta las solicitudes y resultados a HTTP. `server/infrastructure/` implementa el repositorio en SQLite.
- `server/app.js` conecta estas piezas. `cypress/e2e/` contiene las tres suites automatizadas.

Puedes levantar la aplicación con `docker compose up --build` y abrir [localhost](http://localhost).

## Ejecutar las pruebas con Python

Con Python 3 y las dependencias de npm instaladas:

```sh
python scripts/run_tests.py
```

El script ejecuta 3 pruebas unitarias, 3 de integración y 3 E2E. Las tres suites usan Cypress y una base de pruebas aislada. Para ejecutar una sola suite, agrega `unit`, `integration` o `e2e` al comando. En GitHub Actions, los pushes a `dev` usan el mismo script.

El despliegue automático está en pausa. La carpeta `infra/` contiene la configuración anterior de AWS y está fuera del flujo de pruebas. La VM de Oracle Cloud se trabajará en una etapa posterior.
