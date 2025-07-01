import { useState } from 'react';
import {
  FaTimes,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import { dynamicIcon } from '../../utils/dynamicIcon';
import axios from 'axios';

export default function ModalMediosPago({
  show,
  onClose,
  mediosPago,
  setMediosPago
}) {
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [modoCrear, setModoCrear] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0,
    activo: 1
  });
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  // Guardar o editar
  const guardar = async () => {
    setLoading(true);
    try {
      if (editando) {
        await axios.put(
          `http://localhost:8080/medios-pago/${editando.id}`,
          nuevo
        );
        setMediosPago((prev) =>
          prev.map((m) => (m.id === editando.id ? { ...m, ...nuevo } : m))
        );
        setEditando(null);
      } else {
        const res = await axios.post(
          'http://localhost:8080/medios-pago',
          nuevo
        );
        setMediosPago((prev) => [...prev, res.data.medio]);
        setModoCrear(false);
      }
      setNuevo({ nombre: '', descripcion: '', icono: '', orden: 0, activo: 1 });
    } finally {
      setLoading(false);
    }
  };

  // Borrar
  const borrar = async (id) => {
    if (!window.confirm('¿Eliminar medio de pago?')) return;
    await axios.delete(`http://localhost:8080/medios-pago/${id}`);
    setMediosPago((prev) => prev.filter((m) => m.id !== id));
  };

  // Editar
  const comenzarEdicion = (m) => {
    setEditando(m);
    setModoCrear(false);
    setNuevo({ ...m });
  };

  // Cancelar edición o creación
  const cancelarFormulario = () => {
    setEditando(null);
    setModoCrear(false);
    setNuevo({ nombre: '', descripcion: '', icono: '', orden: 0, activo: 1 });
  };

  const mediosFiltrados = mediosPago.filter((m) =>
    (m.nombre + m.descripcion).toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-0 w-full max-w-xl relative flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 px-6 py-4 sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/90 backdrop-blur rounded-t-3xl">
          <h2 className="titulo uppercase text-2xl font-bold tracking-tight text-zinc-700 dark:text-zinc-100">
            Gestionar medios de pago
          </h2>
          <button
            className="text-2xl text-zinc-400 hover:text-red-500 transition"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        {/* Buscador */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 sticky top-14 z-10">
          <span className="text-zinc-400">
            <FaSearch />
          </span>
          <input
            type="text"
            className="flex-1 bg-transparent focus:outline-none text-lg px-2 py-1 text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400"
            placeholder="Buscar medio de pago..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button
            onClick={() => {
              setEditando(null);
              setModoCrear(true);
              setNuevo({
                nombre: '',
                descripcion: '',
                icono: '',
                orden: 0,
                activo: 1
              });
            }}
            className="rounded-full p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-zinc-800"
            title="Crear nuevo medio de pago"
          >
            <FaPlus />
          </button>
        </div>

        {/* Formulario */}
        {(editando || modoCrear) && (
          <div className="px-6 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95">
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <input
                type="text"
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-base"
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                autoFocus
              />
              <input
                type="text"
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-base"
                placeholder="Descripción"
                value={nuevo.descripcion}
                onChange={(e) =>
                  setNuevo({ ...nuevo, descripcion: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <input
                type="text"
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-base"
                placeholder="Icono (ej: FaMoneyBillAlt)"
                value={nuevo.icono}
                onChange={(e) => setNuevo({ ...nuevo, icono: e.target.value })}
              />
              <input
                type="number"
                className="w-32 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-base"
                placeholder="Orden"
                value={nuevo.orden}
                onChange={(e) =>
                  setNuevo({ ...nuevo, orden: parseInt(e.target.value) || 0 })
                }
              />
              <button
                type="button"
                className="flex items-center gap-1 border-none bg-transparent px-2"
                title={nuevo.activo ? 'Activo' : 'Inactivo'}
                onClick={() =>
                  setNuevo({ ...nuevo, activo: nuevo.activo ? 0 : 1 })
                }
              >
                {nuevo.activo ? (
                  <FaToggleOn className="text-emerald-500 text-2xl" />
                ) : (
                  <FaToggleOff className="text-zinc-400 text-2xl" />
                )}
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                disabled={loading || !nuevo.nombre}
                onClick={guardar}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-xl transition"
              >
                {editando ? 'Guardar cambios' : 'Agregar'}
              </button>
              <button
                type="button"
                className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 font-semibold px-6 py-2 rounded-xl transition"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="flex-1 overflow-y-auto px-2 py-2 bg-white/70 dark:bg-zinc-900/80">
          {mediosFiltrados.length === 0 && (
            <div className="text-zinc-400 text-center mt-8">
              No hay resultados.
            </div>
          )}
          {mediosFiltrados.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-zinc-800 transition group"
            >
              <span className="text-xl">{dynamicIcon(m.icono)}</span>
              <span className="flex-1 font-medium text-zinc-700 dark:text-zinc-200 truncate">
                {m.nombre}
              </span>
              {m.descripcion && (
                <span className="text-xs text-zinc-400 truncate max-w-[120px]">
                  {m.descripcion}
                </span>
              )}
              <span className="text-xs text-zinc-400">{m.orden}</span>
              <button
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-full"
                title="Editar"
                onClick={() => comenzarEdicion(m)}
              >
                <FaEdit />
              </button>
              <button
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-full"
                title="Eliminar"
                onClick={() => borrar(m.id)}
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
