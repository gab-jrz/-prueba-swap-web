import express from 'express';
import User from '../models/User.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

// POST /api/ratings
router.post('/', async (req, res) => {
  try {
    const { deId, paraId, stars, comment, transId, productoOfrecido, productoSolicitado } = req.body;
    if (!deId || !paraId || !stars || !transId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    if (deId === paraId) {
      return res.status(400).json({ error: 'No puedes calificarte a ti mismo' });
    }

    // Buscar usuario a calificar
    const receptor = await User.findOne({ id: paraId });
    if (!receptor) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Evitar duplicados por transacción
    if (receptor.calificaciones && receptor.calificaciones.some(c => c.deId === deId && c.transaccionId === transId)) {
      return res.status(400).json({ error: 'Ya calificaste esta transacción' });
    }

    // Buscar nombre del que califica
    const emisor = await User.findOne({ id: deId });

    // Agregar calificación
    const nuevaCalif = {
      deId,
      deNombre: emisor ? `${emisor.nombre} ${emisor.apellido}` : 'Usuario',
      rating: stars,
      comentario: comment || '',
      transaccionId: transId,
      productoOfrecido: productoOfrecido || '',
      productoSolicitado: productoSolicitado || '',
      fecha: new Date()
    };
    receptor.calificaciones = receptor.calificaciones || [];
    receptor.calificaciones.push(nuevaCalif);

    // Actualizar promedio
    const sum = receptor.calificaciones.reduce((acc, c) => acc + (c.rating || 0), 0);
    receptor.calificacion = (sum / receptor.calificaciones.length).toFixed(1);

    await receptor.save();
    
    // Generar notificación de nueva calificación
    await NotificationService.notifyNewRating({
      paraId,
      deId,
      deNombre: nuevaCalif.deNombre,
      rating: stars,
      comentario: comment,
      productoOfrecido,
      productoSolicitado
    });
    
    res.status(201).json({ ok: true, calificacion: receptor.calificacion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
