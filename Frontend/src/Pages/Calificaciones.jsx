import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import Header from "../components/Header.jsx";
import BackButton from "../components/BackButton.jsx";
import "../styles/Calificaciones.css";

const Star = ({ filled }) => (
  <span style={{ color: filled ? '#ffc107' : '#ccc' }}>★</span>
);

const Calificaciones = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [califs, setCalifs] = useState([]);
  const [userName, setUserName] = useState('');

  const fetchUserCalifs = async (targetId) => {
    if (!targetId) return;
    try {
      const res = await fetch(`${API_URL}/users/${targetId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const user = await res.json();
      setCalifs(Array.isArray(user.calificaciones) ? user.calificaciones : []);
      const first = user?.nombre || user?.name || user?.firstName || '';
      const last = user?.apellido || user?.lastName || '';
      const composed = `${first} ${last}`.trim();
      setUserName(composed || user?.username || user?.email || 'Usuario');
    } catch (err) {
      console.error('Error cargando calificaciones', err);
    }
  };

  useEffect(() => {
    fetchUserCalifs(id);
  }, [id]);

  useEffect(() => {
    // Escuchar eventos de nuevas calificaciones para este usuario
    const onNewRating = (e) => {
      const target = e?.detail?.userId;
      if (target && String(target) === String(id)) {
        fetchUserCalifs(id);
      }
    };
    window.addEventListener('calificacion:nueva', onNewRating);

    // Refrescar al volver al tab
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUserCalifs(id);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('calificacion:nueva', onNewRating);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [id]);

  return (
    <>
      <Header search={false} />
      <div className="calificaciones-page">
        <div className="calificaciones-container">
          <div className="navigation-bar">
            <BackButton className="icon-back-btn" to={-1} aria-label="Volver" />
            <div className="breadcrumb">
              <button className="breadcrumb-item" onClick={() => navigate('/')} aria-label="Ir a inicio" title="Inicio">
                <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30" aria-hidden="true">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </button>
            </div>
          </div>
          
          <h2 className="calificaciones-title">Calificaciones de {userName}</h2>
          
          {califs.length === 0 ? (
            <div className="no-calificaciones">
              <div className="no-calificaciones-icon">⭐</div>
              <div className="no-calificaciones-text">Aún no tiene calificaciones</div>
            </div>
          ) : (
            <table className="calificaciones-table">
              <thead>
                <tr>
                  <th>Calificador</th>
                  <th>Rating</th>
                  <th>Fecha</th>
                  <th>Intercambio</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {califs.slice().reverse().map((c, idx) => {
                  // Componer nombre del calificador con preferencia Nombre Apellido
                  const first = c.deNombre || c.deFirstName || '';
                  const last = c.deApellido || c.deLastName || '';
                  let composed = `${first} ${last}`.trim();

                  if (!composed) {
                    const full = c.deNombreCompleto || c.deUsuario || '';
                    // Intentar normalizar "Apellido, Nombre" o "Apellido Nombre"
                    if (full.includes(',')) {
                      const [ap, nom] = full.split(',').map(s => s.trim());
                      composed = `${nom} ${ap}`.trim();
                    } else {
                      const parts = full.split(/[\s]+/).filter(Boolean);
                      if (parts.length >= 2) {
                        // Asumir que viene como Apellido Nombre y lo invertimos
                        composed = `${parts.slice(1).join(' ')} ${parts[0]}`.trim();
                      } else {
                        composed = full || 'Usuario';
                      }
                    }
                  }

                  return (
                    <tr key={idx}>
                      <td>
                        {c.deId ? (
                          <Link to={`/perfil/${c.deId}`} className="calificador-link calificador-nowrap" title={composed}>
                            {composed}
                          </Link>
                        ) : (
                          <span className="calificador-nowrap" title={composed}>{composed}</span>
                        )}
                      </td>
                      <td>
                        <span className="rating-stars">
                          {[1, 2, 3, 4, 5].map(v => <Star key={v} filled={c.rating >= v} />)}
                        </span>
                      </td>
                      <td>{c.fecha ? new Date(c.fecha).toLocaleDateString() : '-'}</td>
                      <td>
                        {c.productoOfrecido && c.productoSolicitado ? (
                          <span className="intercambio-inline" title={`${c.productoOfrecido} ↔ ${c.productoSolicitado}`}>
                            <span className="intercambio-name" title={c.productoOfrecido}>
                              {c.productoOfrecido}
                            </span>
                            <span className="intercambio-icon">↔</span>
                            <span className="intercambio-name" title={c.productoSolicitado}>
                              {c.productoSolicitado}
                            </span>
                          </span>
                        ) : (
                          <span className="intercambio-badge intercambio-empty">
                            Sin datos
                          </span>
                        )}
                      </td>
                      <td>
                        {(c.comentario || c.comment) ? (
                          <div className="comentario-container">
                            <span className="comentario-text">
                              {(c.comentario || c.comment).length > 50 ? 
                                `${(c.comentario || c.comment).substring(0, 50)}...` : 
                                (c.comentario || c.comment)
                              }
                            </span>
                            {(c.comentario || c.comment).length > 50 && (
                              <button 
                                className="comentario-expand"
                                onClick={() => {
                                  const element = document.getElementById(`comentario-${idx}`);
                                  const button = document.getElementById(`btn-${idx}`);
                                  if (element.style.display === 'none') {
                                    element.style.display = 'block';
                                    button.textContent = 'Ver menos';
                                  } else {
                                    element.style.display = 'none';
                                    button.textContent = 'Ver más';
                                  }
                                }}
                                id={`btn-${idx}`}
                              >
                                Ver más
                              </button>
                            )}
                            {(c.comentario || c.comment).length > 50 && (
                              <div 
                                id={`comentario-${idx}`} 
                                className="comentario-full"
                                style={{display: 'none'}}
                              >
                                {c.comentario || c.comment}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="comentario-empty">Sin comentario</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Calificaciones;
