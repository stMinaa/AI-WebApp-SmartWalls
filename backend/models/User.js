const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['tenant', 'manager', 'admin', 'director', 'associate'] },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  company: { type: String }, // for associates (repair companies)
  // Associates profile
  specialties: [{ type: String }],
  description: { type: String },
  website: { type: String },
  serviceAreas: [{ type: String }],
  yearsExperience: { type: Number },
  // For tenants
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
  // Claimed during signup (manager must approve before moving to building/apartment)
  requestedBuilding: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  requestedApartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
  status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'active' }, // pending for approval workflows
  // For managers
  managedBuildings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Building' }]
  ,
  // Financial: accumulated debt from accepted issue repair costs
  debt: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
