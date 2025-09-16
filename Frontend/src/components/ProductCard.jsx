import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductImageUrl } from "../utils/getProductImageUrl.js";
import { API_URL } from "../config";
import "../styles/ProductCard.css";

const ProductCard = ({ 
  id, 
  title, 
  description, 
  categoria, 
  image, 
  images, // Nuevo prop para array de imágenes
  fechaPublicacion, 
  provincia, 
  ownerName, 
  ownerId, 
  condicion, // Condición del producto
  valorEstimado, // Valor estimado
  disponible, // Disponibilidad
  onConsultar,
  hideFavoriteButton, // Oculta el botón de corazón
  showRemoveFavorite, // Muestra el botón rojo de eliminar de favoritos
  onRemoveFavorite // Handler para eliminar de favoritos
}) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  // Cargar estado de favorito desde backend al montar el componente
  useEffect(() => {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    if (!usuarioActual?.id) return;
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/users/${usuarioActual.id}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(favs => setIsFavorite(favs.some(fav => fav._id === id)))
      .catch(() => setIsFavorite(false));
  }, [id]);

  const handleOwnerClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ownerId) {
      navigate(`/perfil-publico/${ownerId}`);
    }
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
    if (!usuarioActual?.id) return;
    const token = localStorage.getItem('token');
    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        // Quitar de favoritos
        await fetch(`${API_URL}/users/${usuarioActual.id}/favoritos/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
      } else {
        // Agregar a favoritos
        await fetch(`${API_URL}/users/${usuarioActual.id}/favoritos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId: id })
        });
        setIsFavorite(true);
      }
    } catch {}
    setLoadingFavorite(false);
  };

  // Determinar la imagen a mostrar (portada)
  // Prioridad: 1) Primera imagen del array, 2) Imagen singular (compatibilidad), 3) Placeholder
  const getMainImage = () => {
    if (images && Array.isArray(images) && images.length > 0) {
      // Si la imagen ya empieza con /uploads o uploads, no agregar nada
      const img = images[0];
      if (typeof img === 'string') {
        if (img.startsWith('/uploads') || img.startsWith('uploads')) {
          return img;
        }
        return `/uploads/products/${img.replace(/^\/+/, '')}`;
      }
      return img;
    }
    if (image) {
      if (typeof image === 'string') {
        if (image.startsWith('/uploads') || image.startsWith('uploads')) {
          return image;
        }
        return `/uploads/products/${image.replace(/^\/+/, '')}`;
      }
      return image;
    }
    return null;
  };

  const mainImage = getMainImage();
  const imageUrl = getProductImageUrl(mainImage);
  console.log('🖼️ ProductCard:', { id, image, images, mainImage, imageUrl });

  return (
    <div className="product-card-premium" onClick={onConsultar} style={{cursor: 'pointer'}}>
      <div className="product-img-wrap">
        <img
          src={imageUrl}
          alt={title}
          className="product-img"
          onError={(e) => {
            // Evitar loops infinitos si el placeholder también falla
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/OIP3.jpg';
          }}
        />
        {/* Badge "Nuevo" eliminado */}
        {/* Botón de favoritos solo si no está oculto por prop */}
        { !hideFavoriteButton && (
          <button 
            className={`favorite-btn ${isFavorite ? 'favorite-active' : ''}`}
            onClick={handleFavoriteToggle}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            disabled={loadingFavorite}
          >
            {loadingFavorite ? (
              <span className="loader"></span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? '#a259e6' : 'none'} stroke="#a259e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path 
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="product-content">
        <div className="product-categoria-badge">
          {categoria}
        </div>
        <h3 className="product-title" style={{cursor: 'pointer'}}>
          {title}
        </h3>
        <p className="product-desc">{description}</p>
        <div className="product-meta-box">
          <div className="product-fecha-simple">
            Publicado el: {fechaPublicacion ? new Date(fechaPublicacion).toLocaleDateString() : 'Sin fecha'}
          </div>
          <div className="product-provincia-simple">
            En: {provincia || 'Sin especificar'}
          </div>
          {/* Nombre del propietario clickeable dentro de la caja */}
          <div className="product-owner-simple" onClick={handleOwnerClick}>
            Por: <span className="product-owner-name">{ownerName || 'Usuario'}</span>
          </div>
        </div>
        <button className="product-consultar-btn" onClick={(e) => {e.stopPropagation(); onConsultar && onConsultar();}} type="button">
          Consultar este producto
        </button>
        {showRemoveFavorite && (
          <button 
            className="product-remove-fav-btn" 
            onClick={(e) => { e.stopPropagation(); onRemoveFavorite && onRemoveFavorite(id); }} 
            type="button"
          >
            Eliminar de favoritos
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
