// TicketVentaModal.jsx
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';

export default function TicketVentaModal({ venta, onClose }) {
  const ref = React.useRef();

  // Fallback defensivo: venta puede ser null o sin detalles
  if (!venta) return null;
  const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];

  // Exportar a PDF (ahora compatible!)
  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a7' // Ticket tamaño chico
    });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`ticket-venta-${venta.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl relative border border-[#059669] animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl text-gray-400 hover:text-[#059669]"
          title="Cerrar"
        >
          ×
        </button>
        {/* Ticket visual */}
        <div ref={ref} className="ticket-pdf font-mono text-xs text-black p-2">
          <div className="text-center mb-3">
            <div className="brand font-extrabold text-xl tracking-widest mb-2">
              EL GARAGE
            </div>
            <div className="brand-muted text-xs font-bold tracking-widest">
              TU TIENDA DE ROPA FAVORITA
            </div>
          </div>

          <div className="flex justify-between mb-2 font-semibold text-gray-700 text-base">
            <span>Venta #{venta.id}</span>
            <span className="text-xs text-gray-400">
              {venta.fecha ? new Date(venta.fecha).toLocaleString() : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-0.5 mb-2">
            <div>
              <span className="font-bold" style={{ color: '#334155' }}>
                Vendedor:
              </span>{' '}
              <span>{venta.usuario?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold" style={{ color: '#334155' }}>
                Local:
              </span>{' '}
              <span>{venta.locale?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold" style={{ color: '#334155' }}>
                Cliente:
              </span>{' '}
              <span>{venta.cliente?.nombre || 'Consumidor Final'}</span>
            </div>
          </div>

          <div
            className="mb-1 mt-4 text-xs font-bold tracking-widest text-center"
            style={{ color: '#059669' }}
          >
            ARTÍCULOS
          </div>
          <div className="mb-1">
            {detalles.length === 0 ? (
              <div className="text-center text-gray-400 py-2">
                Cargando productos...
              </div>
            ) : (
              detalles.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-center py-1 px-0.5"
                  style={{ borderBottom: '1px dashed #BBF7D0' }} // emerald-100
                >
                  <span>
                    <span className="font-bold">
                      {d.stock?.producto?.nombre || 'Producto'}
                    </span>
                    <span style={{ color: '#64748b' }} className="ml-1 text-xs">
                      x{d.cantidad}
                    </span>
                  </span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: '#059669' }}
                  >
                    $
                    {Number(d.precio_unitario * d.cantidad).toLocaleString(
                      'es-AR'
                    )}
                  </span>
                </div>
              ))
            )}
          </div>

          <div
            className="mt-3 mb-1 flex justify-between items-center text-lg font-black tracking-widest"
            style={{ color: '#059669' }}
          >
            <span>Total</span>
            <span>${Number(venta.total).toLocaleString('es-AR')}</span>
          </div>
          <div
            className="text-center text-[11px] mt-2 font-medium tracking-wider"
            style={{ color: '#64748b' }}
          >
            ¡Gracias por su compra!
          </div>
        </div>
        <button
          onClick={exportPDF}
          className="mt-5 w-full py-2"
          style={{
            background: '#059669',
            color: 'white',
            borderRadius: 12,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px #05966933',
            transition: 'background .2s'
          }}
        >
          Descargar PDF
        </button>
        <button
          onClick={() => window.print()}
          className="mt-2 w-full py-2"
          style={{
            background: '#334155',
            color: 'white',
            borderRadius: 12,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px #33415533',
            transition: 'background .2s'
          }}
        >
          Imprimir directo
        </button>
      </div>
    </div>
  );
}
