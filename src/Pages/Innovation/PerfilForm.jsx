import { motion } from 'framer-motion';
import firstNameOf from './js/firstName.js';
import { useEffect, useMemo, useState } from 'react';

const easeOut = [0.16, 1, 0.3, 1];

const formDrop = {
  hidden: { opacity: 0, y: -80 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: easeOut,
      when: 'beforeChildren',
      delayChildren: 0.35,
      staggerChildren: 0.18
    }
  },
  exit: { opacity: 0, y: 80, transition: { duration: 0.4, ease: easeOut } }
};

const itemUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } }
};

export default function PerfilForm({
  perfil,
  setPerfil,
  onSubmit,
  saved,
  firstName
}) {
  const { edad, sexo, altura } = perfil;

  const complete = edad && sexo && altura ? true : false;

  const [openModal, setOpenModal] = useState(false);

  // abrir modal cuando saved cambia a true
  useEffect(() => {
    if (saved) setOpenModal(true);
  }, [saved]);

  // fallback por si no vino la prop (e.g. refresh)
  const nameForCopy =
    firstName ||
    firstNameOf(localStorage.getItem('sf_nombre') || '') ||
    '¡hey!';

  const pretty = useMemo(() => {
    const parts = [];
    if (edad) parts.push(`Edad: ${edad} años`);
    if (sexo) parts.push(`Sexo: ${sexo}`);
    if (altura) {
      // normalizo con punto y 2 decimales (metros)
      const m = String(altura).replace(',', '.');
      const fixed = isFinite(+m) ? (+m).toFixed(2) : m;
      parts.push(`Altura: ${fixed} m`);
    }
    return parts.join(' · ');
  }, [edad, sexo, altura]);

  const subtitle = useMemo(() => {
    // ya NO mostramos el texto de éxito acá; lo maneja la modal
    return `Por último, ${nameForCopy}, necesitamos estos datos`;
  }, [nameForCopy]);
  const setField = (field) => (val) => {
    setPerfil((p) => ({ ...p, [field]: val }));
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      variants={formDrop}
      initial="hidden"
      animate="show"
      exit="exit"
      className="mx-auto w-full max-w-lg"
    >
      <div className="relative rounded-3xl p-[1px]">
        <div className="rounded-3xl bg-transparent ring-1 ring-teal-500/30">
          <div className="rounded-3xl p-6 transition-shadow duration-300 hover:shadow-[0_0_35px_-10px_rgba(20,184,166,0.45)]">
            {/* Título */}
            <motion.h2
              variants={itemUp}
              className="uppercase text-center text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              Un último paso
            </motion.h2>

            {/* Subtítulo interactivo */}
            <motion.p
              variants={itemUp}
              className="mt-2 text-center text-sm text-zinc-400"
            >
              {subtitle}
            </motion.p>

            <div className="mt-6 grid gap-5">
              {/* Edad */}
              <div className="grid gap-2">
                <motion.label
                  variants={itemUp}
                  className="text-sm text-zinc-300"
                >
                  Edad
                </motion.label>
                <motion.input
                  variants={itemUp}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={edad}
                  onChange={(e) =>
                    setField('edad')(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="Ej: 22"
                  className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                             focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              {/* Sexo */}
              <div className="grid gap-2">
                <motion.label
                  variants={itemUp}
                  className="text-sm text-zinc-300"
                >
                  Sexo
                </motion.label>

                <motion.div variants={itemUp} className="flex gap-3">
                  {['F', 'M', 'X'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('sexo')(s)}
                      className={`rounded-2xl border px-4 py-2 text-sm transition-all
                        ${
                          sexo === s
                            ? 'border-teal-400 bg-teal-500/20 text-teal-200'
                            : 'border-zinc-700/60 bg-transparent text-zinc-300 hover:border-teal-400/70'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              </div>

              {/* Altura */}
              <div className="grid gap-2">
                <motion.label
                  variants={itemUp}
                  className="text-sm text-zinc-300"
                >
                  Altura (m)
                </motion.label>
                <motion.input
                  variants={itemUp}
                  value={altura}
                  onChange={(e) => {
                    // Permití números, punto/coma y máximo 4 chars útiles (1.60)
                    const val = e.target.value
                      .replace(/[^0-9.,]/g, '')
                      .replace(',', '.');
                    setField('altura')(val);
                  }}
                  placeholder="Ej: 1.60"
                  className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                             focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              {/* Hint */}
              <motion.div
                variants={itemUp}
                initial={false}
                animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 6 }}
                className="text-xs text-teal-300/90"
              >
                Tip: cuando esté completo, presioná{' '}
                <span className="font-semibold">Enter</span> para guardar.
              </motion.div>

              {/* Botón */}
              <motion.button
                variants={itemUp}
                type="submit"
                disabled={!complete}
                className={`group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-medium text-white transition-all
                  ${
                    complete
                      ? 'bg-teal-600 hover:bg-teal-500 shadow-[0_8px_30px_-10px_rgba(20,184,166,0.55)] hover:shadow-[0_12px_45px_-10px_rgba(20,184,166,0.75)] focus:outline-none focus:ring-2 focus:ring-teal-500/60'
                      : 'bg-teal-700/40 cursor-not-allowed opacity-60'
                  }`}
              >
                <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-teal-300/30 transition-opacity group-hover:ring-teal-200/50" />
                Guardar
              </motion.button>

              {/* Saved */}
              {saved && (
                <motion.div
                  key="saved-perfil"
                  variants={itemUp}
                  initial="hidden"
                  animate="show"
                  className="text-center text-sm text-teal-400"
                >
                  ¡Listo! Perfil guardado en el dispositivo.
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
