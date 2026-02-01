const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['reported', 'forwarded', 'assigned', 'in-progress', 'resolved', 'rejected'], 
    default: 'reported' 
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cost: { type: Number },
  completionNotes: { type: String },
  completionDate: { type: Date },
  photos: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

IssueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', IssueSchema);
