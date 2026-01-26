const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['urgent', 'not urgent'], default: 'not urgent' },
  status: { type: String, enum: ['reported', 'forwarded', 'assigned', 'in progress', 'resolved', 'rejected'], default: 'reported' },
  assignee: { type: String }, // free-text for quick assignments or company name
  eta: { type: Date }, // estimated visit/repair time set by manager
  etaAckByTenant: { type: Boolean, default: false }, // tenant toggle "I'll be home"
  // Cost agreed when associate accepts the job
  cost: { type: Number },
  history: [
    {
      by: { type: String },
      action: { type: String },
      note: { type: String },
      at: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

IssueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', IssueSchema);
