import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/ChatBubble.css';
import Notification from './Notification';
import { API_URL } from '../config';

// API_URL centralizado desde config.js

const ChatBubble = ({
  mensaje,
  fromMe,
  currentUserId,
  onRefresh,
  onDeleteMessage,
  confirmExchange,
  productoTitle,
  productoOfrecido,
  isEditing,
  editText,
  onEditTextChange,
  onEditCancel,
  onEditSave,
  socket,
  scrollToBottom,
  senderProfileImage,
  currentUserProfileImage
  ,
  isFirstMessageInChat
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [imageError, setImageError] = useState(false); // Estado para manejar errores de imagen
  const [profileImage, setProfileImage] = useState(fromMe ? (currentUserProfileImage || '/images/fotoperfil.jpg') : (senderProfileImage || '/images/fotoperfil.jpg'));
  // Preview de producto (para ofertas/intercambios)
  const [productPreview, setProductPreview] = useState({ title: null, imageUrl: null, id: null });

  // Render especial para mensajes del sistema
  if (mensaje.system) {
    return (
      <div style={{width:'100%',display:'flex',justifyContent:'center',margin:'10px 0'}}>
        <div style={{background:'#e9ecef',color:'#555',padding:'6px 14px',borderRadius:14,fontSize:13,fontWeight:500,boxShadow:'0 1px 2px #0001'}}>
          {mensaje.descripcion}
        </div>
      </div>
    );
  }
  const bubbleRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0, visible: false });
  const menuRef = useRef(null);
  
  // Efecto para configurar los listeners de socket
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage) => {
      if (newMessage.sender !== currentUserId) {
        showNotification(`Nuevo mensaje de ${newMessage.senderName}`, 'info');
      }
      if (onRefresh) onRefresh();
    };

  // Cerrar menú contextual en click afuera, Escape, scroll o resize
  useEffect(() => {
    if (!(showMenu && menuPos.visible)) return;

    const handleClick = (e) => {
      // Si el click no es dentro del menú, cerrar
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setMenuPos((p) => ({ ...p, visible: false }));
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setMenuPos((p) => ({ ...p, visible: false }));
      }
    };
    const handleScrollOrResize = () => {
      setShowMenu(false);
      setMenuPos((p) => ({ ...p, visible: false }));
    };

    document.addEventListener('mousedown', handleClick, true);
    window.addEventListener('keydown', handleKey, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      window.removeEventListener('keydown', handleKey, true);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
    };
  }, [showMenu, menuPos.visible]);
    
    const handleExchangeConfirmed = (data) => {
      if (data.userId === currentUserId) {
        showNotification('¡Intercambio confirmado!', 'success');
      }
    };
    
    socket.on('newMessage', handleNewMessage);
    socket.on('exchangeConfirmed', handleExchangeConfirmed);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('exchangeConfirmed', handleExchangeConfirmed);
    };
  }, [socket, currentUserId, onRefresh]);
  
  const showNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };
  
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const [localRating, setLocalRating] = React.useState(null);

  // Título del producto (sin imagen) derivado para cualquier mensaje
  const productTitleText = React.useMemo(() => {
    if (mensaje?.tipoPeticion === 'donacion') return null;
    // Derecha (fromMe): mostrar el producto consultado (productoTitle)
    // Izquierda: mostrar lo ofrecido (productoOfrecido)
    const t = fromMe
      ? (mensaje?.productoTitle || mensaje?.productoOfrecido)
      : (mensaje?.productoOfrecido || mensaje?.productoTitle);
    return typeof t === 'string' && t.trim().length > 0 ? t : null;
  }, [mensaje?.tipoPeticion, mensaje?.productoTitle, mensaje?.productoOfrecido, fromMe]);

  // Determinar si este mensaje es la SOLICITUD INICIAL de oferta ("[propuesta]")
  const isInitialOffer = React.useMemo(() => {
    const raw = (mensaje?.descripcion || '').trim().toLowerCase();
    return raw === '[propuesta]' || mensaje?.esSolicitudOferta === true || mensaje?.isOfferInit === true;
  }, [mensaje?.descripcion, mensaje?.esSolicitudOferta, mensaje?.isOfferInit]);

  // Solo considerar preview si es el primer mensaje del chat cuando se indique el prop
  const firstInChat = React.useMemo(() => {
    return typeof isFirstMessageInChat === 'boolean' ? isFirstMessageInChat : true;
  }, [isFirstMessageInChat]);

  // ID de producto candidato (sirve para navegar al detalle incluso en mensajes posteriores)
  const candidateProductId = React.useMemo(() => {
    return mensaje?.productoOfrecidoId || mensaje?.productoId || productPreview?.id || null;
  }, [mensaje?.productoOfrecidoId, mensaje?.productoId, productPreview?.id]);

  // Navegar solo si el producto sigue disponible (no intercambiado)
  const openProductIfAvailable = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const p = await res.json();
      if (p && p.intercambiado === false) {
        navigate(`/producto/${id}`, {
          state: { fromChat: true, backTo: '/perfil', backState: { activeTab: 'mensajes' } }
        });
      } else {
        showNotification('Este producto ya no está disponible para ver.', 'info');
      }
    } catch (e) {
      showNotification('Este producto ya no está disponible para ver.', 'info');
    }
  };

  // Cargar datos mínimos del producto asociado SOLO para la solicitud inicial (no donación)
  useEffect(() => {
    if (mensaje?.tipoPeticion === 'donacion' || !isInitialOffer || !firstInChat) {
      // No mostrar preview en donaciones ni en mensajes posteriores
      setProductPreview({ title: null, imageUrl: null, id: null });
      return;
    }
    // Priorizar IDs para obtener imagen desde backend de forma alineada al lado
    // Derecha (fromMe): consultado => productoId / productoTitle
    // Izquierda: ofrecido => productoOfrecidoId / productoOfrecido
    const candidateId = fromMe
      ? (mensaje?.productoId || mensaje?.productoOfrecidoId || null)
      : (mensaje?.productoOfrecidoId || mensaje?.productoId || null);
    const candidateTitle = fromMe
      ? (mensaje?.productoTitle || mensaje?.productoOfrecido)
      : (mensaje?.productoOfrecido || mensaje?.productoTitle);
    const title = typeof candidateTitle === 'string' && candidateTitle.trim().length > 0 ? candidateTitle : null;
    if (!candidateId) {
      // Sin ID, solo título (igual se muestra en la tarjeta compacta)
      setProductPreview({ title, imageUrl: null, id: null });
      return;
    }
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/products/${candidateId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = await res.json();
        const rawImg = (Array.isArray(p.images) && p.images[0]) || p.imagen || p.imagenPrincipal || null;
        let imageUrl = null;
        if (typeof rawImg === 'string' && rawImg) {
          if (/^https?:|^data:|^blob:/i.test(rawImg)) {
            imageUrl = rawImg;
          } else {
            const base = API_URL.replace('/api', '');
            imageUrl = rawImg.startsWith('/') ? `${base}${rawImg}` : `${base}/${rawImg}`;
          }
        }
        if (!aborted) setProductPreview({ title: (p.title || p.nombre || title || ''), imageUrl, id: candidateId });
      } catch (e) {
        if (!aborted) setProductPreview({ title, imageUrl: null, id: candidateId });
      }
    })();
    return () => { aborted = true; };
  }, [mensaje?.tipoPeticion, isInitialOffer, firstInChat, mensaje?.productoId, mensaje?.productoOfrecidoId, mensaje?.productoTitle, mensaje?.productoOfrecido, fromMe]);

  const handleConfirmExchange = async () => {
    try {
      const response = await fetch(`${API_URL}/messages/${mensaje._id}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (socket) {
          socket.emit('confirmExchange', {
            messageId: mensaje._id,
            userId: currentUserId,
            recipientId: fromMe ? mensaje.receiver : mensaje.sender
          });
        }
        showNotification('Intercambio confirmado exitosamente', 'success');
        if (onRefresh) onRefresh();
      } else {
        throw new Error('Error al confirmar el intercambio');
      }
    } catch (err) {
      console.error('Error confirmando intercambio', err);
      showNotification('Error al confirmar el intercambio', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar mensaje?')) return;
    try {
      const res = await fetch(`${API_URL}/messages/${mensaje._id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Mensaje eliminado', 'success');
        if (onRefresh) onRefresh();
      } else {
        throw new Error('Error eliminando');
      }
    } catch (err) {
      console.error('Error eliminando mensaje', err);
      showNotification('No se pudo eliminar', 'error');
    }
  };

  const handleRate = async (value) => {
    setLocalRating(value);
    try {
      const res = await fetch(`${API_URL}/messages/${mensaje._id}/rating`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value, raterId: currentUserId }),
      });
      if (res.ok) {
        mensaje.rating = value;
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error enviando rating', err);
    }
  };

  // Derivar nombre "otro" de forma consistente con los campos del mensaje
  const displayName = fromMe
    ? 'Yo'
    : (mensaje.deId !== currentUserId
        ? (mensaje.deNombre || mensaje.de || 'Usuario')
        : (mensaje.paraNombre || mensaje.para || 'Usuario'));
  const targetProfileId = fromMe
    ? null
    : (mensaje.deId !== currentUserId ? mensaje.deId : mensaje.paraId);

  const handleImageError = () => {
    setImageError(true);
    setProfileImage('/images/fotoperfil.jpg');
  };

  // Texto a mostrar: si es solicitud de donación, quitar prefijo "SOLICITUD DE DONACIÓN:"
  const descriptionToShow = React.useMemo(() => {
    let raw = mensaje?.descripcion || '';
    // Ocultar placeholders usados para cumplir esquema del backend
    // - "[imagen]": mensajes solo con imagen
    // - "[propuesta]": mensajes que solo mantienen contexto de producto/oferta
    const trimmed = (raw || '').trim().toLowerCase();
    if (trimmed === '[imagen]' || trimmed === '[propuesta]') {
      return '';
    }
    if (mensaje?.tipoPeticion === 'donacion') {
      raw = raw.replace(/^\s*SOLICITUD DE DONACIÓN:\s*/i, '');
      // quitar saltos de línea iniciales sobrantes
      raw = raw.replace(/^\s*\n+/, '');
      // Mantener solo desde 'Mensaje del interesado:' si existe
      if (/Mensaje del interesado:/i.test(raw)) {
        raw = raw.replace(/^[\s\S]*?(?=Mensaje del interesado:)/i, '');
      }
      // Eliminar footer: separadores, 'Enviado por ...' y cualquier cosa después
      raw = raw.replace(/\n?---[\s\S]*$/i, '');
      raw = raw.replace(/\n?Enviado por[\s\S]*$/i, '');
      // Limpieza final de espacios extra al inicio/fin
      raw = raw.replace(/^\s+/, '').replace(/\s+$/, '');
      return raw;
    }
    return raw;
  }, [mensaje?.descripcion, mensaje?.tipoPeticion]);

  // Parsear secciones específicas para donación en dos burbujas
  const donationParsed = React.useMemo(() => {
    if (mensaje?.tipoPeticion !== 'donacion') return null;
    const text = descriptionToShow || '';
    const msgMatch = text.match(/Mensaje del interesado:\s*([\s\S]*?)(?:\n{2,}|\n?Razón del interés:|$)/i);
    const reasonMatch = text.match(/Razón del interés:\s*([\s\S]*)$/i);
    const message = (msgMatch && msgMatch[1] ? msgMatch[1].trim() : '').trim();
    const reasonRaw = (reasonMatch && reasonMatch[1] ? reasonMatch[1] : '').trim();
    // Extraer campos opcionales
    const phoneMatch = text.match(/Tel[eé]fono de contacto:\s*(.+)/i);
    const availabilityMatch = text.match(/Disponibilidad(?:\s+para\s+recoger)?:\s*(.+)/i);
    const telefono = phoneMatch ? phoneMatch[1].trim() : '';
    const disponibilidad = availabilityMatch ? availabilityMatch[1].trim() : '';
    // Limpiar razón quitando líneas de teléfono y disponibilidad
    const reason = reasonRaw
      .split(/\n+/)
      .filter(l => !/^\s*Tel[eé]fono de contacto:/i.test(l) && !/^\s*Disponibilidad(?:\s+para\s+recoger)?:/i.test(l))
      .join('\n')
      .trim();
    return { message, reason, telefono, disponibilidad };
  }, [mensaje?.tipoPeticion, descriptionToShow]);

  // Formatear líneas específicas dentro de la razón para resaltar etiquetas
  const renderFormattedReason = React.useCallback((text) => {
    if (!text) return null;
    const lines = String(text).split(/\n+/);
    return (
      <>
        {lines.map((line, idx) => {
          const tel = line.match(/^\s*Tel[eé]fono de contacto:\s*(.*)$/i);
          if (tel) {
            return (
              <div key={`r-${idx}`}>
                <strong>Teléfono de contacto:</strong> {tel[1]}
              </div>
            );
          }
          const disp = line.match(/^\s*Disponibilidad(?:\s+para\s+recoger)?:\s*(.*)$/i);
          if (disp) {
            return (
              <div key={`r-${idx}`}>
                <strong>Disponibilidad para recoger:</strong> {disp[1]}
              </div>
            );
          }
          return <div key={`r-${idx}`}>{line}</div>;
        })}
      </>
    );
  }, []);

  return (
    <div
      className={`chat-bubble-wrapper ${fromMe ? 'me' : 'other'}`}
      style={{
        display: 'flex',
        flexDirection: fromMe ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 8,
      }}
    >
      {/* Foto de perfil del remitente */}
      <div
        style={{
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        <img
          className="chat-profile-image"
          src={profileImage}
          alt={displayName}
          onError={handleImageError}
        />
      </div>
      
      {/* Contenedor del mensaje */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: fromMe ? 'flex-end' : 'flex-start',
          maxWidth: 'calc(100% - 48px)',
          flex: 1,
        }}
      >
        <span
          className="chat-sender"
          style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 4,
            fontWeight: 500,
            paddingLeft: fromMe ? 0 : 4,
            paddingRight: fromMe ? 4 : 0,
            cursor: fromMe ? 'default' : 'pointer',
            textDecoration: fromMe ? 'none' : 'underline',
          }}
          onClick={() => {
            if (!fromMe && targetProfileId) {
              navigate(`/perfil/${targetProfileId}`, { state: { fromChat: true } });
            }
          }}
        >
          {displayName}
        </span>
      <div
        className={`chat-bubble ${fromMe ? 'me' : 'other'}`}
        style={{
          background: fromMe ? '#f8fafc' : '#e1e9f0',
          color: '#23272f',
          borderRadius: 18,
          padding: (mensaje.imagen || mensaje.imagenNombre || mensaje.imagenDonacion) ? '8px 10px 6px 10px' : '10px 16px',
          maxWidth: 320,
          minWidth: 60,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          position: 'relative',
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          cursor: 'context-menu',
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (fromMe && !mensaje.system) {
            // Posicionar menú cerca del cursor y mostrar como portal global
            setMenuPos({ x: e.clientX, y: e.clientY, visible: true });
            setShowMenu(true);
          }
        }}
      >
        {/* Imagen si hay (para mensajes normales o si se adjunta explícitamente) */}
        { (!mensaje.tipoPeticion || mensaje.tipoPeticion !== 'donacion') && (mensaje.imagenNombre || mensaje.imagen || mensaje.imagenDonacion) && (() => {
            const raw = mensaje.imagenNombre || mensaje.imagen || mensaje.imagenDonacion;
            let src = raw;
            // Si viene como path relativo (ej: /uploads/...), usar tal cual; si es dataURL o blob también funciona directo
            // Evitar undefined
            if (typeof raw === 'string') {
              src = raw;
            }
            return (
              <img
                src={src}
                alt="imagen adjunta"
                style={{
                  maxWidth: 220,
                  maxHeight: 220,
                  borderRadius: 10,
                  marginBottom: descriptionToShow ? 8 : 0,
                  background: '#eee',
                  objectFit: 'cover',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                }}
              />
            );
          })()
        }

        {/* Render especial para solicitudes de donación */}
        {mensaje.tipoPeticion === 'donacion' && (
          <>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fdf2f8',
                border: '1.5px solid #fb7185',
                color: '#be123c',
                padding: '6px 12px',
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                fontFamily: 'inherit'
              }}>
                <span role="img" aria-label="heart">❤️</span>
                <span>Solicitud de Donación</span>
              </div>
            </div>
            {mensaje.imagenDonacion && (() => {
              const raw = mensaje.imagenDonacion;
              let src = raw;
              if (typeof raw === 'string' && !/^https?:|^data:|^blob:/i.test(raw)) {
                const base = API_URL.replace('/api', '');
                src = raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
              }
              return (
                <img
                  src={src}
                  alt={mensaje.donacionTitle || 'Donación'}
                  style={{ width: '100%', height: 'auto', borderRadius: 10, display: 'block' }}
                />
              );
            })()}
          </>
        )}
        {/* Texto */}
        {(descriptionToShow && isEditing) ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            padding: '12px 16px',
            width: '100%',
            maxWidth: 320,
            minWidth: 60,
            alignSelf: 'flex-start',
          }}>
            <textarea
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              style={{
                fontSize: 15,
                minHeight: 36,
                maxHeight: 90,
                resize: 'vertical',
                border: '1.5px solid #bbb',
                borderRadius: 8,
                padding: '8px',
                width: '100%',
                background: '#fff',
                color: '#23272f',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onEditSave();
                }
                if (e.key === 'Escape') onEditCancel();
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                style={{
                  background: '#00bcd4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 15
                }}
                onClick={onEditSave}
              >
                Guardar
              </button>
              <button
                style={{
                  background: '#f4f4f4',
                  color: '#23272f',
                  border: '1px solid #bbb',
                  borderRadius: 6,
                  padding: '5px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 15
                }}
                onClick={onEditCancel}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : descriptionToShow ? (
          mensaje.tipoPeticion === 'donacion' ? (
            <div style={{ width: '100%', marginTop: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donationParsed && (donationParsed.message || donationParsed.reason) ? (
                <>
                  {donationParsed.message ? (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #dbeafe',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      color: '#0f172a',
                      fontSize: 15,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      fontFamily: 'inherit'
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8', marginBottom: 6, fontFamily: 'inherit' }}>Mensaje del interesado</div>
                      {donationParsed.message}
                    </div>
                  ) : null}
                  {donationParsed.reason ? (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #fde68a',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      color: '#0f172a',
                      fontSize: 15,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      fontFamily: 'inherit'
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#b45309', marginBottom: 6, fontFamily: 'inherit' }}>Razón del interés</div>
                      {donationParsed.reason}
                    </div>
                  ) : null}
                  {donationParsed.telefono ? (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #bbf7d0',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      color: '#0f172a',
                      fontSize: 15,
                      lineHeight: 1.5,
                      fontFamily: 'inherit'
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#047857', marginBottom: 6, fontFamily: 'inherit' }}>Teléfono de contacto</div>
                      <div>{donationParsed.telefono}</div>
                    </div>
                  ) : null}
                  {donationParsed.disponibilidad ? (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #c7d2fe',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      color: '#0f172a',
                      fontSize: 15,
                      lineHeight: 1.5,
                      fontFamily: 'inherit'
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#4338ca', marginBottom: 6, fontFamily: 'inherit' }}>Disponibilidad para recoger</div>
                      <div>{donationParsed.disponibilidad}</div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '10px 12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  color: '#111827',
                  fontSize: 15,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line'
                }}>
                  {descriptionToShow}
                </div>
              )}
            </div>
          ) : (
            <p
              className="chat-text"
              style={{
                margin: 0,
                fontSize: 15,
                whiteSpace: 'pre-line',
              }}
            >
              {descriptionToShow}
            </p>
          )
        ) : null}

        {/* Preview compacto del producto ofrecido: SOLO en la solicitud inicial y si es el primer mensaje del chat */}
        {mensaje.tipoPeticion !== 'donacion' && isInitialOffer && firstInChat && (productPreview.title || mensaje.donacionTitle) ? (
          <div style={{ width: '100%', marginTop: 6, marginBottom: 6 }}>
            {mensaje.donacionTitle ? (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#fce4ec', color: '#c2185b', borderRadius: 7,
                  padding: '2px 10px', fontWeight: 700, fontSize: 13,
                  boxShadow: '0 1px 2px #0001', border: '1.5px solid #e91e63',
                  maxWidth: 230, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}
              >
                {`❤️ ${mensaje.donacionTitle}`}
              </span>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: fromMe ? '#e0f7fa' : '#ffe0b2',
                border: fromMe ? '1.5px solid #00bcd4' : '1.5px solid #ffb300',
                borderRadius: 10, padding: '6px 8px', boxShadow: '0 1px 2px #0001',
                maxWidth: 320,
                cursor: candidateProductId ? 'pointer' : 'default'
              }}
                role={candidateProductId ? 'button' : undefined}
                title={candidateProductId ? 'Ver detalle del producto' : undefined}
                onClick={() => {
                  if (candidateProductId) {
                    openProductIfAvailable(candidateProductId);
                  }
                }}
              >
                {productPreview.imageUrl ? (
                  <img src={productPreview.imageUrl} alt={productPreview.title || 'Producto'} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', background: '#eee' }} />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontWeight: 700 }}>📦</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
                    {productPreview.title || (fromMe ? mensaje.productoOfrecido : mensaje.productoTitle) || 'Producto'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Badge de título de producto para mensajes posteriores (sin imagen) */}
        {mensaje.tipoPeticion !== 'donacion' && (!isInitialOffer || !firstInChat) && productTitleText ? (
          <div style={{ width: '100%', marginTop: 6, marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: fromMe ? '#e0f2fe' : '#f1f5f9',
                color: fromMe ? '#075985' : '#334155',
                borderRadius: 7,
                padding: '2px 10px', fontWeight: 700, fontSize: 13,
                boxShadow: '0 1px 2px #0001', border: '1.5px solid #93c5fd',
                maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                cursor: candidateProductId ? 'pointer' : 'default'
              }}
              title={productTitleText}
              onClick={() => {
                if (candidateProductId) {
                  openProductIfAvailable(candidateProductId);
                }
              }}
            >
              {productTitleText}
            </span>
          </div>
        ) : null}

        {/* Fecha */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 4, justifyContent: 'space-between' }}>
          <span className="chat-meta" style={{ fontSize: 12, color: fromMe ? '#008ba3' : '#444', fontWeight: 500, letterSpacing: 0.1, background:'#fff', borderRadius:5, padding:'1px 8px', boxShadow:'0 1px 6px #0001' }}>{new Date(mensaje.fecha).toLocaleString()}</span>
        </div>

        {/* Menú contextual global para mensajes propios */}
        {showMenu && fromMe && menuPos.visible && ReactDOM.createPortal((() => {
          const menuWidth = 200;
          const menuHeight = 100;
          const padding = 8;
          let left = menuPos.x;
          let top = menuPos.y;
          if (left + menuWidth + padding > window.innerWidth) left = Math.max(8, window.innerWidth - menuWidth - padding);
          if (top + menuHeight + padding > window.innerHeight) top = Math.max(8, window.innerHeight - menuHeight - padding);

          return (
            <div
              style={{
                position: 'fixed',
                top,
                left,
                zIndex: 9999,
                minWidth: menuWidth,
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: 10,
                boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: 0
              }}
              role="menu"
              ref={menuRef}
            >
              <div
                style={{ padding:'13px 22px', cursor:'pointer', color:'#1976d2', fontWeight:600, fontSize:15 }}
                onClick={() => {
                  onRefresh && onRefresh('edit', mensaje._id || mensaje.id);
                  setShowMenu(false);
                  setMenuPos(p => ({ ...p, visible: false }));
                }}
              >
                Editar mensaje
              </div>
              <div style={{height:1,background:'#eee',margin:'0 12px'}}/>
              <div
                style={{ padding:'13px 22px', cursor:'pointer', color:'#dc3545', fontWeight:600, fontSize:15 }}
                onClick={() => {
                  onDeleteMessage && onDeleteMessage(mensaje);
                  setShowMenu(false);
                  setMenuPos(p => ({ ...p, visible: false }));
                }}
              >
                Eliminar mensaje
              </div>
            </div>
          );
        })(), document.body)}

        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatBubble, (prevProps, nextProps) => {
  // Solo re-renderizar si estos props cambian
  return (
    prevProps.mensaje._id === nextProps.mensaje._id &&
    prevProps.mensaje.descripcion === nextProps.mensaje.descripcion &&
    prevProps.mensaje.imagenNombre === nextProps.mensaje.imagenNombre &&
    prevProps.mensaje.imagen === nextProps.mensaje.imagen &&
    prevProps.fromMe === nextProps.fromMe &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editText === nextProps.editText &&
    prevProps.senderProfileImage === nextProps.senderProfileImage &&
    prevProps.currentUserProfileImage === nextProps.currentUserProfileImage &&
    prevProps.isFirstMessageInChat === nextProps.isFirstMessageInChat
  );
});