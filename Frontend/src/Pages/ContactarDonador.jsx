import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Intercambiar.css";
import { API_URL } from "../config";

const ContactarDonador = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    donacionId, 
    donacionTitle, 
    donacionImage,
    donacionDescription,
    donadorId, 
    donadorNombre, 
    donadorApellido 
  } = location.state || {};

  const [formData, setFormData] = useState({
    mensaje: "",
    razonInteres: "",
    telefono: "",
    disponibilidad: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) {
      alert("Debes iniciar sesión para contactar al donador");
      navigate("/login");
      return;
    }
    
    if (!donacionId || !donadorId) {
      alert("Información de donación no válida");
      navigate("/donaciones");
      return;
    }

    if (usuario.id === donadorId) {
      alert("No puedes contactarte a ti mismo por tu propia donación");
      navigate(`/donaciones/${donacionId}`);
      return;
    }

    setUsuarioActual(usuario);
  }, [donacionId, donadorId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.mensaje.trim()) {
      alert("Por favor, escribe un mensaje explicando tu interés");
      return;
    }

    if (!formData.razonInteres.trim()) {
      alert("Por favor, explica brevemente por qué te interesa esta donación");
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear mensaje completo
      const mensajeCompleto = `
SOLICITUD DE DONACIÓN: ${donacionTitle}

Mensaje del interesado:
${formData.mensaje}

Razón del interés:
${formData.razonInteres}

${formData.telefono ? `Teléfono de contacto: ${formData.telefono}` : ''}

${formData.disponibilidad ? `Disponibilidad para recoger: ${formData.disponibilidad}` : ''}

---
Enviado por ${usuarioActual.nombre} ${usuarioActual.apellido}
      `.trim();

      const mensaje = {
        de: `${usuarioActual.nombre} ${usuarioActual.apellido}`,
        deId: usuarioActual.id,
        paraId: donadorId,
        paraNombre: `${donadorNombre} ${donadorApellido}`,
        donacionId: donacionId,
        donacionTitle: donacionTitle,
        descripcion: mensajeCompleto,
        tipoPeticion: "donacion", // Identificador especial para donaciones
        imagenDonacion: donacionImage
      };

      const response = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mensaje),
      });

      if (!response.ok) {
        throw new Error("Error al enviar la solicitud");
      }

      await response.json();
      
      // Mostrar mensaje de éxito
      setShowToast(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/perfil", { 
          state: { 
            mensaje: "Tu solicitud de donación ha sido enviada. Revisa tus mensajes para las respuestas del donador." 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!usuarioActual || !donacionId) {
    return (
      <div className="intercambiar-container">
        <Header />
        <div className="container mt-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="intercambiar-container">
      <Header search={false} />
      
      <div className="container mt-4">
        {/* Encabezado */}
        <div className="intercambiar-header">
          <div className="col-lg-8 mx-auto px-0">
            <h1 className="contactar-title-premium">
              <i className="fas fa-heart text-danger me-2"></i>
              Contactar al Donador
            </h1>
            <p className="intercambiar-subtitle">
              Envía una solicitud de interés por esta donación
            </p>
          </div>
        </div>

        <div className="row mt-4">
          {/* Formulario de contacto - ocupa el ancho centrado */}
          <div className="col-lg-8 mx-auto">
            <div className="intercambiar-form-container">
              <form onSubmit={handleSubmit} className="intercambiar-form">
                <h5 className="form-section-title">
                  <i className="fas fa-envelope me-2"></i>
                  Mensaje al Donador
                </h5>
                <div className="row g-3 mb-2">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label" htmlFor="nombreCompleto">Nombre</label>
                      <input
                        id="nombreCompleto"
                        type="text"
                        className="form-control form-control-readonly"
                        value={`${usuarioActual?.nombre || ''} ${usuarioActual?.apellido || ''}`.trim()}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label" htmlFor="emailUsuario">Email</label>
                      <input
                        id="emailUsuario"
                        type="email"
                        className="form-control form-control-readonly"
                        value={usuarioActual?.email || ''}
                        readOnly
                        aria-readonly="true"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="mensaje" className="form-label">
                    Mensaje principal <span className="required">*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    placeholder="Escribe un mensaje amable explicando tu interés en esta donación..."
                    className="form-control"
                    rows="4"
                    required
                  />
                  <small className="form-text text-muted">
                    Sé respetuoso y explica claramente por qué te interesa esta donación
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="razonInteres" className="form-label">
                    ¿Por qué te interesa esta donación? <span className="required">*</span>
                  </label>
                  <textarea
                    id="razonInteres"
                    name="razonInteres"
                    value={formData.razonInteres}
                    onChange={handleInputChange}
                    placeholder="Ejemplo: Lo necesito para mi hogar, es para ayudar a alguien, etc."
                    className="form-control"
                    rows="3"
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="telefono" className="form-label">
                        Teléfono de contacto <span className="optional">(opcional)</span>
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="Ej: +54 9 11 1234-5678"
                        className="form-control"
                      />
                      <small className="form-text text-muted">
                        Para facilitar la coordinación de la entrega
                      </small>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="disponibilidad" className="form-label">
                        Disponibilidad <span className="optional">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        id="disponibilidad"
                        name="disponibilidad"
                        value={formData.disponibilidad}
                        onChange={handleInputChange}
                        placeholder="Ej: Fines de semana, tardes, etc."
                        className="form-control"
                      />
                      <small className="form-text text-muted">
                        Cuándo puedes recoger la donación
                      </small>
                    </div>
                  </div>
                </div>

                {/* Línea divisoria y mensaje informativo al final del formulario */}
                <hr className="form-divider" />
                <div className="form-info-hint" role="note" aria-live="polite">
                  <i className="fas fa-info-circle me-2" aria-hidden="true"></i>
                  Esta solicitud se enviará como mensaje al donador. Podrás continuar con la conversación desde tu perfil en la sección "Mis mensajes".
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary me-3"
                    onClick={() => navigate(`/donaciones/${donacionId}`)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Enviar Solicitud
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de éxito (flotante lateral derecho) */}
      {showToast && (
        <div className="toast-container">
          <div className="toast-success" role="status" aria-live="polite">
            <i className="fas fa-check-circle" aria-hidden="true"></i>
            <span className="toast-message">
              ¡Solicitud enviada! El donador recibirá tu mensaje y podrá contactarte.
            </span>
            <button
              type="button"
              className="btn-toast-close"
              onClick={() => setShowToast(false)}
              aria-label="Cerrar"
              title="Cerrar"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ContactarDonador;
