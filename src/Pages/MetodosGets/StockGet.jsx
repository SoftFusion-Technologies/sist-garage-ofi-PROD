import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { FaWarehouse, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack';
import ParticlesBackground from '../../Components/ParticlesBackground';

Modal.setAppElement('#root');

const StockGet = () => {
  const [stock, setStock] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    talle_id: '',
    local_id: '',
    lugar_id: '',
    estado_id: '',
    cantidad: 0,
    en_perchero: true
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const [productos, setProductos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [locales, setLocales] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [estados, setEstados] = useState([]);

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

  const openModal = (item = null) => {
    if (item) {
      setEditId(item.id);
      setFormData({ ...item });
    } else {
      setEditId(null);
      setFormData({
        producto_id: '',
        talle_id: '',
        local_id: '',
        lugar_id: '',
        estado_id: '',
        cantidad: 0,
        en_perchero: true
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:8080/stock/${editId}`, formData);
      } else {
        await axios.post('http://localhost:8080/stock', formData);
      }
      fetchAll();
      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar stock:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/stock/${id}`);
      fetchAll();
    } catch (err) {
      console.error('Error al eliminar stock:', err);
    }
  };

  const filtered = stock.filter((item) => {
    return productos
      .find((p) => p.id === item.producto_id)
      ?.nombre?.toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-2 uppercase">
            <FaWarehouse /> Stock
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaPlus /> Nuevo
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filtered.map((item) => {
            const producto = productos.find((p) => p.id === item.producto_id);
            const talle = talles.find((t) => t.id === item.talle_id);
            const local = locales.find((l) => l.id === item.local_id);
            const lugar = lugares.find((l) => l.id === item.lugar_id);
            const estado = estados.find((e) => e.id === item.estado_id);

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
              >
                <h2 className="text-xl font-bold text-cyan-300 mb-1">
                  {producto?.nombre} - {talle?.nombre}
                </h2>
                <p className="text-sm">Local: {local?.nombre}</p>
                <p className="text-sm">Lugar: {lugar?.nombre}</p>
                <p className="text-sm">Estado: {estado?.nombre}</p>
                <p className="text-sm">Cantidad: {item.cantidad}</p>
                <p className="text-sm">
                  En perchero: {item.en_perchero ? 'Sí' : 'No'}
                </p>
                <div className="mt-4 flex justify-end gap-4">
                  <button
                    onClick={() => openModal(item)}
                    className="text-yellow-400 hover:text-yellow-300"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-cyan-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-cyan-600">
            {editId ? 'Editar Stock' : 'Nuevo Stock'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            {[
              { label: 'Producto', name: 'producto_id', options: productos },
              { label: 'Talle', name: 'talle_id', options: talles },
              { label: 'Local', name: 'local_id', options: locales },
              { label: 'Lugar', name: 'lugar_id', options: lugares },
              { label: 'Estado', name: 'estado_id', options: estados }
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block font-semibold mb-1">{label}</label>
                <select
                  value={formData[name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [name]: e.target.value })
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

            <div>
              <label className="block font-semibold mb-1">Cantidad</label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cantidad: parseInt(e.target.value)
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                required
              />
            </div>

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
      </div>
    </div>
  );
};

export default StockGet;
