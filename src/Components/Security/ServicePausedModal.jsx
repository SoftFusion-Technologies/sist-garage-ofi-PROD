import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Info, Phone, Lock, Clock } from 'lucide-react';

/**
 * ServicePausedModal (v1.2)
 * ------------------------------------------------------------
 * + Nuevo layout `footer`: barra horizontal inferior (estilo footer) que ocupa todo el ancho.
 * + Mantiene versión `split` (grid 1→2 columnas) para uso clásico en centro.
 * + Sigue siendo 100% restrictivo, accesible y con CTA destacado.
 */

const WA_SVG = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="w-6 h-6">
    <path
      d="M19.11 17.26c-.27-.14-1.62-.8-1.87-.89-.25-.09-.43-.14-.61.14-.18.27-.7.89-.86 1.07-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.14-1.3-.79-.7-1.32-1.57-1.48-1.83-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.46-.84-2-.22-.52-.44-.45-.61-.45-.16 0-.34-.02-.52-.02-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.68 1.12 2.87.14.18 1.93 2.95 4.67 4.13.65.28 1.16.45 1.56.58.65.21 1.24.18 1.71.11.52-.08 1.62-.66 1.85-1.28.23-.62.23-1.15.16-1.27-.07-.11-.25-.18-.52-.32z"
      fill="currentColor"
    />
    <path
      d="M26.88 5.14C24.01 2.27 20.27.75 16.32.75 8.26.75 1.77 7.24 1.77 15.3c0 2.56.68 5.06 1.98 7.26L1.05 31l8.63-2.64c2.13 1.17 4.54 1.79 6.99 1.79 8.06 0 14.55-6.49 14.55-14.55 0-3.95-1.52-7.69-4.39-10.46zM16.67 27.53c-2.28 0-4.51-.62-6.45-1.78l-.46-.27-5.12 1.57 1.62-4.99-.3-.51a11.26 11.26 0 0 1-1.66-5.25c0-6.23 5.07-11.3 11.3-11.3 3.02 0 5.87 1.17 8.01 3.3 2.14 2.14 3.32 4.99 3.32 8.01 0 6.23-5.07 11.3-11.3 11.3z"
      fill="currentColor"
    />
  </svg>
);

export default function ServicePausedModal({
  active = false,
  title = 'SERVICIO PAUSADO',
  message = 'Tu sistema está temporalmente suspendido. Por favor, contactanos para regularizar la situación y reactivar el servicio.',
  whatsappNumber = '5493815430503',
  phone = '+54 9 3815 43-0503',
  supportHours = 'Lun a Vie 9:00–18:00',
  brand = { name: 'SoftFusion', color: 'from-orange-500 to-pink-500' },
  hardBlock = true,
  extra = null,
  layout = 'split' // "split" | "footer"
}) {
  const modalRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Bloquear scroll del body cuando está activo
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  // Enfoque inicial
  useEffect(() => {
    if (active && firstFocusRef.current) firstFocusRef.current.focus();
  }, [active]);

  // Focus trap básico
  useEffect(() => {
    if (!active) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && hardBlock) e.preventDefault();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [active, hardBlock]);

  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hola, tengo el servicio pausado ¿Podemos ver la situación?`
  )}`;

  const isFooter = layout === 'footer';

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop bloqueante con leve textura radial */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            style={{
              backgroundImage:
                'radial-gradient(60rem 60rem at 10% 10%, rgba(255,255,255,0.04), transparent 60%), radial-gradient(60rem 60rem at 90% 90%, rgba(255,255,255,0.03), transparent 60%)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          />

          {/* Contenedor (centro o footer) */}
          {isFooter ? (
            /* FOOTER BAR HORIZONTAL */
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-6">
              <motion.section
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="paused-title"
                aria-describedby="paused-desc"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 170, damping: 20 }}
                className={`relative w-full rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-gradient-to-br ${
                  brand?.color || 'from-slate-800 to-slate-900'
                } text-white`}
                style={{
                  WebkitBackdropFilter: 'blur(10px)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Fila única en TODAS las resoluciones */}
                <div className="px-5 md:px-8 py-4 md:py-5 flex flex-row items-center gap-4 md:gap-6 flex-nowrap overflow-x-auto">
                  {/* Izquierda: icono + textos (compactos y truncados) */}
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 shrink">
                    <div className="p-2 rounded-xl bg-white/20 shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-nowrap">
                        <h2
                          id="paused-title"
                          className="text-base font-semibold tracking-tight truncate max-w-[36vw] sm:max-w-[42vw]"
                        >
                          {title}
                        </h2>
                        {brand?.name && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] border border-white/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />{' '}
                            {brand.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-white/90">
                        <Lock className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[52vw] sm:max-w-[58vw]">
                          Acceso temporalmente deshabilitado
                        </span>
                      </div>
                      <p
                        id="paused-desc"
                        className="mt-1 text-[12px] leading-snug text-white/90 truncate max-w-[72vw]"
                      >
                        {message}
                      </p>
                    </div>
                  </div>

                  {/* Separador fino (solo si hay espacio) */}
                  <div
                    className="h-6 w-px bg-white/20 hidden sm:block shrink-0"
                    aria-hidden
                  />

                  {/* Derecha: CTA y soporte (apilados) */}
                  <div className="flex flex-col items-stretch gap-2 md:gap-3 shrink-0">
                    <a
                      ref={firstFocusRef}
                      href={waLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="w-full inline-flex justify-center items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-transparent"
                    >
                      <WA_SVG />
                      Chatear por WhatsApp
                    </a>

                    <div className="text-[11px] md:text-xs text-white/90 flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> {phone}
                      </span>
                      {supportHours && (
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                          <Clock className="w-3 h-3" /> {supportHours}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          ) : (
            /* SPLIT (centro con grid 1→2) */
            <div className="absolute inset-0 grid place-items-center px-4 py-6">
              <motion.section
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="paused-title"
                aria-describedby="paused-desc"
                initial={{ y: 24, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 16, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 170, damping: 18 }}
                className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-white/10 shadow-2xl overflow-hidden"
                style={{
                  WebkitBackdropFilter: 'blur(10px)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div
                  className={`relative p-6 md:p-7 bg-gradient-to-br ${
                    brand?.color || 'from-slate-800 to-slate-900'
                  } text-white`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/20">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <h2
                          id="paused-title"
                          className="text-xl md:text-2xl font-semibold tracking-tight"
                        >
                          {title}
                        </h2>
                        <p className="mt-1 text-white/90 text-sm flex items-center gap-2">
                          <Lock className="w-4 h-4" /> Acceso temporalmente
                          deshabilitado
                        </p>
                      </div>
                    </div>
                    {brand?.name && (
                      <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/15 text-white px-3 py-1 text-xs md:text-sm border border-white/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />{' '}
                        {brand.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-white/5 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 mt-0.5 text-white/80" />
                        <p
                          id="paused-desc"
                          className="text-sm leading-relaxed text-white/90"
                        >
                          {message}
                        </p>
                      </div>
                      {extra}
                      {hardBlock ? (
                        <p className="text-[12px] md:text-[13px] text-white/70">
                          Una vez reactivado el servicio, podrás ingresar
                          normalmente. Gracias por tu comprensión.
                        </p>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-white/60">
                          <span>
                            Este bloqueo es informativo. Puedes continuar.
                          </span>
                          <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/80">
                            Continuar al sistema
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="h-full">
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-5 md:p-6 flex flex-col gap-4 shadow-xl">
                        <a
                          ref={firstFocusRef}
                          href={waLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label="Escribir por WhatsApp"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-transparent"
                        >
                          <WA_SVG />
                          Chatear por WhatsApp
                        </a>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/10 text-white/90">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              Atención directa
                            </div>
                            <div className="text-xs text-white/70 flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-2">
                                {phone}
                              </span>
                              {supportHours && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                  <Clock className="w-3 h-3" /> {supportHours}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-white/60">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />{' '}
                            Respuesta en minutos
                          </span>
                          <span>WhatsApp seguro</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
