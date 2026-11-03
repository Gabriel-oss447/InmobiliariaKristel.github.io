// ============================================================
// admin.js → panel: solicitudes, terrenos, semáforo, documentos
// ============================================================
// Protección: si no inició sesión, lo mandamos al login
if (!sessionStorage.getItem("kristel_sesion")) window.location.href = "ingreso.html";

const $ = (id) => document.getElementById(id);
const AVISO_ESPACIO = "No hay espacio para guardar. Quita documentos antiguos o sube archivos más livianos.";

// ---------- 1. RESUMEN ----------
function pintarResumen() {
  const sol = getSolicitudes(), ter = getTerrenos();
  $("n-solicitudes").textContent = sol.length;
  $("n-atendidas").textContent = sol.filter((s) => s.estado === "Atendida").length;
  $("n-terrenos").textContent = ter.length;
  $("n-verificados").textContent = ter.filter((t) => estadoGeneral(t) === "verde").length;
}

// ---------- 2. SOLICITUDES DE CLIENTES (con sus documentos) ----------
function pintarSolicitudes() {
  $("tabla-solicitudes").innerHTML = getSolicitudes().map((s) => `
    <tr>
      <td>${s.numero}</td>
      <td>${esc(s.cliente)}<small>DNI ${esc(s.dni)} · Tel. ${esc(s.telefono)}</small><small>${esc(s.correo || "")} · ${esc(s.fecha)}</small></td>
      <td>${s.terrenos.map((t) => esc(t.nombre)).join("<br>")}</td>
      <td>${esc(s.atencion)}<small>${esc(s.detalle)}</small></td>
      <td>${(s.documentos || []).map((d) => `<a href="${d.data}" download="${esc(d.nombre)}">📄 ${esc(d.nombre)}</a>`).join("") || '<small>Sin documentos</small>'}</td>
      <td><span class="estado ${s.estado.toLowerCase()}">${s.estado}</span>
          ${s.estado === "Pendiente" ? `<br><button type="button" data-atender="${s.numero}">Marcar atendida</button>` : ""}</td>
    </tr>`).reverse().join("")                                   // el más nuevo arriba
    || `<tr><td colspan="6" class="vacio">Todavía no hay solicitudes.</td></tr>`;
}
$("tabla-solicitudes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-atender]");
  if (!b) return;
  const sol = getSolicitudes();
  sol.find((s) => s.numero == b.dataset.atender).estado = "Atendida";
  setSolicitudes(sol);
  pintarTodo();
});

// ---------- 3. TERRENOS ----------
function pintarTerrenos() {
  $("tabla-terrenos").innerHTML = getTerrenos().map((t) => `
    <tr>
      <td><b>${esc(t.nombre)}</b><small>${esc(t.categoria)} · ${t.area} m²</small></td>
      <td>${soles(t.precio)}</td>
      <td>${puntos(t)}<br>${etiqueta(estadoGeneral(t))}</td>
      <td>${(t.documentos || []).length}</td>
      <td><button type="button" class="peligro" data-borrar="${t.id}">Eliminar</button></td>
    </tr>`).join("") || `<tr><td colspan="5" class="vacio">No hay terrenos.</td></tr>`;

  // Llena los <select> de semáforo y documentos (conserva el terreno elegido)
  const opciones = getTerrenos().map((t) => `<option value="${t.id}">${esc(t.nombre)}</option>`).join("");
  ["sem-terreno", "doc-terreno"].forEach((id) => { const v = $(id).value; $(id).innerHTML = opciones; if (v) $(id).value = v; });
}
$("tabla-terrenos").addEventListener("click", (e) => {
  const b = e.target.closest("[data-borrar]");
  if (!b || !confirm("¿Eliminar este terreno y sus documentos?")) return;
  setTerrenos(getTerrenos().filter((t) => t.id != b.dataset.borrar));
  pintarTodo();
});

// ---------- 4. EDITOR DEL SEMÁFORO ----------
function pintarEditor() {
  const t = getTerrenos().find((x) => x.id == $("sem-terreno").value);
  $("filas-semaforo").innerHTML = !t ? "" : RUBROS.map((r) => {
    const s = t.semaforo[r.k];
    return `<div class="fila-sem">
      <strong>${r.n}</strong>
      <select data-k="${r.k}" data-c="estado">${Object.keys(ESTADOS).map((e) => `<option value="${e}" ${s.estado === e ? "selected" : ""}>${ESTADOS[e]}</option>`).join("")}</select>
      <input type="text" data-k="${r.k}" data-c="exp" placeholder="N.° de expediente" value="${esc(s.exp || "")}">
      <input type="text" data-k="${r.k}" data-c="plazo" placeholder="Plazo estimado" value="${esc(s.plazo || "")}">
    </div>`;
  }).join("");
}
$("sem-terreno").addEventListener("change", pintarEditor);
$("form-semaforo").addEventListener("submit", (e) => {
  e.preventDefault();
  const ter = getTerrenos();
  const t = ter.find((x) => x.id == $("sem-terreno").value);
  $("filas-semaforo").querySelectorAll("[data-k]").forEach((campo) => { t.semaforo[campo.dataset.k][campo.dataset.c] = campo.value.trim(); });
  setTerrenos(ter);
  pintarTodo();
  alert("Semáforo actualizado. Ya se ve en la página principal.");
});

// ---------- 5. DOCUMENTOS DE CADA TERRENO ----------
function pintarDocs() {
  const filas = [];
  getTerrenos().forEach((t) => (t.documentos || []).forEach((d, i) => filas.push(`
    <tr><td>${esc(t.nombre)}</td><td><a href="${d.data}" download="${esc(d.nombre)}">📄 ${esc(d.titulo)}</a><small>${esc(d.nombre)} · ${kb(d.tam)}</small></td>
    <td><button type="button" class="peligro" data-doc="${t.id}|${i}">Quitar</button></td></tr>`)));
  $("tabla-docs").innerHTML = filas.join("") || `<tr><td colspan="3" class="vacio">Aún no hay documentos subidos.</td></tr>`;
}
$("form-doc").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = $("doc-archivo").files[0];
  if (!file) return;
  try {
    const doc = await leerArchivo(file);
    doc.titulo = $("doc-titulo").value;
    const ter = getTerrenos();
    ter.find((t) => t.id == $("doc-terreno").value).documentos.push(doc);
    if (!setTerrenos(ter)) { alert(AVISO_ESPACIO); return; }
    e.target.reset();
    pintarTodo();
  } catch (err) { alert(err.message); }
});
$("tabla-docs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-doc]");
  if (!b) return;
  const [id, i] = b.dataset.doc.split("|");
  const ter = getTerrenos();
  ter.find((t) => t.id == id).documentos.splice(Number(i), 1);
  setTerrenos(ter);
  pintarTodo();
});

// ---------- 6. AÑADIR TERRENO ----------
$("form-terreno").addEventListener("submit", (e) => {
  e.preventDefault();
  const ter = getTerrenos();
  const pendiente = () => ({ estado: "rojo", exp: "", plazo: "" });   // todo nace en rojo hasta que lo verifiques
  ter.push({
    id: Math.max(0, ...ter.map((t) => t.id)) + 1,
    nombre: $("t-nombre").value.trim(),
    categoria: $("t-categoria").value,
    area: parseFloat($("t-area").value),
    precio: parseFloat($("t-precio").value),
    ubicacion: $("t-ubicacion").value.trim(),
    descripcion: $("t-descripcion").value.trim(),
    limitaciones: $("t-limitaciones").value.trim(),
    imagen: $("t-imagen").value.trim(),
    documentos: [],
    semaforo: Object.fromEntries(RUBROS.map((r) => [r.k, pendiente()]))
  });
  setTerrenos(ter);
  e.target.reset();
  $("t-ubicacion").value = "Pilcomayo, Huancayo, Junín";
  pintarTodo();
  alert("¡Terreno añadido! Ahora actualiza su semáforo y sube sus documentos.");
});

// ---------- Salir y refrescar ----------
$("btn-salir").addEventListener("click", () => { sessionStorage.removeItem("kristel_sesion"); window.location.href = "ingreso.html"; });
function pintarTodo() { pintarResumen(); pintarSolicitudes(); pintarTerrenos(); pintarEditor(); pintarDocs(); }
window.addEventListener("storage", pintarTodo);                 // se actualiza si otra pestaña recibe una solicitud
pintarTodo();
