# language: es
# Pruebas automatizadas: list-members.cy.js

Característica: Caso de uso de búsqueda de socios

  Escenario: devuelve el listado completo si el filtro está vacío
    Dado un repositorio simulado con dos socios
    Cuando se busca usando únicamente espacios
    Entonces se devuelve el listado completo

  Escenario: busca nombres sin distinguir mayúsculas ni tildes
    Dado un socio cuyo apellido tiene tilde
    Cuando se busca el apellido en mayúsculas y sin tilde
    Entonces solo se devuelve el socio cuyo apellido coincide

  Escenario: compara el correo y trata el símbolo de porcentaje como texto
    Dado dos socios con correos de distintos dominios
    Cuando se busca un dominio en mayúsculas y luego un signo de porcentaje
    Entonces se devuelve solo el socio del dominio y ningún resultado para el signo
