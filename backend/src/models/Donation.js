import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  images: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'Debes subir al menos una imagen de la donación'
    }
  },
  category: { type: String, required: true },
  condition: { type: String },
  location: { type: String },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'reserved', 'delivered', 'removed'], default: 'available' },
  pickupMethod: { type: String },
  characteristics: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Donation', DonationSchema);
