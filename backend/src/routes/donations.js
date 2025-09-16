import express from 'express';
import Donation from '../models/Donation.js';
import Match from '../models/Match.js';
import DonationRequest from '../models/DonationRequest.js';
import User from '../models/User.js';
import upload from '../middleware/multerProducts.js';
// import auth from '../middleware/auth.js'; // Descomenta si usas autenticación

const router = express.Router();

// GET all donations (con filtro opcional por donador)
router.get('/', async (req, res) => {
  try {
    const { donator, donor } = req.query;
    let filter = {};
    
    // Permitir tanto 'donator' como 'donor' para compatibilidad
    if (donator) {
      filter.donor = donator;
      console.log('🔍 Filtrando donaciones por donador (donator param):', donator);
    } else if (donor) {
      filter.donor = donor;
      console.log('🔍 Filtrando donaciones por donador (donor param):', donor);
    }
    
    const donations = await Donation
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('donor', 'nombre apellido name ubicacion provincia zona location');
    console.log('📦 Donaciones encontradas:', donations.length);
    console.log('📦 Filtro aplicado:', filter);
    res.json(donations);
  } catch (err) {
    console.error('❌ Error al obtener donaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single donation by ID
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'nombre apellido name ubicacion provincia zona location');
    if (!donation) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }
    console.log('🔍 Donación encontrada:', donation._id);
    res.json(donation);
  } catch (err) {
    console.error('❌ Error al obtener donación:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create donation
router.post('/', upload.array('images', 3), async (req, res) => {
  try {
    console.log('📝 DEBUGGING - Headers:', req.headers);
    console.log('📝 DEBUGGING - Content-Type:', req.headers['content-type']);
    console.log('📝 DEBUGGING - req.body:', req.body);
    console.log('📝 DEBUGGING - req.files:', req.files);
    
    // Cuando se usa FormData con multer, los datos están en req.body
    const donationData = { ...req.body };
    
    // Procesar las imágenes subidas
    if (req.files && req.files.length > 0) {
      donationData.images = req.files.map(file => file.filename);
      console.log('📷 Imágenes procesadas:', donationData.images);
    }
    
    // Procesar características si vienen como string JSON
    if (donationData.characteristics && typeof donationData.characteristics === 'string') {
      try {
        donationData.characteristics = JSON.parse(donationData.characteristics);
      } catch (e) {
        console.log('⚠️ Error parseando características:', e);
      }
    }
    
    console.log('📝 Datos procesados:', donationData);
    
    // Verificar campos requeridos
    if (!donationData.title) {
      console.log('❌ Falta campo title');
      return res.status(400).json({ error: 'El campo title es requerido' });
    }
    
    if (!donationData.category) {
      console.log('❌ Falta campo category');
      return res.status(400).json({ error: 'El campo category es requerido' });
    }
    
    if (!donationData.donor) {
      console.log('❌ Falta campo donor');
      return res.status(400).json({ error: 'El campo donor es requerido' });
    }

    // Validar que exista al menos una imagen
    if (!donationData.images || !Array.isArray(donationData.images) || donationData.images.length === 0) {
      console.log('❌ Falta al menos una imagen');
      return res.status(400).json({ error: 'Debes subir al menos una imagen de la donación' });
    }
    
    console.log('✅ Todos los campos requeridos presentes');
    
    const donation = new Donation(donationData);
    await donation.save();
    console.log('✅ Donación creada exitosamente:', donation._id);
    
    // Incrementar el contador de donaciones del usuario
    await User.findByIdAndUpdate(
      donation.donor,
      { $inc: { donacionesCount: 1 } },
      { new: true }
    );
    
    // Populate el donante en la respuesta
    const populatedDonation = await Donation.findById(donation._id).populate('donor');
    res.status(201).json(populatedDonation);
  } catch (err) {
    console.error('❌ Error completo:', err);
    console.error('❌ Error mensaje:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.status(400).json({ error: err.message });
  }
});

// PATCH update donation
router.patch('/:id', async (req, res) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(donation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update donation (full update for edit forms) con soporte a imágenes
router.put('/:id', upload.array('images', 3), async (req, res) => {
  try {
    // Normalizar body desde multipart/form-data o JSON
    const donationData = { ...req.body };

    // Procesar características si vienen como string JSON
    if (donationData.characteristics && typeof donationData.characteristics === 'string') {
      try {
        donationData.characteristics = JSON.parse(donationData.characteristics);
      } catch (e) {
        console.log('⚠️ Error parseando características:', e);
      }
    }

    // Helper para normalizar a filename si viene URL absoluta o ruta /uploads/products
    const toFilename = (val) => {
      if (!val) return val;
      if (typeof val !== 'string') return val;
      // Si viene como /uploads/products/<file>
      const idx = val.lastIndexOf('/')
      return idx >= 0 ? val.slice(idx + 1) : val;
    };

    // Gestionar imágenes: combinar existentes + nuevas subidas
    let setImages = false;
    let images = [];

    if (typeof donationData.existingImages !== 'undefined') {
      const existing = Array.isArray(donationData.existingImages)
        ? donationData.existingImages
        : [donationData.existingImages];
      images.push(...existing.map(toFilename).filter(Boolean));
      setImages = true;
    }

    if (req.files && req.files.length > 0) {
      images.push(...req.files.map(f => f.filename));
      setImages = true;
    }

    if (setImages) {
      donationData.images = images;
    }

    // Limpieza de campos que no son parte del esquema
    delete donationData.existingImages;

    // Validación: no permitir dejar la donación sin imágenes
    if (typeof donationData.images !== 'undefined' && (!Array.isArray(donationData.images) || donationData.images.length === 0)) {
      return res.status(400).json({ error: 'La donación debe tener al menos una imagen' });
    }

    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      donationData,
      { new: true, runValidators: true }
    );

    if (!donation) {
      return res.status(404).json({ error: 'Donación no encontrada' });
    }
    console.log('✅ Donación actualizada:', donation._id);
    res.json(donation);
  } catch (err) {
    console.error('❌ Error al actualizar donación:', err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH change donation status with validation
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    const validTransitions = {
      available: ['reserved', 'delivered', 'removed'],
      reserved: ['delivered', 'removed'],
      delivered: [],
      removed: []
    };
    if (!validTransitions[donation.status].includes(status)) {
      return res.status(400).json({ error: `Invalid status transition from ${donation.status} to ${status}` });
    }
    donation.status = status;
    await donation.save();

    // Si se marcó como entregada, crear/asegurar transacción en el usuario donante
    if (status === 'delivered') {
      try {
        const donorUser = await User.findById(donation.donor);
        if (donorUser) {
          const txExists = Array.isArray(donorUser.transacciones) && donorUser.transacciones.some(t => {
            // Evitar duplicados por donationId o por productoOfrecidoId
            try {
              return (
                (t.donationId && String(t.donationId) === String(donation._id)) ||
                (t.productoOfrecidoId && String(t.productoOfrecidoId) === String(donation._id))
              );
            } catch (_) { return false; }
          });

          if (!txExists) {
            const nuevaTransaccion = {
              tipo: 'donacion',
              estado: 'completado',
              fecha: new Date().toISOString(),
              productoOfrecido: donation.title,
              productoOfrecidoId: String(donation._id),
              donationId: String(donation._id),
              descripcion: `Donación "${donation.title}" marcada como entregada`
            };
            donorUser.transacciones = donorUser.transacciones || [];
            donorUser.transacciones.push(nuevaTransaccion);
            donorUser.markModified('transacciones');
            await donorUser.save();
          }
        }
      } catch (e) {
        // No bloquear la respuesta por errores al crear la transacción
        console.error('⚠️ Error creando transacción por donación entregada:', e);
      }
    }

    res.json(donation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE donation
router.delete('/:id', async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donation deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST assign donation to request (match)
router.post('/:id/assign/:requestId', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    const request = await DonationRequest.findById(req.params.requestId);
    if (!donation || !request) return res.status(404).json({ error: 'Not found' });
    donation.status = 'reserved';
    request.status = 'assigned';
    await donation.save();
    await request.save();
    const match = new Match({
      donationId: donation._id,
      requestId: request._id,
      donorId: donation.donor,
      requesterId: request.requester,
      status: 'proposed'
    });
    await match.save();
    res.status(201).json(match);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
