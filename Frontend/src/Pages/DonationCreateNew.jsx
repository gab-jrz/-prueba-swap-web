import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { categorias } from "../categorias";
import Footer from '../components/Footer';
import "../styles/PublicarProducto.css";
import "../styles/DonationForm.css";
import "../styles/DonationFormThemes.css";
import { initDarkModeDetector } from '../utils/darkModeDetector';
import ThanksModal from '../components/ThanksModal';
import { API_URL } from '../config';

const DonationCreateNew = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isThanksOpen, setIsThanksOpen] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    location: '',
    pickupMethod: '',
    images: []
  });

  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicaInput, setCaracteristicaInput] = useState("");
  const [caracteristicasError, setCaracteristicasError] = useState("");
  const totalCaracteres = caracteristicas.reduce((acc, c) => acc + c.length, 0);

  const conditionOptions = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'como_nuevo', label: 'Como nuevo' },
    { value: 'muy_bueno', label: 'Muy bueno' },
    { value: 'bueno', label: 'Bueno' },
    { value: 'regular', label: 'Regular' }
  ];

  const pickupMethods = [
    { value: 'domicilio', label: 'Retiro en domicilio' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' },
    { value: 'envio', label: 'Envío postal' },
    { value: 'flexible', label: 'Flexible (a coordinar)' }
  ];

  useEffect(() => {
    initDarkModeDetector();
    const userData = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    if (previewImages.length >= 3) {
      showNotification('Máximo 3 imágenes permitidas', 'error');
      return;
    }

    for (let i = 0; i < Math.min(files.length, 3 - previewImages.length); i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten archivos de imagen', 'error');
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImages(prev => [...prev, reader.result]);
        setFormData(prev => ({ ...prev, images: [...prev.images, file] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddCaracteristica = () => {
    if (!caracteristicaInput.trim()) return;
    if (caracteristicas.length >= 15) {
      setCaracteristicasError("Máximo 15 ítems.");
      return;
    }
    if (totalCaracteres + caracteristicaInput.length > 1000) {
      setCaracteristicasError("Máximo 1000 caracteres en total.");
      return;
    }
    setCaracteristicas([...caracteristicas, caracteristicaInput.trim()]);
    setCaracteristicaInput("");
    setCaracteristicasError("");
  };

  const handleEditCaracteristica = (idx, value) => {
    if (value.length > 1000) return;
    const nuevas = [...caracteristicas];
    nuevas[idx] = value;
    setCaracteristicas(nuevas);
  };

  const handleRemoveCaracteristica = idx => {
    setCaracteristicas(caracteristicas.filter((_, i) => i !== idx));
    setCaracteristicasError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.condition) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    // La imagen es obligatoria: requiere al menos 1 foto
    if (!formData.images || formData.images.length === 0) {
      showNotification('Agrega al menos 1 foto de la donación', 'error');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('pickupMethod', formData.pickupMethod);
      formDataToSend.append('donor', user._id);
      
      if (caracteristicas.length > 0) {
        formDataToSend.append('characteristics', JSON.stringify(caracteristicas));
      }

      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch(`${API_URL}/donations`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const savedDonation = await response.json();

      // Cerrar confirmación y abrir agradecimiento (auto-dismiss 3s)
      setIsModalOpen(false);
      setIsThanksOpen(true);
      
      // Cerrar el modal de agradecimiento después de 3 segundos y redirigir al perfil en la pestaña de Donaciones
      setTimeout(() => {
        setIsThanksOpen(false);
        // Redirigir al perfil (Mis Donaciones) con un estado para mostrar mensaje de éxito
        navigate('/perfil', {
          state: {
            activeTab: 'donaciones',
            showSuccess: true,
            message: '¡Donación publicada con éxito!'
          }
        });
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      showNotification('Error al publicar la donación', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const Modal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}>
        <div className="modal-content" style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}>
          <h3 style={{
            marginTop: 0,
            color: '#1a202c',
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '600',
          }}>{title}</h3>
          <p style={{
            color: '#4a5568',
            marginBottom: '1.5rem',
            lineHeight: '1.5',
          }}>{message}</p>
          <div className="modal-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1.5rem',
          }}>
            <button 
              onClick={onClose} 
              disabled={isLoading}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseOver={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isLoading}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #4ade80 0%, #10b981 100%)',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseOver={e => !isLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={e => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isLoading ? 'Publicando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Asegurar que el modo oscuro se aplique correctamente
  useEffect(() => {
    initDarkModeDetector();
  }, []);

  return (
    <div className="perfil-usuario-container donation-light">
      <Header search={false} />

      <div className="publicar-producto-container" data-theme="dark">
        <div className="publicar-form-card">
          <h2>
            <i className="fas fa-heart"></i>
            Crear Nueva Donación
          </h2>
          <p>Comparte algo que ya no necesitas con quienes lo pueden aprovechar</p>
          
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              {notification.message}
            </div>
          )}

          <form className="publicar-producto-form" onSubmit={handleSubmit}>
            {/* Información básica */}
            <div className="form-group">
              <label htmlFor="title">Título de la Donación *</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Ej: Ropa de niño talla 4-6 años en excelente estado"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
              <div className="input-helper">{formData.title.length}/100 caracteres</div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Estado del Artículo *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecciona el estado</option>
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción Detallada *</label>
              <textarea
                id="description"
                name="description"
                rows="5"
                placeholder="Describe detalladamente lo que estás donando: estado, características, historia del artículo, motivo de donación, etc."
                value={formData.description}
                onChange={handleChange}
                maxLength={1000}
                required
              />
              <div className="input-helper">{formData.description.length}/1000 caracteres</div>
            </div>

            {/* Características adicionales */}
            <div className="form-group">
              <label>Características del Producto <span style={{fontWeight:400, fontSize:'0.95em', color:'#6366f1'}}>(opcional, máx 15 ítems/1000 caracteres)</span></label>
              <div className="caracteristicas-checklist">
                <div className="caracteristicas-input-row">
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="Ej: Batería nueva, Incluye caja, Garantía vigente..."
                    value={caracteristicaInput}
                    onChange={e => setCaracteristicaInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); handleAddCaracteristica(); }}}
                    disabled={caracteristicas.length >= 15}
                    className="caracteristica-input"
                  />
                  <button 
                    type="button" 
                    className="btn-add-caracteristica" 
                    onClick={handleAddCaracteristica} 
                    disabled={!caracteristicaInput.trim() || caracteristicas.length >= 15 || (totalCaracteres + caracteristicaInput.length > 1000)}
                  >
                    +
                  </button>
                </div>
                <div className="caracteristicas-list">
                  {caracteristicas.map((item, idx) => (
                    <div className="caracteristica-item" key={idx}>
                      <span className="caracteristica-bullet">✔️</span>
                      <input
                        type="text"
                        value={item}
                        maxLength={200}
                        onChange={e => handleEditCaracteristica(idx, e.target.value)}
                        className="caracteristica-edit-input"
                        style={{width:'70%'}}
                      />
                      <button 
                        type="button" 
                        className="btn-remove-caracteristica" 
                        title="Eliminar" 
                        onClick={() => handleRemoveCaracteristica(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="caracteristicas-limits">
                  <span>{caracteristicas.length}/15 ítems</span> | <span>{totalCaracteres}/1000 caracteres</span>
                </div>
                {caracteristicasError && <div className="caracteristicas-error">{caracteristicasError}</div>}
              </div>
            </div>

            {/* Categoría - idéntico a PublicarProducto */}
            <div className="form-group">
              <label htmlFor="category">Categoría</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>-- Selecciona una categoría --</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Información de entrega */}
            <div className="form-group">
              <label htmlFor="pickupMethod">Método de Entrega *</label>
              <select
                id="pickupMethod"
                name="pickupMethod"
                value={formData.pickupMethod}
                onChange={handleChange}
                required
              >
                <option value="" disabled>¿Cómo prefieres entregar?</option>
                {pickupMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Ubicación <span>(Opcional)</span></label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Ej: CABA, Palermo"
                value={formData.location}
                onChange={handleChange}
                maxLength={100}
              />
            </div>

            {/* Galería de fotos */}
            <div className="form-group">
              <label>Galería de Fotos * <span>(Obligatorio)</span></label>
              <div
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImages.length > 0 ? (
                  <div className="preview-multi-container">
                    {previewImages.map((img, idx) => (
                      <div className="preview-container" key={idx}>
                        <img src={img} alt={`Vista previa ${idx + 1}`} className="preview-image" />
                        <button
                          type="button"
                          className="remove-image"
                          title="Eliminar imagen"
                          onClick={e => {
                            e.stopPropagation();
                            setPreviewImages(prev => prev.filter((_, i) => i !== idx));
                            setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <p>Arrastra y suelta hasta 3 imágenes aquí o haz clic para seleccionar</p>
                    <span>Formatos aceptados: JPG, PNG, GIF</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={e => handleFileSelect(e.target.files)}
                  disabled={previewImages.length >= 3}
                />
              </div>
              <div className="multi-image-warning">Puedes subir hasta 3 imágenes.</div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button type="submit" className="btn-publicar">
                <i className="fas fa-heart"></i>
                Publicar Donación
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPublish}
        title="Confirmar Publicación"
        message="¿Estás seguro de que deseas publicar esta donación?"
        isLoading={isLoading}
      />

      <ThanksModal
        isOpen={isThanksOpen}
        onClose={() => {
          setIsThanksOpen(false);
          navigate('/perfil', { state: { activeTab: 'donaciones' } });
        }}
        title="¡Gracias por tu donación!"
        message="Tu donación ya está visible para la comunidad."
      />

      <Footer />
    </div>
  );
};

export default DonationCreateNew;
