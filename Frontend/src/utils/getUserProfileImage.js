// Utilidad para obtener la imagen de perfil de un usuario por su ID
// Si no la encuentra, retorna un avatar por defecto

import { API_URL } from '../config';
import { normalizeImageUrl } from './normalizeImageUrl';

export async function getUserProfileImage(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) throw new Error('No se pudo obtener el usuario');
    const user = await res.json();
    if (user.imagen) return normalizeImageUrl(user.imagen);
    return '/images/fotoperfil.jpg';
  } catch {
    return '/images/fotoperfil.jpg';
  }
}
