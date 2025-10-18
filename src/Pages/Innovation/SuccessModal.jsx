// SuccessModal.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function SuccessModal({ open, onClose, name = '' }) {
  const closeBtnRef = useRef(null);

  // auto-focus y ESC para cerrar
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Guardado correctamente"
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="relative w-full max-w-md rounded-3xl p-[1px]
                            ring-1 ring-teal-400/30
                            bg-gradient-to-br from-white/10 via-white/0 to-white/10"
            >
              {/* borde animado sutil */}
              <div
                className="absolute inset-0 -z-10 rounded-3xl opacity-40 blur-2xl
                              bg-[radial-gradient(60%_60%_at_50%_0%,rgba(45,212,191,0.4),transparent)]"
              />
              <div className="rounded-3xl bg-zinc-900/80 p-6 backdrop-blur-xl ring-1 ring-white/10">
                {/* Icono check con halo */}
                <div className="mx-auto mb-4 grid place-items-center">
                  <div className="relative">
                    <div className="absolute inset-0 blur-2xl opacity-60 bg-teal-500/40 rounded-full" />
                    <svg
                      className="relative h-14 w-14 text-teal-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <circle cx="12" cy="12" r="9" className="opacity-70" />
                      <path
                        d="M8 12.5l2.2 2.2L16 9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                {/* Texto */}
                <h3 className="text-center text-xl font-semibold text-white">
                  ¡Listo{name ? `, ${name}` : ''}!
                </h3>
                <p className="mt-1 text-center text-sm text-zinc-300">
                  Guardamos tu información correctamente.
                </p>

                {/* CTA */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    ref={closeBtnRef}
                    onClick={onClose}
                    className="group relative inline-flex items-center justify-center rounded-2xl
                               bg-teal-600 px-5 py-2.5 text-sm font-medium text-white
                               shadow-[0_8px_30px_-10px_rgba(20,184,166,0.55)]
                               transition-all hover:bg-teal-500 hover:shadow-[0_12px_45px_-10px_rgba(20,184,166,0.75)]
                               focus:outline-none focus:ring-2 focus:ring-teal-500/60"
                  >
                    Continuar
                    <span className="ml-1 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
