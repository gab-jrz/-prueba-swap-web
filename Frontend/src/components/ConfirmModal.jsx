import React from 'react';
import ReactDOM from 'react-dom';
import '../styles/ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, children }) => {
  if (!isOpen) return null;

  const modal = (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Ícono de advertencia */}
        <div className="modal-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Título */}
        <h2 className="modal-title">{title || 'Confirmar Acción'}</h2>
        
        {/* Mensaje */}
        <p className="modal-message">{message}</p>
        
        {/* Detalles adicionales si existen */}
        {children && <div className="confirm-modal-details">{children}</div>}
        
        {/* Botones de acción */}
        <div className="confirm-modal-actions">
          <button type="button" onClick={onCancel} className="btn-cancel-modern">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="btn-confirm-modern">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar como portal para evitar que el overlay quede limitado por contenedores
  return ReactDOM.createPortal(modal, document.body);
};

export default ConfirmModal;


