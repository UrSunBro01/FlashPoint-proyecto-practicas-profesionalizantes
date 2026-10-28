//soy un comentario
//recuerda:backsticks(`).es ALT+96

// ============================================================
    // LOCAL STORAGE ZONE
// ============================================================

const STORAGE_KEY = "grooveSpaceData";
const SESSION_KEY = "grooveSpaceUsuario";

function guardarDatosGlobales(datos) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));//Para guardar objetos o arrays utilizamos JSON.stringify()//
}

function guardarUsuarioActual(usuario) {
	localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
}

async function obtenerDatosGlobales() {
	const ruta = resolverRuta("data/datos.json");
	const respuesta = await fetch(ruta);

	if (!respuesta.ok) {
		throw new Error("No se pudo cargar los datos");
	}

	const datosIniciales = await respuesta.json();

	const datosGuardados = localStorage.getItem(STORAGE_KEY);

	if (!datosGuardados) {
		guardarDatosGlobales(datosIniciales);
		return datosIniciales;
	}

	const datosGuardadosParseados = JSON.parse(datosGuardados);//y para recuperar objetos o arrays: JSON.parse//

	return {
		...datosIniciales,
		...datosGuardadosParseados
	};
}

function obtenerUsuarioActual() {
	const usuario = localStorage.getItem(SESSION_KEY);
	return usuario ? JSON.parse(usuario) : null;
}

function cerrarSesion() {
	//esta funciona se llama directamente desde HTML.
	localStorage.removeItem(SESSION_KEY);
	window.location.href = "index.html";
}

// ============================================================
    //utilidad aca quedo medio fusion con lo del prof
// ============================================================
function resolverRuta(path) {
    const dentroDePages = window.location.pathname.includes("/pages/");
    return dentroDePages ? `../${path}` : path;
}
function normalizarRol(rol) {
	return rol === "" ? "" : rol;//no sabria calcularlo en el ternario
}

function normalizarIdUsuario(idUsuario) {
    return String(idUsuario ?? "").replace(/^u/i, "");
}

// ============================================================
    //buscar el usuario
// ============================================================
async function buscarUser(nombreIngresado, passwordIngresada) {
    const response = await fetch(resolverRuta("data/datos.json"));

    if (!response.ok) {
        throw new Error("No se pudo cargar usuarios");
    }

    const data = await response.json();
    console.table(data.usuarios);

    return data.usuarios.find((usuario) =>
        usuario.usuario === nombreIngresado &&
        usuario.contraseña === passwordIngresada
    );
}

function tablaTurnos(tTurnos, idUsuario) {
    const tabla = document.querySelector("#listaDeTurnos");
    if (!tabla) return;

    tabla.innerHTML = "";

    const idUsuarioNormalizado = normalizarIdUsuario(idUsuario);
    const misTurnos = (tTurnos || []).filter((turno) => {
        return normalizarIdUsuario(turno.usuarioID) === idUsuarioNormalizado;
    });

    misTurnos.forEach((turno) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${turno.fecha}</td>
            <td>${turno.horaI}</td>
            <td>${turno.horaF || turno.hora}</td>
            <td>${turno.salaID}</td>
            <td>${turno.aDDs ? "si" : "no"}</td>
            <td><a href="rodri.html" class="btn btn-principal">ticket</a></td>
            <td><button class="btn btn-secundario">cancelar reserva</button></td>
            <td><button class="btn btn-secundario">reprogramar</button></td>
        `;
        tabla.appendChild(fila);
    });
}

document.addEventListener("DOMContentLoaded", () => {
// ============================================================

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

    // iniciar sesion
// ============================================================
    const formLogin = document.querySelector("#form-login");
    if (formLogin) {
        formLogin.addEventListener("submit", async (event) => {
            event.preventDefault();

            const nombreIngresado = document.querySelector("#username").value.trim();
            const passIngresada = document.querySelector("#password").value.trim();

            try {
                const usuarioEncontrado = await buscarUser(nombreIngresado, passIngresada);

                if (usuarioEncontrado) {
                    localStorage.setItem("idUsuario", usuarioEncontrado.id);
                    localStorage.setItem("nombreUsuario", usuarioEncontrado.usuario);
                    alert(`bienvenido señor ${usuarioEncontrado.nombre}`);
                    window.location.href = "index.html";
                    return;
                }

                alert("usuario o contraseña incorrectos");
            } catch (error) {
                console.error(error);
                alert("No se pudo iniciar sesión");
            }
        });
    }

    //function renderizarPageLogin() {//esto lo agregue del git del profe
	//const formulario = document.querySelector("#form-login");
	//if (formulario) {
	//	formulario.addEventListener("submit", interceptarIniciarSesion);
	//}
//}
// ============================================================
    // GUARDAR RESERVA,sin base de datos
// ============================================================
    const formReservar = document.querySelector("#formReservar");
    if(formReservar){// este if hace que lo siguiente solo se ejecute si estamos en la ventana correcta
        formReservar.addEventListener("submit", (event) => {
            event.preventDefault();

            const sala = document.querySelector("#sala").value;
            const fecha = document.querySelector("#fecha").value;
            const horario = document.querySelector("#horario").value;

            alert(`reserva creada para el ${fecha} a las ${horario} en la sala ${sala}`);
            window.location.href = "turnos.html";
        });
    }

    const idUsuarioActivo = localStorage.getItem("idUsuario");
    if (idUsuarioActivo) {
        fetch(resolverRuta("data/datos.json"))
            .then((response) => response.json())
            .then((datos) => tablaTurnos(datos.turnos, idUsuarioActivo))
            .catch((error) => console.error("No se pudieron cargar los turnos", error));
    }
});