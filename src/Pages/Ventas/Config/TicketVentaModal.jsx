import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TicketVentaModal({ venta, onClose }) {
  const ref = useRef();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);

  // Traer configuración del ticket solo una vez al abrir
  useEffect(() => {
    axios
      .get('http://localhost:8080/ticket-config')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig(null));
  }, []);

  if (!venta) return null;
  const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];

  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6'
    });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`ticket-venta-${venta.id}.pdf`);
  };

  const mostrarAjuste = () => {
    if (!venta.descuento_porcentaje && !venta.recargo_porcentaje) return null;

    if (venta.descuento_porcentaje > 0) {
      return (
        <div className="text-sm text-emerald-600 font-semibold">
          -{venta.descuento_porcentaje}% de descuento
        </div>
      );
    }

    if (venta.recargo_porcentaje > 0) {
      return (
        <div className="text-sm text-orange-600 font-semibold">
          +{venta.recargo_porcentaje}% de recargo
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-[#059669] animate-fade-in overflow-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-3xl text-gray-400 hover:text-[#059669] dark:hover:text-emerald-400"
          title="Cerrar"
        >
          ×
        </button>

        <div
          ref={ref}
          className="ticket-pdf font-mono text-sm text-black dark:text-white p-4"
          style={{
            background: 'white',
            borderRadius: '12px',
            minWidth: 260
          }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            {config?.logo_url && (
              <img
                src={config.logo_url}
                alt="Logo"
                className="mx-auto mb-2 max-h-16 object-contain rounded shadow"
                style={{ maxWidth: 120 }}
              />
            )}
            <div
              className="font-extrabold text-2xl tracking-widest mb-1 uppercase"
              style={{
                color: '#6d28d9',
                letterSpacing: 2
              }}
            >
              {config?.nombre_tienda || ''}
            </div>
            <div
              className="text-xs font-bold tracking-widest mb-1"
              style={{
                color: '#059669'
              }}
            >
              {config?.lema || ''}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
              {config?.direccion}
              {config?.telefono && <span> • {config.telefono}</span>}
            </div>
            {config?.email && (
              <div className="text-xs text-gray-500">{config.email}</div>
            )}
          </div>

          {/* Info venta */}
          <div className="flex justify-between mb-3 font-semibold text-gray-700 dark:text-gray-200 text-lg">
            <span>Venta #{venta.id}</span>
            <span className="text-xs text-gray-400 dark:text-gray-300">
              {venta.fecha ? new Date(venta.fecha).toLocaleString() : ''}
            </span>
          </div>

          {/* Datos Vendedor, Local, Cliente */}
          <div className="grid grid-cols-1 gap-1 mb-3 text-gray-800 dark:text-gray-200 text-sm">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                Vendedor:
              </span>{' '}
              <span>{venta.usuario?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                Local:
              </span>{' '}
              <span>{venta.locale?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                Cliente:
              </span>{' '}
              <span>{venta.cliente?.nombre || 'Consumidor Final'}</span>
            </div>
          </div>

          {/* Artículos */}
          <div
            className="mb-2 mt-5 text-sm font-bold tracking-widest text-center"
            style={{ color: '#059669' }}
          >
            ARTÍCULOS
          </div>
          <div className="mb-4">
            {detalles.length === 0 ? (
              <div className="text-center text-gray-400 py-2">
                Cargando productos...
              </div>
            ) : (
              detalles.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center py-1 px-0.5 border-b border-dashed border-emerald-200 dark:border-emerald-800"
                >
                  <span>
                    <span className="font-bold">
                      {d.stock?.producto?.nombre || 'Producto'}
                    </span>
                    <span style={{ color: '#64748b' }} className="ml-1 text-xs">
                      x{d.cantidad}
                    </span>
                  </span>
                  <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    $
                    {Number(d.precio_unitario * d.cantidad).toLocaleString(
                      'es-AR'
                    )}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Subtotal, descuento/recargo y total */}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
            <div className="flex justify-between text-gray-700 dark:text-gray-200 text-sm mb-1">
              <span>Subtotal</span>
              <span>
                $
                {venta.total_bruto
                  ? Number(venta.total_bruto).toLocaleString('es-AR')
                  : Number(venta.total).toLocaleString('es-AR')}
              </span>
            </div>

            {mostrarAjuste()}

            <div className="flex justify-between text-lg font-black text-emerald-700 dark:text-emerald-400 mt-2">
              <span>Total</span>
              <span>
                $
                {Number(venta.total_final ?? venta.total).toLocaleString(
                  'es-AR'
                )}
              </span>
            </div>
          </div>

          {/* Footer dinámico */}
          {config?.mensaje_footer && (
            <div
              className="text-center text-[11px] mt-3 font-medium tracking-wider"
              style={{ color: '#059669', opacity: 0.9 }}
            >
              {config.mensaje_footer}
            </div>
          )}
          {!config?.mensaje_footer && (
            <div
              className="text-center text-[11px] mt-3 font-medium tracking-wider"
              style={{ color: '#64748b' }}
            >
              ¡Gracias por su compra!
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <button
          onClick={exportPDF}
          className="mt-5 w-full py-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
        >
          Descargar PDF
        </button>
        <button
          onClick={() => window.print()}
          className="mt-2 w-full py-2 rounded-lg font-bold bg-zinc-700 hover:bg-zinc-900 text-white shadow-md transition"
        >
          Imprimir directo
        </button>
        <button
          onClick={() => navigate('/dashboard/ventas/caja')}
          className="mt-2 w-full py-2 rounded-lg font-bold bg-emerald-900 hover:bg-emerald-800 text-white shadow-md transition"
        >
          Ir a Caja
        </button>
      </div>
    </div>
  );
}
