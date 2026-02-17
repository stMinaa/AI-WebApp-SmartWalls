const ValidationError = require('../exception/ValidationError');

class Building {
  constructor({ name, address, imageUrl, director }) {
    if (!address || !address.trim()) {
      throw new ValidationError('Address is required');
    }

    this.id = null;
    this.name = (name || '').trim();
    this.address = address.trim();
    this.imageUrl = (imageUrl || '').trim();
    this.director = director || null;
    this.manager = null;
    this.createdAt = new Date();
  }

  static restore(data) {
    const building = Object.create(Building.prototype);
    building.id = data.id || data._id || null;
    building.name = data.name || '';
    building.address = data.address;
    building.imageUrl = data.imageUrl || '';
    building.director = data.director || null;
    building.manager = data.manager || null;
    building.createdAt = data.createdAt || new Date();
    return building;
  }

  assignManager(managerId) {
    this.manager = managerId || null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      imageUrl: this.imageUrl,
      director: this.director,
      manager: this.manager,
      createdAt: this.createdAt
    };
  }
}

module.exports = Building;
