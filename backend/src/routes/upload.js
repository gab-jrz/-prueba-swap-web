import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure base upload directory exists
const uploadsBaseDir = path.join(process.cwd(), 'uploads');
const uploadsMessagesDir = path.join(uploadsBaseDir, 'messages');

for (const dir of [uploadsBaseDir, uploadsMessagesDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsMessagesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  }
});

// Validate only images and size <= 5MB
const fileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten archivos de imagen'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/', (req, res) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen no debe superar los 5MB' : err.message;
      return res.status(400).json({ error: msg });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Error al subir la imagen' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    // Build public URL served by static middleware (/uploads)
    const imageUrl = `/uploads/messages/${req.file.filename}`;
    return res.status(200).json({ imageUrl });
  });
});

export default router;
