import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import NavbarStaff from './NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
// import Footer from '../../components/footer/Footer';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';

const AdminPage = () => {
  const { userLevel } = useAuth();

  return (
    <>
      {/* Navbar section */}
      <NavbarStaff />
      {/* Hero section*/}
      <section className="relative w-full h-contain mx-auto bg-white">
        <div className="bg-gradient-to-b from-[#0a0a0f] via-[#12121b] to-[#1a1a2e]">
          <ParticlesBackground></ParticlesBackground>
          <div className="titulo xl:px-0 sm:px-16 px-6 max-w-7xl mx-auto grid grid-cols-2 max-sm:grid-cols-1 max-md:gap-y-10 md:gap-10 py-28 sm:pt-44 lg:pt-28 md:w-5/6 ">
            {(userLevel === 'admin' || userLevel === '') && (
              <div className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl">
                <Link to="/dashboard/stock">
                  <button className="btnstaff">Stock</button>
                </Link>
              </div>
            )}

            {(userLevel === 'admin' || userLevel === 'administrador') && (
              <div className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl">
                <Link to="/dashboard/Ventas">
                  <button className="btnstaff">Ventas</button>
                </Link>
              </div>
            )}

            {(userLevel === 'admin' ||
              userLevel === 'instructor' ||
              userLevel === 'gerente' ||
              userLevel === 'vendedor') && (
              <div className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl">
                <Link to="/dashboard/recaptacion">
                  <button className="btnstaff">Recaptación</button>
                </Link>
              </div>
            )}

            {(userLevel === 'admin' ||
              userLevel === 'administrador' ||
              userLevel === 'instructor' ||
              userLevel === 'gerente') && (
              <div className="bg-white font-bignoodle w-[250px] h-[100px] text-[20px] lg:w-[400px] lg:h-[150px] lg:text-[30px] mx-auto flex justify-center items-center rounded-tr-xl rounded-bl-xl">
                <Link to="/dashboard/vendedores">
                  <button className="btnstaff">Vendedores</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default AdminPage;
