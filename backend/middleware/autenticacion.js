
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Ubicacion del archivo de usuarios.
const rutaUsuarios = path.join(__dirname, "..", "data", "usuarios.json");

// Verificar que el usuario tenga un token valido.
function verificarToken(req, res, next) {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                mensaje: "El servidor no tiene configurada la autenticacion."
            });
        }

        const autorizacion = req.headers.authorization;

        if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
            return res.status(401).json({
                mensaje: "No se proporciono un token de autenticacion."
            });
        }

        const token = autorizacion.split(" ")[1];

        const datosUsuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!datosUsuario.id || !datosUsuario.email) {
            return res.status(401).json({
                mensaje: "El token no contiene datos validos."
            });
        }

        req.usuario = datosUsuario;

        next();

    } catch (error) {
        return res.status(401).json({
            mensaje: "Token invalido o expirado."
        });
    }
}

// Verificar que el usuario autenticado sea administrador.
function verificarAdmin(req, res, next) {
    try {
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({
                mensaje: "Debes iniciar sesion para realizar esta accion."
            });
        }

        if (!fs.existsSync(rutaUsuarios)) {
            return res.status(500).json({
                mensaje: "No se encontro el archivo de usuarios."
            });
        }

        const contenido = fs.readFileSync(rutaUsuarios, "utf8");
        const usuarios = JSON.parse(contenido);

        if (!Array.isArray(usuarios)) {
            return res.status(500).json({
                mensaje: "El archivo de usuarios no contiene datos validos."
            });
        }

        // Buscamos la cuenta directamente en el archivo.
        const usuarioEncontrado = usuarios.find(
            usuario => usuario.id === req.usuario.id
        );

        if (!usuarioEncontrado || usuarioEncontrado.rol !== "admin") {
            return res.status(403).json({
                mensaje: "No tienes permisos de administrador."
            });
        }

        // Actualizamos el rol desde los datos guardados en el servidor.
        req.usuario.rol = usuarioEncontrado.rol;

        next();

    } catch (error) {
        console.error("Error al verificar administrador:", error);

        return res.status(500).json({
            mensaje: "No se pudieron verificar los permisos."
        });
    }
}

// Exportamos los middlewares.
module.exports = verificarToken;
module.exports.verificarToken = verificarToken;
module.exports.verificarAdmin = verificarAdmin;
