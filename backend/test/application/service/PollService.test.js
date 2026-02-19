/* eslint-disable max-nested-callbacks */
'use strict';

const PollService = require('../../../src/application/service/PollService');
const ValidationError = require('../../../src/domain/exception/ValidationError');

function makeRepo(overrides = {}) {
  return {
    findById: jest.fn(),
    findByIdPopulated: jest.fn(),
    save: jest.fn(),
    ...overrides
  };
}

describe('PollService', () => {
  let repo;
  let service;

  beforeEach(() => {
    repo = makeRepo();
    service = new PollService(repo);
  });

  describe('vote', () => {
    it('throws ValidationError when option is missing', async () => {
      await expect(service.vote('pollId', 'userId', undefined)).rejects.toThrow(ValidationError);
    });

    it('throws 404 when poll not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.vote('pollId', 'userId', 'optionA')).rejects.toMatchObject({
        status: 404
      });
    });

    it('throws ValidationError when user already voted', async () => {
      const userId = '507f1f77bcf86cd799439011';
      repo.findById.mockResolvedValue({
        votes: [{ voter: { toString: () => userId } }],
        save: jest.fn()
      });
      await expect(service.vote('pollId', userId, 'optionA')).rejects.toThrow(ValidationError);
    });

    it('records vote and returns populated poll', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const poll = {
        _id: 'pollId',
        votes: [],
        save: jest.fn()
      };
      repo.findById.mockResolvedValue(poll);
      const populated = { _id: 'pollId', votes: [{ option: 'optionA', voter: userId }] };
      repo.findByIdPopulated.mockResolvedValue(populated);

      const result = await service.vote('pollId', userId, 'optionA');
      expect(poll.votes).toHaveLength(1);
      expect(poll.votes[0]).toEqual({ option: 'optionA', voter: userId });
      expect(poll.save).toHaveBeenCalled();
      expect(result).toBe(populated);
    });
  });

  describe('close', () => {
    it('throws 404 when poll not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.close('pollId')).rejects.toMatchObject({ status: 404 });
    });

    it('sets closedAt and returns populated poll', async () => {
      const poll = { _id: 'pollId', closedAt: null, save: jest.fn() };
      repo.findById.mockResolvedValue(poll);
      const populated = { _id: 'pollId', closedAt: new Date() };
      repo.findByIdPopulated.mockResolvedValue(populated);

      const result = await service.close('pollId');
      expect(poll.closedAt).toBeDefined();
      expect(poll.save).toHaveBeenCalled();
      expect(result).toBe(populated);
    });
  });
});
