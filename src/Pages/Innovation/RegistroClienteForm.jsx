import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';

// Reusa tus mismas variantes:
const itemUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};
const formDrop = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } }
};

const API_BASE = 'https://vps-5192960-x.dattaweb.com';

export default function RegistroClienteForm({
  defaultValues = {}, // { nombre, telefono, email, direccion, dni, es_online }
  onSuccess // (clienteCreado) => void
}) {
  const [form, setForm] = useState({
    nombre: defaultValues.nombre || '',
    telefono: defaultValues.telefono || '',
    email: defaultValues.email || '',
    direccion: defaultValues.direccion || '',
    dni: defaultValues.dni || '',
    es_online: true
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [locked, setLocked] = useState(false); // <-- evita re-envíos

  const hasValue = (form.nombre ?? '').trim().length > 0;

  const subtitle = useMemo(() => {
    if (saved) return '¡Genial! Cliente registrado correctamente';
    if (!hasValue) return 'Empecemos por definir el nombre del cliente';
    return `Se verá así: ${form.nombre}`;
  }, [hasValue, form.nombre, saved]);

  // helpers
  const trimOrEmpty = (v) => (typeof v === 'string' ? v.trim() : v);

  const isEmpty = (v) =>
    v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

  const stripEmptyKeys = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => !isEmpty(v)));

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isDigits = (s) => /^\d+$/.test(s);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!hasValue || loading || locked || saved) return;

    // normalizaciones y validaciones mínimas
    const nombre = trimOrEmpty(form.nombre);
    const telefono = trimOrEmpty(form.telefono);
    const email = trimOrEmpty(form.email);
    const direccion = trimOrEmpty(form.direccion);
    const dni = trimOrEmpty(form.dni);

    // validaciones opcionales (levanta SweetAlert2 si no pasa)
    if (email && !isValidEmail(email)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Email inválido',
        text: 'Revisá el formato del email.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }
    if (dni && !isDigits(dni)) {
      await Swal.fire({
        icon: 'warning',
        title: 'DNI inválido',
        text: 'El DNI debe contener solo números.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // construí el objeto SIN nulls y SIN strings vacíos
    const raw = {
      nombre, // requerido
      telefono, // opcional
      email, // opcional
      direccion, // opcional
      dni, // opcional
      es_online: true // siempre online en este formulario
    };
    const payload = stripEmptyKeys(raw); // ← elimina claves vacías

    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/clientes`, payload);

      await Swal.fire({
        icon: 'success',
        title: 'Cliente creado',
        text: `${
          data?.cliente?.nombre || nombre
        } fue registrado correctamente.`,
        confirmButtonColor: '#10b981'
      });

      setSaved(true);
      setLocked(true);
      setTimeout(() => onSuccess?.(data?.cliente || data), 250);
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      if (status === 409 && body?.code === 'DUPLICATE') {
        await Swal.fire({
          icon: 'warning',
          title: 'No se pudo registrar',
          text:
            body?.field === 'dni'
              ? 'DNI ya registrado.'
              : body?.field === 'telefono'
              ? 'Teléfono ya registrado.'
              : body?.field === 'email'
              ? 'Email ya registrado.'
              : 'Ya existe un registro con esos datos.',
          confirmButtonColor: '#f59e0b'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'No se pudo registrar',
          text: body?.mensajeError || 'Error inesperado.',
          confirmButtonColor: '#ef4444'
        });
      }
    } finally {
      setLoading(false);
    }
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
      {/* Marco transparente con borde teal */}
      <div className="relative rounded-3xl p-[1px]">
        <div className="rounded-3xl bg-transparent ring-1 ring-teal-500/30">
          <div className="rounded-3xl p-6 transition-shadow duration-300 hover:shadow-[0_0_35px_-10px_rgba(20,184,166,0.45)]">
            {/* Título */}
            <motion.h2
              variants={itemUp}
              className="uppercase text-center text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              GARAGE STORE - Registrar cliente
            </motion.h2>

            {/* Subtítulo interactivo */}
            <motion.p
              variants={itemUp}
              className="mt-2 text-center text-sm text-zinc-400"
            >
              {subtitle}
            </motion.p>

            <div className="mt-6 grid gap-4">
              {/* Nombre */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                Nombre completo *
              </motion.label>
              <motion.input
                variants={itemUp}
                autoFocus
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* Teléfono */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                Teléfono
              </motion.label>
              <motion.input
                variants={itemUp}
                required
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="3815123456"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* Email */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                Email
              </motion.label>
              <motion.input
                variants={itemUp}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="cliente@email.com"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* Dirección */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                Dirección
              </motion.label>
              <motion.input
                variants={itemUp}
                value={form.direccion}
                onChange={(e) =>
                  setForm({ ...form, direccion: e.target.value })
                }
                placeholder="Calle 123, Piso 1, Dpto A"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* DNI */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                DNI
              </motion.label>
              <motion.input
                variants={itemUp}
                value={form.dni}
                required
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                placeholder="30123456"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* Online (switch minimal) */}
              {/* Estado online fijo */}
              {/* <motion.div
                variants={itemUp}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-zinc-300">Cliente online</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 bg-emerald-100 text-emerald-800 ring-emerald-300">
                  ◎ Online: Sí
                </span>
              </motion.div> */}

              {/* Hint como en NombreForm */}
              <motion.div
                variants={itemUp}
                initial={false}
                animate={{ opacity: hasValue ? 1 : 0, y: hasValue ? 0 : 6 }}
                className="text-xs text-teal-300/90"
              >
                Tip: presioná <span className="font-semibold">Enter</span> para
                guardar.
              </motion.div>

              {/* Error backend (si ocurre) */}
              {errorMsg && (
                <motion.div variants={itemUp} className="text-sm text-red-300">
                  {errorMsg}
                </motion.div>
              )}

              {/* Botón con estados (igual al de NombreForm) */}
              <motion.button
                variants={itemUp}
                type="submit"
                disabled={!hasValue || loading || locked || saved}
                className={`group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-medium text-white transition-all
                  ${
                    hasValue && !loading
                      ? 'bg-teal-600 hover:bg-teal-500 shadow-[0_8px_30px_-10px_rgba(20,184,166,0.55)] hover:shadow-[0_12px_45px_-10px_rgba(20,184,166,0.75)] focus:outline-none focus:ring-2 focus:ring-teal-500/60'
                      : 'bg-teal-700/40 cursor-not-allowed opacity-60'
                  }`}
              >
                <span className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-teal-300/30 transition-opacity group-hover:ring-teal-200/50" />
                {loading ? 'Guardando…' : 'Guardar'}
              </motion.button>

              {/* Saved (como en NombreForm) */}
              {saved && (
                <motion.div
                  key="saved"
                  variants={itemUp}
                  initial="hidden"
                  animate="show"
                  className="text-center text-sm text-teal-400"
                >
                  ¡Listo! Guardamos el cliente.
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
