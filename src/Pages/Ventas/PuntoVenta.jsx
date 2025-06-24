// src/Pages/Ventas/PuntoVenta.jsx
import React, { useEffect, useState } from 'react';
import {
  FaCashRegister,
  FaSearch,
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaCreditCard,
  FaMoneyBillAlt
} from 'react-icons/fa';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
const mediosPago = [
  { value: 'efectivo', label: 'Efectivo', icon: <FaMoneyBillAlt /> },
  { value: 'tarjeta', label: 'Tarjeta', icon: <FaCreditCard /> }
];

export default function PuntoVenta() {
  /* ---------------------- hooks y estado ---------------------- */
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]); // resultados del backend
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('efectivo');

  useEffect(() => {
    const delay = setTimeout(() => {
      if (busqueda.trim() !== '') {
        fetch(
          `http://localhost:8080/buscar-productos?query=${encodeURIComponent(
            busqueda
          )}`
        )
          .then((res) => res.json())
          .then((data) => setProductos(data))
          .catch((err) => console.error('Error al buscar productos', err));
      } else {
        setProductos([]);
      }
    }, 100); // 300ms de debounce

    return () => clearTimeout(delay);
  }, [busqueda]);

  /* --------- filtro local opcional (ya vienen filtrados) ------ */
  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  /* ------------------- carrito de venta ----------------------- */
  const agregarProducto = (item) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.stock_id === item.stock_id);
      if (existe) {
        // no superar stock disponible
        if (existe.cantidad >= item.cantidad_disponible) return prev;
        return prev.map((i) =>
          i.stock_id === item.stock_id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (stockId, delta) =>
    setCarrito((prev) =>
      prev
        .map((it) =>
          it.stock_id === stockId
            ? {
                ...it,
                cantidad: Math.max(
                  1,
                  Math.min(
                    it.cantidad + delta,
                    it.cantidad_disponible // límite
                  )
                )
              }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );

  const quitarProducto = (stockId) =>
    setCarrito((prev) => prev.filter((i) => i.stock_id !== stockId));

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  /* ------------- registrar venta (placeholder) ---------------- */
  const finalizarVenta = () => {
    // Aquí luego haremos POST /ventas con carrito y medioPago
    alert(`Venta registrada\nTotal: $${total}\nMedio: ${medioPago}`);
    setCarrito([]);
  };

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);

  /* ======================= VISTA ========================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
      {/* Encabezado */}
      <ParticlesBackground></ParticlesBackground>
      <h1 className="text-3xl font-bold mb-6 titulo uppercase flex items-center gap-3 text-emerald-400">
        <FaCashRegister /> Punto de Venta
      </h1>
      {/* Buscador */}
      <div className="relative w-full max-w-3xl mb-6">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 text-lg" />
        <input
          type="text"
          placeholder="Buscar por nombre o SKU..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10 pr-4 py-3 w-full rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md"
        />
      </div>
      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna productos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-1">
            {filtrados.length === 0 && (
              <p className="text-gray-400 col-span-full">Sin resultados…</p>
            )}
            {filtrados.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 p-4 rounded-xl shadow hover:shadow-lg  transition relative flex flex-col"
              >
                <span className="font-bold text-lg text-white mb-1">
                  {p.nombre}
                </span>
                <span className="text-emerald-300 text-sm mt-auto">
                  {formatearPrecio(p.precio)}
                </span>
                <button
                  onClick={() => agregarProducto(p)}
                  className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow"
                  title="Agregar al carrito"
                >
                  <FaPlus />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Columna carrito */}
        <div className="bg-white/10 p-4 rounded-xl sticky top-24 h-fit space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaShoppingCart /> Carrito ({carrito.length})
          </h2>

          {carrito.length === 0 ? (
            <p className="text-gray-400">Aún no hay artículos</p>
          ) : (
            <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
              {carrito.map((item) => (
                <div
                  key={item.stock_id}
                  className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg text-sm"
                >
                  <div className="text-white font-medium w-1/2 truncate">
                    {item.nombre}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarCantidad(item.stock_id, -1)}
                      className="p-1"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.stock_id, 1)}
                      className="p-1"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="text-emerald-300 w-20 text-right">
                    {formatearPrecio(item.precio * item.cantidad)}
                  </div>

                  <button
                    onClick={() => quitarProducto(item.stock_id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="text-right text-lg font-bold text-white">
            Total: {formatearPrecio(total)}
          </div>

          {/* Medios de pago */}
          <div className="flex gap-2">
            {mediosPago.map((m) => (
              <button
                key={m.value}
                onClick={() => setMedioPago(m.value)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-semibold transition flex items-center gap-1 justify-center ${
                  medioPago === m.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={finalizarVenta}
            disabled={carrito.length === 0}
            className={`w-full py-3 rounded-xl font-bold transition ${
              carrito.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
