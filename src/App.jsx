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
import LocalesGet from './Pages/MetodosGets/LocalesGet';
import TallesGet from './Pages/MetodosGets/TallesGet';
function AppContent() {
  const { hideLayoutFooter, hideLayoutNav } = useLayoutVisibility();

  return (
    <>
      {!hideLayoutNav && <NavBar />}
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
          path="/dashboard/stock"
          element={
            <ProtectedRoute>
              {' '}
              <AdminPageStock />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/locales"
          element={
            <ProtectedRoute>
              {' '}
              <LocalesGet />{' '}
            </ProtectedRoute>
          }
        />
        <Ruta
          path="/dashboard/stock/talles"
          element={
            <ProtectedRoute>
              {' '}
              <TallesGet />{' '}
            </ProtectedRoute>
          }
        />
        {/* componentes del staff y login FINAL */}
        {/* <Ruta path="/*" element={<NotFound />} /> */}
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
