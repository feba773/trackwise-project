const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', verifyToken, upload.single('wasteImage'), async (req, res) => {
  setTimeout(() => {
    const cats = ['Recyclable', 'Organic', 'Hazardous', 'General Waste'];
    res.json({
      category: cats[Math.floor(Math.random() * cats.length)],
      confidence: Math.random() * (0.98 - 0.75) + 0.75,
    });
  }, 1500);
});

module.exports = router;