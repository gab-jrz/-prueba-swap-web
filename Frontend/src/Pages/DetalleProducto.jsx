import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getProduct } from "../services/api";
import "../styles/DetalleProducto.css";
import "../styles/DonationDetailPremium.css";
import { getProductImageUrl } from "../utils/getProductImageUrl";
import { API_URL } from "../config";


// Slider de imágenes premium para productos (máx 3 imágenes)
function ImageSlider({ images, title }) {
  const [current, setCurrent] = useState(0);

  if (!Array.isArray(images) || images.length === 0) return null;

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="slider-premium">
      <button className="slider-arrow left" onClick={prevSlide} aria-label="Anterior">
        &#8592;
      </button>
      <img
        src={getProductImageUrl(images[current])}
        alt={title + ' imagen ' + (current + 1)}
        className="slider-image"
      />
      <button className="slider-arrow right" onClick={nextSlide} aria-label="Siguiente">
        &#8594;
      </button>
      <div className="slider-dots">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={"slider-dot" + (idx === current ? " active" : "")}
            onClick={e => { e.stopPropagation(); setCurrent(idx); }}
            aria-label={`Ir a imagen ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const DetalleProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  // Menú contextual (3 puntos) anclado al contenedor de imagen
  const [menuOpen, setMenuOpen] = useState(false);
  const imageContainerRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const raw = await getProduct(id);
        const normalized = {
          id: raw?.id || raw?._id || id,
          _id: raw?._id || raw?.id || null,
          title: raw?.title || raw?.titulo || 'Sin título',
          description: raw?.description || raw?.descripcion || 'Sin descripción',
          categoria: raw?.categoria || raw?.category || 'General',
          images: Array.isArray(raw?.images) ? raw.images : (raw?.image ? [raw.image] : []),
          image: raw?.image || (Array.isArray(raw?.images) && raw.images.length > 0 ? raw.images[0] : ''),
          fechaPublicacion: raw?.fechaPublicacion || raw?.createdAt || raw?.fecha || null,
          provincia: raw?.provincia || raw?.zona || raw?.ubicacion || '',
          ownerId: raw?.ownerId || raw?.owner || raw?.userId || raw?.usuarioId || null,
          caracteristicas: raw?.caracteristicas || raw?.features || [],
          ...raw,
        };
        setProducto(normalized);
        
        // Obtener información del dueño del producto (si hay ownerId)
        if (normalized.ownerId) {
          const ownerResponse = await fetch(`${API_URL}/users/${normalized.ownerId}`);
          if (ownerResponse.ok) {
            const ownerData = await ownerResponse.json();
            setOwner(ownerData);
            // Si el producto no trae provincia, usar la del propietario
            setProducto(prev => prev ? ({
              ...prev,
              provincia: prev.provincia || ownerData.zona || ownerData.ubicacion || ''
            }) : prev);
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Error al cargar el producto. Por favor, intenta de nuevo más tarde.');
        console.error("Error al obtener el producto:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Cerrar menú contextual con click fuera, Escape o scroll
  useEffect(() => {
    if (!menuOpen) return;
    const handleGlobalClick = (e) => {
      if (!imageContainerRef.current || !imageContainerRef.current.contains(e.target)) {
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

  // Inicializar estado de favorito cuando el producto ya está cargado
  useEffect(() => {
    if (!producto?.id) return;
    const uid = (() => { try { return JSON.parse(localStorage.getItem('usuarioActual') || '{}')?.id || null; } catch { return null; } })();
    const key = uid ? `favorites:${uid}` : 'favorites';
    // migración suave si no existe la clave namespaced
    try {
      if (uid && !localStorage.getItem(key) && localStorage.getItem('favorites')) {
        localStorage.setItem(key, localStorage.getItem('favorites'));
      }
    } catch {}
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    setIsFavorite(favorites.some(fav => fav.id === producto.id));
  }, [producto?.id]);

  const handleChat = () => {
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
    
    if (!usuarioActual) {
      alert("Debes iniciar sesión para consultar por este artículo");
      navigate("/login");
      return;
    }

    if (usuarioActual.id === producto.ownerId) {
      alert("No puedes consultar por tu propio producto");
      return;
    }

    navigate("/intercambiar", {
      state: {
        productoId: producto.id,
        productoTitle: producto.title,
        productoImage: producto.image,
        productoDescription: producto.description,
        ownerId: producto.ownerId,
        ownerNombre: owner?.nombre || "",
        ownerApellido: owner?.apellido || ""
      }
    });
  };

  const handleFavorite = () => {
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuarioActual) {
      setShowLoginModal(true);
      return;
    }

    const key = usuarioActual?.id ? `favorites:${usuarioActual.id}` : 'favorites';
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    const productData = {
      id: producto.id,
      title: producto.title,
      description: producto.description,
      categoria: producto.categoria,
      image: Array.isArray(producto.images) && producto.images.length > 0 ? producto.images[0] : producto.image,
      images: producto.images,
      fechaPublicacion: producto.fechaPublicacion,
      provincia: producto.provincia,
      ownerName: owner ? `${owner.nombre} ${owner.apellido}` : undefined,
      ownerId: producto.ownerId,
      condicion: producto.condicion,
      valorEstimado: producto.valorEstimado,
      disponible: producto.disponible,
    };

    if (isFavorite) {
      const updatedFavorites = favorites.filter(fav => fav.id !== producto.id);
      localStorage.setItem(key, JSON.stringify(updatedFavorites));
      setIsFavorite(false);
    } else {
      const updatedFavorites = [...favorites, productData];
      localStorage.setItem(key, JSON.stringify(updatedFavorites));
      setIsFavorite(true);
    }

    // Notificar al resto de la app
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate("/login");
  };

  // Marcar donación como entregada (detalle de donación)
  const handleMarkDonationDelivered = async () => {
    if (!producto?._id && !producto?.id) return;
    const donationId = producto._id || producto.id;
    const titulo = producto.title || producto.itemName || 'Esta donación';
    if (!window.confirm(`¿Confirmás que la donación "${titulo}" fue entregada?`)) return;
    try {
      const res = await fetch(`${API_URL}/donations/${donationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error HTTP ${res.status}`);
      }
      const updated = await res.json();
      // Actualizar estado local del producto (status)
      setProducto(prev => prev ? ({ ...prev, status: updated.status }) : prev);

      // Refrescar datos del usuario (transacciones y contadores)
      try {
        const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
        const uid = usuarioActual?.id;
        if (uid) {
          const userRes = await fetch(`${API_URL}/users/${uid}`);
          if (userRes.ok) {
            const freshUser = await userRes.json();
            localStorage.setItem('usuarioActual', JSON.stringify({
              ...(JSON.parse(localStorage.getItem('usuarioActual')) || {}),
              ...freshUser,
              imagen: (JSON.parse(localStorage.getItem('usuarioActual')) || {}).imagen || freshUser?.imagen,
            }));
          }
        }
      } catch (e) {
        console.warn('No se pudo refrescar el usuario tras entregar donación (detalle):', e);
      }

      // Notificar a la app
      window.dispatchEvent(new CustomEvent('donationsUpdated', { detail: { id: donationId, status: 'delivered' } }));
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { reason: 'donation-delivered', donationId } }));
      alert('✅ Donación marcada como entregada');
    } catch (e) {
      console.error('❌ Error al marcar donación como entregada (detalle):', e);
      alert(e.message || 'No se pudo actualizar la donación');
    }
  };

  if (loading) return (
    <div className="detalle-container">
      <Header />
      <div className="producto-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando producto...</p>
      </div>
      <Footer />
    </div>
  );
  
  if (error) return (
    <div className="detalle-container">
      <Header />
      <div className="producto-loading">
        <p className="loading-text" style={{color: '#ef4444'}}>❌ {error}</p>
      </div>
      <Footer />
    </div>
  );
  
  if (!producto) return (
    <div className="detalle-container">
      <Header />
      <div className="producto-loading">
        <p className="loading-text">🔍 Producto no encontrado</p>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="detalle-container">
      {/* Header simplificado */}
      <Header search={false} />
      
      <div className="detalle-contenido">
        
        <div className="detalle-card-premium">
          {/* Imagen o slider de imágenes del producto */}
          <div className="producto-imagen-container-premium" ref={imageContainerRef}>
            {/* Botón de 3 puntos en esquina sup. derecha */}
            <button
              className="image-menu-trigger"
              aria-label="Más opciones"
              title="Más opciones"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(true); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="19" cy="12" r="2"></circle>
              </svg>
            </button>

            {/* Menú contextual */}
            {menuOpen && (
              <div className="context-menu-report" onClick={(e) => e.stopPropagation()}>
                <button className="context-menu-item danger" onClick={() => { setShowReportModal(true); setMenuOpen(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Reportar publicación
                </button>
              </div>
            )}

            {/* Imagen/slider */}
            {Array.isArray(producto.images) && producto.images.length > 1 ? (
              <ImageSlider images={producto.images} title={producto.title} />
            ) : (
              <img
                src={getProductImageUrl(producto.images && producto.images.length > 0 ? producto.images[0] : producto.image)}
                alt={producto.title}
                className="producto-imagen-premium"
              />
            )}
          </div>

          {/* Información del producto */}
          <div className="producto-info-premium">
            {(() => {
              const cat = String(producto?.categoria || producto?.category || '').toLowerCase();
              const isDonationCategory = cat.includes('donaci'); // DONACION/DONACIONES
              return (
                <div className="categoria-badge-premium">
                  {isDonationCategory && (
                    <span className="categoria-icon">📂</span>
                  )}
                  {producto.categoria}
                </div>
              );
            })()}

            <div className="titulo-con-favoritos-premium">
              <h1 className="producto-titulo-premium">{producto.title}</h1>
              
              {/* Botón de favoritos integrado */}
              <button 
                className={`btn-favorito-premium ${isFavorite ? 'favorito-activo' : ''}`}
                onClick={handleFavorite}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
            
            <div className="producto-descripcion-premium">
              <p>{producto.description}</p>
            </div>
            
            {/* Características del producto */}
            {producto.caracteristicas && producto.caracteristicas.length > 0 && (
              <div className="producto-caracteristicas-premium">
                <h3 className="caracteristicas-title-premium">Características</h3>
                <ul className="caracteristicas-list-premium">
                  {producto.caracteristicas.map((item, idx) => (
                    <li key={idx} className="caracteristica-item-premium">
                      <span className="caracteristica-icon-premium">✓</span>
                      <span className="caracteristica-text">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Atributos esenciales */}
            <div className="atributos-esenciales-premium">
              <div className="atributo-premium">
                <div className="atributo-icon">📅</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Fecha de publicación</span>
                  <span className="atributo-valor-premium">{formatDate(producto.fechaPublicacion)}</span>
                </div>
              </div>
              
              {owner && (
                <div className="atributo-premium">
                  <div className="atributo-icon">👤</div>
                  <div className="atributo-content">
                    <span className="atributo-label-premium">Propietario</span>
                    <span className="atributo-valor-premium clickeable" onClick={() => navigate(`/perfil-publico/${owner._id}`)}>
                      {owner.nombre} {owner.apellido}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="atributo-premium">
                <div className="atributo-icon">📍</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Provincia</span>
                  <span className="atributo-valor-premium">{producto.provincia || 'No especificada'}</span>
                </div>
              </div>
            </div>
            
            {/* Acciones: Consultar o Marcar como entregada si corresponde */}
            <div className="producto-accion-premium">
              {(() => {
                const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || 'null');
                const isDonation = ['available','reserved','delivered','removed'].includes(String(producto?.status || '').toLowerCase());
                const possibleOwner = producto?.ownerId || producto?.donor || producto?.owner?._id;
                const isOwner = usuarioActual && (usuarioActual.id === possibleOwner);
                const canMarkDelivered = isDonation && isOwner && String(producto?.status).toLowerCase() !== 'delivered';
                if (canMarkDelivered) {
                  return (
                    <button className="btn-donation-delivered" onClick={handleMarkDonationDelivered}>
                      <span style={{marginRight: 8}}>✓</span>
                      Marcar como entregada
                    </button>
                  );
                }
                return (
                  <button className="btn-consultar-premium" onClick={handleChat}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                    Consultar por este artículo
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para usuarios no registrados */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registro requerido</h3>
              <button 
                className="modal-close"
                onClick={() => setShowLoginModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Es necesario registrarse para agregar artículos a favoritos.</p>
              <p>¿Te gustaría crear una cuenta ahora?</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-modal-cancelar"
                onClick={() => setShowLoginModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-registrar"
                onClick={handleLoginRedirect}
              >
                Ir a registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para reportar */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reportar artículo</h3>
              <button 
                className="modal-close"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>¿Por qué deseas reportar este artículo?</p>
              <select className="report-select">
                <option value="">Selecciona una razón</option>
                <option value="spam">Spam o contenido no deseado</option>
                <option value="fake">Producto falso o engañoso</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="other">Otro motivo</option>
              </select>
              <textarea 
                className="report-textarea"
                placeholder="Describe el problema (opcional)"
              ></textarea>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-modal-cancelar"
                onClick={() => setShowReportModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal-reportar"
                onClick={() => {
                  // TODO: Implementar lógica de reporte
                  alert('Reporte enviado. Gracias por tu colaboración.');
                  setShowReportModal(false);
                }}
              >
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DetalleProducto;