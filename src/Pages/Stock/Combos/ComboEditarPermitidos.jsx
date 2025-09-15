import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaBoxOpen,
  FaFolderOpen,
  FaTrashAlt,
  FaPlusCircle,
  FaExchangeAlt
} from 'react-icons/fa';
import ButtonBack from '../../../Components/ButtonBack';
import ParticlesBackground from '../../../Components/ParticlesBackground';

const API_URL = 'https://vps-5192960-x.dattaweb.com';

// pequeñas utilidades
const useDebounce = (value, delay = 350) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const PageSelector = ({ page, totalPages, onPage }) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="flex items-center justify-between text-sm text-gray-300 mt-4">
      <button
        onClick={() => canPrev && onPage(page - 1)}
        disabled={!canPrev}
        className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span>
        {' '}
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>{' '}
      </span>
      <button
        onClick={() => canNext && onPage(page + 1)}
        disabled={!canNext}
        className="px-3 py-1 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50"
      >
        Siguiente →
      </button>
    </div>
  );
};

const ComboEditarPermitidos = () => {
  const { id } = useParams();

  const [combo, setCombo] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [tab, setTab] = useState('asignados'); // 'asignados' | 'productos' | 'categorias'

  // Búsquedas
  const [busquedaProd, setBusquedaProd] = useState('');
  const debouncedProd = useDebounce(busquedaProd, 350);
  const [busquedaCat, setBusquedaCat] = useState('');
  const debouncedCat = useDebounce(busquedaCat, 350);

  // Paginación local
  const [pageProd, setPageProd] = useState(1);
  const [pageCat, setPageCat] = useState(1);
  const pageSize = 12;

  // Modal de talles (agregar o cambiar)
  const [modalProducto, setModalProducto] = useState(null); // { id, nombre, talles: [...] }
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);
  const [loadingTalles, setLoadingTalles] = useState(false);
  const [errorTalles, setErrorTalles] = useState('');
  const [modoCambio, setModoCambio] = useState(null); // { permId, productoId }

  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const fetchDatos = async () => {
    setLoading(true); // << asegura loading al inicio
    try {
      const [comboRes, productosRes, categoriasRes, asignadosRes] =
        await Promise.all([
          axios.get(`${API_URL}/combos/${id}`),
          axios.get(`${API_URL}/productos`, {
            params: { page: 1, limit: 500, estado: 'activo' } // pide bastante
          }),
          axios.get(`${API_URL}/categorias/all`),
          axios.get(`${API_URL}/combo-productos-permitidos/${id}`)
        ]);

      // --- Normalizaciones robustas ---
      const productosJson = productosRes?.data;
      const productosList = Array.isArray(productosJson)
        ? productosJson
        : productosJson?.data ?? []; // << si viene paginado

      const categoriasList = Array.isArray(categoriasRes?.data)
        ? categoriasRes.data
        : [];

      const asignadosList = Array.isArray(asignadosRes?.data)
        ? asignadosRes.data
        : [];

      setCombo(comboRes?.data ?? null);
      setProductos(productosList);
      setCategorias(categoriasList);
      setAsignados(asignadosList);
    } catch (err) {
      console.error('Error al cargar datos del combo:', err);
      // fallbacks para que el render no crashee ni quede cargando
      setCombo(null);
      setProductos([]);
      setCategorias([]);
      setAsignados([]);
    } finally {
      setLoading(false); // << SIEMPRE baja el loading
    }
  };

  useEffect(() => {
    fetchDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const eliminarAsignado = async (permId) => {
    if (!window.confirm('¿Eliminar este producto o categoría del combo?'))
      return;
    try {
      await axios.delete(`${API_URL}/combo-productos-permitidos/${permId}`);
      fetchDatos();
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
    }
  };

  const agregarProductoConTalle = async (producto_id, talle_id = null) => {
    try {
      await axios.post(`${API_URL}/combo-productos-permitidos`, {
        combo_id: parseInt(id, 10),
        producto_id,
        talle_id
      });
      await fetchDatos();
    } catch (err) {
      console.error('Error al asignar producto:', err);
      alert(err?.response?.data?.mensajeError || 'Error al asignar producto');
    }
  };

  const actualizarTalleAsignado = async (permId, producto_id, talle_id) => {
    try {
      await axios.put(`${API_URL}/combo-productos-permitidos/${permId}`, {
        producto_id,
        categoria_id: null,
        talle_id
      });
      await fetchDatos();
    } catch (err) {
      console.error('Error al cambiar talle:', err);
      alert(err?.response?.data?.mensajeError || 'Error al cambiar talle');
    }
  };

  const cargarTallesProducto = async (
    producto,
    cambiar = null /* {permId} */
  ) => {
    setLoadingTalles(true);
    setErrorTalles('');
    try {
      const params = { producto_id: producto.id };
      const { data } = await axios.get(`${API_URL}/stock/talles`, { params });

      // Filtrar talles ya asignados para ese producto si estamos agregando
      const tallesYaAsignados = new Set(
        asignados
          .filter((a) => a.producto?.id === producto.id)
          .map((a) => a.talle?.id ?? null)
      );

      const base = data || [];
      const disponibles = cambiar
        ? base // en cambio de talle mostramos todos (puede elegir el actual u otro)
        : base.filter((t) => !tallesYaAsignados.has(t.talle_id ?? null));

      setModalProducto({
        id: producto.id,
        nombre: producto.nombre,
        talles: disponibles
      });
      setTalleSeleccionado(null);
      setModoCambio(cambiar); // null si es agregar, {permId, productoId} si es cambio
    } catch (e) {
      console.error(e);
      setErrorTalles('No se pudieron cargar los talles del producto.');
      setModalProducto(null);
      setTalleSeleccionado(null);
      setModoCambio(null);
    } finally {
      setLoadingTalles(false);
    }
  };

  const abrirModalProducto = async (producto) => {
    await cargarTallesProducto(producto, null);
  };

  const abrirCambioTalle = async (permItem) => {
    if (!permItem?.producto) return;
    await cargarTallesProducto(permItem.producto, {
      permId: permItem.id,
      productoId: permItem.producto.id
    });
  };

  const agregarCategoria = async (categoria_id) => {
    try {
      await axios.post(`${API_URL}/combo-productos-permitidos`, {
        combo_id: parseInt(id, 10),
        categoria_id
      });
      fetchDatos();
    } catch (err) {
      console.error('Error al asignar categoría:', err);
      alert(err?.response?.data?.mensajeError || 'Error al asignar categoría');
    }
  };

  // ================== Búsquedas + paginado local + filtro categoria =====================
  const productosFiltrados = useMemo(() => {
    const list = Array.isArray(productos) ? productos : [];
    const q = (busquedaProd || '').toLowerCase();
    const catId = categoriaFiltro ? parseInt(categoriaFiltro, 10) : null;

    return list
      .filter((p) => (p?.nombre || '').toLowerCase().includes(q))
      .filter((p) => {
        if (!catId) return true;
        const pid = Number.isFinite(p?.categoria_id)
          ? p.categoria_id
          : p?.categoria?.id ?? null;
        return pid === catId;
      });
  }, [productos, busquedaProd, categoriaFiltro]);

  const categoriasFiltradas = useMemo(() => {
    const arr = Array.isArray(categorias) ? categorias : [];
    const q = (debouncedCat || '').toLowerCase();

    const base = arr.filter((c) => (c?.nombre || '').toLowerCase().includes(q));
    const yaAsignadas = new Set(
      (asignados || [])
        .filter((a) => a?.categoria?.id != null)
        .map((a) => a.categoria.id)
    );
    return base.filter((c) => !yaAsignadas.has(c.id));
  }, [categorias, debouncedCat, asignados]);

  // Paginación cliente
  const totalPagesProd = Math.max(
    1,
    Math.ceil(productosFiltrados.length / pageSize)
  );
  const pageItemsProd = productosFiltrados.slice(
    (pageProd - 1) * pageSize,
    pageProd * pageSize
  );

  const totalPagesCat = Math.max(
    1,
    Math.ceil(categoriasFiltradas.length / pageSize)
  );
  const pageItemsCat = categoriasFiltradas.slice(
    (pageCat - 1) * pageSize,
    pageCat * pageSize
  );

  // ================== UI =====================
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-6">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        {/* Header combo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-white titulo uppercase">
            Editar productos permitidos
          </h1>

          {combo && (
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-purple-300 font-bold text-lg">
                {combo.nombre}
              </p>
              <div className="text-sm text-gray-300 flex gap-4 mt-1">
                <span>
                  Requiere <strong>{combo.cantidad_items}</strong> ítems
                </span>
                <span>
                  Estado:{' '}
                  <strong
                    className={
                      combo.estado === 'activo'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }
                  >
                    {combo.estado}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('asignados')}
            className={`px-4 py-2 rounded-lg border ${
              tab === 'asignados'
                ? 'bg-purple-600 border-purple-500'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Asignados{' '}
            <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {asignados.length}
            </span>
          </button>
          <button
            onClick={() => setTab('productos')}
            className={`px-4 py-2 rounded-lg border ${
              tab === 'productos'
                ? 'bg-purple-600 border-purple-500'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setTab('categorias')}
            className={`px-4 py-2 rounded-lg border ${
              tab === 'categorias'
                ? 'bg-purple-600 border-purple-500'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            Categorías
          </button>
        </div>

        {loading && <div className="text-gray-300">Cargando…</div>}

        {!loading && tab === 'asignados' && (
          <>
            {asignados.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-gray-300">
                Aún no asignaste productos o categorías a este combo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {asignados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/10 p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm">
                        {item.producto ? (
                          <>
                            <FaBoxOpen className="inline-block mr-2 text-green-400" />
                            <span className="font-semibold">
                              {item.producto.nombre}
                            </span>
                            {item.talle?.nombre && (
                              <span className="ml-2 text-xs text-gray-300">
                                / Talle:{' '}
                                <span className="font-semibold">
                                  {item.talle.nombre}
                                </span>
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <FaFolderOpen className="inline-block mr-2 text-blue-400" />
                            <span className="font-semibold">
                              {item.categoria?.nombre}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.producto && (
                          <button
                            className="text-amber-300 hover:text-amber-400"
                            title="Cambiar talle"
                            onClick={() => abrirCambioTalle(item)}
                          >
                            <FaExchangeAlt />
                          </button>
                        )}
                        <button
                          className="text-red-400 hover:text-red-600"
                          onClick={() => eliminarAsignado(item.id)}
                          title="Eliminar"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && tab === 'productos' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
              {/* Buscador */}
              <input
                type="text"
                placeholder="Buscar producto…"
                value={busquedaProd}
                onChange={(e) => {
                  setBusquedaProd(e.target.value);
                  setPageProd(1);
                }}
                className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              {/* Filtro de categorías */}
              <select
                value={categoriaFiltro}
                onChange={(e) => {
                  setCategoriaFiltro(e.target.value);
                  setPageProd(1);
                }}
                className="w-full sm:w-60 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

              {/* Resumen */}
              <div className="text-sm text-gray-300">
                Mostrando <strong>{pageItemsProd.length}</strong> de{' '}
                <strong>{productosFiltrados.length}</strong>
              </div>
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="text-gray-400 text-sm p-4">Sin resultados</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pageItemsProd.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/10 p-3 rounded-xl flex justify-between items-center border border-white/10"
                    >
                      <span className="text-sm">{p.nombre}</span>
                      <button
                        onClick={() => abrirModalProducto(p)}
                        className="text-green-400 hover:text-green-600"
                        title="Agregar producto (seleccionar talle si corresponde)"
                        disabled={loadingTalles && modalProducto?.id === p.id}
                      >
                        <FaPlusCircle />
                      </button>
                    </div>
                  ))}
                </div>
                <PageSelector
                  page={pageProd}
                  totalPages={totalPagesProd}
                  onPage={setPageProd}
                />
              </>
            )}
          </div>
        )}

        {!loading && tab === 'categorias' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
              <input
                type="text"
                placeholder="Buscar categoría…"
                value={busquedaCat}
                onChange={(e) => {
                  setBusquedaCat(e.target.value);
                  setPageCat(1);
                }}
                className="w-full sm:w-80 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="text-sm text-gray-300">
                Mostrando <strong>{pageItemsCat.length}</strong> de{' '}
                <strong>{categoriasFiltradas.length}</strong>
              </div>
            </div>

            {categoriasFiltradas.length === 0 ? (
              <div className="text-gray-400 text-sm p-4">Sin resultados</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pageItemsCat.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white/10 p-3 rounded-xl flex justify-between items-center border border-white/10"
                    >
                      <span className="text-sm">{c.nombre}</span>
                      <button
                        onClick={() => agregarCategoria(c.id)}
                        className="text-blue-400 hover:text-blue-600"
                        title="Agregar categoría"
                      >
                        <FaPlusCircle />
                      </button>
                    </div>
                  ))}
                </div>
                <PageSelector
                  page={pageCat}
                  totalPages={totalPagesCat}
                  onPage={setPageCat}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de talles (agregar / cambiar) */}
      {modalProducto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
            <h3
              id="modal-title"
              className="text-2xl font-bold mb-5 text-center text-gray-800"
            >
              {modoCambio ? 'Cambiar talle' : 'Seleccioná talle'} para{' '}
              <span className="text-emerald-600">{modalProducto.nombre}</span>
            </h3>

            {errorTalles && (
              <p className="text-red-600 text-sm mb-3">{errorTalles}</p>
            )}

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
              {(modalProducto.talles || []).map((talle) => {
                const selected = talleSeleccionado?.talle_id === talle.talle_id;
                const sinStock = (talle.cantidad ?? 0) <= 0;

                return (
                  <button
                    key={talle.talle_id ?? 'no-talle'}
                    onClick={() => !sinStock && setTalleSeleccionado(talle)}
                    className={`flex justify-between items-center p-4 rounded-lg border transition
                      ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
                      }
                      ${sinStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-pressed={selected}
                    type="button"
                    disabled={sinStock}
                    title={sinStock ? 'Sin stock disponible' : ''}
                  >
                    <span className="text-lg font-semibold">
                      {talle.talle_nombre || 'Sin talle'}
                    </span>
                    <span className="text-sm font-medium opacity-75">
                      {talle.cantidad ?? 0} disponibles
                    </span>
                    {selected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
              {Array.isArray(modalProducto.talles) &&
                modalProducto.talles.length === 0 && (
                  <p className="text-center text-gray-600">
                    No hay talles disponibles para este producto.
                  </p>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setModalProducto(null);
                  setTalleSeleccionado(null);
                  setModoCambio(null);
                }}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={!talleSeleccionado}
                onClick={async () => {
                  if (!talleSeleccionado) return;
                  if (modoCambio) {
                    await actualizarTalleAsignado(
                      modoCambio.permId,
                      modoCambio.productoId,
                      talleSeleccionado.talle_id ?? null
                    );
                  } else {
                    await agregarProductoConTalle(
                      modalProducto.id,
                      talleSeleccionado.talle_id ?? null
                    );
                  }
                  setModalProducto(null);
                  setTalleSeleccionado(null);
                  setModoCambio(null);
                }}
                className={`px-6 py-2 rounded-lg font-semibold text-white
                  ${
                    talleSeleccionado
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-emerald-300 cursor-not-allowed'
                  }`}
                type="button"
              >
                {modoCambio ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboEditarPermitidos;
