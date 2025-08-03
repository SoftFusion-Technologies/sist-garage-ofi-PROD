// utils.js

// --- Funciones para obtener datos desde endpoints ---
export async function fetchLocales() {
  const res = await fetch('https://vps-5192960-x.dattaweb.com/locales');
  if (!res.ok) throw new Error('Error al obtener locales');
  return await res.json();
}

export async function fetchUsuarios() {
  const res = await fetch('https://vps-5192960-x.dattaweb.com/usuarios');
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return await res.json();
}

// --- Helpers para obtener nombres por id ---
export function getNombreLocal(id, locales) {
  const local = locales.find((l) => String(l.id) === String(id));
  return local ? local.nombre : '-';
}

// --- Helpers para obtener datos del local por id ---
export function getInfoLocal(id, locales) {
  const local = locales.find((l) => String(l.id) === String(id));
  if (!local) return { nombre: '-', direccion: '-' };
  return {
    nombre: local.nombre,
    direccion: local.direccion
  };
}

export function getNombreUsuario(id, usuarios) {
  const usuario = usuarios.find((u) => String(u.id) === String(id));
  return usuario ? usuario.nombre : '-';
}
