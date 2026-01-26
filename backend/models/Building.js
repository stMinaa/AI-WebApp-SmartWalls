const mongoose = require('mongoose');

const BuildingSchema = new mongoose.Schema({
  name: { type: String, required: false, trim: true },
  address: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true }, // optional image URL for building card
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  director: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Building', BuildingSchema);
