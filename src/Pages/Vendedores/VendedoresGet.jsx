import React, { useEffect, useState } from 'react';
import { FaUserTie, FaEnvelope, FaMapMarkerAlt, FaStore } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';

const VendedoresGet = () => {
  const [vendedores, setVendedores] = useState([]);
  const [filtro, setFiltro] = useState('');

  const fetchVendedores = async () => {
    try {
      const res = await axios.get('http://localhost:8080/usuarios');
      const soloVendedores = res.data.filter((u) => u.rol === 'vendedor');
      setVendedores(soloVendedores);
    } catch (err) {
      console.error('Error al obtener vendedores:', err);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const vendedoresFiltrados = vendedores.filter((v) =>
    v.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white px-4 py-10">
          <ParticlesBackground></ParticlesBackground>
          <ButtonBack></ButtonBack>
          <div className="max-w-6xl mx-auto">
        <h1 className="titulo text-4xl font-extrabold text-center mb-10 drop-shadow-md uppercase">
          <FaUserTie className="inline-block mr-2" />
          Vendedores
        </h1>

        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="bg-white w-full max-w-md px-4 py-2 rounded-xl shadow-lg text-black focus:outline-none"
          />
        </div>

        {vendedoresFiltrados.length === 0 ? (
          <p className="text-center text-white/70 italic">
            No se encontraron vendedores.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendedoresFiltrados.map((vendedor, index) => (
              <motion.div
                key={vendedor.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-purple-400 transition-all duration-300 text-gray-800 font-medium text-lg rounded-2xl w-full p-6 flex flex-col justify-between border border-white/20 hover:scale-[1.03] gap-3"
              >
                <h2 className="text-xl font-bold flex items-center gap-2 text-purple-700">
                  <FaUserTie /> {vendedor.nombre}
                </h2>
                <p className="text-sm text-gray-700">
                  <FaEnvelope className="inline mr-2 text-purple-500" />
                  {vendedor.email}
                </p>
                <p className="text-sm text-gray-700">
                  <FaStore className="inline mr-2 text-purple-500" />
                  {vendedor.locale?.nombre || 'Sin local'}
                </p>
                <p className="text-sm text-gray-700">
                  <FaMapMarkerAlt className="inline mr-2 text-purple-500" />
                  {vendedor.locale?.direccion || 'Sin dirección'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendedoresGet;
