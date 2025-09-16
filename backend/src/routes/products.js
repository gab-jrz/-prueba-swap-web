import express from 'express';
import Product from '../models/Product.js';
import upload from '../middleware/multerProducts.js';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';

const router = express.Router();

// Asegurar que la carpeta de uploads existe
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Get all products (with optional owner filter)
router.get('/', async (req, res) => {
  try {
    // Construir filtro basado en query parameters
    let filter = {};
    
    // Si se proporciona owner, filtrar por ownerId
    if (req.query.owner) {
      // Usar como string para que coincida con el tipo del modelo Product
      filter.ownerId = req.query.owner;
      console.log(' Filtrando productos por owner:', req.query.owner);
    }

    // Por defecto, solo mostrar productos no intercambiados
    // a menos que se solicite explícitamente lo contrario
    if (req.query.mostrarIntercambiados !== 'true') {
      filter.intercambiado = { $ne: true };
    }
    
    console.log(' Filtro aplicado:', filter);
    
    const products = await Product.find(filter)
      .select('-__v') // Eliminar solo __v, dejar _id
      .sort({ id: 1 });

    // Enriquecer cada producto con nombre y provincia del owner
    const enrichedProducts = await Promise.all(products.map(async (prod) => {
      let ownerName = 'Usuario';
      let zona = 'Sin especificar';
      let ownerId = prod.ownerId;
      try {
        // Buscar usuario por id (string)
        const owner = await User.findOne({ id: prod.ownerId });
        if (owner) {
          ownerName = owner.nombre + (owner.apellido ? ' ' + owner.apellido : '');
          zona = owner.zona || 'Sin especificar';
          ownerId = owner.id;
        }
      } catch (e) {
        // Si hay error, dejar valores por defecto
      }
      const base = prod.toObject();
      // Compatibilidad: si no hay images pero existe un campo legado 'image', exponemos images
      if ((!base.images || base.images.length === 0) && base.image) {
        base.images = [base.image];
      }
      return {
        ...base,
        ownerName,
        zona,
        ownerId,
        fechaPublicacion: prod.createdAt
      };
    }));

    console.log(' Productos encontrados:', enrichedProducts.length);
    res.json(enrichedProducts);
  } catch (error) {
    console.error(' Error al obtener productos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener todos los productos sin filtro
router.get('/all', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    const base = product.toObject();
    // Compatibilidad con registros legados que tienen 'image' en lugar de 'images'
    if ((!base.images || base.images.length === 0) && base.image) {
      base.images = [base.image];
    }
    res.json(base);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear producto con imágenes (hasta 3)
router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    // Manejar imágenes subidas
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map(file => {
        // Ruta relativa para servir desde backend
        return `/uploads/products/${file.filename}`;
      });
    }
    const caracteristicas = req.body.caracteristicas ? JSON.parse(req.body.caracteristicas) : [];
    const product = new Product({
      title: req.body.title,
      description: req.body.description,
      categoria: req.body.categoria,
      images: imagePaths, // ahora es requerido
      ownerId: req.body.ownerId,
      caracteristicas,
      date: req.body.date,
      status: req.body.status
    });
    const newProduct = await product.save();
    // Actualizar el usuario para agregar el producto creado a su array de productos
    await User.findByIdAndUpdate(
      req.body.ownerId,
      { $push: { productos: newProduct._id } },
      { new: true }
    );
    const productResponse = newProduct.toObject();
    delete productResponse._id;
    delete productResponse.__v;
    res.status(201).json(productResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create multiple products
router.post('/batch', async (req, res) => {
  try {
    const products = req.body.map(product => {
      // Normalizar imágenes: aceptar product.images (array/string JSON)
      // o product.image (string) y convertir a array
      let normalizedImages = [];
      if (typeof product.images !== 'undefined') {
        let imgs = product.images;
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs); } catch { imgs = [imgs]; }
        }
        if (Array.isArray(imgs)) {
          normalizedImages = imgs.filter(Boolean).slice(0, 3);
        }
      } else if (typeof product.image === 'string' && product.image.trim()) {
        normalizedImages = [product.image.trim()];
      }

      return {
        title: product.title,
        description: product.description,
        categoria: product.categoria,
        images: normalizedImages,
        ownerId: product.ownerId
      };
    });
    
    const newProducts = await Product.insertMany(products);
    const productsResponse = newProducts.map(product => {
      const p = product.toObject();
      delete p._id;
      delete p.__v;
      return p;
    });
    res.status(201).json(productsResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get products by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const products = await Product.find({ ownerId: req.params.userId })
      .select('-_id -__v')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product
router.put('/:id', upload.array('images', 3), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    // Debug: log payload overview
    try {
      const dbgCaracts = typeof req.body.caracteristicas;
      const dbgImagesType = typeof req.body.images;
      console.log('PUT /products payload:', {
        hasFiles: !!(req.files && req.files.length),
        filesCount: req.files ? req.files.length : 0,
        caracteristicasType: dbgCaracts,
        caracteristicasPreview: dbgCaracts === 'string' ? (req.body.caracteristicas || '').slice(0, 120) : req.body.caracteristicas,
        imagesType: dbgImagesType,
        imagesLen: Array.isArray(req.body.images) ? req.body.images.length : (req.body.images ? 1 : 0)
      });
    } catch (_) {}

    // Campos simples
    if (req.body.title) product.title = req.body.title;
    if (req.body.description) product.description = req.body.description;
    if (req.body.categoria) product.categoria = req.body.categoria;
    if (req.body.intercambiado !== undefined) product.intercambiado = !!req.body.intercambiado;

    // Manejo de características (puede venir como string JSON o array)
    if (typeof req.body.caracteristicas !== 'undefined') {
      let caracts = req.body.caracteristicas;
      if (typeof caracts === 'string') {
        try { caracts = JSON.parse(caracts); } catch { caracts = []; }
      }
      if (Array.isArray(caracts) && caracts.length > 0) {
        product.caracteristicas = caracts;
      } else {
        // Si está vacío, eliminar el campo para respetar default: undefined
        product.set('caracteristicas', undefined, { strict: false });
      }
    }

    // Manejo de imágenes
    // Prioridad 1: archivos subidos vía multipart (req.files)
    let newImagePaths = [];
    if (req.files && req.files.length > 0) {
      newImagePaths = req.files.map(f => `/uploads/products/${f.filename}`);
      // Si además vienen imágenes en el body, agregarlas también
      if (typeof req.body.images !== 'undefined') {
        let images = req.body.images;
        if (typeof images === 'string') {
          try {
            const parsed = JSON.parse(images);
            images = parsed;
          } catch {
            images = [images];
          }
        }
        if (Array.isArray(images)) {
          for (let i = 0; i < Math.min(images.length, 3 - newImagePaths.length); i++) {
            const img = images[i];
            if (typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http'))) {
              newImagePaths.push(img);
            }
          }
        }
      }
    } else if (typeof req.body.images !== 'undefined') {
      // Prioridad 2: cuerpo con imágenes (array o string JSON)
      let images = req.body.images;
      if (typeof images === 'string') {
        // Puede venir como una sola cadena o JSON string
        try {
          const parsed = JSON.parse(images);
          images = parsed;
        } catch {
          images = [images];
        }
      }

      if (Array.isArray(images)) {
        // Aceptar hasta 3
        for (let i = 0; i < Math.min(images.length, 3); i++) {
          const img = images[i];
          if (typeof img === 'string' && img.startsWith('data:image')) {
            // data URL -> guardar como archivo
            try {
              const [meta, data] = img.split(',');
              const extMatch = /data:image\/(.*?);base64/.exec(meta);
              const ext = extMatch ? extMatch[1] : 'jpg';
              const buffer = Buffer.from(data, 'base64');
              const filename = `prod-${product.id}-${Date.now()}-${i}.${ext}`;
              const filepath = path.join(uploadDir, filename);
              fs.writeFileSync(filepath, buffer);
              newImagePaths.push(`/uploads/products/${filename}`);
            } catch (e) {
              // si falla, omitir esa imagen
            }
          } else if (typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http'))) {
            // Mantener ruta existente o URL
            newImagePaths.push(img);
          }
        }
      }
    }

    // Si se proporcionaron nuevas imágenes (por archivos o cuerpo), actualizarlas
    if (newImagePaths.length > 0) {
      product.images = newImagePaths;
    }

    const updatedProduct = await product.save();
    const productResponse = updatedProduct.toObject();
    delete productResponse._id;
    delete productResponse.__v;
    return res.json(productResponse);
  } catch (error) {
    console.error(' Error al actualizar producto:', error);
    return res.status(400).json({ message: error.message });
  }
});

export default router;