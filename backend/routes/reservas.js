
// Importamos Express para crear rutas.
const express = require("express");

// Importamos fs para leer y escribir archivos.
const fs = require("fs");

// Importamos path para construir rutas de archivos.
const path = require("path");

// Importamos los middleware de autenticacion y autorizacion.
const {
    verificarToken,
    verificarAdmin
} = require("../middleware/autenticacion");

const router = express.Router();

// Indicamos donde se encuentra el archivo que almacena las reservas.
const archivoReservas = path.join(__dirname, "..", "data", "reservas.json");

// Indicamos donde se encuentra el archivo de usuarios.
const archivoUsuarios = path.join(__dirname, "..", "data", "usuarios.json");

// Definimos los identificadores de las salas que acepta el sistema.
const salasValidas = ["standard", "premium", "bateria"];

// Establecemos una duracion fija de 60 minutos por reserva.
const DURACION_RESERVA = 60;


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

// Leemos las reservas guardadas en el archivo JSON.
function leerReservas() {

    // Creamos la carpeta si todavia no existe.
    const carpetaDatos = path.dirname(archivoReservas);

    if (!fs.existsSync(carpetaDatos)) {
        fs.mkdirSync(carpetaDatos, { recursive: true });
    }

    // Creamos el archivo si todavia no existe.
    if (!fs.existsSync(archivoReservas)) {
        fs.writeFileSync(archivoReservas, "[]", "utf8");
    }

    const contenido = fs.readFileSync(archivoReservas, "utf8");

    const reservas = JSON.parse(contenido);

    if (!Array.isArray(reservas)) {
        throw new Error("El archivo reservas.json no contiene una lista valida.");
    }

    return reservas;
}


// Guardamos las reservas actualizadas en el archivo JSON.
function guardarReservas(reservas) {

    fs.writeFileSync(
        archivoReservas,
        JSON.stringify(reservas, null, 2),
        "utf8"
    );
}


// Leemos los usuarios guardados.
function leerUsuarios() {

    if (!fs.existsSync(archivoUsuarios)) {
        return [];
    }

    const contenido = fs.readFileSync(archivoUsuarios, "utf8");

    const usuarios = JSON.parse(contenido);

    if (!Array.isArray(usuarios)) {
        throw new Error("El archivo usuarios.json no contiene una lista valida.");
    }

    return usuarios;
}


// Convertimos un horario HH:MM a minutos desde la medianoche.
// Por ejemplo, 15:30 se convierte en 930.
function convertirAMinutos(horario) {

    const [horas, minutos] = horario.split(":").map(Number);

    return horas * 60 + minutos;
}


// Comprobamos que una fecha tenga un formato y valor validos.
function fechaValida(fecha) {

    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }

    const fechaReal = new Date(`${fecha}T00:00:00Z`);

    return (
        !Number.isNaN(fechaReal.getTime()) &&
        fechaReal.toISOString().slice(0, 10) === fecha
    );
}


// Comprobamos que una fecha no sea anterior al dia actual.
function fechaNoPasada(fecha) {

    const hoy = new Date();

    hoy.setUTCHours(0, 0, 0, 0);

    const fechaReal = new Date(`${fecha}T00:00:00Z`);

    return fechaReal >= hoy;
}


// Comprobamos que un horario tenga el formato HH:MM.
function horarioValido(horario) {

    return (
        typeof horario === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
    );
}


// Comprobamos si existe una superposicion de horarios.
function haySuperposicion(reservas, sala, fecha, horario) {

    const inicioNuevo = convertirAMinutos(horario);

    const finNuevo = inicioNuevo + DURACION_RESERVA;

    return reservas.some(reserva => {

        // Ignoramos otras salas, fechas y reservas canceladas.
        if (
            reserva.sala !== sala ||
            reserva.fecha !== fecha ||
            reserva.estado !== "activa"
        ) {
            return false;
        }

        const inicioExistente = convertirAMinutos(reserva.horario);

        const finExistente = inicioExistente + reserva.duracion;

        return (
            inicioNuevo < finExistente &&
            finNuevo > inicioExistente
        );
    });
}


// ==========================================
// 1. CONSULTAR DISPONIBILIDAD
// ==========================================

// GET /api/reservas/disponibilidad
// Permite consultar la disponibilidad sin iniciar sesion.
router.get("/disponibilidad", (req, res) => {

    try {

        const { sala, fecha, horario } = req.query;

        if (
            typeof sala !== "string" ||
            typeof fecha !== "string" ||
            !horarioValido(horario)
        ) {
            return res.status(400).json({
                error: "Debes indicar una sala, fecha y horario validos."
            });
        }

        if (!salasValidas.includes(sala)) {
            return res.status(400).json({
                error: "La sala indicada no es valida."
            });
        }

        if (!fechaValida(fecha)) {
            return res.status(400).json({
                error: "La fecha indicada no es valida."
            });
        }

        if (!fechaNoPasada(fecha)) {
            return res.status(400).json({
                error: "No se puede consultar disponibilidad de fechas pasadas."
            });
        }

        const finNuevo = convertirAMinutos(horario) + DURACION_RESERVA;

        if (finNuevo > 24 * 60) {
            return res.status(400).json({
                error: "La reserva debe terminar antes de la medianoche."
            });
        }

        const reservas = leerReservas();

        const disponible = !haySuperposicion(
            reservas,
            sala,
            fecha,
            horario
        );

        return res.status(200).json({
            sala,
            fecha,
            horario,
            duracion: DURACION_RESERVA,
            disponible
        });

    } catch (error) {

        console.error("Error al consultar disponibilidad:", error);

        return res.status(500).json({
            error: "No se pudo consultar la disponibilidad."
        });
    }
});


// ==========================================
// 2. CONSULTAR AGENDA
// ==========================================

// GET /api/reservas/agenda
// Muestra los horarios ocupados de una sala en una fecha determinada.
router.get("/agenda", (req, res) => {

    try {

        const { sala, fecha } = req.query;

        if (
            typeof sala !== "string" ||
            !salasValidas.includes(sala) ||
            !fechaValida(fecha)
        ) {
            return res.status(400).json({
                error: "Debes indicar una sala y una fecha validas."
            });
        }

        const reservas = leerReservas();

        const horariosOcupados = reservas
            .filter(reserva =>
                reserva.sala === sala &&
                reserva.fecha === fecha &&
                reserva.estado === "activa"
            )
            .map(reserva => ({
                horario: reserva.horario,
                duracion: reserva.duracion
            }))
            .sort((a, b) => a.horario.localeCompare(b.horario));

        return res.status(200).json({
            sala,
            fecha,
            horariosOcupados
        });

    } catch (error) {

        console.error("Error al consultar la agenda:", error);

        return res.status(500).json({
            error: "No se pudo consultar la agenda."
        });
    }
});


// ==========================================
// 3. RESERVAS DEL CLIENTE
// ==========================================

// GET /api/reservas
// Devuelve solamente las reservas del usuario autenticado.
router.get("/", verificarToken, (req, res) => {

    try {

        const reservas = leerReservas();

        const reservasUsuario = reservas.filter(
            reserva => reserva.usuarioId === req.usuario.id
        );

        return res.status(200).json(reservasUsuario);

    } catch (error) {

        console.error("Error al consultar las reservas:", error);

        return res.status(500).json({
            mensaje: "No se pudieron consultar las reservas."
        });
    }
});


// ==========================================
// 4. CREAR RESERVA
// ==========================================

// POST /api/reservas
// Crea una reserva asociada al usuario autenticado.
router.post("/", verificarToken, (req, res) => {

    try {

        const { sala, fecha, horario } = req.body;

        if (
            typeof sala !== "string" ||
            typeof fecha !== "string" ||
            !horarioValido(horario)
        ) {
            return res.status(400).json({
                error: "Debes indicar la sala, fecha y horario."
            });
        }

        if (!salasValidas.includes(sala)) {
            return res.status(400).json({
                error: "La sala indicada no es valida."
            });
        }

        if (!fechaValida(fecha)) {
            return res.status(400).json({
                error: "La fecha indicada no es valida."
            });
        }

        if (!fechaNoPasada(fecha)) {
            return res.status(400).json({
                error: "No se pueden reservar fechas pasadas."
            });
        }

        const finNuevo = convertirAMinutos(horario) + DURACION_RESERVA;

        if (finNuevo > 24 * 60) {
            return res.status(400).json({
                error: "La reserva debe terminar antes de la medianoche."
            });
        }

        const reservas = leerReservas();

        if (haySuperposicion(reservas, sala, fecha, horario)) {
            return res.status(409).json({
                error: "La sala ya esta reservada en ese horario."
            });
        }

        const nuevaReserva = {
            id: require("crypto").randomUUID(),
            usuarioId: req.usuario.id,
            sala,
            fecha,
            horario,
            duracion: DURACION_RESERVA,
            estado: "activa"
        };

        reservas.push(nuevaReserva);

        guardarReservas(reservas);

        return res.status(201).json({
            mensaje: "Reserva creada correctamente.",
            reserva: nuevaReserva
        });

    } catch (error) {

        console.error("Error al crear la reserva:", error);

        return res.status(500).json({
            error: "No se pudo crear la reserva."
        });
    }
});


// ==========================================
// 5. HISTORIAL DEL CLIENTE
// ==========================================

// GET /api/reservas/historial
// Devuelve el historial del usuario autenticado.
router.get("/historial", verificarToken, (req, res) => {

    try {

        const reservas = leerReservas();

        const historial = reservas
            .filter(reserva => reserva.usuarioId === req.usuario.id)
            .sort((a, b) => {
                const fechaA = new Date(`${a.fecha}T${a.horario}:00`);
                const fechaB = new Date(`${b.fecha}T${b.horario}:00`);

                return fechaB - fechaA;
            });

        return res.status(200).json({
            total: historial.length,
            historial
        });

    } catch (error) {

        console.error("Error al consultar el historial:", error);

        return res.status(500).json({
            mensaje: "Ocurrio un error al consultar el historial."
        });
    }
});


// ==========================================
// 6. CANCELAR RESERVA DEL CLIENTE
// ==========================================

// PATCH /api/reservas/:id/cancelar
// Cancela una reserva solo si pertenece al usuario autenticado.
router.patch("/:id/cancelar", verificarToken, (req, res) => {

    try {

        const reservas = leerReservas();

        const reserva = reservas.find(
            reserva => reserva.id === req.params.id
        );

        if (!reserva) {
            return res.status(404).json({
                mensaje: "No se encontro la reserva."
            });
        }

        if (reserva.usuarioId !== req.usuario.id) {
            return res.status(403).json({
                mensaje: "No tenes permiso para cancelar esta reserva."
            });
        }

        if (reserva.estado !== "activa") {
            return res.status(409).json({
                mensaje: "La reserva ya esta cancelada o no esta activa."
            });
        }

        reserva.estado = "cancelada";

        guardarReservas(reservas);

        return res.status(200).json({
            mensaje: "Reserva cancelada correctamente.",
            reserva
        });

    } catch (error) {

        console.error("Error al cancelar la reserva:", error);

        return res.status(500).json({
            mensaje: "Ocurrio un error al cancelar la reserva."
        });
    }
});


// ==========================================
// 7. ADMINISTRACION DE RESERVAS
// ==========================================

// GET /api/reservas/administracion
// Devuelve todas las reservas con los datos publicos de sus clientes.
// Exclusivo para administradores.
router.get("/administracion", verificarToken, verificarAdmin, (req, res) => {

    try {

        const reservas = leerReservas();
        const usuarios = leerUsuarios();

        const reservasAdministracion = reservas.map(reserva => {

            const cliente = usuarios.find(
                usuario => usuario.id === reserva.usuarioId
            );

            return {
                ...reserva,

                cliente: cliente ? {
                    id: cliente.id,
                    nombre: cliente.nombre,
                    apellido: cliente.apellido || "",
                    usuario: cliente.usuario || "",
                    email: cliente.email
                } : null
            };
        });

        return res.status(200).json({
            total: reservasAdministracion.length,
            reservas: reservasAdministracion
        });

    } catch (error) {

        console.error("Error al consultar las reservas administrativas:", error);

        return res.status(500).json({
            mensaje: "No se pudieron consultar todas las reservas."
        });
    }
});


// ==========================================
// 8. CANCELAR RESERVA DESDE ADMINISTRACION
// ==========================================

// PATCH /api/reservas/:id/cancelar-admin
// Permite al administrador cancelar cualquier reserva activa.
router.patch("/:id/cancelar-admin", verificarToken, verificarAdmin, (req, res) => {

    try {

        const reservas = leerReservas();

        const reserva = reservas.find(
            reserva => reserva.id === req.params.id
        );

        if (!reserva) {
            return res.status(404).json({
                mensaje: "No se encontro la reserva."
            });
        }

        if (reserva.estado !== "activa") {
            return res.status(409).json({
                mensaje: "La reserva ya esta cancelada o no esta activa."
            });
        }

        reserva.estado = "cancelada";

        guardarReservas(reservas);

        return res.status(200).json({
            mensaje: "La reserva fue cancelada por administracion.",
            reserva
        });

    } catch (error) {

        console.error("Error al cancelar una reserva desde administracion:", error);

        return res.status(500).json({
            mensaje: "No se pudo cancelar la reserva."
        });
    }
});


// ==========================================
// EXPORTACION DEL ROUTER
// ==========================================

// Exportamos el enrutador para utilizarlo desde index.js.
module.exports = router;
