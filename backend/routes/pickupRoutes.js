const express = require('express');
const router = express.Router();
const qrcode = require('qrcode');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

router.post('/request', verifyToken, checkRole(['User']), async (req, res) => {
  const { wasteType, scheduledDate, scheduledTime, quantity, location } = req.body;
  if (!wasteType || !scheduledDate || !scheduledTime || !quantity || !location) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const newPickup = new Pickup({
      user: req.user.id, wasteType, scheduledDate, scheduledTime, quantity, location, status: 'Pending',
    });
    newPickup.qrCodeData = await qrcode.toDataURL(newPickup._id.toString());
    const pickup = await newPickup.save();
    res.status(201).json({ message: 'Pickup requested successfully.', pickup });
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating request.' });
  }
});

router.get('/my-requests', verifyToken, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'User') query = { user: req.user.id };
    else if (req.user.role === 'Collector') query = { collector: req.user.id };
    else return res.status(403).json({ message: 'Access denied.' });
    
    const pickups = await Pickup.find(query).populate('user', 'email location').sort({ createdAt: -1 });
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/pending', verifyToken, checkRole(['Collector']), async (req, res) => {
  try {
    const jobs = await Pickup.find({ status: 'Pending', collector: null }).populate('user', 'email').sort({ scheduledDate: 1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/claim/:pickupId', verifyToken, checkRole(['Collector']), async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.pickupId);
    if (!pickup) return res.status(404).json({ message: 'Not found.' });
    if (pickup.status !== 'Pending' || pickup.collector) return res.status(400).json({ message: 'Job unavailable.' });
    
    pickup.collector = req.user.id;
    pickup.status = 'Assigned';
    await pickup.save();
    res.json({ message: 'Job claimed successfully.', pickup });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/all', verifyToken, checkRole(['Admin']), async (req, res) => {
  try {
    const pickups = await Pickup.find().populate('user', 'email').populate('collector', 'email').sort({ createdAt: -1 });
    res.json(pickups);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/assign/:pickupId', verifyToken, checkRole(['Admin']), async (req, res) => {
  const { collectorId } = req.body;
  try {
    const pickup = await Pickup.findById(req.params.pickupId);
    if (!pickup) return res.status(404).json({ message: 'Not found.' });
    pickup.collector = collectorId;
    pickup.status = 'Assigned';
    await pickup.save();
    res.json({ message: 'Collector manually assigned.', pickup });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.put('/verify/:pickupId', verifyToken, checkRole(['Collector']), async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.pickupId);
    if (!pickup) return res.status(404).json({ message: 'Not found.' });
    if (pickup.status !== 'Assigned') return res.status(400).json({ message: 'Cannot verify.' });
    if (pickup.collector.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden.' });

    pickup.status = 'Completed';
    await pickup.save();
    
    const user = await User.findById(pickup.user);
    if (user) { user.rewardPoints = (user.rewardPoints || 0) + 10; await user.save(); }
    
    res.json({ message: 'Verified! +10 points awarded.', pickup });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;