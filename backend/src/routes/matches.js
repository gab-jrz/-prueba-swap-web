import express from 'express';
import Match from '../models/Match.js';
import Donation from '../models/Donation.js';
import DonationRequest from '../models/DonationRequest.js';
// import auth from '../middleware/auth.js'; // Descomenta si usas autenticación

const router = express.Router();

// POST complete match (confirm delivery)
router.post('/:id/complete', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    match.status = 'completed';
    await match.save();
    // Update donation and request status
    await Donation.findByIdAndUpdate(match.donationId, { status: 'delivered' });
    await DonationRequest.findByIdAndUpdate(match.requestId, { status: 'closed' });
    res.json({ message: 'Match completed and items delivered.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
