import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaFolderOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaSortAlphaDown,
  FaSortAlphaUp
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import AdminActions from '../../Components/AdminActions';

Modal.setAppElement('#root');

const CategoriasGet = () => {
  // data
  // estados nuevos
  const [categorias, setCategorias] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [sort, setSort] = useState('nombre');
  const [dir, setDir] = useState('asc');
  const [meta, setMeta] = useState({ page: 1, per_page: 12, total: 0 });
  // opcional: filtro estado
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [search, setSearch] = useState('');

  // modales / forms
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo'
  });

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');

  // calcular rango mostrado
  const rango = useMemo(() => {
    const from = meta.total > 0 ? (meta.page - 1) * meta.per_page + 1 : 0;
    const to = meta.total > 0 ? from + (categorias?.length || 0) - 1 : 0;
    return { from, to };
  }, [meta, categorias]);

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(
        'https://vps-5192960-x.dattaweb.com/categorias',
        {
          params: {
            page,
            per_page: perPage,
            q: (search || '').trim() || undefined,
            sort,
            dir,
            estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined
          }
        }
      );
      setCategorias(res.data.data || []);
      setMeta(res.data.meta || { page: 1, per_page: perPage, total: 0 });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  // fetch cuando cambian los criterios
  useEffect(() => {
    fetchCategorias();
  }, [page, perPage, sort, dir, estadoFiltro]); // y también cuando toques search con un botón “buscar” o debounce

  // búsqueda: resetea a página 1
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchCategorias();
    }, 1); // pequeño debounce
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openModal = (categoria = null) => {
    setEditId(categoria ? categoria.id : null);
    setFormValues(
      categoria
        ? {
            nombre: categoria.nombre ?? '',
            descripcion: categoria.descripcion ?? '',
            estado: categoria.estado ?? 'activo'
          }
        : { nombre: '', descripcion: '', estado: 'activo' }
    );
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(
          `https://vps-5192960-x.dattaweb.com/categorias/${editId}`,
          formValues
        );
      } else {
        await axios.post(
          'https://vps-5192960-x.dattaweb.com/categorias',
          formValues
        );
      }
      // tras guardar, refrescar y volver a la primera página si estás creando
      if (!editId) setPage(1);
      await fetchCategorias();
      setModalOpen(false);
    } catch (error) {
      console.error('Error al guardar categoría:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://vps-5192960-x.dattaweb.com/categorias/${id}`);
      // si borramos el último de la página, retrocedemos una página
      if (categorias.length === 1 && meta.page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchCategorias();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
      } else {
        console.error('Error al eliminar categoría:', err);
      }
    }
  };

  // Helpers de paginación (derivados del meta)
  const total = Number(meta?.total ?? 0);
  const curPage = Number(meta?.page ?? page);
  const per = Number(meta?.per_page ?? perPage);
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, per)));

  const hasPrev = curPage > 1;
  const hasNext = curPage < pageCount;

  const from = total === 0 ? 0 : (curPage - 1) * per + 1;
  const to = total === 0 ? 0 : Math.min(curPage * per, total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ButtonBack />
      <ParticlesBackground />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2 uppercase">
            <FaFolderOpen /> Categorías
          </h1>

          <div className="flex flex-col sm:flex-row gap-3">
            <BulkUploadButton tabla="categorias" onSuccess={fetchCategorias} />
            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nueva Categoría
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {/* Buscador + (opcional) filtro estado */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:max-w-sm px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setPage(1);
              fetchCategorias();
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold"
          >
            Buscar
          </button>

          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <select
            value={`${sort}:${dir}`}
            onChange={(e) => {
              const [s, d] = e.target.value.split(':');
              setSort(s);
              setDir(d);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
          >
            <option value="nombre:asc">Nombre ↑</option>
            <option value="nombre:desc">Nombre ↓</option>
            <option value="cantidadProductos:desc"># Productos ↓</option>
            <option value="cantidadProductos:asc"># Productos ↑</option>
          </select>

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white"
          >
            {[6, 12, 24, 48, 100].map((n) => (
              <option key={n} value={n}>
                {n} / pág
              </option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categorias.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02]"
            >
              <h2 className="text-xl font-bold text-white">ID: {cat.id}</h2>
              <h2 className="text-xl font-bold text-blue-300">{cat.nombre}</h2>

              {cat.descripcion && (
                <p className="text-sm text-gray-300 mt-1">{cat.descripcion}</p>
              )}

              <p className="text-sm mt-2">
                <span className="font-semibold text-blue-400">
                  {cat.cantidadProductos ?? 0}
                </span>{' '}
                producto{(cat.cantidadProductos ?? 0) !== 1 && 's'} asignado
                {(cat.cantidadProductos ?? 0) !== 1 && 's'}
              </p>

              <p
                className={`text-sm mt-2 font-semibold ${
                  cat.estado === 'inactivo' ? 'text-red-400' : 'text-green-400'
                }`}
              >
                Estado: {cat.estado ?? 'activo'}
              </p>

              <AdminActions
                onEdit={() => openModal(cat)}
                onDelete={() => handleDelete(cat.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination footer */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-white/80">
            {from}–{to} de {total}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => hasPrev && setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-2 rounded-lg border ${
                hasPrev
                  ? 'bg-white/10 hover:bg-white/20 border-white/10'
                  : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
              }`}
              title="Anterior"
            >
              <FaChevronLeft />
            </button>

            <span className="text-sm px-2">
              Página {curPage} / {pageCount}
            </span>

            <button
              disabled={!hasNext}
              onClick={() =>
                hasNext && setPage((p) => Math.min(pageCount, p + 1))
              }
              className={`px-3 py-2 rounded-lg border ${
                hasNext
                  ? 'bg-white/10 hover:bg-white/20 border-white/10'
                  : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
              }`}
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Modal Crear/Editar */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-blue-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            {editId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={formValues.estado}
              onChange={(e) =>
                setFormValues({ ...formValues, estado: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal confirm delete */}
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
                    `https://vps-5192960-x.dattaweb.com/categorias/${confirmDelete}?forzar=true`
                  );
                  setConfirmDelete(null);
                  // ajustar página si corresponde
                  if (categorias.length === 1 && meta.page > 1) {
                    setPage((p) => p - 1);
                  } else {
                    fetchCategorias();
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

export default CategoriasGet;
