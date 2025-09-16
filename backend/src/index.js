import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan'; // Logger
import process from 'node:process';
import helmet from 'helmet';
import compression from 'compression';
import ratingsRoutes from './routes/ratings.js';
import setupStatic from './static.js';
import contactoRoutes from './routes/contacto.js';
import uploadRoutes from './routes/upload.js';

// Load environment variables
dotenv.config();

const app = express();
const port = (typeof process !== 'undefined' && process.env && process.env.PORT) ? process.env.PORT : 3001;
const isTest = process.env.NODE_ENV === 'test';

// Middleware de seguridad y rendimiento
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

// CORS estricto con soporte de variables de entorno
const defaultOrigins = [
  'https://swap-web-pf.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const envOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // permitir herramientas como Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      const u = new URL(origin);
      // Permitir subdominios de Vercel (previews), solo sobre HTTPS
      if (u.protocol === 'https:' && u.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (_) {}
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204
};

// Middleware CORS de seguridad (refleja Origin permitido y maneja preflight)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = (() => {
    if (!origin) return false;
    if (allowedOrigins.includes(origin)) return true;
    try {
      const u = new URL(origin);
      return u.protocol === 'https:' && u.hostname.endsWith('.vercel.app');
    } catch (_) {
      return false;
    }
  })();

  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Expose-Headers', 'Content-Range,X-Content-Range');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Registrar CORS para todas las rutas y también manejar preflights explícitamente (capa adicional)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies (increase limit to allow base64 images in messages)
app.use(express.json({ limit: '15mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Log de rutas
console.log('=== Configuración de rutas ===');
console.log('Ruta de contacto configurada en /api/contacto');
console.log('Ruta de ratings configurada en /api/ratings');
console.log('===============================');

// Rutas de la API
app.use('/api/contacto', contactoRoutes);
app.use('/api/ratings', ratingsRoutes);

// Import routes
import userRoutes from './routes/users.js';
import swapRoutes from './routes/swaps.js';
import messageRoutes from './routes/messages.js';
import authRoutes from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import donationRoutes from './routes/donations.js';
import donationRequestRoutes from './routes/donationRequests.js';
import matchRoutes from './routes/matches.js';
import transactionRoutes from './routes/transactions.js';
import productRoutes from './routes/products.js';

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donation-requests', (req, res, next) => {
  console.log(' MIDDLEWARE DEBUG - donation-requests');
  console.log(' Método:', req.method);
  console.log(' URL completa:', req.originalUrl);
  console.log(' Content-Type:', req.headers['content-type']);
  next();
});
app.use('/api/donation-requests', donationRequestRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  console.log('Solicitud recibida en /api/health');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Endpoint de diagnóstico CORS
app.options('/api/cors-check', (req, res) => {
  return res.sendStatus(204);
});
app.get('/api/cors-check', (req, res) => {
  const origin = req.headers.origin || null;
  let allowed = false;
  let reason = '';
  try {
    if (!origin) {
      allowed = false;
      reason = 'sin origin';
    } else if (allowedOrigins.includes(origin)) {
      allowed = true;
      reason = 'incluido en allowedOrigins';
    } else {
      const u = new URL(origin);
      if (u.protocol === 'https:' && u.hostname.endsWith('.vercel.app')) {
        allowed = true;
        reason = 'wildcard .vercel.app';
      } else {
        allowed = false;
        reason = 'no coincide con allowedOrigins ni wildcard';
      }
    }
  } catch (e) {
    allowed = false;
    reason = `error parseando origin: ${e.message}`;
  }
  res.json({
    ok: true,
    origin,
    allowed,
    reason,
    envAllowedOrigins: allowedOrigins,
    time: new Date().toISOString()
  });
});

// Health check endpoint (colocado antes del middleware 404)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Raíz simple para sondas externas
app.get('/', (req, res) => {
  res.status(200).send('ok');
});

// Servir archivos estáticos de uploads
setupStatic(app);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  console.error('Ruta no encontrada:', {
    path: req.path,
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Setup Morgan logger
app.use(morgan('dev')); // Logs HTTP requests

// Setup Mongoose debug mode for detailed database operations
mongoose.set('debug', true);

// MongoDB connection options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
};

// MongoDB connection with enhanced logging (skip during tests)
if (!isTest) {
  mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log(' Conexión exitosa a MongoDB Atlas');
      console.log(' Base de datos lista para operaciones');
    })
    .catch((error) => {
      console.error(' Error al conectar a MongoDB:');
      console.error('   Detalles:', error.message);
      console.error('   Código:', error.code || 'N/A');
    });
}

// Monitor database events
mongoose.connection.on('error', (err) => {
  console.error(' Error en la conexión de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Desconectado de MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log(' Reconectado a MongoDB');
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(' ERROR GLOBAL CAPTURADO:');
  console.error(' URL:', req.originalUrl);
  console.error(' Método:', req.method);
  console.error(' Error:', err.message);
  console.error(' Stack:', err.stack);
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// (ruta /health movida arriba del 404)

// Start server (skip during tests)
if (!isTest) {
  app.listen(port, () => {
    console.log(` Servidor iniciado en el puerto ${port}`);
    console.log(` API disponible en http://localhost:${port}`);
  });
}

export default app; 