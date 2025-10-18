import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowSize } from './js/useWindowSize.js';
import PerfilForm from './PerfilForm'; // externo
import firstNameOf from './js/firstName.js';
import SuccessModal from './SuccessModal'; // modal centralizada
import IntroModal from './IntroModal.jsx';
import RegistroClienteForm from './RegistroClienteForm.jsx';
/**
 * SoftFusionIntro – pantalla de bienvenida ultra moderna con:
 * - Fondo negro con Canvas (partículas dinámicas)
 * - Modal de entrada "tecnología innovadora, diseñado y desarrollado por Soft Fusion"
 * - Transición automatizada (2.5s) que da paso a un formulario de nombre
 * - Persistencia en localStorage (clave: "sf_nombre")
 *
 * Requisitos: Tailwind CSS + Framer Motion
 * Uso: <SoftFusionIntro onReady={(nombre) => ... } />
 */
export default function SoftFusionIntro({ onReady }) {
  // Solo mantenemos una “intro” opcional y el tamaño responsive del lienzo.
  const [showIntro, setShowIntro] = useState(() =>
    localStorage.getItem('gs_intro_shown') === '1' ? false : true
  );

  const [nombre, setNombre] = useState('');

  // Si hay nombre previo, lo cargamos (opcional)
  useEffect(() => {
    const prev = localStorage.getItem('sf_nombre');
    if (prev) setNombre(prev);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Fondo animado */}
      <ParticlesBackgroundCanvas />

      {/* Halo/Glow decorativo */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(50%_50%_at_50%_50%,#0000,black)]">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              'conic-gradient(from 180deg at 50% 50%, rgba(139,92,246,.35), rgba(14,165,233,.35), rgba(10, 78, 121, 0.35), rgba(92, 236, 246, 0.35))'
          }}
        />
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {/* Si no querés la intro, comentá estas dos líneas: */}
        <IntroModal open={showIntro} onClose={() => setShowIntro(false)} />
        {!showIntro && (
          <AnimatePresence mode="wait">
            <RegistroClienteForm
              key="registro-cliente"
              defaultValues={{
                nombre, // si había uno guardado, lo precarga
                es_online: true // por si querés forzarlo explícitamente
              }}
              onSuccess={(cliente) => {
                // Guardamos nombre (opcional)
                if (cliente?.nombre)
                  localStorage.setItem('sf_nombre', cliente.nombre);

                setShowIntro(true);

                // Avisamos al contenedor que ya está listo (si te sirve navegar, podés hacerlo ahí)
                onReady?.(cliente);
              }}
            />
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
const easeOut = [0.16, 1, 0.3, 1];

// 1) El form “cae” y luego orquesta a sus hijos
const formDrop = {
  hidden: { opacity: 0, y: -80 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOut,
      when: 'beforeChildren', // primero completa la caída
      delayChildren: 0.35, // luego arranca la secuencia
      staggerChildren: 0.18 // uno tras otro
    }
  },
  exit: { opacity: 0, y: 80, transition: { duration: 0.4, ease: easeOut } }
};

// 2) Cada item aparece “hacia arriba”
const itemUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } }
};

function NombreForm({ nombre, setNombre, onSubmit, saved }) {
  const hasValue = (nombre ?? '').trim().length > 0;

  const subtitle = useMemo(() => {
    if (saved) return '¡Genial! Ya lo guardamos';
    if (!hasValue) return 'Empecemos por definir tu nombre';
    return `Se verá así: ${nombre}`;
  }, [hasValue, nombre, saved]);

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
              Tu identidad primero
            </motion.h2>

            {/* Subtítulo interactivo */}
            <motion.p
              variants={itemUp}
              className="mt-2 text-center text-sm text-zinc-400"
            >
              {subtitle}
            </motion.p>

            <div className="mt-6 grid gap-4">
              {/* Label */}
              <motion.label variants={itemUp} className="text-sm text-zinc-300">
                Nombre completo
              </motion.label>

              {/* Input: transparente, foco teal */}
              <motion.input
                variants={itemUp}
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-2xl border border-zinc-700/60 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-500
                           focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/40"
              />

              {/* Hint que aparece cuando hay texto */}
              <motion.div
                variants={itemUp}
                initial={false}
                animate={{ opacity: hasValue ? 1 : 0, y: hasValue ? 0 : 6 }}
                className="text-xs text-teal-300/90"
              >
                Tip: presioná <span className="font-semibold">Enter</span> para
                guardar.
              </motion.div>

              {/* Botón con estados */}
              <motion.button
                variants={itemUp}
                type="submit"
                disabled={!hasValue}
                className={`group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 font-medium text-white transition-all
                  ${
                    hasValue
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
                  key="saved"
                  variants={itemUp}
                  initial="hidden"
                  animate="show"
                  className="text-center text-sm text-teal-400"
                >
                  ¡Listo! Guardamos tu nombre en el dispositivo.
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}

/**
 * Canvas de partículas minimalista (2D) – ligero y elegante.
 * Si tenés tu propio <ParticlesBackground />, reemplazá este componente.
 */
function ParticlesBackgroundCanvas() {
  const canvasRef = useRef(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cfg = useMemo(
    () => ({
      count: 130,
      maxSpeed: 0.45,
      linkDist: 120,
      hueBase: 500
    }),
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w = 0,
      h = 0,
      raf;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onResize = () => resize();
    resize();
    window.addEventListener('resize', onResize);

    // Partículas
    const P = [];
    for (let i = 0; i < cfg.count; i++) {
      P.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * cfg.maxSpeed,
        vy: (Math.random() - 0.5) * cfg.maxSpeed,
        r: Math.random() * 1.2 + 0.3
      });
    }

    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, w, h);

      // Fondo sutil con gradiente radial
      const grd = ctx.createRadialGradient(
        w * 0.5,
        h * 0.5,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.7
      );
      grd.addColorStop(0, 'rgba(10,10,14,0.8)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Actualizar & dibujar
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;
      }

      // Líneas
      for (let i = 0; i < P.length; i++) {
        for (let j = i + 1; j < P.length; j++) {
          const dx = P[i].x - P[j].x;
          const dy = P[i].y - P[j].y;
          const d = Math.hypot(dx, dy);
          if (d < cfg.linkDist) {
            const a = 1 - d / cfg.linkDist;
            ctx.strokeStyle = `hsla(${
              cfg.hueBase + (dx + dy) * 0.02
            }, 85%, 65%, ${a * 0.35})`;
            ctx.lineWidth = a * 1.2;
            ctx.beginPath();
            ctx.moveTo(P[i].x, P[i].y);
            ctx.lineTo(P[j].x, P[j].y);
            ctx.stroke();
          }
        }
      }

      // Puntos
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        ctx.fillStyle = `hsla(${
          cfg.hueBase + (p.x + p.y) * 0.02
        }, 85%, 68%, 0.9)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [cfg, dpr]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full bg-black/100"
      aria-hidden
    />
  );
}
