# language: es
# Pruebas automatizadas: unit.cy.js

Característica: Validación de datos del socio

  Escenario: normaliza el nombre y el correo
    Dado un nombre con espacios adicionales y un correo en mayúsculas
    Cuando se validan los datos
    Entonces el nombre queda con espacios simples y el correo se devuelve en minúsculas

  Escenario: rechaza nombres vacíos, cortos y demasiado largos
    Dado nombres vacíos, de un carácter, de más de 100 caracteres o con un valor nulo
    Cuando se valida cada nombre
    Entonces se devuelve un error de nombre para cada caso

  Escenario: rechaza correos inválidos
    Dado correos sin arroba, sin dominio completo, con espacios internos o con un valor nulo
    Cuando se valida cada correo
    Entonces se devuelve un error de correo para cada caso
