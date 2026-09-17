document.addEventListener("DOMContentLoaded", () => {

    // LOGIN
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", async (e) => {
            e.preventDefault();

            const usuarioIngresado = document.getElementById("username").value.trim();
            const passIngresada = document.getElementById("password").value;

            let usuarios = [];
            try {
                const respuesta = await fetch("../js/usuarios.json");
                usuarios = await respuesta.json();
            } catch (error) {
                console.error("No se pudo cargar usuarios.json", error);
            }

            const registrados = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];
            const todosLosUsuarios = usuarios.concat(registrados);

            const encontrado = todosLosUsuarios.find(
                (u) => u.usuario === usuarioIngresado && u.contraseña === passIngresada
            );

            if (encontrado) {
                localStorage.setItem("usuario", encontrado.usuario);
                localStorage.setItem("nombre", encontrado.nombre || encontrado.usuario);
                localStorage.setItem("rol", encontrado.rol || "usuario");
                window.location.href = "index.html";
            } else {
                alert("Usuario o contraseña incorrectos");
            }
        });
    }

    // REGISTRO
    const formRegistro = document.getElementById("form-registro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();

            const nuevoUsuario = {
                usuario: document.getElementById("username").value.trim(),
                contraseña: document.getElementById("password").value,
                nombre: document.getElementById("username").value.trim(),
                rol: "usuario"
            };

            const registrados = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];
            registrados.push(nuevoUsuario);
            localStorage.setItem("usuariosRegistrados", JSON.stringify(registrados));

            alert("Registrado correctamente");
            window.location.href = "registrado.html";
        });
    }

    // SESION ACTIVA EN EL NAV
    const usuario = localStorage.getItem("usuario");
    const nombre = localStorage.getItem("nombre");

    if (usuario) {
        const loginLink = document.getElementById("nav-login");
        if (loginLink) {
            const span = document.createElement("span");
            span.textContent = `${nombre} (${usuario})`;
            span.classList.add("nav-usuario-activo");
            loginLink.replaceWith(span);

            const logoutLink = document.createElement("a");
            logoutLink.href = "#";
            logoutLink.textContent = "Cerrar sesión";
            logoutLink.classList.add("btn", "btn-secundario", "btn-chico");
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("usuario");
                localStorage.removeItem("nombre");
                localStorage.removeItem("rol");
                window.location.href = "iniciosesion.html";
            });

            const li = document.createElement("li");
            li.appendChild(logoutLink);
            span.parentElement.after(li);
        }
    }

    // LISTADO DE RESERVAS
    const reservasTable = document.getElementById("lista-reservas");
    const bienvenidaReservas = document.getElementById("bienvenida");

    if (reservasTable && usuario) {
        if (bienvenidaReservas) {
            bienvenidaReservas.textContent = `Bienvenido, ${nombre} (${usuario}). Aquí están tus reservas:`;
        }

        const reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];
        reservasGuardadas.forEach((r) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${r.sala}</td>
                <td>${r.fecha}</td>
                <td>${r.horario}</td>
                <td>${r.estado}</td>
            `;
            reservasTable.appendChild(fila);
        });
    }

    // GUARDAR RESERVA
    const formReservar = document.getElementById("formReservar");
    if (formReservar) {
        formReservar.addEventListener("submit", (e) => {
            e.preventDefault();

            const sala = document.getElementById("sala").value;
            const fecha = document.getElementById("fecha").value;
            const horario = document.getElementById("horario").value;

            const reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];
            reservasGuardadas.push({ sala, fecha, horario, estado: "Pendiente" });
            localStorage.setItem("reservas", JSON.stringify(reservasGuardadas));

            alert("Reserva creada con éxito");
            window.location.href = "turnos.html";
        });
    }

});