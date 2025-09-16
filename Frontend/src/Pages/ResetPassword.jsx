import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import Logo from '../components/Logo.jsx';
import { FaHome } from 'react-icons/fa';
import { API_URL } from '../config';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      setMessage('Contraseña actualizada con éxito');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <header className="register-header">
        <Logo style={{ fontSize: "1.8rem !important" }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <Link to="/" className="reset-home-link" aria-label="Inicio">
            <FaHome size={22} />
          </Link>
        </div>
      </header>
      <div className="login-container">
        <div className="login-form">
        <h2>Nueva contraseña</h2>
        {message && <p className="error-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label className="password-input-label">
            Nueva contraseña
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="password-input"
              />
              <span
                className="password-toggle-inside"
                role="button"
                tabIndex={0}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onMouseDown={(e) => { e.preventDefault(); setShowPassword((s) => !s); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setShowPassword((s) => !s); } }}
                style={{ userSelect: 'none' }}
              >
                {showPassword ? (
                  // Feather Icons eye-off
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.73-1.36 2.07-3.41 4.06-5.06" />
                    <path d="M1 1l22 22" />
                    <path d="M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .74-.24 1.42-.65 1.97" />
                    <path d="M22.54 12.5C21.27 15.11 17 19 12 19c-1.61 0-3.13-.31-4.54-.88" />
                  </svg>
                ) : (
                  // Feather Icons eye
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
                  </svg>
                )}
              </span>
            </div>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </form>
        <div className="redirect-register">
          <p><Link to="/login">Volver a iniciar sesión</Link></p>
        </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
