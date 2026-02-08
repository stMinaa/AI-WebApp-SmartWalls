const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: {
    type: String,
    enum: ['tenant', 'manager', 'director', 'associate'],
    default: 'tenant'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending'
  },
  // For tenants
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
  debt: { type: Number, default: 0 }, // Tenant debt in currency
  mobile: { type: String }, // Phone number
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
