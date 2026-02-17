/* eslint-disable max-nested-callbacks, max-lines */
const IssueService = require('../../../src/application/service/IssueService');
const AuthorizationError = require('../../../src/domain/exception/AuthorizationError');
const ValidationError = require('../../../src/domain/exception/ValidationError');
const Issue = require('../../../src/domain/model/Issue');

describe('Application - IssueService', () => {
  let service;
  let mockIssueRepo;
  let mockUserRepo;

  beforeEach(() => {
    mockIssueRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByFilters: jest.fn()
    };
    mockUserRepo = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findApartmentById: jest.fn()
    };
    service = new IssueService(mockIssueRepo, mockUserRepo);
  });

  describe('reportIssue', () => {
    it('should create issue with reported status', async () => {
      mockUserRepo.findByUsername.mockResolvedValue({
        _id: 'user1',
        role: 'tenant',
        apartment: 'apt1'
      });
      mockUserRepo.findApartmentById.mockResolvedValue({
        _id: 'apt1',
        building: 'bld1'
      });
      mockIssueRepo.save.mockImplementation((issue) => {
        issue.id = 'issue1';
        return Promise.resolve(issue);
      });

      const result = await service.reportIssue('tenant1', {
        title: 'Water leak',
        description: 'Pipe broken',
        priority: 'high'
      });

      expect(result.title).toBe('Water leak');
      expect(result.status).toBe('reported');
      expect(mockIssueRepo.save).toHaveBeenCalled();
    });

    it('should reject if user is not tenant', async () => {
      mockUserRepo.findByUsername.mockResolvedValue({
        _id: 'user1',
        role: 'manager'
      });

      await expect(
        service.reportIssue('manager1', {
          title: 'Test',
          description: 'desc'
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should reject if tenant has no apartment', async () => {
      mockUserRepo.findByUsername.mockResolvedValue({
        _id: 'user1',
        role: 'tenant',
        apartment: null
      });

      await expect(
        service.reportIssue('tenant1', {
          title: 'Test',
          description: 'desc'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should reject if user not found', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null);

      await expect(
        service.reportIssue('nobody', {
          title: 'Test',
          description: 'desc'
        })
      ).rejects.toThrow('User not found');
    });
  });

  describe('listIssues', () => {
    it('should return all issues for director', async () => {
      const issues = [
        Issue.restore({ id: '1', title: 'A', description: 'd', status: 'reported' }),
        Issue.restore({ id: '2', title: 'B', description: 'd', status: 'forwarded' })
      ];
      mockIssueRepo.findByFilters.mockResolvedValue(issues);

      const result = await service.listIssues({ role: 'director', _id: 'dir1' }, {});

      expect(result).toHaveLength(2);
      expect(mockIssueRepo.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({}),
        expect.objectContaining({ role: 'director' })
      );
    });

    it('should reject if user is tenant', async () => {
      await expect(service.listIssues({ role: 'tenant', _id: 't1' }, {})).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe('listMyIssues', () => {
    it('should return tenant own issues', async () => {
      const issues = [Issue.restore({ id: '1', title: 'A', description: 'd', createdBy: 'u1' })];
      mockIssueRepo.findByFilters.mockResolvedValue(issues);

      const result = await service.listMyIssues({ role: 'tenant', _id: 'u1' }, {});

      expect(result).toHaveLength(1);
    });

    it('should reject if user is not tenant', async () => {
      await expect(service.listMyIssues({ role: 'manager', _id: 'm1' }, {})).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe('triageIssue', () => {
    it('should forward issue when manager sends forward action', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'reported'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.triageIssue(
        'i1',
        { role: 'manager', _id: 'm1' },
        { action: 'forward' }
      );

      expect(result.status).toBe('forwarded');
      expect(mockIssueRepo.save).toHaveBeenCalled();
    });

    it('should reject issue when manager sends reject action', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'reported'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.triageIssue(
        'i1',
        { role: 'manager', _id: 'm1' },
        { action: 'reject' }
      );

      expect(result.status).toBe('rejected');
    });

    it('should assign issue when manager sends assign action with associate', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'reported'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);
      mockUserRepo.findByUsername.mockResolvedValue({
        _id: 'assoc1',
        role: 'associate',
        status: 'active'
      });

      const result = await service.triageIssue(
        'i1',
        { role: 'manager', _id: 'm1' },
        { action: 'assign', assignedTo: 'assoc_user' }
      );

      expect(result.status).toBe('assigned');
      expect(result.assignedTo).toBe('assoc1');
    });

    it('should reject if user is not manager', async () => {
      await expect(
        service.triageIssue('i1', { role: 'tenant', _id: 't1' }, { action: 'forward' })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should throw if issue not found', async () => {
      mockIssueRepo.findById.mockResolvedValue(null);

      await expect(
        service.triageIssue('bad', { role: 'manager', _id: 'm1' }, 'forward')
      ).rejects.toThrow('Issue not found');
    });
  });

  describe('assignIssue', () => {
    it('should assign forwarded issue by director', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'forwarded'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);
      mockUserRepo.findById.mockResolvedValue({
        _id: 'assoc1',
        role: 'associate',
        status: 'active'
      });

      const result = await service.assignIssue('i1', { role: 'director', _id: 'd1' }, 'assoc1');

      expect(result.status).toBe('assigned');
      expect(result.assignedTo).toBe('assoc1');
    });

    it('should reject issue by director', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'forwarded'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.rejectIssue('i1', { role: 'director', _id: 'd1' });

      expect(result.status).toBe('rejected');
    });

    it('should reject if user is not director', async () => {
      await expect(
        service.assignIssue('i1', { role: 'manager', _id: 'm1' }, 'assoc1')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should reject if associate not valid', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'forwarded'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockUserRepo.findById.mockResolvedValue({
        _id: 'u1',
        role: 'tenant',
        status: 'active'
      });

      await expect(
        service.assignIssue('i1', { role: 'director', _id: 'd1' }, 'u1')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('acceptIssue', () => {
    it('should accept assigned issue with cost', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'assigned',
        assignedTo: 'a1'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.acceptIssue('i1', { role: 'associate', _id: 'a1' }, 500);

      expect(result.status).toBe('in-progress');
      expect(result.cost).toBe(500);
    });

    it('should reject if not assigned to this associate', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'assigned',
        assignedTo: 'other'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);

      await expect(
        service.acceptIssue('i1', { role: 'associate', _id: 'a1' }, 500)
      ).rejects.toThrow(AuthorizationError);
    });

    it('should reject if not associate role', async () => {
      await expect(service.acceptIssue('i1', { role: 'manager', _id: 'm1' }, 500)).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe('completeIssue', () => {
    it('should complete in-progress issue', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'in-progress',
        assignedTo: 'a1',
        cost: 500
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.completeIssue(
        'i1',
        { role: 'associate', _id: 'a1' },
        'Fixed it'
      );

      expect(result.status).toBe('resolved');
      expect(result.completionNotes).toBe('Fixed it');
      expect(result.completionDate).toBeInstanceOf(Date);
    });

    it('should reject if issue not in-progress', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'assigned',
        assignedTo: 'a1'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);

      await expect(service.completeIssue('i1', { role: 'associate', _id: 'a1' })).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('rejectByAssociate', () => {
    it('should reject assigned issue and return to forwarded', async () => {
      const issue = Issue.restore({
        id: 'i1',
        title: 'T',
        description: 'd',
        status: 'assigned',
        assignedTo: 'a1'
      });
      mockIssueRepo.findById.mockResolvedValue(issue);
      mockIssueRepo.save.mockResolvedValue(issue);

      const result = await service.rejectByAssociate('i1', { role: 'associate', _id: 'a1' });

      expect(result.status).toBe('forwarded');
      expect(result.assignedTo).toBeNull();
    });
  });
});
