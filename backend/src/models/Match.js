import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'DonationRequest', required: true },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['proposed', 'accepted', 'completed', 'cancelled'], default: 'proposed' },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Match', MatchSchema);
