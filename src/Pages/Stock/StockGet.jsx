import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaWarehouse,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaBoxOpen,
  FaMapPin,
  FaCircle
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import { useAuth } from '../../AuthContext.jsx';
Modal.setAppElement('#root');

const StockGet = () => {
  const { userLevel } = useAuth();
  const UMBRAL_STOCK_BAJO = 5;
  const [stock, setStock] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    talle_id: '',
    local_id: '',
    lugar_id: '',
    estado_id: '',
    cantidad: 0,
    en_perchero: true,
    codigo_sku: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTallesOpen, setModalTallesOpen] = useState(false);
  const [tallesGroupView, setTallesGroupView] = useState(null); // El grupo actual

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const [productos, setProductos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [locales, setLocales] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [estados, setEstados] = useState([]);

  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25
  const [talleFiltro, setTalleFiltro] = useState('todos');
  const [localFiltro, setLocalFiltro] = useState('todos');
  const [lugarFiltro, setLugarFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [enPercheroFiltro, setEnPercheroFiltro] = useState('todos');
  const [cantidadMin, setCantidadMin] = useState('');
  const [cantidadMax, setCantidadMax] = useState('');
  const [skuFiltro, setSkuFiltro] = useState('');
  const [verSoloStockBajo, setVerSoloStockBajo] = useState(false);
  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25

  const [cantidadesPorTalle, setCantidadesPorTalle] = useState([]);
  const [grupoOriginal, setGrupoOriginal] = useState(null);
  const [grupoEditando, setGrupoEditando] = useState(null);

  const fetchAll = async () => {
    try {
      const [resStock, resProd, resTalles, resLocales, resLugares, resEstados] =
        await Promise.all([
          axios.get('http://localhost:8080/stock'),
          axios.get('http://localhost:8080/productos'),
          axios.get('http://localhost:8080/talles'),
          axios.get('http://localhost:8080/locales'),
          axios.get('http://localhost:8080/lugares'),
          axios.get('http://localhost:8080/estados')
        ]);
      setStock(resStock.data);
      setProductos(resProd.data);
      setTalles(resTalles.data);
      setLocales(resLocales.data);
      setLugares(resLugares.data);
      setEstados(resEstados.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openModal = (item = null, group = null) => {
    if (item) {
      // Edición individual
      setEditId(item.id);
      setFormData({ ...item });
      setCantidadesPorTalle([]);
      setGrupoOriginal(null);
      setGrupoEditando(null);
    } else if (group) {
      setEditId(null);
      setFormData({
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        en_perchero: group.en_perchero,
        codigo_sku: ''
      });
      setGrupoOriginal({
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        en_perchero: group.en_perchero
      });
      setGrupoEditando(group); // <- Guardá el grupo actual
      // Inicializá cantidadesPorTalle con los talles y cantidades del grupo
      setCantidadesPorTalle(
        group.items.map((i) => ({
          talle_id: i.talle_id,
          cantidad: i.cantidad
        }))
      );
    } else {
      setEditId(null);
      setFormData({
        producto_id: '',
        local_id: '',
        lugar_id: '',
        estado_id: '',
        en_perchero: true,
        codigo_sku: ''
      });
      setCantidadesPorTalle([]);
      setGrupoOriginal(null);
      setGrupoEditando(null);
    }
    setModalOpen(true);
  };

  useEffect(() => {
    if (formData.producto_id && !editId && !grupoEditando) {
      // Solo para alta nueva, NO para edición de grupo (porque ya seteaste talles)
      const producto = productos.find(
        (p) => p.id === Number(formData.producto_id)
      );
      const tipoCategoria = producto?.categoria?.nombre?.toLowerCase();
      const tallesFiltradosGroup = talles.filter(
        (t) => t.tipo_categoria?.toLowerCase() === tipoCategoria
      );
      setCantidadesPorTalle(
        tallesFiltradosGroup.map((t) => ({
          talle_id: t.id,
          cantidad: 0
        }))
      );
    }
  }, [formData.producto_id, productos, talles, editId, grupoEditando]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      // Edición de registro puntual
      if (
        !formData.producto_id ||
        !formData.local_id ||
        !formData.lugar_id ||
        !formData.estado_id ||
        !formData.talle_id ||
        formData.cantidad == null
      ) {
        alert('Completa todos los campos');
        return;
      }

      try {
        await axios.put(`http://localhost:8080/stock/${editId}`, formData);
        fetchAll();
        setModalOpen(false);
      } catch (err) {
        console.error('Error al editar stock:', err);
      }
      return;
    }

    // Edición masiva (grupo) o alta múltiple
    const tallesAEnviar = cantidadesPorTalle.filter((t) => t.cantidad > 0);

    if (
      !formData.producto_id ||
      !formData.local_id ||
      !formData.lugar_id ||
      !formData.estado_id ||
      tallesAEnviar.length === 0
    ) {
      alert('Completa todos los campos y asigna cantidad a al menos un talle');
      return;
    }

    // Si es edición de grupo Y cambiaron los campos clave => transferir/agrupar
    if (grupoOriginal) {
      const cambioGrupo =
        grupoOriginal.producto_id !== formData.producto_id ||
        grupoOriginal.local_id !== formData.local_id ||
        grupoOriginal.lugar_id !== formData.lugar_id ||
        grupoOriginal.estado_id !== formData.estado_id ||
        grupoOriginal.en_perchero !== formData.en_perchero;

      if (cambioGrupo) {
        // Llamada al endpoint especial para transferir/agrupar
        try {
          await axios.post('http://localhost:8080/transferir', {
            grupoOriginal,
            nuevoGrupo: {
              producto_id: formData.producto_id,
              local_id: formData.local_id,
              lugar_id: formData.lugar_id,
              estado_id: formData.estado_id,
              en_perchero: formData.en_perchero
            },
            talles: tallesAEnviar
          });
          fetchAll();
          setModalOpen(false);
          setGrupoOriginal(null);
        } catch (err) {
          console.error('Error al transferir stock:', err);
        }
        return;
      }
    }

    // Si no hubo cambios de grupo, usá el endpoint tradicional
    try {
      await axios.post('http://localhost:8080/distribuir', {
        producto_id: formData.producto_id,
        local_id: formData.local_id,
        lugar_id: formData.lugar_id,
        estado_id: formData.estado_id,
        en_perchero: formData.en_perchero,
        talles: tallesAEnviar,
        reemplazar: true
      });
      fetchAll();
      setModalOpen(false);
      setGrupoOriginal(null);
    } catch (err) {
      console.error('Error al guardar stock:', err);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este talle? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    try {
      await axios.delete(`http://localhost:8080/stock/${id}`);
      // Actualizá SOLO el array items del group, sin recargar todo
      setTallesGroupView((prev) => ({
        ...prev,
        items: prev.items.filter((x) => x.id !== id)
      }));
      // Si querés refrescar todo (menos eficiente):
      fetchAll();
    } catch (err) {
      console.error('Error al eliminar stock:', err);
      alert('Ocurrió un error al eliminar el talle. Intenta de nuevo.');
    }
  };

  const handleDeleteGroup = async (group) => {
    const nombreProducto =
      productos.find((p) => p.id === group.producto_id)?.nombre || '';

    const confirmado = window.confirm(
      `¿Estás seguro de eliminar TODO el stock del producto "${nombreProducto}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await axios.post('http://localhost:8080/eliminar-grupo', {
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id
      });

      // Actualizá solo el estado para no recargar todo
      setTallesGroupView(null); // o algo que limpie/oculte modal
      fetchAll(); // opcional, para refrescar todo el listado
    } catch (err) {
      alert('Error al eliminar el stock del grupo');
      console.error(err);
    }
  };

  const filtered = stock
    .filter((item) => {
      const producto = productos.find((p) => p.id === item.producto_id);
      return producto?.nombre?.toLowerCase().includes(search.toLowerCase());
    })
    .filter(
      (item) =>
        talleFiltro === 'todos' || item.talle_id === parseInt(talleFiltro)
    )
    .filter(
      (item) =>
        localFiltro === 'todos' || item.local_id === parseInt(localFiltro)
    )
    .filter(
      (item) =>
        lugarFiltro === 'todos' || item.lugar_id === parseInt(lugarFiltro)
    )
    .filter(
      (item) =>
        estadoFiltro === 'todos' || item.estado_id === parseInt(estadoFiltro)
    )
    .filter((item) => {
      if (enPercheroFiltro === 'todos') return true;
      return item.en_perchero === (enPercheroFiltro === 'true');
    })
    .filter((item) => {
      const min = parseInt(cantidadMin) || 0;
      const max = parseInt(cantidadMax) || Infinity;
      return item.cantidad >= min && item.cantidad <= max;
    })
    .filter((item) =>
      item.codigo_sku?.toLowerCase().includes(skuFiltro.toLowerCase())
    )
    // 🆕 Filtro de stock bajo
    .filter((item) =>
      verSoloStockBajo ? item.cantidad <= UMBRAL_STOCK_BAJO : true
    );

  const exportarStockAExcel = (datos) => {
    // Mapeamos los datos que querés exportar (puede incluir joins)
    const exportData = datos.map((item) => ({
      Producto:
        productos.find((p) => p.id === item.producto_id)?.nombre ||
        'Sin nombre',
      Talle: item.talle_id || '-',
      Local: item.local_id || '-',
      Lugar: item.lugar_id || '-',
      Estado: item.estado_id || '-',
      Cantidad: item.cantidad,
      'En Perchero': item.en_perchero ? 'Sí' : 'No',
      SKU: item.codigo_sku || '',
      'Última actualización': new Date(item.updated_at).toLocaleString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

    const fecha = new Date();
    const timestamp = fecha
      .toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-'); // Reemplaza / y : para que sea válido en nombre de archivo

    const nombreArchivo = `stock-exportado-${timestamp}.xlsx`;

    XLSX.writeFile(workbook, nombreArchivo);
  };

  const productoSeleccionado = productos.find(
    (p) => p.id === Number(formData.producto_id)
  );

  const tipoCategoria = productoSeleccionado?.categoria?.nombre
    ?.toLowerCase()
    .includes('calzado')
    ? 'calzado'
    : productoSeleccionado?.categoria?.nombre?.toLowerCase().includes('ropa')
    ? 'ropa'
    : productoSeleccionado?.categoria?.nombre
        ?.toLowerCase()
        .includes('accesorio')
    ? 'accesorio'
    : null;

  // Solo mostramos los talles que coinciden, si no, dejamos vacío el array
  const tallesFiltrados =
    tipoCategoria != null
      ? talles.filter((t) => t.tipo_categoria?.toLowerCase() === tipoCategoria)
      : [];

  const stockAgrupado = [];
  filtered.forEach((item) => {
    const key = [
      item.producto_id,
      item.local_id,
      item.lugar_id,
      item.estado_id,
      item.en_perchero
    ].join('-');
    let group = stockAgrupado.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        producto_id: item.producto_id,
        local_id: item.local_id,
        lugar_id: item.lugar_id,
        estado_id: item.estado_id,
        en_perchero: item.en_perchero,
        items: []
      };
      stockAgrupado.push(group);
    }
    group.items.push(item);
  });

  const closeModal = () => {
    setModalOpen(false);
    setGrupoEditando(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-2 uppercase">
            <FaWarehouse /> Stock
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <BulkUploadButton
              tabla="stock"
              onSuccess={() => fetchAll()} // función para recargar stock después de importar
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            />
            <button
              onClick={() => exportarStockAExcel(filtered)}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
            >
              <FaDownload /> Exportar Excel
            </button>

            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nuevo
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* Filtro por Talle */}
          <select
            value={talleFiltro}
            onChange={(e) => setTalleFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los talles</option>
            {talles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Local */}
          <select
            value={localFiltro}
            onChange={(e) => setLocalFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los locales</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Lugar */}
          <select
            value={lugarFiltro}
            onChange={(e) => setLugarFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los lugares</option>
            {lugares.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los estados</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por perchero */}
          <select
            value={enPercheroFiltro}
            onChange={(e) => setEnPercheroFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos</option>
            <option value="true">En perchero</option>
            <option value="false">No en perchero</option>
          </select>

          {/* Filtro por cantidad */}
          <input
            type="number"
            placeholder="Cantidad mínima"
            value={cantidadMin}
            onChange={(e) => setCantidadMin(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
          <input
            type="number"
            placeholder="Cantidad máxima"
            value={cantidadMax}
            onChange={(e) => setCantidadMax(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />

          {/* Filtro por SKU */}
          <input
            type="text"
            placeholder="Buscar por SKU"
            value={skuFiltro}
            onChange={(e) => setSkuFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
        </div>

        <button
          onClick={() => setVerSoloStockBajo((prev) => !prev)}
          className={`px-4 mb-2 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
            verSoloStockBajo
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-800 text-white'
          }`}
        >
          {verSoloStockBajo ? 'Ver Todos' : 'Mostrar Stock Bajo'}
        </button>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {stockAgrupado.map((group, idx) => {
            const producto = productos.find((p) => p.id === group.producto_id);
            const local = locales.find((l) => l.id === group.local_id);
            const lugar = lugares.find((l) => l.id === group.lugar_id);
            const estado = estados.find((e) => e.id === group.estado_id);
            const cantidadTotal = group.items.reduce(
              (sum, i) => sum + i.cantidad,
              0
            );

            return (
              <motion.div
                key={group.key}
                layout
                className="bg-white/10 p-6 rounded-2xl shadow-md border border-white/10 hover:scale-[1.02] transition-all"
              >
                <h2 className="text-xl font-bold text-cyan-300 mb-1">
                  {producto?.nombre}
                </h2>
                <p className="text-sm">Local: {local?.nombre}</p>
                <p className="text-sm">Lugar: {lugar?.nombre || 'Sin lugar'}</p>
                <p className="text-sm">
                  Estado: {estado?.nombre || 'Sin Estado'}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <span
                    className={
                      cantidadTotal <= UMBRAL_STOCK_BAJO
                        ? 'text-red-400'
                        : 'text-green-300'
                    }
                  >
                    Cantidad total: {cantidadTotal}
                  </span>
                  {cantidadTotal <= UMBRAL_STOCK_BAJO && (
                    <span className="flex items-center text-red-500 font-bold text-xs animate-pulse">
                      <FaExclamationTriangle className="mr-1" />
                      ¡Stock bajo!
                    </span>
                  )}
                </p>
                <p className="text-sm flex items-center gap-2">
                  En perchero:
                  {group.en_perchero ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <FaCheckCircle /> Sí
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <FaTimesCircle /> No
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTallesGroupView(group);
                      setModalTallesOpen(true);
                    }}
                    className="mt-2 mb-2 px-3 py-1 bg-cyan-700 rounded-lg text-white text-sm font-semibold"
                  >
                    Ver talles y SKU
                  </button>
                  {userLevel === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          openModal(null, group); // null para item, group como segundo argumento
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group)}
                        className="mt-2 mb-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className={`bg-white rounded-2xl p-8 shadow-2xl border-l-4 border-cyan-500
    ${formData.producto_id ? 'max-w-2xl' : 'max-w-lg'} w-full mx-4`}
        >
          <h2 className="text-2xl font-bold mb-4 text-cyan-600">
            {editId ? 'Editar Stock' : 'Nuevo Stock'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            {[
              { label: 'Producto', name: 'producto_id', options: productos },
              ...(editId
                ? [{ label: 'Talle', name: 'talle_id', options: talles }]
                : []),
              { label: 'Local', name: 'local_id', options: locales },
              { label: 'Lugar', name: 'lugar_id', options: lugares },
              { label: 'Estado', name: 'estado_id', options: estados }
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block font-semibold mb-1">{label}</label>
                <select
                  value={formData[name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [name]: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  required
                >
                  <option value="">Seleccione {label}</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {editId && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Código SKU (Generado automáticamente)
                </label>
                <input
                  type="text"
                  value={formData.codigo_sku || ''}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </div>
            )}

            {formData.producto_id && !editId && (
              <div>
                {/* Solo muestra el label si hay talles filtrados */}
                {tallesFiltrados.length > 0 && (
                  <label className="block font-semibold mb-3 text-gray-700 text-lg">
                    Asignar stock por talle
                  </label>
                )}

                {/* Si hay talles filtrados, grid de inputs */}
                {tallesFiltrados.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-2" style={{ minWidth: 340 }}>
                      {tallesFiltrados.map((t, i) => {
                        const idx = cantidadesPorTalle.findIndex(
                          (tt) => tt.talle_id === t.id
                        );
                        const cantidad =
                          idx !== -1 ? cantidadesPorTalle[idx].cantidad : 0;
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl shadow p-3 flex flex-col items-center border-2 border-gray-100 hover:border-cyan-400 transition-all min-w-[110px]"
                          >
                            <span className="text-cyan-600 font-bold text-lg mb-1">
                              {t.nombre}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={cantidad}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCantidadesPorTalle((prev) => {
                                  const next = [...prev];
                                  const exist = next.findIndex(
                                    (tt) => tt.talle_id === t.id
                                  );
                                  if (exist !== -1) {
                                    next[exist].cantidad = val;
                                  } else {
                                    next.push({
                                      talle_id: t.id,
                                      cantidad: val
                                    });
                                  }
                                  return next;
                                });
                              }}
                              className="w-16 p-2 rounded-xl border-2 border-gray-200 focus:border-cyan-500 text-center text-base font-semibold bg-gray-50 focus:bg-white transition"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Si NO hay talles filtrados, solo el select
                  <div className="mt-2">
                    <label className="block font-semibold mb-1">Talle</label>
                    <select
                      value={formData.talle_id}
                      onChange={(e) =>
                        setFormData({ ...formData, talle_id: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300"
                      required
                    >
                      <option value="">Seleccione Talle</option>
                      {talles.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {editId && (
              // Edición: Solo editar cantidad para el talle seleccionado
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-gray-700">
                  Editar cantidad para talle:
                  <span className="text-cyan-600 ml-2 font-bold">
                    {/* Si el usuario cambia el select de talle, esto se actualiza */}
                    {talles.find((t) => t.id === Number(formData.talle_id))
                      ?.nombre || '-'}
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad: Number(e.target.value)
                    })
                  }
                  className="w-24 p-2 rounded-xl border-2 border-gray-200 focus:border-cyan-500 text-center text-base font-semibold bg-gray-50 focus:bg-white transition"
                  placeholder="Cantidad"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.en_perchero}
                onChange={(e) =>
                  setFormData({ ...formData, en_perchero: e.target.checked })
                }
              />
              <label>En perchero</label>
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL QUE SE ABRE AL PRESIONAR VER TALLES */}
        <Modal
          isOpen={modalTallesOpen}
          onRequestClose={() => setModalTallesOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className={`
    bg-white rounded-2xl shadow-2xl border-l-4 border-cyan-500
    w-full max-w-[98vw] sm:max-w-2xl mx-2
    max-h-[90vh] overflow-y-auto
    p-2 sm:p-6
  `}
        >
          <h2 className="text-lg sm:text-2xl font-bold mb-4 text-cyan-600 flex items-center gap-2">
            <FaWarehouse className="text-cyan-400" />
            Detalle de talles
          </h2>
          <div className="mb-2 text-gray-800 font-semibold flex flex-wrap gap-y-1 gap-x-2 text-xs sm:text-base">
            {(() => {
              const producto = productos.find(
                (p) => p.id === tallesGroupView?.producto_id
              );
              const local = locales.find(
                (l) => l.id === tallesGroupView?.local_id
              );
              const lugar = lugares.find(
                (l) => l.id === tallesGroupView?.lugar_id
              );
              const estado = estados.find(
                (e) => e.id === tallesGroupView?.estado_id
              );
              return (
                <>
                  <span className="px-3 py-1 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaBoxOpen className="text-cyan-400" />{' '}
                    <b>{producto?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-green-50 text-green-800 border border-green-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaMapPin className="text-green-400" />{' '}
                    <b>{local?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaWarehouse className="text-yellow-400" />{' '}
                    <b>{lugar?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaCircle className="text-violet-400" />{' '}
                    <b>{estado?.nombre}</b>
                  </span>
                </>
              );
            })()}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
      grid gap-3
      grid-cols-1
      sm:grid-cols-2
      md:grid-cols-3
    `}
          >
            {tallesGroupView?.items.map((item) => {
              const nombreTalle = talles.find(
                (t) => t.id === item.talle_id
              )?.nombre;
              const isStockLow = item.cantidad <= UMBRAL_STOCK_BAJO;
              return (
                <motion.div
                  key={item.id}
                  layout
                  className={`
            relative bg-gradient-to-br from-cyan-50 via-white to-cyan-100 
            rounded-2xl shadow-xl border-l-4
            p-3 sm:p-4 flex flex-col gap-1
            ${isStockLow ? 'border-red-400' : 'border-cyan-400'}
            min-w-0 w-full
          `}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: '0 4px 24px 0 rgba(0,255,255,0.18)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <span
                      className={`
    inline-block px-2 py-1 rounded-xl font-bold text-base sm:text-lg shadow
    ${isStockLow ? 'bg-red-400 text-white' : 'bg-cyan-400 text-white'}
    truncate max-w-[60px]
    sm:max-w-none sm:overflow-visible sm:whitespace-normal sm:text-clip
  `}
                      title={nombreTalle}
                    >
                      {nombreTalle}
                    </span>

                    <span
                      className="
    ml-auto
    text-xs sm:text-sm text-cyan-800 font-semibold bg-cyan-100
    px-2 py-0.5 rounded-lg
    max-w-full
    break-words
    whitespace-normal
    font-mono
  "
                      title={item.codigo_sku}
                    >
                      SKU: {item.codigo_sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="font-semibold text-gray-700 text-xs sm:text-md">
                      Cantidad:
                    </span>
                    <span
                      className={`
                font-bold text-base sm:text-lg 
                ${isStockLow ? 'text-red-500' : 'text-cyan-600'}
              `}
                    >
                      {item.cantidad}
                    </span>
                    {isStockLow && (
                      <span className="ml-2 flex items-center gap-1 bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-lg text-xs animate-pulse shadow">
                        <FaExclamationTriangle className="inline" /> ¡Stock
                        bajo!
                      </span>
                    )}
                  </div>
                  {userLevel === 'admin' && (
                    <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:gap-2">
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow transition"
                        onClick={() => {
                          setModalTallesOpen(false);
                          openModal(item);
                        }}
                        title="Editar este talle"
                      >
                        <FaEdit className="inline" />
                      </button>
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-1 bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow transition"
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar este talle"
                      >
                        <FaTrash className="inline" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <div className="text-right mt-4">
            <button
              onClick={() => setModalTallesOpen(false)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default StockGet;
