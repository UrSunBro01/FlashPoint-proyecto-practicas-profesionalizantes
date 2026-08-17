# GrooveSpace - Sistema de Gestión de Salas de Ensayo

Trabajo práctico para la materia **Prácticas Profesionalizantes** – Leopoldo Marechal.

---

## Integrantes del equipo

| Nombre grupo D

| Fernández Leandro 
| Romero Axel 
| Parga Nahuel 
| *[Nombre del 4to integrante]*
| *[Nombre del 5to integrante]* 

---

##  Descripción del proyecto

**GrooveSpace** es un sistema web para la gestión de reservas de salas de ensayo musical.  
Permite a los usuarios:

- Registrarse e iniciar sesión.
- Consultar disponibilidad de salas.
- Reservar una sala (solo para usuarios autenticados).
- Cancelar reservas.
- Visualizar los casos de uso del sistema.

El sitio está desarrollado únicamente con **HTML semántico** y **CSS básico**, sin frameworks ni JavaScript, cumpliendo con las restricciones del trabajo práctico que especifico el profe.

---

##  Estructura de carpetas
proyectos programacion\proyecto groovespace
├──apuntes
├──css
│ └── styles.css # Hoja de estilos externa
├──documentacion #iconos
├──iconos #para iconos
├──imagenes
│ └── logo.png #logo de la pagina made in canvas
├──pages
│ └── index.html # pagina principal
│ └── iniciosesion.html #pagina inicio sesion
│ └── registrarse.html #pagina registrarse
│ └── reservar.html #pagina para reservar despues de identificarse
│ └── consultar.html #pagina para consultar la reserva 
├──sfx

## funcionalidades previstas para la siguiente entrega:
mejorar prolijidad
arreglar errores de css
fusionar en un grid el inicio sesion con el registro(request parga)
hacer que las paginas tipo formulario al menos devuelvan al inicio
los botones reservar y consultar aparecer y desparacer si el usuario inicio sesion o no
agregar animacion al header
casos de uso
agregar boton que lleve al inicio de pagina
agregar imagenes ya sean de stock o de ia para ilustrar 
crear y arreglar las paginas reservar y consultar,una un forms y otra asumo que ya tiene que ver con javascript
cambiar los "li" de index

## Especificación del caso de uso: Solicitar reserva
Nombre: Solicitud de reserva
Tipo: Base
Descripción General: El Músico, tras autenticarse en el sistema, seleccionará de manera
secuencial la sala de ensayo y la fecha deseada. El sistema verificará la disponibilidad y
mostrará los horarios libres. Una vez confirmada la reserva, esta quedará registrada en
estado pendiente y se enviará al Músico una notificación con los detalles correspondientes.

Actores Principales: Músico / Banda
Actores Secundarios: -

Autor: Analista

Fecha de Creación: 15/4

Precondiciones: Completar el inicio de sesión o registro.

Puntos de Extensión: No tiene extensiones a otros CU.

Flujo Normal
1. El músico selecciona el caso de uso “Solicitar Reserva”
2. El sistema carga las salas de ensayo disponibles
3. El musica selecciona la sala deseada
4. El sistema carga los horarios disponibles en la sala seleccionada
5. El músico selecciona fecha
6. El sistema consulta horarios disponibles en esa fecha
7. El músico selecciona una hora
8. El sistema muestra un resumen con los detalles de la sala que incluye fecha y horario
9. El músico confirmó reserva 
10. El sistema registra esta solicitud y la marca como “Pendiente”, dispara el módulo de notificación con los detalles en el correo del músico, y finaliza el caso de uso.

Poscondición: Solicitud de Reserva registrada en el sistema bajo “Pendiente”

*Flujos Alternativos*

● A0: Cancelación: -
*) En cualquier momento antes del paso 9 - -
*El Paciente oprime “cancelar”
*El sistema finaliza este caso de uso.

● A1: No hay espacio para reservas: -
*) El Sistema muestra un mensaje de “No tenemos reservas disponibles” y
muestra una fecha disponible en la agenda de GrooveSpace(El músico selecciona esta fecha sugerida)
El sistema finaliza este caso de
uso. (volvemos al paso 6)

● A2: Sistema caído: -
Simplemente no tenemos sistema
