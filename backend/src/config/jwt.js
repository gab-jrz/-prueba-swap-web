// Preferir variable de entorno en producción; usar fallback solo en desarrollo
export const JWT_SECRET = process.env.JWT_SECRET || 'swapweb-secret-key-2025';