import express from 'express';
import Swap from '../models/Swap.js';
const router = express.Router();

// Get all swaps
router.get('/', async (req, res) => {
  try {
    const swaps = await Swap.find()
      .populate('itemOffered')
      .populate('itemRequested')
      .populate('offerUser', 'name email')
      .populate('requestUser', 'name email');
    res.json(swaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one swap
router.get('/:id', async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id)
      .populate('itemOffered')
      .populate('itemRequested')
      .populate('offerUser', 'name email')
      .populate('requestUser', 'name email');
    if (!swap) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }
    res.json(swap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create swap
router.post('/', async (req, res) => {
  const swap = new Swap({
    itemOffered: req.body.itemOffered,
    itemRequested: req.body.itemRequested,
    offerUser: req.body.offerUser,
    requestUser: req.body.requestUser,
    status: 'pendiente'
  });

  try {
    const newSwap = await swap.save();
    res.status(201).json(newSwap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update swap status
router.put('/:id', async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }

    swap.status = req.body.status;
    const updatedSwap = await swap.save();
    res.json(updatedSwap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete swap
router.delete('/:id', async (req, res) => {
  try {
    const swap = await Swap.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ message: 'Intercambio no encontrado' });
    }
    await swap.deleteOne();
    res.json({ message: 'Intercambio eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 