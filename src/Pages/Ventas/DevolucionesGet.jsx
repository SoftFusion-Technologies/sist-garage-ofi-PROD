import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';

export default function DevolucionesPage() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { userId, userLocalId } = useAuth();

  const [nuevaDevolucion, setNuevaDevolucion] = useState({
    venta_id: '',
    motivo: ''
  });

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  const cargarDevoluciones = async () => {
    try {
      const res = await fetch('http://localhost:8080/devoluciones');
      const data = await res.json();
      setDevoluciones(data);
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
    }
  };

  const devolucionesFiltradas = devoluciones.filter((d) => {
    const coincideTexto =
      d.descripcion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      d.id?.toString().includes(filtroTexto);
    const coincideFecha = fechaFiltro
      ? new Date(d.fecha).toLocaleDateString() ===
        new Date(fechaFiltro).toLocaleDateString()
      : true;
    return coincideTexto && coincideFecha;
  });

  const handleCrearDevolucion = async () => {
    try {
      const res = await fetch('http://localhost:8080/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevaDevolucion,
          usuario_id: userId,
          local_id: userLocalId,
          detalles: [
            {
              detalle_venta_id: 1,
              stock_id: 1,
              cantidad: 1,
              monto: 10000
            }
          ]
        })
      });

      const data = await res.json();
      if (res.ok) {
        cargarDevoluciones();
        setModalOpen(false);
        setNuevaDevolucion({ venta_id: '', motivo: '' });
        alert('Devolución registrada correctamente');
      } else {
        alert(data.mensajeError);
      }
    } catch (error) {
      console.error('Error al crear devolución:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 text-white">
      <ParticlesBackground></ParticlesBackground>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-[#1f1b3a] shadow-2xl rounded-3xl p-6 border border-violet-600">
          <h1 className="titulo uppercase text-4xl font-extrabold tracking-wide text-violet-300 mb-4">
            🚀 Gestión de Devoluciones
          </h1>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="🔍 Buscar por descripción o ID..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="bg-[#2a254b] text-white border border-violet-500 placeholder-gray-400 rounded-xl px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-[#2a254b] text-white border border-violet-500 rounded-xl px-4 py-2 w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={() => setModalOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-bold px-6 py-2 rounded-xl shadow-xl transition-transform hover:scale-105"
            >
              + Nueva Devolución
            </button>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1f1b3a] rounded-3xl border border-violet-700 p-8 w-full max-w-xl text-white shadow-2xl space-y-6"
            >
              <h2 className="text-2xl font-bold text-cyan-300">
                🌌 Registrar Nueva Devolución
              </h2>
              <input
                type="text"
                placeholder="ID Venta"
                value={nuevaDevolucion.venta_id}
                onChange={(e) =>
                  setNuevaDevolucion({
                    ...nuevaDevolucion,
                    venta_id: e.target.value
                  })
                }
                className="w-full bg-[#2a254b] text-white border border-cyan-400 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <input
                type="text"
                placeholder="Motivo"
                value={nuevaDevolucion.motivo}
                onChange={(e) =>
                  setNuevaDevolucion({
                    ...nuevaDevolucion,
                    motivo: e.target.value
                  })
                }
                className="w-full bg-[#2a254b] text-white border border-cyan-400 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <div className="flex justify-end gap-4 pt-2">
                <button
                  onClick={handleCrearDevolucion}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-2 rounded-xl shadow hover:shadow-cyan-500/40 transition-transform hover:scale-105"
                >
                  Registrar
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-xl transition-transform hover:scale-105"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {devolucionesFiltradas.map((d) => (
            <div
              key={d.id}
              className="bg-[#1f1b3a] border border-violet-700 rounded-2xl p-6 shadow-lg hover:shadow-cyan-500/30 transition-transform hover:scale-[1.02]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-2xl font-bold text-cyan-400">DEV-{d.id}</h3>
                <span className="text-sm text-gray-400">
                  {new Date(d.fecha).toLocaleString()}
                </span>
              </div>
              <p className="text-xl font-semibold text-red-400">
                -
                {Number(d.total_devuelto).toLocaleString('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                })}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Motivo: {d.motivo || 'Sin motivo'}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
