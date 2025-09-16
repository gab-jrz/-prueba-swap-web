import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import '../styles/NotificationDropdown.css';

const NotificationDropdown = ({ userId, isOpen, onClose, anchorRef, onAfterAction }) => {
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refresh 
  } = useNotifications(userId);

  // Calcular posición anclada al icono ANTES del primer paint del dropdown
  useLayoutEffect(() => {
    if (!isOpen) {
      setReady(false);
      setCoords(null);
      return;
    }
    const updatePosition = () => {
      const anchorEl = anchorRef?.current;
      if (!anchorEl) return;
      const rect = anchorEl.getBoundingClientRect();
      // El ancho está definido en CSS (460px, 340px en mobile). Usamos 460 como base segura.
      const cssWidth = Math.min(460, window.innerWidth - 16);
      const padding = 8;
      let left = rect.left + rect.width / 2 - cssWidth / 2;
      const viewportW = window.innerWidth;
      // Mantener dentro de viewport
      if (left + cssWidth + padding > viewportW) left = viewportW - cssWidth - padding;
      if (left < padding) left = padding;
      const top = rect.bottom + 12;
      setCoords({ top, left });
      setReady(true);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen, anchorRef]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer scroll de la ventana (evita que se quede abierto)
  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => onClose();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen, onClose]);

  // Refrescar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && userId) {
      refresh();
    }
  }, [isOpen, userId, refresh]);

  const handleNotificationClick = async (notification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      await markAsRead(notification._id);
      // Informar al padre para refrescar el badge
      if (typeof onAfterAction === 'function') onAfterAction();
    }

    // Routing según tipo de notificación
    const type = notification.type;
    const data = notification.data || {};

    // 1) Mensajes: ir al chat
    if (type?.includes('mensaje')) {
      navigate('/perfil', { state: { activeTab: 'mensajes' } });
    // 2) Solicitudes (donación o intercambio): ir al chat
    } else if (type === 'solicitud_donacion' || type === 'propuesta_intercambio') {
      navigate('/perfil', { state: { activeTab: 'mensajes' } });
    // 3) Intercambio finalizado: ir a Mis Intercambios
    } else if (type === 'cambio_estado' && data?.status === 'completed') {
      navigate('/perfil', { state: { activeTab: 'transacciones' } });
    // 4) Otros estados de intercambio: mantener Transacciones como destino por defecto
    } else if (type === 'cambio_estado' || type === 'intercambio_completado') {
      navigate('/perfil', { state: { activeTab: 'transacciones' } });
    } else if (notification.data?.productId) {
      navigate(`/producto/${notification.data.productId}`);
    } else if (notification.data?.donacionId) {
      navigate(`/donaciones/${notification.data.donacionId}`);
    }

    // Cerrar el dropdown tras navegar
    onClose && onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    if (typeof onAfterAction === 'function') onAfterAction();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    if (typeof onAfterAction === 'function') onAfterAction();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'mensaje_directo': '💬',
      'mensaje_intercambio': '🔄',
      'propuesta_intercambio': '🤝',
      'cambio_estado': '📋',
      'intercambio_completado': '✅',
      'nueva_calificacion': '⭐',
      'recordatorio': '⏰'
    };
    return icons[type] || '📢';
  };

  const getPriorityClass = (priority) => {
    return `notification-priority-${priority}`;
  };

  if (!isOpen || !ready || !coords) return null;

  return (
    <div
      className="notification-dropdown"
      ref={dropdownRef}
      style={{ position: 'fixed', top: coords.top, left: coords.left, visibility: ready ? 'visible' : 'hidden' }}
    >
      <div className="notification-header">
        <h4>Notificaciones</h4>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
            title="Marcar todas como leídas"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">
            <div className="loading-spinner"></div>
            <span>Cargando notificaciones...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <span className="no-notifications-icon">🔔</span>
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)} notification-type-${notification.type}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-title">
                  {notification.title}
                </div>
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {notification.timeAgo}
                </div>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <div className="unread-indicator" title="No leída"></div>
                )}
                <button
                  className="delete-notification-btn"
                  onClick={(e) => handleDeleteNotification(e, notification._id)}
                  title="Eliminar notificación"
                >
                  <FiTrash2 size={16} aria-label="Eliminar notificación" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 10 && (
        <div className="notification-footer">
          <button className="view-all-btn">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
