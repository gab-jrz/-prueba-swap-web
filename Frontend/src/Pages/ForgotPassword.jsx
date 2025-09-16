import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';
import Logo from '../components/Logo.jsx';
import { API_URL } from '../config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error');
      setMessage('Revisa tu correo para continuar');
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
          <Link to="/" className="forgot-home-link" aria-label="Inicio">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </Link>
        </div>
      </header>
      <div className="login-container">
        <div className="login-form">
        <h2>Restablecer contraseña</h2>
        {message && <p className="error-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
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

export default ForgotPassword;
