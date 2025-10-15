import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaTimes,
  FaCheck,
  FaWhatsapp,
  FaPaperPlane,
  FaEye
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const API = 'https://vps-5192960-x.dattaweb.com';

/** Toast SweetAlert2 */
const swalToast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: true
});

/** Helpers */
const getFirstName = (full = '') => {
  const clean = String(full).trim().replace(/\s+/g, ' ');
  const first = clean.split(' ')[0] || '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

const personalizeMessage = (mensaje = '', nombreCliente = '') => {
  if (!mensaje || !nombreCliente) return mensaje;
  const firstname = getFirstName(nombreCliente);
  let out = String(mensaje);
  const before = out;
  out = out.replace(/{{\s*(firstname|nombre)\s*}}/i, firstname);
  const replacedPlaceholder = before !== out;
  if (!replacedPlaceholder) out = out.replace(/\bnombre\b/i, firstname);
  return out;
};

const cleanPhone = (s = '') => String(s).replace(/[^\d+]/g, '');

/** Heurística simple Argentina → E.164 */
const toE164AR = (raw = '', { assumeMobile = true, defaultArea = '' } = {}) => {
  if (!raw) return null;
  let s = cleanPhone(raw);
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (s.startsWith('+54')) {
    s = '+' + s.slice(1).replace(/[^0-9]/g, '');
    if (assumeMobile && !s.startsWith('+549') && s.length === 12)
      s = s.replace('+54', '+549');
    return s;
  }
  if (s.startsWith('+549')) return '+' + s.slice(1).replace(/[^0-9]/g, '');
  if (s.startsWith('+') && !s.startsWith('+54'))
    return s.replace(/[^+\d]/g, '');
  if (s.startsWith('0')) s = s.slice(1);
  if (s.length === 12 && s.startsWith('549')) return `+${s}`;
  if (s.length === 10 && /^\d{10}$/.test(s))
    return assumeMobile ? `+549${s}` : `+54${s}`;
  if (s.length === 11 && s.startsWith('9')) return `+54${s}`;
  if ((s.length === 7 || s.length === 8) && defaultArea) {
    const armado = `${defaultArea}${s}`;
    return assumeMobile ? `+549${armado}` : `+54${armado}`;
  }
  if (s.length >= 11 && s.startsWith('54')) {
    const withPlus = `+${s}`;
    if (assumeMobile && !withPlus.startsWith('+549') && withPlus.length === 12)
      return withPlus.replace('+54', '+549');
    return withPlus;
  }
  return null;
};

const pickWhatsAppTo = (cliente) => {
  if (cliente?.telefono_e164) {
    const norm = toE164AR(cliente.telefono_e164);
    if (norm) return norm;
  }
  if (cliente?.telefono) {
    const norm = toE164AR(cliente.telefono, { defaultArea: '' });
    if (norm) return norm;
  }
  return null;
};

export default function CampanaSendModal({ campana, userId, onClose }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const [enviando, setEnviando] = useState(false);
  const [enviados, setEnviados] = useState(() => new Set());

  const [metrics, setMetrics] = useState({
    total: 0,
    queued: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    opted_out: 0,
    blocked: 0
  });

  const searchAbortRef = useRef(null);

  useEffect(() => {
    obtenerClientes();
    preloadEnviados();
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(
        `${API}/recaptacion-clientes/metrics?campana_id=${campana.id}`
      );
      if (!res.ok) return;
      const m = await res.json();
      setMetrics((prev) => ({ ...prev, ...m }));
    } catch {}
  };

  const preloadEnviados = async () => {
    try {
      const res = await fetch(
        `${API}/recaptacion-clientes?campana_id=${campana.id}&status=sent&limit=1000`
      );
      if (!res.ok) return;
      const rows = await res.json();
      const setIds = new Set(rows.map((r) => r.cliente_id));
      setEnviados(setIds);
    } catch {}
  };

  const obtenerClientes = async (q = '') => {
    if (searchAbortRef.current) searchAbortRef.current.abort();
    const ctrl = new AbortController();
    searchAbortRef.current = ctrl;

    setLoading(true);
    try {
      const res = await fetch(
        `${API}/clientes${q ? `?q=${encodeURIComponent(q)}` : ''}`,
        { signal: ctrl.signal }
      );
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.name !== 'AbortError')
        console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscar = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    if (val.length >= 2) obtenerClientes(val);
    else obtenerClientes();
  };

  const personalize = (mensaje, nombre) => personalizeMessage(mensaje, nombre);

  const verMensaje = (c) => {
    const preview = personalize(campana.mensaje || '', c.nombre || '');
    Swal.fire({
      title: 'Vista previa',
      text: preview,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#0ea5e9',
      width: 560
    });
  };

  // Quita ZWJ, Variation Selector-16 y tonos de piel (Fitzpatrick)
  const emojiCompat = (s) =>
    String(s)
      .normalize('NFC')
      .replace(/\u200D/g, '') // ZWJ
      .replace(/\uFE0F/g, '') // VS16
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, ''); // tonos de piel

  // Construye URL para WhatsApp (API oficial) con UTF-8 correcto
  const buildWaUrl = (e164, text, { forceCompat = false } = {}) => {
    const phone = String(e164).replace(/^\+/, '');
    let normalized = String(text)
      .normalize('NFC')
      .replace(/\r\n|\r|\n/g, '\n')
      .replace(/\u2028|\u2029/g, '\n');

    // Si estamos en Linux o queremos forzar compat, quitamos modificadores problemáticos
    const isLinux = /Linux/i.test(navigator.userAgent);
    if (forceCompat || isLinux) normalized = emojiCompat(normalized);

    const encoded = encodeURIComponent(normalized);
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  };

  const enviarUno = async (c) => {
    if (enviados.has(c.id)) return;

    const toE164 = pickWhatsAppTo(c);
    if (!toE164) {
      await Swal.fire({
        icon: 'warning',
        title: 'Teléfono no válido',
        text: 'No se pudo normalizar a E.164. Editá el número antes de enviar.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#eab308'
      });
      return;
    }

    const debePersistir = !c.telefono_e164 && !!c.telefono;
    if (debePersistir) {
      const r = await Swal.fire({
        icon: 'question',
        title: 'Normalizar y guardar',
        html: `Se normalizó el número a <b>${toE164}</b>.<br/>¿Querés guardarlo en el cliente para próximos envíos?`,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'No guardar',
        confirmButtonColor: '#22c55e'
      });
      if (r.isConfirmed) {
        try {
          await fetch(`${API}/clientes/${c.id}/telefono-e164`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono_e164: toE164 })
          });
          c.telefono_e164 = toE164; // reflejo local
          swalToast.fire({ icon: 'success', title: 'Número guardado' });
        } catch {
          swalToast.fire({ icon: 'error', title: 'No se pudo guardar' });
        }
      }
    }

    if (c.wa_blocked) {
      await Swal.fire({
        icon: 'error',
        title: 'Bloqueado para WhatsApp',
        text: 'Este cliente está bloqueado para envíos.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (c.wa_opt_in === false) {
      const r = await Swal.fire({
        icon: 'warning',
        title: 'Sin opt-in',
        text: 'El cliente no tiene opt-in de WhatsApp. ¿Deseás enviar de todos modos?',
        showCancelButton: true,
        confirmButtonText: 'Enviar igual',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0ea5e9'
      });
      if (!r.isConfirmed) return;
    }

    const msg = personalize(campana.mensaje || '', c.nombre || '');
    const waUrl = buildWaUrl(toE164, msg);
    const w = window.open(waUrl, '_blank');
    try {
      setEnviando(true);
      const res = await fetch(
        `${API}/recaptacion-campanas/${campana.id}/log-send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cliente_id: c.id,
            wa_to: toE164,
            mensaje_rendered: msg,
            sent_by_id: userId ?? null
          })
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('No se pudo registrar el envío:', err);
        swalToast.fire({ icon: 'warning', title: 'No se registró el envío' });
      } else {
        setEnviados((prev) => new Set(prev).add(c.id));
        fetchMetrics();
        swalToast.fire({ icon: 'success', title: 'Mensaje enviado' });
      }
    } catch (e) {
      console.error('Error registrando envío:', e);
      swalToast.fire({ icon: 'error', title: 'Error registrando envío' });
    } finally {
      setEnviando(false);
      if (!w || w.closed || typeof w.closed === 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'Popup bloqueado',
          text: 'Permití popups para abrir WhatsApp Web.',
          confirmButtonText: 'Ok',
          confirmButtonColor: '#0ea5e9'
        });
      }
    }
  };

  const chips = useMemo(
    () => [
      { key: 'total', label: 'Total', val: metrics.total },
      { key: 'queued', label: 'Pendientes', val: metrics.queued },
      { key: 'sent', label: 'Enviados', val: metrics.sent },
      { key: 'delivered', label: 'Entregados', val: metrics.delivered },
      { key: 'read', label: 'Leídos', val: metrics.read },
      { key: 'failed', label: 'Fallidos', val: metrics.failed }
    ],
    [metrics]
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-labelledby="campana-send-title"
      >
        {/* Backdrop clickeable para cerrar en mobile */}
        <button
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Cerrar"
        />
        {/* Contenedor responsivo: sheet en mobile, card en desktop */}
        <motion.div
          role="dialog"
          aria-modal="true"
          className="
            relative w-full sm:w-[92%] md:w-[90%] lg:w-[70%] xl:w-[58%]
            max-w-none sm:max-w-3xl
            bg-zinc-900 text-white
            rounded-t-2xl sm:rounded-2xl
            shadow-2xl
            h-[85vh] sm:h-auto sm:max-h-[86vh]
            overflow-hidden
          "
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
        >
          {/* Header sticky */}
          <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur px-4 sm:px-6 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2
                  id="campana-send-title"
                  className="text-lg sm:text-2xl font-bold flex items-center gap-2"
                >
                  <FaWhatsapp className="text-green-400" /> Enviar campaña
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  {campana.nombre} — Medio: {campana.medio_envio?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-zinc-300 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Métricas + Buscador en stack responsivo */}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* <div className="flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] sm:text-xs"
                    title={c.label}
                  >
                    <span className="opacity-70">{c.label}:</span>
                    <strong>{c.val}</strong>
                  </span>
                ))}
              </div> */}
              <div className="flex items-center bg-white/10 rounded-full px-3 py-2">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={buscar}
                  placeholder="Buscar por nombre, DNI o teléfono…"
                  className="flex-1 bg-transparent outline-none text-sm px-2 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Listado: grid responsivo */}
          <div className="px-4 sm:px-6 py-4 overflow-y-auto max-h-[calc(85vh-140px)] sm:max-h-[60vh]">
            {loading ? (
              <p className="text-center text-gray-400 py-10">
                Cargando clientes…
              </p>
            ) : clientes.length === 0 ? (
              <p className="text-center text-gray-400 py-10">
                No se encontraron clientes
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {clientes.map((c) => {
                  const ya = enviados.has(c.id);
                  const destino = pickWhatsAppTo(c);
                  const puedeNormalizar = !c.telefono_e164 && !!destino;

                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border border-white/10 bg-white/[0.06] p-3 sm:p-4 transition
                        ${ya ? 'border-green-400/60 bg-green-900/20' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {c.nombre}
                          </p>
                          <p className="text-zinc-400 text-[11px] sm:text-xs break-words">
                            {c.telefono_e164 || c.telefono || 'Sin teléfono'}
                            {!destino && (
                              <span className="ml-2 text-red-400">
                                • inválido
                              </span>
                            )}
                            {puedeNormalizar && (
                              <span className="ml-2 text-emerald-400">
                                • normalizable
                              </span>
                            )}
                          </p>
                          {c.email && (
                            <p className="text-zinc-500 text-[11px] sm:text-xs truncate">
                              {c.email}
                            </p>
                          )}
                        </div>
                        {ya && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-600/20 px-2 py-1 text-[10px] sm:text-xs text-green-300">
                            <FaCheck /> Enviado
                          </span>
                        )}
                      </div>

                      {/* Acciones: stack en mobile, inline en desktop */}
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <button
                          onClick={() => verMensaje(c)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-700 hover:bg-zinc-600 px-3 py-2 text-xs sm:text-sm"
                        >
                          <FaEye /> Vista previa
                        </button>
                        <button
                          onClick={() => enviarUno(c)}
                          disabled={ya || enviando}
                          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs sm:text-sm
                            ${
                              ya
                                ? 'bg-green-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }
                            disabled:opacity-60`}
                          title={ya ? 'Enviado' : 'Enviar por WhatsApp'}
                        >
                          {ya ? (
                            <>
                              <FaCheck /> Enviado
                            </>
                          ) : (
                            <>
                              <FaPaperPlane /> Enviar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer sticky en mobile (para que el botón no “se pierda”) */}
          <div className="sticky bottom-0 z-10 bg-zinc-900/95 backdrop-blur px-4 sm:px-6 py-3 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-full font-semibold text-white"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
