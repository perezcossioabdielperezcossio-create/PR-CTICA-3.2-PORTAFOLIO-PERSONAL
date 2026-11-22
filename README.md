# Registro de socios de gimnasio

Aplicación de inscripción de socios por nombre y correo. La interfaz usa React y Vite, Express valida las solicitudes y SQLite guarda los registros. Cada correo se puede registrar una sola vez. El alta abre un tablero con los datos del socio y su primer día de asistencia. Los días adicionales se mantienen en el tablero durante la prueba. El botón **Ver socios registrados** abre la lista general de altas guardadas en SQLite, con búsqueda por nombre o correo. Esta lista es parte de la demo y está disponible sin inicio de sesión.

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

El script ejecuta 9 pruebas unitarias, 16 de integración y 10 E2E. Cypress ejecuta las tres suites automáticamente en su navegador Electron en modo headless. Las pruebas de integración y E2E usan un servidor y una base SQLite temporales. Para ejecutar una sola suite, agrega `unit`, `integration` o `e2e` al comando. En GitHub Actions, los pushes a `dev` usan el mismo script.

El despliegue automático está en pausa. La carpeta `infra/` contiene la configuración anterior de AWS y está fuera del flujo de pruebas. La VM de Oracle Cloud se trabajará en una etapa posterior.


Los [escenarios de prueba](cypress/e2e/features/) describen cada caso en español con el formato **Dado / Cuando / Entonces**. Cada archivo `.feature` corresponde a un archivo `.cy.js`. Cypress ejecuta los archivos `.cy.js`.

### Ver las pruebas en la interfaz de Cypress

En PowerShell, ejecuta `npm.cmd run build` y luego `npx.cmd cypress open`. Selecciona **E2E Testing**, un navegador y `registration.cy.js` para ver el formulario y el tablero. En `integration.cy.js` el panel del navegador queda en blanco porque las pruebas llaman directamente a la API.

`cypress/fixtures/members.json` contiene 20 socios ficticios. Las pruebas seleccionadas los registran por la API en la base SQLite temporal de Cypress.


### Cuentas de socios y administrador

Para usar la clave de demostración guardada en `.env.local`, inicia la variante que solo escucha en este equipo:

```powershell
npm.cmd start:local
```

En otros entornos, `npm start` usa la clave de administración configurada en `GYM_ADMIN_KEY`. En **Administración**, indica el correo de un socio registrado y genera un código de un solo uso que vence en 24 horas. Entrégaselo al socio por un canal privado. El socio lo usa en **Mi cuenta → Activar mi cuenta** para definir su contraseña. La bandeja de Administración muestra los mensajes recibidos.

El área privada guarda perfil, asistencia diaria y mensajes en SQLite. La asistencia de prueba anterior era temporal. Para cancelar su membresía, el socio confirma su contraseña y la eliminación de sus datos.


### Infraestructura de Oracle Cloud

El módulo de Terraform en [infra/oci](infra/oci/) prepara una VM Ubuntu 24.04 con IPv4 pública. Si dejas `subnet_ocid` sin definir, crea una VCN, una subred pública con salida a Internet y una privada sin salida directa. Si ya tienes una subred pública, puedes reutilizarla. En ese caso, debe contar con una ruta a Internet y conviene revisar sus reglas existentes porque se suman a las del grupo de seguridad de la VM.

Puedes revisar el módulo sin credenciales:

```powershell
terraform -chdir=infra/oci init -backend=false
terraform -chdir=infra/oci validate
```

Para la siguiente etapa, copia `infra/oci/terraform.tfvars.example` a `infra/oci/terraform.tfvars` y completa los valores de tu cuenta, la región, el compartimento, el dominio de disponibilidad y la imagen Ubuntu 24.04 compatible con la forma elegida. Indica también la ruta local de la clave privada de firma de OCI, su huella, la ruta de la clave pública SSH y tu IPv4 administrativa con máscara `/32`. Conserva la clave privada fuera del repositorio. `terraform.tfvars` y los archivos de estado están excluidos de Git.

En la red nueva, el grupo de seguridad autoriza HTTP y HTTPS. El acceso SSH se restringe a la dirección administrativa. La IP pública se asigna al crear la VM y puede cambiar si esta se reemplaza. El módulo aprovisiona infraestructura. La instalación del gimnasio, Docker y VNC queda para la etapa de configuración de la VM.

- [Autenticación del proveedor OCI](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/configuring.htm)
- [Creación de una instancia con Terraform en OCI](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/tutorials/tf-compute.htm)
