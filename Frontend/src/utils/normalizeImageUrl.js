// Utilidad para normalizar URLs de imágenes a una URL absoluta accesible por el navegador
// Reglas:
// - data: URL -> se devuelve igual
// - http(s) -> si es http, forzar https
// - rutas relativas (con o sin / inicial) -> se antepone el ORIGIN del backend (API_URL sin /api)

import { API_URL as API_BASE } from '../config';

// Quitar el sufijo /api del API_URL para obtener el origin del backend
const BASE_ORIGIN = (API_BASE || '')
  .replace(/\/?api\/?$/, '')
  .replace(/\/$/, '');

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return trimmed;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Forzar https por mixed content
    return trimmed.replace(/^http:\/\//, 'https://');
  }

  // Para imágenes estáticas servidas por el backend (ej. /uploads/..), usar el origin del backend
  if (trimmed.startsWith('/')) return `${BASE_ORIGIN}${trimmed}`;
  return `${BASE_ORIGIN}/${trimmed}`;
}

export default normalizeImageUrl;
