import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaTshirt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack';
import ParticlesBackground from '../../Components/ParticlesBackground';
import AdminActions from '../../Components/AdminActions';

Modal.setAppElement('#root');

const API = 'https://vps-5192960-x.dattaweb.com/talles';

// simple hook de debounce
function useDebouncedValue(value, delay = 400) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return deb;
}

const TallesGet = () => {
  // data + ui
  const [talles, setTalles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // filtros y control de tabla
  const [search, setSearch] = useState('');
  const searchDeb = useDebouncedValue(search, 1);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');

  // paginación/orden
  const [page, setPage] = useState(1); // 1-based
  const [limit, setLimit] = useState(12); // 12 por página (cards)
  const [sort, setSort] = useState('tipo_categoria'); // campo por defecto
  const [order, setOrder] = useState('asc'); // 'asc' | 'desc'

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageCount: 1,
    limit: 12
  });

  // modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    tipo_categoria: 'ropa'
  });

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  // cancelación de requests al cambiar filtros rápido
  const cancelRef = useRef(null);

  // fetch server-side
  const fetchPage = async ({
    page: p = page,
    limit: l = limit,
    sort: s = sort,
    order: o = order,
    q = searchDeb,
    tipo = categoriaFiltro
  } = {}) => {
    if (cancelRef.current) {
      cancelRef.current.cancel('cancelled');
    }
    const source = axios.CancelToken.source();
    cancelRef.current = source;

    setLoading(true);
    setErrMsg('');
    try {
      const params = {
        page: p,
        limit: l,
        sort: s,
        order: o
      };
      if (q?.trim()) params.q = q.trim();
      if (tipo && tipo !== 'todos') params.tipo_categoria = tipo;

      const res = await axios.get(API, { params, cancelToken: source.token });

      // backend devuelve { data, meta, links } (según definimos)
      const rows = Array.isArray(res.data) ? res.data : res.data.data;
      const m = res.data.meta || {
        total: rows.length,
        page: p,
        pageCount: 1,
        limit: l
      };

      // ⬇️ forzamos a número y calculamos pageCount si falta
      const metaNorm = {
        total: Number(m.total) || 0,
        page: Number(m.page) || 1,
        limit: Number(m.limit) || l,
        pageCount:
          Number(m.pageCount) ||
          Math.max(
            1,
            Math.ceil((Number(m.total) || 0) / (Number(m.limit) || l))
          )
      };

      setTalles(rows);
      setMeta(metaNorm);
      setPage(metaNorm.page);
      setLimit(metaNorm.limit);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setErrMsg(
          err.response?.data?.mensajeError ||
            err.message ||
            'No se pudieron obtener los talles'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // dispara fetch al cambiar filtros/orden/paginación
  useEffect(() => {
    fetchPage({ page: 1 }); // reset a página 1 cuando cambian filtros/búsqueda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDeb, categoriaFiltro, sort, order, limit]);

  // cambiar orden con click
  const toggleSort = (field) => {
    if (sort !== field) {
      setSort(field);
      setOrder('asc');
    } else {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  // helpers
  const orderIcon = (field) => {
    if (sort !== field) return <FaSort className="opacity-60" />;
    return order === 'asc' ? (
      <FaSortUp className="opacity-100" />
    ) : (
      <FaSortDown className="opacity-100" />
    );
  };

  // CRUD modal
  const openModal = (talle = null) => {
    if (talle) {
      setEditId(talle.id);
      setFormValues({
        nombre: talle.nombre || '',
        descripcion: talle.descripcion || '',
        tipo_categoria: talle.tipo_categoria || 'ropa'
      });
    } else {
      setEditId(null);
      setFormValues({ nombre: '', descripcion: '', tipo_categoria: 'ropa' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`https://vps-5192960-x.dattaweb.com/talles/${editId}`, formValues);
      } else {
        await axios.post('https://vps-5192960-x.dattaweb.com/talles', formValues);
      }
      setModalOpen(false);
      // refrescar manteniendo filtros y página (si agregaste un ítem quizá quieras saltar a page=1)
      fetchPage();
    } catch (error) {
      console.error('Error al guardar talle:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://vps-5192960-x.dattaweb.com/talles/${id}`);
      // si borramos el último de la página, reacomodar página
      if (talles.length === 1 && page > 1) {
        fetchPage({ page: page - 1 });
      } else {
        fetchPage();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
      } else {
        console.error('Error al eliminar talle:', err);
      }
    }
  };

  // info de rango mostrado
  const rangeText = useMemo(() => {
    const total = Number(meta?.total) || 0;
    const pageNum = Number(meta?.page) || 1;
    const perPage = Number(meta?.limit) || talles?.length || 0;

    if (!total || !perPage) return `0 de ${total}`;

    const start = (pageNum - 1) * perPage + 1;
    const end = Math.min(pageNum * perPage, total);
    return `${start}–${end} de ${total}`;
  }, [meta, talles.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ButtonBack />
      <ParticlesBackground />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-pink-400 flex items-center gap-2 uppercase">
            <FaTshirt /> Talles
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar talle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="todos">Todas las categorías</option>
              <option value="ropa">Ropa</option>
              <option value="calzado">Calzado</option>
              <option value="accesorio">Accesorio</option>
            </select>
            <button
              onClick={() => openModal()}
              className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <FaPlus /> Nuevo Talle
            </button>
          </div>
        </div>

        {/* Barra de orden y tamaño de página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Ordenar por:</span>
            <button
              type="button"
              onClick={() => toggleSort('tipo_categoria')}
              className={`text-sm px-3 py-1 rounded-lg border ${
                sort === 'tipo_categoria'
                  ? 'border-pink-500'
                  : 'border-white/10'
              } bg-white/5 hover:bg-white/10 flex items-center gap-2`}
            >
              Categoría {orderIcon('tipo_categoria')}
            </button>
            <button
              type="button"
              onClick={() => toggleSort('nombre')}
              className={`text-sm px-3 py-1 rounded-lg border ${
                sort === 'nombre' ? 'border-pink-500' : 'border-white/10'
              } bg-white/5 hover:bg-white/10 flex items-center gap-2`}
            >
              Nombre {orderIcon('nombre')}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden sm:inline">
              por página
            </span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1 rounded-lg border border-white/10 bg-white/5"
            >
              {[6, 12, 24, 48, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* contenido */}
        {errMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200">
            {errMsg}
          </div>
        )}

        {loading ? (
          // skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: Math.min(limit, 9) }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : talles.length === 0 ? (
          <div className="text-white/70 text-center py-16">
            No hay resultados para los filtros aplicados.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {talles.map((talle) => (
              <motion.div
                key={talle.id}
                layout
                className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.01] transition"
              >
                <h2 className="text-sm font-bold text-white/70">
                  ID: {talle.id}
                </h2>
                <h3 className="text-xl font-bold text-pink-300">
                  {talle.nombre}{' '}
                  <span className="text-white/70">
                    ({talle.tipo_categoria})
                  </span>
                </h3>
                {talle.descripcion && (
                  <p className="text-sm text-gray-300 mt-1">
                    {talle.descripcion}
                  </p>
                )}
                <AdminActions
                  onEdit={() => openModal(talle)}
                  onDelete={() => handleDelete(talle.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* footer de paginación */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-white/70">{rangeText}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
              onClick={() => fetchPage({ page: 1 })}
              disabled={page <= 1 || loading}
              title="Primera página"
            >
              <FaAngleDoubleLeft />
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
              onClick={() => fetchPage({ page: page - 1 })}
              disabled={page <= 1 || loading}
              title="Página anterior"
            >
              <FaChevronLeft />
            </button>
            <span className="text-sm px-2">
              Página <b>{meta.page}</b> de <b>{meta.pageCount}</b>
            </span>
            <button
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
              onClick={() => fetchPage({ page: page + 1 })}
              disabled={page >= meta.pageCount || loading}
              title="Página siguiente"
            >
              <FaChevronRight />
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50"
              onClick={() => fetchPage({ page: meta.pageCount })}
              disabled={page >= meta.pageCount || loading}
              title="Última página"
            >
              <FaAngleDoubleRight />
            </button>
          </div>
        </div>

        {/* Modal CRUD */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-pink-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-pink-600">
            {editId ? 'Editar Talle' : 'Nuevo Talle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del Talle"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <select
              value={formValues.tipo_categoria}
              onChange={(e) =>
                setFormValues({ ...formValues, tipo_categoria: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="ropa">Ropa</option>
              <option value="calzado">Calzado</option>
              <option value="accesorio">Accesorio</option>
            </select>

            <div className="text-right">
              <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal confirm delete (con forzado) */}
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
                    `https://vps-5192960-x.dattaweb.com/talles/${confirmDelete}?forzar=true`
                  );
                  setConfirmDelete(null);
                  // reacomodar página si quedó vacía
                  if (talles.length === 1 && page > 1) {
                    fetchPage({ page: page - 1 });
                  } else {
                    fetchPage();
                  }
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

export default TallesGet;
