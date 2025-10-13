// ClientGateFixed.jsx
import React, { useEffect, useState } from 'react';
import ServicePausedModal from './ServicePausedModal'; // ajusta la ruta si hace falta

// Lógica: bloquea si flag o si hay "hasta" en el futuro
const estaBloqueado = ({ acceso_bloqueado, acceso_bloqueado_hasta }) => {
  const flag = !!acceso_bloqueado;
  const hastaFuturo =
    acceso_bloqueado_hasta &&
    new Date(acceso_bloqueado_hasta).getTime() > Date.now();
  return flag || hastaFuturo;
};

// Mensaje a mostrar: motivo > "hasta fecha" > default del componente
const mensajeBloqueo = ({
  acceso_bloqueado_motivo,
  acceso_bloqueado_hasta
}) => {
  if (acceso_bloqueado_motivo) return acceso_bloqueado_motivo;
  if (acceso_bloqueado_hasta && new Date(acceso_bloqueado_hasta) > new Date()) {
    const f = new Date(acceso_bloqueado_hasta).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Tucuman'
    });
    return `Acceso deshabilitado hasta ${f}.`;
  }
  return undefined;
};

export default function ClientGateFixed({
  children,
  clienteId = Number(import.meta?.env?.VITE_CLIENTE_ID) || 11,
  apiBase = import.meta?.env?.VITE_API_BASE ||
    'https://vps-5097245-x.dattaweb.com',
  pollMs = 60000
}) {
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    let timer;
    const fetchOne = async () => {
      try {
        const res = await fetch(`${apiBase}/clientes/${clienteId}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();
        setCliente(data);
      } catch (e) {
        // opcional: console.error('Gate fetch error:', e);
      }
    };
    fetchOne(); // al montar
    timer = setInterval(fetchOne, pollMs); // poll
    const onVisible = () =>
      document.visibilityState === 'visible' && fetchOne();
    const onOnline = () => fetchOne();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [apiBase, clienteId, pollMs]);

  const bloqueado = cliente ? estaBloqueado(cliente) : false;

  return (
    <>
      {/* Bloquea interacción cuando está bloqueado */}
      <div
        aria-hidden={bloqueado}
        className={bloqueado ? 'pointer-events-none select-none' : ''}
      >
        {children}
      </div>

      {/* Modal: usa defaults (whatsapp/phone/brand/layout) y pasa motivo si existe */}
      <ServicePausedModal
        active={bloqueado}
        message={cliente ? mensajeBloqueo(cliente) : undefined}
        // Si preferís barra inferior:
        // layout="footer"
      />
    </>
  );
}
