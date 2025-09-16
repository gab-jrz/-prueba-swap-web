import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config.js';
import { categorias } from '../categorias';
import '../styles/ProductCard.css';

const DonationCard = ({ 
  title, 
  description, 
  category, 
  location, 
  condition, 
  images, 
  status, 
  createdAt, 
  donorName,
  ownerId,
  viewMode = 'grid',
  onAssign,
  donationId,
  onEdit,
  onMarkDelivered,
  onDelete // <-- nueva prop
}) => {
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const displayLocation = location || 'Sin especificar';

  const getImageUrl = (imageName) => {
    if (!imageName) return null;
    // Si ya es una URL completa, devolverla tal como está
    if (imageName.startsWith('http')) return imageName;
    // Construir la URL completa para imágenes del servidor
    return `${API_URL.replace('/api', '')}/uploads/products/${imageName}`;
  };

  const handleAssign = () => {
    if (donationId) {
      // Navegar a la página de detalles
      navigate(`/donaciones/${donationId}`);
    } else {
      // Fallback al modal si no hay ID
      setShowModal(true);
    }
  };

  const handleConfirm = () => {
    setShowModal(false);
    if (onAssign) onAssign();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      available: { text: 'Disponible', class: 'success', icon: 'fa-check-circle' },
      reserved: { text: 'Reservado', class: 'warning', icon: 'fa-clock' },
      delivered: { text: 'Entregado', class: 'info', icon: 'fa-handshake' },
      removed: { text: 'No disponible', class: 'secondary', icon: 'fa-times-circle' }
    };
    return statusMap[status] || statusMap.available;
  };

  const conditionLabel = (key) => {
    const map = {
      'nuevo': 'Nuevo',
      'como_nuevo': 'Como nuevo',
      'muy_bueno': 'Muy bueno',
      'bueno': 'Bueno',
      'regular': 'Regular'
    };
    return map[key] || key || '';
  };

  const categoryLabel = (catKey) => {
    if (!catKey) return '';
    const found = categorias.find(c => c.id === catKey || c.name === catKey);
    return found ? found.name : catKey;
  };

  // Emoji por categoría (neutros en género)
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

  const statusInfo = getStatusInfo(status);

  if (viewMode === 'list') {
    return (
      <>
        <div className="donation-card-list" style={{ minHeight: 330, padding: '16px 20px' }}>
          <div className="donation-image-container">
            {images && images.length > 0 && !imageError ? (
              <img 
                src={getImageUrl(images[0])} 
                alt={title} 
                className="donation-image"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="donation-image-placeholder">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          
          <div className="donation-content">
            <div className="donation-header">
              {category && (
                <span className="product-categoria-badge">
                  <span className="categoria-emoji" aria-hidden="true">{getCategoryEmoji(category)}</span>
                  {categoryLabel(category)}
                </span>
              )}
            </div>
            
            <div className="donation-details">
              <h5 className="donation-title" style={{marginTop: 0}}>{title}</h5>
              {description && (
                <p className="donation-description">{description}</p>
              )}
              <div className="product-meta-box">
                {createdAt && (
                  <p className="product-fecha-simple" style={{margin: 0}}>
                    <strong>Publicado el:</strong> {formatDate(createdAt)}
                  </p>
                )}
                {donorName && (
                  <p className="product-fecha-simple" style={{margin: '4px 0 0 0'}}>
                    <strong>De:</strong>{' '}
                    {ownerId ? (
                      <span
                        className="product-owner-name donor-chip linkable"
                        onClick={() => navigate(`/perfil-publico/${ownerId}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/perfil-publico/${ownerId}`); }}
                        title="Ver perfil público"
                      >
                        {donorName}
                      </span>
                    ) : (
                      <span className="product-owner-name">{donorName}</span>
                    )}
                  </p>
                )}
                <p className="product-provincia-simple" style={{margin: '4px 0 0 0'}}>
                  <strong>En:</strong> {displayLocation}
                </p>
              </div>
            </div>
            
            <div className="donation-actions">
              {onDelete ? (
                <button
                  className="btn-donation-action"
                  onClick={onDelete}
                  style={{ background: '#e53e3e', color: '#fff' }}
                >
                  <i className="fas fa-trash me-2"></i>
                  Eliminar
                </button>
              ) : (
                <>
                  {onEdit && (
                    <button
                      className="btn-donation-action"
                      onClick={onEdit}
                    >
                      <i className="fas fa-edit me-2"></i>
                      Editar
                    </button>
                  )}
                  {onMarkDelivered && status !== 'delivered' && (
                    <button
                      className="btn-donation-action"
                      onClick={onMarkDelivered}
                    >
                      <i className="fas fa-check me-2"></i>
                      Marcar como donado
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-heart text-danger me-2"></i>
                    ¿Te interesa esta donación?
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowModal(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="modal-donation-info">
                    <h6>{title}</h6>
                    <p>Te pondremos en contacto con la persona que está donando este artículo.</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleConfirm}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Contactar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Vista en grid (por defecto)
  return (
    <>
      <div className="donation-card-grid" style={{ minHeight: 330, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
        <div className="donation-image-container">
          {images && images.length > 0 && !imageError ? (
            <img 
              src={getImageUrl(images[0])} 
              alt={title} 
              className="donation-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="donation-image-placeholder">
              <i className="fas fa-image"></i>
            </div>
          )}
          
          <div className="donation-overlay">
            {category && (
              <span className="product-categoria-badge">
                <span className="categoria-emoji" aria-hidden="true">{getCategoryEmoji(category)}</span>
                {categoryLabel(category)}
              </span>
            )}
          </div>
        </div>
        
        <div className="donation-content">
          <h5 className="donation-title">{title}</h5>
          
          <div className="donation-meta">
            <span className="donation-condition">
              <i className="fas fa-star me-1"></i>
              {condition}
            </span>
          </div>
          
          <div className="donation-location">
            <i className="fas fa-map-marker-alt me-1"></i>
            <span><strong>En:</strong> {displayLocation}</span>
          </div>
          
          {description && (
            <p className="donation-description">
              {description.length > 80 ? `${description.substring(0, 80)}...` : description}
            </p>
          )}
          
          {createdAt && (
            <div className="donation-date">
              <i className="fas fa-calendar me-1"></i>
              {formatDate(createdAt)}
            </div>
          )}

          {donorName && (
            <div className="donation-owner">
              <i className="fas fa-user me-1" aria-hidden="true"></i>
              <span><strong>De:</strong> </span>
              {ownerId ? (
                <span
                  className="product-owner-name donor-chip linkable"
                  onClick={() => navigate(`/perfil-publico/${ownerId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/perfil-publico/${ownerId}`); }}
                  title="Ver perfil público"
                >
                  {donorName}
                </span>
              ) : (
                <span className="product-owner-name">{donorName}</span>
              )}
            </div>
          )}
          
          {onEdit || onMarkDelivered ? (
            <div className="donation-actions">
              {onEdit && (
                <button
                  className="btn-donation-action"
                  onClick={onEdit}
                >
                  <i className="fas fa-edit me-2"></i>
                  Editar
                </button>
              )}
              {onMarkDelivered && status !== 'delivered' && (
                <button
                  className="btn-donation-action"
                  onClick={onMarkDelivered}
                >
                  <i className="fas fa-check me-2"></i>
                  Marcar como donado
                </button>
              )}
            </div>
          ) : (
            <button 
              className="btn-donation-action"
              onClick={handleAssign}
              disabled={status !== 'available'}
            >
              <i className="fas fa-heart me-2"></i>
              {status === 'available' ? 'Me interesa' : 'No disponible'}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-heart text-danger me-2"></i>
                  ¿Te interesa esta donación?
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-donation-info">
                  <h6>{title}</h6>
                  <p>Te pondremos en contacto con la persona que está donando este artículo.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleConfirm}
                >
                  <i className="fas fa-paper-plane me-2"></i>
                  Contactar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationCard;
