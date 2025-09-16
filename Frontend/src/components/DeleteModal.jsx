import React from 'react';
import '../styles/DeleteModal.css';

const DeleteModal = ({ isOpen, onClose, onConfirm, productTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Eliminar Producto</h2>
        <p>¿Estás seguro que deseas eliminar el producto "{productTitle}"?</p>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="modal-button confirm" onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal; 