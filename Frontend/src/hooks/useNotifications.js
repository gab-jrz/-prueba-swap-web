import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/notificationService';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async (options = {}) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await NotificationService.getUserNotifications(userId, options);
      const formattedNotifications = data.notifications.map(
        notification => NotificationService.formatNotification(notification)
      );
      
      setNotifications(formattedNotifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Actualizar solo el conteo de no leídas
  const updateUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const count = await NotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error actualizando conteo:', err);
    }
  }, [userId]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // Actualizar conteo
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      setError(err.message);
      console.error('Error marcando como leída:', err);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await NotificationService.markAllAsRead(userId);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      
    } catch (err) {
      setError(err.message);
      console.error('Error marcando todas como leídas:', err);
    }
  }, [userId]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Actualizar estado local
      const notificationToDelete = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Si era no leída, actualizar conteo
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error eliminando notificación:', err);
    }
  }, [notifications]);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId, loadNotifications]);

  // Actualizar conteo periódicamente
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      updateUnreadCount();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [userId, updateUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    updateUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
};
