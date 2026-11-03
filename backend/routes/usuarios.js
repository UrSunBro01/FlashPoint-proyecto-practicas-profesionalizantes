
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const verificarToken = require("../middleware/autenticacion");

const router = express.Router();

const rutaUsuarios = path.join(__dirname, "..", "data", "usuarios.json");

// FUNCIONES AUXILIARES

function leerUsuarios() {
    const carpetaDatos = path.dirname(rutaUsuarios);

    if (!fs.existsSync(carpetaDatos)) {
        fs.mkdirSync(carpetaDatos, { recursive: true });
    }

    if (!fs.existsSync(rutaUsuarios)) {
        fs.writeFileSync(rutaUsuarios, "[]", "utf8");
    }

    const contenido = fs.readFileSync(rutaUsuarios, "utf8");
    const usuarios = JSON.parse(contenido);

    if (!Array.isArray(usuarios)) {
        throw new Error("El archivo usuarios.json no contiene una lista valida.");
    }

    return usuarios;
}

function guardarUsuarios(usuarios) {
    fs.writeFileSync(
        rutaUsuarios,
        JSON.stringify(usuarios, null, 2),
        "utf8"
    );
}

function obtenerUsuarioPublico(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido || "",
        usuario: usuario.usuario || "",
        email: usuario.email,
        rol: usuario.rol || "cliente"
    };
}

function comprobarJWT(res) {
    if (!process.env.JWT_SECRET) {
        console.error("No se encontro JWT_SECRET en las variables de entorno.");

        res.status(500).json({
            mensaje: "El servidor no tiene configurada la autenticacion."
        });

        return false;
    }

    return true;
}

// INICIALIZAR ADMINISTRADOR PRINCIPAL

async function inicializarAdministrador() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const nombre = process.env.ADMIN_NOMBRE?.trim() || "Administrador";
    const apellido = process.env.ADMIN_APELLIDO?.trim() || "Principal";
    const usuario = process.env.ADMIN_USUARIO?.trim().toLowerCase() || "admin";

    if (!email || !password) {
        console.log("No se configuraron las credenciales del administrador.");
        return;
    }

    if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        throw new Error("ADMIN_PASSWORD debe tener entre 8 y 72 bytes.");
    }

    const usuarios = leerUsuarios();

    const administradoresCoincidentes = usuarios.filter(
        u => u.email?.trim().toLowerCase() === email
    );

    if (administradoresCoincidentes.length > 1) {
        throw new Error(
            "Hay varias cuentas con el correo ADMIN_EMAIL. Revisá usuarios.json."
        );
    }

    const indiceAdmin = usuarios.findIndex(
        u => u.email?.trim().toLowerCase() === email
    );

    // Comprobar que el nombre de usuario este disponible.

    const usuarioOcupado = usuarios.some(
        (u, indice) =>
            indice !== indiceAdmin &&
            u.usuario?.trim().toLowerCase() === usuario
    );

    if (usuarioOcupado) {
        throw new Error(
            `No se puede inicializar el administrador: el usuario "${usuario}" ya esta ocupado.`
        );
    }

    let administrador;

    if (indiceAdmin !== -1) {
        administrador = usuarios[indiceAdmin];

        // Actualizar la contrasena solamente si cambio o no existe un hash.

        let passwordHash = administrador.passwordHash;

        const contrasenaCoincide = passwordHash
            ? await bcrypt.compare(password, passwordHash)
            : false;

        if (!contrasenaCoincide) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        administrador = {
            ...administrador,
            nombre,
            apellido,
            usuario,
            email,
            passwordHash,
            rol: "admin"
        };

        usuarios[indiceAdmin] = administrador;

        console.log("Administrador principal actualizado correctamente.");

    } else {
        const passwordHash = await bcrypt.hash(password, 10);

        administrador = {
            id: crypto.randomUUID(),
            nombre,
            apellido,
            usuario,
            email,
            passwordHash,
            rol: "admin"
        };

        usuarios.push(administrador);

        console.log("Administrador principal creado correctamente.");
    }

    // Mantener una sola cuenta con permisos de administrador.

    for (const cuenta of usuarios) {
        if (
            cuenta.id !== administrador.id &&
            cuenta.rol === "admin"
        ) {
            cuenta.rol = "cliente";
        }
    }

    guardarUsuarios(usuarios);

    console.log("Se verificaron los permisos de administrador.");
}

// REGISTRO DE USUARIOS

// POST /api/usuarios/registro

router.post("/registro", async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            usuario,
            email,
            password
        } = req.body;

        if (!nombre || !apellido || !usuario || !email || !password) {
            return res.status(400).json({
                mensaje: "Todos los campos son obligatorios."
            });
        }

        if (
            typeof nombre !== "string" ||
            typeof apellido !== "string" ||
            typeof usuario !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                mensaje: "Los datos enviados no tienen un formato valido."
            });
        }

        const nombreLimpio = nombre.trim();
        const apellidoLimpio = apellido.trim();
        const usuarioLimpio = usuario.trim().toLowerCase();
        const emailLimpio = email.trim().toLowerCase();

        if (!nombreLimpio || !apellidoLimpio || !usuarioLimpio || !emailLimpio) {
            return res.status(400).json({
                mensaje: "Los campos no pueden estar vacios."
            });
        }

        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoEmail.test(emailLimpio)) {
            return res.status(400).json({
                mensaje: "El correo electronico no tiene un formato valido."
            });
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(usuarioLimpio)) {
            return res.status(400).json({
                mensaje: "El usuario debe tener entre 3 y 20 caracteres. Solo se permiten letras, numeros y guiones bajos."
            });
        }

        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                mensaje: "La contrasena debe tener al menos 8 caracteres y no superar los 72 bytes."
            });
        }

        const usuarios = leerUsuarios();

        const usuarioExistente = usuarios.find(u =>
            u.email?.toLowerCase() === emailLimpio ||
            u.usuario?.toLowerCase() === usuarioLimpio
        );

        if (usuarioExistente) {
            return res.status(409).json({
                mensaje: "El correo electronico o nombre de usuario ya estan registrados."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const nuevoUsuario = {
            id: crypto.randomUUID(),
            nombre: nombreLimpio,
            apellido: apellidoLimpio,
            usuario: usuarioLimpio,
            email: emailLimpio,
            passwordHash,
            rol: "cliente"
        };

        usuarios.push(nuevoUsuario);
        guardarUsuarios(usuarios);

        return res.status(201).json({
            mensaje: "Usuario registrado correctamente.",
            usuario: obtenerUsuarioPublico(nuevoUsuario)
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);

        return res.status(500).json({
            mensaje: "Ocurrio un error al registrar el usuario."
        });
    }
});

// INICIO DE SESION

// POST /api/usuarios/login

router.post("/login", async (req, res) => {
    try {
        const { identificador, email, password } = req.body;

        const datoLogin = identificador || email;

        if (
            typeof datoLogin !== "string" ||
            typeof password !== "string" ||
            !datoLogin.trim() ||
            !password
        ) {
            return res.status(400).json({
                mensaje: "El usuario o correo y la contrasena son obligatorios."
            });
        }

        const identificadorLimpio = datoLogin.trim().toLowerCase();
        const usuarios = leerUsuarios();

        const usuarioEncontrado = usuarios.find(u =>
            u.email?.toLowerCase() === identificadorLimpio ||
            u.usuario?.toLowerCase() === identificadorLimpio
        );

        if (!usuarioEncontrado || !usuarioEncontrado.passwordHash) {
            return res.status(401).json({
                mensaje: "Usuario, correo o contrasena incorrectos."
            });
        }

        const contrasenaCorrecta = await bcrypt.compare(
            password,
            usuarioEncontrado.passwordHash
        );

        if (!contrasenaCorrecta) {
            return res.status(401).json({
                mensaje: "Usuario, correo o contrasena incorrectos."
            });
        }

        if (!comprobarJWT(res)) {
            return;
        }

        const rolUsuario = usuarioEncontrado.rol || "cliente";

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id,
                email: usuarioEncontrado.email,
                rol: rolUsuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            mensaje: "Inicio de sesion correcto.",
            token,
            usuario: {
                ...obtenerUsuarioPublico(usuarioEncontrado),
                rol: rolUsuario
            }
        });

    } catch (error) {
        console.error("Error al iniciar sesion:", error);

        return res.status(500).json({
            mensaje: "Ocurrio un error al iniciar sesion."
        });
    }
});

// OBTENER PERFIL

// GET /api/usuarios/perfil

router.get("/perfil", verificarToken, (req, res) => {
    try {
        const usuarios = leerUsuarios();

        const usuarioEncontrado = usuarios.find(
            u => u.id === req.usuario.id
        );

        if (!usuarioEncontrado) {
            return res.status(404).json({
                mensaje: "No se encontro el usuario."
            });
        }

        return res.status(200).json({
            mensaje: "Perfil obtenido correctamente.",
            usuario: obtenerUsuarioPublico(usuarioEncontrado)
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);

        return res.status(500).json({
            mensaje: "No se pudo obtener el perfil."
        });
    }
});

// ACTUALIZAR PERFIL

// PUT /api/usuarios/perfil

router.put("/perfil", verificarToken, (req, res) => {
    try {
        const {
            nombre,
            apellido,
            usuario,
            email
        } = req.body;

        if (
            typeof nombre !== "string" ||
            typeof apellido !== "string" ||
            typeof usuario !== "string" ||
            typeof email !== "string"
        ) {
            return res.status(400).json({
                mensaje: "Todos los campos del perfil son obligatorios."
            });
        }

        const nombreLimpio = nombre.trim();
        const apellidoLimpio = apellido.trim();
        const usuarioLimpio = usuario.trim().toLowerCase();
        const emailLimpio = email.trim().toLowerCase();

        if (!nombreLimpio || !apellidoLimpio || !usuarioLimpio || !emailLimpio) {
            return res.status(400).json({
                mensaje: "Los campos no pueden estar vacios."
            });
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(usuarioLimpio)) {
            return res.status(400).json({
                mensaje: "El usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, numeros y guiones bajos."
            });
        }

        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoEmail.test(emailLimpio)) {
            return res.status(400).json({
                mensaje: "El correo electronico no tiene un formato valido."
            });
        }

        const usuarios = leerUsuarios();

        const indiceUsuario = usuarios.findIndex(
            u => u.id === req.usuario.id
        );

        if (indiceUsuario === -1) {
            return res.status(404).json({
                mensaje: "No se encontro el usuario."
            });
        }

        const datosDuplicados = usuarios.some(
            (u, indice) =>
                indice !== indiceUsuario &&
                (
                    u.email?.toLowerCase() === emailLimpio ||
                    u.usuario?.toLowerCase() === usuarioLimpio
                )
        );

        if (datosDuplicados) {
            return res.status(409).json({
                mensaje: "El correo electronico o nombre de usuario ya estan registrados."
            });
        }

        usuarios[indiceUsuario] = {
            ...usuarios[indiceUsuario],
            nombre: nombreLimpio,
            apellido: apellidoLimpio,
            usuario: usuarioLimpio,
            email: emailLimpio
        };

        guardarUsuarios(usuarios);

        return res.status(200).json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: obtenerUsuarioPublico(usuarios[indiceUsuario])
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);

        return res.status(500).json({
            mensaje: "No se pudo actualizar el perfil."
        });
    }
});

// CAMBIAR CONTRASENA

// PATCH /api/usuarios/cambiar-password

router.patch("/cambiar-password", verificarToken, async (req, res) => {
    try {
        const {
            passwordActual,
            passwordNueva,
            confirmarPassword
        } = req.body;

        if (
            typeof passwordActual !== "string" ||
            typeof passwordNueva !== "string" ||
            typeof confirmarPassword !== "string"
        ) {
            return res.status(400).json({
                mensaje: "Completa todos los campos de contrasena."
            });
        }

        if (
            passwordNueva.length < 8 ||
            Buffer.byteLength(passwordNueva, "utf8") > 72
        ) {
            return res.status(400).json({
                mensaje: "La nueva contrasena debe tener al menos 8 caracteres y no superar los 72 bytes."
            });
        }

        if (passwordNueva !== confirmarPassword) {
            return res.status(400).json({
                mensaje: "Las nuevas contrasenas no coinciden."
            });
        }

        if (passwordActual === passwordNueva) {
            return res.status(400).json({
                mensaje: "La nueva contrasena debe ser diferente de la actual."
            });
        }

        const usuarios = leerUsuarios();

        const indiceUsuario = usuarios.findIndex(
            u => u.id === req.usuario.id
        );

        if (indiceUsuario === -1) {
            return res.status(404).json({
                mensaje: "No se encontro el usuario."
            });
        }

        const usuarioEncontrado = usuarios[indiceUsuario];

        const contrasenaCorrecta = await bcrypt.compare(
            passwordActual,
            usuarioEncontrado.passwordHash
        );

        if (!contrasenaCorrecta) {
            return res.status(401).json({
                mensaje: "La contrasena actual es incorrecta."
            });
        }

        const passwordHash = await bcrypt.hash(passwordNueva, 10);

        usuarios[indiceUsuario].passwordHash = passwordHash;

        guardarUsuarios(usuarios);

        return res.status(200).json({
            mensaje: "Contrasena actualizada correctamente."
        });

    } catch (error) {
        console.error("Error al cambiar contrasena:", error);

        return res.status(500).json({
            mensaje: "No se pudo cambiar la contrasena."
        });
    }
});

// EXPORTACION DEL ROUTER

module.exports = router;
module.exports.inicializarAdministrador = inicializarAdministrador;
