import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EditarProducto.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_URL } from "../config";

const EditarSolicitud = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState({
  category: "",
  title: "",
    needDescription: "",
    specificNeeds: [],
    location: "",
    urgency: "med",
    status: "open",
    attachments: [],
    privacy: false
  });

  const [specificNeedInput, setSpecificNeedInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [previewAttachments, setPreviewAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const categorias = [
    "Electrodomésticos", "Muebles", "Ropa", "Libros", "Deportes",
    "Juguetes", "Tecnología", "Hogar", "Jardinería", "Mascotas", 
    "Alimentación", "Medicamentos", "Transporte", "Educación", "Otros"
  ];

  const urgencias = [
    { value: "low", label: "Baja" },
    { value: "med", label: "Media" },
    { value: "high", label: "Urgente" }
  ];

  useEffect(() => {
    const fetchSolicitud = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/donation-requests/${id}`);
        if (!response.ok) {
          throw new Error("Solicitud no encontrada");
        }
        
        const data = await response.json();
        setSolicitud({ 
          ...data, 
          specificNeeds: Array.isArray(data.specificNeeds) ? data.specificNeeds : [],
          attachments: Array.isArray(data.attachments) ? data.attachments : []
        });
        setPreviewAttachments(Array.isArray(data.attachments) ? data.attachments : []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar la solicitud:", error);
        alert("Error al cargar la solicitud. Por favor, intenta nuevamente.");
        navigate('/perfil');
      }
    };

    fetchSolicitud();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSolicitud({
      ...solicitud,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleAddSpecificNeed = () => {
    if (!specificNeedInput.trim()) return;
    if (solicitud.specificNeeds.length >= 10) {
      showNotification("Máximo 10 necesidades específicas.", "error");
      return;
    }
    setSolicitud(prev => ({
      ...prev,
      specificNeeds: [...prev.specificNeeds, specificNeedInput.trim()]
    }));
    setSpecificNeedInput("");
  };

  const handleRemoveSpecificNeed = (idx) => {
    setSolicitud(prev => ({
      ...prev,
      specificNeeds: prev.specificNeeds.filter((_, i) => i !== idx)
    }));
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
    if (files.length + previewAttachments.length > 3) {
      showNotification('Solo puedes subir hasta 3 archivos adjuntos.', 'error');
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
          setPreviewAttachments(prev => [...prev, reader.result]);
          setSolicitud(prev => ({ ...prev, attachments: [...prev.attachments, compressedImage] }));
        };
        reader.readAsDataURL(compressedImage);
      } catch (error) {
        showNotification(error.message || 'Error al procesar el archivo', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = idx => {
    setPreviewAttachments(prev => prev.filter((_, i) => i !== idx));
    setSolicitud(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }));
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
    
    if (!solicitud.category || !solicitud.needDescription.trim()) {
      showNotification('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    try {
      // Convertir archivos nuevos a base64, mantener URLs existentes
      const attachmentsBase64OrUrl = await Promise.all(solicitud.attachments.map(attachment => {
        if (typeof attachment === 'string' && (attachment.startsWith('http') || attachment.startsWith('/'))) {
          return attachment;
        }
        // Si es un File/Blob, convertir a base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(attachment);
        });
      }));

      const bodyObj = { ...solicitud, attachments: attachmentsBase64OrUrl };
      
      const response = await fetch(`${API_URL}/donation-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar solicitud");
      }

      showNotification("Solicitud actualizada correctamente", "success");
      setTimeout(() => navigate('/perfil'), 1500);
    } catch (error) {
      console.error("Error al actualizar la solicitud:", error);
      showNotification("Error al actualizar la solicitud. Por favor, intenta nuevamente.", "error");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    try {
      const response = await fetch(`${API_URL}/donation-requests/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Error eliminando la solicitud');
      showNotification('Solicitud eliminada correctamente', 'success');
      setTimeout(() => navigate('/perfil'), 1200);
    } catch (err) {
      console.error(err);
      showNotification('Error al eliminar la solicitud', 'error');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="loading-container">
          <div className="loading-spinner">Cargando solicitud...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="editar-producto-container">
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
  <h2>Editar Solicitud de Ayuda</h2>
        <form onSubmit={handleSubmit} className="editar-producto-form">
          
          {/* Categoría */}
          {/* ...botones de acción movidos al final del formulario... */}
          <div className="form-group">
            <label htmlFor="title">Título de la solicitud *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={solicitud.title || ''}
              onChange={handleChange}
              maxLength={120}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría de ayuda necesaria *</label>
            <select
              id="category"
              name="category"
              value={solicitud.category}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción de la necesidad */}
          <div className="form-group">
            <label htmlFor="needDescription">Descripción de tu necesidad *</label>
            <textarea
              id="needDescription"
              name="needDescription"
              value={solicitud.needDescription}
              onChange={handleChange}
              required
              maxLength="500"
              placeholder="Describe detalladamente qué tipo de ayuda necesitas..."
              rows="4"
            />
          </div>

          {/* Necesidades específicas */}
          <div className="form-group">
            <label>Necesidades específicas (opcional)</label>
            <div className="specific-needs-input">
              <input
                type="text"
                value={specificNeedInput}
                onChange={(e) => setSpecificNeedInput(e.target.value)}
                placeholder="Agrega una necesidad específica"
                maxLength="100"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecificNeed();
                  }
                }}
              />
              <button type="button" onClick={handleAddSpecificNeed} className="btn-add-need">
                Agregar
              </button>
            </div>
            
            {solicitud.specificNeeds.length > 0 && (
              <div className="specific-needs-list">
                {solicitud.specificNeeds.map((need, idx) => (
                  <div key={idx} className="specific-need-item">
                    <span>{need}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecificNeed(idx)}
                      className="remove-need-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="form-group">
            <label htmlFor="location">Ubicación</label>
            <input
              type="text"
              id="location"
              name="location"
              value={solicitud.location}
              onChange={handleChange}
              placeholder="Ciudad, barrio o zona donde necesitas la ayuda"
            />
          </div>

          {/* Urgencia */}
          <div className="form-group">
            <label htmlFor="urgency">Nivel de urgencia</label>
            <select
              id="urgency"
              name="urgency"
              value={solicitud.urgency}
              onChange={handleChange}
            >
              {urgencias.map((urgencia) => (
                <option key={urgencia.value} value={urgencia.value}>
                  {urgencia.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de la solicitud */}
          <div className="form-group">
            <label htmlFor="status">Estado de la solicitud</label>
            <select
              id="status"
              name="status"
              value={solicitud.status}
              onChange={handleChange}
            >
              <option value="open">Abierta</option>
              <option value="assigned">Asignada</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>

          {/* Privacidad */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="privacy"
                checked={solicitud.privacy}
                onChange={handleChange}
              />
              Mantener solicitud privada (solo visible para administradores)
            </label>
          </div>

          {/* Archivos adjuntos */}
          <div className="form-group">
            <label>Archivos adjuntos (máximo 3)</label>
            <div
              className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                style={{ display: 'none' }}
              />
            </div>
            
            {previewAttachments.length > 0 && (
              <div className="image-preview-grid">
                {previewAttachments.map((attachment, idx) => (
                  <div key={idx} className="image-preview-item">
                    <img 
                      src={typeof attachment === 'string' && attachment.startsWith('http') ? attachment : 
                           typeof attachment === 'string' && attachment.startsWith('/') ? `${API_URL}${attachment}` : attachment} 
                      alt={`Adjunto ${idx}`} 
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveAttachment(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/perfil')} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-actualizar">
              Actualizar Solicitud
            </button>
            <button type="button" className="btn-danger" onClick={handleDelete}>
              Eliminar publicación
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default EditarSolicitud;
