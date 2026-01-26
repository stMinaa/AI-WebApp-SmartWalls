const mongoose = require('mongoose');

const PollSchema = new mongoose.Schema({
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // array of option labels
  votes: [
    {
      option: { type: String, required: true }, // which option was voted for
      voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    }
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // manager who created poll
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date } // optional: when poll closes
});

module.exports = mongoose.model('Poll', PollSchema);
