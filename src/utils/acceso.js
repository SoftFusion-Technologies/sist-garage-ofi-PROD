// utils/acceso.js
export function estaBloqueado({ acceso_bloqueado, acceso_bloqueado_hasta }) {
  const flag = !!acceso_bloqueado;
  const hastaFuturo =
    acceso_bloqueado_hasta &&
    new Date(acceso_bloqueado_hasta).getTime() > Date.now();
  return flag || hastaFuturo;
}

export function mensajeBloqueo({
  acceso_bloqueado_motivo,
  acceso_bloqueado_hasta
}) {
  if (acceso_bloqueado_motivo) return acceso_bloqueado_motivo;
  if (acceso_bloqueado_hasta && new Date(acceso_bloqueado_hasta) > new Date()) {
    const f = new Date(acceso_bloqueado_hasta).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Tucuman'
    });
    return `Acceso deshabilitado hasta ${f}.`;
  }
  return undefined; // usa el message por defecto del componente
}
