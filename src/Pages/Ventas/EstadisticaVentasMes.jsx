import React, { useEffect, useState } from 'react';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
export default function EstadisticaVentasMes({ apiUrl }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(apiUrl || 'http://localhost:8080/ventas-mes')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar los datos');
        return res.json();
      })
      .then((data) => {
        const agrupados = data.reduce((acc, item) => {
          const prod = acc.find((p) => p.id === item.id);
          if (prod) {
            prod.total_vendido += Number(item.total_vendido);
          } else {
            acc.push({ ...item, total_vendido: Number(item.total_vendido) });
          }
          return acc;
        }, []);
        agrupados.sort((a, b) => b.total_vendido - a.total_vendido);
        setProductos(agrupados);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [apiUrl]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-48 text-indigo-600 font-semibold text-xl animate-pulse">
        Cargando estadísticas...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600 font-bold bg-red-50 rounded-lg shadow-lg max-w-md mx-auto">
        Error: {error}
      </div>
    );

  const maxVentas = productos.length > 0 ? productos[0].total_vendido : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#000000] py-12 px-6 text-white relative font-sans">
      <ParticlesBackground />
      <ButtonBack />
      <section className="max-w-7xl mx-auto p-8 bg-gradient-to-tr from-gray-900 via-indigo-900 to-indigo-700 rounded-3xl shadow-2xl text-white font-sans">
        <h2 className="text-5xl font-extrabold mb-10 text-center tracking-tight text-white drop-shadow-xl">
          📊 <span className="text-indigo-300">Ventas Mensuales</span> -
          Productos
        </h2>

        <div className="overflow-x-auto rounded-3xl shadow-2xl bg-indigo-800/20 backdrop-blur-sm border border-indigo-600">
          <table className="min-w-[720px] w-full text-left">
            <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700 sticky top-0 z-10 shadow-md text-white font-semibold text-lg">
              <tr>
                <th className="py-4 px-8">Producto</th>
                <th className="py-4 px-8 text-right">Cantidad Vendida</th>
                <th className="py-4 px-8">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(({ id, nombre, total_vendido }, i) => {
                const porcentaje = (total_vendido / maxVentas) * 100;

                // Color progresivo basado en posición (de más claro a más vibrante)
                const colorBar = `bg-gradient-to-r ${
                  i < productos.length * 0.1
                    ? 'from-indigo-400 via-indigo-500 to-indigo-600'
                    : i < productos.length * 0.4
                    ? 'from-indigo-300 via-indigo-400 to-indigo-500'
                    : 'from-indigo-200 via-indigo-300 to-indigo-400'
                }`;

                return (
                  <tr
                    key={id}
                    className={`transition-all duration-500 hover:scale-[1.02] hover:shadow-lg transform-gpu ${
                      i % 2 === 0 ? 'bg-indigo-900/30' : 'bg-indigo-900/10'
                    } cursor-default select-none`}
                  >
                    <td
                      className="py-5 px-8 font-semibold text-indigo-100 text-lg max-w-xs truncate"
                      title={nombre}
                    >
                      {nombre}
                    </td>
                    <td className="py-5 px-8 text-right  font-mono text-indigo-200 text-xl">
                      {total_vendido}
                    </td>
                    <td className="py-5 px-8">
                      <div className="relative h-7 rounded-full bg-indigo-900/30 shadow-inner">
                        <div
                          className={`${colorBar} h-7 rounded-full shadow-xl`}
                          style={{
                            width: `${porcentaje}%`,
                            transition: 'width 0.7s ease-in-out'
                          }}
                        />
                        <span className="absolute right-4 top-0 bottom-0 flex items-center text-indigo-50 font-semibold drop-shadow-md select-none text-sm">
                          {porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-indigo-300 text-sm tracking-wide italic drop-shadow-md max-w-2xl mx-auto">
          Esta tabla muestra la cantidad vendida de cada producto en el mes
          actual, ordenada del más vendido al menos vendido. Los colores y
          animaciones facilitan la lectura y jerarquía visual.
        </p>
      </section>
    </div>
  );
}
