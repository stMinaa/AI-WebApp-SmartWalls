const mongoose = require('mongoose');

const ApartmentSchema = new mongoose.Schema({
  building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  unitNumber: { type: String, required: true },
  address: { type: String }, // full address or inherit from building
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // primary tenant
  numPeople: { type: Number, min: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apartment', ApartmentSchema);
