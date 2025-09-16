import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { categorias } from '../categorias';
import '../styles/DetalleProducto.css';
import '../styles/DonationDetailPremium.css';
import '../styles/ProductCard.css';
import { API_URL } from '../config';

// Función para construir URLs de imágenes (forzando HTTPS y normalizando rutas)
const getImageUrl = (imageName) => {
  if (!imageName) return null;
  const base = API_URL.replace('/api', '');

  // Si viene absoluta
  if (/^https?:\/\//i.test(imageName)) {
    // Forzar https si viene con http
    return imageName.replace(/^http:\/\//i, 'https://');
  }

  // Si viene como ruta relativa (comienza con /)
  if (imageName.startsWith('/')) {
    return `${base}${imageName}`;
  }

  // Caso filename simple
  return `${base}/uploads/products/${imageName}`;
};

// Slider de imágenes para donaciones (usando el mismo componente que productos)
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
        src={getImageUrl(images[current])}
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

const DonationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [donor, setDonor] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  // Menú contextual (3 puntos) para reportar
  const [menuOpen, setMenuOpen] = useState(false);
  const imageContainerRef = useRef(null);

  useEffect(() => {
    fetchDonationDetails();
  }, [id]);

  // En donaciones no hay favoritos

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
    // true para captar scrolls en contenedores con overflow
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const fetchDonationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/donations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setDonation(data);
        
        // Obtener información del donador (si ya viene poblado, úsalo; si no, consulta por ID)
        if (data.donor) {
          if (typeof data.donor === 'object') {
            setDonor(data.donor);
          } else {
            const donorResponse = await fetch(`${API_URL}/users/${data.donor}`);
            if (donorResponse.ok) {
              const donorData = await donorResponse.json();
              setDonor(donorData);
            }
          }
        }
      } else {
        setError('No se pudo cargar la donación');
      }
    } catch (error) {
      console.error('Error fetching donation:', error);
      setError('Error al cargar la donación');
    } finally {
      setLoading(false);
    }
  };

  // Abre el modal de confirmación
  const handleMarkDelivered = () => {
    setShowDeliverModal(true);
  };

  // Confirmación: realiza el PATCH
  const confirmMarkDelivered = async () => {
    if (!donation || !donation._id) return;
    try {
      const resp = await fetch(`${API_URL}/donations/${donation._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' })
      });
      if (!resp.ok) throw new Error('No se pudo actualizar el estado');
      const updated = await resp.json();
      setDonation(updated);
      setShowDeliverModal(false);
    } catch (e) {
      console.error('Error al marcar como entregada:', e);
      alert('Error al marcar como entregada');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Sin handler de favoritos en donaciones

  const handleContact = () => {
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"));
    
    if (!usuarioActual) {
      alert("Debes iniciar sesión para contactar al donador");
      navigate("/login");
      return;
    }

    // Detectar dueño con ambos tipos de ID (app id y Mongo _id)
    const donorAppId = donor?.id || (typeof donation.donor === 'object' ? donation.donor.id : undefined);
    const donorMongoId = donor?._id || (typeof donation.donor === 'object' ? donation.donor._id : (typeof donation.donor === 'string' ? donation.donor : undefined));
    const isOwner = (
      (!!usuarioActual?.id && !!donorAppId && usuarioActual.id === donorAppId) ||
      (!!usuarioActual?._id && !!donorMongoId && usuarioActual._id === donorMongoId)
    );
    if (isOwner) {
      alert("No puedes contactarte a ti mismo por tu propia donación");
      return;
    }

    navigate(`/donaciones/${donation._id}/contactar`, {
      state: {
        donacionId: donation._id,
        donacionTitle: donation.title,
        donacionImage: Array.isArray(donation.images) && donation.images.length > 0 ? getImageUrl(donation.images[0]) : '',
        donacionDescription: donation.description,
        // Usar SIEMPRE el id propio de la app para mensajes y notificaciones
        donadorId: donorAppId || donorMongoId,
        donadorNombre: donor?.nombre || donor?.name || "Usuario",
        donadorApellido: donor?.apellido || ""
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { text: 'Disponible', class: 'disponible' },
      reserved: { text: 'Reservado', class: 'reservado' },
      delivered: { text: 'Entregado', class: 'entregado' },
      removed: { text: 'No disponible', class: 'no-disponible' }
    };
    const statusInfo = statusMap[status] || statusMap.available;
    return (
      <div className={`categoria-badge-premium status-${statusInfo.class}`}>
        <span className="categoria-icon">
          {status === 'available' ? '✅' : 
           status === 'reserved' ? '⏳' : 
           status === 'delivered' ? '🤝' : '❌'}
        </span>
        {statusInfo.text}
      </div>
    );
  };

  const conditionLabel = (key) => {
    const map = {
      'nuevo': 'Nuevo',
      'como_nuevo': 'Como nuevo',
      'muy_bueno': 'Muy bueno',
      'bueno': 'Bueno',
      'regular': 'Regular'
    };
    return map[key] || key || 'No especificada';
  };

  const pickupLabel = (key) => {
    const map = {
      'domicilio': 'Retiro en domicilio',
      'punto_encuentro': 'Punto de encuentro',
      'envio': 'Envío postal',
      'a_convenir': 'Flexible / A convenir'
    };
    return map[key] || key;
  };

  const categoryLabel = (catKey) => {
    if (!catKey) return 'No especificada';
    const found = categorias.find(c => c.id === catKey || c.name === catKey);
    return found ? found.name : catKey;
  };

  const getCategoryEmoji = (catKey) => {
    const label = categoryLabel(catKey).toLowerCase();
    const map = {
      'moda y complementos': '👕',
      'moda': '👕',
      'ropa': '👕',
      'electrónicos': '🔌',
      'electronicos': '🔌',
      'tecnología': '🖥️',
      'tecnologia': '🖥️',
      'hogar': '🏠',
      'muebles': '🪑',
      'alimentos': '🥫',
      'comida': '🥫',
      'libros': '📚',
      'juguetes': '🧸',
      'belleza': '💄',
      'deporte': '🏀',
      'herramientas': '🛠️',
      'mascotas': '🐾',
      'bebés': '🍼',
      'bebes': '🍼',
      'salud': '🩺',
      'arte': '🎨',
      'música': '🎵',
      'musica': '🎵',
      'oficina': '🗂️',
      'escolar': '🎒',
      'jardín': '🌿',
      'jardin': '🌿',
      'transporte': '🚲'
    };
    return map[label] || '📦';
  };

  // Determinar si el usuario logueado es dueño de la donación (usa id de app o _id de Mongo)
  const usuarioActual = (() => {
    try { return JSON.parse(localStorage.getItem('usuarioActual')); } catch { return null; }
  })();
  const donorAppId = donor?.id || (typeof donation?.donor === 'object' ? donation.donor.id : undefined);
  const donorMongoId = donor?._id || (typeof donation?.donor === 'object' ? donation.donor._id : (typeof donation?.donor === 'string' ? donation.donor : undefined));
  const isOwner = !!usuarioActual && (
    (!!usuarioActual.id && !!donorAppId && usuarioActual.id === donorAppId) ||
    (!!usuarioActual._id && !!donorMongoId && usuarioActual._id === donorMongoId)
  );

  if (loading) return (
    <div className="detalle-container">
      <Header />
      <div className="producto-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando donación...</p>
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
  
  if (!donation) return (
    <div className="detalle-container">
      <Header />
      <div className="producto-loading">
        <p className="loading-text">🔍 Donación no encontrada</p>
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
          {/* Imagen o slider de imágenes de la donación */}
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
              <div
                className="context-menu-report"
                onClick={(e) => e.stopPropagation()}
              >
                <button className="context-menu-item danger" onClick={() => { setShowReportModal(true); setMenuOpen(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Reportar donación
                </button>
              </div>
            )}
            {Array.isArray(donation.images) && donation.images.length > 1 ? (
              <ImageSlider images={donation.images} title={donation.title} />
            ) : donation.images && donation.images.length > 0 ? (
              <img
                src={getImageUrl(donation.images[0])}
                alt={donation.title}
                className="producto-imagen-premium"
              />
            ) : (
              <div className="slider-premium">
                <div className="no-image-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p style={{color: '#94a3b8', fontSize: '1.1rem', marginTop: '1rem'}}>Sin imágenes</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Información de la donación */}
          <div className="producto-info-premium">
            {donation.category && (
              <div className="categoria-badge-premium" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <span className="product-categoria-badge">{categoryLabel(donation.category)}</span>
              </div>
            )}
            
            <div className="titulo-con-favoritos-premium">
              <h1 className="producto-titulo-premium">{donation.title}</h1>
              {/* En vista de Donación NO se permite agregar a favoritos */}
            </div>
            
            <div className="producto-descripcion-premium">
              <p>{donation.description || 'Sin descripción disponible'}</p>
            </div>
            
            {/* Características de la donación */}
            {donation.characteristics && donation.characteristics.length > 0 && (
              <div className="producto-caracteristicas-premium" style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '2px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                marginBottom: '1.5rem'
              }}>
                <h3 className="caracteristicas-title-premium" style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: '"Inter", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>Características</h3>
                <ul className="caracteristicas-list-premium" style={{
                  listStyle: 'none',
                  padding: '0',
                  margin: '0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {donation.characteristics.map((item, idx) => (
                    <li key={idx} className="caracteristica-item-premium" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'default',
                      background: 'rgba(255, 255, 255, 0.7)',
                      border: '1px solid rgba(226, 232, 240, 0.5)'
                    }}>
                      <span className="caracteristica-icon-premium" style={{
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '8px',
                        flexShrink: '0',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                      }}>✓</span>
                      <span className="caracteristica-text" style={{
                        color: '#334155',
                        fontWeight: '600',
                        lineHeight: '1.5',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '0.95rem'
                      }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Atributos esenciales */}
            <div className="atributos-esenciales-premium">
              <div className="atributo-premium">
                <div className="atributo-icon">{getCategoryEmoji(donation.category)}</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Categoría</span>
                  <span className="atributo-valor-premium">{categoryLabel(donation.category)}</span>
                </div>
              </div>

              <div className="atributo-premium">
                <div className="atributo-icon">⭐</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Condición</span>
                  <span className="atributo-valor-premium">{conditionLabel(donation.condition)}</span>
                </div>
              </div>
              
              <div className="atributo-premium">
                <div className="atributo-icon">📅</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Fecha de publicación</span>
                  <span className="atributo-valor-premium">{formatDate(donation.createdAt)}</span>
                </div>
              </div>
              
              {donor && (
                <div className="atributo-premium">
                  <div className="atributo-icon">❤️</div>
                  <div className="atributo-content">
                    <span className="atributo-label-premium">Donador</span>
                    <span className="atributo-valor-premium clickeable" onClick={() => navigate(`/perfil-publico/${donor._id}`)}>
                      {donor.nombre} {donor.apellido}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="atributo-premium">
                <div className="atributo-icon">📍</div>
                <div className="atributo-content">
                  <span className="atributo-label-premium">Ubicación</span>
                  <span className="atributo-valor-premium">{donation.location || 'No especificada'}</span>
                </div>
              </div>

              {donation.pickupMethod && (
                <div className="atributo-premium">
                  <div className="atributo-icon">🚚</div>
                  <div className="atributo-content">
                    <span className="atributo-label-premium">Método de entrega</span>
                    <span className="atributo-valor-premium">{pickupLabel(donation.pickupMethod)}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Botón de acción */}
            <div className="producto-accion-premium">
              {isOwner ? (
                donation.status !== 'delivered' && donation.status !== 'removed' ? (
                  <button
                    className="btn-consultar-premium"
                    style={{ background: '#10b981' }}
                    onClick={handleMarkDelivered}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z"/>
                    </svg>
                    Marcar como entregada
                  </button>
                ) : (
                  <button className="btn-consultar-premium disabled" disabled>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 8.5l1.5 1.5L16 7l1.5 1.5L12 14l-3-3z"/>
                    </svg>
                    {donation.status === 'delivered' ? 'Ya entregado' : 'No disponible'}
                  </button>
                )
              ) : (
                donation.status === 'available' ? (
                  <button className="btn-consultar-premium" onClick={handleContact}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    Me interesa esta donación
                  </button>
                ) : (
                  <button className="btn-consultar-premium disabled" disabled>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-3 8.5l1.5 1.5L16 7l1.5 1.5L12 14l-3-3z"/>
                    </svg>
                    {donation.status === 'reserved' ? 'Reservado' : 'No disponible'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para reportar */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reportar donación</h3>
              <button 
                className="modal-close"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>¿Por qué deseas reportar esta donación?</p>
              <select className="report-select">
                <option value="">Selecciona una razón</option>
                <option value="spam">Spam o contenido no deseado</option>
                <option value="fake">Donación falsa o engañosa</option>
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

      {/* Modal de confirmación: marcar como entregada */}
      {showDeliverModal && (
        <div className="modal-overlay" onClick={() => setShowDeliverModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar entrega</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeliverModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>¿Confirmas que esta donación ya fue entregada? Esta acción moverá la publicación al historial.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <button 
                className="btn-modal-reportar"
                style={{ background: '#10b981', borderColor: '#10b981', width: 'auto', minWidth: '180px' }}
                onClick={confirmMarkDelivered}
              >
                Confirmar entrega
              </button>
              <button 
                className="btn-modal-cancelar"
                style={{ width: 'auto', minWidth: '160px' }}
                onClick={() => setShowDeliverModal(false)}
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

export default DonationDetail;
