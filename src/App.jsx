/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 26 / 05 / 2025
 * Versión: 1.0
 *
 * Descripción:
 *  Este archivo (App.jsx) es el componente principal de la aplicación.
 *  Contiene la configuración de enrutamiento, carga de componentes asíncrona,
 *  y la lógica para mostrar un componente de carga durante la carga inicial.
 *  Además, incluye la estructura principal de la aplicación, como la barra de navegación,
 *  el pie de página y las diferentes rutas para las páginas de la aplicación.
 *
 * Tema: Configuración de la Aplicación Principal
 * Capa: Frontend
 * Contacto: benjamin.orellanaof@gmail.com || 3863531891
 */

import './App.css';
import {
  BrowserRouter as Router,
  Routes as Rutas,
  Route as Ruta
} from 'react-router-dom'; // IMPORTAMOS useLocation PARA OCULTAR COMPONENTES

import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import useLayoutVisibility from './Hooks/useLayoutVisibility';

// LOGIN
import LoginForm from './Components/login/LoginForm';
import AdminPage from './Pages/Dash/AdminPage';
import AdminPageStock from './Pages/Stock/AdminPageStock';
import LocalesGet from './Pages/LocalesGet';
import TallesGet from './Pages/Stock/TallesGet';
import ProductosGet from './Pages/Stock/ProductosGet';
import StockGet from './Pages/Stock/StockGet';

import { Navigate } from 'react-router-dom';
import UsuariosGet from './Pages/UsuariosGet';
import LugaresGet from './Pages/Stock/LugaresGet';
import EstadosGet from './Pages/Stock/Estados';
import CategoriasGet from './Pages/Stock/CategoriasGet';
import AdminPageVentas from './Pages/Ventas/AdminPageVentas';

function AppContent() {
  const { hideLayoutFooter, hideLayoutNav } = useLayoutVisibility();

  return (
    <>
      {/* {!hideLayoutNav && <NavBar />} */}
      <Rutas>
        {/* <Ruta path="/" element={<Home />} /> */}
        {/* componentes del staff y login INICIO */}
        <Ruta path="/login" element={<LoginForm />} />
        <Ruta
          path="/dashboard"
          element={
            <ProtectedRoute>
              {' '}
              <AdminPage />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/usuarios"
          element={
            <ProtectedRoute>
              {' '}
              <UsuariosGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock"
          element={
            <ProtectedRoute>
              {' '}
              <AdminPageStock />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/locales"
          element={
            <ProtectedRoute>
              {' '}
              <LocalesGet />{' '}
            </ProtectedRoute>
          }
        />
        {/* MODULO DENTRO DE STOCK INICIO BENJAMIN ORELLANA 22 06 25 */}
        <Ruta
          path="/dashboard/stock/talles"
          element={
            <ProtectedRoute>
              {' '}
              <TallesGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/categorias"
          element={
            <ProtectedRoute>
              {' '}
              <CategoriasGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/productos"
          element={
            <ProtectedRoute>
              {' '}
              <ProductosGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/stock"
          element={
            <ProtectedRoute>
              {' '}
              <StockGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/lugares"
          element={
            <ProtectedRoute>
              {' '}
              <LugaresGet />{' '}
            </ProtectedRoute>
          }
        />{' '}
        <Ruta
          path="/dashboard/stock/estados"
          element={
            <ProtectedRoute>
              {' '}
              <EstadosGet />{' '}
            </ProtectedRoute>
          }
        />
        {/* MODULO DENTRO DE STOCK FINAL BENJAMIN ORELLANA 22 06 25 */}
        {/* MODULO DENTRO DE VENTAS INICIO BENJAMIN ORELLANA 22 06 25 */}
        <Ruta
          path="/dashboard/ventas"
          element={
            <ProtectedRoute>
              {' '}
              <AdminPageVentas />{' '}
            </ProtectedRoute>
          }
        />
        {/* MODULO DENTRO DE VENTAS FINAL BENJAMIN ORELLANA 22 06 25 */}
        {/* componentes del staff y login FINAL */}
        {/* <Ruta path="/*" element={<NotFound />} /> */}
        {/* 🔁 Redirección automática al login si se accede a "/" */}
        <Ruta path="/" element={<Navigate to="/login" replace />} />
        {/* 🔁 Ruta no encontrada */}
        <Ruta path="*" element={<Navigate to="/login" replace />} />
      </Rutas>
      {/* {!hideLayoutFooter && <Footer />} */}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
