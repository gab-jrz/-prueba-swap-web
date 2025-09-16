import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// DELETE /api/transactions/:id
// Elimina una transacción incrustada en el array "transacciones" de cualquier usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Marcar como deleted:true en vez de eliminar
    const users = await User.find({ 'transacciones._id': id });
    if (!users.length) {
      return res.status(404).json({ message: 'Transacción no encontrada' });
    }
    for (const user of users) {
      let changed = false;
      user.transacciones = user.transacciones.map(t => {
        if (t._id && t._id.toString() === id) {
          changed = true;
          return { ...t, deleted: true };
        }
        return t;
      });
      if (changed) {
        user.markModified('transacciones');
        await user.save();
      }
    }
    res.json({ message: 'Transacción marcada como eliminada' });
  } catch (error) {
    console.error('Error eliminando transacción', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
