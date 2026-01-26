const mongoose = require('mongoose');

const NoticeReadSchema = new mongoose.Schema({
  notice: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now }
});

NoticeReadSchema.index({ notice: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('NoticeRead', NoticeReadSchema);
