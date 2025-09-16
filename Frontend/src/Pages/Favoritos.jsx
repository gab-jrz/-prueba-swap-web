import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import '../styles/Home.css';

// Página de Favoritos con las mismas cards que Home
const Favoritos = () => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);

  // Cargar favoritos desde localStorage al montar y al cambiar por eventos externos
  useEffect(() => {
    const getUid = () => {
      try { return JSON.parse(localStorage.getItem('usuarioActual') || '{}')?.id || null; } catch { return null; }
    };
    const keyFor = (uid) => (uid ? `favorites:${uid}` : 'favorites');
    const migrateIfNeeded = (uid) => {
      try {
        const namespaced = localStorage.getItem(keyFor(uid));
        const global = localStorage.getItem('favorites');
        if (!namespaced && global && uid) {
          // migrar global -> namespaced, mantener global para compatibilidad temporal
          localStorage.setItem(keyFor(uid), global);
        }
      } catch {}
    };
    const load = () => {
      try {
        const uid = getUid();
        migrateIfNeeded(uid);
        const raw = localStorage.getItem(keyFor(uid));
        const data = JSON.parse(raw || '[]');
        setFavoritos(Array.isArray(data) ? data : []);
      } catch {
        setFavoritos([]);
      }
    };
    load();
    const handler = () => load();
    window.addEventListener('favoritesChanged', handler);
    return () => window.removeEventListener('favoritesChanged', handler);
  }, []);

  // Eliminar un producto de favoritos
  const handleRemoveFavorite = (productId) => {
    const uid = (() => { try { return JSON.parse(localStorage.getItem('usuarioActual') || '{}')?.id || null; } catch { return null; } })();
    const key = uid ? `favorites:${uid}` : 'favorites';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(key, JSON.stringify(updated));
    setFavoritos(updated);
    window.dispatchEvent(new CustomEvent('favoritesChanged'));
  };

  return (
    <div className="favoritos-main-container">
      <h2 className="favoritos-title">Favoritos</h2>
      <div className="product-list">
        {favoritos.length === 0 ? (
          <p>No tienes productos favoritos aún.</p>
        ) : (
          favoritos.map((producto) => (
            <ProductCard
              key={producto.id}
              id={producto.id}
              title={producto.title}
              description={producto.description}
              categoria={producto.categoria}
              image={producto.image}
              images={producto.images}
              fechaPublicacion={producto.fechaPublicacion || producto.createdAt}
              provincia={producto.provincia || producto.ubicacion}
              ownerName={producto.ownerName}
              ownerId={producto.ownerId}
              condicion={producto.condicion}
              valorEstimado={producto.valorEstimado}
              disponible={producto.disponible}
              onConsultar={() => navigate(`/producto/${producto.id}`)}
              hideFavoriteButton
              showRemoveFavorite
              onRemoveFavorite={handleRemoveFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Favoritos;
