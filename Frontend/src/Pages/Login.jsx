import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Asegúrate de tener el archivo CSS
import Logo from "../components/Logo.jsx";
import { API_URL } from "../config";
 

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("usuarioActual", JSON.stringify(data.user));

      // Depuración
      console.log("✅ Usuario logueado correctamente:", data.user);
      console.log("🆔 ID del usuario logueado:", data.user?.id);

      // Redirigir a la página principal después del login exitoso
      navigate('/'); // Redirige a Home en lugar del perfil público
    } catch (err) {
      setError(err.message);
      console.error("Error al iniciar sesión:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="register-header">
        <Logo style={{ fontSize: "1.8rem !important" }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <Link to="/" className="login-home-link" aria-label="Inicio">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </Link>
        </div>
      </header>
      <div className="login-container">
        <div className="login-form">
        <h2>Iniciar sesión</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <label className="password-input-label">
  Contraseña
  <div className="password-input-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Contraseña"
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
      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      onMouseDown={e => { e.preventDefault(); setShowPassword(s => !s); }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setShowPassword(s => !s); } }}
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
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
        <div className="redirect-register">
          <p>¿No tienes cuenta? <Link to="/register">Crear una cuenta aquí</Link></p>
          <p><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
        </div>
        </div>
      </div>
    </>
  );
};

export default Login;
