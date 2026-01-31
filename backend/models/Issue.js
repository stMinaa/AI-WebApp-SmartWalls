const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['urgent', 'not urgent'], default: 'not urgent' },
  status: { type: String, enum: ['reported', 'forwarded', 'assigned', 'in progress', 'resolved', 'rejected'], default: 'reported' },
  // Track manager and director involvement
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // manager handling the issue
  director: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // director overseeing it
  // Associate company/worker assigned to fix the issue
  assignee: { type: String }, // free-text for quick assignments or company name
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID of assigned associate
  eta: { type: Date }, // estimated visit/repair time set by manager
  etaAckByTenant: { type: Boolean, default: false }, // tenant toggle "I'll be home"
  // Cost agreed when associate accepts the job
  cost: { type: Number },
  // Associate feedback/completion notes
  completionNotes: { type: String },
  completionDate: { type: Date },
  photos: [{ type: String }], // URLs to photos of completed work
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
