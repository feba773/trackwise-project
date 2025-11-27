const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, required: true },
  quantity: { type: Number, required: true }, // Added recently
  location: { type: String, required: true }, // Added recently
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Assigned', 'Completed', 'Cancelled'], default: 'Pending' },
  collector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  qrCodeData: { type: String }, // Added in Phase 6
}, { timestamps: true });

module.exports = mongoose.model('Pickup', PickupSchema);