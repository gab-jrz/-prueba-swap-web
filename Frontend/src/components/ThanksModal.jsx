import React, { useEffect } from 'react';
import '../styles/ThanksModal.css';

const ThanksModal = ({
  isOpen,
  onClose,
  title = '¡Gracias!',
  message = 'Tu publicación se realizó con éxito.',
  autoDismissMs = 3000,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      onClose?.();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [isOpen, autoDismissMs, onClose]);

  if (!isOpen) return null;

  return (
    <div className="thanks-modal-overlay" role="dialog" aria-modal="true">
      <div className="thanks-modal-card">
        <div className="thanks-modal-icon">🎉</div>
        <h3 className="thanks-modal-title">{title}</h3>
        <p className="thanks-modal-message">{message}</p>
        <button className="thanks-modal-close" onClick={onClose} aria-label="Cerrar">
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ThanksModal;
