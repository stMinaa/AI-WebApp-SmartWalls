const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  authorRole: { type: String },
  content: { type: String, required: true },
  type: { type: String, enum: ['general','service','elevator','delivery'], default: 'general' },
  expiresAt: { type: Date },
  priority: { type: Number, default: 0 }, // higher = more important (pin)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', NoticeSchema);
