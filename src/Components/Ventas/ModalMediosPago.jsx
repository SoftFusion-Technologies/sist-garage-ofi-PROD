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

  const SUGERENCIAS_ICONS = [
    {
      keywords: ['efectivo', 'cash', 'dinero', 'contado'],
      icon: 'FaMoneyBillAlt'
    },
    {
      keywords: [
        'tarjeta',
        'credito',
        'crédito',
        'débito',
        'debito',
        'master',
        'visa'
      ],
      icon: 'FaCreditCard'
    },
    {
      keywords: [
        'transferencia',
        'transfer',
        'cbu',
        'cb',
        'bancaria',
        'banco',
        'bank',
        'cuenta',
        'account'
      ],
      icon: 'MdAccountBalance'
    },
    {
      keywords: [
        'mercadopago',
        'mp',
        'mercado pago',
        'uala',
        'uála',
        'naranja x',
        'naranjax',
        'naranja-x',
        'personal pay',
        'personalpay',
        'personal-pay',
        'app'
      ],
      icon: 'FaMobileAlt'
    },
    { keywords: ['billetera', 'wallet'], icon: 'FaWallet' },
    { keywords: ['paypal'], icon: 'FaPaypal' },
    {
      keywords: ['bitcoin', 'btc', 'crypto', 'criptomoneda'],
      icon: 'FaBitcoin'
    },
    { keywords: ['dolar', 'dólar', 'usd'], icon: 'FiDollarSign' },
    { keywords: ['euro', 'eur'], icon: 'FiEuro' }
    // Más combinaciones si querés
  ];

  function sugerirIcono(nombreMedio, iconoManual = '') {
    if (iconoManual) return iconoManual;

    const nombreLimpio = nombreMedio.trim().toLowerCase();
    if (!nombreLimpio) return '';

    // Busca coincidencia por keyword
    for (let sugerencia of SUGERENCIAS_ICONS) {
      for (let kw of sugerencia.keywords) {
        if (nombreLimpio.includes(kw)) {
          return sugerencia.icon;
        }
      }
    }
    return '';
  }

  const sugerido = sugerirIcono(nuevo.nombre, nuevo.icono);
  const iconoElegido = nuevo.icono || sugerido;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn px-2 sm:px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-0 w-full max-w-lg sm:max-w-xl md:max-w-2xl relative flex flex-col max-h-[95vh] border border-zinc-200 dark:border-zinc-800">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/90 backdrop-blur rounded-t-3xl">
          <h2 className="uppercase titulo text-lg sm:text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-50">
            Gestionar medios de pago
          </h2>
          <button
            className="text-xl sm:text-2xl text-zinc-400 hover:text-red-500 transition"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        {/* Buscador */}
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 sticky top-14 z-10">
          <span className="text-zinc-400 text-lg">
            <FaSearch />
          </span>
          <input
            type="text"
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 focus:outline-none text-base sm:text-lg px-2 sm:px-3 py-2 rounded-xl placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-100 border-none"
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
            className="rounded-full p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition"
            title="Crear nuevo medio de pago"
          >
            <FaPlus />
          </button>
        </div>

        {/* Formulario */}
        {(editando || modoCrear) && (
          <div className="px-4 sm:px-8 pt-4 sm:pt-5 pb-2 sm:pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-white/98 dark:bg-zinc-900/98">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-2 sm:mb-3">
              <input
                type="text"
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-emerald-500"
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                autoFocus
              />
              <input
                type="text"
                className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base bg-zinc-50 dark:bg-zinc-800"
                placeholder="Descripción"
                value={nuevo.descripcion}
                onChange={(e) =>
                  setNuevo({ ...nuevo, descripcion: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-2 sm:mb-3 items-stretch w-full">
              <div className="flex flex-col w-full sm:flex-row sm:items-center gap-2 sm:gap-2 flex-1">
                {/* Input Icono */}
                <input
                  type="text"
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base bg-zinc-50 dark:bg-zinc-800 flex-1 w-full"
                  placeholder="Icono (ej: FaMoneyBillAlt)"
                  value={nuevo.icono}
                  onChange={(e) =>
                    setNuevo({ ...nuevo, icono: e.target.value })
                  }
                />
                {/* Sugerencia: mobile → abajo, desktop → al lado */}
                {!nuevo.icono && sugerido && (
                  <button
                    type="button"
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 font-semibold text-xs sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                    onClick={() => setNuevo({ ...nuevo, icono: sugerido })}
                    title="Usar ícono sugerido"
                    style={{ minWidth: 90 }}
                  >
                    {dynamicIcon(sugerido, { className: 'text-xl' })} Sugerir
                  </button>
                )}
                {/* Preview en vivo */}
                {iconoElegido && (
                  <span className="flex items-center justify-center pl-0 sm:pl-2 text-xl sm:text-2xl">
                    {dynamicIcon(iconoElegido, { className: 'text-2xl' })}
                  </span>
                )}
              </div>

              <input
                type="number"
                className="w-20 sm:w-28 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base bg-zinc-50 dark:bg-zinc-800"
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
                  <FaToggleOn className="text-emerald-500 text-2xl sm:text-3xl" />
                ) : (
                  <FaToggleOff className="text-zinc-400 text-2xl sm:text-3xl" />
                )}
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-3 justify-end">
              <button
                disabled={loading || !nuevo.nombre}
                onClick={guardar}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 sm:px-8 py-2 rounded-2xl text-base sm:text-lg transition"
              >
                {editando ? 'Guardar cambios' : 'Agregar'}
              </button>
              <button
                type="button"
                className="bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold px-5 sm:px-8 py-2 rounded-2xl text-base sm:text-lg transition"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-3 bg-white/90 dark:bg-zinc-900/90 rounded-b-3xl">
          {mediosFiltrados.length === 0 && (
            <div className="text-zinc-400 text-center mt-8 text-base sm:text-lg">
              No hay resultados.
            </div>
          )}
          {mediosFiltrados.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 mb-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-zinc-800 transition group shadow-sm"
            >
              <span className="text-xl sm:text-2xl">
                {dynamicIcon(m.icono)}
              </span>
              <span className="flex-1 font-semibold text-zinc-700 dark:text-zinc-200 truncate text-base">
                {m.nombre}
              </span>
              {m.descripcion && (
                <span className="text-xs sm:text-sm text-zinc-500 truncate max-w-[100px] sm:max-w-[140px]">
                  {m.descripcion}
                </span>
              )}
              <span className="text-xs text-zinc-400 font-mono">{m.orden}</span>
              <button
                className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-full transition"
                title="Editar"
                onClick={() => comenzarEdicion(m)}
              >
                <FaEdit />
              </button>
              <button
                className="p-1 sm:p-2 text-red-500 hover:bg-red-100 dark:hover:bg-zinc-800 rounded-full transition"
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
