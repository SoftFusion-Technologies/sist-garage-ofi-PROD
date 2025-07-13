// MovimientosGlobal.jsx
import { useState, useEffect } from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaMoneyBillWave,
  FaSearch,
  FaFileDownload
} from 'react-icons/fa';
import { format } from 'date-fns';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import DetalleMovimientoModal from './Config/DetalleMovimientoModal';
const tipoIcons = {
  ingreso: <FaArrowUp className="text-emerald-400" />,
  egreso: <FaArrowDown className="text-red-400" />
};

export default function MovimientosGlobal() {
  const [movimientos, setMovimientos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8080/movimientos_caja')
      .then((res) => res.json())
      .then((data) => setMovimientos(data))
      .finally(() => setLoading(false));
  }, []);

  const movimientosFiltrados = movimientos.filter(
    (mov) =>
      (tipoFiltro === 'todos' || mov.tipo === tipoFiltro) &&
      (mov.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (mov.referencia && mov.referencia.toString().includes(busqueda)) ||
        (mov.caja_id && mov.caja_id.toString().includes(busqueda)))
  );

  // Exportar a CSV
  const exportarCSV = () => {
    const header = 'Caja,Fecha,Tipo,Descripción,Monto,Referencia\n';
    const rows = movimientosFiltrados.map((m) =>
      [
        m.caja_id,
        format(new Date(m.fecha), 'dd/MM/yyyy HH:mm'),
        m.tipo,
        `"${m.descripcion.replace(/"/g, '""')}"`,
        m.monto,
        m.referencia || ''
      ].join(',')
    );
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos-caja-historial.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdate = (movActualizado) => {
    setMovimientos((movs) =>
      movs.map((m) =>
        m.id === movActualizado.id ? { ...m, ...movActualizado } : m
      )
    );
  };

  const handleDelete = (id) => {
    setMovimientos((movs) => movs.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#101016] via-[#181A23] to-[#11192b] px-2 py-8">
      <ParticlesBackground />
      <ButtonBack></ButtonBack>

      <div className="p-5 bg-[#212432] rounded-2xl shadow-lg w-full max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <FaMoneyBillWave /> Historial global de movimientos de caja
            </h2>
            <span className="text-gray-400 text-xs mt-1 block">
              Todos los movimientos de todas las cajas
            </span>
          </div>
          <div className="flex gap-2 items-end">
            <button
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-2 text-sm font-bold shadow transition"
              onClick={exportarCSV}
            >
              <FaFileDownload className="mr-1" /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:gap-5 mb-4 gap-2">
          <div className="flex items-center gap-2 bg-[#23253a] rounded-lg px-3 py-2 w-full md:w-auto">
            <FaSearch className="text-gray-400" />
            <input
              className="bg-transparent outline-none text-white text-sm flex-1"
              type="text"
              placeholder="Buscar descripción, referencia o caja..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg px-3 py-2 bg-[#23253a] text-white text-sm"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
        </div>

        {loading ? (
          <div className="py-14 text-center text-gray-400">
            Cargando movimientos...
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="py-14 text-center text-gray-400">
            No se encontraron movimientos.
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border border-[#262940]">
            <table className="w-full text-left text-sm bg-[#23253a]">
              <thead>
                <tr className="text-emerald-300 font-semibold border-b border-[#262940]">
                  <th className="px-4 py-2">Caja</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2 text-right">Monto</th>
                  <th className="px-4 py-2">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((mov) => (
                  <tr
                    key={mov.id}
                    className="hover:bg-emerald-900/10 transition cursor-pointer"
                    onClick={() => setDetalle(mov)}
                  >
                    <td className="px-4 py-2 text-gray-300 font-mono">
                      {mov.caja_id}
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      {format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-2">
                      {tipoIcons[mov.tipo]}
                      <span
                        className={
                          mov.tipo === 'ingreso'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }
                      >
                        {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-100">
                      {mov.descripcion}
                    </td>
                    <td
                      className={`px-4 py-2 font-mono text-right text-lg ${
                        mov.tipo === 'ingreso'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {mov.tipo === 'ingreso' ? '+' : '-'}
                      {parseFloat(mov.monto).toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS'
                      })}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-300">
                      {mov.referencia || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-emerald-400 hover:underline font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetalle(mov);
                        }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DetalleMovimientoModal
        movimiento={detalle}
        onClose={() => setDetalle(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
