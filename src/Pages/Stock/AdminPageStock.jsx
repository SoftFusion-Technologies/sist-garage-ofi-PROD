import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
// import Footer from '../../components/footer/Footer';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
const AdminPageStock = () => {
  const { userLevel } = useAuth();

  return (
    <>
      {/* Navbar section */}
      <NavbarStaff />
      {/* Hero section*/}
      <section className="relative w-full min-h-screen mx-auto bg-white">
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121b] to-[#1a1a2e]">
          <ButtonBack></ButtonBack>
          <ParticlesBackground></ParticlesBackground>
          <div className="xl:px-0 titulo sm:px-16 px-6 max-w-7xl mx-auto grid grid-cols-2 max-sm:grid-cols-1 max-md:gap-y-10 md:gap-10 py-28 sm:pt-44 lg:pt-28 md:w-5/6 ">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl"
            >
              {' '}
              <Link to="/dashboard/stock/locales">
                <button className="btnstaff">locales</button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl"
            >
              {' '}
              <Link to="/dashboard/stock/talles">
                <button className="btnstaff">Talles </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl"
            >
              {' '}
              <Link to="/dashboard/stock/productos">
                <button className="btnstaff">Productos</button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl"
            >
              {' '}
              <Link to="/dashboard/stock/stock">
                <button className="btnstaff">stock</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPageStock;
