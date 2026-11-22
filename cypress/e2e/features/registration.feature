# language: es
# Pruebas automatizadas: registration.cy.js

Característica: Recorridos del registro y los tableros en el navegador

  Escenario: da de alta a un socio y abre el tablero con sus datos
    Dado el formulario de inscripción abierto
    Cuando se registra a un socio, se agrega una fecha de asistencia y se intenta repetirla
    Entonces se muestra su tablero con nombre, correo y día inicial; la fecha se agrega una sola vez y se advierte del duplicado

  Escenario: abre el tablero si el servidor anterior solo confirma el alta
    Dado una respuesta simulada del servidor anterior que confirma el alta sin devolver el perfil
    Cuando se registra un socio desde el formulario
    Entonces el tablero se abre con los datos ingresados, el correo normalizado y un día inicial

  Escenario: muestra el error de correo duplicado
    Dado un socio dado de alta desde el formulario
    Cuando se vuelve al formulario vacío y se intenta registrar el mismo correo con mayúsculas
    Entonces el formulario advierte que el correo ya está registrado

  Escenario: muestra los socios que se han guardado, del más reciente al más antiguo
    Dado un tablero sin socios y dos altas realizadas desde el formulario
    Cuando se abre el tablero antes y después de los registros
    Entonces primero se muestra el estado vacío y luego dos filas ordenadas de la más reciente a la más antigua, con sus fechas

  Escenario: muestra el mensaje de validación de nombre
    Dado un nombre que queda en un solo carácter después de quitar espacios
    Cuando se envía el formulario
    Entonces se muestra el mensaje que pide un nombre de 2 a 100 caracteres

  Escenario: permite reintentar la lista cuando falla la primera solicitud
    Dado un fallo 503 simulado para la primera consulta del listado
    Cuando se abre el tablero y se pulsa Reintentar
    Entonces primero se muestra el error y luego se carga el estado vacío

  Escenario: conserva las fechas de prueba al volver desde la lista general
    Dado un socio con una fecha de prueba adicional
    Cuando se abre la lista general y se vuelve al tablero personal
    Entonces la fecha agregada sigue visible y hay dos días en el tablero personal

  Escenario: filtra el tablero por nombre y regresa a los 20 socios al limpiar
    Dado 20 socios ficticios registrados en la base temporal
    Cuando se busca un nombre, se intenta una búsqueda sin resultados y se pulsa Limpiar
    Entonces se muestra una coincidencia, luego el estado sin coincidencias y finalmente vuelven a aparecer los 20 socios
