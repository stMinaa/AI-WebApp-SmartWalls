/**
 * Invoice Model
 * Represents invoices/debts from associates/companies for completed work
 */

const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  associateName: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  paid: {
    type: Boolean,
    default: false
  },
  paidDate: {
    type: Date
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building'
  },
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }
}, {
  timestamps: true
});

// Index for faster queries
InvoiceSchema.index({ company: 1, paid: 1 });
InvoiceSchema.index({ associate: 1 });
InvoiceSchema.index({ paid: 1, date: -1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
