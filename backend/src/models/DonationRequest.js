import mongoose from 'mongoose';

const DonationRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  title: { type: String },
  needDescription: { type: String, required: true },
  specificNeeds: [{ type: String }], // Array de especificaciones específicas
  location: { type: String },
  urgency: { type: String, enum: ['low', 'med', 'high'], default: 'med' },
  status: { type: String, enum: ['open', 'assigned', 'closed'], default: 'open' },
  attachments: [{ type: String }],
  privacy: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('DonationRequest', DonationRequestSchema);
