const CLAVE = "diario-estudio-sesiones";

const formulario = document.getElementById("formulario");
const campoFecha = document.getElementById("fecha");
const campoTema = document.getElementById("tema");
const campoMinutos = document.getElementById("minutos");
const mensaje = document.getElementById("mensaje");
const listaSesiones = document.getElementById("listaSesiones");
const vacio = document.getElementById("vacio");
const rachaNumero = document.getElementById("rachaNumero");
const rachaEtiqueta = document.getElementById("rachaEtiqueta");

// ---------- Utilidades de fecha (siempre fecha local, nunca UTC) ----------

function formatearFechaLocal(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function hoyLocal() {
  return formatearFechaLocal(new Date());
}

function restarDias(fecha, dias) {
  const copia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  copia.setDate(copia.getDate() - dias);
  return copia;
}

// ---------- Datos ----------

function cargarSesiones() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    const datos = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE, JSON.stringify(sesiones));
}

let sesiones = cargarSesiones();

// ---------- Racha ----------

function calcularRacha(lista) {
  const diasConSesion = new Set(lista.map((s) => s.fecha));

  const hoy = new Date();
  let diaActual;

  if (diasConSesion.has(formatearFechaLocal(hoy))) {
    diaActual = hoy;
  } else {
    // Hoy todavía no he estudiado: la racha sigue viva si ayer sí.
    diaActual = restarDias(hoy, 1);
    if (!diasConSesion.has(formatearFechaLocal(diaActual))) {
      return 0;
    }
  }

  let racha = 0;
  while (diasConSesion.has(formatearFechaLocal(diaActual))) {
    racha++;
    diaActual = restarDias(diaActual, 1);
  }
  return racha;
}

// ---------- Pintado ----------

function formatearFechaLegible(fechaTexto) {
  const partes = fechaTexto.split("-");
  const fecha = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2])
  );
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pintarRacha() {
  const racha = calcularRacha(sesiones);
  rachaNumero.textContent = racha;
  rachaEtiqueta.textContent = racha === 1 ? "día de racha" : "días de racha";
}

function pintarLista() {
  listaSesiones.innerHTML = "";

  const ordenadas = [...sesiones].sort((a, b) => {
    if (a.fecha === b.fecha) return b.id - a.id;
    return a.fecha < b.fecha ? 1 : -1;
  });

  for (const sesion of ordenadas) {
    const li = document.createElement("li");

    const izquierda = document.createElement("div");
    izquierda.innerHTML =
      `<span class="sesion-tema"></span><br>` +
      `<span class="sesion-fecha"></span>`;
    izquierda.querySelector(".sesion-tema").textContent = sesion.tema;
    izquierda.querySelector(".sesion-fecha").textContent = formatearFechaLegible(
      sesion.fecha
    );

    const minutos = document.createElement("span");
    minutos.className = "sesion-minutos";
    minutos.textContent = `${sesion.minutos} min`;

    li.appendChild(izquierda);
    li.appendChild(minutos);
    listaSesiones.appendChild(li);
  }

  vacio.hidden = sesiones.length > 0;
}

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
  mensaje.hidden = false;
  setTimeout(() => {
    mensaje.hidden = true;
  }, 2500);
}

// ---------- Eventos ----------

formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const tema = campoTema.value.trim();
  const minutos = Number(campoMinutos.value);

  if (!fecha) {
    mostrarMensaje("Selecciona una fecha.");
    return;
  }
  if (tema === "") {
    mostrarMensaje("El tema es obligatorio.");
    return;
  }
  if (!Number.isFinite(minutos) || minutos <= 0) {
    mostrarMensaje("Los minutos deben ser un número mayor que 0.");
    return;
  }

  sesiones.push({
    id: Date.now(),
    fecha: fecha,
    tema: tema,
    minutos: Math.round(minutos),
  });

  guardarSesiones(sesiones);
  pintarRacha();
  pintarLista();

  formulario.reset();
  campoFecha.value = hoyLocal();
  mostrarMensaje("Sesión guardada ✔");
});

// ---------- Inicio ----------

campoFecha.value = hoyLocal();
pintarRacha();
pintarLista();
