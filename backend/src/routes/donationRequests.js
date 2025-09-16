import express from 'express';
import mongoose from 'mongoose';
import DonationRequest from '../models/DonationRequest.js';
import upload from '../middleware/multerRequests.js';
// import auth from '../middleware/auth.js'; // Descomenta si usas autenticación

const router = express.Router();

// GET all donation requests (con filtro opcional por solicitante)
router.get('/', async (req, res) => {
  try {
    const { requester } = req.query;
    let filter = {};
    
    if (requester) {
      filter.requester = requester;
      console.log('🔍 Filtrando solicitudes por solicitante:', requester);
    }
    
    const requests = await DonationRequest.find(filter).sort({ createdAt: -1 });
    console.log('🆘 Solicitudes encontradas:', requests.length);
    res.json(requests);
  } catch (err) {
    console.error('❌ Error al obtener solicitudes:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single donation request by ID
router.get('/:id', async (req, res) => {
  try {
    const request = await DonationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    console.log('🔍 Solicitud encontrada:', request._id);
    res.json(request);
  } catch (err) {
    console.error('❌ Error al obtener solicitud:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create donation request
router.post('/', upload.array('attachments', 3), async (req, res) => {
  console.log('🚀 ===== INICIO DE NUEVA SOLICITUD DE AYUDA =====');
  console.log('📥 POST /api/donation-requests');
  console.log('🔍 Headers:', req.headers);
  console.log('📝 Body original:', req.body);
  console.log('📁 Archivos:', req.files ? req.files.length : 0);
  console.log('=================================================');
  
  try {
    console.log('📝 Datos recibidos:', req.body);
    console.log('📁 Archivos recibidos:', req.files);
    
    const requestData = { ...req.body };
    
    // Validar y convertir requester a ObjectId si es necesario
    if (requestData.requester) {
      console.log('🔍 Requester original:', requestData.requester, 'Tipo:', typeof requestData.requester);
      
      // Si no es un ObjectId válido, intentar convertirlo
      if (!mongoose.Types.ObjectId.isValid(requestData.requester)) {
        console.log('❌ Requester no es un ObjectId válido:', requestData.requester);
        return res.status(400).json({ 
          error: 'ID de usuario inválido',
          details: `El valor "${requestData.requester}" no es un ID de usuario válido`
        });
      }
      
      requestData.requester = new mongoose.Types.ObjectId(requestData.requester);
      console.log('✅ Requester convertido a ObjectId:', requestData.requester);
    } else {
      return res.status(400).json({ 
        error: 'Usuario requerido',
        details: 'El campo requester es obligatorio'
      });
    }
    
    // Procesar archivos adjuntos si los hay
    if (req.files && req.files.length > 0) {
      requestData.attachments = req.files.map(file => file.filename);
      console.log('📎 Archivos procesados:', requestData.attachments);
    }
    
    // Procesar specificNeeds si existe
    if (req.body.specificNeeds) {
      try {
        requestData.specificNeeds = JSON.parse(req.body.specificNeeds);
        console.log('🎯 Necesidades específicas:', requestData.specificNeeds);
      } catch (e) {
        console.error('❌ Error parsing specificNeeds:', e);
        // No es crítico, continuar sin specificNeeds
        delete requestData.specificNeeds;
      }
    }
    
    console.log('💾 Datos finales a guardar:', requestData);
    
    const request = new DonationRequest(requestData);
    const savedRequest = await request.save();
    
    console.log('✅ Solicitud guardada:', savedRequest._id);
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error('❌ Error completo:', err);
    console.error('❌ Stack trace:', err.stack);
    res.status(400).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// PATCH update donation request
router.patch('/:id', async (req, res) => {
  try {
    const request = await DonationRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update donation request (full update for edit forms)
router.put('/:id', async (req, res) => {
  try {
    const request = await DonationRequest.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true 
    });
    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }
    console.log('✅ Solicitud actualizada:', request._id);
    res.json(request);
  } catch (err) {
    console.error('❌ Error al actualizar solicitud:', err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH change request status with validation
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const request = await DonationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    const validTransitions = {
      open: ['assigned', 'closed'],
      assigned: ['closed'],
      closed: []
    };
    if (!validTransitions[request.status].includes(status)) {
      return res.status(400).json({ error: `Invalid status transition from ${request.status} to ${status}` });
    }
    request.status = status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE donation request
router.delete('/:id', async (req, res) => {
  try {
    await DonationRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donation request deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
