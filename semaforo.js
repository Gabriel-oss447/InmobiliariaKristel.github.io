// ============================================================
// semaforo.js → dashboard de 1 página: tabla de colores + detalle de expedientes
// ============================================================
const terrenos = getTerrenos();
document.getElementById("fecha").textContent = "Actualizado el " + new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

// Tabla: una fila por terreno, una columna por rubro
document.getElementById("tabla-semaforo").innerHTML = terrenos.map((t) => `
  <tr>
    <td><b>${esc(t.nombre)}</b><small>${t.area} m² · ${soles(t.precio)}</small></td>
    ${RUBROS.map((r) => { const e = t.semaforo[r.k].estado;
      return `<td class="celda ${e}"><span class="punto ${e}"></span>${ESTADOS[e]}</td>`; }).join("")}
    <td>${etiqueta(estadoGeneral(t))}</td>
  </tr>`).join("") || `<tr><td colspan="7" class="vacio">No hay terrenos registrados.</td></tr>`;

// Detalle: solo lo que NO está verificado (número de expediente y plazo estimado)
document.getElementById("detalle-exp").innerHTML = terrenos.map((t) => {
  const pend = RUBROS.filter((r) => t.semaforo[r.k].estado !== "verde");
  if (!pend.length) return "";
  return `<div class="exp-card"><h3>${esc(t.nombre)}</h3><ul>` + pend.map((r) => {
    const s = t.semaforo[r.k];
    return `<li>${etiqueta(s.estado)} <b>${r.n}</b>
      <small>Expediente: ${esc(s.exp || "sin número aún")} · Plazo estimado: ${esc(s.plazo || "por definir")}</small></li>`;
  }).join("") + `</ul></div>`;
}).join("") || `<p class="vacio">¡Todos los terrenos están completamente verificados!</p>`;

document.getElementById("btn-imprimir").addEventListener("click", () => window.print());
