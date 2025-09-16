import { API_URL } from '../config';

class NotificationService {
  
  // Obtener notificaciones de un usuario
  static async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      const response = await fetch(`${API_URL}/notifications/${userId}?${params}`);
      if (!response.ok) {
        throw new Error('Error al obtener notificaciones');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // Obtener solo el conteo de notificaciones no leídas
  static async getUnreadCount(userId) {
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}?unreadOnly=true&limit=1`);
      if (!response.ok) {
        throw new Error('Error al obtener conteo de notificaciones');
      }
      
      const data = await response.json();
      return data.unreadCount || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones:', error);
      return 0;
    }
  }

  // Marcar una notificación como leída
  static async markAsRead(notificationId) {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  // Marcar todas las notificaciones como leídas
  static async markAllAsRead(userId) {
    try {
      const response = await fetch(`${API_URL}/notifications/user/${userId}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas las notificaciones como leídas');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  // Eliminar una notificación
  static async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }

      return await response.json();
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  // Actualizar configuraciones de notificaciones del usuario
  static async updateNotificationSettings(userId, settings) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificaciones: settings })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuraciones de notificaciones');
      }

      return await response.json();
    } catch (error) {
      console.error('Error actualizando configuraciones de notificaciones:', error);
      throw error;
    }
  }

  // Formatear notificación para mostrar
  static formatNotification(notification) {
    const timeAgo = this.getTimeAgo(new Date(notification.createdAt));
    
    return {
      ...notification,
      timeAgo,
      icon: this.getNotificationIcon(notification.type),
      color: this.getNotificationColor(notification.priority)
    };
  }

  // Obtener ícono según tipo de notificación
  static getNotificationIcon(type) {
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
  }

  // Obtener color según prioridad
  static getNotificationColor(priority) {
    const colors = {
      'low': '#6b7280',
      'medium': '#3b82f6',
      'high': '#ef4444'
    };
    return colors[priority] || colors.medium;
  }

  // Calcular tiempo transcurrido
  static getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
}

export default NotificationService;
