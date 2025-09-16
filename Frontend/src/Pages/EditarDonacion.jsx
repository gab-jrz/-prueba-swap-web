import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EditarProducto.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { categorias } from "../categorias";

// Usar API_URL global y derivar base para archivos (sin '/api')
import { API_URL } from "../config";
const FILE_BASE_URL = (API_URL || '').replace(/\/api$/, '');

const EditarDonacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [donacion, setDonacion] = useState({
    title: "",
    description: "",
    category: "",
    images: [],
    condition: "",
    location: "",
    pickupMethod: "",
    status: "available",
    characteristics: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuContainerRef = useRef(null);
  const [caractInput, setCaractInput] = useState("");
  const [caracteristicasError, setCaracteristicasError] = useState("");
  const totalCaracteres = donacion.characteristics ? donacion.characteristics.reduce((acc, c) => acc + c.length, 0) : 0;
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Usar las mismas keys/valores que el formulario de creación para mantener consistencia
  const conditionOptions = [
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'como_nuevo', label: 'Como nuevo' },
    { value: 'muy_bueno', label: 'Muy bueno' },
    { value: 'bueno', label: 'Bueno' },
    { value: 'regular', label: 'Regular' }
  ];

  const metodosRecogida = [
    { value: 'domicilio', label: 'Recogida en domicilio' },
    { value: 'punto_encuentro', label: 'Punto de encuentro' },
    { value: 'envio', label: 'Envío' },
    { value: 'a_convenir', label: 'A convenir' }
  ];

  useEffect(() => {
    const fetchDonacion = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/donations/${id}`);
        if (!response.ok) {
          throw new Error("Donación no encontrada");
        }

        const data = await response.json();
        // Normalizar valores de condition y pickupMethod para compatibilidad con selects
        const conditionMap = {
          'Nuevo': 'nuevo',
          'Como nuevo': 'como_nuevo',
          'Usado - Buen estado': 'bueno',
          'Usado - Estado regular': 'regular',
          'Muy bueno': 'muy_bueno'
        };

        const pickupMap = {
          'Recogida en domicilio': 'domicilio',
          'Punto de encuentro': 'punto_encuentro',
          'Envío': 'envio',
          'A convenir': 'a_convenir',
          'Flexible (a coordinar)': 'a_convenir'
        };

        const normalized = { ...data };
        if (normalized.condition && conditionMap[normalized.condition]) {
          normalized.condition = conditionMap[normalized.condition];
        }
        if (normalized.pickupMethod && pickupMap[normalized.pickupMethod]) {
          normalized.pickupMethod = pickupMap[normalized.pickupMethod];
        }
        // Asegurar características como array
        if (!Array.isArray(normalized.characteristics)) {
          normalized.characteristics = Array.isArray(data.characteristics) ? data.characteristics : [];
        }

        setDonacion({ 
          ...normalized, 
          images: Array.isArray(data.images) ? data.images : data.image ? [data.image] : [] 
        });
        setPreviewImages(Array.isArray(data.images) ? data.images : data.image ? [data.image] : []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar la donación:", error);
        alert("Error al cargar la donación. Por favor, intenta nuevamente.");
        navigate('/perfil');
      }
    };

    fetchDonacion();
  }, [id, navigate]);

  // Cerrar menú de 3 puntos al hacer click afuera, scroll o Esc
  useEffect(() => {
    if (!menuOpen) return;
    const handleGlobalClick = (e) => {
      if (!menuContainerRef.current || !menuContainerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const addCaracteristica = () => {
    if (!caractInput.trim()) return;
    if (donacion.characteristics && donacion.characteristics.length >= 15) {
      setCaracteristicasError("Máximo 15 ítems.");
      return;
    }
    if (totalCaracteres + caractInput.length > 1000) {
      setCaracteristicasError("Máximo 1000 caracteres en total.");
      return;
    }
    setDonacion(prev => ({ 
      ...prev, 
      characteristics: [...(prev.characteristics || []), caractInput.trim()] 
    }));
    setCaractInput("");
    setCaracteristicasError("");
  };

  const handleEditCaracteristica = (idx, value) => {
    if (value.length > 1000) return;
    const nuevas = [...donacion.characteristics];
    nuevas[idx] = value;
    setDonacion(prev => ({
      ...prev,
      characteristics: nuevas
    }));
  };

  const removeCaracteristica = (idx) => {
    setDonacion(prev => ({
      ...prev,
      characteristics: (prev.characteristics || []).filter((_, i) => i !== idx)
    }));
    setCaracteristicasError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonacion({
      ...donacion,
      [name]: value,
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (fileList) => {
    const files = Array.from(fileList);
    if (files.length + previewImages.length > 3) {
      showNotification('Solo puedes subir hasta 3 imágenes.', 'error');
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona solo archivos de imagen.', 'error');
        continue;
      }
      try {
        const compressedImage = await compressImage(file);
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages(prev => [...prev, reader.result]);
          setDonacion(prev => ({ ...prev, images: [...prev.images, compressedImage] }));
        };
        reader.readAsDataURL(compressedImage);
      } catch (error) {
        showNotification(error.message || 'Error al procesar la imagen', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = idx => {
    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
    setDonacion(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!donacion.title.trim() || !donacion.category) {
      showNotification('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    try {
      // Normalizar donor a ObjectId (el GET viene populado con objeto)
      const donorId = donacion?.donor && typeof donacion.donor === 'object'
        ? (donacion.donor._id || donacion.donor.id)
        : donacion.donor;

      // Construir FormData para evitar payloads JSON enormes por imágenes
      const formData = new FormData();
      formData.append('title', donacion.title);
      if (donacion.description != null) formData.append('description', donacion.description);
      formData.append('category', donacion.category);
      if (donacion.condition) formData.append('condition', donacion.condition);
      if (donacion.location) formData.append('location', donacion.location);
      if (donacion.pickupMethod) formData.append('pickupMethod', donacion.pickupMethod);
      if (donacion.status) formData.append('status', donacion.status);
      if (Array.isArray(donacion.characteristics)) {
        formData.append('characteristics', JSON.stringify(donacion.characteristics));
      }
      if (donorId) formData.append('donor', donorId);

      // Separar imágenes existentes (cualquier string: URL absoluta, ruta o filename) y nuevas (Blob/File)
      const existing = [];
      for (const img of donacion.images) {
        if (typeof img === 'string') {
          existing.push(img);
        } else {
          // img es un Blob (de compressImage)
          const fileLike = img instanceof Blob ? img : null;
          if (fileLike) {
            const filename = `image_${Date.now()}_${Math.floor(Math.random()*1e6)}.jpg`;
            formData.append('images', fileLike, filename);
          }
        }
      }
      // Enviar existentes como campo repetido existingImages
      existing.forEach((url) => formData.append('existingImages', url));

      const response = await fetch(`${API_URL}/donations/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al actualizar donación");
      }

      showNotification("Donación actualizada correctamente", "success");
      // Notificar a otras vistas y volver al perfil en la pestaña de Donaciones
      try {
        window.dispatchEvent(new CustomEvent('donationsUpdated', { detail: { action: 'updated', id } }));
      } catch {}
      setTimeout(() => navigate('/perfil', { state: { activeTab: 'donaciones' } }), 1200);
    } catch (error) {
      console.error("Error al actualizar la donación:", error);
      showNotification("Error al actualizar la donación. Por favor, intenta nuevamente.", "error");
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/donations/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error eliminando la donación');
      showNotification('Donación eliminada correctamente', 'success');
      // Notificar a otras vistas y volver al perfil en la pestaña de Donaciones
      try {
        window.dispatchEvent(new CustomEvent('donationsUpdated', { detail: { action: 'deleted', id } }));
      } catch {}
      setShowDeleteModal(false);
      setTimeout(() => navigate('/perfil', { state: { activeTab: 'donaciones' } }), 800);
    } catch (err) {
      console.error(err);
      showNotification('Error al eliminar la donación', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="editar-producto-container">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">Cargando donación...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="editar-producto-container">
      <Header />
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="editar-producto-content">
        <div className="editar-producto-card" style={{position:'relative'}}>
          {/* Botón flotante de tres puntos en esquina superior derecha */}
          <div style={{position:'absolute', top:'12px', right:'12px'}} ref={menuContainerRef}>
            <div style={{position:'relative'}}>
              <button
                type="button"
                aria-label="Más opciones"
                onClick={() => setMenuOpen(v => !v)}
                className="btn-tres-puntos"
                style={{
                  width:'40px',
                  height:'40px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  background:'#ffffff',
                  border:'1px solid #e5e7eb',
                  borderRadius:'12px',
                  boxShadow:'0 8px 20px rgba(0,0,0,0.06)',
                  fontSize:'18px',
                  color:'#374151',
                  lineHeight:1,
                  cursor:'pointer'
                }}
              >
                ···
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  style={{
                    position:'absolute',
                    top:'48px',
                    right:0,
                    background:'#fff',
                    border:'1px solid #e5e7eb',
                    borderRadius:'10px',
                    boxShadow:'0 10px 30px rgba(0,0,0,0.08)',
                    minWidth:'180px',
                    zIndex:10
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); handleDelete(); }}
                    style={{
                      width:'100%',
                      textAlign:'left',
                      padding:'10px 14px',
                      background:'transparent',
                      border:'none',
                      cursor:'pointer',
                      color:'#ef4444',
                      fontWeight:600
                    }}
                  >
                    Eliminar donación
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Título principal */}
          <h2 className="editar-producto-title" style={{marginTop:'16px'}}>Editar Donación</h2>

          {/* Vista previa de imágenes al estilo producto */}
          <div className="producto-preview-multi">
            {previewImages.length > 0 ? (
              <div className="preview-multi-container">
                {previewImages.map((img, idx) => (
                  <div className="preview-container" key={idx}>
                    <img
                      src={
                        typeof img === 'string'
                          ? (img.startsWith('http')
                              ? img
                              : (img.startsWith('/')
                                  ? `${FILE_BASE_URL}${img}`
                                  : `${FILE_BASE_URL}/uploads/products/${img}`))
                          : img
                      }
                      alt={`Vista previa ${idx + 1}`}
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="remove-image"
                      title="Eliminar imagen"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="imagen-placeholder">
                <span>Sin imagen</span>
              </div>
            )}
          </div>

          {/* Área de subida con mismas clases que producto */}
          <div className="form-group">
            <label>Imágenes de la Donación</label>
            <div
              className={`upload-area ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                handleFileSelect(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={previewImages.length >= 3}
              />
              <div className="upload-placeholder">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Arrastra y suelta hasta 3 imágenes aquí o haz clic para seleccionar</p>
                <span>Formatos aceptados: JPG, PNG, GIF</span>
              </div>
            </div>
            <div className="multi-image-warning">Puedes subir hasta 3 imágenes.</div>
          </div>

          {/* Formulario con mismas clases y estructura que producto */}
          <form onSubmit={handleSubmit} className="form-editar-producto">
            {/* Título */}
            <div className="form-group">
              <label htmlFor="title">Título de la donación *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={donacion.title}
                onChange={handleChange}
                required
                maxLength="100"
                placeholder="Ej: Sofá en buen estado"
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={donacion.description}
                onChange={handleChange}
                maxLength="500"
                placeholder="Describe tu donación con más detalle..."
                rows="4"
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
                    value={caractInput}
                    onChange={e => setCaractInput(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); addCaracteristica(); }}}
                    disabled={donacion.characteristics && donacion.characteristics.length >= 15}
                    className="caracteristica-input"
                  />
                  <button 
                    type="button" 
                    className="btn-add-caracteristica" 
                    onClick={addCaracteristica} 
                    disabled={!caractInput.trim() || (donacion.characteristics && donacion.characteristics.length >= 15) || (totalCaracteres + caractInput.length > 1000)}
                  >
                    +
                  </button>
                </div>
                <div className="caracteristicas-list">
                  {donacion.characteristics && donacion.characteristics.map((item, idx) => (
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
                        onClick={() => removeCaracteristica(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="caracteristicas-limits">
                  <span>{donacion.characteristics ? donacion.characteristics.length : 0}/15 ítems</span> | <span>{totalCaracteres}/1000 caracteres</span>
                </div>
                {caracteristicasError && <div className="caracteristicas-error">{caracteristicasError}</div>}
              </div>
            </div>

            {/* Categoría */}
            <div className="form-group">
              <label htmlFor="category">Categoría *</label>
              <select
                id="category"
                name="category"
                value={donacion.category}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Condición */}
            <div className="form-group">
              <label htmlFor="condition">Estado del artículo</label>
              <select
                id="condition"
                name="condition"
                value={donacion.condition}
                onChange={handleChange}
              >
                <option value="">Selecciona el estado</option>
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ubicación */}
            <div className="form-group">
              <label htmlFor="location">Ubicación</label>
              <input
                type="text"
                id="location"
                name="location"
                value={donacion.location}
                onChange={handleChange}
                placeholder="Ciudad, barrio o zona"
              />
            </div>

            {/* Método de recogida */}
            <div className="form-group">
              <label htmlFor="pickupMethod">Método de entrega</label>
              <select
                id="pickupMethod"
                name="pickupMethod"
                value={donacion.pickupMethod}
                onChange={handleChange}
              >
                <option value="">Selecciona método de entrega</option>
                {metodosRecogida.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de la donación */}
            <div className="form-group">
              <label htmlFor="status">Estado de la donación</label>
              <select
                id="status"
                name="status"
                value={donacion.status}
                onChange={handleChange}
              >
                <option value="available">Disponible</option>
                <option value="reserved">Reservada</option>
                <option value="delivered">Entregada</option>
                <option value="removed">Retirada</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-guardar">Guardar Cambios</button>
              <button type="button" className="btn-cancelar" onClick={() => navigate('/perfil')}>Cancelar</button>
            </div>
          </form>
        </div>
      </div>
      {/* Modal de confirmación: eliminar donación */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar donación</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar esta donación? Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <button 
                className="btn-modal-reportar"
                style={{ 
                  background: '#ef4444', 
                  borderColor: '#ef4444', 
                  width: 'auto', 
                  minWidth: '180px',
                  minHeight: '48px',
                  padding: '12px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600
                }}
                onClick={confirmDelete}
              >
                Eliminar definitivamente
              </button>
              <button 
                className="btn-modal-cancelar"
                style={{ 
                  width: 'auto', 
                  minWidth: '180px',
                  minHeight: '48px',
                  padding: '12px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600
                }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

// Modal overlay y contenido reutilizando el patrón de DonationDetail.jsx
// Insertar el modal antes del cierre del componente exportado

export default EditarDonacion;
