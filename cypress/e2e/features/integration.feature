# language: es
# Pruebas automatizadas: integration.cy.js

Característica: Integración de socios, API y SQLite

  Escenario: registra y persiste un socio normalizado
    Dado una base temporal vacía y datos con espacios y mayúsculas
    Cuando se envía el alta a la API
    Entonces se recibe 201 y SQLite contiene el nombre y correo normalizados

  Escenario: responde 409 al registrar un correo duplicado
    Dado un socio registrado en SQLite
    Cuando se intenta registrar otro socio con el mismo correo en mayúsculas
    Entonces la API responde 409

  Escenario: responde 400 y evita escribir datos inválidos
    Dado una base temporal y un correo inválido
    Cuando se solicita el alta
    Entonces la API responde 400 y la cantidad de filas permanece igual

  Escenario: devuelve una lista vacía cuando SQLite no tiene socios
    Dado una base SQLite sin socios
    Cuando se solicita el listado
    Entonces se recibe 200 con una lista vacía y una cabecera que impide el almacenamiento en caché

  Escenario: lista las altas guardadas en orden y con su fecha
    Dado dos socios registrados en orden
    Cuando se solicita el listado
    Entonces las altas aparecen de la más reciente a la más antigua y la fecha coincide con la devuelta por el alta

  Escenario: devuelve 400 cuando el cuerpo JSON está incompleto
    Dado una solicitud de alta con un JSON incompleto
    Cuando se envía la solicitud a la API
    Entonces se recibe 400 con el mensaje de JSON inválido y SQLite sigue vacío

  Escenario: busca por una parte del nombre y omite tildes, mayúsculas y espacios externos
    Dado dos socios, uno con apellido acentuado
    Cuando se busca parte del apellido sin tilde, en mayúsculas y con espacios externos
    Entonces se devuelve únicamente el socio que coincide

  Escenario: busca por correo y devuelve una lista vacía si no encuentra coincidencias
    Dado socios con dominios de correo distintos
    Cuando se busca un dominio y luego un signo de porcentaje
    Entonces el dominio devuelve solo el socio correspondiente y el signo devuelve una lista vacía

  Escenario: rechaza filtros repetidos o demasiado largos
    Dado una consulta con dos parámetros de búsqueda o con más de 254 caracteres
    Cuando se solicita el listado con cada filtro inválido
    Entonces ambas consultas reciben 400

  Escenario: guarda y lista los 20 socios del fixture sin alterar sus datos
    Dado los 20 socios ficticios de members.json
    Cuando se registran por la API y se consulta el listado
    Entonces SQLite contiene 20 filas y la API devuelve los nombres y correos esperados en orden inverso al alta
