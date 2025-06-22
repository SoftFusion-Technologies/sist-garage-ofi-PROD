import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaBox, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import ParticlesBackground from '../../Components/ParticlesBackground';

Modal.setAppElement('#root');

const ProductosGet = () => {
  const [talles, setTalles] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    codigo_sku: '',
    precio: '',
    imagen_url: '',
    estado: 'activo'
  });

  useEffect(() => {
    const fetchTalles = async () => {
      try {
        const res = await axios.get('http://localhost:8080/talles');
        setTalles(res.data);
      } catch (err) {
        console.error('Error al obtener talles:', err);
      }
    };

    fetchTalles();
  }, []);
  const fetchProductos = async () => {
    try {
      const res = await axios.get('http://localhost:8080/productos');
      setProductos(res.data);
    } catch (err) {
      console.error('Error al obtener productos:', err);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    const talleSeleccionado = talles.find(
      (t) => t.id === parseInt(formValues.talle_id)
    );

    if (formValues.nombre && talleSeleccionado) {
      // Limpiar nombre: quitar acentos, convertir a minúsculas y quitar caracteres especiales
      const nombreClean = formValues.nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita acentos
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-') // reemplaza caracteres no alfanuméricos
        .slice(0, 10)
        .replace(/-+$/, ''); // elimina guiones al final

      const talleClean = talleSeleccionado.nombre.toUpperCase();
      const nuevoSKU = `${nombreClean}-${talleClean}`;

      // Solo actualizar si el SKU está vacío o coincide con la lógica previa
      if (
        !formValues.codigo_sku ||
        formValues.codigo_sku.startsWith(nombreClean)
      ) {
        setFormValues((prev) => ({ ...prev, codigo_sku: nuevoSKU }));
      }
    }
  }, [formValues.nombre, formValues.talle_id, talles]);

  const filtered = productos.filter((p) =>
    [p.nombre, p.descripcion, p.categoria, p.codigo_sku].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const openModal = (producto = null) => {
    if (producto) {
      setEditId(producto.id);
      setFormValues({
        ...producto,
        precio: producto.precio?.toString() ?? '' // 👈 Asegura que sea string
      });
    } else {
      setEditId(null);
      setFormValues({
        nombre: '',
        descripcion: '',
        categoria: '',
        codigo_sku: '',
        precio: '0',
        imagen_url: '',
        estado: 'activo',
        talle_id: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedPrecio = parseFloat(formValues.precio);
    if (isNaN(parsedPrecio) || parsedPrecio < 0) {
      alert('Por favor ingrese un precio válido');
      return;
    }

    try {
      const dataToSend = {
        ...formValues,
        precio: parsedPrecio.toFixed(2) // asegura formato DECIMAL(10,2)
      };

      console.log(formValues);

      if (editId) {
        await axios.put(
          `http://localhost:8080/productos/${editId}`,
          dataToSend
        );
      } else {
        await axios.post('http://localhost:8080/productos', dataToSend);
      }

      fetchProductos();
      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar producto:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/productos/${id}`);
      fetchProductos();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-6 text-white relative">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-rose-400 flex items-center gap-3 uppercase drop-shadow">
            <FaBox /> Productos
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-rose-500 hover:bg-rose-600 transition px-5 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
          >
            <FaPlus /> Nuevo Producto
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-8 px-4 py-3 rounded-xl border border-gray-600 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-rose-300 mb-1">
                {p.nombre}
              </h2>
              <p className="text-sm text-gray-200 mb-2">{p.descripcion}</p>
              <p className="text-sm text-gray-300 mb-1">
                Categoría: {p.categoria}
              </p>
              <p className="text-sm text-gray-300 mb-1">SKU: {p.codigo_sku}</p>
              <p className="text-sm text-green-300 font-semibold">
                ${p.precio ? parseFloat(p.precio).toFixed(2) : '0.00'}
              </p>

              <div className="mt-4 flex justify-end gap-4">
                <button
                  onClick={() => openModal(p)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-rose-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-rose-600">
            {editId ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows="3"
            />
            <input
              type="text"
              placeholder="Categoría"
              value={formValues.categoria}
              onChange={(e) =>
                setFormValues({ ...formValues, categoria: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Talle
              </label>
              <select
                value={formValues.talle_id || ''}
                onChange={(e) =>
                  setFormValues({ ...formValues, talle_id: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              >
                <option value="">Seleccione un talle</option>
                {talles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600">
                Código SKU (Generado automáticamente)
              </label>
              <input
                type="text"
                value={formValues.codigo_sku}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 cursor-not-allowed"
              />
            </div>
            <input
              type="number"
              placeholder="Precio"
              value={formValues.precio}
              onChange={(e) =>
                setFormValues({
                  ...formValues,
                  precio: e.target.value
                })
              }
              min="0"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            <input
              type="text"
              placeholder="URL de Imagen"
              value={formValues.imagen_url}
              onChange={(e) =>
                setFormValues({ ...formValues, imagen_url: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <select
              value={formValues.estado}
              onChange={(e) =>
                setFormValues({ ...formValues, estado: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ProductosGet;
