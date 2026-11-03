
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const salasRouter = require("./routes/salas");
const reservasRouter = require("./routes/reservas");
const usuariosRouter = require("./routes/usuarios");

const { inicializarAdministrador } = require("./routes/usuarios");

const app = express();

const PORT = process.env.PORT || 3000;

// CONFIGURACION GENERAL

app.use(express.json({ limit: "10kb" }));

// CONFIGURACION CORS

const origenesPermitidos = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(origen => origen.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        if (origenesPermitidos.includes(origin)) {
            return callback(null, true);
        }

        const esLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        if (esLocal) {
            return callback(null, true);
        }

        return callback(new Error("Origen no autorizado por CORS."));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"]
}));

// RUTA PRINCIPAL

app.get("/", (req, res) => {
    res.json({
        mensaje: "GrooveSpace API funcionando correctamente.",
        estado: "activo"
    });
});

// RUTAS DE LA API

app.use("/api/salas", salasRouter);
app.use("/api/reservas", reservasRouter);
app.use("/api/usuarios", usuariosRouter);

// MANEJO DE RUTAS INEXISTENTES

app.use((req, res) => {
    res.status(404).json({
        mensaje: "La ruta solicitada no existe."
    });
});

// INICIAR SERVIDOR

async function iniciarServidor() {
    try {
        await inicializarAdministrador();

        app.listen(PORT, () => {
            console.log("------------------------------------");
            console.log("GrooveSpace API funcionando correctamente.");
            console.log(`Servidor iniciado en el puerto ${PORT}`);
            console.log("------------------------------------");
        });

    } catch (error) {
        console.error("No se pudo iniciar GrooveSpace:", error.message);
        process.exit(1);
    }
}

iniciarServidor();
