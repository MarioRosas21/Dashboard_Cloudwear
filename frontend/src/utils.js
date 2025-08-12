// utils.js
export function obtenerTodosLosDatos(usuario) {
  if (!usuario.datos || typeof usuario.datos !== "object") return [];
  const arraysDatos = Object.values(usuario.datos);
  return arraysDatos.flat();
}