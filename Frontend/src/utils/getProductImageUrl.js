// Devuelve la URL absoluta para mostrar una imagen de producto
// Si la ruta comienza con /uploads, la arma con el backend; si es base64 o URL externa, la deja igual
import { API_URL } from '../config';

// Derivar el origin del backend quitando el sufijo /api y forzar https
const BACKEND_ORIGIN = (() => {
  const base = (API_URL || '').replace(/\/?api\/?$/, '');
  if (!base) return '';
  try {
    const u = new URL(base);
    // Use http for localhost, https for production
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.protocol = 'http:';
    } else {
      u.protocol = 'https:';
    }
    return u.origin;
  } catch {
    return base;
  }
})();

// Normaliza distintas formas de imagen que pueden venir del backend/frontend
// Acepta: string (relativa/absoluta/base64), array de strings/objetos, objeto con {url|path}
export function getProductImageUrl(img) {
  const PLACEHOLDER = '/images/OIP3.jpg';

  // Nada provisto
  if (!img) return PLACEHOLDER;

  // Si es array, usar el primer elemento no vacío
  if (Array.isArray(img)) {
    const first = img.find(Boolean);
    return getProductImageUrl(first);
  }

  // Si es objeto, intentar url o path
  if (typeof img === 'object') {
    const candidate = img.url || img.path || img.src || null;
    return candidate ? getProductImageUrl(candidate) : PLACEHOLDER;
  }

  // A partir de acá asumimos string
  if (typeof img !== 'string') return PLACEHOLDER;

  const trimmed = img.trim().replace(/\\/g, '/');
  if (!trimmed) return PLACEHOLDER;

  // Ya es absoluta (http/https) o base64
  if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
    return trimmed;
  }

  // Normalizar rutas de uploads que a veces vienen sin barra inicial
  if (trimmed.startsWith('uploads')) {
    return `${BACKEND_ORIGIN}/${trimmed}`;
  }

  if (trimmed.startsWith('/uploads')) {
    return `${BACKEND_ORIGIN}${trimmed}`;
  }

  // Compatibilidad con rutas del frontend "public/images" o variantes relativas
  // Ejemplos legados: "public/images/foto.jpg", "images/foto.jpg", "./images/foto.jpg", "../images/foto.jpg"
  if (trimmed.startsWith('public/images/')) {
    return `/${trimmed.replace(/^public\//, '')}`; // -> /images/...
  }

  if (/^(?:\.?\.\/)?images\//.test(trimmed)) {
    return `/${trimmed.replace(/^\.?\.\//, '')}`; // asegurar /images/...
  }

  if (trimmed.startsWith('/images/')) {
    return trimmed; // ya apunta a la carpeta pública del frontend
  }

  // Si es una ruta relativa cualquiera, devolver tal cual y dejar que el host actual la resuelva
  // o usar placeholder si parece inválida
  if (trimmed) return trimmed;
  if (typeof window !== 'undefined' && window?.location?.hostname) {
    try { console.warn('getProductImageUrl: usando placeholder para ruta inválida', img); } catch {}
  }
  return PLACEHOLDER;
}
