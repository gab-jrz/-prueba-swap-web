import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  username: {
    type: String,
    default: function() {
      return this.nombre.toLowerCase() + this.apellido.toLowerCase();
    }
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  imagen: {
    type: String
  },
  calificacion: {
    type: Number,
    default: 1
  },
  productos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  mensajes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  transacciones: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }, // cada transacción puede tener { ..., deleted: Boolean }

  mostrarContacto: {
    type: Boolean,
    default: true
  },
  calificaciones: [{
    deId: String,
    deNombre: String,
    rating: { type: Number, min:1, max:5 },
    fecha: { type: Date, default: Date.now },
    comentario: { type: String, default: '' },
    transaccionId: String,
    productoSolicitado: String,
    productoOfrecido: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  zona: {
    type: String,
    default: "Buenos Aires"
  },
  telefono: {
    type: String,
    default: "011-555-46522"
  },
  ubicacion: {
    type: String,
    default: "Buenos Aires"
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  // Configuraciones de notificaciones
  notificaciones: {
    intercambios: {
      propuestas: { type: Boolean, default: true },
      cambiosEstado: { type: Boolean, default: true }
    },
    donaciones: {
      solicitudes: { type: Boolean, default: true },
      cambiosEstado: { type: Boolean, default: true }
    },
    mensajes: {
      directos: { type: Boolean, default: true },
      intercambio: { type: Boolean, default: true }
    },
    calificaciones: { type: Boolean, default: true },
    recordatorios: { type: Boolean, default: true }
  },
  donacionesCount: { type: Number, default: 0 },
  favoritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;