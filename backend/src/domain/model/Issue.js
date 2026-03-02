const AuthorizationError = require('../exception/AuthorizationError');
const ValidationError = require('../exception/ValidationError');

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TRANSITIONS = {
  reported: ['forwarded', 'rejected', 'assigned'],
  forwarded: ['assigned', 'rejected'],
  assigned: ['in-progress', 'forwarded', 'rejected'],
  'in-progress': ['resolved', 'rejected'],
  resolved: [],
  rejected: []
};

const TRANSITION_ROLES = {
  'reported->forwarded': ['manager', 'director'],
  'reported->rejected': ['manager', 'director'],
  'reported->assigned': ['manager'],
  'forwarded->assigned': ['director', 'manager'],
  'forwarded->rejected': ['director', 'manager'],
  'assigned->in-progress': ['associate'],
  'assigned->forwarded': ['associate'],
  'assigned->rejected': ['associate'],
  'in-progress->resolved': ['associate'],
  'in-progress->rejected': ['associate']
};

class Issue {
  constructor(props) {
    Issue._validateInput(props);
    this._initNewIssue(props);
  }

  static _validateInput({ title, description, priority }) {
    Issue._requireField(title, 'Title');
    Issue._requireField(description, 'Description');
    if (priority) Issue._validatePriority(priority);
  }

  static _requireField(value, name) {
    if (!value || !value.trim()) throw new ValidationError(`${name} is required`);
  }

  static _validatePriority(priority) {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }
  }

  _initNewIssue({ title, description, priority, createdBy, apartment, building }) {
    this.id = null;
    this.title = title.trim();
    this.description = description.trim();
    this.priority = priority || 'medium';
    this.status = 'reported';
    this.createdBy = createdBy || null;
    this.apartment = apartment || null;
    this.building = building || null;
    this._resetMutableFields();
  }

  _resetMutableFields() {
    this.assignedTo = null;
    this.cost = null;
    this.completionNotes = undefined;
    this.completionDate = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static restore(data) {
    const issue = Object.create(Issue.prototype);
    issue._restoreIdentity(data);
    issue._restoreDetails(data);
    return issue;
  }

  _restoreIdentity(data) {
    this.id = data.id || data._id || null;
    this.title = data.title;
    this.description = data.description;
    this.priority = data.priority || 'medium';
    this.status = data.status || 'reported';
    this.createdBy = data.createdBy || null;
    this.apartment = data.apartment || null;
    this.building = data.building || null;
  }

  _restoreDetails(data) {
    this.assignedTo = data.assignedTo || null;
    this.cost = data.cost != null ? data.cost : null;
    this.completionNotes = data.completionNotes;
    this.completionDate = data.completionDate || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  canTransitionTo(newStatus, role) {
    const allowed = VALID_TRANSITIONS[this.status];
    if (!allowed || !allowed.includes(newStatus)) return false;
    const key = `${this.status}->${newStatus}`;
    const allowedRoles = TRANSITION_ROLES[key];
    return allowedRoles ? allowedRoles.includes(role) : false;
  }

  transitionTo(newStatus, role) {
    const allowed = VALID_TRANSITIONS[this.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from '${this.status}' to '${newStatus}'`);
    }
    const key = `${this.status}->${newStatus}`;
    const allowedRoles = TRANSITION_ROLES[key];
    if (!allowedRoles || !allowedRoles.includes(role)) {
      throw new AuthorizationError(
        `Role '${role}' cannot transition issue from '${this.status}' to '${newStatus}'`
      );
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  setCost(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError('Cost must be a valid number');
    }
    if (amount < 0) {
      throw new ValidationError('Cost must be a positive number');
    }
    this.cost = amount;
    this.updatedAt = new Date();
  }

  complete(notes) {
    this.completionDate = new Date();
    if (notes) {
      this.completionNotes = notes;
    }
    this.updatedAt = new Date();
  }

  assignTo(userId) {
    this.assignedTo = userId;
    this.updatedAt = new Date();
  }

  unassign() {
    this.assignedTo = null;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      status: this.status,
      createdBy: this.createdBy,
      apartment: this.apartment,
      building: this.building,
      assignedTo: this.assignedTo,
      cost: this.cost,
      completionNotes: this.completionNotes,
      completionDate: this.completionDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Issue;
