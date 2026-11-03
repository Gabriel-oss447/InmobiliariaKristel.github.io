// ============================================================
// datos.js → "cerebro compartido" de todas las páginas de Kristel.
// Cada HTML lo carga PRIMERO para usar las mismas funciones.
// ============================================================

// Acceso del administrador. (En una web real esto va en un servidor, nunca en el navegador.)
// Se entra escribiendo "kristel" en usuario y "kristel" en contraseña.
const EMPLEADO = { correo: "kristel", clave: "kristel" };

// ---------- SEMÁFORO ----------
// Los 5 rubros que se revisan en cada terreno
const RUBROS = [
  { k: "titulacion",   n: "Titulación" },
  { k: "habilitacion", n: "Habilitación urbana" },
  { k: "agua",         n: "Agua" },
  { k: "luz",          n: "Luz" },
  { k: "desague",      n: "Desagüe" }
];
// Los 3 colores y su significado
const ESTADOS = { verde: "Verificado", amarillo: "En trámite", rojo: "Pendiente" };

// Atajo para armar un rubro: S("amarillo", "EXP-2026-0142", "60 días")
const S = (estado, exp = "", plazo = "") => ({ estado, exp, plazo });

// ---------- TERRENOS DE EJEMPLO ----------
// DATOS DE EJEMPLO: edítalos o bórralos desde el panel admin.
// imagen = nombre del archivo dentro de assets/terrenos/ (si no existe, sale un dibujo)
const TERRENOS_INICIALES = [
  { id: 1, nombre: "Proyecto La Perla", categoria: "residencial", area: 120, precio: 54000,
    ubicacion: "Pilcomayo, Huancayo, Junín",
    descripcion: "Lote plano de esquina, ideal para vivienda familiar y cercano a la vía principal.",
    limitaciones: "Ninguna limitación conocida. Se debe respetar la faja de servidumbre de la acequia vecina.",
    imagen: "assets/terrenos/Proyecto La Perla.png", documentos: [],
    semaforo: { titulacion: S("verde", "Partida 11000001"), habilitacion: S("verde", "Res. 045-2025"), agua: S("verde"), luz: S("verde"), desague: S("verde") } },
  { id: 2, nombre: "Proyecto La Planicie", categoria: "residencial", area: 200, precio: 78000,
    ubicacion: "Pilcomayo, Huancayo, Junín",
    descripcion: "Lote con vista al valle, en zona de crecimiento residencial.",
    limitaciones: "El desagüe aún no está conectado: por ahora se necesita un pozo séptico temporal.",
    imagen: "assets/terrenos/Proyecto La Planicie.png", documentos: [],
    semaforo: { titulacion: S("verde", "Partida 11000002"), habilitacion: S("amarillo", "EXP-2026-0142", "60 días"), agua: S("verde"), luz: S("amarillo", "SOL-2026-0388", "45 días"), desague: S("rojo", "Aún sin iniciar", "6 meses") } },
  { id: 3, nombre: "Proyecto Valle", categoria: "campestre", area: 500, precio: 95000,
    ubicacion: "Pilcomayo, Huancayo, Junín",
    descripcion: "Terreno amplio de uso campestre, ideal para casa de campo o proyecto familiar.",
    limitaciones: "Zona sin habilitación urbana: no se puede construir hasta terminar el trámite.",
    imagen: "assets/terrenos/Proyecto Valle.png", documentos: [],
    semaforo: { titulacion: S("amarillo", "EXP-2026-0097", "90 días"), habilitacion: S("rojo", "Por presentar", "8 meses"), agua: S("rojo", "Por solicitar", "6 meses"), luz: S("amarillo", "SOL-2026-0412", "60 días"), desague: S("rojo", "Por solicitar", "8 meses") } },
  { id: 4, nombre: "Urbanización Mirandor del Valle", categoria: "comercial", area: 150, precio: 120000,
    ubicacion: "Pilcomayo, Huancayo, Junín",
    descripcion: "Lote con frente a avenida, pensado para local comercial o negocio.",
    limitaciones: "Falta culminar la conexión de desagüe a la red pública.",
    imagen: "assets/terrenos/Urbanización Mirandor del Valle.png", documentos: [],
    semaforo: { titulacion: S("verde", "Partida 11000004"), habilitacion: S("verde", "Res. 061-2025"), agua: S("verde"), luz: S("verde"), desague: S("amarillo", "EXP-2026-0155", "30 días") } }
];

// ---------- localStorage ----------
// Guarda datos en el navegador aunque cierres la página. Solo guarda TEXTO:
//   JSON.stringify(objeto) → objeto a texto   |   JSON.parse(texto) → texto a objeto
function leer(clave, porDefecto) {
  try { const t = localStorage.getItem(clave); return t ? JSON.parse(t) : porDefecto; } catch { return porDefecto; }
}
// Devuelve true si se guardó, false si no hay espacio (por ejemplo, documentos muy pesados)
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch { return false; }
}

function getTerrenos() {
  let t = leer("kristel_terrenos", null);
  if (!t) { t = TERRENOS_INICIALES; guardar("kristel_terrenos", t); }   // primera vez
  return t;
}
const setTerrenos = (t) => guardar("kristel_terrenos", t);
const getSolicitudes = () => leer("kristel_solicitudes", []);
const setSolicitudes = (s) => guardar("kristel_solicitudes", s);
const getSeleccion = () => leer("kristel_seleccion", []);     // lista de ids de terrenos elegidos
const setSeleccion = (s) => guardar("kristel_seleccion", s);

// ---------- Ayudas ----------
const soles = (n) => "S/. " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (t) => String(t).replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const kb = (n) => (n < 1048576 ? Math.round(n / 1024) + " KB" : (n / 1048576).toFixed(1) + " MB");

// Estado general de un terreno: si hay algún rojo → rojo; si no, algún amarillo → amarillo; si no → verde
function estadoGeneral(t) {
  const e = RUBROS.map((r) => t.semaforo[r.k].estado);
  return e.includes("rojo") ? "rojo" : e.includes("amarillo") ? "amarillo" : "verde";
}
// Los 5 puntitos de colores de un terreno (uno por rubro)
const puntos = (t) => '<span class="puntos">' + RUBROS.map((r) =>
  `<span class="punto ${t.semaforo[r.k].estado}" title="${r.n}: ${ESTADOS[t.semaforo[r.k].estado]}"></span>`).join("") + "</span>";
// Etiqueta de color con texto (no depende solo del color)
const etiqueta = (e) => `<span class="etiqueta ${e}">${ESTADOS[e]}</span>`;

// Dibujo que sale cuando el terreno no tiene foto en assets/terrenos/
const IMG_VACIA = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'><defs><linearGradient id='c' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#cfe6f5'/><stop offset='1' stop-color='#f6efe0'/></linearGradient></defs><rect width='600' height='360' fill='url(#c)'/><circle cx='480' cy='80' r='34' fill='#f3d27a'/><path d='M0 250 L130 150 L230 230 L340 130 L470 240 L600 170 V360 H0Z' fill='#9db9cf'/><path d='M0 290 Q150 230 300 280 T600 260 V360 H0Z' fill='#7fae7a'/><path d='M200 330 L260 295 L400 295 L440 330Z' fill='none' stroke='#fff' stroke-width='4' stroke-dasharray='10 8'/></svg>");

function imgTerreno(t) {
  return `<img src="assets/terrenos/${esc(t.imagen || "x")}" alt="${esc(t.nombre)}" onerror="this.onerror=null;this.src=IMG_VACIA">`;
}

// ---------- Subida de documentos ----------
// Lee un archivo y lo devuelve como texto (base64) para guardarlo en localStorage.
// Solo PDF, JPG o PNG, de hasta 1 MB cada uno.
const MAX_MB = 1;
function leerArchivo(file) {
  return new Promise((ok, fallo) => {
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return fallo(new Error(`"${file.name}": solo se aceptan PDF, JPG o PNG.`));
    if (file.size > MAX_MB * 1048576) return fallo(new Error(`"${file.name}" pesa más de ${MAX_MB} MB.`));
    const r = new FileReader();
    r.onload = () => ok({ nombre: file.name, tipo: file.type, tam: file.size, data: r.result });
    r.onerror = () => fallo(new Error("No se pudo leer " + file.name));
    r.readAsDataURL(file);
  });
}
