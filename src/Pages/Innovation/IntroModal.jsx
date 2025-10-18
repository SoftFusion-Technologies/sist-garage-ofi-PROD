// IntroModal.jsx
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

const ease = [0.16, 1, 0.3, 1];

const dropVariants = {
  hidden: { opacity: 0, y: -60, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease,
      when: 'beforeChildren',
      staggerChildren: 0.12
    }
  },
  exit: {
    opacity: 0,
    y: -70,
    scale: 0.98,
    transition: { duration: 0.45, ease }
  }
};

const itemUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } }
};

export default function IntroModal({ open, onClose }) {
  // autocerrar a los N ms
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), 2800); // 2.6s visible
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          />
          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-[91] flex items-center justify-center p-4"
            variants={dropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div
              className="relative w-full max-w-md rounded-3xl p-[1px] ring-1 ring-white/10
                            bg-gradient-to-br from-white/10 via-white/0 to-white/10"
            >
              {/* halo de color (violeta/ámbar) */}
              <div
                className="pointer-events-none absolute -inset-1 -z-10 rounded-[28px] opacity-60 blur-2xl
                              bg-[conic-gradient(from_140deg,rgba(168,85,247,0.45),rgba(251,191,36,0.45),transparent_60%)]"
              />
              <div className="rounded-3xl bg-zinc-900/80 p-6 backdrop-blur-xl ring-1 ring-white/10">
                {/* badge */}
                <motion.div
                  variants={itemUp}
                  className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full
                          border border-white/10 bg-zinc-800/50 px-3 py-1 text-[11px] font-medium text-zinc-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
                  Soft Fusion
                </motion.div>

                {/* título */}
                <motion.h3
                  variants={itemUp}
                  className="uppercase text-center text-xl font-semibold text-white md:text-2xl"
                >
                  Tecnología innovadora
                </motion.h3>

                {/* subtítulo */}
                <motion.p
                  variants={itemUp}
                  className="mt-2 text-center text-sm text-zinc-300"
                >
                  Diseñado y desarrollado por{' '}
                  <span className="font-medium text-pink-600">
                    Soft Fusion
                  </span>
                  .
                </motion.p>

                {/* rayito decorativo */}
                <motion.div variants={itemUp} className="mt-5">
                  <div className="h-[1px] w-full bg-gradient-to-r from-pink-500/40 via-amber-400/50 to-pink-500/40" />
                </motion.div>

                {/* barra de progreso (autocierre) */}
                <motion.div
                  variants={itemUp}
                  className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/10"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-pink-400 to-amber-300"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.2, ease: 'linear' }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
