import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaGift,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCubes,
  FaCoins,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import ButtonBack from '../../../Components/ButtonBack';
import ParticlesBackground from '../../../Components/ParticlesBackground';
import AdminActions from '../../../Components/AdminActions';
import { formatearPeso } from '../../../utils/formatearPeso';
import { Link } from 'react-router-dom';

Modal.setAppElement('#root');

const API = 'https://vps-5192960-x.dattaweb.com';

const useDebounce = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const CombosGet = () => {
  const [combos, setCombos] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 1,
    offset: 0
  });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 450);
  const [estadoFilter, setEstadoFilter] = useState(''); // '', 'activo', 'inactivo'
  const [loading, setLoading] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecioFijo, setFormPrecioFijo] = useState('');
  const [formCantidadItems, setFormCantidadItems] = useState('');
  const [formEstado, setFormEstado] = useState('activo');
  const [formError, setFormError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  const page = meta.page;
  const pageSize = meta.pageSize;

  const fetchCombos = async (next = { page, pageSize }) => {
    setLoading(true);
    try {
      const params = {
        page: next.page,
        limit: next.pageSize
      };
      if (debouncedSearch?.trim()) params.q = debouncedSearch.trim();
      if (estadoFilter) params.estado = estadoFilter;

      const { data } = await axios.get(`${API}/combos`, { params });

      setCombos(data.data || []);
      setMeta(
        data.meta || {
          total: 0,
          page: 1,
          pageSize: next.pageSize,
          totalPages: 1,
          offset: 0
        }
      );
    } catch (error) {
      console.error('Error al obtener combos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos({ page: 1, pageSize }); // reset a página 1 ante cambios
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, estadoFilter]);

  useEffect(() => {
    fetchCombos({ page: 1, pageSize: 12 });
  }, []);

  const openModal = (combo = null) => {
    setFormError('');
    setEditId(combo ? combo.id : null);
    setFormNombre(combo?.nombre || '');
    setFormDescripcion(combo?.descripcion || '');
    setFormPrecioFijo(combo?.precio_fijo || '');
    setFormCantidadItems(combo?.cantidad_items || '');
    setFormEstado(combo?.estado || 'activo');
    setModalOpen(true);
  };

  const validateForm = () => {
    if (!formNombre || formNombre.trim().length < 3)
      return 'El nombre debe tener al menos 3 caracteres.';
    const precio = Number(formPrecioFijo);
    if (!Number.isFinite(precio) || precio <= 0)
      return 'El precio debe ser mayor a 0.';
    const cant = parseInt(formCantidadItems, 10);
    if (!Number.isInteger(cant) || cant <= 0)
      return 'La cantidad de items debe ser un entero mayor a 0.';
    if (!['activo', 'inactivo'].includes(formEstado)) return 'Estado inválido.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    const payload = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion || null,
      precio_fijo: Number(formPrecioFijo),
      cantidad_items: parseInt(formCantidadItems, 10),
      estado: formEstado
    };

    try {
      if (editId) {
        await axios.put(`${API}/combos/${editId}`, payload);
      } else {
        await axios.post(`${API}/combos`, payload);
      }
      setModalOpen(false);
      fetchCombos({ page: 1, pageSize }); // refrescamos al inicio
    } catch (error) {
      console.error('Error al guardar combo:', error);
      setFormError(error?.response?.data?.mensajeError || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/combos/${id}`);
      // si borramos el último de la página, retrocedemos una página si corresponde
      const isLastOnPage = combos.length === 1 && meta.page > 1;
      const nextPage = isLastOnPage ? meta.page - 1 : meta.page;
      fetchCombos({ page: nextPage, pageSize });
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
      } else {
        console.error('Error al eliminar combo:', err);
      }
    }
  };

  // Paginación UI
  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  const goTo = (p) =>
    fetchCombos({ page: Math.min(Math.max(1, p), meta.totalPages), pageSize });
  const next = () => canNext && goTo(meta.page + 1);
  const prev = () => canPrev && goTo(meta.page - 1);

  // Paginador compacto con saltos
  const pages = useMemo(() => {
    const total = meta.totalPages || 1;
    const current = meta.page || 1;
    const arr = new Set([
      1,
      2,
      total,
      total - 1,
      current,
      current - 1,
      current + 1
    ]);
    const valid = [...arr]
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);
    // insertar puntos suspensivos
    const out = [];
    for (let i = 0; i < valid.length; i++) {
      out.push(valid[i]);
      if (i < valid.length - 1 && valid[i + 1] - valid[i] > 1) out.push('...');
    }
    return out;
  }, [meta.page, meta.totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ButtonBack />
      <ParticlesBackground />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-2 uppercase">
            <FaGift /> Combos
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar combo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
            <button
              onClick={() => openModal()}
              className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nuevo Combo
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="text-sm text-gray-300 mb-3">
          {loading ? (
            'Cargando…'
          ) : (
            <>
              Mostrando <strong>{combos.length}</strong> de{' '}
              <strong>{meta.total}</strong> resultados
            </>
          )}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {combos.map((combo) => (
            <motion.div
              key={combo.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02]"
            >
              <h2 className="text-xl font-bold text-white">{combo.nombre}</h2>
              <p className="text-sm text-gray-300 mb-2">
                {combo.descripcion || 'Sin descripción'}
              </p>
              <p className="text-sm flex items-center gap-1">
                <FaCubes /> Items: <strong>{combo.cantidad_items}</strong>
              </p>
              <p className="text-sm flex items-center gap-1 text-emerald-300">
                <FaCoins /> Precio:{' '}
                <strong>{formatearPeso(combo.precio_fijo)}</strong>
              </p>
              <p className="text-sm mt-3 flex items-center gap-2">
                Estado:{' '}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    combo.estado === 'activo'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  ● {combo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </p>

              <AdminActions
                onEdit={() => openModal(combo)}
                onDelete={() => handleDelete(combo.id)}
              />
              <Link
                to={`/dashboard/stock/combos/${combo.id}/permitidos`}
                className="text-sm mt-2 inline-block text-purple-300 hover:text-purple-500 font-semibold"
              >
                Editar productos permitidos
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-400">
            Página <strong>{meta.page}</strong> de{' '}
            <strong>{meta.totalPages}</strong> • Offset{' '}
            <strong>{meta.offset}</strong> • Tamaño{' '}
            <strong>{meta.pageSize}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              disabled={!canPrev}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50"
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            {pages.map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="px-3 py-2 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`px-3 py-2 rounded-lg border ${
                    p === meta.page
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={next}
              disabled={!canNext}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50"
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Modal crear/editar */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-purple-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-purple-600">
            {editId ? 'Editar Combo' : 'Nuevo Combo'}
          </h2>
          {formError && (
            <div className="mb-3 text-sm text-red-600">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del combo"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
              minLength={3}
            />
            <input
              type="number"
              placeholder="Precio fijo"
              value={formPrecioFijo}
              onChange={(e) => setFormPrecioFijo(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              step="0.01"
              min="0.01"
              required
            />
            <input
              type="number"
              placeholder="Cantidad de productos requeridos"
              value={formCantidadItems}
              onChange={(e) => setFormCantidadItems(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              min="1"
              step="1"
              required
            />
            <textarea
              placeholder="Descripción del combo"
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows="3"
            />
            <select
              value={formEstado}
              onChange={(e) => setFormEstado(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal advertencia eliminar */}
        <Modal
          isOpen={!!confirmDelete}
          onRequestClose={() => setConfirmDelete(null)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-yellow-500"
        >
          <h2 className="text-xl font-bold text-yellow-600 mb-4">
            Advertencia
          </h2>
          <p className="mb-6 text-gray-800">{warningMessage}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await axios.delete(
                    `${API}/combos/${confirmDelete}?forzar=true`
                  );
                  setConfirmDelete(null);
                  fetchCombos({ page: 1, pageSize });
                } catch (error) {
                  console.error('Error al eliminar con forzado:', error);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CombosGet;
