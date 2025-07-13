import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaRegCalendarAlt,
  FaStore,
  FaMoneyBillWave,
  FaFileDownload
} from 'react-icons/fa';
import { format } from 'date-fns';
import clsx from 'clsx';
import ParticlesBackground from '../../Components/ParticlesBackground';

// Simulando endpoint
const fetchVentas = async () => {
  const res = await fetch('http://localhost:8080/ventas-historial');
  return await res.json();
};

export default function VentasTimeline() {
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroLocal, setFiltroLocal] = useState('');
  const [locales, setLocales] = useState([]);

  useEffect(() => {
    fetchVentas().then(setVentas);
    // Traer locales para filtro
    fetch('http://localhost:8080/locales')
      .then((r) => r.json())
      .then(setLocales);
  }, []);

  const ventasFiltradas = ventas.filter((v) => {
    const f1 =
      busqueda.length === 0 ||
      v.cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.vendedor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.local?.toLowerCase().includes(busqueda.toLowerCase());
    const f2 =
      !filtroFecha || format(new Date(v.fecha), 'yyyy-MM-dd') === filtroFecha;
    const f3 = !filtroLocal || v.local === filtroLocal;
    return f1 && f2 && f3;
  });

  // Para el efecto timeline
  const colorMap = ['emerald', 'cyan', 'blue', 'violet', 'fuchsia'];
  const getColor = (i) => colorMap[i % colorMap.length];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#181c25] via-[#1e2340] to-[#131a22] flex flex-col items-center px-2 py-8 relative">
      {/* Filtros */}
      <ParticlesBackground></ParticlesBackground>
      <motion.div
        className="sticky top-0 z-30 w-full max-w-2xl mx-auto mb-8 bg-[#1a1e2e]/80 backdrop-blur-lg rounded-2xl shadow-xl flex flex-wrap md:flex-nowrap items-center gap-2 px-4 py-3"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-2 flex-1 bg-[#202542] rounded-xl px-2 py-1">
          <FaSearch className="text-emerald-400" />
          <input
            className="bg-transparent text-white outline-none w-full placeholder:text-gray-400"
            type="text"
            placeholder="Buscar cliente, vendedor o local..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <FaRegCalendarAlt />
            <input
              type="date"
              className="bg-[#202542] text-white px-2 py-1 rounded"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <FaStore />
            <select
              className="bg-[#202542] text-white px-2 py-1 rounded"
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
            >
              <option value="">Todos</option>
              {locales.map((l) => (
                <option key={l.id} value={l.nombre}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          onClick={() => {
            // Exportar CSV
            const header = 'Venta,Fecha,Cliente,Vendedor,Local,Total\n';
            const rows = ventasFiltradas.map(
              (v) =>
                `${v.venta_id},${format(
                  new Date(v.fecha),
                  'dd/MM/yyyy HH:mm'
                )},${v.cliente},${v.vendedor},${v.local},${v.total}`
            );
            const blob = new Blob([header + rows.join('\n')], {
              type: 'text/csv'
            });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ventas-historial.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="ml-auto flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-2 text-sm font-bold shadow transition"
        >
          <FaFileDownload /> Exportar CSV
        </button>
      </motion.div>

      {/* Timeline */}
      <div className="w-full max-w-2xl">
        {ventasFiltradas.length === 0 ? (
          <div className="py-14 text-center text-gray-400 animate-pulse">
            Sin ventas registradas.
          </div>
        ) : (
          <ol className="relative border-l-4 border-emerald-500/30 pl-6 space-y-10">
            {ventasFiltradas.map((venta, i) => (
              <motion.li
                key={venta.venta_id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={clsx(
                  'group relative bg-gradient-to-r',
                  `from-emerald-900/${80 - i * 4} to-[#232942]`,
                  'hover:scale-105 transition-transform rounded-xl px-5 py-4 shadow-xl border border-[#252b3f] cursor-pointer'
                )}
                onClick={() => setDetalle(venta)}
              >
                <span
                  className={clsx(
                    'absolute -left-8 top-4 w-6 h-6 rounded-full border-4',
                    `border-emerald-500/80 bg-emerald-800 shadow-lg animate-pulse`
                  )}
                ></span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">
                    {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm')}
                  </span>
                  <span
                    className="font-bold text-lg text-white tracking-wider"
                    style={{ letterSpacing: 2 }}
                  >
                    #{venta.venta_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-10 h-10 bg-emerald-400/90 rounded-full flex items-center justify-center font-bold text-black shadow-lg text-xl uppercase">
                    {venta.cliente?.[0] || 'C'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {venta.cliente}
                    </div>
                    <div className="text-xs text-gray-300 flex gap-2">
                      {venta.vendedor}{' '}
                      <span className="mx-1 text-emerald-400">|</span>{' '}
                      {venta.local}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Estado:{' '}
                    <span
                      className={clsx(
                        venta.estado === 'anulada'
                          ? 'text-red-400'
                          : 'text-emerald-300'
                      )}
                    >
                      {venta.estado}
                    </span>
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-300">
                    ${Number(venta.total).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="absolute hidden group-hover:flex top-1/2 right-5 -translate-y-1/2 gap-1 animate-fade-in">
                  <span className="px-3 py-1 text-xs rounded-full bg-emerald-700/90 text-white font-bold">
                    Ver detalle
                  </span>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </div>

      {/* Slideover de detalle */}
      <AnimatePresence>
        {detalle && (
          <motion.div
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#191e28] shadow-2xl border-l-2 border-emerald-600 z-50 overflow-y-auto animate-fade-in"
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
          >
            <div className="flex items-center justify-between px-7 py-5 border-b border-emerald-500">
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <FaMoneyBillWave /> Venta #{detalle.venta_id}
              </div>
              <button
                onClick={() => setDetalle(null)}
                className="text-gray-400 hover:text-emerald-400 text-3xl transition"
              >
                ×
              </button>
            </div>
            {/* Info principal */}
            <div className="px-7 pt-6 pb-3">
              <div className="text-xs text-gray-400 mb-2">
                {format(new Date(detalle.fecha), 'EEEE dd/MM/yyyy HH:mm')}
              </div>
              <div className="mb-3">
                <div className="text-lg font-bold text-white">
                  Cliente:{' '}
                  <span className="text-emerald-300">{detalle.cliente}</span>
                </div>
                <div className="text-sm text-gray-300">
                  Vendedor: {detalle.vendedor} • Local: {detalle.local}
                </div>
              </div>
              <div className="font-bold text-lg text-right text-emerald-400">
                Total: ${Number(detalle.total).toLocaleString('es-AR')}
              </div>
            </div>
            {/* Aquí podrías hacer fetch y renderizar el detalle del producto vendido */}
            <div className="px-7 py-4">
              <span className="text-sm text-gray-400">
                (Aquí iría el detalle completo: productos, cantidades,
                descuentos, etc.)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
