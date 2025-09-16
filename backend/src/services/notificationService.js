import { createNotification } from '../routes/notifications.js';
import User from '../models/User.js';

class NotificationService {
  
  // Notificación por nuevo mensaje directo
  static async notifyNewMessage(messageData) {
    try {
      // Verificar configuración del usuario receptor
      const receptor = await User.findOne({ id: messageData.paraId });
      if (!receptor || !receptor.notificaciones?.mensajes?.directos) return;

      await createNotification({
        userId: messageData.paraId,
        type: 'mensaje_directo',
        title: 'Nuevo mensaje',
        message: `${messageData.de} te ha enviado un mensaje`,
        data: {
          messageId: messageData._id,
          senderId: messageData.deId,
          senderName: messageData.de,
          productTitle: messageData.productoTitle
        },
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error notificando nuevo mensaje:', error);
    }
  }

  // Notificación por mensaje de intercambio
  static async notifyExchangeMessage(messageData) {
    try {
      const receptor = await User.findOne({ id: messageData.paraId });
      if (!receptor || !receptor.notificaciones?.mensajes?.intercambio) return;

      await createNotification({
        userId: messageData.paraId,
        type: 'mensaje_intercambio',
        title: 'Mensaje de intercambio',
        message: `${messageData.de} ha enviado un mensaje sobre el intercambio`,
        data: {
          messageId: messageData._id,
          senderId: messageData.deId,
          senderName: messageData.de,
          productTitle: messageData.productoTitle,
          offeredProduct: messageData.productoOfrecido
        },
        priority: 'high'
      });
    } catch (error) {
      console.error('Error notificando mensaje de intercambio:', error);
    }
  }

  // Notificación por nueva propuesta de intercambio
  static async notifyNewExchangeProposal(messageData) {
    try {
      const receptor = await User.findOne({ id: messageData.paraId });
      if (!receptor || !receptor.notificaciones?.intercambios?.propuestas) return;

      await createNotification({
        userId: messageData.paraId,
        type: 'propuesta_intercambio',
        title: '¡Nueva propuesta de intercambio!',
        message: `${messageData.de} quiere intercambiar "${messageData.productoOfrecido}" por "${messageData.productoTitle}"`,
        data: {
          messageId: messageData._id,
          senderId: messageData.deId,
          senderName: messageData.de,
          requestedProduct: messageData.productoTitle,
          offeredProduct: messageData.productoOfrecido
        },
        priority: 'high'
      });
    } catch (error) {
      console.error('Error notificando propuesta de intercambio:', error);
    }
  }

  // Notificación por nueva solicitud de donación
  static async notifyNewDonationRequest(messageData) {
    try {
      const receptor = await User.findOne({ id: messageData.paraId });
      if (!receptor || !receptor.notificaciones?.donaciones?.solicitudes) return;

      await createNotification({
        userId: messageData.paraId,
        type: 'solicitud_donacion',
        title: '¡Nueva solicitud de donación!',
        message: `${messageData.de} está interesado en tu donación "${messageData.donacionTitle}"`,
        data: {
          messageId: messageData._id,
          senderId: messageData.deId,
          senderName: messageData.de,
          donacionTitle: messageData.donacionTitle,
          donacionId: messageData.donacionId
        },
        priority: 'high'
      });
    } catch (error) {
      console.error('Error notificando solicitud de donación:', error);
    }
  }

  // Notificación por cambio de estado en intercambio
  static async notifyExchangeStatusChange(userId, status, exchangeData) {
    try {
      const usuario = await User.findOne({ id: userId });
      if (!usuario || !usuario.notificaciones?.intercambios?.cambiosEstado) return;

      let title, message;
      switch (status) {
        case 'confirmed':
          title = 'Intercambio confirmado';
          message = `El intercambio de "${exchangeData.productTitle}" ha sido confirmado`;
          break;
        case 'completed':
          title = '¡Intercambio completado!';
          message = `El intercambio de "${exchangeData.productTitle}" se ha completado exitosamente`;
          break;
        default:
          title = 'Cambio en intercambio';
          message = `Ha habido un cambio en el intercambio de "${exchangeData.productTitle}"`;
      }

      await createNotification({
        userId,
        type: 'cambio_estado',
        title,
        message,
        data: {
          exchangeId: exchangeData.messageId,
          status,
          productTitle: exchangeData.productTitle,
          otherUserId: exchangeData.otherUserId,
          otherUserName: exchangeData.otherUserName
        },
        priority: status === 'completed' ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error notificando cambio de estado:', error);
    }
  }

  // Notificación por nueva calificación recibida
  static async notifyNewRating(ratingData) {
    try {
      const receptor = await User.findOne({ id: ratingData.paraId });
      if (!receptor || !receptor.notificaciones?.calificaciones) return;

      const stars = '⭐'.repeat(ratingData.rating);
      
      await createNotification({
        userId: ratingData.paraId,
        type: 'nueva_calificacion',
        title: 'Nueva calificación recibida',
        message: `${ratingData.deNombre} te ha calificado con ${stars} (${ratingData.rating}/5)`,
        data: {
          raterId: ratingData.deId,
          raterName: ratingData.deNombre,
          rating: ratingData.rating,
          comment: ratingData.comentario,
          productOffered: ratingData.productoOfrecido,
          productRequested: ratingData.productoSolicitado
        },
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error notificando nueva calificación:', error);
    }
  }

  // Notificación recordatorio para calificar
  static async notifyRatingReminder(userId, exchangeData) {
    try {
      const usuario = await User.findOne({ id: userId });
      if (!usuario || !usuario.notificaciones?.recordatorios) return;

      await createNotification({
        userId,
        type: 'recordatorio',
        title: 'Recordatorio: Califica tu intercambio',
        message: `No olvides calificar tu intercambio de "${exchangeData.productTitle}" con ${exchangeData.otherUserName}`,
        data: {
          exchangeId: exchangeData.messageId,
          otherUserId: exchangeData.otherUserId,
          otherUserName: exchangeData.otherUserName,
          productTitle: exchangeData.productTitle
        },
        priority: 'low'
      });
    } catch (error) {
      console.error('Error enviando recordatorio de calificación:', error);
    }
  }

  // Limpiar notificaciones antiguas (ejecutar periódicamente)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true
      });
      console.log(`🧹 Limpieza de notificaciones: ${result.deletedCount} notificaciones eliminadas`);
    } catch (error) {
      console.error('Error limpiando notificaciones antiguas:', error);
    }
  }
}

export default NotificationService;
