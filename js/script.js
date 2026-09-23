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
	window.location.href = resolverRuta("index.html");
}

// ============================================================
    //utilidad aca quedo medio fusion con lo del prof
// ============================================================
function resolverRuta(path){
    const dentrodepages=window.location.pathname.includes("/pages/");
    return dentrodepages? `../${path}`: path;//ya lo vi en el libro el(a?b:c) es un selector trinario.
}
function normalizarRol(rol) {
	return rol === "" ? "" : rol;//no sabria calcularlo en el ternario
}




// ============================================================
    //buscar el usuario
// ============================================================
async function buscarUser(nombreIngresado, passwordIngresada){
    const response = await fetch(resolverRuta("/data/datos.json"));
    const data = await response.json();
    console.table(data.usuarios);
    return data.usuarios.find(u=>
        u.usuario === nombreIngresado &&
        u.contraseña === passwordIngresada
    );
}


document.addEventListener("DOMContentLoaded", () => {
// ============================================================
    // iniciar sesion
// ============================================================
    const formLogin = document.querySelector("#form-login");
    if(formLogin){
        formLogin.addEventListener("submit",async(event)=>{
            event.preventDefault();

            const nombreIngresado = document.querySelector("#username").value.trim();
            const passIngresada = document.querySelector("#password").value.trim();
            const usuarioencontrado =await buscarUser(nombreIngresado,passIngresada);

            if(usuarioencontrado){
                localStorage.setItem("idUsuario",usuarioencontrado.id);//el error estaba aca,puse un . en vez de la coma para idUsuario
                localStorage.setItem("nombreUsuario",usuarioencontrado.usuario);
                alert(`bienvenido señor ${usuarioencontrado.nombre}`);
                window.location.href="index.html";
            }else{
                alert("usuario o contraseña incorrectos");
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
            
            alert( `reserva creada para el ${fecha} a las ${horario} en la sala ${sala}`);
            window.location.href = "turnos.html";
        });
    }

const idUsuarioActivo = localStorage.getItem("idUsuario");
    if (idUsuarioActivo) {
        fetch(resolverRuta("data/datos.json"))
            .then(response => response.json())
            .then(datos => tablaTurnos(datos.turnos, idUsuarioActivo));
    }
// ============================================================
    //la tabla de los turnos render,todavia no arranca y ni llame a local storage
// ============================================================
function tablaTurnos(tTurnos,idUsuario){
    const tabla = document.querySelector("#listaDeTurnos");
    if(!tabla) return;
    const misTurnos=tTurnos.filter(t=>t.usuarioID===idUsuario);
    //const misTurnos = JSON.parse(localStorage.getItem("turnos")) || [];
    misTurnos.foreach(turno=>{
        const fila = document.createElement("tr");
        fila.innerHTML =`
        <td>${turno.fecha}</td>
        <td>${turno.horaI}</td>
        <td>${turno.hora}</td>
        <td>${turno.sala}</td>
        <td>${turno.aDDs? "si":"no"}</td>
        <td><a href="rodri.html" class="btn btn-principal">ticket</a></td>
        <td><button class="btn btn-secundario">cancelar reserva</button></td>
        <td><button class="btn btn-secundario">reprogramar</button></td>
        `;//la segunda td hora hay que sumar +2horas a la hora base
        tabla.appendChild(fila);
    });

    const idUsuarioActivo = localStorage.getItem("idUsuario");
    if (idUsuarioActivo) {
        fetch(resolverRuta("data/datos.json"))
            .then(response => response.json())
            .then(datos => tablaTurnos(datos.turnos, idUsuarioActivo));
    }
    
}





})