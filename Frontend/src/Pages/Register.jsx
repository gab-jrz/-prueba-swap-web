import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css"; // Asegúrate de tener el archivo CSS
import { useToast } from "../components/ToastProvider.jsx";
import Logo from "../components/Logo.jsx";
import { API_URL } from "../config";
 

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [provincia, setProvincia] = useState('Tucumán');

  const PROVINCIAS = [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza',
    'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
    'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ].sort();

  const navigate = useNavigate();
  const toast = useToast();

  const capitalizar = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!nombre.trim() || !apellido.trim() || !email.trim()) {
      setError("Todos los campos son obligatorios");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const nombreCapitalizado = capitalizar(nombre);
      const apellidoCapitalizado = capitalizar(apellido);
      
      const nuevoUsuario = {
        id: Date.now().toString(),
        nombre: nombreCapitalizado,
        apellido: apellidoCapitalizado,
        username: `${nombreCapitalizado.toLowerCase()}${apellidoCapitalizado.toLowerCase()}`,
        email,
        password,
        provincia: provincia,
        telefono: "011-555-46522",
        imagen: "https://via.placeholder.com/150",
      };

      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nuevoUsuario),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error en el registro");
      }

      // Guardar token y datos del usuario
      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("usuarioActual", JSON.stringify(data.user));
      // Toast de éxito y redirección a Home
      toast.success("Cuenta creada con éxito. ¡Bienvenido/a!");
      navigate("/");
    } catch (error) {
      setError(error.message);
      // Toast de error con detalle
      toast.error(error.message || "Error en el registro");
      console.error("Error en el registro:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="register-header">
        <Logo style={{ fontSize: "1.8rem !important" }} />
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <Link to="/" className="register-home-link" aria-label="Inicio">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </Link>
        </div>
      </header>
      <div className="register-container">
        <form onSubmit={handleSubmit} className="register-form">
        <h2>Crear cuenta</h2>
        {error && <p className="error-message">{error}</p>}

        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <label className="password-input-label">
  <span>Contraseña</span>
  <div className="password-input-wrapper">
    <input
      className="password-input"
      type={showPassword ? "text" : "password"}
      placeholder="Contraseña"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      disabled={loading}
      autoComplete="new-password"
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

        <label className="password-input-label">
  <span>Confirmar contraseña</span>
  <div className="password-input-wrapper">
    <input
      className="password-input"
      type={showConfirmPassword ? "text" : "password"}
      placeholder="Confirmar contraseña"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      required
      disabled={loading}
      autoComplete="new-password"
    />
    <span
      className="password-toggle-inside"
      role="button"
      tabIndex={0}
      aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      onMouseDown={e => { e.preventDefault(); setShowConfirmPassword(s => !s); }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setShowConfirmPassword(s => !s); } }}
      style={{ userSelect: 'none' }}
    >
      {showConfirmPassword ? (
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

        <select
          value={provincia}
          onChange={e => setProvincia(e.target.value)}
          required
          disabled={loading}
          style={{marginBottom:'1rem'}}
        >
          <option value="">Selecciona una provincia</option>
          {PROVINCIAS.map(p => (
            <option value={p} key={p}>{p}</option>
          ))}
        </select>

        <button type="submit" className="btn-register" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>

        <p className="redirect-login">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
        </form>
      </div>
    </>
  );
};

export default Register;
