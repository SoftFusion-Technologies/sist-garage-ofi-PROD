import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaUserFriends, FaPlus, FaWhatsapp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import AdminActions from '../../Components/AdminActions';
Modal.setAppElement('#root');

export default function ClientesGet() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    dni: ''
  });

  // Filtro avanzado: por nombre, teléfono, email o fecha de última compra
  const [fechaFiltro, setFechaFiltro] = useState('');

  const fetchClientes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openModal = (cliente = null) => {
    if (cliente) {
      setEditId(cliente.id);
      setFormData({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        dni: cliente.dni || ''
      });
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        dni: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:8080/clientes/${editId}`, formData);
      } else {
        await axios.post('http://localhost:8080/clientes', formData);
      }
      fetchClientes();
      setModalOpen(false);
    } catch (err) {
      alert('Error al guardar cliente');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    try {
      await axios.delete(`http://localhost:8080/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      alert('Error al eliminar cliente');
    }
  };

  const filtered = clientes.filter((c) => {
    const text = [c.nombre, c.telefono, c.email, c.direccion, c.dni]
      .join(' ')
      .toLowerCase();
    const filtroFecha = fechaFiltro
      ? (c.fecha_ultima_compra || '').slice(0, 10) === fechaFiltro
      : true;
    return text.includes(search.toLowerCase()) && filtroFecha;
  });

  // Convierte teléfono "3865417665" o similar en "5493865417665" para WhatsApp link (Argentina)
  function formatWhatsappNumber(phone) {
    // Elimina cualquier caracter no numérico
    let num = phone.replace(/\D/g, '');

    // Si empieza con 0, lo quitamos
    if (num.startsWith('0')) num = num.substring(1);

    // Si empieza con 54, asumimos que ya es nacional
    if (!num.startsWith('54')) num = '54' + num;

    // Si no tiene el "9" (para WhatsApp móvil Argentina), se lo agregamos luego de "54"
    if (num.startsWith('549')) return num;
    if (num.startsWith('54') && num[2] !== '9') return '549' + num.substring(2);

    return num;
  }

  // Formatea visualmente el teléfono para mostrarlo (+54 9 xxxx xxx xxx)
  function formatDisplayPhone(phone) {
    let num = phone.replace(/\D/g, '');

    if (num.startsWith('0')) num = num.substring(1);
    if (!num.startsWith('54')) num = '54' + num;
    if (!num.startsWith('549')) num = '549' + num.substring(2);

    // Ejemplo: 5493865417665 → +54 9 3865 41-7665
    return `+${num.slice(0, 2)} ${num.slice(2, 3)} ${num.slice(
      3,
      7
    )} ${num.slice(7, 9)}-${num.slice(9)}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-900 py-10 px-3 md:px-6 relative font-sans">
      <ButtonBack />
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 drop-shadow-xl text-white uppercase titulo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FaUserFriends className="text-emerald-400 drop-shadow-lg" />
            Gestión de Clientes
          </motion.h1>
          <motion.button
            onClick={() => openModal()}
            className="text-white bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors active:scale-95"
            whileHover={{ scale: 1.05 }}
          >
            <FaPlus /> Nuevo Cliente
          </motion.button>
        </div>
        {/* Filtros */}
        <div className="w-full bg-white/10 p-5 rounded-2xl shadow-md mb-6 backdrop-blur-lg">
          <h2 className="text-emerald-200 text-lg font-semibold mb-4">
            Filtros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-emerald-200 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre, teléfono, email, dirección, DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
            </div>
            <div>
              <label className="block text-sm text-emerald-200 mb-1">
                Fecha última compra
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla para desktop */}
      <div className="hidden md:block max-w-5xl mx-auto">
        <div className="overflow-auto rounded-2xl shadow-2xl bg-white/10 backdrop-blur-sm">
          <table className="w-full text-sm text-left text-white">
            <thead className="bg-emerald-700/90">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Última compra</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-emerald-300">
                    No hay clientes para mostrar.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <motion.tr
                  key={c.id}
                  className="border-b border-white/10 hover:bg-emerald-700/10 transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="px-6 py-3 font-semibold">{c.nombre}</td>
                  <td className="px-6 py-3">
                    {c.telefono ? (
                      <a
                        href={`https://wa.me/${formatWhatsappNumber(
                          c.telefono
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold underline hover:text-emerald-400 transition cursor-pointer"
                        title="Enviar WhatsApp"
                      >
                        {formatDisplayPhone(c.telefono)}
                        <FaWhatsapp className="ml-1 text-green-500" />
                      </a>
                    ) : (
                      <span className="text-emerald-300">-</span>
                    )}
                  </td>

                  <td className="px-6 py-3">{c.email || '-'}</td>
                  <td className="px-6 py-3">
                    {c.fecha_ultima_compra ? (
                      new Date(c.fecha_ultima_compra).toLocaleDateString()
                    ) : (
                      <span className="italic text-emerald-200/60">Nunca</span>
                    )}
                  </td>
                  <td className="px-6 py-3 flex gap-2">
                    <AdminActions
                      onEdit={() => openModal(c)}
                      onDelete={() => handleDelete(c.id)}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tarjetas para mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4 max-w-xl mx-auto mt-8">
        {filtered.length === 0 && (
          <div className="text-center text-emerald-200 py-12">
            No hay clientes para mostrar.
          </div>
        )}
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            className="bg-emerald-800/90 rounded-xl p-5 shadow-xl flex flex-col gap-2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-emerald-100">{c.nombre}</h3>
              <AdminActions
                onEdit={() => openModal(c)}
                onDelete={() => handleDelete(c.id)}
              />
            </div>
            <div className="text-sm text-emerald-200/90">{c.email || '-'}</div>
            <div className="text-sm text-emerald-300">
              Tel:{' '}
              {c.telefono ? (
                <a
                  href={`https://wa.me/${formatWhatsappNumber(c.telefono)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-emerald-400 transition cursor-pointer"
                  title="Enviar WhatsApp"
                >
                  {formatDisplayPhone(c.telefono)}
                  <FaWhatsapp className="ml-1 text-green-500" />
                </a>
              ) : (
                '-'
              )}
            </div>

            <div className="text-xs text-emerald-400 mt-1">
              Última compra:{' '}
              {c.fecha_ultima_compra ? (
                new Date(c.fecha_ultima_compra).toLocaleDateString()
              ) : (
                <span className="italic text-emerald-200/60">Nunca</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal
            isOpen={modalOpen}
            onRequestClose={() => setModalOpen(false)}
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-emerald-500"
            closeTimeoutMS={300}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-emerald-600">
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
                    className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-white font-medium rounded-lg"
                  >
                    {editId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
