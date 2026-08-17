document.addEventListener("DOMContentLoaded", () => {
    // 🌙 Botoncito facha para la luna
    const toggleDark = document.getElementById("toggle-dark");
    const body = document.body;

    // Al cargar la página, deberia mantener el modo
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

    // esto es para el login, si falla de nuevo es edge.
    const usuario = localStorage.getItem("usuario");
    const nombre = localStorage.getItem("nombre");

    if (usuario) {
        const navLinks = document.querySelectorAll("nav ul li a");
        navLinks.forEach(link => {
            if (link.textContent === "Login") {
                // crear user
                const span = document.createElement("span");
                span.textContent = `${nombre} (${usuario})`;
                span.style.fontWeight = "bold";
                span.style.color = "#6a0dad";
                link.replaceWith(span);

                // logout 
                const logoutLink = document.createElement("a");
                logoutLink.href = "#";
                logoutLink.textContent = "Cerrar sesión";
                logoutLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.clear();
                    window.location.href = "login.html";
                });

                // boton al lado del user
                const li = document.createElement("li");
                li.appendChild(logoutLink);
                span.parentElement.after(li);
            }
        });
    }

    // las reservas de mis_reservas.html
    const reservasTable = document.getElementById("lista-reservas");
    const bienvenidaReservas = document.getElementById("bienvenida");

    if (reservasTable && usuario) {
        bienvenidaReservas.textContent = `Bienvenido, ${nombre} (${usuario}). Aquí están tus reservas:`;

        const reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];

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

    // Aca guardamos reserva de reservar
    const formReservar = document.getElementById("formReservar");
    const bienvenidaReservar = document.getElementById("bienvenida");

    if (formReservar && usuario) {
        bienvenidaReservar.textContent = `Bienvenido, ${nombre} (${usuario}). Completa tu reserva:`;

        formReservar.addEventListener("submit", (e) => {
            e.preventDefault();

            const sala = document.getElementById("sala").value;
            const fecha = document.getElementById("fecha").value;
            const hora = document.getElementById("hora").value;

            let reservasGuardadas = JSON.parse(localStorage.getItem("reservas")) || [];
            reservasGuardadas.push({ sala, fecha, hora, estado: "Pendiente" });
            localStorage.setItem("reservas", JSON.stringify(reservasGuardadas));

            // Mini banner visual (no funciona si no estas logeado)
            const banner = document.createElement("div");
            banner.textContent = "✅ Reserva creada con éxito";
            banner.style.position = "fixed";
            banner.style.top = "20px";
            banner.style.left = "50%";
            banner.style.transform = "translateX(-50%)";
            banner.style.backgroundColor = "#6a0dad";
            banner.style.color = "white";
            banner.style.padding = "10px 20px";
            banner.style.borderRadius = "5px";
            banner.style.zIndex = "1000";
            document.body.appendChild(banner);

            // Ocultar banner después de 2 segundos y redirigir
            setTimeout(() => {
                banner.remove();
                window.location.href = "mis_reservas.html";
            }, 2000);
        });
    }
});
