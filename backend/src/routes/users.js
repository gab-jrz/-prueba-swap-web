import express from 'express';
import User from '../models/User.js';
import Donation from '../models/Donation.js';
import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.js';
import { deleteUserCascade } from '../services/userDeletionService.js';

const router = express.Router();

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Get all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one user
router.get('/:id', async (req, res) => {
  try {
    // Intentar buscar por el campo personalizado 'id'
    let user = await User.findOne({ id: req.params.id }).select('-password');
    // Si no se encuentra, intentar como Mongo _id
    if (!user) {
      try {
        user = await User.findById(req.params.id).select('-password');
      } catch (_) {
        // Ignorar error de formato de ObjectId y continuar
      }
    }
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    // Filtrar transacciones eliminadas
    if (Array.isArray(user.transacciones)) {
      user.transacciones = user.transacciones.filter(t => !t.deleted);
    }
    // Calcular cantidad real de donaciones ENTREGADAS (status: 'delivered')
    const donacionesCount = await Donation.countDocuments({ donor: user._id, status: 'delivered' });
    const userObj = user.toObject();
    userObj.donacionesCount = donacionesCount;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const user = new User({
      id: req.body.id,
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      imagen: req.body.imagen,
      // Mapear provincia del frontend hacia los campos existentes del modelo
      zona: req.body.provincia || req.body.zona,
      ubicacion: req.body.provincia || req.body.ubicacion
    });

    const newUser = await user.save();
    const userResponse = newUser.toObject();
    delete userResponse.password;

    // Generar token JWT
    const token = jwt.sign(
      { id: userResponse.id, email: userResponse.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    // Generar token JWT
    const token = jwt.sign(
      { id: userResponse.id, email: userResponse.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: userResponse,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updateFields = [
      'nombre', 'apellido', 'username', 'email', 'password',
      'imagen', 'zona', 'telefono', 'mostrarContacto', 'transacciones'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        console.log(`[Backend] Actualizando campo ${field}:`, req.body[field]);
        if (field === 'mostrarContacto') {
          // Asegurar booleano real (maneja "false" string)
          user[field] = req.body[field] === true || req.body[field] === 'true';
        } else {
          user[field] = req.body[field];
          if (field === 'transacciones') {
            user.markModified('transacciones');
          }
        }
      }
    });
    
    console.log('[Backend] Usuario antes de guardar:', {
      zona: user.zona,
      telefono: user.telefono,
      email: user.email
    });

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const summary = await deleteUserCascade(String(req.params.id));
    res.json({ message: 'Usuario eliminado en cascada', summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener favoritos de un usuario
router.get('/:id/favoritos', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).populate('favoritos');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user.favoritos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Agregar producto a favoritos
router.post('/:id/favoritos', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Falta productId' });

    // Buscar el producto por su _id (MongoDB)
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    if (user.favoritos.includes(product._id)) {
      return res.status(400).json({ message: 'El producto ya está en favoritos' });
    }
    user.favoritos.push(product._id);
    await user.save();
    res.json({ message: 'Producto agregado a favoritos', favoritos: user.favoritos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Quitar producto de favoritos
router.delete('/:id/favoritos/:productId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Buscar el producto por su _id (MongoDB)
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    // Filtrar usando el _id de MongoDB
    user.favoritos = user.favoritos.filter(fav => fav.toString() !== product._id.toString());
    await user.save();

    res.json({ message: 'Producto eliminado de favoritos', favoritos: user.favoritos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;