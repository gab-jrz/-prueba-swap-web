import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  de: {
    type: String,
    required: true
  },
  deId: {
    type: String,
    required: true
  },
  paraId: {
    type: String,
    required: true
  },
  paraNombre: {
    type: String,
    required: true
  },
  // Campos para productos (intercambios)
  productoId: String,
  productoTitle: String,
  productoOfrecidoId: Number,
  productoOfrecido: {
    type: String,
    required: true
  },
  // Campos para donaciones
  donacionId: String,
  donacionTitle: String,
  imagenDonacion: String,
  tipoPeticion: {
    type: String,
    enum: ['intercambio', 'donacion', 'mensaje'],
    default: 'intercambio'
  },
  descripcion: {
    type: String,
    required: true
  },
  condiciones: String,
  imagenNombre: String,
  leidoPor: {
    type: [String],
    default: []
  },
  system: {
    type: Boolean,
    default: false
  },
  confirmaciones: {
    type: [String], // IDs de usuarios que confirmaron el intercambio
    default: []
  },
  completed: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema); 