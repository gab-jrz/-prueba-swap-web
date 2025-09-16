import fs from 'fs';
import path from 'path';
import Product from '../models/Product.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Swap from '../models/Swap.js';
import User from '../models/User.js';

// Elimina un archivo si existe (sin lanzar error)
function safeUnlink(filePath) {
  try {
    if (!filePath) return;
    const absolute = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath.replace(/^\//, ''));
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  } catch (_) {
    // Ignorar errores de borrado de archivos
  }
}

export async function deleteUserCascade(userIdString) {
  // userIdString es el campo personalizado User.id (String)
  const result = {
    userId: userIdString,
    productsDeleted: 0,
    messagesDeleted: 0,
    notificationsDeleted: 0,
    swapsDeleted: 0,
    userDeleted: false,
    filesDeleted: {
      userImage: false,
      productImages: 0
    }
  };

  // Buscar usuario por campo id (string) y obtener _id para referencias
  const user = await User.findOne({ id: userIdString });
  if (!user) {
    return result; // no hay nada que borrar
  }

  // 1) Borrar notificaciones del usuario
  const notifRes = await Notification.deleteMany({ userId: userIdString });
  result.notificationsDeleted = notifRes.deletedCount || 0;

  // 2) Borrar mensajes donde participa (deId o paraId)
  const msgRes = await Message.deleteMany({
    $or: [{ deId: userIdString }, { paraId: userIdString }]
  });
  result.messagesDeleted = msgRes.deletedCount || 0;

  // 3) Borrar swaps donde el usuario participa (por _id de Mongo)
  const swapRes = await Swap.deleteMany({
    $or: [{ offerUser: user._id }, { requestUser: user._id }]
  });
  result.swapsDeleted = swapRes.deletedCount || 0;

  // 4) Borrar productos del usuario (ownerId es Number en el schema)
  const numericId = Number(userIdString);
  const productFilter = isNaN(numericId)
    ? { ownerId: userIdString }
    : { ownerId: { $in: [numericId, userIdString] } }; // cubrir inconsistencias históricas

  // Antes de borrar, eliminar archivos de imágenes
  const productsToDelete = await Product.find(productFilter).select('images');
  for (const p of productsToDelete) {
    (p.images || []).forEach((img) => {
      if (img && typeof img === 'string') {
        // Rutas como "/uploads/products/xxx.jpg"
        const fileRel = img.startsWith('/') ? img : `/uploads/products/${img}`;
        const abs = path.join(process.cwd(), fileRel.replace(/^\//, ''));
        if (fs.existsSync(abs)) {
          try { fs.unlinkSync(abs); result.filesDeleted.productImages += 1; } catch (_) {}
        }
      }
    });
  }

  const prodRes = await Product.deleteMany(productFilter);
  result.productsDeleted = prodRes.deletedCount || 0;

  // 5) Eliminar imagen de perfil del usuario si está almacenada localmente
  if (user.imagen) {
    const absUserImg = path.isAbsolute(user.imagen)
      ? user.imagen
      : path.join(process.cwd(), user.imagen.replace(/^\//, ''));
    if (fs.existsSync(absUserImg)) {
      try { fs.unlinkSync(absUserImg); result.filesDeleted.userImage = true; } catch (_) {}
    }
  }

  // 6) Finalmente borrar el usuario
  await user.deleteOne();
  result.userDeleted = true;

  return result;
}
