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

const mediosPago = [
  { value: 'efectivo', label: 'Efectivo', icon: <FaMoneyBillAlt /> },
  { value: 'tarjeta', label: 'Tarjeta', icon: <FaCreditCard /> }
];

// Agrupa productos por producto_id y junta sus talles en un array
function agruparProductosConTalles(stockItems) {
  const map = new Map();

  stockItems.forEach((item) => {
    const productoNombre = item.nombre || 'Producto desconocido';
    const productoPrecio = parseFloat(item.precio || 0);

    if (!map.has(item.producto_id)) {
      map.set(item.producto_id, {
        id: item.producto_id,
        producto_id: item.producto_id,
        nombre: productoNombre,
        precio: productoPrecio,
        talles: []
      });
    }

    const producto = map.get(item.producto_id);

    producto.talles.push({
      id: item.talle_id,
      nombre: item.talle_nombre || 'Sin talle',
      cantidad: item.cantidad_disponible,
      stock_id: item.stock_id,
      codigo_sku: item.codigo_sku
    });
  });

  return Array.from(map.values());
}

export default function PuntoVenta() {
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]); // Productos agrupados con talles
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('efectivo');

  const [modalProducto, setModalProducto] = useState(null);
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  // Cambiar aquí para probar otras rutas si querés:
  const endpoint = '/buscar-productos-detallado';

  useEffect(() => {
    const delay = setTimeout(() => {
      if (busqueda.trim() !== '') {
        fetch(
          `http://localhost:8080/buscar-productos-detallado?query=${encodeURIComponent(
            busqueda
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const agrupados = agruparProductosConTalles(data);
              setProductos(agrupados);
            } else {
              setProductos([]);
            }
          })
          .catch((err) => {
            console.error('Error al buscar productos:', err);
            setProductos([]);
          });
      } else {
        setProductos([]);
      }
    }, 100);

    return () => clearTimeout(delay);
  }, [busqueda]);

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, talle) => {
    const stockId = `${producto.producto_id}-${talle.id}`;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.stock_id === stockId);
      if (existe) {
        if (existe.cantidad >= talle.cantidad) return prev;
        return prev.map((i) =>
          i.stock_id === stockId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          stock_id: stockId,
          producto_id: producto.producto_id,
          nombre: `${producto.nombre} - ${talle.nombre}`,
          precio: producto.precio,
          talla_id: talle.id,
          cantidad_disponible: talle.cantidad,
          cantidad: 1
        }
      ];
    });
    setModalProducto(null);
    setTalleSeleccionado(null);
  };

  // Manejo click para agregar producto (modal si tiene varios talles)
  const manejarAgregarProducto = (producto) => {
    if (!producto.talles || producto.talles.length === 0) return;

    if (producto.talles.length === 1) {
      agregarAlCarrito(producto, producto.talles[0]);
    } else {
      setModalProducto(producto);
      setTalleSeleccionado(null);
    }
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
                  Math.min(it.cantidad + delta, it.cantidad_disponible)
                )
              }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );

  const quitarProducto = (stockId) =>
    setCarrito((prev) => prev.filter((i) => i.stock_id !== stockId));

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const finalizarVenta = () => {
    alert(`Venta registrada\nTotal: $${total}\nMedio: ${medioPago}`);
    setCarrito([]);
  };

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
      <ParticlesBackground />
      {/* <ButtonBack /> */}
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

      {/* Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-1">
            {productos.length === 0 && (
              <p className="text-gray-400 col-span-full">Sin resultados…</p>
            )}
            {productos.map((producto) => (
              <div
                key={producto.producto_id}
                className="bg-white/5 p-4 rounded-xl shadow hover:shadow-lg transition relative flex flex-col"
              >
                <span className="font-bold text-lg text-white mb-1">
                  {producto.nombre}
                </span>
                <span className="text-emerald-300 text-sm mt-auto">
                  {formatearPrecio(producto.precio)}
                </span>
                <button
                  onClick={() => manejarAgregarProducto(producto)}
                  className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow"
                  title="Agregar al carrito"
                >
                  <FaPlus />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito */}
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
                    title="Quitar producto"
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

      {/* Modal para seleccionar talle si hay más de uno */}
      {modalProducto && modalProducto.talles && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg animate-fadeIn">
            <h3
              id="modal-title"
              className="text-2xl font-bold mb-5 text-center text-gray-800"
            >
              Seleccioná talle para{' '}
              <span className="text-emerald-600">{modalProducto.nombre}</span>
            </h3>

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-gray-100">
              {modalProducto.talles.map((talle) => {
                const selected = talleSeleccionado?.id === talle.id;
                return (
                  <button
                    key={talle.id}
                    onClick={() => setTalleSeleccionado(talle)}
                    className={`flex justify-between items-center p-4 rounded-lg border transition-shadow focus:outline-none ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg'
                        : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
                    }`}
                    aria-pressed={selected}
                    type="button"
                  >
                    <span className="text-lg font-semibold">
                      {talle.nombre || 'Sin talle'}
                    </span>
                    <span className="text-sm font-medium opacity-75">
                      {talle.cantidad} disponibles
                    </span>
                    {selected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setModalProducto(null);
                  setTalleSeleccionado(null);
                }}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={!talleSeleccionado}
                onClick={() =>
                  agregarAlCarrito(modalProducto, talleSeleccionado)
                }
                className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                  talleSeleccionado
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-emerald-300 cursor-not-allowed'
                }`}
                type="button"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
