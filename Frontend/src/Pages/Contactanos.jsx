import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_URL } from "../config";

const categorias = [
  "Problema de registro",
  "Problema de intercambio",
  "Problema de donación",
  "Problema de solicitud",
  "Soporte técnico",
  "Reclamos",
  "Sugerencias",
  "Otros"
];

export default function Contactanos() {
  const [form, setForm] = useState({ nombre: "", email: "", categoria: "", descripcion: "" });
  const [errors, setErrors] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [cargando, setCargando] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#top') {
      const el = document.getElementById('top');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const validate = () => {
    const newErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!form.email.trim()) newErrors.email = "El email es obligatorio.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Email inválido.";
    if (!form.categoria) newErrors.categoria = "Selecciona una categoría.";
    if (!form.descripcion.trim()) newErrors.descripcion = "La descripción es obligatoria.";
    return newErrors;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setErrorEnvio("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorEnvio("");
    setEnviado(false); // Resetear estado de envío
    const val = validate();
    if (Object.keys(val).length === 0) {
      setCargando(true);
      try {
        console.log('Enviando formulario...');
        const res = await fetch(`${API_URL}/contacto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
          credentials: 'include'
        });
        
        console.log('Respuesta del servidor:', res.status);
        
        if (!res.ok) {
          let errorData;
          try {
            errorData = await res.json();
            console.error('Error del servidor:', errorData);
          } catch (e) {
            console.error('No se pudo parsear la respuesta de error:', e);
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }
          throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Datos de respuesta:', data);
        
        if (data.ok) {
          setEnviado(true);
          setForm({ nombre: "", email: "", categoria: "", descripcion: "" });
        } else {
          throw new Error(data.error || 'Error al procesar la respuesta del servidor');
        }
      } catch (error) {
        console.error("Error al enviar el formulario:", error);
        setErrorEnvio(`Error: ${error.message || 'No se pudo enviar el mensaje. Por favor, inténtalo de nuevo más tarde.'}`);
      } finally {
        setCargando(false);
      }
    } else {
      setErrors(val);
    }
  };

  return (
    <div className="perfil-usuario-container">
      <Header search={false} />
      <main id="top" className="container py-5" style={{ minHeight: "60vh", scrollMarginTop: "120px" }}>
        <section className="mb-4 text-center">
          <h1 className="display-6 fw-bold mb-3">Contáctanos</h1>
          <p className="text-muted mb-0">¿Tenés dudas, sugerencias o problemas? Completa el formulario y nos pondremos en contacto a la brevedad.</p>
        </section>
        <section className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            {enviado ? (
              <div className="alert alert-success" style={{background:'#e6f9ec',color:'#15803d',border:'1.5px solid #22c55e'}}>¡Mensaje enviado! Nos contactaremos pronto.</div>
            ) : (
              <form className="p-4 rounded-4 border bg-white shadow" style={{borderColor:'#2563eb', boxShadow:'0 2px 24px 0 #2563eb22'}} noValidate onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{color:'#2563eb'}}>Nombre</label>
                  <input type="text" className={`form-control${errors.nombre ? " is-invalid" : ""}`} name="nombre" value={form.nombre} onChange={handleChange} disabled={cargando} style={{borderColor: errors.nombre ? '#dc2626' : '#2563eb', boxShadow: errors.nombre ? '0 0 0 0.15rem #dc262655' : undefined}} />
                  {errors.nombre && <div className="invalid-feedback" style={{color:'#dc2626'}}>{errors.nombre}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{color:'#2563eb'}}>Email</label>
                  <input type="email" className={`form-control${errors.email ? " is-invalid" : ""}`} name="email" value={form.email} onChange={handleChange} disabled={cargando} style={{borderColor: errors.email ? '#dc2626' : '#2563eb', boxShadow: errors.email ? '0 0 0 0.15rem #dc262655' : undefined}} />
                  {errors.email && <div className="invalid-feedback" style={{color:'#dc2626'}}>{errors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{color:'#2563eb'}}>Categoría</label>
                  <select className={`form-select${errors.categoria ? " is-invalid" : ""}`} name="categoria" value={form.categoria} onChange={handleChange} disabled={cargando} style={{borderColor: errors.categoria ? '#dc2626' : '#2563eb', boxShadow: errors.categoria ? '0 0 0 0.15rem #dc262655' : undefined}}>
                    <option value="">Selecciona una opción</option>
                    {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {errors.categoria && <div className="invalid-feedback" style={{color:'#dc2626'}}>{errors.categoria}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{color:'#2563eb'}}>Descripción</label>
                  <textarea className={`form-control${errors.descripcion ? " is-invalid" : ""}`} name="descripcion" rows={4} value={form.descripcion} onChange={handleChange} disabled={cargando} style={{borderColor: errors.descripcion ? '#dc2626' : '#2563eb', boxShadow: errors.descripcion ? '0 0 0 0.15rem #dc262655' : undefined}} />
                  {errors.descripcion && <div className="invalid-feedback" style={{color:'#dc2626'}}>{errors.descripcion}</div>}
                </div>
                {errorEnvio && <div className="alert alert-danger" style={{background:'#fbeaea',color:'#b91c1c',border:'1.5px solid #dc2626'}}>{errorEnvio}</div>}
                <button type="submit" className="btn w-100 fw-bold" style={{background:'#2563eb',color:'#fff',border:'none'}} disabled={cargando}>{cargando ? "Enviando..." : "Enviar"}</button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
