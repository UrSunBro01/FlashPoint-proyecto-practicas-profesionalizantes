document.addEventListener("DOMContentLoaded", function() {

    const formulario = document.getElementById("formReserva");

    formulario.addEventListener("submit", function(event) {

        event.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const contacto = document.getElementById("contacto").value;
        const sala = document.getElementById("sala").value;
        const fecha = document.getElementById("fecha").value;
        const horarioSeleccionado = document.querySelector('input[name="horario"]:checked');
        const duracion = document.getElementById("duracion").value;
        const equipamiento = document.getElementById("equipamiento").checked;

        if (!horarioSeleccionado) {
            alert("Seleccioná un horario.");
            return;
        }

        const horario = horarioSeleccionado.value;

        const codigo = "GS-" + Math.floor(Math.random() * 100000);

        const reserva = {
            codigo: codigo,
            nombre: nombre,
            contacto: contacto,
            sala: sala,
            fecha: fecha,
            horario: horario,
            duracion: duracion,
            equipamiento: equipamiento
        };

        localStorage.setItem("reserva", JSON.stringify(reserva));

        window.location.href = "ticket.html";

    });

});

