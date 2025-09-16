import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear el directorio si no existe
const uploadDir = 'src/uploads/requests';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  console.log('🔍 FILTRO DE ARCHIVO:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Permitir imágenes, PDFs y documentos
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  console.log('✅ Tipos permitidos:', allowedTypes);
  console.log('🔍 Tipo recibido:', file.mimetype);
  console.log('✅ ¿Está permitido?:', allowedTypes.includes(file.mimetype));
  
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ Archivo aceptado:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ Archivo rechazado:', file.originalname, 'Tipo:', file.mimetype);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Tipos permitidos: ${allowedTypes.join(', ')}`), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  // fileFilter: fileFilter, // Comentado temporalmente para debugging
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 3 // máximo 3 archivos
  }
});

export default upload;
