import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { categorias } from "../categorias";
import Footer from '../components/Footer';
import "../styles/PublicarProducto.css";
import "../styles/DonationForm.css";
import { initDarkModeDetector } from '../utils/darkModeDetector';
import { API_URL } from '../config';

const RequestCreateNew = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const prevTitleRef = useRef(document.title);
  const [user, setUser] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
  category: '',
  title: '',
  needDescription: '',
    location: '',
    urgency: 'med',
    privacy: false,
    attachments: []
  });

  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicaInput, setCaracteristicaInput] = useState("");
  const [caracteristicasError, setCaracteristicasError] = useState("");

  const urgencyOptions = [
    { value: 'low', label: 'Baja - No es urgente' },
    { value: 'med', label: 'Media - En algunas semanas' },
    { value: 'high', label: 'Alta - Lo necesito pronto' }
  ];

  useEffect(() => {
    initDarkModeDetector();
    // Set page title when this component mounts and restore on unmount
    prevTitleRef.current = document.title;
    document.title = 'Solicitar Ayuda — SwapWeb';
    const userData = JSON.parse(localStorage.getItem('usuarioActual'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    return () => {
      // restore previous document title
      document.title = prevTitleRef.current || 'SwapWeb';
    };
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
      showNotification('Máximo 3 archivos permitidos', 'error');
      return;
    }

    for (let i = 0; i < Math.min(files.length, 3 - previewImages.length); i++) {
      const file = files[i];
      
      // Permitir tanto imágenes como documentos
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages(prev => [...prev, { type: 'image', src: reader.result, name: file.name }]);
          setFormData(prev => ({ ...prev, attachments: [...prev.attachments, file] }));
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.type.startsWith('text/') || 
                 file.type.includes('document') || file.type.includes('word')) {
        setPreviewImages(prev => [...prev, { type: 'document', name: file.name }]);
        setFormData(prev => ({ ...prev, attachments: [...prev.attachments, file] }));
      } else {
        showNotification('Formatos permitidos: imágenes, PDF, documentos de texto', 'error');
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddCaracteristica = () => {
    if (!caracteristicaInput.trim()) return;
    if (caracteristicas.length >= 10) {
      setCaracteristicasError("Máximo 10 especificaciones permitidas.");
      return;
    }
    if (caracteristicaInput.length > 50) {
      setCaracteristicasError("Cada especificación debe tener máximo 50 caracteres.");
      return;
    }
    setCaracteristicas([...caracteristicas, caracteristicaInput.trim()]);
    setCaracteristicaInput("");
    setCaracteristicasError("");
  };

  const handleRemoveCaracteristica = idx => {
    setCaracteristicas(caracteristicas.filter((_, i) => i !== idx));
    setCaracteristicasError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category || !formData.needDescription) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('category', formData.category);
      formDataToSend.append('needDescription', formData.needDescription);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('urgency', formData.urgency);
      formDataToSend.append('privacy', formData.privacy);
  formDataToSend.append('title', formData.title);
      
      // Usar _id o id según lo que esté disponible
      const userId = user._id || user.id;
      console.log('🔍 Usuario completo:', user);
      console.log('🔍 ID del usuario a enviar:', userId);
      formDataToSend.append('requester', userId);
      
      // Agregar características específicas si las hay
      if (caracteristicas.length > 0) {
        formDataToSend.append('specificNeeds', JSON.stringify(caracteristicas));
      }

      // Agregar archivos adjuntos
      formData.attachments.forEach((file, index) => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch(`${API_URL}/donation-requests`, {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        console.log('❌ Response not OK, trying to get text...');
        const errorText = await response.text();
        console.log('❌ Error response text:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Server Error ${response.status}: ${errorText.substring(0, 200)}...`);
        }
      }

      const savedRequest = await response.json();
      
      showNotification('¡Solicitud de ayuda publicada exitosamente!', 'success');
      setTimeout(() => {
        setIsModalOpen(false);
        navigate('/donaciones/solicitudes');
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      showNotification('Error al publicar la solicitud', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const Modal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="modal-actions">
            <button onClick={onClose} disabled={isLoading}>Cancelar</button>
            <button onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Publicando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="perfil-usuario-container">
      <Header search={false} />

      <div className="regresar-container-premium">
        <button className="btn-regresar" onClick={() => navigate('/donaciones/solicitudes')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Regresar
        </button>
      </div>

      <div className="publicar-producto-container">
        <div className="donation-form-container">
          <div className="form-header">
            <h2>
              <i className="fas fa-hands-helping"></i>
              Solicitar Ayuda
            </h2>
            <p>Describe lo que necesitas y la comunidad te ayudará a conseguirlo</p>
          </div>
          
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}`}></i>
              {notification.message}
            </div>
          )}

          <form className="donation-form" onSubmit={handleSubmit}>
            {/* Información básica */}
            <div className="form-section">
              <h3 className="section-title">
                <i className="fas fa-info-circle"></i>
                ¿Qué necesitas?
              </h3>
              
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="category" className="form-label">
                    <i className="fas fa-list"></i>
                    Categoría *
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>¿Qué tipo de ayuda necesitas?</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group half-width">
                  <label htmlFor="urgency" className="form-label">
                    <i className="fas fa-clock"></i>
                    Nivel de Urgencia *
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    className="form-select"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                  >
                    {urgencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="title" className="form-label">
                    <i className="fas fa-heading"></i>
                    Título de la solicitud *
                  </label>
                  <input
                    id="title"
                    name="title"
                    className="form-input"
                    placeholder="Ej: Necesito una cama plegable para emergencia"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={120}
                    required
                  />

                  <label htmlFor="needDescription" className="form-label">
                    <i className="fas fa-align-left"></i>
                    Describe tu necesidad *
                  </label>
                  <textarea
                    id="needDescription"
                    name="needDescription"
                    className="form-textarea"
                    rows="5"
                    placeholder="Explica detalladamente qué necesitas, por qué lo necesitas, para qué lo vas a usar, y cualquier contexto importante que ayude a otros a entender tu situación..."
                    value={formData.needDescription}
                    onChange={handleChange}
                    maxLength={1000}
                    required
                  />
                  <div className="input-helper">
                    {formData.needDescription.length}/1000 caracteres
                  </div>
                </div>
              </div>
            </div>

            {/* Especificaciones */}
            <div className="form-section">
              <h3 className="section-title">
                <i className="fas fa-list-ul"></i>
                Especificaciones
                <span className="optional-text">(Opcional)</span>
              </h3>
              
              <div className="form-group">
                <label className="form-label">Detalles Específicos</label>
                <div className="characteristics-container">
                  <div className="characteristics-input-group">
                    <input
                      type="text"
                      className="characteristics-input"
                      placeholder="Ej: Talla específica, Color preferido, Condición mínima..."
                      value={caracteristicaInput}
                      onChange={e => setCaracteristicaInput(e.target.value)}
                      onKeyDown={e => { 
                        if(e.key==='Enter'){ 
                          e.preventDefault(); 
                          handleAddCaracteristica(); 
                        }
                      }}
                      maxLength={50}
                      disabled={caracteristicas.length >= 10}
                    />
                    <button 
                      type="button" 
                      className="add-characteristic-btn"
                      onClick={handleAddCaracteristica}
                      disabled={!caracteristicaInput.trim() || caracteristicas.length >= 10}
                    >
                      <i className="fas fa-plus"></i>
                      Agregar
                    </button>
                  </div>
                  
                  {caracteristicas.length > 0 && (
                    <div className="characteristics-list">
                      {caracteristicas.map((item, idx) => (
                        <div className="characteristic-tag" key={idx}>
                          <span className="characteristic-text">{item}</span>
                          <button
                            type="button"
                            className="remove-characteristic-btn"
                            onClick={() => handleRemoveCaracteristica(idx)}
                            title="Eliminar especificación"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="characteristics-info">
                    <small>
                      <i className="fas fa-info"></i>
                      Máximo 10 especificaciones. Ayuda a otros a entender exactamente qué necesitas.
                    </small>
                  </div>
                  
                  {caracteristicasError && (
                    <div className="error-message">
                      <i className="fas fa-exclamation-triangle"></i>
                      {caracteristicasError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información de contacto y privacidad */}
            <div className="form-section">
              <h3 className="section-title">
                <i className="fas fa-shield-alt"></i>
                Privacidad y Ubicación
              </h3>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="location" className="form-label">
                    <i className="fas fa-map-marker-alt"></i>
                    Ubicación
                    <span className="optional-text">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="form-input"
                    placeholder="Ej: CABA, Palermo"
                    value={formData.location}
                    onChange={handleChange}
                    maxLength={100}
                  />
                  <div className="input-helper">
                    Si prefieres mantener tu ubicación privada, déjalo en blanco
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <div className="privacy-option">
                    <input
                      type="checkbox"
                      className="privacy-checkbox"
                      id="privacy"
                      name="privacy"
                      checked={formData.privacy}
                      onChange={handleChange}
                    />
                    <label className="privacy-label" htmlFor="privacy">
                      <div className="privacy-content">
                        <div className="privacy-title">
                          <i className="fas fa-user-shield"></i>
                          Mantener mi información de contacto privada
                        </div>
                        <div className="privacy-description">
                          Tu información personal solo se compartirá con quienes realmente quieran ayudarte
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidencia y documentos */}
            <div className="form-section">
              <h3 className="section-title">
                <i className="fas fa-paperclip"></i>
                Evidencia o Documentos
                <span className="optional-text">(Opcional)</span>
              </h3>
              
              <div className="photo-upload-container">
                <div
                  className={`photo-drop-zone ${isDragging ? 'dragging' : ''} ${previewImages.length > 0 ? 'has-images' : ''}`}
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
                  {previewImages.length === 0 ? (
                    <div className="upload-placeholder">
                      <div className="upload-icon">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <h4>Sube evidencia de tu necesidad</h4>
                      <p>Arrastra y suelta hasta 3 archivos o haz clic para seleccionar</p>
                      <div className="upload-specs">
                        <span><i className="fas fa-check"></i> Imágenes: JPG, PNG, GIF</span>
                        <span><i className="fas fa-check"></i> Documentos: PDF, DOC, TXT</span>
                        <span><i className="fas fa-check"></i> Hasta 3 archivos</span>
                      </div>
                    </div>
                  ) : (
                    <div className="files-preview-grid">
                      {previewImages.map((item, idx) => (
                        <div className="file-preview-item" key={idx}>
                          {item.type === 'image' ? (
                            <img src={item.src} alt={`Archivo ${idx + 1}`} className="preview-image" />
                          ) : (
                            <div className="document-preview">
                              <i className="fas fa-file-alt"></i>
                              <span className="document-name">{item.name}</span>
                            </div>
                          )}
                          <div className="file-overlay">
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewImages(prev => prev.filter((_, i) => i !== idx));
                                setFormData(prev => ({ 
                                  ...prev, 
                                  attachments: prev.attachments.filter((_, i) => i !== idx) 
                                }));
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {previewImages.length < 3 && (
                        <div className="add-more-files">
                          <i className="fas fa-plus"></i>
                          <span>Agregar más</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    multiple
                    onChange={e => handleFileSelect(e.target.files)}
                    disabled={previewImages.length >= 3}
                  />
                </div>
                
                <div className="photo-tips">
                  <h4><i className="fas fa-lightbulb"></i> Tipos de evidencia útil:</h4>
                  <ul>
                    <li>Prescripciones médicas (tacha datos sensibles)</li>
                    <li>Fotos del problema o necesidad</li>
                    <li>Certificados o documentos oficiales</li>
                    <li>Cualquier documento que respalde tu solicitud</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/donaciones/solicitudes')}
              >
                <i className="fas fa-times"></i>
                Cancelar
              </button>
              
              <button type="submit" className="btn-primary">
                <i className="fas fa-hands-helping"></i>
                Publicar Solicitud
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
        message="¿Estás seguro de que deseas publicar esta solicitud de ayuda?"
        isLoading={isLoading}
      />

      <Footer />
    </div>
  );
};

export default RequestCreateNew;
