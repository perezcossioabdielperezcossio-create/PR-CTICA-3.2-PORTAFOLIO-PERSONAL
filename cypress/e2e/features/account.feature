# language: es
# Pruebas automatizadas: account.cy.js

Característica: Recorridos del área privada y Administración en el navegador

  Escenario: indica que se reinicie si el servidor anterior devuelve 404 HTML
    Dado una versión anterior del servidor simulada con una respuesta 404 HTML
    Cuando se intenta abrir Administración
    Entonces la interfaz indica que se debe reiniciar el servidor

  Escenario: activa una cuenta, modifica el perfil, guarda asistencia, envía un mensaje y cancela
    Dado un socio registrado y la Administración habilitada con la clave de pruebas
    Cuando el administrador genera el código y el socio activa su cuenta, inicia sesión, edita sus datos, marca asistencia y envía un mensaje
    Entonces el perfil y la asistencia quedan guardados, la asistencia duplicada se rechaza y el administrador puede leer el mensaje
    Cuando el socio vuelve a iniciar sesión con su correo actualizado y confirma la baja con su contraseña
    Entonces la membresía se elimina de SQLite y el perfil deja de estar accesible
