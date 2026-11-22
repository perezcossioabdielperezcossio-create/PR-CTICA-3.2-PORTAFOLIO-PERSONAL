# language: es
# Pruebas automatizadas: register-member.cy.js

Característica: Caso de uso de alta de socios

  Escenario: envía los datos normalizados al repositorio y devuelve la fecha guardada
    Dado un repositorio simulado que devuelve la fecha de alta
    Cuando se registra un socio con espacios y mayúsculas en sus datos
    Entonces se llama una vez al repositorio con los datos normalizados y se devuelve el socio con su fecha

  Escenario: rechaza los datos inválidos sin llamar al repositorio
    Dado un correo inválido y un repositorio simulado
    Cuando se intenta registrar al socio
    Entonces el resultado es inválido y el repositorio no recibe ninguna llamada

  Escenario: devuelve el estado duplicado cuando el repositorio no acepta el alta
    Dado un repositorio simulado que indica que el alta no se hizo
    Cuando se intenta registrar un socio con datos válidos
    Entonces se devuelve el estado duplicado y se comprueba una sola llamada al repositorio
