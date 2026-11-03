// ============================================================
// solicitud.js → formulario de solicitud: terrenos de interés,
// tipo de atención, SUBIDA DE DOCUMENTACIÓN y guardado para el admin
// ============================================================
const $ = (id) => document.getElementById(id);
const form = $("form-solicitud");
const ATENCION = { visita: "Visita al terreno", oficina: "Reunión en la oficina (Pilcomayo)", video: "Videollamada" };
const MAX_ARCHIVOS = 5;
let archivos = [];                                              // documentos elegidos (aún no enviados)

// ---------- Terrenos ----------
function pintarTerrenos() {
  const elegidos = getSeleccion();
  $("lista-terrenos").innerHTML = getTerrenos().map((t) => `
    <label class="fila-terreno">
      <input type="checkbox" value="${t.id}" ${elegidos.includes(t.id) ? "checked" : ""}>
      ${imgTerreno(t)}
      <span><strong>${esc(t.nombre)}</strong><small>${t.area} m² · ${soles(t.precio)}</small>${puntos(t)}</span>
      ${etiqueta(estadoGeneral(t))}
    </label>`).join("");
  resumen();
}
// Devuelve la atención elegida ("visita", "oficina", "video") o "" si aún no eligió
const tipoAtencion = () => (document.querySelector('input[name="atencion"]:checked') || {}).value || "";
const idsElegidos = () => [...$("lista-terrenos").querySelectorAll("input:checked")].map((i) => Number(i.value));

function resumen() {
  const terrenos = getTerrenos();
  $("resumen").innerHTML = idsElegidos().map((id) => `<li>${esc(terrenos.find((t) => t.id === id).nombre)}</li>`).join("")
    || `<li class="vacio">Aún no eliges terrenos</li>`;
  $("n-docs").textContent = archivos.length;
}
$("lista-terrenos").addEventListener("change", resumen);

// ---------- Tipo de atención ----------
function mostrarAtencion() {
  const tipo = tipoAtencion();
  $("bloque-fecha").hidden = !tipo;                             // la fecha aparece al elegir un tipo
  $("fecha").required = !!tipo;
  $("info-oficina").hidden = tipo !== "oficina";
}
form.addEventListener("change", (e) => { if (e.target.name === "atencion") mostrarAtencion(); });
$("fecha").min = new Date().toISOString().slice(0, 10);         // no se puede elegir una fecha pasada

// ---------- Documentación ----------
function pintarArchivos() {
  $("lista-archivos").innerHTML = archivos.map((a, i) =>
    `<li><span>📄 ${esc(a.nombre)} <small>(${kb(a.tam)})</small></span><button type="button" class="quitar" data-quitar="${i}" title="Quitar">✕</button></li>`).join("");
  resumen();
}
$("archivos").addEventListener("change", async (e) => {
  const errores = [];
  for (const f of e.target.files) {
    if (archivos.length >= MAX_ARCHIVOS) { errores.push(`Máximo ${MAX_ARCHIVOS} documentos.`); break; }
    try { archivos.push(await leerArchivo(f)); } catch (err) { errores.push(err.message); }
  }
  e.target.value = "";                                          // permite volver a elegir el mismo archivo
  $("error-archivos").hidden = !errores.length;
  $("error-archivos").innerHTML = errores.map(esc).join("<br>");
  pintarArchivos();
});
$("lista-archivos").addEventListener("click", (e) => {
  const b = e.target.closest("[data-quitar]");
  if (b) { archivos.splice(Number(b.dataset.quitar), 1); pintarArchivos(); }
});

// ---------- Enviar solicitud ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ids = idsElegidos();
  if (!ids.length) { alert("Elige al menos un terreno de tu interés."); return; }

  const terrenos = getTerrenos();
  const solicitudes = getSolicitudes();
  const numero = solicitudes.length ? Math.max(...solicitudes.map((s) => s.numero)) + 1 : 1;
  const tipo = tipoAtencion();

  solicitudes.push({
    numero,
    cliente: $("nombre").value.trim(),
    telefono: $("telefono").value,
    dni: $("dni").value,
    correo: $("correo").value.trim(),
    terrenos: ids.map((id) => ({ id, nombre: terrenos.find((t) => t.id === id).nombre })),
    atencion: ATENCION[tipo],
    detalle: `${$("fecha").value} · ${$("franja").value}` + ($("comentario").value.trim() ? " · " + $("comentario").value.trim() : ""),
    documentos: archivos,                                       // los archivos viajan con la solicitud
    estado: "Pendiente",                                        // el admin la cambia a "Atendida"
    fecha: new Date().toLocaleString("es-PE")
  });
  if (!setSolicitudes(solicitudes)) { alert("No hay espacio para guardar los documentos. Quita alguno o sube archivos más livianos."); return; }
  setSeleccion([]);
  archivos = [];

  form.reset();
  pintarTerrenos(); pintarArchivos(); mostrarAtencion();
  const conf = $("confirmacion");
  conf.hidden = false;
  conf.innerHTML = `<h1>¡Solicitud N° ${numero} registrada!</h1><p>Gracias, un asesor de Kristel te contactará pronto para confirmar tu atención.</p>`;
  conf.scrollIntoView({ behavior: "smooth" });
});

pintarTerrenos(); pintarArchivos(); mostrarAtencion();
