import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded pages
const Home = lazy(() => import('./Pages/Home'));
const DetalleProducto = lazy(() => import('./Pages/DetalleProducto'));
const Login = lazy(() => import('./Pages/Login'));
const Register = lazy(() => import('./Pages/Register'));
const Intercambiar = lazy(() => import('./Pages/Intercambiar'));
const PerfilUsuario = lazy(() => import('./Pages/PerfilUsuario'));
const Calificaciones = lazy(() => import('./Pages/Calificaciones'));
const PerfilPublico = lazy(() => import('./Pages/PerfilPublico'));
const Editar = lazy(() => import('./Pages/Editar'));
const Configuracion = lazy(() => import('./Pages/Configuracion'));
const PublicarProducto = lazy(() => import('./Pages/PublicarProducto'));
const EditarProducto = lazy(() => import('./Pages/EditarProducto'));
const Favoritos = lazy(() => import('./Pages/Favoritos'));
const ForgotPassword = lazy(() => import('./Pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./Pages/ResetPassword'));
const ComoFunciona = lazy(() => import('./Pages/ComoFunciona'));
const SobreNosotros = lazy(() => import('./Pages/SobreNosotros'));
const Privacidad = lazy(() => import('./Pages/Privacidad'));
const DonationsList = lazy(() => import('./Pages/DonationsList'));
const DonationCreate = lazy(() => import('./Pages/DonationCreateNew'));
const DonationDetail = lazy(() => import('./Pages/DonationDetail'));
const ContactarDonador = lazy(() => import('./Pages/ContactarDonador'));
const EditarDonacion = lazy(() => import('./Pages/EditarDonacion'));
const RequestsList = lazy(() => import('./Pages/RequestsList'));
const RequestCreate = lazy(() => import('./Pages/RequestCreateNew'));
const RequestDetail = lazy(() => import('./Pages/RequestDetail'));
const EditarSolicitud = lazy(() => import('./Pages/EditarSolicitud'));
const Contactanos = lazy(() => import('./Pages/Contactanos'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{padding:'2rem', textAlign:'center'}}>Cargando...</div>}>
        <Routes>
        <Route path="/" element={<Home />} />
        {/* Páginas informativas */}
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />

        <Route path="/privacidad" element={<Privacidad />} />
        {/* Alias antiguo para publicar */}
        <Route path="/publicar" element={<Navigate to="/publicarproducto" replace />} />
        <Route path="/categorias" element={<Navigate to="/" replace />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/intercambiar" element={<ProtectedRoute><Intercambiar /></ProtectedRoute>} />
        <Route path="/editar" element={<Editar />} />

        <Route path="/perfil" element={<ProtectedRoute><PerfilUsuario /></ProtectedRoute>} />
        <Route path="/perfil/:id" element={<PerfilPublico />} />
        <Route path="/perfil-publico/:id" element={<PerfilPublico />} />
        <Route path="/calificaciones/:id" element={<Calificaciones />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/publicarproducto" element={
          <ProtectedRoute>
            <PublicarProducto />
          </ProtectedRoute>
        } />

        {/* Favoritos */}
        <Route path="/favoritos" element={<Favoritos />} />

        {/* Rutas Donaciones y Solicitudes */}
        <Route path="/donaciones" element={<DonationsList />} />
        <Route path="/donaciones/publicar" element={<DonationCreate />} />
        <Route path="/donaciones/:id" element={<DonationDetail />} />
        <Route path="/donaciones/:id/contactar" element={<ProtectedRoute><ContactarDonador /></ProtectedRoute>} />
        <Route path="/donation-edit/:id" element={<ProtectedRoute><EditarDonacion /></ProtectedRoute>} />
        <Route path="/donaciones/solicitudes" element={<RequestsList />} />
        <Route path="/donaciones/solicitar" element={<RequestCreate />} />
        <Route path="/donaciones/solicitudes/:id" element={<RequestDetail />} />
        <Route path="/request-edit/:id" element={<ProtectedRoute><EditarSolicitud /></ProtectedRoute>} />
        
        <Route path="/editar-producto/:id" element={
         <ProtectedRoute>
            <EditarProducto />
         </ProtectedRoute>
        } />
        <Route path="/contactanos" element={<Contactanos />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
