const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ message: 'Welcome', user });
});
router.get('/collector', verifyToken, (req, res) => res.json({ message: 'Welcome Collector', role: req.user.role }));
router.get('/admin', verifyToken, (req, res) => res.json({ message: 'Welcome Admin', role: req.user.role }));

module.exports = router;