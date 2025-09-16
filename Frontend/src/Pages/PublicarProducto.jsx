import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { categorias } from "../categorias";
import Footer from '../components/Footer';
import "../styles/PublicarProducto.css";
import { initDarkModeDetector } from '../utils/darkModeDetector';
import ThanksModal from '../components/ThanksModal';
import { API_URL } from '../config';
const MAX_IMAGES = 3;

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    // Check file size first (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Compresión más agresiva para evitar error 413
        let MAX_WIDTH = 600;  // Reducido de 800
        let MAX_HEIGHT = 600; // Reducido de 800
        let quality = 0.5;    // Reducido de 0.7

        // Para archivos grandes, compresión extrema
        if (file.size > 1 * 1024 * 1024) { // 1MB+
          MAX_WIDTH = 500;
          MAX_HEIGHT = 500;
          quality = 0.4;
        }

        // Para archivos muy grandes, compresión máxima
        if (file.size > 2 * 1024 * 1024) { // 2MB+
          MAX_WIDTH = 400;
          MAX_HEIGHT = 400;
          quality = 0.3;
        }

        // Para archivos enormes, compresión extrema
        if (file.size > 3 * 1024 * 1024) { // 3MB+
          MAX_WIDTH = 300;
          MAX_HEIGHT = 300;
          quality = 0.25;
        }

        // Calcular nuevas dimensiones manteniendo aspecto
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Mejorar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Función para comprimir iterativamente hasta alcanzar tamaño objetivo
        const compressIteratively = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result;
                const sizeInKB = Math.round((base64.length * 0.75) / 1024); // Aproximación del tamaño
                
                // Si es menor a 200KB o la calidad ya es muy baja, usar este resultado
                if (sizeInKB < 200 || currentQuality <= 0.1) {
                  resolve(blob);
                } else if (currentQuality > 0.1) {
                  // Reducir calidad y volver a intentar
                  compressIteratively(currentQuality - 0.05);
                } else {
                  resolve(blob);
                }
              };
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            currentQuality
          );
        };

        // Iniciar compresión iterativa
        compressIteratively(quality);
      };
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
  });
};

const Modal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button 
            className="btn-confirmar" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Publicando...' : 'Confirmar'}
          </button>
          <button 
            className="btn-cancelar-modal" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const PublicarProducto = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoria: '',
    images: [], // Ahora es un array de imágenes
  });

  const [caracteristicas, setCaracteristicas] = useState([]);
  const [caracteristicaInput, setCaracteristicaInput] = useState("");
  const [caracteristicasError, setCaracteristicasError] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isThanksOpen, setIsThanksOpen] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('usuarioActual')) || {};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (previewImages.length >= MAX_IMAGES) {
      showNotification(`Máximo ${MAX_IMAGES} imágenes. Elimina alguna para agregar otras.`, 'error');
      return;
    }
    // Preferimos manejar el drop directamente con el onDrop del contenedor (que pasa FileList)
  };

  const handleFileSelect = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - previewImages.length;
    if (remaining <= 0) {
      showNotification(`Máximo ${MAX_IMAGES} imágenes. Elimina alguna para agregar otras.`, 'error');
      return;
    }

    const filesToProcess = files.slice(0, remaining);
    const ignored = files.length - filesToProcess.length;
    if (ignored > 0) {
      showNotification(`Se agregaron ${filesToProcess.length} imagen(es). ${ignored} excede(n) el máximo de ${MAX_IMAGES} y fueron ignoradas.`, 'error');
    }

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona solo archivos de imagen.', 'error');
        continue;
      }
      try {
        // Mostrar mensaje de compresión
        showNotification('Comprimiendo imagen...', 'info');
        // Esperar el blob comprimido
        const blob = await compressImage(file);
        // Crear el archivo comprimido con el nombre y extensión original
        const compressedImage = new File([blob], file.name, { type: blob.type });
        const originalSizeKB = Math.round(file.size / 1024);
        const compressedSizeKB = Math.round(compressedImage.size / 1024);
        const compressionRatio = Math.round(((file.size - compressedImage.size) / file.size) * 100);
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages(prev => [...prev, reader.result]);
          setFormData(prev => ({ ...prev, images: [...prev.images, compressedImage] }));
          // Mostrar información de compresión
          showNotification(
            `Imagen comprimida: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% reducción)`,
            'success'
          );
        };
        reader.readAsDataURL(compressedImage);
      } catch (error) {
        console.error('Error al comprimir la imagen:', error);
        showNotification(error.message || 'Error al procesar la imagen', 'error');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Características: validación
  const totalCaracteres = caracteristicas.reduce((acc, c) => acc + c.length, 0);

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.categoria) {
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    if (formData.images.length === 0) {
      showNotification('Por favor selecciona al menos una imagen para tu producto', 'error');
      return;
    }
    if (formData.images.length > MAX_IMAGES) {
      showNotification(`Solo puedes subir hasta ${MAX_IMAGES} imágenes.`, 'error');
      return;
    }
    if (caracteristicas.length > 15) {
      setCaracteristicasError("Máximo 15 ítems.");
      return;
    }
    if (totalCaracteres > 1000) {
      setCaracteristicasError("Máximo 1000 caracteres en total.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    setIsLoading(true);
    console.log('Iniciando publicación del producto...');

    try {
      // Crear FormData para enviar datos y archivos
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('categoria', formData.categoria);
      formDataToSend.append('ownerId', user._id);
      formDataToSend.append('date', new Date().toISOString());
      formDataToSend.append('status', 'available');
      if (caracteristicas.length > 0) {
        formDataToSend.append('caracteristicas', JSON.stringify(caracteristicas));
      }
      // Adjuntar imágenes (máx 3)
      formData.images.forEach((imgFile) => {
        formDataToSend.append('images', imgFile);
      });
      console.log('Enviando datos al servidor (FormData):', formDataToSend);

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        body: formDataToSend
      });

      console.log('Respuesta del servidor:', response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const savedProduct = await response.json();
      console.log('Producto guardado exitosamente:', savedProduct);

      // Cerrar modal de confirmación y abrir modal de agradecimiento (auto-dismiss 3s)
      setIsModalOpen(false);
      setIsThanksOpen(true);
    } catch (err) {
      console.error("Error detallado:", err);
      let errorMessage = 'Error al publicar el producto';
      
      if (err.message === 'Failed to fetch') {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el servidor esté funcionando.';
      } else if (err.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Hacer scroll al formulario si la URL tiene #form
  useEffect(() => {
    const doScroll = () => {
      if (location.hash === '#form') {
        const el = document.getElementById('form');
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    // Ejecutar al montar y ligeramente después para asegurar render
    doScroll();
    const t = setTimeout(doScroll, 50);
    return () => clearTimeout(t);
  }, [location.hash]);

  return (
    <div className="perfil-usuario-container">
      <Header search={false} />

      <div className="publicar-header">
        <BackButton className="icon-back-btn" to={-1} aria-label="Volver" />
      </div>

      <div className="publicar-producto-container">
        <div className="publicar-form-card">
          <h2>Publicar Nuevo Producto</h2>
          
          {notification.show && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}

          <form id="form" className="publicar-producto-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Título del Producto</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Ej: Celular Samsung Galaxy Flip 6"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Describe tu producto en detalle..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Características del Producto - Checklist dinámica */}
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
                  disabled={caracteristicas.length>=15 || totalCaracteres>=1000}
                />
                <button type="button" className="btn-add-caracteristica" onClick={handleAddCaracteristica} disabled={!caracteristicaInput.trim() || caracteristicas.length>=15 || totalCaracteres+caracteristicaInput.length>1000}>
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
                    <button type="button" className="btn-remove-caracteristica" title="Eliminar" onClick={()=>handleRemoveCaracteristica(idx)}>×</button>
                  </div>
                ))}
              </div>
              <div className="caracteristicas-limits">
                <span>{caracteristicas.length}/15 ítems</span> | <span>{totalCaracteres}/1000 caracteres</span>
              </div>
              {caracteristicasError && <div className="caracteristicas-error">{caracteristicasError}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
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

          <div className="form-group">
            <label>Imágenes del Producto</label>
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

          <button type="submit" className="btn-publicar">
            Publicar Producto
          </button>
        </form>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPublish}
        title="Confirmar Publicación"
        message="¿Estás seguro de que deseas publicar este producto?"
        isLoading={isLoading}
      />

      <ThanksModal
        isOpen={isThanksOpen}
        onClose={() => {
          setIsThanksOpen(false);
          navigate('/perfil');
        }}
        title="¡Gracias por publicar!"
        message="Tu producto ya está visible para la comunidad."
      />

      <Footer />
    </div>
  );
};

export default PublicarProducto;

