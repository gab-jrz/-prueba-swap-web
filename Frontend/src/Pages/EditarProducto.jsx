import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EditarProducto.css";
import Header from "../components/Header";
import BackButton from "../components/BackButton.jsx";
import { categorias } from "../categorias";
import Footer from "../components/Footer";
import { getProductImageUrl } from "../utils/getProductImageUrl";
import { emitProductUpdated, emitProductDeleted } from "../utils/productEvents";
import { API_URL } from "../config";

// Utilidad: compresión de imágenes (igual que en PublicarProducto.jsx)
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
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

        // Parámetros base
        let MAX_WIDTH = 600;
        let MAX_HEIGHT = 600;
        let quality = 0.5;

        if (file.size > 1 * 1024 * 1024) { // 1MB+
          MAX_WIDTH = 500; MAX_HEIGHT = 500; quality = 0.4;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB+
          MAX_WIDTH = 400; MAX_HEIGHT = 400; quality = 0.3;
        }
        if (file.size > 3 * 1024 * 1024) { // 3MB+
          MAX_WIDTH = 300; MAX_HEIGHT = 300; quality = 0.25;
        }

        // Mantener aspecto
        if (width > height) {
          if (width > MAX_WIDTH) { height = Math.round(height * (MAX_WIDTH / width)); width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width = Math.round(width * (MAX_HEIGHT / height)); height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressIteratively = (currentQuality) => {
          canvas.toBlob(
            (blob) => {
              const r2 = new FileReader();
              r2.onload = () => {
                const base64 = r2.result;
                const sizeInKB = Math.round((base64.length * 0.75) / 1024);
                if (sizeInKB < 200 || currentQuality <= 0.1) {
                  resolve(blob);
                } else if (currentQuality > 0.1) {
                  compressIteratively(currentQuality - 0.05);
                } else {
                  resolve(blob);
                }
              };
              r2.readAsDataURL(blob);
            },
            'image/jpeg',
            currentQuality
          );
        };

        compressIteratively(quality);
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
};

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState({
    id: "",
    title: "",
    description: "",
    categoria: "",
    images: [], // ahora array
    ownerId: "",
    caracteristicas: [],
  });

  const [caracteristicaInput, setCaracteristicaInput] = useState("");
  const [caracteristicasError, setCaracteristicasError] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [previewImages, setPreviewImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);

  useEffect(() => {
    const fetchProducto = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) {
          throw new Error("Producto no encontrado");
        }
        
        const data = await response.json();
        setProducto({ ...data, images: Array.isArray(data.images) ? data.images : data.image ? [data.image] : [] });
        setPreviewImages(Array.isArray(data.images) ? data.images : data.image ? [data.image] : []);
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar el producto:", error);
        alert("Error al cargar el producto. Por favor, intenta nuevamente.");
        // Redirigir al perfil privado del usuario
        navigate('/perfil');
      }
    };

    fetchProducto();
  }, [id, navigate]);

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto({
      ...producto,
      [name]: value,
    });
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
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
        // Reutilizar lógica de compresión de PublicarProducto.jsx
        const compressedImage = await compressImage(file);
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImages(prev => [...prev, reader.result]);
          setProducto(prev => ({ ...prev, images: [...prev.images, compressedImage] }));
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
    setProducto(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
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


  // Características: validación
  const totalCaracteres = (producto.caracteristicas || []).reduce((acc, c) => acc + c.length, 0);

  const handleAddCaracteristica = () => {
    if (!caracteristicaInput.trim()) return;
    if ((producto.caracteristicas || []).length >= 15) {
      setCaracteristicasError("Máximo 15 ítems.");
      return;
    }
    if (totalCaracteres + caracteristicaInput.length > 1000) {
      setCaracteristicasError("Máximo 1000 caracteres en total.");
      return;
    }
    setProducto(prev => ({
      ...prev,
      caracteristicas: [...(prev.caracteristicas || []), caracteristicaInput.trim()]
    }));
    setCaracteristicaInput("");
    setCaracteristicasError("");
  };

  const handleEditCaracteristica = (idx, value) => {
    if (value.length > 1000) return;
    const nuevas = [...(producto.caracteristicas || [])];
    nuevas[idx] = value;
    setProducto(prev => ({ ...prev, caracteristicas: nuevas }));
  };

  const handleRemoveCaracteristica = idx => {
    setProducto(prev => ({
      ...prev,
      caracteristicas: (prev.caracteristicas || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convertir archivos nuevos a base64, mantener URLs existentes
    const imagesBase64OrUrl = await Promise.all(producto.images.map(img => {
      if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
        return img;
      }
      // Si es un File/Blob, convertir a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(img);
      });
    }));
    if ((producto.caracteristicas || []).length > 15) {
      setCaracteristicasError("Máximo 15 ítems.");
      return;
    }
    if (totalCaracteres > 1000) {
      setCaracteristicasError("Máximo 1000 caracteres en total.");
      return;
    }
    try {
      const bodyObj = { ...producto, images: imagesBase64OrUrl };
      if (!bodyObj.caracteristicas || bodyObj.caracteristicas.length === 0) {
        delete bodyObj.caracteristicas;
      }
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObj),
      });
      if (!response.ok) {
        throw new Error("Error al actualizar producto");
      }
      const updatedProduct = await response.json();
      
      // Emitir evento para sincronizar cambios en toda la aplicación
      emitProductUpdated(updatedProduct);
      
      alert("Producto actualizado correctamente");
      // Redirigir al perfil privado del usuario
      navigate('/perfil');
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
      alert("Error al actualizar el producto. Por favor, intenta nuevamente.");
    }
  };

  const handleDeleteProduct = async () => {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.'
    );
    
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }
      
      // Emitir evento para sincronizar eliminación en toda la aplicación
      emitProductDeleted(id);
      
      setNotification({
        show: true,
        message: 'Producto eliminado correctamente',
        type: 'success'
      });
      
      // Redirigir al perfil privado después de un breve delay
      setTimeout(() => {
        navigate('/perfil');
      }, 1500);
      
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      setNotification({
        show: true,
        message: 'Error al eliminar el producto. Por favor, intenta nuevamente.',
        type: 'error'
      });
    }
  };


  if (isLoading) {
    return <div className="loading-container">Cargando información del producto...</div>;
  }

  return (
    <div className="editar-producto-container">
      <Header search={false} />
      {/* BackButton icon-only para regresar al origen */}
      <div className="editar-nav">
        <BackButton className="icon-back-btn" to={-1} aria-label="Volver" />
      </div>
      {notification.show && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}
      <div className="editar-producto-content">

        <div className="editar-producto-card">
          <div className="card-actions" ref={menuRef}>
              <button
                type="button"
                className="kebab-btn"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(prev => !prev)}
                title="Más opciones"
              >
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </button>
              {menuOpen && (
                <div className="actions-dropdown" role="menu">
                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => { setMenuOpen(false); handleDeleteProduct(); }}
                    role="menuitem"
                  >
                    Eliminar publicación
                  </button>
                </div>
              )}
            </div>
          <h2 className="editar-producto-title">Editar Producto</h2>
          <div className="producto-preview-multi">
            {previewImages.length > 0 ? (
              <div className="preview-multi-container">
                {previewImages.map((img, idx) => (
                  <div className="preview-container" key={idx}>
                    <img src={getProductImageUrl(img)} alt={`Vista previa ${idx + 1}`} className="preview-image" />
                    <button
                      type="button"
                      className="remove-image"
                      title="Eliminar imagen"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
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
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={e => handleFileSelect(e.target.files)}
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
          <form onSubmit={handleSubmit} className="form-editar-producto">
            <div className="form-group">
              <label htmlFor="title">Título del Producto</label>
              <input
                type="text"
                id="title"
                name="title"
                value={producto.title}
                onChange={handleChange}
                placeholder="Nombre descriptivo del producto"
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
                    disabled={(producto.caracteristicas || []).length>=15 || totalCaracteres>=1000}
                  />
                  <button type="button" className="btn-add-caracteristica" onClick={handleAddCaracteristica} disabled={!caracteristicaInput.trim() || (producto.caracteristicas || []).length>=15 || totalCaracteres+caracteristicaInput.length>1000}>
                    +
                  </button>
                </div>
                <div className="caracteristicas-list">
                  {(producto.caracteristicas || []).map((item, idx) => (
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
                  <span>{(producto.caracteristicas || []).length}/15 ítems</span> | <span>{totalCaracteres}/1000 caracteres</span>
                </div>
                {caracteristicasError && <div className="caracteristicas-error">{caracteristicasError}</div>}
              </div>
            </div>
            {/* cierre correcto de form-group características */}

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={producto.description}
                onChange={handleChange}
                placeholder="Describe el producto"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                name="categoria"
                value={producto.categoria}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecciona una categoría</option>
                {categorias.map((cat, idx) => (
                  <option key={idx} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            {/* Eliminado: botón duplicado de Guardar Cambios */}

            <div className="form-group" style={{ display: 'none' }}>
              <label htmlFor="ownerId">ID del Dueño</label>
              <input
                type="number"
                id="ownerId"
                name="ownerId"
                value={producto.ownerId}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-guardar">
                Guardar Cambios
              </button>
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => {
                  // Redirigir al perfil privado del usuario
                  navigate('/perfil');
                }}
              >
                Cancelar
              </button>
              {/* Botón eliminar movido al menú (ícono 3 puntos) */}
            </div>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EditarProducto;