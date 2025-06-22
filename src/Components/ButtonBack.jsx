import React from 'react';
import { useNavigate } from 'react-router-dom';

const ButtonBack = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="ml-10 mt-6 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition duration-300"
    >
      Volver Atrás
    </button>
  );
};

export default ButtonBack;
