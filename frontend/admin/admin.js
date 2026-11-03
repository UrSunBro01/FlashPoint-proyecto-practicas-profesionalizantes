
"use strict";

// CONFIGURACION GENERAL DEL PANEL

const API_URL = "http://localhost:3000/api";
const TOKEN_KEY = "grooveSpaceToken";
const SESSION_KEY = "grooveSpaceUsuario";
const CONFIG_KEY = "grooveSpaceConfiguracion";

const RUTA_LOGIN = "../pages/iniciosesion.html";

const informacionSalas = {
    standard: {
        numero: "Sala 1",
        categoria: "Standard",
        descripcion: "Sala de ensayo equipada para practicas musicales y sesiones grupales.",
        equipamiento: "Guitarra y amplificacion",
        precio: 4500
    },
    premium: {
        numero: "Sala 2",
        categoria: "Premium",
        descripcion: "Espacio equipado para ensayos con mayor variedad de instrumentos.",
        equipamiento: "Bateria y amplificacion",
        precio: 7000
    },
    bateria: {
        numero: "Sala 3",
        categoria: "Bateria",
        descripcion: "Sala preparada para grabaciones y sesiones de bateria.",
        equipamiento: "Bateria y grabacion",
        precio: 9500
    }
};

let datosSalas = [];
let reservas = [];
let usuarioAdministrador = null;

let cargandoReservas = false;
let cargandoSalas = false;
let sesionVerificada = false;

// REFERENCIAS A LOS ELEMENTOS HTML

const elementoFechaActual = document.getElementById("fechaActual");
const botonActualizar = document.getElementById("botonActualizar");
const adminContainer = document.querySelector(".admin-container");
const adminLoader = document.getElementById("adminLoader");

// Dashboard

const elementoTotalReservas = document.getElementById("totalReservas");
const elementoReservasActivas = document.getElementById("reservasActivas");
const elementoSalasDisponibles = document.getElementById("salasDisponibles");
const elementoOcupacionPromedio = document.getElementById("ocupacionPromedio");

const graficoOcupacion = document.getElementById("graficoOcupacion");
const porcentajeGrafico = document.getElementById("porcentajeGrafico");
const porcentajeOcupado = document.getElementById("porcentajeOcupado");
const porcentajeDisponible = document.getElementById("porcentajeDisponible");

const actividadLista = document.getElementById("actividadLista");

const filtroFecha = document.getElementById("filtroFecha");
const filtroSala = document.getElementById("filtroSala");
const filtroEstado = document.getElementById("filtroEstado");

const agendaFilas = document.getElementById("agendaFilas");
const tablaReservasCuerpo = document.getElementById("tablaReservasCuerpo");
const sinResultados = document.getElementById("sinResultados");

// Gestion de reservas

const reservasTotalGestion = document.getElementById("reservasTotalGestion");
const reservasActivasGestion = document.getElementById("reservasActivasGestion");
const reservasPendientesGestion = document.getElementById("reservasPendientesGestion");
const reservasCanceladasGestion = document.getElementById("reservasCanceladasGestion");

const buscarReserva = document.getElementById("buscarReserva");
const reservasFiltroFecha = document.getElementById("reservasFiltroFecha");
const reservasFiltroSala = document.getElementById("reservasFiltroSala");
const reservasFiltroEstado = document.getElementById("reservasFiltroEstado");

const listaGestionReservas = document.getElementById("listaGestionReservas");
const reservasSinResultados = document.getElementById("reservasSinResultados");

// Gestion de salas

const salasTotal = document.getElementById("salasTotal");
const salasDisponiblesGestion = document.getElementById("salasDisponiblesGestion");
const salasOcupadas = document.getElementById("salasOcupadas");

// Configuracion

const nombreSistema = document.getElementById("nombreSistema");
const descripcionSistema = document.getElementById("descripcionSistema");
const duracionReserva = document.getElementById("duracionReserva");
const horaApertura = document.getElementById("horaApertura");
const horaCierre = document.getElementById("horaCierre");
const nombreAdministrador = document.getElementById("nombreAdministrador");
const correoAdministrador = document.getElementById("correoAdministrador");

const botonGuardarConfiguracion = document.getElementById(
    "botonGuardarConfiguracion"
);

// AUTENTICACION Y SEGURIDAD

function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);

    window.location.replace(RUTA_LOGIN);
}

function inicializarCerrarSesion() {
    const botonCerrarSesion = document.getElementById("botonCerrarSesion");

    if (!botonCerrarSesion) return;

    botonCerrarSesion.addEventListener("click", () => {
        const confirmar = confirm(
            "¿Estas seguro de que deseas cerrar sesion?"
        );

        if (!confirmar) return;

        cerrarSesion();
    });
}

function mostrarPanelAutorizado() {
    if (adminContainer) {
        adminContainer.style.visibility = "visible";
    }

    if (adminLoader) {
        adminLoader.classList.add("loader-oculto");

        setTimeout(() => {
            adminLoader.remove();
        }, 600);
    }
}

function normalizarRol(rol) {
    return String(rol || "").trim().toLowerCase();
}

async function solicitarAPI(ruta, opciones = {}) {
    const token = obtenerToken();

    if (!token) {
        throw new Error("No hay una sesion iniciada.");
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...opciones.headers,
            Authorization: `Bearer ${token}`
        }
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 401 || respuesta.status === 403) {
        alert(
            "Tu sesion no es valida o no tenes permisos de administrador. Volve a iniciar sesion."
        );

        cerrarSesion();

        throw new Error("Sesion no autorizada.");
    }

    if (!respuesta.ok) {
        const error = new Error(
            datos.mensaje ||
            datos.error ||
            `Error del servidor (${respuesta.status}).`
        );

        error.status = respuesta.status;

        throw error;
    }

    return datos;
}

// Comprueba el usuario real almacenado en el backend.

async function verificarAdministrador() {
    const token = obtenerToken();

    if (!token) {
        cerrarSesion();
        return false;
    }

    try {
        const datos = await solicitarAPI("/usuarios/perfil");

        if (!datos.usuario) {
            throw new Error("No se pudo verificar el usuario.");
        }

        if (normalizarRol(datos.usuario.rol) !== "admin") {
            alert("No tenes permisos para acceder al panel administrativo.");
            cerrarSesion();
            return false;
        }

        usuarioAdministrador = datos.usuario;
        sesionVerificada = true;

        return true;

    } catch (error) {
        console.error("Error al verificar administrador:", error);

        if (error.message !== "Sesion no autorizada.") {
            alert(
                "No se pudo verificar tu sesion administrativa. Intenta iniciar sesion nuevamente."
            );

            cerrarSesion();
        }

        return false;
    }
}

// ACTUALIZAR INFORMACION DEL ADMINISTRADOR

function mostrarDatosAdministrador() {
    if (!usuarioAdministrador) return;

    const nombreCompleto = [
        usuarioAdministrador.nombre,
        usuarioAdministrador.apellido
    ].filter(Boolean).join(" ");

    const nombreVisible = nombreCompleto || "Administrador";

    const avatar = document.querySelector(".usuario-avatar");
    const nombreElemento = document.querySelector(".usuario-info strong");
    const detalleElemento = document.querySelector(".usuario-info span");

    if (avatar) {
        avatar.textContent = nombreVisible.charAt(0).toUpperCase();
    }

    if (nombreElemento) {
        nombreElemento.textContent = nombreVisible;
    }

    if (detalleElemento) {
        detalleElemento.textContent =
            usuarioAdministrador.email || "Administrador";
    }
}

// FUNCIONES AUXILIARES

function obtenerFechaActual() {
    const fecha = new Date();

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha) {
    if (!fecha) return "-";

    const partes = fecha.split("-");

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerNombreSala(idSala) {
    const sala = datosSalas.find(item => item.id === idSala);

    if (sala) {
        return sala.nombre;
    }

    return informacionSalas[idSala]?.numero || idSala || "-";
}

function obtenerEstadoTexto(estado) {
    const estados = {
        activa: "Activa",
        pendiente: "Pendiente",
        cancelada: "Cancelada",
        confirmada: "Confirmada"
    };

    return estados[estado] || estado || "-";
}

function obtenerClaseEstado(estado) {
    const clases = {
        activa: "estado-activa",
        pendiente: "estado-pendiente",
        cancelada: "estado-cancelada",
        confirmada: "estado-confirmada"
    };

    return clases[estado] || "";
}

function crearCelda(texto) {
    const celda = document.createElement("td");

    celda.textContent = texto ?? "-";

    return celda;
}

function crearBadgeEstado(estado) {
    const badge = document.createElement("span");

    badge.className = `estado ${obtenerClaseEstado(estado)}`;
    badge.textContent = obtenerEstadoTexto(estado);

    return badge;
}

function esReservaActiva(reserva) {
    return reserva.estado === "activa" ||
        reserva.estado === "confirmada";
}

function obtenerReservasDelDia(fecha) {
    return reservas.filter(reserva =>
        reserva.fecha === fecha &&
        reserva.estado !== "cancelada"
    );
}

// CARGAR SALAS DESDE EL BACKEND

async function cargarSalas() {
    if (cargandoSalas) return;

    cargandoSalas = true;

    try {
        const respuesta = await fetch(`${API_URL}/salas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las salas.");
        }

        const lista = await respuesta.json();

        if (!Array.isArray(lista)) {
            throw new Error("La respuesta de salas no tiene un formato valido.");
        }

        datosSalas = lista.map(sala => ({
            ...informacionSalas[sala.id],
            id: sala.id,
            nombre: sala.nombre ||
                informacionSalas[sala.id]?.numero ||
                sala.id
        }));

        actualizarTodo();

    } catch (error) {
        console.error("Error al cargar las salas:", error);

        datosSalas = [];
        actualizarTodo();

        if (actividadLista) {
            actividadLista.textContent =
                "No se pudieron cargar las salas desde el servidor.";
        }

    } finally {
        cargandoSalas = false;
    }
}

// CARGAR RESERVAS DESDE EL BACKEND

function normalizarReserva(reserva) {
    const cliente = reserva.cliente;

    let nombreCliente = "";

    if (typeof cliente === "string") {
        nombreCliente = cliente;

    } else if (cliente && typeof cliente === "object") {
        nombreCliente = [
            cliente.nombre,
            cliente.apellido
        ].filter(Boolean).join(" ");
    }

    if (!nombreCliente) {
        nombreCliente = [
            reserva.nombre,
            reserva.apellido
        ].filter(Boolean).join(" ");
    }

    if (!nombreCliente && reserva.usuario) {
        nombreCliente = typeof reserva.usuario === "string"
            ? reserva.usuario
            : [
                reserva.usuario.nombre,
                reserva.usuario.apellido
            ].filter(Boolean).join(" ");
    }

    if (!nombreCliente) {
        nombreCliente = reserva.email || "Cliente";
    }

    return {
        ...reserva,
        id: String(reserva.id ?? ""),
        cliente: nombreCliente,
        sala: typeof reserva.sala === "string"
            ? reserva.sala
            : reserva.sala?.id || "",
        fecha: reserva.fecha || "",
        hora: reserva.horario || reserva.hora || "",
        duracion: Number(reserva.duracion) || 60,
        estado: String(reserva.estado || "").trim().toLowerCase()
    };
}

async function obtenerReservasServidor() {
    const datos = await solicitarAPI("/reservas/administracion");

    const lista = Array.isArray(datos)
        ? datos
        : datos.reservas || [];

    if (!Array.isArray(lista)) {
        throw new Error("La respuesta de reservas no tiene un formato valido.");
    }

    return lista.map(normalizarReserva);
}

async function cargarReservas() {
    if (cargandoReservas || !sesionVerificada) return;

    cargandoReservas = true;

    if (botonActualizar) {
        botonActualizar.disabled = true;
    }

    try {
        reservas = await obtenerReservasServidor();

        actualizarTodo();

    } catch (error) {
        console.error("Error al obtener las reservas:", error);

        if (error.message !== "Sesion no autorizada.") {
            alert(`No se pudieron actualizar las reservas.\n${error.message}`);
        }

    } finally {
        cargandoReservas = false;

        if (botonActualizar) {
            botonActualizar.disabled = false;
        }
    }
}

// CANCELAR RESERVAS

async function cancelarReserva(idReserva) {
    const reserva = reservas.find(
        item => item.id === String(idReserva)
    );

    if (!reserva) {
        alert("No se encontro la reserva.");
        return;
    }

    if (reserva.estado === "cancelada") {
        alert("Esta reserva ya se encuentra cancelada.");
        return;
    }

    const confirmar = confirm(
        `¿Deseas cancelar la reserva ${reserva.id} de ${reserva.cliente}?`
    );

    if (!confirmar) return;

    try {
        await solicitarAPI(
            `/reservas/${encodeURIComponent(reserva.id)}/cancelar-admin`,
            {
                method: "PATCH"
            }
        );

        alert("La reserva fue cancelada correctamente.");

        await cargarReservas();

    } catch (error) {
        console.error("Error al cancelar la reserva:", error);

        if (error.message !== "Sesion no autorizada.") {
            alert(error.message);
        }
    }
}

// FECHA Y NAVEGACION

function actualizarFechaActual() {
    if (!elementoFechaActual) return;

    const fecha = new Date();

    elementoFechaActual.textContent = fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function cambiarSeccion(nombreSeccion) {
    const botonesMenu = document.querySelectorAll(".menu-item");
    const secciones = document.querySelectorAll(".seccion-admin");

    botonesMenu.forEach(boton => {
        const esActivo = boton.dataset.seccion === nombreSeccion;

        boton.classList.toggle("activo", esActivo);
    });

    secciones.forEach(seccion => {
        const esActiva = seccion.dataset.contenido === nombreSeccion;

        seccion.classList.toggle("activa", esActiva);
        seccion.hidden = !esActiva;
    });

    if (nombreSeccion === "inicio") {
        actualizarDashboard();
    }

    if (nombreSeccion === "reservas") {
        actualizarGestionReservas();
    }

    if (nombreSeccion === "salas") {
        actualizarGestionSalas();
    }
}

function inicializarNavegacion() {
    document.querySelectorAll(".menu-item").forEach(boton => {
        boton.addEventListener("click", () => {
            cambiarSeccion(boton.dataset.seccion);
        });
    });
}

// DASHBOARD

function actualizarMetricasDashboard() {
    const total = reservas.length;

    const activas = reservas.filter(esReservaActiva).length;

    const fecha = obtenerFechaActual();

    const reservasHoy = reservas.filter(reserva =>
        reserva.fecha === fecha &&
        esReservaActiva(reserva)
    );

    const salasOcupadasHoy = new Set(
        reservasHoy.map(reserva => reserva.sala)
    ).size;

    const disponibles = Math.max(
        0,
        datosSalas.length - salasOcupadasHoy
    );

    const porcentaje = datosSalas.length > 0
        ? Math.round((salasOcupadasHoy / datosSalas.length) * 100)
        : 0;

    if (elementoTotalReservas) {
        elementoTotalReservas.textContent = total;
    }

    if (elementoReservasActivas) {
        elementoReservasActivas.textContent = activas;
    }

    if (elementoSalasDisponibles) {
        elementoSalasDisponibles.textContent = disponibles;
    }

    if (elementoOcupacionPromedio) {
        elementoOcupacionPromedio.textContent = `${porcentaje}%`;
    }
}

function actualizarGraficoOcupacion() {
    if (!graficoOcupacion) return;

    const fecha = obtenerFechaActual();

    const reservasHoy = reservas.filter(reserva =>
        reserva.fecha === fecha &&
        esReservaActiva(reserva)
    );

    const ocupadas = new Set(
        reservasHoy.map(reserva => reserva.sala)
    ).size;

    const porcentaje = datosSalas.length > 0
        ? Math.round((ocupadas / datosSalas.length) * 100)
        : 0;

    const disponibles = 100 - porcentaje;

    graficoOcupacion.style.background = `
        conic-gradient(
            var(--cyan) 0% ${porcentaje}%,
            #292943 ${porcentaje}% 100%
        )
    `;

    if (porcentajeGrafico) {
        porcentajeGrafico.textContent = `${porcentaje}%`;
    }

    if (porcentajeOcupado) {
        porcentajeOcupado.textContent = `${porcentaje}%`;
    }

    if (porcentajeDisponible) {
        porcentajeDisponible.textContent = `${disponibles}%`;
    }
}

// ACTIVIDAD RECIENTE

function actualizarActividad() {
    if (!actividadLista) return;

    actividadLista.innerHTML = "";

    const ultimasReservas = [...reservas]
        .sort((a, b) => {
            const fechaA = `${a.fecha} ${a.hora}`;
            const fechaB = `${b.fecha} ${b.hora}`;

            return fechaB.localeCompare(fechaA);
        })
        .slice(0, 5);

    if (ultimasReservas.length === 0) {
        actividadLista.textContent = "Todavia no hay actividad registrada.";
        return;
    }

    ultimasReservas.forEach(reserva => {
        const elemento = document.createElement("div");
        elemento.className = "actividad-item";

        const icono = document.createElement("div");
        icono.className = "actividad-icono";
        icono.textContent = reserva.estado === "cancelada" ? "×" : "✓";

        const contenido = document.createElement("div");
        contenido.className = "actividad-contenido";

        const titulo = document.createElement("strong");
        titulo.textContent =
            `${reserva.cliente} - ${obtenerNombreSala(reserva.sala)}`;

        const detalle = document.createElement("span");
        detalle.textContent =
            `${formatearFecha(reserva.fecha)} · ${reserva.hora} · ${obtenerEstadoTexto(reserva.estado)}`;

        const tiempo = document.createElement("span");
        tiempo.className = "actividad-tiempo";
        tiempo.textContent = reserva.id;

        contenido.append(titulo, detalle);
        elemento.append(icono, contenido, tiempo);

        actividadLista.appendChild(elemento);
    });
}

// FILTROS DEL DASHBOARD

function obtenerReservasFiltradasDashboard() {
    const fechaSeleccionada = filtroFecha?.value || "";
    const salaSeleccionada = filtroSala?.value || "todas";
    const estadoSeleccionado = filtroEstado?.value || "todas";

    return reservas.filter(reserva => {
        const coincideFecha = !fechaSeleccionada ||
            reserva.fecha === fechaSeleccionada;

        const coincideSala = salaSeleccionada === "todas" ||
            reserva.sala === salaSeleccionada;

        const coincideEstado = estadoSeleccionado === "todas" ||
            estadoSeleccionado === "todos" ||
            reserva.estado === estadoSeleccionado;

        return coincideFecha && coincideSala && coincideEstado;
    });
}

// AGENDA DE RESERVAS

function crearAgenda() {
    if (!agendaFilas) return;

    agendaFilas.innerHTML = "";

    const fechaSeleccionada = filtroFecha?.value || obtenerFechaActual();
    const salaSeleccionada = filtroSala?.value || "todas";

    const salasMostrar = salaSeleccionada === "todas"
        ? datosSalas
        : datosSalas.filter(sala => sala.id === salaSeleccionada);

    if (salasMostrar.length === 0) {
        agendaFilas.textContent = "No hay salas para mostrar.";
        return;
    }

    salasMostrar.forEach(sala => {
        const fila = document.createElement("div");
        fila.className = "agenda-fila";

        const nombre = document.createElement("div");
        nombre.className = "agenda-nombre-sala";
        nombre.textContent = sala.nombre;

        fila.appendChild(nombre);

        const contenedorHorario = document.createElement("div");
        contenedorHorario.className = "agenda-horarios";
        contenedorHorario.style.position = "relative";
        contenedorHorario.style.display = "grid";
        contenedorHorario.style.gridTemplateColumns =
            "repeat(10, minmax(0, 1fr))";

        for (let hora = 10; hora < 20; hora++) {
            const celda = document.createElement("div");

            celda.className = "agenda-celda";
            celda.dataset.hora = `${String(hora).padStart(2, "0")}:00`;

            contenedorHorario.appendChild(celda);
        }

        const reservasSala = reservas.filter(reserva =>
            reserva.fecha === fechaSeleccionada &&
            reserva.sala === sala.id &&
            reserva.estado !== "cancelada"
        );

        reservasSala.forEach(reserva => {
            const partesHora = reserva.hora.split(":");
            const horaInicio = Number(partesHora[0]);
            const minutosInicio = Number(partesHora[1] || 0);

            const duracion = Number(reserva.duracion) || 60;

            const posicion = horaInicio - 10 + minutosInicio / 60;
            const ancho = duracion / 60;

            if (posicion < 0 || posicion >= 10) return;

            const anchoVisible = Math.min(ancho, 10 - posicion);

            const bloque = document.createElement("div");

            bloque.className = "agenda-reserva";
            bloque.style.position = "absolute";
            bloque.style.left = `${(posicion / 10) * 100}%`;
            bloque.style.width = `${(anchoVisible / 10) * 100}%`;

            const cliente = document.createElement("strong");
            cliente.textContent = reserva.cliente;

            const hora = document.createElement("span");
            hora.textContent =
                `${reserva.hora} - ${obtenerEstadoTexto(reserva.estado)}`;

            bloque.append(cliente, hora);
            contenedorHorario.appendChild(bloque);
        });

        fila.appendChild(contenedorHorario);
        agendaFilas.appendChild(fila);
    });
}

// TABLA DEL DASHBOARD

function actualizarTablaDashboard() {
    if (!tablaReservasCuerpo) return;

    tablaReservasCuerpo.innerHTML = "";

    const reservasFiltradas = obtenerReservasFiltradasDashboard();

    reservasFiltradas.forEach(reserva => {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(reserva.id));
        fila.appendChild(crearCelda(reserva.cliente));
        fila.appendChild(crearCelda(obtenerNombreSala(reserva.sala)));
        fila.appendChild(crearCelda(formatearFecha(reserva.fecha)));
        fila.appendChild(crearCelda(reserva.hora));

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(crearBadgeEstado(reserva.estado));

        fila.appendChild(celdaEstado);
        tablaReservasCuerpo.appendChild(fila);
    });

    if (sinResultados) {
        sinResultados.hidden = reservasFiltradas.length > 0;
    }
}

function actualizarDashboard() {
    actualizarMetricasDashboard();
    actualizarGraficoOcupacion();
    actualizarActividad();
    crearAgenda();
    actualizarTablaDashboard();
}

// GESTION DE RESERVAS

function actualizarMetricasReservas() {
    if (reservasTotalGestion) {
        reservasTotalGestion.textContent = reservas.length;
    }

    if (reservasActivasGestion) {
        reservasActivasGestion.textContent =
            reservas.filter(esReservaActiva).length;
    }

    if (reservasPendientesGestion) {
        reservasPendientesGestion.textContent =
            reservas.filter(reserva => reserva.estado === "pendiente").length;
    }

    if (reservasCanceladasGestion) {
        reservasCanceladasGestion.textContent =
            reservas.filter(reserva => reserva.estado === "cancelada").length;
    }
}

function obtenerReservasFiltradasGestion() {
    const texto = buscarReserva?.value.trim().toLowerCase() || "";
    const fecha = reservasFiltroFecha?.value || "";
    const sala = reservasFiltroSala?.value || "todas";
    const estado = reservasFiltroEstado?.value || "todas";

    return reservas.filter(reserva => {
        const coincideTexto =
            reserva.id.toLowerCase().includes(texto) ||
            reserva.cliente.toLowerCase().includes(texto) ||
            obtenerNombreSala(reserva.sala).toLowerCase().includes(texto);

        const coincideFecha = !fecha || reserva.fecha === fecha;
        const coincideSala = sala === "todas" || reserva.sala === sala;
        const coincideEstado =
            estado === "todas" ||
            estado === "todos" ||
            reserva.estado === estado;

        return coincideTexto &&
            coincideFecha &&
            coincideSala &&
            coincideEstado;
    });
}

function actualizarTablaGestionReservas() {
    if (!listaGestionReservas) return;

    listaGestionReservas.innerHTML = "";

    const reservasFiltradas = obtenerReservasFiltradasGestion();

    reservasFiltradas.forEach(reserva => {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(reserva.id));
        fila.appendChild(crearCelda(reserva.cliente));
        fila.appendChild(crearCelda(obtenerNombreSala(reserva.sala)));
        fila.appendChild(crearCelda(formatearFecha(reserva.fecha)));
        fila.appendChild(crearCelda(reserva.hora));
        fila.appendChild(crearCelda(`${reserva.duracion} min`));

        const celdaEstado = document.createElement("td");
        celdaEstado.appendChild(crearBadgeEstado(reserva.estado));

        fila.appendChild(celdaEstado);

        const celdaAcciones = document.createElement("td");
        const acciones = document.createElement("div");

        acciones.className = "acciones-tabla";

        if (reserva.estado !== "cancelada") {
            const botonCancelar = document.createElement("button");

            botonCancelar.type = "button";
            botonCancelar.className = "boton-accion eliminar";
            botonCancelar.textContent = "×";
            botonCancelar.title = "Cancelar reserva";
            botonCancelar.setAttribute(
                "aria-label",
                `Cancelar reserva ${reserva.id}`
            );

            botonCancelar.addEventListener("click", () => {
                cancelarReserva(reserva.id);
            });

            acciones.appendChild(botonCancelar);

        } else {
            const texto = document.createElement("span");

            texto.textContent = "Sin acciones";
            texto.style.color = "var(--texto-suave)";
            texto.style.fontSize = "10px";

            acciones.appendChild(texto);
        }

        celdaAcciones.appendChild(acciones);
        fila.appendChild(celdaAcciones);

        listaGestionReservas.appendChild(fila);
    });

    if (reservasSinResultados) {
        reservasSinResultados.hidden = reservasFiltradas.length > 0;
    }
}

function actualizarGestionReservas() {
    actualizarMetricasReservas();
    actualizarTablaGestionReservas();
}

// GESTION DE SALAS

function actualizarTarjetasSalas() {
    const tarjetas = document.querySelectorAll(".sala-card");

    tarjetas.forEach(tarjeta => {
        const idSala = tarjeta.dataset.salaId;

        const sala = datosSalas.find(item => item.id === idSala);

        if (!sala) return;

        const reservasHoy = reservas.filter(reserva =>
            reserva.fecha === obtenerFechaActual() &&
            reserva.sala === sala.id &&
            esReservaActiva(reserva)
        );

        const estaOcupada = reservasHoy.length > 0;

        const estado = tarjeta.querySelector(
            ".sala-card-encabezado span:last-child"
        );

        if (estado) {
            estado.textContent = estaOcupada
                ? "Con reservas hoy"
                : "Sin reservas hoy";

            estado.className = estaOcupada
                ? "estado-pendiente"
                : "estado-activa";
        }
    });
}

function actualizarGestionSalas() {
    const fecha = obtenerFechaActual();

    const salasOcupadasHoy = new Set(
        reservas
            .filter(reserva =>
                reserva.fecha === fecha &&
                esReservaActiva(reserva)
            )
            .map(reserva => reserva.sala)
    ).size;

    const disponibles = Math.max(
        0,
        datosSalas.length - salasOcupadasHoy
    );

    if (salasTotal) {
        salasTotal.textContent = datosSalas.length;
    }

    if (salasDisponiblesGestion) {
        salasDisponiblesGestion.textContent = disponibles;
    }

    if (salasOcupadas) {
        salasOcupadas.textContent = salasOcupadasHoy;
    }

    actualizarTarjetasSalas();
}

// CONFIGURACION LOCAL DEL PANEL

function obtenerConfiguracionPredeterminada() {
    return {
        nombreSistema: "GrooveSpace",
        descripcionSistema: "Sistema de gestion de reservas de salas de ensayo.",
        duracionReserva: "60",
        horaApertura: "10:00",
        horaCierre: "20:00",
        nombreAdministrador: usuarioAdministrador?.nombre || "Administrador",
        correoAdministrador: usuarioAdministrador?.email || ""
    };
}

function cargarConfiguracion() {
    try {
        const configuracionGuardada = localStorage.getItem(CONFIG_KEY);

        if (!configuracionGuardada) {
            return obtenerConfiguracionPredeterminada();
        }

        return {
            ...obtenerConfiguracionPredeterminada(),
            ...JSON.parse(configuracionGuardada)
        };

    } catch (error) {
        console.error("Error al cargar la configuracion:", error);

        return obtenerConfiguracionPredeterminada();
    }
}

function mostrarConfiguracion() {
    const configuracion = cargarConfiguracion();

    if (nombreSistema) {
        nombreSistema.value = configuracion.nombreSistema;
    }

    if (descripcionSistema) {
        descripcionSistema.value = configuracion.descripcionSistema;
    }

    if (duracionReserva) {
        duracionReserva.value = configuracion.duracionReserva;
    }

    if (horaApertura) {
        horaApertura.value = configuracion.horaApertura;
    }

    if (horaCierre) {
        horaCierre.value = configuracion.horaCierre;
    }

    if (nombreAdministrador) {
        nombreAdministrador.value = configuracion.nombreAdministrador;
    }

    if (correoAdministrador) {
        correoAdministrador.value = configuracion.correoAdministrador;
    }
}

function guardarConfiguracion() {
    const configuracion = {
        nombreSistema: nombreSistema?.value.trim() || "GrooveSpace",
        descripcionSistema: descripcionSistema?.value.trim() || "",
        duracionReserva: duracionReserva?.value || "60",
        horaApertura: horaApertura?.value || "10:00",
        horaCierre: horaCierre?.value || "20:00",
        nombreAdministrador: nombreAdministrador?.value.trim() || "Administrador",
        correoAdministrador: correoAdministrador?.value.trim() || ""
    };

    if (configuracion.horaApertura >= configuracion.horaCierre) {
        alert("La hora de cierre debe ser posterior a la hora de apertura.");
        return;
    }

    if (
        configuracion.correoAdministrador &&
        correoAdministrador &&
        !correoAdministrador.checkValidity()
    ) {
        alert("Ingresa un correo electronico valido.");
        correoAdministrador.focus();
        return;
    }

    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(configuracion));

        alert(
            "La configuracion se guardo en este navegador correctamente."
        );

    } catch (error) {
        console.error("Error al guardar la configuracion:", error);

        alert("No se pudo guardar la configuracion.");
    }
}

// FILTROS Y BOTONES

function inicializarFiltros() {
    if (filtroFecha) {
        filtroFecha.value = obtenerFechaActual();

        filtroFecha.addEventListener("change", () => {
            crearAgenda();
            actualizarTablaDashboard();
        });
    }

    if (filtroSala) {
        filtroSala.addEventListener("change", () => {
            crearAgenda();
            actualizarTablaDashboard();
        });
    }

    if (filtroEstado) {
        filtroEstado.addEventListener("change", actualizarTablaDashboard);
    }

    if (buscarReserva) {
        buscarReserva.addEventListener(
            "input",
            actualizarTablaGestionReservas
        );
    }

    if (reservasFiltroFecha) {
        reservasFiltroFecha.addEventListener(
            "change",
            actualizarTablaGestionReservas
        );
    }

    if (reservasFiltroSala) {
        reservasFiltroSala.addEventListener(
            "change",
            actualizarTablaGestionReservas
        );
    }

    if (reservasFiltroEstado) {
        reservasFiltroEstado.addEventListener(
            "change",
            actualizarTablaGestionReservas
        );
    }
}

function inicializarBotones() {
    if (botonActualizar) {
        botonActualizar.addEventListener("click", async () => {
            await Promise.all([
                cargarReservas(),
                cargarSalas()
            ]);
        });
    }

    if (botonGuardarConfiguracion) {
        botonGuardarConfiguracion.addEventListener(
            "click",
            guardarConfiguracion
        );
    }

    inicializarCerrarSesion();
}

// ACTUALIZAR TODAS LAS SECCIONES

function actualizarTodo() {
    actualizarFechaActual();
    actualizarDashboard();
    actualizarGestionReservas();
    actualizarGestionSalas();
}

// INICIALIZACION DEL PANEL

async function inicializarAdmin() {
    if (adminContainer) {
        adminContainer.style.visibility = "hidden";
    }

    const autorizado = await verificarAdministrador();

    if (!autorizado) {
        return;
    }

    mostrarPanelAutorizado();
    mostrarDatosAdministrador();

    actualizarFechaActual();

    inicializarNavegacion();
    inicializarFiltros();
    inicializarBotones();

    mostrarConfiguracion();

    cambiarSeccion("inicio");

    await Promise.all([
        cargarReservas(),
        cargarSalas()
    ]);

    console.log("GrooveSpace Admin iniciado correctamente.");
}

document.addEventListener("DOMContentLoaded", inicializarAdmin);
