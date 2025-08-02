import React, { useEffect, useState } from 'react';
import {
  FaChartBar,
  FaStore,
  FaUserTie,
  FaMoneyBillWave
} from 'react-icons/fa';
import { useAuth } from '../../AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const VentasPorVendedor = () => {
  const { userLevel, userLocalId } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [locales, setLocales] = useState([]);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [desde, setDesde] = useState(new Date());
  const [hasta, setHasta] = useState(new Date());

  useEffect(() => {
    if (userLevel === 'admin') {
      fetch('http://localhost:8080/locales')
        .then((res) => res.json())
        .then((data) => setLocales(data));
    }
  }, [userLevel]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('desde', desde.toISOString().split('T')[0]);
    params.append('hasta', hasta.toISOString().split('T')[0]);
    if (userLevel === 'admin' && filtroLocal) {
      params.append('local_id', filtroLocal);
    } else {
      params.append('local_id', userLocalId);
    }

    fetch(`http://localhost:8080/ventas/por-vendedor?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVentas(data);
        } else {
          console.error('Respuesta inesperada:', data);
          setVentas([]);
        }
      })
      .catch((error) => {
        console.error('Error al obtener ventas por vendedor:', error);
        setVentas([]);
      });
  }, [desde, hasta, filtroLocal]);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6 flex items-center gap-2">
        <FaChartBar /> Ventas por Vendedor
      </h1>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Desde</label>
          <DatePicker
            selected={desde}
            onChange={(date) => setDesde(date)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasta</label>
          <DatePicker
            selected={hasta}
            onChange={(date) => setHasta(date)}
            className="border rounded px-3 py-2"
          />
        </div>
        {userLevel === 'admin' && (
          <div>
            <label className="block text-sm font-medium mb-1">Local</label>
            <select
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              {locales.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {ventas.length === 0 ? (
        <p className="text-gray-600 italic">
          No hay ventas registradas para este periodo.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ventas.map((venta) => (
            <div
              key={venta.usuario_id}
              className="rounded-2xl bg-gradient-to-br from-purple-600/30 via-purple-500/10 to-white/10 text-white p-5 border border-white/20 backdrop-blur-2xl shadow-xl"
            >
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <FaUserTie /> {venta.usuario_nombre}
              </h2>
              <p className="mb-1">
                <FaStore className="inline mr-2 text-sm" />
                <strong>Local:</strong> {venta.local_nombre}
              </p>
              <p className="mb-1">
                <FaMoneyBillWave className="inline mr-2 text-sm" />
                <strong>Ventas:</strong> {venta.cantidad_ventas}
              </p>
              <p className="text-lg font-bold text-emerald-300 mt-1">
                💰 Total:{' '}
                {Number(venta.total_vendido).toLocaleString('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VentasPorVendedor;
