const AuthorizationError = require('../../domain/exception/AuthorizationError');
const ValidationError = require('../../domain/exception/ValidationError');
const Issue = require('../../domain/model/Issue');
const IssuePermissions = require('../../domain/service/IssuePermissions');

class IssueService {
  constructor(issueRepository, userRepository) {
    this.issueRepo = issueRepository;
    this.userRepo = userRepository;
  }

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

    if (action === 'forward') {
      issue.transitionTo('forwarded', user.role);
    } else if (action === 'reject') {
      issue.transitionTo('rejected', user.role);
    } else if (action === 'assign' && assignedToUsername) {
      const associate = await this.userRepo.findByUsername(assignedToUsername);
      if (!associate || associate.role !== 'associate') {
        throw new ValidationError('Invalid associate');
      }
      issue.transitionTo('assigned', user.role);
      issue.assignTo(associate._id);
    } else {
      throw new ValidationError('Invalid action');
    }

    await this.issueRepo.save(issue);
    return issue;
  }

  async assignIssue(issueId, user, associateId) {
    if (user.role !== 'director') {
      throw new AuthorizationError('Only directors can assign issues');
    }

    const issue = await this._findIssueOrThrow(issueId);

    const associate = await this.userRepo.findById(associateId);
    if (!associate || associate.role !== 'associate' || associate.status !== 'active') {
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
    if (user.role !== 'associate') {
      throw new AuthorizationError('Only associates can accept jobs');
    }

    const issue = await this._findIssueOrThrow(issueId);

    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      throw new AuthorizationError('This issue is not assigned to you');
    }

    issue.transitionTo('in-progress', user.role);
    issue.setCost(estimatedCost);

    await this.issueRepo.save(issue);
    return issue;
  }

  async completeIssue(issueId, user, completionNotes) {
    if (user.role !== 'associate') {
      throw new AuthorizationError('Only associates can complete jobs');
    }

    const issue = await this._findIssueOrThrow(issueId);

    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      throw new AuthorizationError('This issue is not assigned to you');
    }

    issue.transitionTo('resolved', user.role);
    issue.complete(completionNotes);

    await this.issueRepo.save(issue);
    return issue;
  }

  async rejectByAssociate(issueId, user) {
    if (user.role !== 'associate') {
      throw new AuthorizationError('Only associates can reject jobs');
    }

    const issue = await this._findIssueOrThrow(issueId);

    if (!issue.assignedTo || issue.assignedTo.toString() !== user._id.toString()) {
      throw new AuthorizationError('This issue is not assigned to you');
    }

    issue.transitionTo('forwarded', user.role);
    issue.unassign();

    await this.issueRepo.save(issue);
    return issue;
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
