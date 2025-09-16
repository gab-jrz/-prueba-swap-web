import express from 'express';
import path from 'path';

export default function setupStatic(app) {
  // Servir archivos estáticos de la carpeta uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
}
