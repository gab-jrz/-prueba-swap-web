import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/RatingModal.css';

const RatingModal = ({ open, onClose, onSubmit, userName }) => {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll only while modal is open
  useEffect(() => {
    if (!open) return; // only lock when opening
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const handleStarClick = (star) => {
    setStars(star);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars < 1) {
      setError('Por favor, selecciona una calificación.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ stars, comment });
      setStars(0);
      setComment('');
      onClose();
    } catch (err) {
      setError('Error al enviar la calificación.');
    } finally {
      setLoading(false);
    }
  };

  const getStarsFeedback = () => {
    switch(stars) {
      case 1: return 'Muy insatisfecho';
      case 2: return 'Insatisfecho';
      case 3: return 'Neutral';
      case 4: return 'Satisfecho';
      case 5: return 'Muy satisfecho';
      default: return 'Selecciona tu calificación';
    }
  };

  const modalContent = (
    <div className="rating-modal-backdrop" onClick={onClose}>
      <div className="rating-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        
        <div className="rating-modal-header">
          <div className="rating-modal-icon">
            ⭐
          </div>
          <h2>Calificar a {userName}</h2>
          <p className="rating-modal-subtitle">
            Comparte tu experiencia de intercambio
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="stars-section">
            <label className="stars-label">¿Cómo fue tu experiencia?</label>
            <div className="stars-row">
              {[1,2,3,4,5].map(num => (
                <span
                  key={num}
                  className={`star ${num <= stars ? 'selected' : ''}`}
                  onClick={() => handleStarClick(num)}
                  role="button"
                  aria-label={`Calificar con ${num} estrella${num>1?'s':''}`}
                >★</span>
              ))}
            </div>
            <div className="stars-feedback">
              {getStarsFeedback()}
            </div>
          </div>

          <div className="comment-section">
            <label className="comment-label">Comentario adicional</label>
            <textarea
              className="rating-textarea"
              placeholder="Cuéntanos más sobre tu experiencia de intercambio..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || stars < 1}
            >
              {loading ? (
                <span className="submit-btn-loading">
                  <div className="loading-spinner"></div>
                  Enviando...
                </span>
              ) : (
                'Enviar calificación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalContent, document.body);
};

export default RatingModal;
