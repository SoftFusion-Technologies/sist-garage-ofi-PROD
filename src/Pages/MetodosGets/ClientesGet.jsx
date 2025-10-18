// ClientesGet.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import {
  FaUserFriends,
  FaPlus,
  FaWhatsapp,
  FaTimes,
  FaUserAlt,
  FaShoppingCart,
  FaPhoneAlt,
  FaIdCard,
  FaHome,
  FaEnvelope,
  FaCalendarAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaRegCopy,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import ButtonBack from '../../Components/ButtonBack';
import AdminActions from '../../Components/AdminActions';
import { ModalFeedback } from '../../Pages/Ventas/Config/ModalFeedback.jsx';
import {
  fetchLocales,
  fetchUsuarios,
  getNombreLocal
} from '../../utils/utils.js';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import formatearFechaARG from '../../Components/formatearFechaARG';

Modal.setAppElement('#root');

const API_BASE = 'https://vps-5192960-x.dattaweb.com';

// Chip de estado "Online: Sí/No"
function OnlineBadge({ value }) {
  const on = Boolean(value);
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1',
        on
          ? 'bg-emerald-100 text-emerald-800 ring-emerald-300'
          : 'bg-rose-100 text-rose-800 ring-rose-300'
      ].join(' ')}
      title={on ? 'Cliente online' : 'Cliente no online'}
      aria-label={on ? 'Online: Sí' : 'Online: No'}
    >
      {on ? (
        <FaCheckCircle className="text-emerald-500 text-[12px]" />
      ) : (
        <FaTimesCircle className="text-rose-500 text-[12px]" />
      )}
      <span className="tracking-wide">Online: {on ? 'Sí' : 'No'}</span>
    </span>
  );
}
/* ------------------ Utils Teléfono ------------------ */
function normalizeToE164AR(num) {
  let n = String(num || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = n.slice(1);
  if (!n.startsWith('54')) n = '54' + n;
  if (!n.startsWith('549')) n = '549' + n.substring(2);
  return n;
}
function formatDisplayPhone(num) {
  const n = normalizeToE164AR(num); // 549XXXXXXXXXX
  return `+${n.slice(0, 2)} ${n.slice(2, 3)} ${n.slice(3, 7)} ${n.slice(
    7,
    9
  )}-${n.slice(9)}`;
}
function TelCell({ telefono }) {
  const [copied, setCopied] = useState(false);
  if (!telefono) return <span className="opacity-70">Sin teléfono</span>;
  const e164 = normalizeToE164AR(telefono);
  const link = `https://wa.me/${e164}`;
  const display = formatDisplayPhone(telefono || '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366] rounded-full px-3 py-1.5 text-emerald-200 hover:bg-[#25D366]/20 hover:text-white shadow-sm transition-all whitespace-nowrap"
        title="Enviar WhatsApp"
      >
        <FaWhatsapp className="text-[#25D366]" />
        <span className="tracking-wide">{display}</span>
      </a>
      <button
        type="button"
        onClick={copyToClipboard}
        className="text-xs text-gray-300 hover:text-white transition"
        title="Copiar número"
      >
        {copied ? 'Copiado' : <FaRegCopy />}
      </button>
    </div>
  );
}

/* ------------------ Skeletons ------------------ */
function SkeletonCard() {
  return (
    <div className="flex w-full min-h-[120px] bg-white/15 shadow rounded-3xl overflow-hidden border border-white/10 animate-pulse">
      <div className="w-72 bg-white/10" />
      <div className="flex-1 grid grid-cols-3 gap-6 px-6 py-5" />
      <div className="w-40 bg-white/10" />
    </div>
  );
}

/* ------------------ Paginación ------------------ */
function Pagination({ page, totalPages, onPageChange }) {
  const windowSize = 7;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded-lg bg-white/90 text-emerald-900 border border-emerald-200 disabled:opacity-50"
      >
        ‹ Anterior
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`px-3 py-1 rounded-lg ${
              page === 1
                ? 'bg-emerald-600 text-white'
                : 'bg-white/90 text-emerald-900 border border-emerald-200'
            }`}
          >
            1
          </button>
          <span className="text-white/70 px-1">…</span>
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded-lg ${
            p === page
              ? 'bg-emerald-600 text-white'
              : 'bg-white/90 text-emerald-900 border border-emerald-200 hover:bg-white'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          <span className="text-white/70 px-1">…</span>
          <button
            onClick={() => onPageChange(totalPages)}
            className={`px-3 py-1 rounded-lg ${
              page === totalPages
                ? 'bg-emerald-600 text-white'
                : 'bg-white/90 text-emerald-900 border border-emerald-200'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 rounded-lg bg-white/90 text-emerald-900 border border-emerald-200 disabled:opacity-50"
      >
        Siguiente ›
      </button>
    </div>
  );
}

/* ------------------ Componente Principal ------------------ */
export default function ClientesGet() {
  // Estado principal
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const [error, setError] = useState('');

  // Derivados para UI
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeFrom = total === 0 ? 0 : offset + 1;
  const rangeTo = Math.min(offset + clientes.length, total);

  // Modales alta/edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    dni: '',
    es_online: false
  });

  // Feedback
  const [modalFeedbackOpen, setModalFeedbackOpen] = useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState('');
  const [modalFeedbackType, setModalFeedbackType] = useState('info');

  // Catálogos
  const [locales, setLocales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Detalles
  const [detalleCliente, setDetalleCliente] = useState(null);
  const [detalleVenta, setDetalleVenta] = useState(null);

  // Debounce búsqueda
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setQ(qInput);
      setOffset(0); // reset página
    }, 350);
    return () => clearTimeout(debounceTimerRef.current);
  }, [qInput]);

  // Catálogos
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLocales(), fetchUsuarios()])
      .then(([loc, usr]) => {
        setLocales(loc);
        setUsuarios(usr);
      })
      .finally(() => setLoading(false));
  }, []);

  // Query params para v2
  const buildParams = useMemo(() => {
    const p = new URLSearchParams();
    if (q && q.trim().length) p.set('q', q.trim());
    p.set('limit', String(limit));
    p.set('offset', String(offset));
    p.set('sort', 'id');
    p.set('order', 'DESC');
    return p.toString();
  }, [q, limit, offset]);

  // Fetch paginado server-side (v2)
  const fetchClientes = async (opts = { append: false }) => {
    const { append } = opts;
    setLoading(true);
    setError('');
    const src = axios.CancelToken.source();
    try {
      const res = await axios.get(`${API_BASE}/clientes/v2?${buildParams}`, {
        cancelToken: src.token
      });
      const { data, page: meta } = res.data || {};

      // Filtro client-side por fecha (igualdad YYYY-MM-DD); total server se mantiene para paginación
      const filtered = fechaFiltro
        ? (data || []).filter(
            (c) => (c.fecha_ultima_compra || '').slice(0, 10) === fechaFiltro
          )
        : data || [];

      setClientes((prev) => (append ? [...prev, ...filtered] : filtered));
      const serverTotal = meta?.total ?? 0;
      setTotal(serverTotal);
      setHasMore(offset + limit < serverTotal);
      setFirstLoadDone(true);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError(
          err?.response?.data?.mensajeError || 'Error al obtener clientes'
        );
      }
    } finally {
      setLoading(false);
    }
    return () => src.cancel();
  };

  // Cargar cuando cambian q/limit/offset/fechaFiltro
  useEffect(() => {
    fetchClientes({ append: offset > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildParams, fechaFiltro]);

  // CRUD
  const openModal = (cliente = null) => {
    if (cliente) {
      setEditId(cliente.id);
      setFormData({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        dni: cliente.dni || '',
        es_online: !!cliente.es_online
      });
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        dni: '',
        es_online: false
      });
    }
    setModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_BASE}/clientes/${editId}`, {
          ...formData,
          es_online: formData.es_online ?? false
        });
        setModalFeedbackMsg('Cliente actualizado correctamente');
      } else {
        await axios.post(`${API_BASE}/clientes`, {
          ...formData,
          es_online: formData.es_online ?? false
        });
        setModalFeedbackMsg('Cliente creado correctamente');
      }
      setModalFeedbackType('success');
      setModalOpen(false);
      setOffset(0);
      fetchClientes({ append: false });
    } catch (err) {
      setModalFeedbackMsg(
        err?.response?.data?.mensajeError || 'Error al guardar cliente'
      );
      setModalFeedbackType('error');
    }
    setModalFeedbackOpen(true);
  };
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try {
      await axios.delete(`${API_BASE}/clientes/${id}`);
      setModalFeedbackMsg('Cliente eliminado correctamente');
      setModalFeedbackType('success');
      fetchClientes({ append: false });
    } catch (err) {
      setModalFeedbackMsg(
        err?.response?.data?.mensajeError || 'Error al eliminar cliente'
      );
      setModalFeedbackType('error');
    }
    setModalFeedbackOpen(true);
  };

  // Detalle cliente/ventas
  const openDetalleCliente = (cliente) => {
    fetch(`${API_BASE}/clientes/${cliente.id}/ventas`)
      .then((res) => res.json())
      .then((ventas) => setDetalleCliente({ ...cliente, ventas }))
      .catch(() => setDetalleCliente({ ...cliente, ventas: [] }));
  };
  const fetchDetalleVenta = (ventaId) => {
    fetch(`${API_BASE}/ventas/${ventaId}/detalle`)
      .then((res) => res.json())
      .then((data) => setDetalleVenta(data))
      .catch(() => setDetalleVenta(null));
  };

  // Paginación
  const goToPage = (p) => {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setOffset((clamped - 1) * limit);
  };
  const handleLoadMore = () => {
    if (hasMore && !loading) setOffset((prev) => prev + limit);
  };
  const onChangeLimit = (value) => {
    setLimit(Number(value));
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-900 py-10 px-3 md:px-6 relative font-sans">
      <ParticlesBackground />
      <ButtonBack />

      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <motion.h1
            className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-white uppercase"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FaUserFriends className="text-emerald-400 drop-shadow-lg" />
            Gestión de Clientes
          </motion.h1>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => onChangeLimit(e.target.value)}
              className="rounded-lg bg-emerald-950 text-emerald-100 border border-emerald-700 px-3 py-2 text-sm"
              title="Tamaño de página"
            >
              <option value={10}>10 / pág.</option>
              <option value={20}>20 / pág.</option>
              <option value={50}>50 / pág.</option>
              <option value={100}>100 / pág.</option>
            </select>

            <motion.button
              onClick={() => openModal()}
              className="text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors active:scale-95"
              whileHover={{ scale: 1.04 }}
            >
              <FaPlus /> Nuevo
            </motion.button>
          </div>
        </div>

        {/* Filtros Sticky en mobile */}
        <div className="w-full bg-white/10 p-4 md:p-5 rounded-2xl shadow-md backdrop-blur-md sticky top-0 z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs text-emerald-200 mb-1">
                Buscar
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 text-emerald-300/80" />
                <input
                  type="text"
                  placeholder="Nombre, teléfono, email, DNI..."
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-emerald-200 mb-1">
                Fecha última compra
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => {
                  setFechaFiltro(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
            </div>
            <div className="text-sm text-emerald-100/80 md:text-right">
              {firstLoadDone &&
                (fechaFiltro ? (
                  <span>
                    {clientes.length} filtrados / {total} totales
                  </span>
                ) : (
                  <span>
                    Mostrando {rangeFrom}–{rangeTo} de {total}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista Desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 gap-4 max-w-6xl mx-auto mt-6">
          {loading && clientes.length === 0 && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {!loading && clientes.length === 0 && (
            <div className="text-center text-emerald-200 py-12 rounded-2xl bg-white/5 shadow-xl">
              {error || 'No hay clientes para mostrar.'}
            </div>
          )}

          {clientes.map((c) => (
            <motion.div
              key={c.id}
              className="flex w-full min-h-[120px] bg-white/80 shadow-xl rounded-3xl border border-emerald-100 hover:shadow-2xl transition-all overflow-hidden"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              {/* Izquierda: identidad */}
              <div className="flex flex-col justify-center gap-1 p-6 w-72 bg-gradient-to-br from-emerald-700/90 to-emerald-900/90 text-white">
                <div className="text-xl font-extrabold flex items-center gap-2">
                  {c.nombre}
                  <OnlineBadge value={c.es_online} />
                </div>
                <div className="opacity-90 text-sm">
                  {c.email || <span className="opacity-70">Sin email</span>}
                </div>
                <TelCell telefono={c.telefono} />
                <div className="text-xs text-emerald-200">
                  <span className="opacity-80">DNI:</span>{' '}
                  {c.dni || <span className="opacity-70">—</span>}
                </div>
                {c.es_online && (
                  <span className="ml-2 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    ONLINE
                  </span>
                )}
              </div>

              {/* Centro: datos */}
              <div className="flex-1 grid grid-cols-3 gap-6 px-6 py-5 bg-white/70 text-gray-800 items-center text-sm">
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold">
                    Fecha Alta
                  </div>
                  <div className="text-base">
                    {formatearFechaARG(c.fecha_alta)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold">
                    Última Compra
                  </div>
                  <div className="text-base">
                    {formatearFechaARG(c.fecha_ultima_compra) || (
                      <span className="opacity-60">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold">
                    Dirección
                  </div>
                  <div
                    className="text-base truncate max-w-[22ch]"
                    title={c.direccion || ''}
                  >
                    {c.direccion || <span className="opacity-60">—</span>}
                  </div>
                </div>
              </div>

              {/* Derecha: acciones */}
              <div className="flex flex-col items-center justify-center px-5 gap-3 bg-white/70 backdrop-blur-xl">
                <button
                  className="text-emerald-700 text-xs font-semibold hover:text-emerald-600 transition"
                  onClick={() => openDetalleCliente(c)}
                  title="Ver detalle del cliente"
                >
                  Ver detalle
                </button>
                <AdminActions
                  onEdit={() => openModal(c)}
                  onDelete={() => handleDelete(c.id)}
                />
              </div>
            </motion.div>
          ))}

          {/* Paginación y Cargar más */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}

          {hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-white/90 text-emerald-800 border border-emerald-200 hover:bg-white shadow"
              >
                {loading
                  ? 'Cargando…'
                  : `Cargar más (mostrando ${rangeTo} de ${total})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4 max-w-xl mx-auto mt-8">
        {loading && clientes.length === 0 && (
          <>
            <div className="h-28 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-28 rounded-2xl bg-white/10 animate-pulse" />
            <div className="h-28 rounded-2xl bg-white/10 animate-pulse" />
          </>
        )}

        {!loading && clientes.length === 0 && (
          <div className="text-center text-emerald-200 py-8">
            {error || 'No hay clientes para mostrar.'}
          </div>
        )}

        {clientes.map((c) => (
          <motion.div
            key={c.id}
            className="bg-emerald-900/70 rounded-2xl p-5 shadow-xl flex flex-col gap-2 border border-emerald-700/40"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h3 className="text-lg font-bold text-emerald-50 flex items-center gap-2">
                  {c.nombre}
                  <OnlineBadge value={c.es_online} />
                </h3>

                <div className="text-sm text-emerald-200/90">
                  {c.email || 'Sin email'}
                </div>
                <div className="text-sm text-emerald-200/90">
                  {c.dni || 'Sin DNI'}
                </div>

                <div
                  className="text-sm text-emerald-200/90 truncate"
                  title={c.direccion || ''}
                >
                  {c.direccion || 'Sin dirección'}
                </div>
              </div>
              <AdminActions
                onEdit={() => openModal(c)}
                onDelete={() => handleDelete(c.id)}
              />
            </div>

            <div className="text-sm text-emerald-300">
              Tel:{' '}
              {c.telefono ? (
                <a
                  href={`https://wa.me/${normalizeToE164AR(c.telefono)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-emerald-200 transition"
                  title="Enviar WhatsApp"
                >
                  {formatDisplayPhone(c.telefono)}
                  <FaWhatsapp className="ml-1" />
                </a>
              ) : (
                '-'
              )}
            </div>

            <div className="text-xs text-emerald-200/90 mt-1">
              Última compra:{' '}
              {c.fecha_ultima_compra ? (
                new Date(c.fecha_ultima_compra).toLocaleDateString()
              ) : (
                <span className="italic text-emerald-200/60">Nunca</span>
              )}
            </div>

            <button
              className="self-start mt-1 text-emerald-300 text-xs font-semibold hover:text-emerald-200 transition"
              onClick={() => openDetalleCliente(c)}
              title="Ver detalle del cliente"
            >
              Ver detalle
            </button>
          </motion.div>
        ))}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        )}

        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-emerald-100 border border-emerald-600/60 hover:bg-emerald-700/90"
            >
              {loading
                ? 'Cargando…'
                : `Cargar más (mostrando ${rangeTo} de ${total})`}
            </button>
          </div>
        )}
      </div>

      {/* Modal Alta/Edición */}
      <AnimatePresence>
        {modalOpen && (
          <Modal
            isOpen={modalOpen}
            onRequestClose={() => setModalOpen(false)}
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-emerald-500"
            closeTimeoutMS={250}
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-emerald-700">
                {editId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="DNI"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({ ...formData, dni: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />

                <div className="text-right">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-white font-medium rounded-lg"
                  >
                    {editId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Detalle Cliente */}
      <AnimatePresence>
        {detalleCliente && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              className="bg-gradient-to-br from-[#1e242f]/90 via-[#1a222c] to-[#171b24] rounded-3xl max-w-2xl w-full shadow-2xl p-8 border border-emerald-500 relative"
            >
              <button
                className="absolute top-4 right-5 text-gray-400 hover:text-emerald-400 text-2xl transition-all"
                onClick={() => setDetalleCliente(null)}
              >
                <FaTimes />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-emerald-600/30 rounded-full p-3 text-2xl text-emerald-300 shadow-lg">
                  <FaUserAlt />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white drop-shadow">
                      {detalleCliente.nombre}
                    </span>
                    <OnlineBadge value={detalleCliente.es_online} />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    {detalleCliente.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <FaPhoneAlt /> {detalleCliente.telefono}
                      </span>
                    )}
                    {detalleCliente.email && (
                      <span className="inline-flex items-center gap-1">
                        <FaEnvelope /> {detalleCliente.email}
                      </span>
                    )}
                    {detalleCliente.dni && (
                      <span className="inline-flex items-center gap-1">
                        <FaIdCard /> {detalleCliente.dni}
                      </span>
                    )}

                    {detalleCliente.direccion && (
                      <span className="inline-flex items-center gap-1">
                        <FaHome /> {detalleCliente.direccion}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs text-gray-200">
                  Última compra:&nbsp;
                  {detalleCliente.fecha_ultima_compra ? (
                    <b className="text-white">
                      {new Date(
                        detalleCliente.fecha_ultima_compra
                      ).toLocaleDateString()}
                    </b>
                  ) : (
                    <span className="italic text-emerald-200/80">Nunca</span>
                  )}
                </span>
              </div>

              <h3 className="font-bold text-lg text-emerald-400 mb-2 mt-4 flex items-center gap-2">
                <FaShoppingCart /> Historial de compras
              </h3>
              <ul className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar mb-2">
                {detalleCliente.ventas?.length ? (
                  detalleCliente.ventas.map((venta) => (
                    <li
                      key={venta.id}
                      className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 bg-emerald-950/60 px-4 py-3 rounded-xl hover:bg-emerald-800/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-200 tracking-wide">
                          #{venta.id}
                        </span>
                        <span className="text-xs text-emerald-300 flex items-center gap-1">
                          <FaCalendarAlt />{' '}
                          {new Date(venta.fecha).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-300 ml-2">
                          Total:{' '}
                          <span className="font-bold text-emerald-200">
                            ${Number(venta.total).toLocaleString('es-AR')}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 md:mt-0">
                        <button
                          onClick={() => fetchDetalleVenta(venta.id)}
                          className="text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-700/80 transition-all"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-200 text-center py-4">
                    Sin compras registradas.
                  </li>
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Detalle Venta */}
        {detalleVenta && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 22, opacity: 0 }}
              className="bg-gradient-to-br from-[#262b39]/90 via-[#232631] to-[#202331]/90 p-8 rounded-3xl max-w-2xl w-full shadow-2xl border border-emerald-500 relative"
            >
              <button
                className="absolute top-4 right-5 text-gray-400 hover:text-emerald-400 text-2xl transition-all"
                onClick={() => setDetalleVenta(null)}
              >
                <FaTimes />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <FaShoppingCart className="text-emerald-400 text-2xl" />
                <h3 className="text-xl font-black text-emerald-400 tracking-tight">
                  Detalle Venta #{detalleVenta.id}
                </h3>
              </div>
              <div className="mb-3 text-sm text-gray-300 space-y-1">
                <div>
                  <b>Cliente:</b>{' '}
                  <span className="text-white">
                    {detalleVenta.cliente?.nombre || 'Consumidor Final'}
                  </span>
                  {detalleVenta.cliente?.dni && (
                    <span className="ml-2 text-xs text-gray-400">
                      DNI: {detalleVenta.cliente.dni}
                    </span>
                  )}
                </div>
                <div>
                  <b>Fecha:</b> {new Date(detalleVenta.fecha).toLocaleString()}
                </div>
                <div>
                  <b>Medio de pago:</b>{' '}
                  <span className="inline-flex items-center gap-1">
                    <FaCreditCard className="text-emerald-300" />
                    <b>
                      {detalleVenta.venta_medios_pago?.[0]?.medios_pago
                        ?.nombre || 'Efectivo'}
                    </b>
                  </span>
                </div>
                <div>
                  <b>Vendedor:</b>{' '}
                  <span className="text-emerald-200">
                    {detalleVenta.usuario?.nombre || '-'}
                  </span>
                </div>
                <div>
                  <b>Local:</b>{' '}
                  <span className="text-emerald-200">
                    {getNombreLocal(
                      detalleVenta.usuario?.local_id || '-',
                      locales
                    )}
                  </span>
                </div>
              </div>
              <ul className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar mb-3 mt-3">
                {detalleVenta.detalles?.map((d) => (
                  <li
                    key={d.id}
                    className="flex justify-between items-center px-3 py-2 bg-emerald-900/10 rounded-lg"
                  >
                    <span className="text-white">
                      {d.stock.producto.nombre}
                      {d.stock.talle && (
                        <span className="text-gray-400 ml-2">
                          Talle: {d.stock.talle.nombre}
                        </span>
                      )}
                      {d.stock.codigo_sku && (
                        <span className="ml-2 text-xs text-emerald-300">
                          SKU: {d.stock.codigo_sku}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">x{d.cantidad}</span>
                    <span className="font-bold text-emerald-300">
                      $
                      {Number(d.precio_unitario * d.cantidad).toLocaleString(
                        'es-AR'
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="text-right text-lg text-white font-black mt-4">
                <FaMoneyBillWave className="inline-block mr-2 text-emerald-400" />
                Total:{' '}
                <span className="text-emerald-200">
                  ${Number(detalleVenta.total).toLocaleString('es-AR')}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalFeedback
        open={modalFeedbackOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
        type={modalFeedbackType}
      />
    </div>
  );
}
