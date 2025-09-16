import mongoose from 'mongoose';


const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  intercambiado: {
    type: Boolean,
    default: false
  },
  categoria: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  caracteristicas: {
    type: [String],
    validate: {
      validator: function(arr) {
        if (!arr) return true;
        if (arr.length > 15) return false;
        const totalChars = arr.reduce((acc, item) => acc + (item?.length || 0), 0);
        return totalChars <= 1000;
      },
      message: 'Máximo 15 ítems y 1000 caracteres en total en las características.'
    },
    default: undefined // No guardar campo si está vacío
  }
}, {
  timestamps: true
});

// Middleware pre-save para asignar ID automáticamente
productSchema.pre('save', async function(next) {
  if (!this.id) {
    const lastProduct = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    this.id = lastProduct ? lastProduct.id + 1 : 1;
  }
  next();
});

export default mongoose.model('Product', productSchema);