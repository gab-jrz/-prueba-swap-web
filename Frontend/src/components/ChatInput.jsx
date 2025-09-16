import React, { useState, useRef } from 'react';
import { API_URL } from '../config';
import { FiImage, FiSend, FiX } from 'react-icons/fi';
import '../styles/ChatInput.css';
import '../styles/ChatInputPremium.css';

const ChatInput = ({ onSendMessage, currentUserId, recipientId, socket }) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !image) return;

    try {
      let imageUrl = null;
      
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Error al subir la imagen');
        const data = await response.json();
        imageUrl = data.imageUrl;
      }

      // Construir payload compatible con backend (/api/messages)
      const payload = {
        descripcion: message.trim(),
        imagenNombre: imageUrl || null,
        deId: currentUserId,
        paraId: recipientId,
        tipoPeticion: 'mensaje'
      };

      // Persistir primero por REST para asegurar consistencia con el backend
      const saveRes = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const errTxt = await saveRes.text();
        throw new Error(errTxt || 'Error al guardar el mensaje');
      }

      const savedMessage = await saveRes.json();

      // Emitir por socket si existe para tiempo real (no bloqueante)
      if (socket) {
        try { socket.emit('sendMessage', savedMessage); } catch {}
      }
      
      // Limpiar el formulario
      setMessage('');
      setImage(null);
      setImagePreview(null);
      
      // Llamar al callback si existe
      if (onSendMessage) onSendMessage(savedMessage);
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.match('image.*')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setImage(file);
    
    // Crear vista previa
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerStyle = {
    padding: '28px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.95) 50%, rgba(240, 245, 255, 0.92) 100%)',
    borderTop: '3px solid rgba(102, 126, 234, 0.4)',
    borderRadius: '0 0 28px 28px',
    boxShadow: '0 -20px 60px rgba(102, 126, 234, 0.18), 0 -12px 35px rgba(118, 75, 162, 0.12), 0 -6px 20px rgba(0, 0, 0, 0.1), inset 0 4px 0 rgba(255, 255, 255, 0.98), inset 0 -3px 0 rgba(102, 126, 234, 0.2)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    position: 'relative',
    overflow: 'hidden'
  };

  const inputGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(248, 250, 255, 0.97) 50%, rgba(240, 245, 255, 0.95) 100%)',
    borderRadius: '40px',
    padding: '18px 32px',
    boxShadow: '0 18px 55px rgba(102, 126, 234, 0.2), 0 10px 30px rgba(118, 75, 162, 0.15), 0 6px 16px rgba(0, 0, 0, 0.12), inset 0 4px 0 rgba(255, 255, 255, 0.98), inset 0 -3px 0 rgba(102, 126, 234, 0.18)',
    border: '4px solid rgba(102, 126, 234, 0.3)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const sendButtonStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5a67d8 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 15px 45px rgba(102, 126, 234, 0.45), 0 10px 25px rgba(118, 75, 162, 0.35), 0 6px 16px rgba(0, 0, 0, 0.18), inset 0 4px 0 rgba(255, 255, 255, 0.45), inset 0 -3px 0 rgba(0, 0, 0, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    outline: '4px solid rgba(255, 255, 255, 0.4)'
  };

  const imageButtonStyle = {
    cursor: 'pointer',
    padding: '14px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.12) 50%, rgba(102, 126, 234, 0.13) 100%)',
    border: '3px solid rgba(102, 126, 234, 0.25)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 22px rgba(102, 126, 234, 0.18), 0 4px 12px rgba(118, 75, 162, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)'
  };

  const messageInputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '16px 22px',
    fontSize: '17px',
    background: 'transparent',
    color: '#2d3748',
    fontWeight: 500,
    letterSpacing: '0.5px',
    lineHeight: 1.6,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textShadow: '0 1px 3px rgba(255, 255, 255, 0.9)'
  };

  return (
    <div className="chat-input-container" style={containerStyle}>
      {imagePreview && (
        <div className="image-preview" style={{
          position: 'relative',
          marginBottom: '20px',
          maxWidth: '240px',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '3px solid rgba(102, 126, 234, 0.25)',
          boxShadow: '0 12px 35px rgba(102, 126, 234, 0.18), 0 6px 20px rgba(118, 75, 162, 0.12), 0 3px 10px rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)'
        }}>
          <img src={imagePreview} alt="Vista previa" />
          <button type="button" onClick={removeImage} className="remove-image-btn" style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}>
            <FiX />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-group" style={inputGroupStyle}>
          <label htmlFor="image-upload" className="image-upload-label" style={imageButtonStyle}>
            <FiImage className="icon" style={{
              fontSize: '24px',
              color: 'rgba(102, 126, 234, 0.95)',
              filter: 'drop-shadow(0 3px 6px rgba(102, 126, 234, 0.35))',
              textShadow: '0 1px 3px rgba(255, 255, 255, 0.6)'
            }} />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
          </label>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="message-input"
            style={messageInputStyle}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
          />
          
          <button type="submit" className="send-button" style={sendButtonStyle} disabled={!message.trim() && !image}>
            <FiSend className="icon" style={{
              fontSize: '20px',
              color: 'white'
            }} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
