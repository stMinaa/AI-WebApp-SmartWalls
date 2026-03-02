const AuthorizationError = require('../../domain/exception/AuthorizationError');
const ValidationError = require('../../domain/exception/ValidationError');
const Issue = require('../../domain/model/Issue');
const IssuePermissions = require('../../domain/service/IssuePermissions');

class IssueService {
  constructor(issueRepository, userRepository, invoiceRepository) {
    this.issueRepo = issueRepository;
    this.userRepo = userRepository;
    this.invoiceRepo = invoiceRepository;
  }

  // ===== READ HELPERS (delegate to repos) =====

  async getUserByUsername(username) {
    return this.userRepo.findByUsername(username);
  }

  async findRaw(id) {
    return this.issueRepo.findRawById(id);
  }

  async findPopulated(id) {
    return this.issueRepo.findByIdPopulated(id);
  }

  // ===== ISSUE USE CASES =====

  async reportIssue(username, { title, description, priority }) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new ValidationError('User not found');

    if (!IssuePermissions.canReport(user.role)) {
      throw new AuthorizationError('Only tenants can report issues');
    }

    if (!user.apartment) {
      throw new ValidationError('Tenant is not assigned to an apartment');
    }

    // Fetch apartment to get building (matching original behavior)
    const apartment = await this.userRepo.findApartmentById(user.apartment);
    const building = apartment ? apartment.building : null;

    const issue = new Issue({
      title,
      description,
      priority,
      createdBy: user._id,
      apartment: user.apartment,
      building
    });

    await this.issueRepo.save(issue);
    return issue;
  }

  async listIssues(user, filters) {
    if (!IssuePermissions.canViewAll(user.role)) {
      throw new AuthorizationError('Only managers and directors can view issues');
    }

    return this.issueRepo.findByFilters(filters, user);
  }

  async listMyIssues(user, filters) {
    if (user.role !== 'tenant') {
      throw new AuthorizationError('Only tenants can view their issues');
    }

    return this.issueRepo.findByFilters({ ...filters, createdBy: user._id }, user);
  }

  async triageIssue(issueId, user, { action, assignedTo: assignedToUsername }) {
    if (user.role !== 'manager') {
      throw new AuthorizationError('Only managers can triage issues');
    }

    const issue = await this._findIssueOrThrow(issueId);
    await this._applyTriageAction(issue, user.role, { action, assignedToUsername });

    await this.issueRepo.save(issue);
    return issue;
  }

  async _applyTriageAction(issue, role, { action, assignedToUsername }) {
    if (action === 'forward') {
      issue.transitionTo('forwarded', role);
      return;
    }
    if (action === 'reject') {
      issue.transitionTo('rejected', role);
      return;
    }
    if (action === 'assign' && assignedToUsername) {
      await this._assignToValidAssociate(issue, role, assignedToUsername);
      return;
    }
    throw new ValidationError('Invalid action');
  }

  async _assignToValidAssociate(issue, role, username) {
    const associate = await this.userRepo.findByUsername(username);
    if (!associate || associate.role !== 'associate') {
      throw new ValidationError('Invalid associate');
    }
    issue.transitionTo('assigned', role);
    issue.assignTo(associate._id);
  }

  async assignIssue(issueId, user, associateId) {
    if (user.role !== 'director') {
      throw new AuthorizationError('Only directors can assign issues');
    }

    const issue = await this._findIssueOrThrow(issueId);

    const associate = await this.userRepo.findById(associateId);
    if (!this._isActiveAssociate(associate)) {
      throw new ValidationError('Invalid associate');
    }

    issue.transitionTo('assigned', user.role);
    issue.assignTo(associateId);

    await this.issueRepo.save(issue);
    return issue;
  }

  async rejectIssue(issueId, user) {
    const issue = await this._findIssueOrThrow(issueId);
    issue.transitionTo('rejected', user.role);
    await this.issueRepo.save(issue);
    return issue;
  }

  async acceptIssue(issueId, user, estimatedCost) {
    const issue = await this._findAssociateOwnedIssue(issueId, user, 'accept jobs');
    issue.transitionTo('in-progress', user.role);
    issue.setCost(estimatedCost);
    await this.issueRepo.save(issue);
    return issue;
  }

  async completeIssue(issueId, user, completionNotes) {
    const issue = await this._findAssociateOwnedIssue(issueId, user, 'complete jobs');
    issue.transitionTo('resolved', user.role);
    issue.complete(completionNotes);
    await this.issueRepo.save(issue);
    return issue;
  }

  async rejectByAssociate(issueId, user) {
    const issue = await this._findAssociateOwnedIssue(issueId, user, 'reject jobs');
    issue.transitionTo('forwarded', user.role);
    issue.unassign();
    await this.issueRepo.save(issue);
    return issue;
  }

  async _findAssociateOwnedIssue(issueId, user, action) {
    if (user.role !== 'associate') {
      throw new AuthorizationError(`Only associates can ${action}`);
    }
    const issue = await this._findIssueOrThrow(issueId);
    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      throw new AuthorizationError('This issue is not assigned to you');
    }
    return issue;
  }

  // ===== INVOICE SIDE-EFFECT =====

  async createInvoiceIfNeeded(rawIssue, user, issue) {
    const cost = this._effectiveCost(issue, rawIssue);
    if (!cost || !this.invoiceRepo) return;
    const data = this._buildInvoiceData(rawIssue, user, { id: issue.id, cost });
    try {
      await this.invoiceRepo.create(data);
      console.info(`Invoice created for issue ${issue.id}, Amount: ${cost}`);
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  }

  _buildInvoiceData(rawIssue, user, invoiceInfo) {
    const associateName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    const reason = `Rešavanje kvara: ${rawIssue.description?.substring(0, 100) || 'Servisni rad'}`;
    return {
      company: user.company || 'N/A',
      associate: user._id,
      associateName,
      title: rawIssue.title,
      reason,
      amount: invoiceInfo.cost,
      date: new Date(),
      building: rawIssue.apartment?.building || null,
      issue: invoiceInfo.id,
      paid: false
    };
  }

  _isActiveAssociate(user) {
    return user && user.role === 'associate' && user.status === 'active';
  }

  _effectiveCost(issue, rawIssue) {
    const cost = issue.cost || rawIssue.cost;
    return cost > 0 ? cost : null;
  }

  async _findIssueOrThrow(issueId) {
    const issue = await this.issueRepo.findById(issueId);
    if (!issue) {
      throw new ValidationError('Issue not found');
    }
    return issue;
  }
}

module.exports = IssueService;
