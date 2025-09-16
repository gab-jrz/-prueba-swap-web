import React from 'react';
import { getProductImageUrl } from '../utils/getProductImageUrl.js';
import '../styles/ArticuloCard.css';

/**
 * Card premium para artículos en el perfil de usuario
 * Props esperadas:
 * - producto: { id, title, description, image, categoria, fechaPublicacion, estado, intercambiado }
 * - onEdit: función para editar
 * - onMarkAsExchanged: función para marcar como intercambiado
 */
const ArticuloCard = ({ producto, onEdit, onMarkAsExchanged }) => {
  // Normalizar campos por si el backend usa otras llaves
  const title = producto.title || producto.nombre || 'Sin título';
  const description = producto.description || producto.descripcion || '';
  const categoria = producto.categoria || producto.category || 'Sin categoría';
  const provincia = producto.provincia || producto.zona || 'Tucumán';
  const fechaPublicacion = producto.fechaPublicacion || producto.createdAt || producto.fecha || null;
  const isExchanged = producto.intercambiado || producto.estado === 'intercambiado';

  // LOG para debug
  console.log("Producto recibido en ArticuloCard:", producto);
  console.log("Imagen principal:", producto.images && producto.images[0]);

  const primaryImage = Array.isArray(producto.images) && producto.images.length > 0
    ? getProductImageUrl(producto.images[0])
    : null;
  const imageSrc = primaryImage || producto.image || '/images/placeholder-product.jpg';

  return (
    <div className={`articulo-card-premium ${isExchanged ? 'exchanged' : ''}`}>
      <div className="articulo-img-wrap">
        {isExchanged && (
          <div className="exchanged-badge">
            <span>Intercambiado</span>
          </div>
        )}
        <img
          src={imageSrc}
          alt={title}
          className="articulo-img"
        />
      </div>
      <div className="articulo-content">
        <div className="articulo-categoria-badge">
          {categoria}
        </div>
        <h3 className="articulo-title">{title}</h3>
        <p className="articulo-desc">{description}</p>
        <div className="articulo-meta-box">
          <div className="articulo-fecha-simple">
            Publicado el: {fechaPublicacion ? new Date(fechaPublicacion).toLocaleDateString() : 'Sin fecha'}
          </div>
          <div className="articulo-provincia-simple">
            En: {provincia}
          </div>
          {producto.ownerName && producto.ownerId && (
            <div className="articulo-owner-simple" style={{marginTop: '2px', fontSize: '0.95em', color: '#6b7280'}}>
              <span style={{fontWeight: 400, marginRight: 2}}>Por:</span>
              {producto.ownerName !== 'Usuario' ? (
                <span
                  className="articulo-owner-link"
                  title={`Ver perfil de ${producto.ownerName}`}
                  onClick={e => {
                    e.stopPropagation();
                    window.location.href = `/perfil-publico/${producto.ownerId}`;
                  }}
                  style={{
                    color: '#6b7280',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline dotted',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = '#7b2ff2')}
                  onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}
                >
                  {producto.ownerName}
                </span>
              ) : (
                <span style={{fontWeight: 600, color: '#6b7280'}}>Usuario</span>
              )}
            </div>
          )}
        </div>

        {!isExchanged && (
          <div className="articulo-actions">
            <button 
              className="articulo-edit-btn" 
              onClick={(e) => {
                e.stopPropagation();
                console.log("Producto para editar:", producto);
                onEdit && onEdit(producto);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticuloCard;
