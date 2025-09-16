import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const usuarioActual = localStorage.getItem('usuarioActual');
  if (!token || !usuarioActual) {
    return <Navigate to="/login" replace />;  //COMPONENTE PROTECTED ROUTE PARA PROTEGER RUTA PRIVADAS
  }
  return children;
}