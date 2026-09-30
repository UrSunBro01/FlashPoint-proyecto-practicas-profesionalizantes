document.addEventListener("DOMContentLoaded", () => {

    // 
    // 1. MODO OSCURO
    // 
    const toggleDark = document.getElementById("toggle-dark");
    const body = document.body;

    // Mantener el modo al recargar
    if (localStorage.getItem("dark-mode") === "enabled") {
        body.classList.add("dark-mode");
    }

    if (toggleDark) {
        toggleDark.addEventListener("click", () => {
            body.classList.toggle("dark-mode");

            if (body.classList.contains("dark-mode")) {
                localStorage.setItem("dark-mode", "enabled");
            } else {
                localStorage.setItem("dark-mode", "disabled");
            }
        });
    }

    
    // USUARIO LOGUEADO (muestra nombre + botón cerrar sesión)
    
    const usuario = localStorage.getItem("usuario");
    const nombre = localStorage.getItem("nombre");

    if (usuario) {
        // Buscamos el link de "Login" en el menú de arriba (desktop)
        const navLinks = document.querySelectorAll("nav ul li a");

        navLinks.forEach(link => {
            if (link.textContent.trim() === "Login") {
                // Reemplazamos el link por el nombre del usuario
                const span = document.createElement("span");
                span.textContent = `${nombre} (${usuario})`;
                span.style.fontWeight = "bold";
                span.style.color = "#6a0dad";
                span.style.padding = "8px 12px";
                link.replaceWith(span);

                // Creamos el boton de Cerrar sesion
                const logoutBtn = document.createElement("button");
                logoutBtn.textContent = "Cerrar sesión";
                logoutBtn.classList.add("btn-morado");
                logoutBtn.style.marginLeft = "10px";
                logoutBtn.style.padding = "6px 14px";
                logoutBtn.style.fontSize = "0.85em";

                logoutBtn.addEventListener("click", () => {
                    localStorage.clear();
                    // Redirigimos segun donde estemos
                    if (window.location.pathname.includes("/pages/")) {
                        window.location.href = "login.html";
                    } else {
                        window.location.href = "pages/login.html";
                    }
                });

                // Insertamos el boton después del nombre
                span.after(logoutBtn);
            }
        });

        // También actualizamos el icono de usuario en la barra de abajo (cel)
        const navLogin = document.getElementById("nav-login");
        if (navLogin) {
            navLogin.title = `${nombre} (${usuario})`;
            // cambiamos un poco el color para indicar que está logueado
            navLogin.style.color = "#6a0dad";
        }
    }

    
    // 3. PÁGINA: MIS RESERVAS
    
    const reservasTable = document.getElementById("lista-reservas");
    const bienvenidaReservas = document.getElementById("bienvenida");

    if (reservasTable) {
        if (usuario) {
            if (bienvenidaReservas) {
                bienvenidaReservas.textContent = `Bienvenido, ${nombre} (${usuario}). Aquí están tus reservas:`;
            }

            const reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];

            if (reservasGuardadas.length === 0) {
                const fila = document.createElement("tr");
                fila.innerHTML = `<td colspan="4">Todavía no tenés reservas</td>`;
                reservasTable.appendChild(fila);
            } else {
                reservasGuardadas.forEach(r => {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${r.sala}</td>
                        <td>${r.fecha}</td>
                        <td>${r.hora}</td>
                        <td>${r.estado}</td>
                    `;
                    reservasTable.appendChild(fila);
                });
            }
        } else {
            if (bienvenidaReservas) {
                bienvenidaReservas.textContent = "Tenés que iniciar sesión para ver tus reservas.";
            }
        }
    }

    
    // 4. PÁGINA: RESERVAR
    
    const formReservar = document.getElementById("formReservar");
    const bienvenidaReservar = document.getElementById("bienvenida");

    if (formReservar) {
        if (usuario) {
            if (bienvenidaReservar) {
                bienvenidaReservar.textContent = `Bienvenido, ${nombre} (${usuario}). Completá tu reserva:`;
            }

            formReservar.addEventListener("submit", (e) => {
                e.preventDefault();

                const sala = document.getElementById("sala").value;
                const fecha = document.getElementById("fecha").value;
                const hora = document.getElementById("hora").value;

                let reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];
                reservasGuardadas.push({
                    sala,
                    fecha,
                    hora,
                    estado: "Pendiente"
                });
                localStorage.setItem("reservas", JSON.stringify(reservasGuardadas));

                // Banner de éxito
                const banner = document.createElement("div");
                banner.textContent = "✅ Reserva creada con éxito";
                banner.style.position = "fixed";
                banner.style.top = "20px";
                banner.style.left = "50%";
                banner.style.transform = "translateX(-50%)";
                banner.style.backgroundColor = "#6a0dad";
                banner.style.color = "white";
                banner.style.padding = "12px 24px";
                banner.style.borderRadius = "30px";
                banner.style.zIndex = "2000";
                banner.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
                document.body.appendChild(banner);

                setTimeout(() => {
                    banner.remove();
                    window.location.href = "mis_reservas.html";
                }, 1800);
            });
        } else {
            if (bienvenidaReservar) {
                bienvenidaReservar.innerHTML = `Tenés que <a href="login.html" style="color:#6a0dad; font-weight:bold;">iniciar sesión</a> para poder reservar.`;
            }
            // Deshabilitamos el formulario si no está logueado
            formReservar.querySelectorAll("input, select, button").forEach(el => {
                el.disabled = true;
            });
        }
    }

});
