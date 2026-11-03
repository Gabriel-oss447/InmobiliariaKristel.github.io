// ============================================================
// index.js → catálogo de terrenos, filtros, detalle y selección
// ============================================================
const catalogo = document.getElementById("catalogo");
const listaSel = document.getElementById("lista-seleccion");
const dlg = document.getElementById("detalle");
let filtroActual = "todos";                                     // todos | verde | amarillo | rojo

// ---------- CATÁLOGO ----------
function pintarCatalogo() {
  const elegidos = getSeleccion();
  const lista = getTerrenos().filter((t) => filtroActual === "todos" || estadoGeneral(t) === filtroActual);
  catalogo.innerHTML = lista.map((t) => {
    const g = estadoGeneral(t);
    const esta = elegidos.includes(t.id);
    return `
    <div class="tarjeta">
      <div class="foto">${imgTerreno(t)}${etiqueta(g)}</div>
      <div class="cuerpo">
        <span class="cat">${esc(t.categoria)} · ${t.area} m²</span>
        <h5>${esc(t.nombre)}</h5>
        <p>${esc(t.ubicacion)}</p>
        ${puntos(t)}
        <h3>${soles(t.precio)}</h3>
        <div class="acciones">
          <button type="button" class="claro" data-ver="${t.id}">Ver detalle</button>
          <button type="button" class="${esta ? "dorado" : ""}" data-add="${t.id}">${esta ? "✓ Elegido" : "Elegir"}</button>
        </div>
      </div>
    </div>`;
  }).join("") || `<p class="vacio">No hay terrenos con este estado.</p>`;
}

// ---------- SELECCIÓN (aside) ----------
function pintarSeleccion() {
  const terrenos = getTerrenos();
  const html = getSeleccion().map((id) => terrenos.find((t) => t.id === id)).filter(Boolean).map((t) =>
    `<li><span>${esc(t.nombre)}<br>${puntos(t)}</span>
     <button class="quitar" data-quitar="${t.id}" title="Quitar">✕</button></li>`).join("");
  listaSel.innerHTML = html || `<li class="vacio">Aún no elegiste ningún terreno. Pulsa "Elegir" en el que te interese.</li>`;
}

// ---------- DETALLE (ventana emergente) ----------
function abrirDetalle(id) {
  const t = getTerrenos().find((x) => x.id === id);
  if (!t) return;
  const filas = RUBROS.map((r) => {
    const s = t.semaforo[r.k];
    return `<tr><td><b>${r.n}</b></td><td>${etiqueta(s.estado)}</td><td>${esc(s.exp || "—")}</td><td>${esc(s.plazo || "—")}</td></tr>`;
  }).join("");
  const docs = (t.documentos || []).map((d) =>
    `<li>📄 <a href="${d.data}" download="${esc(d.nombre)}">${esc(d.titulo || d.nombre)}</a> <small>(${kb(d.tam)})</small></li>`).join("");
  dlg.innerHTML = `
    <div class="det">
      <div class="det-cab">
        <div><span class="cat">${esc(t.categoria)} · ${t.area} m²</span><h1>${esc(t.nombre)}</h1><h3>${soles(t.precio)}</h3></div>
        <form method="dialog"><button class="claro">✕ Cerrar</button></form>
      </div>
      ${imgTerreno(t)}
      <p>${esc(t.descripcion)}</p>
      <h4 style="margin-top:14px">Semáforo legal-técnico y de servicios</h4>
      <div style="overflow-x:auto"><table><thead><tr><th>Rubro</th><th>Estado</th><th>N.° de expediente</th><th>Plazo estimado</th></tr></thead><tbody>${filas}</tbody></table></div>
      <div class="aviso"><strong>Lo que debes saber antes de comprar:</strong><br>${esc(t.limitaciones || "Sin limitaciones registradas.")}</div>
      <h4>Documentos del terreno</h4>
      <ul class="docs">${docs || '<li class="vacio">Aún no se han publicado documentos de este terreno.</li>'}</ul>
      <p style="margin-top:16px"><button type="button" class="dorado" data-add-det="${t.id}">Elegir este terreno</button></p>
    </div>`;
  dlg.showModal();
}

// ---------- EVENTOS (delegación de eventos) ----------
function alternar(id) {
  const s = getSeleccion();
  setSeleccion(s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  pintarCatalogo(); pintarSeleccion();
}
catalogo.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  const ver = e.target.closest("[data-ver]");
  if (add) alternar(Number(add.dataset.add));
  if (ver) abrirDetalle(Number(ver.dataset.ver));
});
dlg.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add-det]");
  if (b) { const id = Number(b.dataset.addDet); if (!getSeleccion().includes(id)) alternar(id); dlg.close(); }
  if (e.target === dlg) dlg.close();                           // clic fuera de la ventana = cerrar
});
listaSel.addEventListener("click", (e) => {
  const b = e.target.closest("[data-quitar]");
  if (b) alternar(Number(b.dataset.quitar));
});
document.querySelectorAll(".filtro").forEach((b) => b.addEventListener("click", () => {
  filtroActual = b.dataset.cat;
  document.querySelectorAll(".filtro").forEach((x) => x.classList.remove("activo"));
  b.classList.add("activo");
  pintarCatalogo();
}));
document.getElementById("btn-vaciar").addEventListener("click", () => { setSeleccion([]); pintarCatalogo(); pintarSeleccion(); });
document.getElementById("btn-solicitar").addEventListener("click", () => { window.location.href = "solicitud.html"; });

pintarCatalogo();
pintarSeleccion();
