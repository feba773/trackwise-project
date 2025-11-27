const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Pickup = require('../models/Pickup');

router.use(verifyToken, checkRole(['Admin']));

router.get('/stats', async (req, res) => {
  try {
    const [u, p, pen, com] = await Promise.all([
      User.countDocuments(), Pickup.countDocuments(),
      Pickup.countDocuments({ status: 'Pending' }), Pickup.countDocuments({ status: 'Completed' })
    ]);
    res.json({ totalUsers: u, totalPickups: p, pendingPickups: pen, completedPickups: com });
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/users', async (req, res) => {
  try { const users = await User.find().select('-password').sort({ createdAt: -1 }); res.json(users); }
  catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/collectors', async (req, res) => {
  try { const c = await User.find({ role: 'Collector' }).select('email'); res.json(c); }
  catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;