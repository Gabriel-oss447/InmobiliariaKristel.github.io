// ============================================================
// ingreso.js → valida el usuario y la contraseña del administrador
// ============================================================
document.getElementById("form-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const correo = document.getElementById("correo").value.trim().toLowerCase();
  const clave = document.getElementById("clave").value;

  if (correo === EMPLEADO.correo && clave === EMPLEADO.clave) {
    // sessionStorage = "sesión iniciada": se borra al cerrar la pestaña
    sessionStorage.setItem("kristel_sesion", correo);
    window.location.href = "admin.html";
  } else {
    document.getElementById("error").hidden = false;
  }
});
