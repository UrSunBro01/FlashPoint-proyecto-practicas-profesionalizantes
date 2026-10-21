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

    
    // NUEVO: datos datos basura, hasta que no tengmaos backend se mantienen asi.
    const SALAS = [
        { nombre: "Sala 1", icono: "🎸", detalle: "Solistas y dúos", precio: "$4.500",
          equipo: ["Micrófono", "Amplificador de guitarra", "Hasta 3 personas"] },
        { nombre: "Sala 2", icono: "🥁", detalle: "Banda completa con batería", precio: "$7.000",
          equipo: ["Batería", "Amplis de guitarra y bajo", "Hasta 6 personas"] },
        { nombre: "Sala 3", icono: "🎤", detalle: "Sala grande para grabar", precio: "$9.500",
          equipo: ["Equipo de grabación", "Batería y amplis", "Hasta 8 personas"] }
    ];

    // ayuditas para dar la reserva
    const aFecha = r => new Date(`${r.fecha}T${r.hora}`);
    const esFutura = r => aFecha(r) >= new Date();
    const porFechaHora = (a, b) => aFecha(a) - aFecha(b);
    const formatoDia = f => new Date(`${f}T00:00`).toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
    const sumarHora = h => {
        const [hh, mm] = h.split(":").map(Number);
        return `${String((hh + 1) % 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    };

    // esto es la fila de reserva, tendria que aparecer aqui y en historial.
    const crearFila = r => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${r.sala}</td>
            <td>${r.fecha}</td>
            <td>${r.hora}</td>
            <td><span class="estado estado-${r.estado.toLowerCase()}">${r.estado}</span></td>
        `;
        return fila;
    };

    // banner de aviso igual al de pc.
    const mostrarBanner = texto => {
        const banner = document.createElement("div");
        banner.textContent = texto;
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
        setTimeout(() => banner.remove(), 2200);
    };

    // cerrar sesion intentando no borrar reservas ni modo oscuro
    // (antes se hacia localStorage.clear() y se perdia todo; ahora las reservas viven atadas al usuario)
    const cerrarSesion = () => {
        ["usuario", "nombre", "apellido", "email"].forEach(k => localStorage.removeItem(k));
        window.location.href = window.location.pathname.includes("/pages/") ? "login.html" : "pages/login.html";
    };

    // boton para mostrar contra, aun no funciona correctamente
    document.querySelectorAll(".ojo").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            const estabaOculta = input.type === "password";
            input.type = estabaOculta ? "text" : "password";
            btn.textContent = estabaOculta ? "Ocultar" : "Mostrar";
        });
    });

    // USUARIO LOGUEADO (muestra nombre + botón cerrar sesión)
    
    const usuario = localStorage.getItem("usuario");
    const nombre = localStorage.getItem("nombre");

    if (usuario) {
        // link login arriba solo pc
        const navLinks = document.querySelectorAll("nav ul li a");

        navLinks.forEach(link => {
            if (link.textContent.trim() === "Login") {
                // intnetamos reemplazar link por user
                const span = document.createElement("span");
                span.textContent = `${nombre} (${usuario})`;
                span.style.fontWeight = "bold";
                span.style.color = "#6a0dad";
                span.style.padding = "8px 12px";
                link.replaceWith(span);

                // boton de cerrar sesion
                const logoutBtn = document.createElement("button");
                logoutBtn.textContent = "Cerrar sesión";
                logoutBtn.classList.add("btn-morado");
                logoutBtn.style.marginLeft = "10px";
                logoutBtn.style.padding = "6px 14px";
                logoutBtn.style.fontSize = "0.85em";

                logoutBtn.addEventListener("click", cerrarSesion);

                // boton depsues de nombre
                span.after(logoutBtn);
            }
        });

        // icono de usuario abajo actualizaro, no se. aun sigue sin convencerme
        const navLogin = document.getElementById("nav-login");
        // con esto vas directamente a perfil enves de login si andas logeado
        const urlCuenta = (window.location.pathname.includes("/pages/") ? "" : "pages/") + "cuenta.html";
        if (navLogin) {
            navLogin.title = `${nombre} (${usuario})`;
            navLogin.href = urlCuenta;
        }
        const accesoCuenta = document.getElementById("acceso-cuenta");
        if (accesoCuenta) {
            accesoCuenta.href = urlCuenta;
        }
    }

    
    // esto es solo cel, pensamos en como tiene ml/mp el saludo con la manito. 
    const saludo = document.getElementById("m-saludo");
    if (saludo && usuario) {
        saludo.textContent = `Hola wachin, ${nombre} 👋`;
    }

    // 3. PÁGINA: MIS RESERVAS
    
    const reservasTable = document.getElementById("lista-reservas");
    const bienvenidaReservas = document.getElementById("bienvenida");

    if (reservasTable) {
        if (usuario) {
            if (bienvenidaReservas) {
                bienvenidaReservas.textContent = `Bienvenido, ${nombre} (${usuario}). Aquí están tus reservas:`;
            }

            // solo las reservas de este usuario que todavia no pasaron, pasaremos las que ya cumplioeron a su historial de reservas
            const todasLasReservas = JSON.parse(localStorage.getItem("reservas")) || [];
            const reservasGuardadas = todasLasReservas
                .filter(r => r.usuario === usuario && esFutura(r))
                .sort(porFechaHora);

            if (reservasGuardadas.length === 0) {
                const fila = document.createElement("tr");
                fila.innerHTML = `<td colspan="4">No tenés reservas próximas</td>`;
                reservasTable.appendChild(fila);
            } else {
                reservasGuardadas.forEach(r => reservasTable.appendChild(crearFila(r)));
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
        // con esto se intenta que cuando seleccionas algo en el inicio, quede preparado para reservarla en reservas lol
        const salaURL = new URLSearchParams(window.location.search).get("sala");
        if (salaURL) {
            document.getElementById("sala").value = salaURL;
        }

        // salas como tarjetas. Solo corre si existe #m-salas (esta en el html de reservar)
        // Usa el arreglo salas de arriba (el mismo que la pagina salas)
        const contSalas = document.getElementById("m-salas");
        if (contSalas) {
            const selectSala = document.getElementById("sala");

            const dibujarSalas = () => {
                contSalas.innerHTML = "";
                SALAS.forEach((s, i) => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.classList.add("m-sala-op");
                    if (selectSala.value === s.nombre) btn.classList.add("activo");
                    btn.innerHTML = `
                        <span class="ico m-img-${i + 1}">${s.icono}</span>
                        <span class="txt"><b>${s.nombre}</b><small>${s.detalle}</small></span>
                        <span class="precio">${s.precio}<small>/h</small></span>`;
                    // Al tocar una sala la copiamos al select escondido y avisamos con "change"
                    btn.addEventListener("click", () => {
                        selectSala.value = s.nombre;
                        selectSala.dispatchEvent(new Event("change"));
                        dibujarSalas();
                    });
                    contSalas.appendChild(btn);
                });
            };
            dibujarSalas();
        }

        // horarios como botones. Solo corre si existe #m-slots (esta en el html de reservar)
        // Oobvioo que solo es visual pq no tenemos nada aun.
        const slots = document.getElementById("m-slots");
        if (slots) {
            const horas = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
                           "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
            const selSala = document.getElementById("sala");
            const inFecha = document.getElementById("fecha");
            const inHora = document.getElementById("hora");

            const dibujarSlots = () => {
                const reservadas = JSON.parse(localStorage.getItem("reservas")) || [];
                const ocupadas = reservadas
                    .filter(r => r.sala === selSala.value && r.fecha === inFecha.value)
                    .map(r => r.hora);

                slots.innerHTML = "";
                horas.forEach(h => {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.textContent = h;
                    btn.classList.add("m-slot");
                    btn.disabled = ocupadas.includes(h);
                    if (btn.disabled) btn.classList.add("ocupado");
                    if (inHora.value === h) btn.classList.add("activo");
                    // Al tocar un horario lo copiamos al input escondido #hora
                    btn.addEventListener("click", () => {
                        inHora.value = h;
                        dibujarSlots();
                    });
                    slots.appendChild(btn);
                });
            };

            // Si cambia la sala o la fecha, se limpia el horario y se recalculan los ocupados
            [selSala, inFecha].forEach(el => el.addEventListener("change", () => {
                inHora.value = "";
                dibujarSlots();
            }));
            dibujarSlots();
        }

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
                    estado: "Pendiente",
                    usuario   //  sin esto no se puede armar "mis reservas", el historial ni la agenda de salas, creeme.
                });
                localStorage.setItem("reservas", JSON.stringify(reservasGuardadas));

                // Banner de éxito open inglish
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

    // 5. PÁGINA: SALAS (info de cada sala + agenda anonima no se, la prox pongo nombres random.)
    const listaSalas = document.getElementById("lista-salas");

    if (listaSalas) {
        const todas = JSON.parse(localStorage.getItem("reservas")) || [];

        SALAS.forEach((s, i) => {
            // Agenda: reservas que vienen de esta sala, de TODOS los usuarios.
            // esto es pq en el pdf de antes tenaimos que seria privado aunque me parece irrelevante
            const agenda = todas
                .filter(r => r.sala === s.nombre && r.estado !== "Rechazada" && esFutura(r))
                .sort(porFechaHora)
                .slice(0, 5);

            const filas = agenda.map(r => {
                const esMia = usuario && r.usuario === usuario;
                return `<li>
                    <span>${formatoDia(r.fecha)} · ${r.hora} a ${sumarHora(r.hora)}</span>
                    <span class="estado ${esMia ? "estado-tuya" : "estado-ocupada"}">${esMia ? "Tuya" : "Ocupada"}</span>
                </li>`;
            }).join("");

            const seccion = document.createElement("section");
            seccion.classList.add("sala-detalle");
            seccion.innerHTML = `
                <div class="sd-cabecera m-img-${i + 1}">
                    <span class="sd-icono">${s.icono}</span>
                    <div><h3>${s.nombre}</h3><p>${s.detalle}</p></div>
                    <span class="precio">${s.precio}<small>/h</small></span>
                </div>
                <div class="sd-cuerpo">
                    <ul class="sd-equipo">${s.equipo.map(e => `<li>${e}</li>`).join("")}</ul>
                    <h4>Próximas reservas</h4>
                    ${agenda.length
                        ? `<ul class="sd-agenda">${filas}</ul>`
                        : `<p class="sd-libre">Sin reservas próximas: está libre.</p>`}
                    <p class="sd-privacidad">Por privacidad no mostramos quién reservó.</p>
                    <a href="reservar.html?sala=${encodeURIComponent(s.nombre)}" class="btn-morado sd-reservar">Reservar esta sala</a>
                </div>
            `;
            listaSalas.appendChild(seccion);
        });
    }

    // 6. PÁGINA: CUENTA (perfil, datos, historial y cerrar sesion)
    const perfilNombre = document.getElementById("perfil-nombre");

    if (perfilNombre) {
        if (!usuario) {
            // Sin sesion no hay perfil: mandamos al login
            window.location.href = "login.html";
        } else {
            const apellido = localStorage.getItem("apellido") || "";
            const email = localStorage.getItem("email") || "";

            const mias = (JSON.parse(localStorage.getItem("reservas")) || []).filter(r => r.usuario === usuario);
            const proximas = mias.filter(esFutura);
            const pasadas = mias.filter(r => !esFutura(r)).sort(porFechaHora).reverse();

            // Perfil (avatar con las iniciales, la proxima pongo un furro)
            const pintarPerfil = () => {
                const n = localStorage.getItem("nombre") || "";
                const a = localStorage.getItem("apellido") || "";
                document.getElementById("avatar").textContent = ((n || usuario)[0] + (a[0] || "")).toUpperCase();
                perfilNombre.textContent = `${n} ${a}`.trim() || usuario;
                document.getElementById("perfil-email").textContent = localStorage.getItem("email") || "";
            };
            pintarPerfil();
            document.getElementById("perfil-usuario").textContent = `@${usuario}`;
            document.getElementById("stat-proximas").textContent = proximas.length;
            document.getElementById("stat-pasadas").textContent = pasadas.length;

            // Datos personales: se guardan en localstorage (cuando tengamos backend esto ira al PUT me imagino.)
            document.getElementById("cfg-nombre").value = nombre || "";
            document.getElementById("cfg-apellido").value = apellido;
            document.getElementById("cfg-email").value = email;

            document.getElementById("formDatos").addEventListener("submit", (e) => {
                e.preventDefault();
                localStorage.setItem("nombre", document.getElementById("cfg-nombre").value);
                localStorage.setItem("apellido", document.getElementById("cfg-apellido").value);
                localStorage.setItem("email", document.getElementById("cfg-email").value);
                pintarPerfil();
                mostrarBanner("✅ Cambios guardados");
            });

            // esto es algo especifico, si tenes modo rendimiento o reducir movimientos el video no se activa, lo traje pq me pasaba con el emulador de pc que probe, algo que no pasaba con mi celu con scrcpy
            const videoNota = document.querySelector(".nota-video");
            if (videoNota && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                videoNota.pause();
            }

            // Contraseña: solo visual, hoy no se guarda ninguna contraseña (dale pibe cuando vamos al backend)
            document.getElementById("formPass").addEventListener("submit", (e) => {
                e.preventDefault();
                e.target.reset();
                mostrarBanner("⚠️ Disponible cuando esté el servidor");
            });

            // Modo oscuro desde las preferencias ( el boton de arriba esponja)
            const estadoOscuro = document.getElementById("cfg-oscuro-estado");
            const actualizarOscuro = () => {
                estadoOscuro.textContent = body.classList.contains("dark-mode") ? "Activado" : "Desactivado";
            };
            actualizarOscuro();
            document.getElementById("cfg-oscuro").addEventListener("click", () => toggleDark.click());
            toggleDark.addEventListener("click", actualizarOscuro);

            // Historial: reservas pasadas de este usuario
            const tbodyHistorial = document.getElementById("lista-historial");
            if (pasadas.length === 0) {
                const fila = document.createElement("tr");
                fila.innerHTML = `<td colspan="4">Todavía no tenés reservas pasadas</td>`;
                tbodyHistorial.appendChild(fila);
            } else {
                pasadas.forEach(r => tbodyHistorial.appendChild(crearFila(r)));
            }

            document.getElementById("cuenta-salir").addEventListener("click", cerrarSesion);
        }
    }

});
