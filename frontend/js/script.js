
/* ============================================================
   GROOVESPACE - SCRIPT PRINCIPAL
   Conexion con el backend
============================================================ */

const API_URL = "http://localhost:3000/api";

const SESSION_KEY = "grooveSpaceUsuario";
const TOKEN_KEY = "grooveSpaceToken";

/* ============================================================
   1. SESION Y ALMACENAMIENTO
============================================================ */

function guardarUsuarioActual(usuario) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

function obtenerUsuarioActual() {
    const usuario = localStorage.getItem(SESSION_KEY);

    if (!usuario) return null;

    try {
        return JSON.parse(usuario);
    } catch (error) {
        console.error("Error al recuperar la sesion:", error);
        return null;
    }
}

function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function guardarSesion(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    guardarUsuarioActual(usuario);

    localStorage.setItem("idUsuario", usuario.id);
    localStorage.setItem("nombreUsuario", usuario.usuario);
}

function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("idUsuario");
    localStorage.removeItem("nombreUsuario");

    window.location.href = resolverRuta("index.html");
}

window.cerrarSesion = cerrarSesion;

/* ============================================================
   2. ACTUALIZAR MENU SEGUN LA SESION
============================================================ */


function actualizarMenuSesion() {
    const token = obtenerToken();
    const sesionActiva = Boolean(token);

    const enlaceRegistro = document.getElementById("nav-register");
    const enlaceLogin = document.getElementById("nav-login");
    const enlaceCerrarSesion = document.getElementById("nav-logout");

    if (enlaceRegistro) {
        enlaceRegistro.hidden = sesionActiva;
        enlaceRegistro.style.display = sesionActiva ? "none" : "";
    }

    if (enlaceLogin) {
        enlaceLogin.hidden = sesionActiva;
        enlaceLogin.style.display = sesionActiva ? "none" : "";
    }

    if (enlaceCerrarSesion) {
        enlaceCerrarSesion.hidden = !sesionActiva;
        enlaceCerrarSesion.style.display = sesionActiva ? "" : "none";

        if (!enlaceCerrarSesion.dataset.eventoRegistrado) {
            enlaceCerrarSesion.addEventListener("click", event => {
                event.preventDefault();

                if (confirm("¿Estas seguro de que deseas cerrar sesion?")) {
                    cerrarSesion();
                }
            });

            enlaceCerrarSesion.dataset.eventoRegistrado = "true";
        }
    }
}


/* ============================================================
   3. UTILIDADES
============================================================ */

function resolverRuta(ruta) {
    const dentroDePages = window.location.pathname.includes("/pages/");
    return dentroDePages ? `../${ruta}` : ruta;
}

function normalizarRol(rol) {
    return String(rol || "").toLowerCase().trim();
}

function normalizarIdUsuario(idUsuario) {
    return String(idUsuario ?? "").replace(/^u/i, "");
}

function obtenerValor(formulario, nombre, idAlternativo) {
    const campo = formulario.elements.namedItem(nombre);

    if (campo) return campo.value.trim();

    const alternativo = document.getElementById(idAlternativo);

    return alternativo ? alternativo.value.trim() : "";
}

function buscarCampo(formulario, identificadores) {
    for (const identificador of identificadores) {
        const campoPorNombre = formulario.elements.namedItem(identificador);

        if (campoPorNombre) {
            return campoPorNombre;
        }

        const campoPorId = document.getElementById(identificador);

        if (campoPorId) {
            return campoPorId;
        }
    }

    return null;
}

function obtenerCampoFlexible(formulario, identificadores) {
    const campo = buscarCampo(formulario, identificadores);

    return campo ? campo.value.trim() : "";
}

function asignarCampo(formulario, identificadores, valor) {
    const campo = buscarCampo(formulario, identificadores);

    if (campo) {
        campo.value = valor ?? "";
    }
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => {
        const caracteres = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return caracteres[caracter];
    });
}

async function leerRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje || "Ocurrio un error al comunicarse con el servidor."
        );
    }

    return datos;
}

async function solicitarAPI(ruta, opciones = {}) {
    const token = obtenerToken();

    const encabezados = {
        "Content-Type": "application/json",
        ...opciones.headers
    };

    if (token) {
        encabezados.Authorization = `Bearer ${token}`;
    }

    const respuesta = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers: encabezados
    });

    return await leerRespuesta(respuesta);
}

/* ============================================================
   4. INICIO DE SESION
============================================================ */

async function iniciarSesion(identificador, password) {
    const datos = await solicitarAPI("/usuarios/login", {
        method: "POST",
        body: JSON.stringify({
            identificador,
            password
        })
    });

    guardarSesion(datos.token, datos.usuario);

    return datos.usuario;
}

/* ============================================================
   5. REGISTRO DE USUARIOS
============================================================ */

async function registrarUsuario(datosUsuario) {
    return await solicitarAPI("/usuarios/registro", {
        method: "POST",
        body: JSON.stringify(datosUsuario)
    });
}

/* ============================================================
   6. PERFIL DE USUARIO
============================================================ */

async function obtenerPerfil() {
    return await solicitarAPI("/usuarios/perfil");
}

async function actualizarPerfil(datosPerfil) {
    return await solicitarAPI("/usuarios/perfil", {
        method: "PUT",
        body: JSON.stringify(datosPerfil)
    });
}

async function cambiarPassword(datosPassword) {
    return await solicitarAPI("/usuarios/cambiar-password", {
        method: "PATCH",
        body: JSON.stringify(datosPassword)
    });
}

function mostrarDatosPerfil(usuario) {
    if (!usuario) return;

    const nombreCompleto = [
        usuario.nombre,
        usuario.apellido
    ].filter(Boolean).join(" ");

    const elementoNombre = document.getElementById("perfil-nombre");
    const elementoUsuario = document.getElementById("perfil-usuario");
    const elementoEmail = document.getElementById("perfil-email");
    const elementoAvatar = document.getElementById("avatar");

    if (elementoNombre) {
        elementoNombre.textContent = nombreCompleto || usuario.nombre || "";
    }

    if (elementoUsuario) {
        elementoUsuario.textContent = usuario.usuario
            ? `@${usuario.usuario}`
            : "";
    }

    if (elementoEmail) {
        elementoEmail.textContent = usuario.email || "";
    }

    if (elementoAvatar) {
        const iniciales = `${usuario.nombre?.charAt(0) || ""}${usuario.apellido?.charAt(0) || ""}`;

        elementoAvatar.textContent = iniciales.toUpperCase() || "GS";
    }
}

async function cargarPerfil() {
    const formularioDatos = document.getElementById("formDatos");

    const perfilExiste =
        formularioDatos ||
        document.getElementById("perfil-nombre") ||
        document.getElementById("perfil-usuario") ||
        document.getElementById("perfil-email");

    if (!perfilExiste) return;

    if (!obtenerToken()) {
        alert("Inicia sesion para consultar tu perfil.");
        window.location.href = resolverRuta("iniciosesion.html");
        return;
    }

    try {
        const respuesta = await obtenerPerfil();
        const usuario = respuesta.usuario;

        if (!usuario) {
            throw new Error("No se recibieron los datos del perfil.");
        }

        guardarUsuarioActual(usuario);

        localStorage.setItem("idUsuario", usuario.id);
        localStorage.setItem("nombreUsuario", usuario.usuario);

        mostrarDatosPerfil(usuario);
        actualizarMenuSesion();

        if (formularioDatos) {
            asignarCampo(formularioDatos, [
                "nombre",
                "cfg-nombre"
            ], usuario.nombre);

            asignarCampo(formularioDatos, [
                "apellido",
                "cfg-apellido"
            ], usuario.apellido);
        }

    } catch (error) {
        console.error("Error al cargar perfil:", error);

        alert(error.message);

        if (
            error.message.toLowerCase().includes("token") ||
            error.message.toLowerCase().includes("autenticacion")
        ) {
            cerrarSesion();
        }
    }
}

/* ============================================================
   7. ACTUALIZAR NOMBRE Y APELLIDO
============================================================ */

function configurarFormularioPerfil() {
    const formulario = document.getElementById("formDatos");

    if (!formulario) return;

    formulario.addEventListener("submit", async event => {
        event.preventDefault();

        const nombre = obtenerCampoFlexible(formulario, [
            "nombre",
            "cfg-nombre"
        ]);

        const apellido = obtenerCampoFlexible(formulario, [
            "apellido",
            "cfg-apellido"
        ]);

        if (!nombre || !apellido) {
            alert("Completa tu nombre y apellido.");
            return;
        }

        const usuarioActual = obtenerUsuarioActual();

        if (
            !usuarioActual ||
            !usuarioActual.usuario ||
            !usuarioActual.email
        ) {
            alert("No se pudieron recuperar los datos de tu cuenta. Recarga la pagina e intenta nuevamente.");
            return;
        }

        const boton = formulario.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const textoOriginal = boton
            ? boton.textContent
            : "";

        try {
            if (boton) {
                boton.disabled = true;
                boton.textContent = "Guardando...";
            }

            const respuesta = await actualizarPerfil({
                nombre,
                apellido,
                usuario: usuarioActual.usuario,
                email: usuarioActual.email
            });

            const usuarioActualizado = respuesta.usuario;

            guardarUsuarioActual(usuarioActualizado);

            localStorage.setItem("idUsuario", usuarioActualizado.id);
            localStorage.setItem(
                "nombreUsuario",
                usuarioActualizado.usuario
            );

            mostrarDatosPerfil(usuarioActualizado);
            actualizarMenuSesion();

            alert(
                respuesta.mensaje ||
                "Nombre y apellido actualizados correctamente."
            );

        } catch (error) {
            console.error("Error al actualizar perfil:", error);
            alert(error.message);

        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = textoOriginal || "Guardar cambios";
            }
        }
    });
}

/* ============================================================
   8. CAMBIAR CONTRASENA
============================================================ */

function configurarFormularioPassword() {
    const formulario = document.getElementById("formPass");

    if (!formulario) return;

    formulario.addEventListener("submit", async event => {
        event.preventDefault();

        const passwordActual = obtenerCampoFlexible(formulario, [
            "passwordActual",
            "password_actual",
            "cfg-pass-actual"
        ]);

        const passwordNueva = obtenerCampoFlexible(formulario, [
            "passwordNueva",
            "password_nueva",
            "cfg-pass-nueva"
        ]);

        const confirmarPassword = obtenerCampoFlexible(formulario, [
            "confirmarPassword",
            "confirm_password",
            "password_repetir",
            "cfg-pass-repetir"
        ]);

        if (!passwordActual || !passwordNueva || !confirmarPassword) {
            alert("Completa todos los campos de contrasena.");
            return;
        }

        if (passwordNueva !== confirmarPassword) {
            alert("La nueva contrasena y su confirmacion no coinciden.");
            return;
        }

        const boton = formulario.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const textoOriginal = boton
            ? boton.textContent
            : "";

        try {
            if (boton) {
                boton.disabled = true;
                boton.textContent = "Actualizando...";
            }

            const respuesta = await cambiarPassword({
                passwordActual,
                passwordNueva,
                confirmarPassword
            });

            formulario.reset();

            alert(
                respuesta.mensaje ||
                "Contrasena actualizada correctamente."
            );

            cerrarSesion();

        } catch (error) {
            console.error("Error al cambiar contrasena:", error);
            alert(error.message);

        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = textoOriginal || "Cambiar contrasena";
            }
        }
    });
}

/* ============================================================
   9. RESERVAS
============================================================ */

async function crearReserva(datosReserva) {
    return await solicitarAPI("/reservas", {
        method: "POST",
        body: JSON.stringify(datosReserva)
    });
}

async function obtenerMisReservas() {
    return await solicitarAPI("/reservas");
}

async function cancelarReserva(idReserva) {
    return await solicitarAPI(
        `/reservas/${encodeURIComponent(idReserva)}/cancelar`,
        {
            method: "PATCH"
        }
    );
}

/* ============================================================
   10. MOSTRAR MIS RESERVAS
============================================================ */

function calcularHoraFinal(horario) {
    if (!horario) return "-";

    const partes = horario.split(":");

    if (partes.length !== 2) return "-";

    let horas = Number(partes[0]);
    const minutos = Number(partes[1]);

    horas += 1;

    if (horas >= 24) {
        horas -= 24;
    }

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function obtenerNombreSala(sala) {
    const nombres = {
        standard: "Sala Standard",
        premium: "Sala Premium",
        bateria: "Sala Bateria"
    };

    return nombres[sala] || sala || "-";
}

function tablaTurnos(reservas) {
    let tabla = document.querySelector("#listaDeTurnos");

    if (!tabla) return;

    if (tabla.tagName === "TABLE") {
        tabla = tabla.querySelector("tbody") || tabla.createTBody();
    }

    tabla.innerHTML = "";

    if (!Array.isArray(reservas) || reservas.length === 0) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td colspan="5">No tenes reservas registradas.</td>
        `;

        tabla.appendChild(fila);
        return;
    }

    reservas.forEach(reserva => {
        const fila = document.createElement("tr");

        const fecha = escaparHTML(reserva.fecha);
        const horario = escaparHTML(reserva.horario);
        const sala = escaparHTML(obtenerNombreSala(reserva.sala));
        const estado = escaparHTML(reserva.estado);
        const id = escaparHTML(reserva.id);

        const estaActiva = reserva.estado === "activa";

        fila.innerHTML = `
            <td>${sala}</td>
            <td>${fecha}</td>
            <td>${horario} - ${escaparHTML(calcularHoraFinal(reserva.horario))}</td>
            <td>${estado}</td>
            <td>
                ${
                    estaActiva
                        ? `<button type="button"
                            class="btn btn-secundario"
                            data-cancelar-reserva="${id}">
                            Cancelar
                           </button>`
                        : "No disponible"
                }
            </td>
        `;

        tabla.appendChild(fila);
    });
}

async function cargarMisReservas() {
    const tabla = document.querySelector("#listaDeTurnos");

    if (!tabla) return;

    if (!obtenerToken()) {
        alert("Inicia sesion para consultar tus reservas.");
        window.location.href = resolverRuta("iniciosesion.html");
        return;
    }

    try {
        const datos = await obtenerMisReservas();

        const reservas = Array.isArray(datos)
            ? datos
            : datos.reservas || [];

        tablaTurnos(reservas);

    } catch (error) {
        console.error("Error al cargar reservas:", error);
        alert(error.message);
    }
}

/* ============================================================
   11. EVENTOS PRINCIPALES
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    // Actualizar el menu en todas las paginas.
    actualizarMenuSesion();

    /* --------------------------------------------------------
       MODO OSCURO
    -------------------------------------------------------- */

    const toggleDark = document.getElementById("toggle-dark");
    const body = document.body;

    if (localStorage.getItem("dark-mode") === "enabled") {
        body.classList.add("dark-mode");
    }

    if (toggleDark) {
        toggleDark.addEventListener("click", () => {
            body.classList.toggle("dark-mode");

            const activado = body.classList.contains("dark-mode");

            localStorage.setItem(
                "dark-mode",
                activado ? "enabled" : "disabled"
            );
        });
    }

    /* --------------------------------------------------------
       INICIO DE SESION
    -------------------------------------------------------- */

    const formLogin = document.querySelector("#form-login");

    if (formLogin) {
        formLogin.addEventListener("submit", async event => {
            event.preventDefault();

            const identificador = obtenerValor(
                formLogin,
                "username",
                "username"
            );

            const password = obtenerValor(
                formLogin,
                "password",
                "password"
            );

            if (!identificador || !password) {
                alert("Completa todos los campos.");
                return;
            }

            const boton = formLogin.querySelector('[type="submit"]');

            try {
                if (boton) boton.disabled = true;

                const usuario = await iniciarSesion(
                    identificador,
                    password
                );

                actualizarMenuSesion();

                alert(`Bienvenido ${usuario.nombre}.`);

                const rol = normalizarRol(usuario.rol);

                if (rol === "admin") {
                    window.location.href = resolverRuta("admin/admin.html");
                } else {
                    window.location.href = resolverRuta("index.html");
                }

            } catch (error) {
                console.error("Error de inicio de sesion:", error);
                alert(error.message);

            } finally {
                if (boton) boton.disabled = false;
            }
        });
    }

    /* --------------------------------------------------------
       REGISTRO
    -------------------------------------------------------- */

    const formRegistro = document.querySelector("#form-registro");

    if (formRegistro) {
        formRegistro.addEventListener("submit", async event => {
            event.preventDefault();

            const nombre = obtenerValor(formRegistro, "nombre", "nombre");
            const apellido = obtenerValor(formRegistro, "apellido", "apellido");
            const usuario = obtenerValor(formRegistro, "usuario", "username");
            const email = obtenerValor(formRegistro, "email", "email");
            const password = obtenerValor(formRegistro, "password", "password");
            const confirmPassword = obtenerValor(
                formRegistro,
                "confirm_password",
                "confirm_password"
            );

            const terminos = document.querySelector("#terminos");

            if (
                !nombre ||
                !apellido ||
                !usuario ||
                !email ||
                !password ||
                !confirmPassword
            ) {
                alert("Completa todos los campos.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Las contrasenas no coinciden.");
                return;
            }

            if (terminos && !terminos.checked) {
                alert("Debes aceptar los terminos y condiciones.");
                return;
            }

            const boton = formRegistro.querySelector('[type="submit"]');

            try {
                if (boton) boton.disabled = true;

                await registrarUsuario({
                    nombre,
                    apellido,
                    usuario,
                    email,
                    password
                });

                alert("Tu cuenta fue creada correctamente.");

                window.location.href = "iniciosesion.html";

            } catch (error) {
                console.error("Error en el registro:", error);
                alert(error.message);

            } finally {
                if (boton) boton.disabled = false;
            }
        });
    }

    /* --------------------------------------------------------
       MI CUENTA - CARGAR PERFIL
    -------------------------------------------------------- */

    cargarPerfil();

    /* --------------------------------------------------------
       MI CUENTA - ACTUALIZAR DATOS
    -------------------------------------------------------- */

    configurarFormularioPerfil();

    /* --------------------------------------------------------
       MI CUENTA - CAMBIAR CONTRASENA
    -------------------------------------------------------- */

    configurarFormularioPassword();

    /* --------------------------------------------------------
       CREAR RESERVA
    -------------------------------------------------------- */

    const formReservar = document.querySelector("#formReservar");

    if (formReservar) {
        formReservar.addEventListener("submit", async event => {
            event.preventDefault();

            if (!obtenerToken()) {
                alert("Debes iniciar sesion para reservar.");

                window.location.href = resolverRuta("iniciosesion.html");

                return;
            }

            const sala = document.querySelector("#sala")?.value;
            const fecha = document.querySelector("#fecha")?.value;
            const horario = document.querySelector("#horario")?.value;

            if (!sala || !fecha || !horario) {
                alert("Completa todos los datos de la reserva.");
                return;
            }

            try {
                await crearReserva({
                    sala,
                    fecha,
                    horario
                });

                alert("Tu reserva fue creada correctamente.");

                window.location.href = "mis_reservas.html";

            } catch (error) {
                console.error("Error al crear reserva:", error);
                alert(error.message);
            }
        });
    }

    /* --------------------------------------------------------
       CANCELAR RESERVA
    -------------------------------------------------------- */

    const tablaReservas = document.querySelector("#listaDeTurnos");

    if (tablaReservas) {
        tablaReservas.addEventListener("click", async event => {
            const boton = event.target.closest("[data-cancelar-reserva]");

            if (!boton) return;

            const idReserva = boton.dataset.cancelarReserva;

            const confirmar = confirm(
                "Estas seguro de que queres cancelar esta reserva?"
            );

            if (!confirmar) return;

            try {
                await cancelarReserva(idReserva);

                alert("La reserva fue cancelada correctamente.");

                await cargarMisReservas();

            } catch (error) {
                console.error("Error al cancelar reserva:", error);
                alert(error.message);
            }
        });

        cargarMisReservas();
    }

});
