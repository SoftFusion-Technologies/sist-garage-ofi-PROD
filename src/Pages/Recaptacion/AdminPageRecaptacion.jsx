import React from 'react';
import { Link } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import {
  FaBullhorn,
  FaUserClock,
  FaChartLine,
  FaList,
  FaPlusCircle
} from 'react-icons/fa';

const recaptacionLinks = [
  {
    to: '/dashboard/recaptacion/campanas',
    label: 'Campañas activas',
    icon: <FaBullhorn />
  },
  {
    to: '/dashboard/recaptacion/inactivos',
    label: 'Clientes inactivos',
    icon: <FaUserClock />
  },
  {
    to: '/dashboard/recaptacion/asignados',
    label: 'Clientes asignados',
    icon: <FaList />
  },
  {
    to: '/dashboard/recaptacion/crear',
    label: 'Crear campaña',
    icon: <FaPlusCircle />
  },
  {
    to: '/dashboard/recaptacion/estadisticas',
    label: 'Estadísticas',
    icon: <FaChartLine />
  }
];

const AdminPageRecaptacion = () => {
  const { userLevel } = useAuth();

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121b] to-[#1a1a2e]">
          <ParticlesBackground />
          <ButtonBack />
          <div className="text-center pt-24">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-8 drop-shadow-md"
            >
              Gestión de Recaptación
            </motion.h1>
          </div>

          <div className="xl:px-0 sm:px-16 px-6 max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-8 py-12">
            {recaptacionLinks.map(({ to, label, icon }, index) => (
              <Link to={to} key={label}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-white shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:border-orange-400 transition-all duration-300 font-semibold text-lg lg:text-xl text-gray-800 rounded-2xl flex justify-center items-center h-40 cursor-pointer border border-white/20 hover:scale-[1.02] flex-col gap-2"
                >
                  <span className="text-4xl text-orange-500">{icon}</span>
                  <span>{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPageRecaptacion;
