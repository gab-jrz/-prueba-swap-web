import express from 'express';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import NotificationService from '../services/notificationService.js';
const router = express.Router();

// Obtener cantidad de mensajes no leídos para un usuario
router.get('/unread/:userId', async (req,res)=>{
  try{
    // Resolve canonical app user id: try to find User by app id or by Mongo _id
    let userIdToUse = req.params.userId;
    try {
      const found = await User.findOne({ id: req.params.userId }).select('id');
      if (found && found.id) userIdToUse = found.id;
      else {
        const byMongo = await User.findById(req.params.userId).select('id');
        if (byMongo && byMongo.id) userIdToUse = byMongo.id;
      }
    } catch (e) {
      // ignore resolution errors and fallback to provided param
    }

    const total = await Message.countDocuments({
      paraId: userIdToUse,
      leidoPor: { $ne: userIdToUse }
    });
    res.json({ total });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

// Marcar mensajes como leídos para un usuario
router.put('/mark-read/:userId', async (req,res)=>{
  try{
    // Resolve canonical app user id
    let userIdToUse = req.params.userId;
    try {
      const found = await User.findOne({ id: req.params.userId }).select('id');
      if (found && found.id) userIdToUse = found.id;
      else {
        const byMongo = await User.findById(req.params.userId).select('id');
        if (byMongo && byMongo.id) userIdToUse = byMongo.id;
      }
    } catch (e) {}

    await Message.updateMany({
      paraId: userIdToUse,
      leidoPor: { $ne: userIdToUse }
    }, { $push: { leidoPor: userIdToUse }});
    res.json({ ok:true });
  }catch(err){
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a user
router.get('/:userId', async (req, res) => {
  try {
    // Resolve canonical app user id (in case client passed Mongo _id)
    let userIdToUse = req.params.userId;
    try {
      const found = await User.findOne({ id: req.params.userId }).select('id');
      if (found && found.id) userIdToUse = found.id;
      else {
        const byMongo = await User.findById(req.params.userId).select('id');
        if (byMongo && byMongo.id) userIdToUse = byMongo.id;
      }
    } catch (e) {}

    const messages = await Message.find({
      $or: [
        { paraId: userIdToUse },
        { deId: userIdToUse }
      ]
    })
      .select('-__v')
      .sort({ createdAt: -1 });
    
    // Enriquecer mensajes con imágenes de perfil de usuarios
    const enrichedMessages = await Promise.all(messages.map(async (message) => {
      const messageObj = message.toObject();
      
      // Obtener imagen del remitente (buscar por campo id propio, no _id de Mongo)
      if (messageObj.deId) {
        try {
          const senderUser = await User.findOne({ id: messageObj.deId }).select('imagen');
          if (senderUser && senderUser.imagen) {
            messageObj.deImagen = senderUser.imagen;
          }
        } catch (err) {
          console.log('Error obteniendo imagen del remitente:', err);
        }
      }
      
      // Obtener imagen del destinatario (buscar por campo id propio)
      if (messageObj.paraId) {
        try {
          const receiverUser = await User.findOne({ id: messageObj.paraId }).select('imagen');
          if (receiverUser && receiverUser.imagen) {
            messageObj.paraImagen = receiverUser.imagen;
          }
        } catch (err) {
          console.log('Error obteniendo imagen del destinatario:', err);
        }
      }
      
      return messageObj;
    }));
    
    res.json(enrichedMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//crear nuevo mensaje
router.post('/', async (req, res) => {
  // Normalizar IDs a "id" propio de la app (no _id de Mongo)
  let deIdNorm = req.body.deId;
  let paraIdNorm = req.body.paraId;
  try {
    // deId
    const userDeByApp = await User.findOne({ id: deIdNorm }).select('id');
    if (userDeByApp && userDeByApp.id) {
      deIdNorm = userDeByApp.id;
    } else {
      const userDeByMongo = await User.findById(deIdNorm).select('id');
      if (userDeByMongo && userDeByMongo.id) deIdNorm = userDeByMongo.id;
    }
    // paraId
    const userParaByApp = await User.findOne({ id: paraIdNorm }).select('id');
    if (userParaByApp && userParaByApp.id) {
      paraIdNorm = userParaByApp.id;
    } else {
      const userParaByMongo = await User.findById(paraIdNorm).select('id');
      if (userParaByMongo && userParaByMongo.id) paraIdNorm = userParaByMongo.id;
    }
  } catch (e) {
    // continuar con los valores provistos si falla la resolución
  }

  const message = new Message({
    de: req.body.de,
    deId: deIdNorm,
    paraId: paraIdNorm,
    paraNombre: req.body.paraNombre,
    // Campos para productos (intercambios)
    productoId: req.body.productoId,
    productoTitle: req.body.productoTitle,
    productoOfrecidoId: req.body.productoOfrecidoId,
    productoOfrecido: req.body.productoOfrecido || 'Mensaje directo',
    // Campos para donaciones
    donacionId: req.body.donacionId,
    donacionTitle: req.body.donacionTitle,
    imagenDonacion: req.body.imagenDonacion,
    tipoPeticion: req.body.tipoPeticion || (req.body.donacionId ? 'donacion' : (req.body.productoOfrecidoId ? 'intercambio' : 'mensaje')),
    descripcion: req.body.descripcion,
    condiciones: req.body.condiciones,
    imagenNombre: req.body.imagenNombre,
    leidoPor: [deIdNorm]
  });

  try {
    const newMessage = await message.save();
    const messageResponse = newMessage.toObject();
    delete messageResponse.__v;
    
    // Generar notificación automática (usar datos guardados para mayor robustez)
    if (messageResponse.tipoPeticion === 'donacion' || req.body.donacionId) {
      await NotificationService.notifyNewDonationRequest(messageResponse);
    } else if (messageResponse.productoOfrecidoId || req.body.productoOfrecidoId) {
      await NotificationService.notifyNewExchangeProposal(messageResponse);
    } else {
      await NotificationService.notifyNewMessage(messageResponse);
    }
    
    res.status(201).json(messageResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//confirmar intercambio por un usuario
router.put('/:id/confirm', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId requerido' });

    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Mensaje no encontrado' });

    // Debug: log antes de modificar
    console.log('Antes de confirmar:', { conf: message.confirmaciones, len: message.confirmaciones.length, completed: message.completed });

    if (!message.confirmaciones.includes(userId)) {
      message.confirmaciones.push(userId);
    }

    // Debug: log después de modificar
    console.log('Después de confirmar:', { conf: message.confirmaciones, len: message.confirmaciones.length });

    let completed = false;
    // cuando confirmen ambas partes
    // Cuando confirmen ambas partes
    console.log(`Check: ${message.confirmaciones.length} >= 2 && ${!message.completed}`);
    if (message.confirmaciones.length >= 2 && !message.completed) {
      message.completed = true;
      completed = true;

      // Marcar productos como intercambiados (ambos productos)
      // Asegurarse de convertir los IDs a número, porque el campo "id" en Product es numérico
      if (message.productoId !== undefined && message.productoId !== null) {
        await Product.updateOne({ id: Number(message.productoId) }, { intercambiado: true });
      }
      if (message.productoOfrecidoId !== undefined && message.productoOfrecidoId !== null) {
        await Product.updateOne({ id: Number(message.productoOfrecidoId) }, { intercambiado: true });
      }
      // Agregar transacción detallada a ambos usuarios
      const fecha = new Date();
      const transDe = {
        productoSolicitado: message.productoTitle,
        productoSolicitadoId: message.productoId,
        productoOfrecido: message.productoOfrecido,
        productoOfrecidoId: message.productoOfrecidoId,
        fecha,
        otroUserId: message.paraId,
        otroUserNombre: message.paraNombre || ''
      };
      const transPara = {
        productoSolicitado: message.productoOfrecido,
        productoSolicitadoId: message.productoOfrecidoId,
        productoOfrecido: message.productoTitle,
        productoOfrecidoId: message.productoId,
        fecha,
        otroUserId: message.deId,
        otroUserNombre: message.de || ''
      };
      await User.updateOne({ id: message.deId }, { $push: { transacciones: transDe } });
      await User.updateOne({ id: message.paraId }, { $push: { transacciones: transPara } });

      // Crear mensaje de confirmación para ambos usuarios con nombre real
      const userDe = await User.findOne({ id: message.deId });
      const userPara = await User.findOne({ id: message.paraId });

      const sysTemplate = {
        productoId: message.productoId,
        productoTitle: message.productoTitle,
        productoOfrecido: message.productoOfrecido,
        descripcion: `Producto intercambiado entre usuarios. ¡Califiquen!`,
        system: false // Ahora es mensaje de usuario real
      };
      await Message.create([
        {
          ...sysTemplate,
          de: userPara ? `${userPara.nombre} ${userPara.apellido}` : message.paraId,
          deId: message.paraId,
          nombreRemitente: userPara ? `${userPara.nombre} ${userPara.apellido}` : message.paraId,
          paraId: message.deId,
          paraNombre: userDe ? `${userDe.nombre} ${userDe.apellido}` : message.deId
        },
        {
          ...sysTemplate,
          de: userDe ? `${userDe.nombre} ${userDe.apellido}` : message.deId,
          deId: message.deId,
          nombreRemitente: userDe ? `${userDe.nombre} ${userDe.apellido}` : message.deId,
          paraId: message.paraId,
          paraNombre: userPara ? `${userPara.nombre} ${userPara.apellido}` : message.paraId
        }
      ]);
    }

    await message.save();
    
    // Generar notificaciones de cambio de estado
    const otherUserId = userId === message.deId ? message.paraId : message.deId;
    const otherUserName = userId === message.deId ? message.paraNombre : message.de;
    
    if (completed) {
      // Notificar intercambio completado a ambos usuarios
      await NotificationService.notifyExchangeStatusChange(message.deId, 'completed', {
        messageId: message._id,
        productTitle: message.productoTitle,
        otherUserId: message.paraId,
        otherUserName: message.paraNombre
      });
      await NotificationService.notifyExchangeStatusChange(message.paraId, 'completed', {
        messageId: message._id,
        productTitle: message.productoOfrecido,
        otherUserId: message.deId,
        otherUserName: message.de
      });
      
      // Programar recordatorios de calificación (después de 24 horas)
      setTimeout(async () => {
        await NotificationService.notifyRatingReminder(message.deId, {
          messageId: message._id,
          productTitle: message.productoTitle,
          otherUserId: message.paraId,
          otherUserName: message.paraNombre
        });
        await NotificationService.notifyRatingReminder(message.paraId, {
          messageId: message._id,
          productTitle: message.productoOfrecido,
          otherUserId: message.deId,
          otherUserName: message.de
        });
      }, 24 * 60 * 60 * 1000); // 24 horas
    } else {
      // Notificar confirmación parcial al otro usuario
      await NotificationService.notifyExchangeStatusChange(otherUserId, 'confirmed', {
        messageId: message._id,
        productTitle: userId === message.deId ? message.productoOfrecido : message.productoTitle,
        otherUserId: userId,
        otherUserName: userId === message.deId ? message.de : message.paraNombre
      });
    }
    
    res.json({ confirmed: true, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update rating on a message y guardarlo en usuario receptor
// Delete message
// Delete message permanently
router.delete('/:id', async (req, res) => {
  try {
    const deletedMessage = await Message.findByIdAndDelete(req.params.id);
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Mensaje no encontrado' });
    }
    res.json({ message: 'Mensaje eliminado permanentemente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit message (update descripcion, imagen, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { descripcion, imagen } = req.body;
    if (descripcion === undefined && imagen === undefined) {
      return res.status(400).json({ message: 'Nada para actualizar' });
    }
    const updateFields = {};
    if (descripcion !== undefined) updateFields.descripcion = descripcion;
    if (imagen !== undefined) updateFields.imagen = imagen;
    updateFields.updatedAt = new Date();

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select('-__v');

    if (!updatedMessage) return res.status(404).json({ message: 'Mensaje no encontrado' });

    res.json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/rating', async (req, res) => {
  try {
    const { rating, raterId } = req.body;
    if(!rating || !raterId) return res.status(400).json({message:'rating y raterId requeridos'});

    const message = await Message.findById(req.params.id);
    if(!message) return res.status(404).json({message:'Mensaje no encontrado'});
    message.rating = rating;
    await message.save();

    // guardar en historial del usuario receptor
    const receptorId = message.deId === raterId ? message.paraId : message.deId;
    const raterUser = await User.findOne({ id: raterId });
    const receptor = await User.findOne({ id: receptorId });
    if(receptor){
      receptor.calificaciones = receptor.calificaciones || [];
      receptor.calificaciones.push({
        deId: raterId,
        deNombre: `${raterUser?.nombre || ''} ${raterUser?.apellido || ''}`.trim(),
        rating,
        productoSolicitado: message.productoTitle,
        productoOfrecido: message.productoOfrecido
      });
      // promedio
      const sum = receptor.calificaciones.reduce((acc,c)=>acc + (c.rating||0),0);
      receptor.calificacion = (sum / receptor.calificaciones.length).toFixed(1);
      await receptor.save();
    }

    res.json({ ok:true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;