# language: es
# Pruebas automatizadas: account-integration.cy.js

Característica: Integración de cuentas, API y SQLite

  Escenario: protege el perfil y la bandeja sin credenciales
    Dado una solicitud sin sesión de socio ni clave de administración
    Cuando se consultan el perfil y la bandeja
    Entonces ambas rutas responden 401

  Escenario: rechaza códigos inválidos o reutilizados y contraseñas incorrectas
    Dado un socio registrado y un código de activación emitido
    Cuando se prueba un código incorrecto, se usa el código válido y se intenta reutilizarlo
    Entonces solo el código válido activa la cuenta y una contraseña incorrecta recibe 401

  Escenario: permite la activación con el último código emitido y rechaza el anterior
    Dado dos códigos emitidos consecutivamente para el mismo socio
    Cuando se intenta activar primero con el código antiguo y luego con el nuevo
    Entonces el anterior recibe 400 y el último activa la cuenta con respuesta 204

  Escenario: impide cambiar el correo por el de otro socio y conserva los datos guardados
    Dado un socio autenticado y otro socio con su propio correo
    Cuando el primero intenta actualizar su perfil con el correo del segundo
    Entonces se recibe 409 y se comprueba que el nombre, correo y teléfono originales se conservan

  Escenario: guarda la asistencia y entrega el mensaje solo al administrador autenticado
    Dado un socio autenticado
    Cuando marca su asistencia y envía un mensaje
    Entonces se guarda un solo día, se rechaza el duplicado y solo el administrador autenticado puede leer el mensaje

  Escenario: exige contraseña para la baja y revoca el acceso al eliminar la membresía
    Dado un socio autenticado con un mensaje guardado
    Cuando intenta la baja con contraseña incorrecta y después con la correcta
    Entonces la primera petición recibe 403; la segunda elimina al socio y su mensaje, y la sesión pierde acceso al perfil
